# SyncHire - Product Requirements Document (PRD)
## Hackathon Edition

---

## 1. Executive Summary

**Product Name:** SyncHire  
**Product Type:** AI-Powered Interview Platform  
**Target Users:** HR Teams/Recruiters & Job Seekers  
**Core Value Proposition:** Automate recruitment interviews with AI while providing candidates realistic practice opportunities

---

## 2. Product Overview

### 2.1 Vision
Create an intelligent interview platform that streamlines the hiring process for companies while offering candidates valuable interview practice through AI-powered conversations.

### 2.2 Key Features
- **For Employers:** JD-based question generation, CV screening, automated AI interviews
- **For Candidates:** CV submission, mock interviews, real-time AI interaction with feedback
- **Core Technology:** AI-powered virtual interviewer with video/audio recording capabilities

### 2.3 Success Metrics (Hackathon MVP)
- Successfully conduct 1 complete AI interview flow
- Generate relevant questions from JD
- Record and analyze interview responses
- Provide basic interview summary

---

## 3. User Stories & Requirements

### 3.1 Employer/HR User Stories

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| E1 | As an HR manager, I want to submit a job description so that the system can generate relevant interview questions | P0 | - JD upload functionality<br>- AI generates 5-10 questions<br>- Questions saved to database |
| E2 | As an HR manager, I want to create screening questions (MCQ/short answer) for initial candidate filtering | P0 | - Question creation interface<br>- Support MCQ and text questions<br>- Link questions to JD |
| E3 | As an HR manager, I want to review and approve qualified CVs before triggering AI interviews | P0 | - CV review dashboard<br>- Approve/reject actions<br>- Trigger interview invitation |
| E4 | As an HR manager, I want to view interview recordings and summaries | P1 | - Access interview recordings<br>- View AI-generated insights<br>- Download summary report |

### 3.2 Candidate/Interviewee User Stories

| ID | User Story | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| C1 | As a candidate, I want to submit my CV and apply for positions | P0 | - CV upload (PDF/DOCX)<br>- Basic form fields<br>- Confirmation message |
| C2 | As a candidate, I want to answer screening questions after CV submission | P0 | - Display screening questions<br>- Submit answers<br>- Get qualification status |
| C3 | As a candidate, I want to participate in an AI video interview | P0 | - Join video call<br>- See AI avatar<br>- Record responses<br>- Time limit enforcement |
| C4 | As a candidate, I want to practice mock interviews (premium feature) | P2 | - Request mock interview<br>- Payment/subscription check<br>- Practice with AI |

---

## 4. Technical Architecture

### 4.1 Tech Stack
- **Frontend:** Next.js 14 (App Router)
- **Backend:** Next.js API Routes
- **AI/ML:** Google Vertex AI (Gemini)
- **Video:** WebRTC for peer-to-peer video
- **Database:** PostgreSQL/Supabase
- **Storage:** Cloud storage for recordings
- **Authentication:** NextAuth.js

### 4.2 Key Integrations
- Google Vertex AI for question generation and analysis
- WebRTC for video streaming
- Google Veo3 for avatar generation (if available, else use static avatar)
- Email service for notifications

---

## 5. Task Breakdown for Hackathon Team

### 5.1 Product Owner Tasks

#### Sprint Planning & Coordination (8 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| PO-1 | Create detailed user flow diagrams | 2h | P0 |
| PO-2 | Design wireframes/mockups for core screens | 3h | P0 |
| PO-3 | Define MVP scope and cut features for hackathon | 1h | P0 |
| PO-4 | Create sample JDs and CVs for testing | 1h | P0 |
| PO-5 | Coordinate team standup and task tracking | 1h | P0 |

#### Documentation & Testing (4 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| PO-6 | Write API documentation | 1h | P1 |
| PO-7 | Create demo script and presentation | 2h | P0 |
| PO-8 | Conduct user acceptance testing | 1h | P0 |

### 5.2 Developer 1 - Frontend & UI/UX

#### Core UI Development (12 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| FE-1 | Set up Next.js project with TypeScript | 1h | P0 |
| FE-2 | Implement authentication flow (login/register) | 2h | P0 |
| FE-3 | Create employer dashboard layout | 2h | P0 |
| FE-4 | Build JD submission form | 1h | P0 |
| FE-5 | Create CV review interface | 2h | P0 |
| FE-6 | Build candidate portal layout | 2h | P0 |
| FE-7 | Implement CV upload form | 1h | P0 |
| FE-8 | Create screening questions UI | 1h | P0 |

#### Video Interface (6 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| FE-9 | Build video call interface | 3h | P0 |
| FE-10 | Implement recording controls | 2h | P0 |
| FE-11 | Add timer and question display | 1h | P0 |

### 5.3 Developer 2 - Backend & AI Integration

#### Backend Infrastructure (8 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| BE-1 | Set up database schema (users, jobs, interviews) | 2h | P0 |
| BE-2 | Create API routes for authentication | 1h | P0 |
| BE-3 | Build JD CRUD operations | 1h | P0 |
| BE-4 | Implement CV upload and storage | 2h | P0 |
| BE-5 | Create interview session management | 2h | P0 |

#### AI Integration (10 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| BE-6 | Integrate Vertex AI for question generation | 3h | P0 |
| BE-7 | Implement CV parsing and analysis | 3h | P0 |
| BE-8 | Build interview response analysis | 2h | P0 |
| BE-9 | Create summary generation logic | 2h | P0 |

