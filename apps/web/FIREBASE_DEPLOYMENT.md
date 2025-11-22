# Firebase Hosting Deployment Guide

Complete guide for deploying the SyncHire Next.js application to Firebase Hosting with Cloud Run integration.

## Architecture Overview

```
Firebase Hosting (your-app.web.app)
    ↓
Next.js App (SSR + API Routes)
    ↓
/python-api/** → Firebase Proxy → Cloud Run (sync-hire-agent)
```

### Why Firebase Proxy?

- **No CORS issues**: Same-origin requests from browser
- **Security**: Cloud Run URL stays private
- **Unified domain**: Clean architecture
- **SSL/HTTPS**: Automatic with Firebase Hosting

## Prerequisites

### 1. Google Cloud Project Setup

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Authenticate with gcloud
gcloud auth login
gcloud config set project $GCP_PROJECT_ID

# Enable required APIs
gcloud services enable \
  firebasehosting.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Install Dependencies

```bash
cd apps/web

# Install all dependencies (including firebase-tools)
pnpm install
```

### 3. Firebase Project Initialization

If this is your first Firebase deployment:

```bash
# Login to Firebase
npx firebase login

# Initialize Firebase Hosting (interactive)
npx firebase init hosting

# Select options:
# - Use existing project → Select your GCP project
# - Use Next.js framework → Yes (auto-detected)
# - Public directory → out (default, or leave as suggested)
# - Single-page app → No
# - GitHub Actions → Optional (we have custom scripts)
```

The `firebase.json` and `.firebaserc` files are already configured in this repository.

## Configuration Files

### firebase.json

Already configured with:
- **Next.js Web Frameworks integration** - Automatic SSR support
- **Cloud Run proxy** - Routes `/python-api/**` to Cloud Run service
- **Static asset caching** - Optimized cache headers for images, JS, CSS

```json
{
  "hosting": {
    "source": ".",
    "frameworksBackend": {
      "region": "us-central1"
    },
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

### .firebaserc

Update with your project ID:

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# The deploy.sh script will automatically update .firebaserc
```

### next.config.ts

Already configured with:
- `output: 'standalone'` - Optimized for Firebase deployment
- Image optimization settings
- Remote pattern support

## Deployment Steps

### Step 1: Deploy Python Agent to Cloud Run

**IMPORTANT**: Deploy the Python agent first, as Firebase Hosting will proxy to it.

```bash
cd ../agent

# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"

# Deploy using the provided script
./deploy-cloud-run.sh production

# Verify deployment
curl https://sync-hire-agent-xxx-uc.a.run.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "sync-hire-agent",
  "timestamp": "..."
}
```

### Step 2: Set Up Secrets (Google Secret Manager)

```bash
cd ../web

# Set your API keys as environment variables (or will be prompted)
export GEMINI_API_KEY="your-gemini-api-key"
export STREAM_API_SECRET="your-stream-secret"
export NEXT_PUBLIC_STREAM_API_KEY="your-stream-public-key"

# Run the setup script
./setup-secrets.sh
```

This script:
1. Creates secrets in Google Secret Manager
2. Grants access to Cloud Run and App Engine service accounts
3. Securely stores all API keys

### Step 3: Configure Environment Variables

Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "YOUR_GCP_PROJECT_ID"
  }
}
```

### Step 4: Deploy to Firebase Hosting

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Deploy to production
./deploy.sh production

# Or deploy to preview channel
./deploy.sh preview
```

The deployment script:
1. Updates `.firebaserc` with your project ID
2. Installs dependencies (if needed)
3. Builds the Next.js application
4. Deploys to Firebase Hosting

### Step 5: Verify Deployment

After deployment completes, you'll see:

```
✅ Deployment completed successfully!

Hosting URL: https://your-project.web.app
```

**Test the deployment:**

```bash
# Test the main site
curl https://your-project.web.app

# Test the Python agent proxy
curl https://your-project.web.app/python-api/health
```

## Environment Variables

### Development (.env.local)

