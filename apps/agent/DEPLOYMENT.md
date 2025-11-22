# FastAPI Agent - Cloud Run Deployment Guide

Complete guide for deploying the SyncHire FastAPI backend to Google Cloud Run.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Initial Setup](#initial-setup)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **gcloud CLI** - [Install](https://cloud.google.com/sdk/docs/install)
- **Docker** - [Install](https://docs.docker.com/get-docker/)
- **Google Cloud Project** with billing enabled

### Required APIs

The deployment script will automatically enable these APIs, but you can enable them manually:

```bash
gcloud services enable \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com
```

---

## Architecture Overview

### Deployment Architecture

```
┌─────────────────┐
│  Next.js App    │
│ (Firebase Host) │
└────────┬────────┘
         │
         │ /python-api/** (proxied)
         │
         ▼
┌─────────────────┐
│  Cloud Run      │
│  FastAPI Agent  │
│  (Python 3.13)  │
└─────────────────┘
         │
         ├──► GetStream (WebRTC)
         ├──► Google Gemini (LLM)
         ├──► HeyGen (Avatar)
         └──► ElevenLabs (TTS)
```

### Why This Architecture?

1. **No CORS Issues** - Firebase Hosting proxy eliminates cross-origin requests
2. **Unified Domain** - All requests appear to come from same origin
3. **Scalability** - Cloud Run scales automatically (0-10 instances)
4. **Cost-Optimized** - Min 1 instance for availability, scales up on demand
5. **Security** - Secrets managed via Google Secret Manager

---

## Initial Setup

### 1. Authenticate with Google Cloud

```bash
# Login to gcloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

### 2. Create Secrets in Secret Manager

All sensitive credentials must be stored in Google Secret Manager:

```bash
# API Security Key (shared between Next.js and FastAPI)
echo -n 'your-generated-api-secret-key' | \
  gcloud secrets create API_SECRET_KEY --data-file=- --project=YOUR_PROJECT_ID

# Stream Video API
echo -n 'your-stream-api-key' | \
  gcloud secrets create STREAM_API_KEY --data-file=- --project=YOUR_PROJECT_ID

echo -n 'your-stream-api-secret' | \
  gcloud secrets create STREAM_API_SECRET --data-file=- --project=YOUR_PROJECT_ID

# Google Gemini
echo -n 'your-gemini-api-key' | \
  gcloud secrets create GEMINI_API_KEY --data-file=- --project=YOUR_PROJECT_ID

# HeyGen Avatar
echo -n 'your-heygen-api-key' | \
  gcloud secrets create HEYGEN_API_KEY --data-file=- --project=YOUR_PROJECT_ID
```

**Generate a strong API_SECRET_KEY:**

```bash
# On macOS/Linux
openssl rand -base64 32

# Or using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Grant Secret Access to Cloud Run

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

# Grant Secret Manager access to Cloud Run service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Deployment

### Automated Deployment (Recommended)

```bash
# Navigate to agent directory
cd apps/agent

# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Run deployment script
./deploy-cloud-run.sh production
```

The script will:
1. ✅ Verify prerequisites
2. ✅ Enable required APIs
3. ✅ Create Artifact Registry repository
4. ✅ Configure Docker authentication
5. ✅ Build Docker image (Python 3.13)
6. ✅ Push to Artifact Registry
7. ✅ Check secrets existence
8. ✅ Deploy to Cloud Run
9. ✅ Test health endpoint

### Manual Deployment

If you prefer manual control:

```bash
# 1. Build Docker image
docker build --platform linux/amd64 -t sync-hire-agent .

# 2. Tag for Artifact Registry
docker tag sync-hire-agent \
  us-central1-docker.pkg.dev/YOUR_PROJECT_ID/sync-hire/sync-hire-agent:latest

# 3. Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev

# 4. Push image
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/sync-hire/sync-hire-agent:latest

# 5. Deploy to Cloud Run
gcloud run deploy sync-hire-agent \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT_ID/sync-hire/sync-hire-agent:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600s \
  --concurrency=10 \
  --set-env-vars="ENVIRONMENT=production" \
  --set-secrets="API_SECRET_KEY=API_SECRET_KEY:latest,STREAM_API_KEY=STREAM_API_KEY:latest,STREAM_API_SECRET=STREAM_API_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,HEYGEN_API_KEY=HEYGEN_API_KEY:latest"
```

---

## Configuration

### Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `ENVIRONMENT` | Cloud Run | Set to `production` |
| `PORT` | Cloud Run | Set to `8080` (Cloud Run default) |
| `API_SECRET_KEY` | Secret Manager | Shared secret for Next.js ↔ FastAPI auth |
| `STREAM_API_KEY` | Secret Manager | GetStream Video API key |
| `STREAM_API_SECRET` | Secret Manager | GetStream Video API secret |
| `GEMINI_API_KEY` | Secret Manager | Google Gemini API key |
| `HEYGEN_API_KEY` | Secret Manager | HeyGen avatar API key |

### Cloud Run Settings

| Setting | Value | Reason |
|---------|-------|--------|
| **Min instances** | 1 | Avoid cold starts, keep always warm |
| **Max instances** | 10 | Handle concurrent interviews |
| **Memory** | 2Gi | WebRTC + LLM processing needs memory |
| **CPU** | 2 | Real-time audio/video processing |
| **Timeout** | 3600s (1 hour) | Long-running interviews |
| **Concurrency** | 10 | Max 10 requests per instance |

### Cost Estimation

**Monthly cost with min 1 instance:**
- Always-on instance: ~$15-20/month
- Additional requests: ~$5-10/month
- **Total: ~$20-30/month** (depends on interview volume)

**To reduce costs:**
- Set `min-instances=0` (adds cold start delay ~10-20s)
- Reduce `max-instances` if low traffic

---

## Testing

### 1. Health Check (Public Endpoint)

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe sync-hire-agent \
  --region=us-central1 \
  --format='value(status.url)')

# Test health endpoint (no auth required)
curl ${SERVICE_URL}/health | jq
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "sync-hire-vision-agent",
  "version": "0.3.0",
  "timestamp": "2025-01-22T10:30:00.000Z",
  "config_valid": true,
  "active_interviews": 0
}
```

### 2. Protected Endpoint (Requires API Key)

```bash
# Get API secret from Secret Manager
API_KEY=$(gcloud secrets versions access latest --secret=API_SECRET_KEY)

