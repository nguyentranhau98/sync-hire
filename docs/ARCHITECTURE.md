# SyncHire System Architecture

**Version:** 1.0
**Status:** Design Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Diagram](#architecture-diagram)
4. [Technology Stack](#technology-stack)
5. [Component Details](#component-details)
6. [Data Flow](#data-flow)
7. [Interview Flow](#interview-flow)
8. [API Design](#api-design)
9. [Security & Authentication](#security--authentication)
10. [Performance Requirements](#performance-requirements)
11. [Deployment Architecture](#deployment-architecture)
12. [Scalability Considerations](#scalability-considerations)

---

## Executive Summary

SyncHire is a real-time AI-powered interview platform that combines:
- **Async Preparation:** AI generates personalized interview questions from JD + CV
- **Real-time Conversation:** AI conducts natural, adaptive video interviews
- **Async Post-Processing:** AI analyzes performance and generates summaries

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary Framework** | Next.js 14 (App Router) | Full-stack TypeScript, excellent DX |
| **AI Agent Server** | Python Vision-Agents | Built-in STT/TTS/LLM, video processing |
| **Video Infrastructure** | Stream Video SDK | Managed WebRTC, <30ms latency |
| **Database** | PostgreSQL (Supabase) | Relational data, real-time subscriptions |
| **AI Models** | Gemini 2.0 Flash + OpenAI | Cost-effective, multi-provider fallback |
| **Deployment** | Vercel + Cloud Run | Serverless, auto-scaling |

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACES                          │
│  - Employer Dashboard (Job posting, CV review)              │
│  - Candidate Portal (Application, Interview room)           │
│  - Interview Room (Real-time video + AI conversation)       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION (Primary)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │  API Routes  │  │   Database   │      │
│  │   (React)    │  │ (Serverless) │  │  (Postgres)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Handles:                                                   │
│  - Authentication (NextAuth.js)                             │
│  - JD/CV processing (Gemini API)                            │
│  - Question generation                                      │
│  - Interview scheduling                                     │
│  - Results dashboard                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/WebSocket
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          PYTHON AGENT SERVER (Microservice)                 │
│  ┌──────────────────────────────────────────┐               │
│  │      Vision-Agents Framework             │               │
│  │  - AI Interviewer Agent                  │               │
│  │  - Real-time conversation management     │               │
│  │  - STT/TTS/LLM orchestration             │               │
│  │  - Video frame processing (optional)     │               │
│  └──────────────────────────────────────────┘               │
│                                                             │
│  Minimal Python code: ~100 lines                            │
│  Containerized via Docker                                   │
│  Deployed to Google Cloud Run                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ WebRTC via Stream Edge
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           STREAM VIDEO SDK (Managed Service)                │
│  - WebRTC signaling & media routing                         │
│  - Ultra-low latency (<30ms)                                │
│  - Automatic scaling                                        │
│  - Recording & storage                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ WebRTC Connection
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              CANDIDATE BROWSER                              │
│  - Stream Video React SDK                                   │
│  - Camera/Microphone access                                 │
│  - Real-time video/audio streaming                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagram

### Component Interaction Flow

```
┌──────────────┐
│   Employer   │
└──────┬───────┘
       │ 1. Submit JD
       ▼
┌─────────────────────────┐
│   Next.js API Routes    │
│  /api/jobs/create       │
└──────┬──────────────────┘
       │ 2. Generate questions (Gemini API)
       │ 3. Store in PostgreSQL
       ▼
┌─────────────────────────┐
│   PostgreSQL Database   │
│  Jobs, Questions        │
└─────────────────────────┘

┌──────────────┐
│  Candidate   │
└──────┬───────┘
       │ 1. Submit CV
       ▼
┌─────────────────────────┐
│   Next.js API Routes    │
│  /api/applications      │
└──────┬──────────────────┘
       │ 2. Parse CV (Gemini API)
       │ 3. Personalize questions
       │ 4. Store application
       ▼
┌─────────────────────────┐
│  PostgreSQL Database    │
│  Applications, CV data  │
└─────────────────────────┘

┌──────────────┐
│  HR Approves │
└──────┬───────┘
       │ 1. Trigger interview
       ▼
┌─────────────────────────────────┐
│   Next.js API Routes            │
│  /api/interview/start           │
│                                 │
│  1. Create Stream call          │
│  2. Generate Stream token       │
│  3. Invite Python agent         │
│  4. Send interview config       │
└──────┬──────────────────────────┘
       │
       │ HTTP POST /join-interview
       ▼
┌─────────────────────────────────┐
│   Python Agent Server           │
│  (Vision-Agents)                │
│                                 │
│  1. Receive interview config    │
│  2. Load questions              │
│  3. Join Stream call            │
│  4. Initialize AI agent         │
└──────┬──────────────────────────┘
       │
       │ Connect to Stream Edge
       ▼
┌─────────────────────────────────┐
│   Stream Video Edge Network     │
│  (Managed WebRTC)               │
│                                 │
│  - AI Agent (audio only)        │
│  - Candidate (video + audio)    │
└──────┬──────────────────────────┘
       │
       │ Real-time conversation
       │ (STT → LLM → TTS pipeline)
       │
       │ 5-10 minutes interview
       │
       │ Interview ends
       ▼
┌─────────────────────────────────┐
│   Python Agent Server           │
│                                 │
│  1. Generate summary            │
│  2. Send webhook to Next.js     │
└──────┬──────────────────────────┘
       │
       │ POST /api/webhooks/interview-complete
       ▼
┌─────────────────────────────────┐
│   Next.js API Routes            │
│                                 │
│  1. Store transcript            │
│  2. Store summary               │
│  3. Calculate scores            │
│  4. Notify employer             │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│   Employer Dashboard            │
│  - View recording               │
│  - Read transcript              │
│  - Review AI summary            │
│  - Make hiring decision         │
└─────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Next.js)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Server-side rendering, API routes |
| **UI Library** | React 18 | Component-based UI |
| **Styling** | Tailwind CSS + Shadcn UI | Rapid UI development |
| **State Management** | Zustand | Lightweight state management |
| **Form Handling** | React Hook Form + Zod | Type-safe forms |
| **Video SDK** | Stream Video React SDK | WebRTC video calls |
| **Animations** | Framer Motion | Smooth UI transitions |

### Backend (Next.js API Routes)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | Next.js API Routes | Serverless API endpoints |
| **Database ORM** | Prisma | Type-safe database access |
| **Database** | PostgreSQL (Supabase) | Relational data storage |
| **Authentication** | NextAuth.js | OAuth + credentials auth |
| **File Storage** | Supabase Storage | CV/video file storage |
| **AI Integration** | Google Gemini API | Question generation, CV analysis |

### AI Agent Server (Python)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Vision-Agents | Real-time AI agent framework |
| **LLM Provider** | OpenAI Realtime API | Primary conversational AI |
| **LLM Fallback** | Google Gemini Live | Cost-effective alternative |
| **STT** | Deepgram (via Vision-Agents) | Speech-to-text |
| **TTS** | ElevenLabs (via Vision-Agents) | Text-to-speech |
| **Video Processing** | YOLO (optional) | Engagement detection |
| **Web Server** | FastAPI (optional) | HTTP endpoints for Next.js |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Hosting** | Vercel | Next.js deployment |
| **Agent Hosting** | Google Cloud Run | Python container deployment |
| **Video Infrastructure** | Stream Video | WebRTC managed service |
| **Database** | Supabase (PostgreSQL) | Managed database + auth |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking, performance |
| **CI/CD** | GitHub Actions | Automated testing + deployment |

---

## Component Details

### 1. Next.js Application (Primary Codebase - 90%)

**Responsibilities:**
- User authentication and authorization
- Employer portal (job posting, CV review, results)
- Candidate portal (application, interview scheduling)
- JD → Question generation (via Gemini API)
- CV → Personalization (via Gemini API)
- Interview session orchestration
- Results dashboard and analytics
- Database operations (Prisma + PostgreSQL)

**Key Features:**
- Server-side rendering for SEO
- API routes for serverless backend
- Real-time updates via Supabase subscriptions
- File upload handling (CVs, company logos)
- Email notifications (optional)

**Code Structure:**
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (employer)/
│   │   ├── dashboard/page.tsx
│   │   ├── jobs/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── applications/page.tsx
│   ├── (candidate)/
│   │   ├── dashboard/page.tsx
│   │   ├── apply/[jobId]/page.tsx
│   │   └── interview/[id]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── jobs/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── [id]/route.ts (GET, PUT, DELETE)
│   │   │   └── [id]/generate-questions/route.ts
│   │   ├── applications/
│   │   │   ├── route.ts
│   │   │   └── [id]/personalize/route.ts
│   │   ├── interview/
│   │   │   ├── start/route.ts
│   │   │   ├── end/route.ts
│   │   │   └── token/route.ts
│   │   └── webhooks/
│   │       └── interview-complete/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/ (Shadcn components)
│   ├── InterviewRoom.tsx
│   ├── AIAvatar.tsx
│   ├── LiveTranscript.tsx
│   └── VideoPlayer.tsx
├── lib/
│   ├── prisma.ts
│   ├── stream.ts
│   ├── gemini.ts
│   └── auth.ts
└── types/
    └── index.ts
```

### 2. Python Agent Server (Microservice - 10%)

**Responsibilities:**
- Run AI interviewer agent
- Handle real-time conversation
- Manage STT/TTS/LLM pipeline
- Process video frames (optional)
- Send webhooks to Next.js on completion

**Key Features:**
- Minimal code (~100 lines)
- Stateless (receives config at runtime)
- Auto-restarts via Cloud Run
- Horizontal scaling support

**Code Structure:**
```
interview-agent/
├── main.py                    # Agent initialization (~60 lines)
├── config.py                  # Environment variables (~30 lines)
├── interview_instructions.md  # Agent personality (configuration)
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Container definition
├── .env.example               # Example environment variables
└── README.md                  # Setup instructions
```

**Example main.py:**
```python
import asyncio
from vision_agents import Agent, User
from vision_agents.integrations import getstream, openai

async def main():
    agent = Agent(
        edge=getstream.Edge(),
        agent_user=User(name="AI Interviewer", id="agent"),
        instructions=open("interview_instructions.md").read(),
        llm=openai.Realtime(fps=10),
    )

    await agent.create_user()
    await agent.listen_for_calls()

if __name__ == "__main__":
    asyncio.run(main())
```

### 3. Stream Video SDK Integration

**Responsibilities:**
- WebRTC signaling and media routing
- Real-time video/audio streaming
- Call recording
- Participant management

**Integration Points:**

**Next.js Frontend:**
```typescript
import { StreamVideo, StreamCall } from '@stream-io/video-react-sdk';

const client = new StreamVideoClient({ apiKey, user, token });
const call = client.call('default', callId);
await call.join();
```

**Python Agent:**
```python
# Automatically handled by Vision-Agents
await agent.join_call(call_id)
```

---

## Data Flow

### Interview Creation Flow

1. **Employer submits JD** → Next.js API (`POST /api/jobs`)
2. **Gemini generates questions** → Stored in PostgreSQL
3. **Candidate submits CV** → Next.js API (`POST /api/applications`)
4. **Gemini personalizes questions** → Stored in PostgreSQL
5. **HR approves candidate** → Next.js triggers interview creation

### Real-Time Interview Flow

1. **Next.js creates Stream call** → Returns `callId` and `token`
2. **Next.js invites Python agent** → `POST {PYTHON_URL}/join-interview`
3. **Python agent joins call** → Connects to Stream Edge
4. **Candidate joins call** → Stream Video SDK in browser
5. **AI conducts interview:**
   - Candidate speaks → **STT** → Transcript
   - Transcript → **LLM** → Next question
   - Next question → **TTS** → Audio played to candidate
6. **Interview ends** → Python sends webhook to Next.js
7. **Next.js processes results** → Stores transcript, summary, score

### Data Storage Flow

```
Interview Session:
├── PostgreSQL (metadata)
│   ├── interview_id
│   ├── candidate_id
│   ├── job_id
│   ├── status
│   ├── started_at
│   └── ended_at
├── Supabase Storage (files)
│   ├── video_recording.webm
│   └── audio_track.mp3
└── PostgreSQL (results)
    ├── transcript (TEXT)
    ├── summary (TEXT)
    ├── score (INTEGER)
    ├── insights (JSONB)
    └── questions_asked (JSONB)
```

---

## Interview Flow

### Phase 1: Preparation (Async)

**Timeline: 1-2 days before interview**

1. Employer posts job → AI generates 30-40 questions (30-60s)
2. Candidate submits CV → AI personalizes questions (20-30s)
3. HR reviews applications → Approves candidates for interview
4. System sends interview invite to candidate

### Phase 2: Real-Time Interview

**Timeline: 5-10 minutes**

```
00:00 - Candidate joins interview room
00:05 - AI greets candidate: "Hi John! Excited to learn about your React experience..."
00:30 - AI asks first question (personalized from CV)
01:00 - Candidate responds (30-60 seconds)
01:30 - AI generates adaptive follow-up (1-2 seconds!) ⚡
02:00 - AI asks follow-up question
02:30 - Candidate responds
03:00 - AI moves to new topic
...
08:00 - AI asks final question
09:00 - AI thanks candidate: "Thanks John! We'll be in touch."
09:30 - Interview ends, recording saved
```

**Key Timings:**
- **AI response latency:** 1.1-1.75 seconds (first token)
- **Complete question:** 2.5-5 seconds
- **Voice activity detection:** 2 seconds of silence
- **Total questions:** 8-10 adaptive questions

### Phase 3: Post-Processing (Async)

**Timeline: 30-60 seconds after interview**

1. Python agent generates summary (Gemini API) - 30s
2. Webhook sent to Next.js with results
3. Next.js stores transcript, summary, score
4. Employer receives notification
5. Results visible on dashboard

---

## API Design

### Next.js API Routes

#### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Get current session

#### Jobs (Employer)
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - List all jobs for employer
- `GET /api/jobs/[id]` - Get job details
- `PUT /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `POST /api/jobs/[id]/generate-questions` - AI generates questions

#### Applications (Candidate)
- `POST /api/applications` - Submit application with CV
- `GET /api/applications` - List applications for candidate
- `GET /api/applications/[id]` - Get application status
- `POST /api/applications/[id]/personalize` - AI personalizes interview

#### Interviews
- `POST /api/interview/start` - Create interview session
- `POST /api/interview/end` - End interview manually
- `GET /api/interview/[id]/token` - Generate Stream token
- `GET /api/interview/[id]/status` - Get interview status
- `GET /api/interview/[id]/results` - Get interview results

#### Webhooks
- `POST /api/webhooks/interview-complete` - Receive interview completion from Python

### Python Agent Endpoints

- `POST /join-interview` - Invite agent to join interview
  ```json
  {
    "callId": "interview-123",
    "questions": ["Q1", "Q2", "Q3"],
    "candidateName": "John Doe",
    "jobTitle": "Full Stack Developer"
  }
  ```

- `GET /health` - Health check endpoint

---

## Security & Authentication

### Next.js (NextAuth.js)

**Providers:**
- Email/Password (credentials)
- Google OAuth (optional)
- LinkedIn OAuth (optional)

**Session Management:**
- JWT tokens stored in HTTP-only cookies
- Session timeout: 7 days
- Refresh token rotation

**Authorization:**
- Role-based access control (Employer, Candidate, Admin)
- API route protection via middleware
- Database row-level security (Supabase)

### Stream Video

**Token Generation:**
```typescript
// Server-side only
import { StreamClient } from '@stream-io/node-sdk';

const client = new StreamClient(apiKey, apiSecret);
const token = client.generateUserToken({
  user_id: userId,
  exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
});
```

**Call Permissions:**
- Only invited participants can join
- Recording permission per user
- Moderator controls (employer/admin)

### Python Agent

**Authentication:**
- Stream API key (server-side only)
- No user authentication needed
- Environment variables for secrets
- HTTPS only for webhooks

**Network Security:**
- Cloud Run private network
- Only accepts requests from Next.js (IP whitelist)
- Rate limiting on endpoints

---

## Performance Requirements

### Latency Targets

| Metric | Target | Actual (Expected) |
|--------|--------|-------------------|
| **AI first token** | <2s | 1.1-1.75s ✅ |
| **Complete AI response** | <5s | 2.5-5s ✅ |
| **Video latency** | <100ms | <30ms ✅ (Stream Edge) |
| **STT latency** | <1s | 200-300ms ✅ |
| **Question generation (prep)** | <60s | 30-60s ✅ |

### Scalability Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Concurrent interviews** | 100+ | Cloud Run auto-scaling |
| **Database queries** | <100ms | Prisma connection pooling |
| **API response time** | <500ms | Edge caching, CDN |
| **Video quality** | 720p @ 30fps | Stream adaptive bitrate |

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│  ┌──────────────────────────────────────────────┐           │
│  │          Next.js Application                 │           │
│  │  - Edge Functions (API Routes)               │           │
│  │  - Static Site Generation                    │           │
│  │  - Automatic HTTPS                           │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  Features:                                                  │
│  - Global CDN                                               │
│  - Automatic deployments (GitHub integration)               │
│  - Preview deployments for PRs                              │
│  - Environment variables management                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   GOOGLE CLOUD RUN                          │
│  ┌──────────────────────────────────────────────┐           │
│  │     Python Vision-Agents Container           │           │
│  │  - Serverless container execution            │           │
│  │  - Auto-scaling (0 to N instances)           │           │
│  │  - WebSocket support                         │           │
│  └──────────────────────────────────────────────┘           │
│                                                             │
│  Configuration:                                             │
│  - Min instances: 0 (cost optimization)                     │
│  - Max instances: 10 (concurrency limit)                    │
│  - Timeout: 3600s (1 hour for long interviews)             │
│  - Memory: 512MB-1GB                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                              │
│  ┌──────────────────────────────────────────────┐           │
│  │          PostgreSQL Database                 │           │
│  │  - Automatic backups                         │           │
│  │  - Connection pooling                        │           │
│  │  - Row-level security                        │           │
│  └──────────────────────────────────────────────┘           │
│  ┌──────────────────────────────────────────────┐           │
│  │            Object Storage                    │           │
│  │  - CV uploads                                │           │
│  │  - Video recordings (fallback)               │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     STREAM VIDEO                            │
│  - Global edge network                                      │
│  - WebRTC infrastructure                                    │
│  - Automatic recording & storage                            │
│  - 99.99% uptime SLA                                        │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Process

**Next.js (Vercel):**
```bash
# Automatic deployment on git push
git push origin main

# Vercel automatically:
# 1. Builds Next.js app
# 2. Runs tests
# 3. Deploys to production
# 4. Invalidates CDN cache
```

**Python Agent (Cloud Run):**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/interview-agent
gcloud run deploy interview-agent \
  --image gcr.io/PROJECT_ID/interview-agent \
  --region us-central1 \
  --set-env-vars STREAM_API_KEY=xxx,OPENAI_API_KEY=xxx
```

---

## Scalability Considerations

### Database Scaling

**Optimization Strategies:**
- Connection pooling (Prisma + Supabase)
- Read replicas for analytics queries
- Indexing on frequently queried columns
- Archival of old interviews (>6 months)

**Schema Optimization:**
```sql
-- Indexes for performance
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_job ON interviews(job_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_applications_job ON applications(job_id);

-- Partitioning (future)
-- Partition interviews table by created_at (monthly)
```

### Python Agent Scaling

**Cloud Run Configuration:**
- **Concurrency:** 1 request per container (1 interview = 1 instance)
- **Auto-scaling:** 0 to 10 instances (adjust based on usage)
- **Cold start:** ~3-5 seconds (acceptable for interview prep)

**Cost Optimization:**
- Min instances = 0 (scale to zero when idle)
- Request timeout = 3600s (1 hour max interview length)
- CPU always allocated (WebRTC requires consistent performance)

### Video Infrastructure

**Stream Video Handles:**
- Automatic edge routing (lowest latency)
- Adaptive bitrate (network resilience)
- Recording storage (included in pricing)
- Unlimited concurrent calls (based on plan)

**No manual scaling required!**

---

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Video Analysis (Vision-Agents)**
   - Engagement detection (eye contact, posture)
   - Emotion recognition
   - Distraction detection (phone usage)
   - Background professionalism scoring

2. **Advanced AI Features**
   - Multi-language support
   - Industry-specific question banks
   - Behavioral question analysis
   - Technical skill assessment (coding challenges)

3. **Employer Tools**
   - Team collaboration (multiple reviewers)
   - Custom scoring rubrics
   - Interview templates
   - Bulk candidate processing

4. **Candidate Experience**
   - Mock interview practice mode
   - Interview preparation resources
   - Performance feedback
   - Interview rescheduling

### Technical Debt & Optimizations

- [ ] Implement Redis caching for frequently accessed data
- [ ] Add WebSocket real-time updates (instead of polling)
- [ ] Implement background job queue (Bull/BullMQ)
- [ ] Add comprehensive error tracking (Sentry)
- [ ] Implement A/B testing framework
- [ ] Add performance monitoring (Datadog/New Relic)
- [ ] Implement rate limiting on API routes
- [ ] Add automated integration tests

---

## Appendix

### Key Repositories & Documentation

- **Next.js:** https://nextjs.org/docs
- **Vision-Agents:** https://github.com/GetStream/Vision-Agents
- **Stream Video SDK:** https://getstream.io/video/docs/react/
- **Supabase:** https://supabase.com/docs
- **Prisma:** https://www.prisma.io/docs
- **Shadcn UI:** https://ui.shadcn.com

### Environment Variables

**Next.js (.env.local):**
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Stream
NEXT_PUBLIC_STREAM_API_KEY="..."
STREAM_API_SECRET="..."

# AI
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."

# Python Agent
PYTHON_AGENT_URL="https://agent.example.com"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

**Python Agent (.env):**
```env
STREAM_API_KEY="..."
OPENAI_API_KEY="..."
NEXTJS_WEBHOOK_URL="https://app.example.com/api/webhooks"
```

---

**Document Status:** ✅ Complete
**Review Status:** Pending technical review
**Next Steps:** Create VISION_AGENTS_INTEGRATION.md
