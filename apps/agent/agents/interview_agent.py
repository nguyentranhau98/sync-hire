"""
SyncHire Interview Agent

AI interviewer agent implementation using Vision-Agents framework.
Handles joining calls, conducting interviews, and managing interview lifecycle.
"""

import asyncio
import httpx
import logging
from typing import List
from datetime import datetime, timezone

# Vision-Agents imports
from vision_agents.core.edge.types import User
from vision_agents.core.agents import Agent
from vision_agents.plugins import getstream, openai, gemini, heygen, deepgram
from vision_agents.plugins.heygen import VideoQuality

# Custom processors
from processors.interview_completion_processor import InterviewCompletionProcessor

# Configuration
from config import Config

logger = logging.getLogger(__name__)


def get_llm():
    """Get the appropriate LLM for text-based processing.
    Uses text API (not realtime) since Deepgram handles STT separately.
    Prioritizes Gemini if API key is set, falls back to OpenAI."""
    if Config.GEMINI_API_KEY:
        logger.info("🤖 Using Gemini for text-based LLM")
        return gemini.LLM("gemini-2.5-flash")
    elif Config.OPENAI_API_KEY:
        logger.info("🤖 Using OpenAI for text-based LLM")
        return openai.Realtime()
    else:
        raise ValueError("No API keys configured. Set GEMINI_API_KEY or OPENAI_API_KEY")


def get_stt():
    """Get Deepgram STT instance for speech-to-text processing.

    Returns:
        deepgram.STT: Configured Deepgram STT instance
    """
    logger.info("🎤 Configuring Deepgram STT")
    logger.info(f"   Sample Rate: {Config.DEEPGRAM_SAMPLE_RATE}Hz")
    logger.info(f"   Language: {Config.DEEPGRAM_LANGUAGE}")

    return deepgram.STT(
        api_key=Config.DEEPGRAM_API_KEY,
        # sample_rate=Config.DEEPGRAM_SAMPLE_RATE,
        # language=Config.DEEPGRAM_LANGUAGE
    )


def get_avatar_publisher():
    """Get HeyGen avatar publisher if configured, otherwise return None.

    Note: This creates a wrapper class to add the required 'name' attribute
    that Vision-Agents framework expects from processors.
    """
    if not Config.HEYGEN_API_KEY:
        logger.info("⚠️  HeyGen not configured - agent will be audio-only")
        return None

    # Map quality string to VideoQuality enum
    quality_str = Config.HEYGEN_VIDEO_QUALITY.upper()
    quality_map = {
        "LOW": VideoQuality.LOW,
        "MEDIUM": VideoQuality.MEDIUM,
        "HIGH": VideoQuality.HIGH,
    }
    quality = quality_map.get(quality_str, VideoQuality.LOW)

    logger.info(f"🎭 Configuring HeyGen avatar: {Config.HEYGEN_AVATAR_ID} (Quality: {quality_str})")

    try:
        # Create avatar publisher
        publisher = heygen.AvatarPublisher(
            avatar_id=Config.HEYGEN_AVATAR_ID,
            quality=quality,
            resolution=(1920, 1080),
            api_key=Config.HEYGEN_API_KEY,
            mute_llm_audio=False
        )

        # Add 'name' attribute required by Vision-Agents framework
        # This is a workaround for missing attribute in HeyGen plugin
        if not hasattr(publisher, 'name'):
            publisher.name = "heygen_avatar"
            logger.debug("Added 'name' attribute to AvatarPublisher")

        return publisher

    except RuntimeError as e:
        error_msg = str(e)

        # Check for specific HeyGen API errors
        if "Concurrent limit reached" in error_msg:
            logger.error("❌ HeyGen Error: Concurrent session limit reached")
            logger.error("   Your HeyGen plan only allows limited concurrent sessions.")
            logger.error("   Either upgrade your HeyGen plan or wait for other sessions to end.")
            logger.info("⚠️  Continuing without avatar - agent will be audio-only")
        elif "400" in error_msg or "401" in error_msg or "403" in error_msg:
            logger.error(f"❌ HeyGen API Error: {error_msg}")
            logger.error("   Check your HEYGEN_API_KEY and avatar permissions")
            logger.info("⚠️  Continuing without avatar - agent will be audio-only")
        else:
            logger.error(f"❌ HeyGen Error: {error_msg}")
            logger.info("⚠️  Continuing without avatar - agent will be audio-only")

        return None

    except Exception as e:
        logger.error(f"❌ Unexpected error initializing HeyGen avatar: {type(e).__name__}: {e}")
        logger.info("⚠️  Continuing without avatar - agent will be audio-only")
        return None