```env
# Python Agent (local development)
PYTHON_AGENT_URL=http://localhost:8080

# GetStream Video SDK
NEXT_PUBLIC_STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Demo Data
NEXT_PUBLIC_DEMO_USER_NAME="Kes Kasiulynas"
NEXT_PUBLIC_LOGO_DEV_KEY=pk_FgUgq-__SdOal0JNAYVqJQ
```

### Production (Google Secret Manager)

In production, secrets are loaded from Google Secret Manager:

- `GEMINI_API_KEY` → Secret Manager
- `STREAM_API_SECRET` → Secret Manager
- `NEXT_PUBLIC_STREAM_API_KEY` → Secret Manager

The app automatically detects production environment and uses Secret Manager.

### .env.production (Optional)

Create this file for production-specific configs that aren't secrets:

```env
# GCP Configuration
GCP_PROJECT_ID=your-project-id
NODE_ENV=production

# Agent API will use Firebase proxy in production
# No need to set AGENT_API_URL - automatically uses /python-api
```

## API Routes and Cloud Run Proxy

### How It Works

1. **Browser** makes request to: `https://your-app.web.app/python-api/join-interview`
2. **Firebase Hosting** receives the request
3. **Firebase rewrites** the request to Cloud Run: `https://sync-hire-agent-xxx.run.app/join-interview`
4. **Cloud Run** processes the request
5. **Response** is proxied back through Firebase to the browser

### Updated API Routes

The following routes now use the Firebase proxy pattern:

- `apps/web/src/app/api/start-interview/route.ts`
- `apps/web/src/app/api/test-agent/route.ts`

They use `getAgentEndpoint()` which automatically:
- **Development**: Uses `http://localhost:8080`
- **Production**: Uses `/python-api` (Firebase proxy)

### Testing the Proxy

```bash
# From your browser or terminal
curl https://your-app.web.app/api/test-agent

# Should return:
{
  "success": true,
  "message": "Successfully connected to Python agent",
  "agentResponse": { "status": "healthy" }
}
```

## Deployment Commands Reference

### Manual Deployment

```bash
# Build only
pnpm build

# Deploy to production
pnpm run deploy

# Deploy to preview channel
pnpm run deploy:preview

# Initialize Firebase (first time only)
pnpm run firebase:init
```

### Using Deployment Script

```bash
# Deploy to production
./deploy.sh production

# Deploy to preview channel
./deploy.sh preview
```

### Firebase CLI Commands

```bash
# List hosting sites
npx firebase hosting:sites:list

# List preview channels
npx firebase hosting:channel:list

# Delete a preview channel
npx firebase hosting:channel:delete preview

# View deployment history
npx firebase hosting:clone

# Rollback (deploy previous version)
npx firebase hosting:channel:deploy previous
```

## Troubleshooting

### Issue: Cloud Run service not found

**Error:**
```
Error: Cloud Run service 'sync-hire-agent' not found
```

**Solution:**
1. Deploy the Python agent first: `cd apps/agent && ./deploy-cloud-run.sh production`
2. Verify it's deployed: `gcloud run services list --project=$GCP_PROJECT_ID`
3. Ensure the service name matches in `firebase.json` → `"serviceId": "sync-hire-agent"`

### Issue: Secrets not accessible

**Error:**
```
Failed to access secret GEMINI_API_KEY
```

**Solution:**
1. Run the secrets setup script: `./setup-secrets.sh`
2. Verify IAM permissions:
   ```bash
   gcloud projects get-iam-policy $GCP_PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.role:roles/secretmanager.secretAccessor"
   ```
3. Ensure both service accounts have access:
   - `{PROJECT_NUMBER}-compute@developer.gserviceaccount.com`
   - `{PROJECT_ID}@appspot.gserviceaccount.com`

### Issue: 502 Bad Gateway on /python-api/**

**Error:**
```
502 Bad Gateway
```

**Solution:**
1. Check if Cloud Run service is running:
   ```bash
   gcloud run services describe sync-hire-agent \
     --region=us-central1 \
     --project=$GCP_PROJECT_ID
   ```