### 5.4 Developer 3 - WebRTC & Real-time Features

#### WebRTC Implementation (10 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| RT-1 | Set up WebRTC signaling server | 3h | P0 |
| RT-2 | Implement peer connection management | 2h | P0 |
| RT-3 | Build video/audio streaming | 3h | P0 |
| RT-4 | Add recording functionality | 2h | P0 |

#### AI Interviewer Features (8 hours)
| Task | Description | Duration | Priority |
|------|-------------|----------|----------|
| RT-5 | Implement AI avatar display (static/animated) | 2h | P0 |
| RT-6 | Build question queue system | 2h | P0 |
| RT-7 | Create speech-to-text integration | 2h | P0 |
| RT-8 | Add response timer and auto-progression | 2h | P0 |

---

## 6. MVP Feature Scope (Hackathon)

### 6.1 Must Have (P0)
- User registration/login (basic auth)
- JD submission and question generation
- CV upload and basic screening
- Single AI interview flow with recording
- Basic interview summary

### 6.2 Nice to Have (P1)
- Detailed analytics dashboard
- Multiple interview rounds
- Advanced CV parsing with ATS scoring
- Email notifications

### 6.3 Future Scope (P2)
- Mock interview subscription system
- Payment integration
- Advanced AI avatar with Veo3
- Multi-language support
- Google Meet integration

---

## 7. Database Schema (Simplified)

```sql
-- Core Tables for MVP
Users (id, email, password, role, created_at)
Jobs (id, employer_id, title, description, questions_json, created_at)
Applications (id, job_id, candidate_id, cv_url, status, created_at)
Interviews (id, application_id, recording_url, transcript, summary, duration, created_at)
ScreeningResponses (id, application_id, responses_json, score, created_at)
```

---

## 8. API Endpoints (Priority)

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/session

### Employer APIs
- POST /api/jobs (Create job with JD)
- GET /api/jobs/:id/applications (View applications)
- POST /api/applications/:id/approve (Approve for interview)
- GET /api/interviews/:id/summary (Get interview results)

### Candidate APIs
- POST /api/applications (Submit application with CV)
- POST /api/applications/:id/screening (Submit screening answers)
- GET /api/interviews/:id/join (Join interview session)
- POST /api/interviews/:id/response (Submit interview response)

### AI APIs
- POST /api/ai/generate-questions (Generate from JD)
- POST /api/ai/analyze-cv (Parse and score CV)
- POST /api/ai/analyze-interview (Generate summary)

---

## 9. Development Timeline (24-hour Hackathon)

### Hour 0-4: Setup & Planning
- Team alignment on PRD
- Environment setup
- Database design
- Initial project structure

### Hour 4-10: Core Development
- Authentication system
- Basic UI layouts
- Database implementation
- AI integration setup

### Hour 10-16: Feature Implementation
- JD submission flow
- CV upload and screening
- WebRTC setup
- Interview recording

### Hour 16-20: Integration
- Connect all components
- End-to-end testing
- Bug fixes
- AI response generation

### Hour 20-24: Polish & Demo
- UI improvements
- Demo preparation
- Documentation
- Presentation setup

---

## 10. Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| WebRTC complexity | High | Use simplified peer-to-peer, fallback to recorded video |
| AI API latency | Medium | Implement loading states, cache common questions |
| Time constraints | High | Focus on single happy path, mock complex features |
| Integration issues | Medium | Use stub data, prioritize core flow |

---

## 11. Success Criteria (Hackathon)

### Minimum Viable Demo
✅ User can register as employer or candidate  
✅ Employer can submit JD and see generated questions  
✅ Candidate can upload CV  
✅ System conducts one AI interview with recording  
✅ Generate basic interview summary  

### Bonus Points
⭐ Working video with AI avatar  
⭐ Real-time transcription  
⭐ Detailed analytics dashboard  
⭐ Mobile responsive design  

---

## 12. Key Decisions & Assumptions

### Decisions Made
- Use static AI avatar for MVP (not Veo3)
- Record video locally, upload post-interview
- Single interview round only
- No payment integration for hackathon

### Assumptions
- Users have stable internet for video
- Modern browser with WebRTC support
- Vertex AI API access configured
- English language only for MVP

---

## 13. Team Communication

### Sync Points
- **Standup:** Every 4 hours
- **Integration checkpoints:** Hour 10, 16, 20
- **Slack channel:** Real-time communication
- **GitHub:** Code repository with feature branches

### Code Review Process
- PR for each major feature
- Quick review by one team member
- Merge to main after basic testing

---

## Appendix A: Sample Test Data

### Sample Job Description
```
Position: Full Stack Developer
Requirements: React, Node.js, 3+ years experience
Responsibilities: Build scalable web applications...
```

### Expected AI Questions
1. Describe your experience with React hooks
2. How do you handle state management?
3. Explain your approach to API design
4. What's your experience with cloud deployment?
5. Describe a challenging bug you solved

### Sample CV Keywords
- Years of experience
- Technology stack matches
- Project complexity
- Team size
- Educational background

---

*Document Version: 1.0 - Hackathon MVP*  
*Last Updated: [Current Date]*  
*Team Size: 3 Developers + 1 Product Owner*  
*Duration: 24-hour Hackathon*