# Test root endpoint
curl -H "X-API-Key: ${API_KEY}" ${SERVICE_URL}/ | jq
```

**Expected response:**
```json
{
  "service": "SyncHire AI Interview Agent",
  "version": "0.3.0",
  "status": "running",
  "framework": "Vision-Agents",
  "llm": "Google Gemini 2.0 Flash",
  "avatar": "HeyGen",
  "config_valid": true,
  "active_interviews": 0
}
```

### 3. Test API Key Validation

```bash
# Should return 401 Unauthorized
curl -i ${SERVICE_URL}/

# Should return 403 Forbidden
curl -i -H "X-API-Key: invalid-key" ${SERVICE_URL}/
```

---

## Integration with Next.js

### Update Next.js Environment Variables

Add to your Next.js `.env.production`:

```env
# FastAPI Agent Configuration
AGENT_API_URL=https://sync-hire-agent-XXXXXXXXXX-uc.a.run.app
AGENT_API_KEY=<value-from-secret-manager>
```

### Update Next.js API Route

Modify your Next.js API route to include the API key:

```typescript
// app/api/python-proxy/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${process.env.AGENT_API_URL}/join-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.AGENT_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  return Response.json(await response.json());
}
```

### Configure Firebase Hosting Proxy

Add to `firebase.json`:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/python-api/**",
        "run": {
          "serviceId": "sync-hire-agent",
          "region": "us-central1"
        }
      }
    ]
  }
}
```

**Why Firebase Hosting proxy?**
- ✅ No CORS issues (same origin)
- ✅ Unified domain for frontend + backend
- ✅ Automatic SSL/TLS
- ✅ Firebase CDN caching for static assets

---

## Monitoring & Logs

### View Real-time Logs

```bash
# Tail all logs
gcloud logs tail --project=YOUR_PROJECT_ID --service=sync-hire-agent

# Filter errors only
gcloud logs tail --project=YOUR_PROJECT_ID --service=sync-hire-agent --log-filter="severity>=ERROR"

# Filter specific interview
gcloud logs tail --project=YOUR_PROJECT_ID --service=sync-hire-agent --log-filter="jsonPayload.callId='call-123'"
```

### Cloud Run Metrics

```bash
# Open Cloud Run console
gcloud run services describe sync-hire-agent --region=us-central1
```

Monitor:
- Request count
- Request latency
- Instance count
- Memory usage
- CPU utilization

---

## Troubleshooting

### Issue: Health Check Fails

**Symptoms:** `/health` returns 503 or times out

**Solutions:**
```bash
# 1. Check container logs
gcloud logs tail --service=sync-hire-agent --limit=50

# 2. Verify secrets are accessible
gcloud secrets versions access latest --secret=API_SECRET_KEY

# 3. Check service status
gcloud run services describe sync-hire-agent --region=us-central1
```

### Issue: "Invalid API key" on Every Request

