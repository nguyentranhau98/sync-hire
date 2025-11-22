# FastAPI Agent - Quick Start Guide

## 🚀 Deploy to Google Cloud Run in 5 Minutes

### Prerequisites Checklist

- [ ] Docker installed and running
- [ ] gcloud CLI installed
- [ ] Google Cloud project with billing enabled
- [ ] API keys ready (Stream, Gemini, HeyGen, ElevenLabs)

---

## Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Verify
gcloud config list
```

---

## Step 2: Create Secrets

Generate a strong API secret key:

```bash
# Generate API secret
openssl rand -base64 32
```

Create secrets in Secret Manager:

```bash
# Replace 'your-xxx' with actual values
echo -n 'YOUR_GENERATED_SECRET' | gcloud secrets create API_SECRET_KEY --data-file=-
echo -n 'your-stream-api-key' | gcloud secrets create STREAM_API_KEY --data-file=-
echo -n 'your-stream-secret' | gcloud secrets create STREAM_API_SECRET --data-file=-
echo -n 'your-gemini-key' | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n 'your-heygen-key' | gcloud secrets create HEYGEN_API_KEY --data-file=-
```

---

## Step 3: Grant Secret Access

```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant access to Cloud Run
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 4: Deploy!

```bash
# Navigate to agent directory
cd apps/agent

# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Run deployment script
./deploy-cloud-run.sh production
```

**That's it!** The script will:
- ✅ Enable required APIs
- ✅ Create Docker repository
- ✅ Build and push image
- ✅ Deploy to Cloud Run
- ✅ Test health endpoint

---

## Step 5: Test Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe sync-hire-agent \
  --region=us-central1 \
  --format='value(status.url)')

# Test health check (no auth required)
curl ${SERVICE_URL}/health | jq

# Get API key from Secret Manager
API_KEY=$(gcloud secrets versions access latest --secret=API_SECRET_KEY)

# Test authenticated endpoint
curl -H "X-API-Key: ${API_KEY}" ${SERVICE_URL}/ | jq
```

---

## Step 6: Update Next.js

Add to your Next.js `.env.production`:

```env
AGENT_API_URL=https://sync-hire-agent-xxx-uc.a.run.app
AGENT_API_KEY=<your-api-secret-key>
```

Update your Next.js API route to include the API key header:

```typescript
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.AGENT_API_KEY!,
}
```

---

## Troubleshooting

### ❌ "Docker daemon not running"

```bash
# Start Docker Desktop app, or:
open -a Docker
```

### ❌ "Missing required config"

```bash
# Check which secrets exist
gcloud secrets list

# Verify secret values (careful - this shows actual values)
gcloud secrets versions access latest --secret=API_SECRET_KEY
```

### ❌ "Permission denied"

```bash
# Make deployment script executable
chmod +x deploy-cloud-run.sh
```

### ❌ "Health check fails"

```bash
# View logs
gcloud logs tail --service=sync-hire-agent --limit=50

# Check service status
gcloud run services describe sync-hire-agent --region=us-central1
```

---

## Local Development

### Run Locally with Docker

```bash
# Build image
docker build -t sync-hire-agent .

# Run container
docker run -p 8080:8080 --env-file .env sync-hire-agent

# Test
curl http://localhost:8080/health
```

### Run Locally with uv

```bash
# Install dependencies
uv sync

# Run with environment variables
uv run python main.py
```

---

## What's Next?

1. ✅ **Monitor Logs**
   ```bash
   gcloud logs tail --service=sync-hire-agent
   ```

2. ✅ **Setup Firebase Hosting Proxy**
   - Add Cloud Run rewrite to `firebase.json`
   - Test `/python-api/**` routing

3. ✅ **Configure Alerts**
   - Setup Cloud Monitoring for errors
   - Configure uptime checks

4. ✅ **Test End-to-End**
   - Create interview from Next.js
   - Verify agent joins call
   - Check webhook delivery

---

## Cost Summary

**Monthly Cost Estimate:**
- 1 always-on instance: ~$15-20
- Additional requests: ~$5-10
- **Total: ~$20-30/month**

To reduce costs, set `min-instances=0` (adds cold start delay):
```bash
gcloud run services update sync-hire-agent \
  --region=us-central1 \
  --min-instances=0
```

---

## Full Documentation

For detailed documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Happy Deploying! 🎉**
