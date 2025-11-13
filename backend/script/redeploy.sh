#!/bin/bash

# Quick redeploy script for code changes
# Usage: ./redeploy.sh

set -e

PROJECT_ID="educhat-backend"
REGION="asia-southeast1"
SERVICE_NAME="chatbot-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🔄 Redeploying backend to Cloud Run..."
echo ""

# Build image
echo "📦 Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# Push image
echo "⬆️  Pushing to GCR..."
docker push ${IMAGE_NAME}:latest

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME}:latest \
    --region=${REGION} \
    --platform=managed

# Update traffic to latest
echo "🔀 Routing traffic to latest revision..."
gcloud run services update-traffic ${SERVICE_NAME} \
    --region=${REGION} \
    --to-latest

echo ""
echo "✅ Redeployment complete!"
echo "🌐 Service URL: https://chatbot-backend-z657skstoq-as.a.run.app"
