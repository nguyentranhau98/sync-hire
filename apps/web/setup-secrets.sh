#!/bin/bash
set -e

# Google Secret Manager Setup Script
# Creates and configures secrets for the SyncHire application

echo "🔐 SyncHire - Secret Manager Setup"
echo "===================================="

# Check if GCP_PROJECT_ID is set
if [ -z "$GCP_PROJECT_ID" ]; then
  echo "❌ Error: GCP_PROJECT_ID environment variable is not set"
  echo "Please run: export GCP_PROJECT_ID='your-project-id'"
  exit 1
fi

echo "📋 Project ID: $GCP_PROJECT_ID"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
  echo "❌ Error: gcloud CLI is not installed"
  echo "Please install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

# Enable Secret Manager API
echo "🔧 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project=$GCP_PROJECT_ID

# Function to create or update a secret
create_or_update_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2

  echo "📝 Processing secret: $SECRET_NAME"

  # Check if secret exists
  if gcloud secrets describe $SECRET_NAME --project=$GCP_PROJECT_ID &> /dev/null; then
    echo "  ↳ Secret exists, adding new version..."
    echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$GCP_PROJECT_ID
  else
    echo "  ↳ Creating new secret..."
    echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=- --project=$GCP_PROJECT_ID
  fi

  echo "  ✅ Done"
}

# Prompt for secrets if not provided via environment
echo ""
echo "📋 Please provide the following secrets:"
echo "   (or set them as environment variables before running this script)"
echo ""

# GEMINI_API_KEY
if [ -z "$GEMINI_API_KEY" ]; then
  read -p "Enter GEMINI_API_KEY: " GEMINI_API_KEY
fi
create_or_update_secret "GEMINI_API_KEY" "$GEMINI_API_KEY"

# STREAM_API_SECRET
if [ -z "$STREAM_API_SECRET" ]; then
  read -p "Enter STREAM_API_SECRET: " STREAM_API_SECRET
fi
create_or_update_secret "STREAM_API_SECRET" "$STREAM_API_SECRET"

# NEXT_PUBLIC_STREAM_API_KEY
if [ -z "$NEXT_PUBLIC_STREAM_API_KEY" ]; then
  read -p "Enter NEXT_PUBLIC_STREAM_API_KEY: " NEXT_PUBLIC_STREAM_API_KEY
fi
create_or_update_secret "NEXT_PUBLIC_STREAM_API_KEY" "$NEXT_PUBLIC_STREAM_API_KEY"

echo ""
echo "🔐 Configuring IAM permissions..."

# Grant Secret Manager access to the dedicated deployment service account
echo "  ↳ Granting access to deployment service account..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Secret Manager setup completed successfully!"
echo ""
echo "📋 Created/Updated Secrets:"
echo "  - GEMINI_API_KEY"
echo "  - STREAM_API_SECRET"
echo "  - NEXT_PUBLIC_STREAM_API_KEY"
echo ""
echo "🔐 IAM Permissions Granted To:"
echo "  - deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
echo ""
echo "🔗 View secrets:"
echo "  gcloud secrets list --project=$GCP_PROJECT_ID"
echo ""
echo "🔑 Access a secret value:"
echo "  gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=$GCP_PROJECT_ID"
echo ""
echo "📌 Note: Make sure to use the deployment service account when deploying:"
echo "  - Cloud Run: --service-account=deploy@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
echo "  - Firebase: Service account is configured in firebase.json"
echo ""
