#!/bin/bash

# Deploy to Google Cloud Run
# Maximum CPU/Memory for Free Tier

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"asia-southeast1"}
SERVICE_NAME="chatbot-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Deploying to Google Cloud Run                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}Configuration:${NC}"
echo "  Project: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service: ${SERVICE_NAME}"
echo "  CPU: 2 vCPU (FREE TIER maximum)"
echo "  Memory: 4 GiB (FREE TIER maximum)"
echo "  Timeout: 15 minutes (for large file uploads)"
echo "  Concurrency: 80 (default)"
echo "  Max Instances: 5 (FREE TIER limit)"
echo ""

echo -e "${YELLOW}Deploying to Cloud Run (FREE TIER limits)...${NC}"
echo -e "${BLUE}This will take 2-3 minutes...${NC}"
echo ""

gcloud run deploy ${SERVICE_NAME} \
    --image=${IMAGE_NAME}:latest \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --cpu=2 \
    --memory=4Gi \
    --timeout=900 \
    --concurrency=80 \
    --max-instances=5 \
    --min-instances=0 \
    --set-secrets="OPENAI_API_KEY=openai-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,GOOGLE_API_KEY=google-api-key:latest" \
    --cpu-boost \
    --execution-environment=gen2

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --region=${REGION} \
    --format='value(status.url)')

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🎉 Deployment Successful! 🚀                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Service URL:${NC}"
echo -e "${GREEN}${SERVICE_URL}${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo "  • CPU: 2 vCPU (FREE TIER)"
echo "  • Memory: 4 GiB (FREE TIER)"
echo "  • Timeout: 15 minutes"
echo "  • Max Instances: 5 (FREE TIER)"
echo "  • Min Instances: 0 (scales to zero - FREE!)"
echo "  • CPU Boost: Enabled (faster cold starts)"
echo ""
echo -e "${YELLOW}⚠️  Note: Without GPU, file uploads will take 8-10 minutes${NC}"
echo ""
echo -e "${BLUE}Test your API:${NC}"
echo "  curl ${SERVICE_URL}/"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo "  gcloud run services logs tail ${SERVICE_NAME} --region=${REGION}"
echo ""
echo -e "${BLUE}Monitor in Console:${NC}"
echo "  https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