2. Test Cloud Run directly:
   ```bash
   curl https://sync-hire-agent-xxx.run.app/health
   ```
3. Check Cloud Run logs:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sync-hire-agent" \
     --project=$GCP_PROJECT_ID \
     --limit=50
   ```

### Issue: Build fails

**Error:**
```
Error: Build failed
```

**Solution:**
1. Clear build cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check Node version: `node -v` (should be >= 20)
4. Build locally first: `pnpm build`

### Issue: CORS errors in production

**This shouldn't happen with Firebase proxy, but if it does:**

1. Verify you're using the proxy pattern:
   ```typescript
   import { getAgentEndpoint } from '@/lib/agent-config';
   const url = getAgentEndpoint('/join-interview'); // NOT direct Cloud Run URL
   ```
2. Check `firebase.json` has the rewrite rule for `/python-api/**`
3. Clear browser cache and test in incognito mode

## Monitoring and Logs

### View Firebase Hosting Logs

```bash
# View hosting logs
gcloud logging read "resource.type=firebase_hosting" \
  --project=$GCP_PROJECT_ID \
  --limit=50 \
  --format=json
```

### View Cloud Run Logs (Python Agent)

```bash
# Real-time logs
gcloud run services logs tail sync-hire-agent \
  --region=us-central1 \
  --project=$GCP_PROJECT_ID

# Recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=sync-hire-agent" \
  --project=$GCP_PROJECT_ID \
  --limit=100
```

### View Next.js Function Logs

```bash
# Firebase Functions logs (for SSR)
gcloud logging read "resource.type=cloud_function" \
  --project=$GCP_PROJECT_ID \
  --limit=50
```

## Performance Optimization

### Caching Strategy

Already configured in `firebase.json`:

- **Static assets** (images, JS, CSS): 1 year cache with immutable
- **HTML**: No cache (for SSR pages)
- **API routes**: No cache

### Image Optimization

Next.js Image component is configured for optimization:

```typescript
import Image from 'next/image';

<Image
  src="https://example.com/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // For above-the-fold images
/>
```

### Recommended: Enable CDN

```bash
# Firebase Hosting automatically uses global CDN
# No additional configuration needed
```

## Cost Optimization

### Firebase Hosting Pricing

- **Free tier**: 10 GB storage, 360 MB/day bandwidth
- **Blaze plan**: Pay-as-you-go
  - Storage: $0.026/GB/month
  - Bandwidth: $0.15/GB
  - **Estimated**: $10-30/month for typical usage

### Cloud Run Pricing

See `apps/agent/DEPLOYMENT.md` for Cloud Run cost optimization.

### Recommendations

1. **Use preview channels for testing** - Free, doesn't affect production
2. **Enable Cloud Run scale-to-zero** - Saves cost during low traffic
3. **Monitor bandwidth** - Use Firebase console to track usage
4. **Optimize images** - Use WebP format and proper sizing

## Next Steps

1. **Set up custom domain**: `firebase hosting:channel:deploy prod --domain=yourdomain.com`
2. **Enable Firebase Authentication**: Replace mock auth with real Firebase Auth
3. **Migrate to Firestore**: Replace file storage with Firestore database
4. **Set up CI/CD**: Use GitHub Actions for automated deployments
5. **Enable monitoring**: Set up Cloud Monitoring alerts

## Additional Resources

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Google Secret Manager](https://cloud.google.com/secret-manager/docs)

---

## Quick Reference

```bash
# Full deployment workflow
export GCP_PROJECT_ID="your-project-id"

# 1. Deploy Python agent
cd apps/agent && ./deploy-cloud-run.sh production

# 2. Set up secrets
cd ../web && ./setup-secrets.sh

# 3. Deploy Next.js to Firebase
./deploy.sh production

# 4. Test
curl https://your-app.web.app/api/test-agent
```

---

**Need help?** Check the troubleshooting section or review Cloud Run logs for the Python agent.