**Symptoms:** All requests return 403 Forbidden

**Solutions:**
```bash
# 1. Verify API_SECRET_KEY secret exists
gcloud secrets describe API_SECRET_KEY

# 2. Check Cloud Run has secret access
gcloud run services describe sync-hire-agent --region=us-central1 --format=yaml | grep secrets

# 3. Ensure Next.js uses correct key
# Compare values:
gcloud secrets versions access latest --secret=API_SECRET_KEY
echo $AGENT_API_KEY  # from Next.js .env
```

### Issue: Cold Start Delays

**Symptoms:** First request takes 10-20 seconds

**Solutions:**
```bash
# Option 1: Increase min instances (costs more)
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --min-instances=2

# Option 2: Accept cold starts, optimize Docker image
# - Use multi-stage build (already implemented)
# - Minimize dependencies
```

### Issue: "Missing required config" in Logs

**Symptoms:** `config_valid: false` in health check

**Solutions:**
```bash
# Check which secrets are missing
gcloud secrets list --project=YOUR_PROJECT_ID

# Verify all required secrets:
required_secrets=(
  "API_SECRET_KEY"
  "STREAM_API_KEY"
  "STREAM_API_SECRET"
  "GEMINI_API_KEY"
  "HEYGEN_API_KEY"
)

for secret in "${required_secrets[@]}"; do
  gcloud secrets describe $secret || echo "❌ Missing: $secret"
done
```

### Issue: WebRTC Connection Failures

**Symptoms:** Agent joins call but no audio/video

**Solutions:**
```bash
# Enable DEBUG logging for WebRTC
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --set-env-vars="LOG_LEVEL_WEBRTC=DEBUG"

# Check logs for ICE/STUN errors
gcloud logs tail --service=sync-hire-agent --log-filter="severity>=WARNING"
```

---

## Updating the Service

### Redeploy After Code Changes

```bash
# Quick redeploy
cd apps/agent
./deploy-cloud-run.sh production
```

### Update Secrets

```bash
# Update a secret value
echo -n 'new-secret-value' | \
  gcloud secrets versions add SECRET_NAME --data-file=-

# Cloud Run automatically picks up new version on next restart
# Force restart to apply immediately:
gcloud run services update sync-hire-agent --region=us-central1
```

### Rollback to Previous Version

```bash
# List revisions
gcloud run revisions list --service=sync-hire-agent --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic sync-hire-agent \
  --region=us-central1 \
  --to-revisions=sync-hire-agent-00005-xyz=100
```

---

## Security Best Practices

1. **API Key Rotation**
   - Rotate `API_SECRET_KEY` every 90 days
   - Update both Secret Manager and Next.js environment

2. **Least Privilege**
   - Cloud Run service account has only Secret Manager access
   - No additional IAM roles granted

3. **Network Security**
   - Service behind Firebase Hosting proxy
   - No direct public access needed
   - Can enable VPC connector for private network access

4. **Audit Logs**
   ```bash
   # Enable audit logs
   gcloud logging logs list --project=YOUR_PROJECT_ID
   ```

---

## Cost Optimization

### Current Configuration Cost

| Resource | Cost |
|----------|------|
| 1 always-on instance (2 vCPU, 2Gi) | ~$15-20/month |
| Additional requests | ~$0.0000025/request |
| Networking | ~$0.12/GB egress |
| **Estimated Total** | **~$20-30/month** |

### Reduce Costs

```bash
# Scale to zero when idle (adds cold start)
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --min-instances=0 \
  --max-instances=5

# Reduce memory (if sufficient)
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --memory=1Gi

# Use startup CPU boost (faster cold starts)
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --cpu-boost
```

---

## Next Steps

✅ **Deployment Complete!**

1. **Configure Next.js** - Update environment variables with service URL and API key
2. **Setup Firebase Hosting** - Configure rewrites for `/python-api/**` proxy
3. **Test End-to-End** - Create a test interview from Next.js frontend
4. **Monitor Performance** - Check Cloud Run metrics and logs
5. **Setup Alerts** - Configure Cloud Monitoring alerts for errors

---

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Guide](https://cloud.google.com/secret-manager/docs)
- [Firebase Hosting Cloud Run Rewrites](https://firebase.google.com/docs/hosting/cloud-run)
- [Vision-Agents Framework](https://visionagents.ai)
- [GetStream Video API](https://getstream.io/video/docs/)

---

**Questions or Issues?**

Check the logs first:
```bash
gcloud logs tail --service=sync-hire-agent --limit=100
```

If you need help, include:
- Service URL
- Health check response
- Recent log entries
- Configuration (without secrets!)
