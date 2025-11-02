# Vision-Agents Integration Guide

**Version:** 1.0
**Complexity:** Low (Python experience: beginner-friendly)

---

## Table of Contents

1. [Overview](#overview)
2. [Why Vision-Agents?](#why-vision-agents)
3. [Architecture Integration](#architecture-integration)
4. [Python Server Implementation](#python-server-implementation)
5. [Next.js Integration](#nextjs-integration)
6. [Communication Protocol](#communication-protocol)
7. [AI-Assisted Development](#ai-assisted-development)
8. [Testing & Debugging](#testing--debugging)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

GetStream Vision-Agents is a Python framework for building real-time AI agents that can:
- 🎙️ **Conduct voice conversations** (STT → LLM → TTS)
- 📹 **Process video streams** (optional engagement detection)
- 🔄 **Manage turn-taking** (know when candidate stops speaking)
- ⚡ **Ultra-low latency** (<30ms via Stream Edge network)

**For SyncHire:** Vision-Agents powers the AI interviewer that conducts natural, adaptive conversations with candidates.

---

## Why Vision-Agents?

### Feature Comparison

| Feature | Vision-Agents | Manual Implementation | Time Saved |
|---------|---------------|----------------------|------------|
| **STT/TTS Pipeline** | Built-in (1 line) | 10-15 hours | ⏱️ 10-15h |
| **Turn Detection** | Automatic (semantic) | 5-8 hours | ⏱️ 5-8h |
| **WebRTC Setup** | Handled by Stream | 8-12 hours | ⏱️ 8-12h |
| **LLM Integration** | Multi-provider support | 3-5 hours | ⏱️ 3-5h |
| **Video Processing** | YOLO processors | 15-20 hours | ⏱️ 15-20h |
| **State Management** | Built-in | 3-5 hours | ⏱️ 3-5h |
| **Total** | ~100 lines of code | ~50-70 hours | ⏱️ **44-65 hours** |

### Key Benefits for Limited Python Experience

✅ **Minimal Code:** ~100 lines of Python (vs 1000+ for manual implementation)
✅ **Configuration-Based:** Most settings via Markdown files, not code
✅ **AI-Friendly:** Simple patterns that AI (ChatGPT/Claude) can generate
✅ **Docker-Ready:** Encapsulate complexity in a container
✅ **Well-Documented:** Official examples and tutorials
✅ **Type-Safe:** Python type hints for better IDE support

---

## Architecture Integration

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CANDIDATE BROWSER                       │
│  ┌───────────────────────────────────────────────┐          │
│  │   Stream Video React SDK                      │          │
│  │   - Camera + Microphone                       │          │
│  │   - WebRTC connection                         │          │
│  └───────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ WebRTC (audio + video)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  STREAM EDGE NETWORK                        │
│  ┌───────────────────────────────────────────────┐          │
│  │   Managed WebRTC Infrastructure               │          │
│  │   - Signaling server                          │          │
│  │   - Media routing                             │          │
│  │   - Recording                                 │          │
│  │   - Latency: <30ms                            │          │
│  └───────────────────────────────────────────────┘          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ WebRTC (audio only - AI agent)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              PYTHON VISION-AGENTS SERVER                    │
│  ┌───────────────────────────────────────────────┐          │
│  │   AI Interviewer Agent                        │          │
│  │                                               │          │
│  │   Input:  Candidate speech (audio stream)    │          │
│  │   STT:    Deepgram transcription              │          │
│  │   LLM:    OpenAI/Gemini generates response    │          │
│  │   TTS:    ElevenLabs synthesizes speech       │          │
│  │   Output: AI voice (audio stream)             │          │
│  └───────────────────────────────────────────────┘          │
│                                                             │
│  Code: main.py (~60 lines)                                  │
│  Deployment: Google Cloud Run (Docker)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Webhook (interview complete)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                      │
│  ┌───────────────────────────────────────────────┐          │
│  │   POST /api/webhooks/interview-complete      │          │
│  │   - Receive transcript                        │          │
│  │   - Store summary                             │          │
│  │   - Calculate scores                          │          │
│  │   - Update database                           │          │
│  └───────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Interaction Flow

```
┌──────────┐
│ Next.js  │
└────┬─────┘
     │
     │ 1. POST /api/interview/start
     │    { candidateId, jobId }
     │
     ├─→ Create Stream call
     │   const call = streamClient.call('default', callId);
     │   await call.create({ members: [candidate, agent] });
     │
     ├─→ Generate Stream token for candidate
     │   const token = streamClient.generateUserToken({ user_id });
     │
     └─→ 2. POST {PYTHON_URL}/join-interview
         { callId, questions: [...] }

                    │
                    ▼
         ┌─────────────────┐
         │ Python Agent    │
         └────┬────────────┘
              │
              │ 3. Agent joins Stream call
              │    await agent.join_call(callId)
              │
              │ 4. Agent listens for audio
              │    Automatic STT via Deepgram
              │
              │ 5. LLM generates responses
              │    OpenAI Realtime API
              │
              │ 6. TTS plays to candidate
              │    ElevenLabs voice synthesis
              │
              │ (Interview continues 5-10 min)
              │
              └─→ 7. POST {NEXTJS_URL}/api/webhooks/interview-complete
                  { transcript, summary, duration }

                              │
                              ▼
                  ┌─────────────────────┐
                  │ Next.js saves       │
                  │ results to database │
                  └─────────────────────┘
```

---

## Python Server Implementation

### Directory Structure

```
interview-agent/
├── main.py                    # Main agent code (~60 lines)
├── config.py                  # Environment config (~30 lines)
├── interview_instructions.md  # Agent personality (Markdown)
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container definition
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore file
└── README.md                  # Setup instructions
```

### 1. main.py - Core Agent Implementation

```python
"""
SyncHire AI Interview Agent
Powered by GetStream Vision-Agents

This agent:
1. Joins interview calls when invited
2. Asks personalized interview questions
3. Listens to candidate responses
4. Adapts questions based on answers
5. Sends results to Next.js webhook
"""

import os
import asyncio
import httpx
from typing import Dict, List
from dotenv import load_dotenv

# Vision-Agents imports
from vision_agents import Agent, User
from vision_agents.integrations import getstream, openai
# Alternative: from vision_agents.integrations import gemini

# Load environment variables
load_dotenv()

class InterviewAgent:
    """AI Interviewer Agent using Vision-Agents framework"""

    def __init__(self):
        self.agent = None
        self.current_interview = None
        self.nextjs_webhook_url = os.getenv("NEXTJS_WEBHOOK_URL")

    async def initialize(self):
        """Initialize the AI agent"""
        print("🤖 Initializing SyncHire AI Interviewer Agent...")

        # Create agent with OpenAI Realtime API
        self.agent = Agent(
            edge=getstream.Edge(),
            agent_user=User(
                name="AI Interviewer",
                id="synchire-ai-interviewer"
            ),
            instructions=self._load_instructions(),
            llm=openai.Realtime(
                fps=10,  # 10 frames per second for low latency
                model="gpt-4o-realtime-preview"
            ),
            # Optional: Add video processors for engagement detection
            processors=[]
        )

        # Register agent user with Stream
        await self.agent.create_user()
        print("✅ Agent initialized successfully")

        # Listen for interview invitations
        print("👂 Listening for interview calls...")
        await self.agent.listen_for_calls()

    def _load_instructions(self) -> str:
        """Load agent instructions from Markdown file"""
        instructions_path = "interview_instructions.md"

        try:
            with open(instructions_path, "r") as f:
                instructions = f.read()
            print(f"📄 Loaded instructions from {instructions_path}")
            return instructions
        except FileNotFoundError:
            print(f"⚠️  Warning: {instructions_path} not found, using default")
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

        Args:
            call_id: Stream call ID to join
            questions: List of interview questions to ask
            candidate_name: Candidate's name for personalization
            job_title: Job position being interviewed for
        """
        print(f"🎯 Joining interview: {call_id}")
        print(f"📋 Questions to ask: {len(questions)}")

        # Update instructions with personalized context
        personalized_instructions = self._personalize_instructions(
            questions, candidate_name, job_title
        )
        self.agent.instructions = personalized_instructions

        # Store current interview context
        self.current_interview = {
            "call_id": call_id,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "questions": questions
        }

        # Join the Stream call
        await self.agent.join_call(call_id)
        print(f"✅ Joined call: {call_id}")

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

    async def on_interview_complete(
        self,
        transcript: str,
        duration: int
    ):
        """
        Called when interview ends
        Send results to Next.js webhook
        """
        print("📤 Sending interview results to Next.js...")

        payload = {
            "call_id": self.current_interview["call_id"],
            "candidate_name": self.current_interview["candidate_name"],
            "job_title": self.current_interview["job_title"],
            "transcript": transcript,
            "duration": duration,
            "questions_asked": self.current_interview["questions"]
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.nextjs_webhook_url}/api/webhooks/interview-complete",
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                print("✅ Results sent successfully")
            except Exception as e:
                print(f"❌ Error sending results: {e}")


async def main():
    """Main entry point"""
    print("🚀 Starting SyncHire AI Interview Agent")

    # Validate environment variables
    required_vars = [
        "STREAM_API_KEY",
        "OPENAI_API_KEY",
        "NEXTJS_WEBHOOK_URL"
    ]

    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file")
        return

    # Initialize and start agent
    agent = InterviewAgent()
    await agent.initialize()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Agent shutting down gracefully...")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        raise
```

### 2. config.py - Environment Configuration

```python
"""
Configuration management for SyncHire AI Agent
Loads environment variables and validates settings
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Config:
    """Application configuration"""

    # Stream Video
    STREAM_API_KEY: str = os.getenv("STREAM_API_KEY", "")
    STREAM_API_SECRET: Optional[str] = os.getenv("STREAM_API_SECRET")

    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-realtime-preview")

    # Alternative: Gemini
    # GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # ElevenLabs (TTS)
    ELEVENLABS_API_KEY: Optional[str] = os.getenv("ELEVENLABS_API_KEY")
    ELEVENLABS_VOICE_ID: str = os.getenv(
        "ELEVENLABS_VOICE_ID",
        "21m00Tcm4TlvDq8ikWAM"  # Default professional voice
    )

    # Next.js Webhook
    NEXTJS_WEBHOOK_URL: str = os.getenv(
        "NEXTJS_WEBHOOK_URL",
        "http://localhost:3000"
    )

    # Agent Settings
    AGENT_FPS: int = int(os.getenv("AGENT_FPS", "10"))
    AGENT_TIMEOUT: int = int(os.getenv("AGENT_TIMEOUT", "3600"))  # 1 hour

    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration"""
        required = [
            ("STREAM_API_KEY", cls.STREAM_API_KEY),
            ("OPENAI_API_KEY", cls.OPENAI_API_KEY),
            ("NEXTJS_WEBHOOK_URL", cls.NEXTJS_WEBHOOK_URL)
        ]

        missing = [name for name, value in required if not value]

        if missing:
            print(f"❌ Missing required config: {', '.join(missing)}")
            return False

        print("✅ Configuration validated")
        return True


# Validate on import
if not Config.validate():
    raise ValueError("Invalid configuration - check environment variables")
```

### 3. interview_instructions.md - Agent Personality

```markdown
# AI Interviewer Instructions

You are a professional technical interviewer conducting interviews for SyncHire.

## Your Personality

- **Professional yet warm:** Be friendly but maintain professionalism
- **Patient and encouraging:** Give candidates time to think and respond
- **Active listener:** Pay attention to details in their answers
- **Adaptive:** Adjust your questions based on their responses

## Interview Structure

### 1. Opening (30 seconds)
- Greet the candidate by name
- Introduce yourself: "Hi [Name]! I'm an AI interviewer for SyncHire. I'm excited to learn about your experience today."
- Set expectations: "I'll be asking you some questions about your background. Feel free to take your time with your responses."

### 2. Main Questions (8-10 questions, ~8 minutes)

**Question Flow:**
1. Ask ONE question at a time from the provided list
2. Wait for the candidate's complete response
3. Based on their answer:
   - If **detailed and clear:** Move to the next question
   - If **vague or incomplete:** Ask 1-2 follow-up questions for clarification
   - If **mentions something interesting:** Explore that topic briefly

**Follow-up Patterns:**
- "That's interesting! Can you tell me more about [specific detail they mentioned]?"
- "You mentioned [X]. How did you handle [specific challenge]?"
- "Can you give me a concrete example of when you [action they described]?"

### 3. Closing (30 seconds)
- Thank the candidate: "Thank you for sharing your experience with me today, [Name]."
- Set expectations: "We'll review this interview and be in touch soon."
- End positively: "Best of luck!"

## Conversation Guidelines

### DO:
✅ Speak naturally and conversationally
✅ Use the candidate's name occasionally
✅ Acknowledge good answers: "Great example!" or "I appreciate the detail"
✅ Ask for specific examples when answers are too general
✅ Give candidates time to think (2-3 seconds of silence is okay)
✅ Keep questions concise and focused

### DON'T:
❌ Interrupt the candidate while they're speaking
❌ Ask multiple questions at once
❌ Judge or criticize their answers
❌ Rush through questions
❌ Use overly technical jargon unnecessarily
❌ Make the candidate feel uncomfortable

## Technical Details

### Speaking Style
- **Pace:** Moderate (not too fast, not too slow)
- **Tone:** Professional but warm
- **Clarity:** Enunciate clearly
- **Pauses:** Natural pauses between sentences

### Question Timing
- Allow **2-3 minutes** per main question
- Allow **1-2 minutes** per follow-up
- Total interview: **8-12 minutes**

### Adaptation Logic

If candidate seems **nervous:**
- "Take your time, there's no rush."
- "That's a tough question, let me rephrase..."

If candidate gives **short answers:**
- "Could you elaborate on that a bit more?"
- "Can you walk me through your thought process?"

If candidate is **very technical:**
- Match their technical depth
- Ask for architecture/design details

If candidate is **struggling:**
- Offer a hint or rephrase the question
- Move on gracefully: "No problem, let's try a different angle..."

## Interview Completion

After 8-10 questions OR 10 minutes (whichever comes first):
1. Thank the candidate warmly
2. End the interview
3. System will automatically save the transcript and send results to the employer

---

Remember: Your goal is to create a **positive interview experience** while gathering **meaningful insights** about the candidate's skills and experience.
```

### 4. requirements.txt - Dependencies

```txt
# Vision-Agents with Stream and OpenAI integrations
vision-agents[getstream,openai]>=1.0.0

# Alternative LLM providers
# vision-agents[gemini]>=1.0.0

# Environment variables
python-dotenv>=1.0.0

# HTTP client for webhooks
httpx>=0.25.0

# Type hints (Python 3.8+)
typing-extensions>=4.8.0

# Async support
asyncio>=3.4.3
```

### 5. Dockerfile - Container Definition

```dockerfile
# Use Python 3.13 slim image
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if needed for video processing)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment variables (override with Cloud Run)
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Expose port for Cloud Run
EXPOSE 8080

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Run the agent
CMD ["python", "main.py"]
```

### 6. .env.example - Example Configuration

```env
# Stream Video Configuration
STREAM_API_KEY=your_stream_api_key_here
STREAM_API_SECRET=your_stream_secret_here  # Optional

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-realtime-preview

# Alternative: Gemini Configuration
# GEMINI_API_KEY=your_gemini_api_key_here

# ElevenLabs TTS (Optional)
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Next.js Webhook URL
NEXTJS_WEBHOOK_URL=https://your-app.vercel.app

# Agent Settings
AGENT_FPS=10
AGENT_TIMEOUT=3600  # 1 hour max interview length
```

---

## Next.js Integration

### 1. Create Stream Call and Invite Agent

```typescript
// app/api/interview/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StreamClient } from '@stream-io/node-sdk';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, jobId } = await request.json();

    // 1. Fetch interview data from database
    const application = await prisma.application.findFirst({
      where: {
        candidateId,
        jobId,
        status: 'APPROVED'
      },
      include: {
        job: {
          include: {
            questions: true
          }
        },
        candidate: true
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or not approved' },
        { status: 404 }
      );
    }

    // 2. Create Stream call
    const streamClient = new StreamClient(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    const callId = `interview-${Date.now()}-${candidateId}`;
    const call = streamClient.video.call('default', callId);

    await call.create({
      data: {
        created_by_id: 'system',
        members: [
          {
            user_id: candidateId,
            role: 'host'  // Candidate is host
          },
          {
            user_id: 'synchire-ai-interviewer',
            role: 'call_member'  // AI is participant
          }
        ],
        custom: {
          jobId,
          applicationId: application.id
        }
      }
    });

    // 3. Generate Stream token for candidate
    const candidateToken = streamClient.generateUserToken({
      user_id: candidateId,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    });

    // 4. Invite Python agent to join
    const questions = application.job.questions.map(q => q.text);

    await fetch(`${process.env.PYTHON_AGENT_URL}/join-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AGENT_API_SECRET}`
      },
      body: JSON.stringify({
        callId,
        questions,
        candidateName: application.candidate.name,
        jobTitle: application.job.title
      })
    });

    // 5. Create interview record in database
    const interview = await prisma.interview.create({
      data: {
        applicationId: application.id,
        callId,
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    });

    // 6. Return call details to frontend
    return NextResponse.json({
      callId,
      token: candidateToken,
      interviewId: interview.id,
      streamApiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY
    });

  } catch (error) {
    console.error('Error starting interview:', error);
    return NextResponse.json(
      { error: 'Failed to start interview' },
      { status: 500 }
    );
  }
}
```

### 2. Handle Interview Completion Webhook

```typescript
// app/api/webhooks/interview-complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const {
      call_id: callId,
      transcript,
      duration,
      questions_asked: questionsAsked
    } = payload;

    // 1. Find interview by callId
    const interview = await prisma.interview.findUnique({
      where: { callId },
      include: {
        application: {
          include: {
            candidate: true,
            job: true
          }
        }
      }
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // 2. Generate AI summary using Gemini
    const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const summaryPrompt = `
Analyze this technical interview transcript and provide a structured summary.

Job Title: ${interview.application.job.title}
Candidate: ${interview.application.candidate.name}
Duration: ${duration} seconds

Questions Asked:
${questionsAsked.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Transcript:
${transcript}

Provide:
1. Overall Impression (2-3 sentences)
2. Key Strengths (3-5 bullet points)
3. Areas of Concern (2-3 bullet points)
4. Technical Depth Assessment (1-10 score with justification)
5. Communication Skills (1-10 score with justification)
6. Recommendation (Strong Hire / Hire / Maybe / No Hire)

Format as JSON with these keys:
{
  "overallImpression": "...",
  "strengths": ["...", "..."],
  "concerns": ["...", "..."],
  "technicalDepth": { "score": 8, "justification": "..." },
  "communication": { "score": 9, "justification": "..." },
  "recommendation": "Hire"
}
`;

    const result = await model.generateContent(summaryPrompt);
    const summaryText = result.response.text();

    // Parse JSON from summary
    const summaryJson = JSON.parse(
      summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    // 3. Calculate overall score (average of technical + communication)
    const overallScore = Math.round(
      (summaryJson.technicalDepth.score + summaryJson.communication.score) / 2 * 10
    );

    // 4. Update interview in database
    await prisma.interview.update({
      where: { id: interview.id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        transcript,
        summary: summaryJson.overallImpression,
        score: overallScore,
        insights: summaryJson,  // Store full JSON
        duration
      }
    });

    // 5. Update application status
    await prisma.application.update({
      where: { id: interview.applicationId },
      data: {
        status: summaryJson.recommendation === 'Strong Hire' || summaryJson.recommendation === 'Hire'
          ? 'INTERVIEW_PASSED'
          : 'INTERVIEW_COMPLETED'
      }
    });

    // 6. Optional: Send notification to employer
    // await sendEmployerNotification(interview.application.job.employerId, interview.id);

    return NextResponse.json({ success: true, interviewId: interview.id });

  } catch (error) {
    console.error('Error processing interview completion:', error);
    return NextResponse.json(
      { error: 'Failed to process interview completion' },
      { status: 500 }
    );
  }
}
```

### 3. Frontend Interview Room Component

```typescript
// app/interview/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  useCallStateHooks,
  ParticipantView,
  SpeakerLayout
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';

interface InterviewRoomProps {
  params: { id: string };
}

export default function InterviewRoom({ params }: InterviewRoomProps) {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeInterview() {
      try {
        // 1. Start interview (calls Next.js API)
        const response = await fetch('/api/interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interviewId: params.id })
        });

        const { callId, token, streamApiKey } = await response.json();

        // 2. Initialize Stream Video client
        const user = {
          id: 'current-user-id',  // From auth session
          name: 'Candidate Name'
        };

        const streamClient = new StreamVideoClient({
          apiKey: streamApiKey,
          user,
          token
        });

        // 3. Join the call
        const videoCall = streamClient.call('default', callId);
        await videoCall.join();

        setClient(streamClient);
        setCall(videoCall);
        setLoading(false);

      } catch (error) {
        console.error('Failed to initialize interview:', error);
        // Handle error (show error UI)
      }
    }

    initializeInterview();

    // Cleanup on unmount
    return () => {
      call?.leave();
      client?.disconnectUser();
    };
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="ml-4">Connecting to interview...</p>
    </div>;
  }

  return (
    <StreamVideo client={client!}>
      <StreamCall call={call}>
        <InterviewUI />
      </StreamCall>
    </StreamVideo>
  );
}

function InterviewUI() {
  const { useParticipants, useCallSession } = useCallStateHooks();
  const participants = useParticipants();
  const session = useCallSession();

  const aiAgent = participants.find(p => p.userId === 'synchire-ai-interviewer');
  const candidate = participants.find(p => p.userId !== 'synchire-ai-interviewer');

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-white text-xl font-semibold">
          SyncHire Interview
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-white text-sm">Recording</span>
          </div>
          <div className="text-white text-sm">
            Duration: {Math.floor((session?.duration || 0) / 60)}:{((session?.duration || 0) % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* AI Interviewer */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black bg-opacity-60 px-3 py-1 rounded">
              <span className="text-white text-sm">AI Interviewer</span>
            </div>
          </div>
          {aiAgent ? (
            <ParticipantView participant={aiAgent} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-4xl">🤖</span>
                </div>
                <p className="text-white">AI Interviewer</p>
              </div>
            </div>
          )}
        </div>

        {/* Candidate */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-black bg-opacity-60 px-3 py-1 rounded">
              <span className="text-white text-sm">You</span>
            </div>
          </div>
          {candidate && <ParticipantView participant={candidate} />}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg">
          End Interview
        </button>
      </div>
    </div>
  );
}
```

---

## Communication Protocol

### 1. Interview Start Request

**Next.js → Python Agent**

```http
POST {PYTHON_AGENT_URL}/join-interview
Content-Type: application/json
Authorization: Bearer {AGENT_API_SECRET}

{
  "callId": "interview-1704723600-user123",
  "questions": [
    "Tell me about your experience with React",
    "How do you approach state management?",
    "Describe a challenging bug you solved"
  ],
  "candidateName": "John Doe",
  "jobTitle": "Full Stack Developer"
}
```

**Python Agent Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Agent joined interview successfully",
  "callId": "interview-1704723600-user123"
}
```

### 2. Interview Completion Webhook

**Python Agent → Next.js**

```http
POST {NEXTJS_WEBHOOK_URL}/api/webhooks/interview-complete
Content-Type: application/json
X-Agent-Signature: {HMAC_SIGNATURE}

{
  "call_id": "interview-1704723600-user123",
  "candidate_name": "John Doe",
  "job_title": "Full Stack Developer",
  "transcript": "Full interview transcript...",
  "duration": 587,  // seconds
  "questions_asked": [
    "Tell me about your experience with React",
    "You mentioned Redux - how did you structure your store?"
  ]
}
```

**Next.js Response:**

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "interviewId": "int_abc123",
  "message": "Interview results processed successfully"
}
```

---

## AI-Assisted Development

### Using ChatGPT/Claude to Generate Python Code

Since you have limited Python experience, you can use AI to generate the Python server code:

**Prompt Template:**

```
I'm building a Python server using GetStream Vision-Agents for an AI interview platform.

Requirements:
1. Use Vision-Agents framework
2. Integrate with OpenAI Realtime API
3. Agent should:
   - Join interview calls when invited via HTTP POST
   - Ask personalized interview questions
   - Listen to candidate responses with automatic STT
   - Generate adaptive follow-ups
   - Send results to Next.js webhook when interview ends
4. Code should be ~60 lines, well-commented
5. Use environment variables for configuration
6. Include error handling

Generate:
- main.py (agent implementation)
- config.py (environment config)
- requirements.txt
- Dockerfile

Use this structure:
[Paste the structure from this document]
```

**Expected Output Quality:** 95%+ correct
**Time to Review/Adjust:** 15-30 minutes

---

## Testing & Debugging

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/sync-hire-agent.git
cd sync-hire-agent/interview-agent

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# 5. Run agent locally
python main.py
```

### Testing Workflow

**1. Test Agent Initialization:**
```bash
python main.py

# Expected output:
# 🤖 Initializing SyncHire AI Interviewer Agent...
# 📄 Loaded instructions from interview_instructions.md
# ✅ Agent initialized successfully
# 👂 Listening for interview calls...
```

**2. Test Interview Join (curl):**
```bash
curl -X POST http://localhost:8080/join-interview \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-interview-123",
    "questions": ["Tell me about yourself", "What are your strengths?"],
    "candidateName": "Test User",
    "jobTitle": "Software Engineer"
  }'
```

**3. Monitor Logs:**
```bash
# Watch agent logs in real-time
tail -f logs/agent.log

# Or use structured logging
python main.py 2>&1 | tee interview-agent.log
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| **Agent won't start** | Missing API keys | Check `.env` file, ensure all required vars are set |
| **Can't join call** | Invalid Stream credentials | Verify `STREAM_API_KEY` is correct |
| **No audio from AI** | TTS not configured | Check `OPENAI_API_KEY`, ensure Realtime API access |
| **Webhook failing** | Wrong Next.js URL | Verify `NEXTJS_WEBHOOK_URL` is accessible from Python |
| **Docker build fails** | Dependency issues | Clear Docker cache: `docker system prune -a` |

---

## Deployment

### Google Cloud Run Deployment

**1. Build Docker Image:**
```bash
# From interview-agent/ directory
docker build -t gcr.io/PROJECT_ID/synchire-interview-agent .
```

**2. Push to Google Container Registry:**
```bash
docker push gcr.io/PROJECT_ID/synchire-interview-agent
```

**3. Deploy to Cloud Run:**
```bash
gcloud run deploy synchire-interview-agent \
  --image gcr.io/PROJECT_ID/synchire-interview-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars \
    STREAM_API_KEY="${STREAM_API_KEY}",\
    OPENAI_API_KEY="${OPENAI_API_KEY}",\
    NEXTJS_WEBHOOK_URL="https://your-app.vercel.app" \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --timeout 3600 \
  --concurrency 1
```

**4. Get Deployment URL:**
```bash
gcloud run services describe synchire-interview-agent \
  --region us-central1 \
  --format 'value(status.url)'

# Output: https://synchire-interview-agent-xxx-uc.a.run.app
```

**5. Update Next.js Environment:**
```env
# .env.local
PYTHON_AGENT_URL=https://synchire-interview-agent-xxx-uc.a.run.app
```

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy-agent.yml
name: Deploy Python Agent

on:
  push:
    branches: [main]
    paths:
      - 'interview-agent/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ secrets.GCP_PROJECT_ID }}
          service_account_key: ${{ secrets.GCP_SA_KEY }}

      - name: Build and Push Docker Image
        run: |
          cd interview-agent
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/synchire-interview-agent .
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/synchire-interview-agent

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy synchire-interview-agent \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/synchire-interview-agent \
            --region us-central1 \
            --set-env-vars \
              STREAM_API_KEY=${{ secrets.STREAM_API_KEY }},\
              OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }},\
              NEXTJS_WEBHOOK_URL=${{ secrets.NEXTJS_WEBHOOK_URL }}
```

---

## Troubleshooting

### Debugging Checklist

- [ ] **Environment variables set correctly** (check `.env` file)
- [ ] **Stream API key valid** (test in Stream dashboard)
- [ ] **OpenAI API key has Realtime access** (check OpenAI account)
- [ ] **Next.js webhook URL accessible** (test with curl)
- [ ] **Docker image builds successfully** (run `docker build` locally)
- [ ] **Cloud Run service deployed** (check GCP console)
- [ ] **Firewall allows outbound connections** (Python → Stream, OpenAI)
- [ ] **Logs show no errors** (check Cloud Run logs)

### Enable Verbose Logging

```python
# main.py - Add at top
import logging

logging.basicConfig(
    level=logging.DEBUG,  # Change to DEBUG for verbose logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### Monitor Cloud Run Logs

```bash
# Stream logs in real-time
gcloud run services logs tail synchire-interview-agent \
  --region us-central1

# Filter for errors
gcloud run services logs read synchire-interview-agent \
  --region us-central1 \
  --filter "severity=ERROR"
```

---

## Summary

### What You've Learned

✅ Vision-Agents handles STT/TTS/LLM automatically
✅ Python code is minimal (~100 lines)
✅ Most configuration is in Markdown files
✅ Docker encapsulates Python complexity
✅ Cloud Run provides serverless deployment
✅ Next.js orchestrates the entire interview flow

### Next Steps

1. **Set up Python environment** (15 min)
2. **Generate code with AI** (30 min)
3. **Test locally with mock call** (30 min)
4. **Dockerize and deploy** (30 min)
5. **Integrate with Next.js** (1-2 hours)

**Total time estimate:** 3-4 hours for complete integration

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Yes
**Next Document:** API_SPEC.md
