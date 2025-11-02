# Project Context

## Purpose

SyncHire is a real-time AI-powered interview platform that revolutionizes the hiring process through conversational AI. The platform combines:

- **Async Preparation:** AI automatically generates personalized interview questions from job descriptions and analyzes candidate CVs to personalize the interview experience
- **Real-time Conversation:** AI conducts natural, adaptive video interviews with sub-2-second response latency, creating a professional and engaging candidate experience
- **Async Post-Processing:** AI analyzes interview performance, generates detailed summaries with scoring, and provides hiring recommendations

**Core Value Proposition:** Enable employers to conduct consistent, scalable technical interviews while providing candidates with a professional, low-pressure interview experience.

**Key Features:**
- AI-generated interview questions (30-40 per job posting)
- CV analysis and automatic question personalization
- Real-time voice conversations with AI interviewer (5-10 minutes)
- Automatic transcription and performance analysis
- Structured interview results with hiring recommendations
- Recording storage and playback for review

## Tech Stack

### Frontend & Primary Backend (90% of codebase)
- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + Shadcn UI components
- **State Management:** Zustand (lightweight, TypeScript-first)
- **Form Handling:** React Hook Form + Zod validation
- **Video SDK:** Stream Video React SDK (WebRTC)
- **Animations:** Framer Motion

### Backend Services
- **API Framework:** Next.js API Routes (serverless)
- **Database ORM:** Prisma
- **Database:** PostgreSQL via Supabase
- **Authentication:** NextAuth.js (JWT sessions, OAuth support)
- **File Storage:** Supabase Storage (CV uploads, recordings)
- **AI Integration:** Google Gemini 2.0 Flash (question generation, CV analysis, summary generation)

### AI Interview Agent (10% of codebase - Python Microservice)
- **Framework:** GetStream Vision-Agents
- **Language:** Python 3.13
- **LLM Provider:** OpenAI Realtime API (primary)
- **LLM Fallback:** Google Gemini Live (cost-effective alternative)
- **STT:** Deepgram (via Vision-Agents integration)
- **TTS:** ElevenLabs (via Vision-Agents integration)
- **Web Server:** FastAPI (optional HTTP endpoints)
- **Deployment:** Docker container on Google Cloud Run

### Infrastructure & Services
- **Frontend Hosting:** Vercel (Next.js deployment with edge functions)
- **Agent Hosting:** Google Cloud Run (Python container, serverless)
- **Video Infrastructure:** Stream Video (managed WebRTC service)
- **Database:** Supabase (managed PostgreSQL with real-time subscriptions)
- **Monitoring:** Sentry + Vercel Analytics
- **CI/CD:** GitHub Actions

## Project Conventions

### Code Style

