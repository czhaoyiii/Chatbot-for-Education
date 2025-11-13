#!/bin/bash

# Setup Google Cloud Secrets
# Run this ONCE before deploying

set -e

PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"asia-southeast1"}

echo "🔐 Setting up Google Cloud Secrets Manager..."
echo "Project: ${PROJECT_ID}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Create .env file with your secrets first."
    exit 1
fi

# Source the .env file
source .env

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipping ${secret_name} (value is empty)"
        return
    fi
    
    # Check if secret exists
    if gcloud secrets describe ${secret_name} --project=${PROJECT_ID} 2>/dev/null; then
        echo "Updating secret: ${secret_name}"
        echo -n "${secret_value}" | gcloud secrets versions add ${secret_name} \
            --data-file=- \
            --project=${PROJECT_ID}
    else
        echo "Creating secret: ${secret_name}"
        echo -n "${secret_value}" | gcloud secrets create ${secret_name} \
            --data-file=- \
            --replication-policy="automatic" \
            --project=${PROJECT_ID}
    fi
}

echo "Creating/updating secrets..."
echo ""

# Create secrets from .env file
create_or_update_secret "openai-api-key" "${OPENAI_API_KEY}"
create_or_update_secret "supabase-url" "${SUPABASE_URL}"
create_or_update_secret "supabase-service-key" "${SUPABASE_SERVICE_KEY}"
create_or_update_secret "google-api-key" "${GOOGLE_API_KEY}"

echo ""
echo "✅ All secrets created/updated successfully!"
echo ""
echo "Secrets list:"
gcloud secrets list --project=${PROJECT_ID}
echo ""
echo "Next step: Deploy to Cloud Run"
echo "  ./deploy-to-cloudrun.sh"
