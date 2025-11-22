# 📌 Claude Prompt: Deploy Next.js + FastAPI on Google Cloud  
> **Architecture: Firebase Hosting + Cloud Run Proxy**

You are an expert full-stack engineer specializing in **Next.js, FastAPI, Firebase, and Google Cloud (Cloud Run & Secret Manager)**.  
Your task is to produce step-by-step implementation instructions, complete configuration files, and deployment commands for the following architecture:

---

## 🏗 Architecture to Implement

- **Frontend & Next.js backend APIs**
  - Deployed via **Firebase Hosting Web Frameworks**
  - Must support SSR and API routes
  - Data persistence must support both:
    - **Firestore**
    - **Cloud SQL (PostgreSQL)** (show both options)

- **Python FastAPI backend**
  - Deployed as a separate service on **Google Cloud Run**
  - Receives requests **proxied through Firebase Hosting**
  - Must include Firebase Auth token validation

- **Integration Routing**
  - Frontend should never call FastAPI directly  
  - Firebase Hosting must proxy with:
    ```
    /python-api/**
    ```
  - CORS should not be needed

- **Shared Authentication**
  - Use **Firebase Authentication**
  - Must show:
    - frontend getting ID token
    - Next.js forwarding token
    - FastAPI validating token via Firebase Admin SDK

- **Shared Database Access**
  - Provide examples for both:
    - Firestore data read/write on both sides
    - Cloud SQL (PostgreSQL) with queries on both sides (Next.js + FastAPI)

---

## 📌 What You Must Produce

Claude must output **everything below**, formatted cleanly:

### 1) Monorepo Structure

/apps
/web # Next.js
/agent # FastAPI


### 2) Next.js Deliverables
- `firebase.json` with Cloud Run rewrite rule
- Any required `next.config.js` configuration
- Example API route that forwards request + ID token to FastAPI
- Example UI call consuming that API route

### 3) FastAPI Deliverables
- Full FastAPI project including:
  - CORS disabled (since proxy eliminates cross origin)
  - Auth middleware validating Firebase token
  - Example endpoint: CRUD example
- `Dockerfile` for Cloud Run
- `requirements.txt`

### 4) Database Options
Provide **working samples** for each option:

#### Firestore
- Node example (Next.js server or API route)
- Python example (FastAPI)

#### Cloud SQL (PostgreSQL)
- Connection code + query samples
- Must show:
  - Python connection pooling example
  - Next.js server component example

### 5) Deployment Steps (Copy/Paste Ready)
- Full Firebase setup + deployment commands
- Cloud Run deployment commands, include:
  - region
  - service name
  - memory config
  - scaling config (min/max instances)

- **Secret Manager Integration**
  - Commands for setting secrets
  - Code for loading secrets in both services

### 6) Optional CI/CD
Provide example **GitHub Actions pipelines**:
- Deploy FastAPI → Cloud Run
- Deploy Next.js → Firebase Hosting

---

## 🎯 Additional Requirements

Claude must:

- **Explain why proxying through Firebase avoids CORS**
- **Explain why localhost cannot be used after deployment**
- **Explain how Firebase securely routes to Cloud Run**
- Output must include:
  - Markdown tables
  - Headings
  - Code blocks
- Code must be **production quality**
- Should optimize for **low cost on Google Cloud**

---

## 🧠 Reminder to Claude  
Respond like a **senior lead engineer delivering production-ready documentation.**  
Avoid vague instructions.  
Everything must be comprehensive, actionable, and copy-paste usable.

---

### If you understand, begin by stating:

> **“Here is the full implementation for Firebase Hosting + Cloud Run (FastAPI) deployment.”**

Then begin producing the deliverables.

---

If requested later, provide variants specialized for:
- AI interview platforms
- multi-team microservices systems
- large-scale enterprise infra