**TypeScript/JavaScript:**
- **Strict TypeScript:** Enable all strict compiler options
- **No implicit any:** All types must be explicitly declared
- **Naming Conventions:**
  - Components: PascalCase (e.g., `InterviewRoom.tsx`)
  - Functions: camelCase (e.g., `generateQuestions()`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_INTERVIEW_DURATION`)
  - Types/Interfaces: PascalCase with "I" prefix for interfaces (e.g., `IUser`, `JobPosting`)
- **File Organization:**
  - One component per file
  - Co-locate tests with source files (e.g., `InterviewRoom.test.tsx`)
  - Export named exports (no default exports except for Next.js pages)
- **Formatting:** Prettier with 2-space indentation, single quotes, trailing commas
- **Linting:** ESLint with TypeScript plugin, React hooks rules

**Python:**
- **Type Hints:** Use Python type hints for all function signatures
- **Naming Conventions:**
  - Classes: PascalCase (e.g., `InterviewAgent`)
  - Functions/methods: snake_case (e.g., `join_interview()`)
  - Constants: UPPER_SNAKE_CASE (e.g., `AGENT_TIMEOUT`)
- **Docstrings:** Use Google-style docstrings for all public functions
- **Formatting:** Black formatter with 88-character line length
- **Linting:** Flake8 + mypy for type checking

**General Rules:**
- **No shorthand if conditions** - Always use explicit conditions (never use `if (foo)` - use `if (foo !== null && foo !== undefined)`)
- **Never use try/catch in tests** - Always use `expect(...).rejects.toThrow()` for async error testing
- **No emojis in code** - Professional codebase, emojis only in user-facing UI when explicitly requested
- **Comments:** Explain "why" not "what" - code should be self-documenting

### Architecture Patterns

**Hybrid Architecture (Next.js + Python):**
- **Next.js handles:** 90% of application logic (auth, CRUD, UI, AI question generation)
- **Python microservice handles:** 10% of application logic (real-time interview agent only)
- **Communication:** HTTP/REST for invitations, webhooks for completion events
- **Separation of concerns:** Next.js = orchestration, Python = real-time conversation

**API Design:**
- **RESTful conventions:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **Consistent response format:** Always return JSON with `{ data, error, message }` structure
- **Error handling:** Standardized error responses with HTTP status codes and error codes
- **Pagination:** Query parameters `?page=1&limit=20` for all list endpoints
- **Filtering/Sorting:** Query parameters for complex queries
- **Versioning:** Prepare for `/api/v1/...` in future (currently unversioned)

**Database Patterns:**
- **Prisma ORM:** Type-safe database access with generated types
- **Migrations:** All schema changes via Prisma migrations
- **Connection pooling:** Use Prisma connection pooling for serverless
- **Row-level security:** Implement via Supabase policies
- **Soft deletes:** Prefer status fields over hard deletes for important entities
- **Timestamps:** All tables have `createdAt` and `updatedAt` fields

**Frontend Patterns:**
- **Server Components:** Use React Server Components by default (Next.js 14 App Router)
- **Client Components:** Only mark as `'use client'` when necessary (interactivity, hooks)
- **Data Fetching:** Server-side data fetching in Server Components, SWR for client-side
- **Route Handlers:** API routes in `app/api/` directory
- **Layouts:** Shared layouts for common UI patterns
- **Loading/Error States:** Use `loading.tsx` and `error.tsx` conventions

**State Management:**
- **Server State:** Fetch on server, pass to components via props
- **Client State:** Zustand for global client state (user session, UI preferences)
- **Form State:** React Hook Form for complex forms
- **URL State:** Use search params for shareable state

**Real-time Interview Flow:**
- **Phase 1 - Preparation (Async):**
  - Employer submits JD → Gemini generates questions (30-60s)
  - Candidate submits CV → Gemini personalizes questions (20-30s)
- **Phase 2 - Interview (Real-time):**
  - Next.js creates Stream call → Invites Python agent → Returns token to candidate
  - Python agent conducts 5-10 minute interview with sub-2s response latency
  - Stream handles WebRTC media routing (<30ms latency)
- **Phase 3 - Post-processing (Async):**
  - Python sends webhook with transcript → Gemini generates summary (30s)
  - Next.js stores results and notifies employer

### Testing Strategy

**Unit Tests:**
- **Framework:** Jest + React Testing Library
- **Coverage Target:** 80% for critical business logic
- **Location:** Co-located with source files (`*.test.ts`, `*.test.tsx`)
- **Naming:** Describe behavior, not implementation (e.g., `it('should return 401 when token is invalid')`)
- **Async Testing:** Use `expect(...).rejects.toThrow()` - NEVER use try/catch in tests
- **Mocking:** Mock external services (AI APIs, database) in unit tests

**Integration Tests:**
- **Framework:** Playwright for E2E tests
- **Critical Flows:**
  - User registration and login
  - Job creation and question generation
  - Application submission and CV analysis
  - Interview start and completion (mocked Stream call)
- **Database:** Use test database with seed data
- **CI Integration:** Run on every PR in GitHub Actions

**API Tests:**
- **Framework:** Jest with Supertest
- **Coverage:** All API endpoints
- **Auth Testing:** Test both authenticated and unauthenticated scenarios
- **Error Cases:** Test validation errors, authorization failures

**Python Tests:**
- **Framework:** pytest
- **Coverage:** Core agent logic, webhook handling
- **Mocking:** Mock Stream SDK, OpenAI API

**Test Data:**
- **Fixtures:** Use Prisma seed files for consistent test data
- **Factories:** Create test data factories for complex objects
- **Cleanup:** Always cleanup test data after tests

### Git Workflow

**Branching Strategy:**
- **Main Branch:** `master` (production-ready code)
- **Feature Branches:** `feature/description` (e.g., `feature/ai-question-generation`)
- **Bugfix Branches:** `bugfix/description` (e.g., `bugfix/login-redirect`)
- **Hotfix Branches:** `hotfix/description` (critical production fixes)

**Commit Conventions:**
- **Format:** `<type>: <description>` (e.g., `feat: add CV analysis endpoint`)
- **Types:**
  - `feat:` New feature
  - `fix:` Bug fix
  - `refactor:` Code refactoring (no functional changes)
  - `docs:` Documentation updates
  - `test:` Test additions/updates
  - `chore:` Build/tooling changes
  - `style:` Code formatting (no logic changes)
- **Message Style:**
  - Use imperative mood ("add" not "added")
  - First line max 72 characters
  - Include context in body if needed
  - Always include AI co-author footer when using Claude Code:
    ```
    Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>
    ```

**Pull Request Process:**
1. Create feature branch from `master`
2. Implement feature with tests
3. Run linters and tests locally
4. Create PR with descriptive title and description
5. Wait for CI checks to pass
6. Request review from team
7. Address review feedback
8. Squash merge into `master`

**Pre-commit Hooks:**
- Prettier formatting check
- ESLint validation
- TypeScript type checking
- Unit test execution
- Commit message format validation

**Deployment:**
- **Automatic:** Push to `master` triggers deployment to production (Vercel + Cloud Run)
- **Preview:** Each PR gets preview deployment on Vercel
- **Rollback:** Use Vercel deployment history or revert commit

## Domain Context

### Interview Industry Knowledge

**Interview Types:**
- **Technical Screening:** 30-45 minute initial assessment of technical skills
- **Behavioral Interview:** 45-60 minutes assessing soft skills, culture fit
- **System Design:** 60-90 minutes for senior roles (future feature)
- **Coding Challenge:** Live coding exercises (future feature)

**Question Categories:**
- **Technical:** Language-specific, framework knowledge, best practices
- **Behavioral:** STAR method (Situation, Task, Action, Result)
- **Problem-Solving:** Approach to debugging, optimization, architecture
- **Experience-Based:** CV-driven questions about past projects

**Scoring Methodology:**
- **Technical Depth:** 1-10 scale (understanding of concepts)
- **Communication:** 1-10 scale (clarity, structure of responses)
- **Experience Relevance:** How well experience matches job requirements
- **Overall Score:** 0-100 composite score with recommendation (Strong Hire / Hire / Maybe / No Hire)

### AI/LLM Knowledge

**Latency Requirements:**
- **First Token:** <2 seconds (user perceives as instant)
- **Complete Response:** <5 seconds (natural conversation flow)
- **Voice Activity Detection:** 2 seconds of silence = candidate finished speaking

**Model Selection:**
- **Gemini 2.0 Flash:** Fast, cost-effective for question generation ($0.30/1M tokens)
- **OpenAI Realtime API:** Best for natural conversation, low latency
- **OpenAI GPT-4o:** Fallback for complex analysis (more expensive but higher quality)

**Prompt Engineering:**
- **Structured Outputs:** Request JSON format for parsing
- **Few-Shot Examples:** Provide examples for consistent output
- **Role Prompting:** "You are a professional technical interviewer..."
- **Context Injection:** Include JD, CV, candidate name for personalization

### Video/Audio Technology

**WebRTC Fundamentals:**
- **Signaling:** Stream SDK handles connection negotiation
- **Media Routing:** Stream Edge network provides <30ms latency
- **Recording:** Automatic server-side recording via Stream
- **Quality:** Adaptive bitrate (720p @ 30fps target)

**Audio Processing:**
- **STT (Speech-to-Text):** Deepgram streaming with 250ms chunks
- **TTS (Text-to-Speech):** ElevenLabs for natural voice synthesis
- **Turn Detection:** Semantic understanding (not just silence detection)
- **Audio Quality:** 48kHz sample rate, Opus codec

## Important Constraints

### Technical Constraints

**Performance:**
- **AI Response Latency:** Must achieve <2 seconds for first token (critical UX requirement)
- **Video Latency:** Must maintain <100ms end-to-end (Stream Edge provides <30ms)
- **Database Queries:** Target <100ms for all queries (use indexes, connection pooling)
- **API Response Time:** Target <500ms for all endpoints

**Scalability:**
- **Concurrent Interviews:** Must support 100+ simultaneous interviews
- **Cloud Run Auto-scaling:** Min 0 instances (cost optimization), max 10 instances initially
- **Database Connections:** Prisma connection pooling for serverless (max 10 connections per instance)
- **File Storage:** Supabase storage limits (5GB free tier, upgrade for production)

**Cost Optimization:**
- **LLM Costs:** Prioritize Gemini 2.0 Flash ($0.30/1M tokens) over GPT-4o ($2.50/1M tokens)
- **Infrastructure:** Serverless (pay-per-use) over always-on servers
- **Cold Starts:** Accept 3-5 second cold start for Python agent (interview prep time absorbs this)

### Business Constraints

**Privacy & Compliance:**
- **GDPR Compliance:** User data deletion, data export, consent management
- **Recording Consent:** Explicit consent before starting interview recording
- **Data Retention:** Delete interview recordings after 90 days (configurable)
- **PII Protection:** Encrypt CV files, transcripts at rest

**User Experience:**
- **Interview Duration:** 5-10 minutes target (candidate attention span)
- **Question Count:** 8-10 questions per interview (balance depth vs. time)
- **Response Time:** Candidate should feel like natural conversation (no long pauses)
- **Error Recovery:** Graceful handling of connection issues (resume interview, save partial progress)

**AI Safety:**
- **Bias Prevention:** Diverse training data, regular bias audits
- **Fairness:** Consistent question difficulty, no leading questions
- **Transparency:** Clear disclosure that interviewer is AI
- **Human Review:** Employer can review full transcript and recording

### Platform Constraints

**Python Experience Limitation:**
- **Minimal Python Code:** Keep Python codebase <200 lines total
- **Configuration-First:** Use Markdown files for agent instructions (not code)
- **AI-Assisted Development:** Use ChatGPT/Claude to generate Python code
- **Docker Encapsulation:** Hide Python complexity in container
- **Clear Documentation:** Every Python function must have docstrings

**Third-Party Service Dependencies:**
- **Stream Video:** Required for WebRTC (no fallback - critical dependency)
- **OpenAI API:** Required for real-time conversation (Gemini Live as fallback)
- **Gemini API:** Required for question generation and summaries
- **Supabase:** Required for database and storage
- **Vercel:** Required for Next.js hosting

**Browser Compatibility:**
- **WebRTC Support:** Chrome/Edge (full support), Firefox (full support), Safari (limited)
- **Camera/Microphone:** Requires HTTPS for getUserMedia API
- **Mobile Support:** Phase 2 feature (MVP is desktop-only)

## External Dependencies

### AI/ML Services

**Google Gemini API:**
- **Usage:** Question generation, CV analysis, interview summary generation
- **Model:** `gemini-2.0-flash-exp` (fast, cost-effective)
- **Pricing:** $0.30 per 1M input tokens, $1.20 per 1M output tokens
- **Rate Limits:** 1,000 requests/minute (sufficient for MVP)
- **Fallback:** OpenAI GPT-4o for critical failures

**OpenAI API:**
- **Usage:** Real-time conversational AI (Realtime API)
- **Model:** `gpt-4o-realtime-preview`
- **Pricing:** $5.00 per 1M input tokens, $20.00 per 1M output tokens (audio)
- **Rate Limits:** Tier-based (need tier 2+ for production)
- **Fallback:** Gemini Live API (lower quality but cost-effective)

### Video/Communication Services

**Stream Video SDK:**
- **Usage:** WebRTC infrastructure, signaling, media routing, recording
- **Pricing:** $99/month (up to 1,000 MAU), then $0.05 per additional MAU
- **Features:** <30ms latency, automatic recording, global edge network
- **Documentation:** https://getstream.io/video/docs/
- **Support:** Email support, community Slack

**GetStream Vision-Agents (Python Framework):**
- **Usage:** Real-time AI agent framework (STT/TTS/LLM orchestration)
- **Pricing:** Open source (free)
- **Repository:** https://github.com/GetStream/Vision-Agents
- **Integration:** Pre-built integrations for Stream, OpenAI, Deepgram, ElevenLabs
- **Benefit:** Saves 44-65 hours of development time

### Database & Storage

**Supabase:**
- **Usage:** Managed PostgreSQL database + file storage + authentication
- **Pricing:** Free tier (500MB database, 1GB storage), then $25/month Pro
- **Features:** Real-time subscriptions, row-level security, automatic backups
- **Connection:** Prisma ORM with connection pooling
- **Documentation:** https://supabase.com/docs

### Speech Services

**Deepgram (via Vision-Agents):**
- **Usage:** Real-time speech-to-text transcription
- **Pricing:** $0.0043 per minute of audio
- **Latency:** 250ms chunks for real-time streaming
- **Accuracy:** 90%+ for clear English speech
- **Integration:** Automatic via Vision-Agents framework

**ElevenLabs (via Vision-Agents):**
- **Usage:** Text-to-speech voice synthesis
- **Pricing:** $5/month (30,000 characters), then $0.30 per 1,000 characters
- **Quality:** Natural-sounding, professional voices
- **Voices:** Professional male/female voices for interviewer
- **Integration:** Automatic via Vision-Agents framework

### Infrastructure

**Vercel:**
- **Usage:** Next.js hosting, serverless API routes, edge functions
- **Pricing:** Free (hobby), Pro $20/month (production)
- **Features:** Automatic deployments, preview environments, analytics
- **Limits:** 100GB bandwidth (free), 1TB (Pro)
- **Documentation:** https://vercel.com/docs

**Google Cloud Run:**
- **Usage:** Python agent container hosting (serverless)
- **Pricing:** Pay-per-use ($0.00002400 per vCPU-second)
- **Features:** Auto-scaling (0 to N instances), WebSocket support
- **Limits:** 3600s timeout (1 hour max interview), 1GB memory default
- **Documentation:** https://cloud.google.com/run/docs

### Monitoring & Analytics

**Sentry:**
- **Usage:** Error tracking, performance monitoring
- **Pricing:** Free (5,000 errors/month), then $26/month
- **Integration:** Next.js SDK, Python SDK
- **Features:** Source maps, release tracking, user feedback

**Vercel Analytics:**
- **Usage:** Web vitals, page views, user analytics
- **Pricing:** Included with Vercel Pro ($20/month)
- **Features:** Real user monitoring, Core Web Vitals tracking

### Development Tools

**Prisma:**
- **Usage:** Database ORM, migrations, type generation
- **Pricing:** Free (open source)
- **Features:** Type-safe queries, automatic migrations, VS Code extension
- **Documentation:** https://www.prisma.io/docs

**NextAuth.js:**
- **Usage:** Authentication library for Next.js
- **Pricing:** Free (open source)
- **Features:** JWT sessions, OAuth providers, email/password auth
- **Documentation:** https://next-auth.js.org

**Shadcn UI:**
- **Usage:** Accessible React components (copy-paste, not npm package)
- **Pricing:** Free (open source)
- **Components:** Buttons, forms, modals, dialogs, etc.
- **Documentation:** https://ui.shadcn.com

## Key Project Files

**Critical Configuration Files:**
- `/prisma/schema.prisma` - Database schema and models
- `/next.config.js` - Next.js configuration
- `/.env.local` - Next.js environment variables
- `/interview-agent/.env` - Python agent environment variables
- `/interview-agent/interview_instructions.md` - AI agent personality (Markdown configuration)

**Core Application Structure:**
- `/src/app/` - Next.js App Router pages and API routes
- `/src/components/` - React components (UI, Shadcn)
- `/src/lib/` - Shared utilities (Prisma client, AI clients)
- `/interview-agent/` - Python microservice (Vision-Agents)

**Documentation:**
- `/docs/ARCHITECTURE.md` - Complete system architecture (this is the source of truth)
- `/docs/API_SPEC.md` - API endpoint specifications with examples
- `/docs/VISION_AGENTS_INTEGRATION.md` - Python integration guide
- `/openspec/project.md` - This file (project context)
