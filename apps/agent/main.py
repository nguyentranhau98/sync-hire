"""
SyncHire AI Interview Agent
Powered by GetStream Vision-Agents with Gemini Live

This agent:
1. Joins interview calls when invited
2. Asks personalized interview questions
3. Listens to candidate responses
4. Adapts questions based on answers
5. Sends results to Next.js webhook
"""

import asyncio
import logging
from typing import List
from datetime import datetime, timezone
from contextlib import asynccontextmanager

# FastAPI imports (for HTTP endpoints)
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configuration
from config import Config

# Agent
from agents.interview_agent import InterviewAgent

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('agent.log', mode='a')  # File output
    ]
)
logger = logging.getLogger(__name__)

# Enable DEBUG logging for vision_agents to see more details
logging.getLogger("vision_agents").setLevel(logging.INFO)
logging.getLogger("vision_agents.plugins.gemini").setLevel(logging.INFO)
logging.getLogger("vision_agents.plugins.openai").setLevel(logging.INFO)

logger.info("=" * 80)
logger.info("Agent started - logging to agent.log")
logger.info("=" * 80)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    global interview_agent

    # Startup
    logger.info("🚀 Starting SyncHire AI Interview Agent...")

    # Validate API keys are configured
    if interview_agent.validate_configuration():
        logger.info("✅ API keys validated successfully")
    else:
        logger.warning("⚠️  Missing API keys - agent will not be able to join interviews")
        logger.info("   Set STREAM_API_KEY, DEEPGRAM_API_KEY, and (GEMINI_API_KEY or OPENAI_API_KEY)")

    yield

    # Shutdown
    logger.info("🔄 Server shutting down gracefully...")
    # Note: Background interview tasks will continue running autonomously
    # The Vision-Agents framework handles cleanup internally


# Initialize FastAPI app for HTTP endpoints
app = FastAPI(
    title="SyncHire AI Interview Agent",
    description="Vision-Agents powered AI interviewer",
    version="0.2.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class Question(BaseModel):
    """Individual interview question"""
    id: str
    text: str
    type: str
    duration: int


class JoinInterviewRequest(BaseModel):
    """Request to join an interview"""
    callId: str
    questions: List[Question]
    candidateName: str
    jobTitle: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: str
    agent_initialized: bool


# Global agent instance
interview_agent = InterviewAgent()


# FastAPI Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="sync-hire-vision-agent",
        version="0.2.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
        agent_initialized=interview_agent.validate_configuration()
    )


async def _run_interview_background(
    call_id: str,
    questions: List[Question],
    candidate_name: str,
    job_title: str
):
    """
    Background task to run the interview
    This allows the HTTP endpoint to return immediately
    The agent will join the call and run autonomously without blocking
    """
    try:
        logger.info(f"🎯 Background task: Starting interview for {candidate_name}")

        # Extract question text from Question objects
        question_texts = [q.text for q in questions]

        await interview_agent.join_interview(
            call_id=call_id,
            questions=question_texts,
            candidate_name=candidate_name,
            job_title=job_title
        )
        logger.info(f"✅ Background task: Agent joined and is conducting interview for {call_id}")
    except asyncio.CancelledError:
        logger.info(f"⚠️  Background task cancelled for {call_id}")
        raise
    except Exception as e:
        logger.error(f"❌ Background task: Error in interview {call_id}: {e}", exc_info=True)


@app.post("/join-interview")
async def join_interview(request: JoinInterviewRequest, background_tasks: BackgroundTasks):
    """
    Join an interview call

    This endpoint is called by Next.js to invite the agent to a call.
    The interview runs in a background task so the endpoint returns immediately.
    """
    logger.info(f"📞 Received join-interview request for call: {request.callId}")

    if not interview_agent.validate_configuration():
        logger.error("❌ Agent configuration invalid")
        return {
            "success": False,
            "error": "Agent configuration invalid - check STREAM_API_KEY, DEEPGRAM_API_KEY, and (GEMINI_API_KEY or OPENAI_API_KEY)"
        }

    # Add interview to background tasks
    logger.info(f"➕ Adding interview to background tasks for {request.candidateName}")
    logger.info(f"   Questions: {len(request.questions)} question(s)")

    background_tasks.add_task(
        _run_interview_background,
        call_id=request.callId,
        questions=request.questions,
        candidate_name=request.candidateName,
        job_title=request.jobTitle
    )

    logger.info(f"✅ Interview task scheduled: {request.callId}")
    return {
        "success": True,
        "message": "Agent will join interview shortly",
        "callId": request.callId
    }


@app.get("/")
async def root():
    """Root endpoint"""
    # Determine which LLM is active
    if Config.GEMINI_API_KEY:
        llm_name = "Google Gemini 2.0 Flash"
    elif Config.OPENAI_API_KEY:
        llm_name = "OpenAI GPT-4o Realtime"
    else:
        llm_name = "None (no API keys configured)"

    return {
        "service": "SyncHire AI Interview Agent",
        "version": "0.2.0",
        "status": "running",
        "framework": "Vision-Agents",
        "llm": llm_name,
        "avatar": "HeyGen" if Config.HEYGEN_API_KEY else "Audio-only",
        "agent_initialized": interview_agent.validate_configuration(),
        "endpoints": {
            "health": "/health",
            "join_interview": "/join-interview (POST)",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=Config.PORT,
        reload=True,
        log_level="info",
    )
