#!/bin/bash

# Google Cloud Run Deployment Script (CPU-only, Free Tier Optimized)
# This script deploys your FastAPI backend to Google Cloud Run

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Google Cloud Run Deployment (Free Tier Optimized)   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
PROJECT_ID=${1:-$(gcloud config get-value project)}
REGION=${2:-"asia-southeast1"}
SERVICE_NAME="chatbot-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}Configuration:${NC}"
echo "  Project ID: ${PROJECT_ID}"
echo "  Region: ${REGION}"
echo "  Service Name: ${SERVICE_NAME}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}Setting project...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Configure Docker authentication
echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker --quiet

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
echo -e "${BLUE}This will take 5-10 minutes...${NC}"
docker build -t ${IMAGE_NAME}:latest .

# Push to Google Container Registry
echo -e "${YELLOW}Pushing image to Google Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

echo ""
echo -e "${GREEN}✓ Docker image built and pushed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up secrets: ./setup-secrets.sh"
echo "2. Deploy to Cloud Run: ./deploy-to-cloudrun.sh"
echo ""
echo -e "${GREEN}Image URI: ${IMAGE_NAME}:latest${NC}"