class InterviewAgent:
    """AI Interviewer Agent using Vision-Agents framework"""

    def __init__(self):
        self.current_interview = None
        self.nextjs_webhook_url = Config.NEXTJS_WEBHOOK_URL

    def validate_configuration(self) -> bool:
        """Validate that required API keys are configured.

        Returns:
            bool: True if API keys are properly configured, False otherwise
        """
        return bool(
            Config.STREAM_API_KEY
            and Config.DEEPGRAM_API_KEY
            and (Config.GEMINI_API_KEY or Config.OPENAI_API_KEY)
        )

    def _load_instructions(self) -> str:
        """Load agent instructions from Markdown file"""
        instructions_path = "interview_instructions.md"

        try:
            with open(instructions_path, "r") as f:
                instructions = f.read()
            logger.info(f"📄 Loaded instructions from {instructions_path}")
            return instructions
        except FileNotFoundError:
            logger.warning(f"⚠️  {instructions_path} not found, using default")
            return self._default_instructions()

    def _default_instructions(self) -> str:
        """Fallback instructions if file not found"""
        return """
                You are a professional AI interviewer for SyncHire.

                Your role:
                1. Greet the candidate warmly and professionally
                2. Ask interview questions one at a time
                3. Listen carefully to their responses
                4. Ask 1-2 follow-up questions for clarification
                5. Be supportive and encouraging
                6. Maintain a conversational, natural tone
                7. After 8-10 questions, thank the candidate and end the interview

                Guidelines:
                - Speak clearly and at a moderate pace
                - Allow 2-3 minutes per question
                - Don't interrupt the candidate
                - Be patient and understanding
                - Keep questions focused and specific
                """

    async def join_interview(
        self,
        call_id: str,
        questions: List[str],
        candidate_name: str,
        job_title: str
    ):
        """
        Join a specific interview call
        Creates a NEW agent instance for this interview to avoid conflicts

        Args:
            call_id: Stream call ID to join
            questions: List of interview questions to ask
            candidate_name: Candidate's name for personalization
            job_title: Job position being interviewed for
        """
        logger.info(f"🎯 Joining interview: {call_id}")
        logger.info(f"📋 Questions to ask: {len(questions)}")

        # Update instructions with personalized context
        logger.info("📝 Personalizing instructions...")
        personalized_instructions = self._personalize_instructions(
            questions, candidate_name, job_title
        )

        # Create a NEW agent instance for this interview
        # This allows multiple concurrent interviews without conflicts
        logger.info("🤖 Creating new agent instance for this interview...")

        # Build processors list
        processors = []

        # Add HeyGen avatar if configured
        avatar_publisher = get_avatar_publisher()
        if avatar_publisher:
            processors.append(avatar_publisher)
            logger.info("✅ HeyGen avatar enabled for this interview")

        interview_agent = Agent(
            edge=getstream.Edge(),
            agent_user=User(
                name="AI Interviewer"
            ),
            instructions=personalized_instructions,
            llm=get_llm(),
            stt=get_stt(),
            processors=processors
        )

        # Register agent user with Stream
        await interview_agent.create_user()
        logger.info("✅ New agent instance created")

        # WORKAROUND: Manually wire HeyGen's audio track to agent
        # The vision_agents framework creates an empty audio track by default,
        # but we need to use HeyGen's audio track which contains the TTS audio
        if avatar_publisher:
            logger.info("🎵 Manually wiring HeyGen audio track to agent")
            interview_agent._audio_track = avatar_publisher.publish_audio_track()
            logger.info("✅ HeyGen audio track connected to agent")

        # Store current interview context
        self.current_interview = {
            "call_id": call_id,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "questions": questions,
            "started_at": datetime.now(timezone.utc).isoformat()
        }

        # Join the existing Stream call (call was already created by Next.js)
        logger.info(f"📞 Getting call reference for: {call_id}")
        call = interview_agent.edge.client.video.call("default", call_id)

        logger.info(f"🔗 Attempting to join call...")
        try:
            # Create smart completion processor
            async def end_call_callback():
                """Callback when interview is detected as complete"""
                logger.info(f"⏰ Waiting 3 seconds for final audio to play...")
                await asyncio.sleep(3)
                logger.info(f"📞 Ending call: {call_id}")
                try:
                    # First, close HeyGen session to free up concurrent session slot
                    try:
                        # Find and close HeyGen avatar publisher if it exists
                        for processor in interview_agent.processors:
                            if hasattr(processor, '_rtc_manager'):
                                logger.info("🎭 Closing HeyGen session...")
                                try:
                                    if hasattr(processor._rtc_manager, 'close'):
                                        await processor._rtc_manager.close()
                                    logger.info("✅ HeyGen session closed")
                                except Exception as heygen_error:
                                    logger.warning(f"⚠️ Error closing HeyGen session: {heygen_error}")
                    except Exception as cleanup_error:
                        logger.warning(f"⚠️ Error during HeyGen cleanup: {cleanup_error}")

                    # Close the agent's connection to leave the call
                    if interview_agent._connection:
                        await interview_agent._connection.close()
                        logger.info(f"✅ Call ended successfully")

                        # Send interview completion webhook
                        await self._send_interview_completion_webhook(
                            call_id=call_id,
                            candidate_name=candidate_name,
                            job_title=job_title,
                            duration_minutes=completion_processor.get_duration_minutes()
                        )
                    else:
                        logger.warning(f"⚠️ No active connection to close")
                except Exception as e:
                    logger.error(f"❌ Error leaving call: {e}")

            completion_processor = InterviewCompletionProcessor(
                expected_questions=len(questions),
                minimum_duration_minutes=3,  # Reduced from 8 to 3 minutes
                completion_callback=end_call_callback
            )

            # Add completion processor to agent (after avatar processor if present)
            interview_agent.processors.append(completion_processor)
            await completion_processor.setup(interview_agent)
            logger.info("✅ Interview completion processor added")

            # Join call and let agent run autonomously
            # The agent will automatically detect participants and start the interview
            # It will run in the background without blocking
            await interview_agent.join(call)
            logger.info(f"✅ Agent joined call successfully")

            # Send initial prompt to start the interview
            # Without this, the agent waits for the candidate to speak first
            logger.info(f"🎤 Sending initial prompt to start interview")
            await interview_agent.simple_response(
                text=f"Start the interview now by greeting {candidate_name} and asking the first question."
            )

            # Agent is now running autonomously in the background
            # It will conduct the interview based on instructions
            # The Vision-Agents framework handles the conversation automatically
            logger.info(f"🎯 Agent is now conducting interview autonomously")

            # Wait for smart processor to detect completion (with 15 min timeout)
            await completion_processor.wait_for_completion(timeout=900)

        except Exception as e:
            logger.error(f"❌ Error during interview: {e}", exc_info=True)

            # Cleanup HeyGen session on error to prevent session leaks
            try:
                logger.info("🎭 Cleaning up HeyGen session due to error...")
                for processor in interview_agent.processors:
                    if hasattr(processor, '_rtc_manager'):
                        try:
                            if hasattr(processor._rtc_manager, 'close'):
                                await processor._rtc_manager.close()
                            logger.info("✅ HeyGen session cleanup completed")
                        except Exception as cleanup_error:
                            logger.warning(f"⚠️ Error during HeyGen cleanup: {cleanup_error}")
            except Exception as final_cleanup_error:
                logger.warning(f"⚠️ Error in final cleanup: {final_cleanup_error}")

            raise

    def _personalize_instructions(
        self,
        questions: List[str],
        candidate_name: str,
        job_title: str
    ) -> str:
        """Add personalized context to agent instructions"""
        base_instructions = self._load_instructions()

        questions_text = "\n".join([
            f"{i+1}. {q}" for i, q in enumerate(questions)
        ])

        personalized = f"""
{base_instructions}

INTERVIEW CONTEXT:
- Candidate: {candidate_name}
- Position: {job_title}

QUESTIONS TO ASK (in order):
{questions_text}

Start the interview by greeting {candidate_name} and asking the first question.
After each answer, either ask a follow-up or move to the next question.
"""
        return personalized

    async def _send_interview_completion_webhook(
        self,
        call_id: str,
        candidate_name: str,
        job_title: str,
        duration_minutes: float
    ):
        """
        Send interview completion webhook to Next.js
        """
        logger.info("📤 Sending interview completion notification...")

        payload = {
            "call_id": call_id,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "duration_minutes": round(duration_minutes, 2),
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.nextjs_webhook_url}/api/webhooks/interview-complete",
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                logger.info(f"✅ Interview completion notification sent successfully")
            except Exception as e:
                logger.error(f"❌ Failed to send completion webhook: {e}")
