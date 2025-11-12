#!/bin/bash

# Complete deployment script - runs all steps
# Usage: ./complete-deployment.sh [PROJECT_ID] [REGION]

set -e

PROJECT_ID=${1}
REGION=${2:-"asia-southeast1"}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Complete Google Cloud Run Deployment                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if project ID is provided
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}Enter your Google Cloud Project ID:${NC}"
    read PROJECT_ID
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: Project ID is required${NC}"
    exit 1
fi

echo -e "${GREEN}Project ID: ${PROJECT_ID}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo ""

# Step 1: Build and push image
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Step 1/3: Building and pushing Docker image${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
./build-image.sh ${PROJECT_ID} ${REGION}

echo ""
echo -e "${GREEN}✓ Step 1 complete${NC}"
echo ""

# Step 2: Setup secrets
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Step 2/3: Setting up secrets${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
./setup-secrets.sh ${PROJECT_ID} ${REGION}

echo ""
echo -e "${GREEN}✓ Step 2 complete${NC}"
echo ""

# Step 3: Deploy to Cloud Run
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Step 3/3: Deploying to Cloud Run${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""
./deploy-to-cloudrun.sh ${PROJECT_ID} ${REGION}

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Complete Deployment Successful! 🚀               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Your backend is now live!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "  • Without GPU, file uploads will take 8-10 minutes"
echo "  • Service scales to zero when idle (free tier friendly)"
echo "  • Max 4 CPU, 8GB RAM per instance"
echo "  • Free tier: 2 million requests/month, 360,000 GB-seconds"
echo ""
echo -e "${BLUE}Update your frontend .env with the service URL above!${NC}"
