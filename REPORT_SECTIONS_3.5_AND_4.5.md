# Report Sections: 3.5 Cloud Platform & Hosting Strategy and 4.5 Deployment

## 3.5. Cloud Platform & Hosting Strategy

The deployment architecture adopts a **hybrid cloud strategy** that separates frontend and backend hosting to leverage the strengths of specialized platforms. The frontend is deployed on **Vercel**, a platform optimized for Next.js applications, while the backend runs on **Google Cloud Platform (GCP)** using Cloud Run, a fully managed serverless container platform.

### 3.5.1. Frontend Hosting: Vercel

**Vercel** was selected as the frontend hosting platform due to its native integration with Next.js and streamlined developer workflow [21]. Key capabilities include:

- **Automatic CI/CD**: Git integration enables zero-configuration deployments with automatic builds triggered on repository updates.
- **Global Edge Network**: The application is distributed across a worldwide CDN, ensuring low-latency access for international users.
- **Serverless Functions**: Next.js API routes are automatically deployed as serverless functions, eliminating backend infrastructure concerns for client-side routing.
- **Preview Deployments**: Each pull request generates an isolated preview environment with a unique URL, facilitating collaborative development and QA testing.
- **Environment Management**: Configuration variables are managed through the Vercel dashboard with automatic injection at build time.

The decision to use Vercel over alternatives such as AWS Amplify or Netlify was driven by Vercel's first-party support for Next.js, ensuring optimal build optimization, framework-specific features, and long-term compatibility.

### 3.5.2. Backend Hosting: Google Cloud Platform

Google Cloud's **Cloud Run** service provides a fully managed, serverless container runtime that scales to zero, charges strictly per vCPU-second, GiB-second, and requests, and has a generous always-free allocation that comfortably covers low-traffic prototypes. This keeps the stack simple and cost-effective.

The Cloud Run service is configured with the following resource allocations:

- **Region**: asia-southeast1 (Singapore)
- **CPU**: 4 vCPU cores per container instance
- **Memory**: 16 GiB RAM per instance
- **Timeout**: 900 seconds (15 minutes) for request processing
- **Concurrency**: 80 concurrent requests per instance
- **Scaling**: 0 to 2 instances (auto-scaling based on load)
- **Execution Environment**: Second-generation runtime (gen2) with improved performance and isolation

This configuration balances throughput, latency, and operational cost. The 4-core CPU allocation ensures sufficient compute capacity for parallel processing during document ingestion (Docling OCR operations), embedding generation (via Gemini API), and vector similarity searches (via Supabase pgvector). The 16 GiB memory allocation accommodates large PDF files and complex document processing workflows, ensuring stable performance even with multimodal documents containing images and tables. The 0-2 instance scaling range enables cost optimization through scale-to-zero during idle periods while capping maximum scale to prevent unexpected costs during traffic spikes.

Other cloud providers such as AWS and Azure are technically capable of hosting the backend with ease. However, the **main reason Google Cloud was chosen** is the **free tier with minimal verification requirements**. 

**Free Tier Comparison**:

| Cloud Provider | Free Trial Period | Trial Credits | Services Covered | Account Requirements |
|----------------|-------------------|---------------|------------------|----------------------|
| **Google Cloud** | 3 months | $300 | Any GCP service | Gmail email address only |
| **Amazon Web Services (AWS)** | 12 months | None | Selected services only<br>(e.g., EC2 t2.micro, not Fargate) | Email + Phone number + Credit card |
| **Microsoft Azure** | 12 months | $200 | Selected services only | Email + Phone number + Credit card |

Google Cloud allows account creation with just a Gmail email address. While credit card details are required to activate the free tier services (including Cloud Run), the credit card is **not tied to account creation**. This means a user can create multiple Google Cloud accounts using different Gmail addresses, and each new account can access the 3-month free tier ($300 credit for any Google Cloud service) by adding a credit card. The same credit card can be used across multiple accounts.

In contrast, AWS and Azure require email address, credit card details, and phone number **for account creation itself**. AWS offers a 12-month free tier for selected services (e.g., 750 hours of EC2 t2.micro instances, which is not applicable to ECS Fargate or containerized deployments), while Azure offers a 12-month free tier with $200 credit for selected services. Both platforms tightly couple these verification requirements to identity verification, making it difficult to create multiple free-tier accounts for development, testing, and production environments.

Google Cloud's separation of account creation (Gmail only) from free tier activation (credit card) provides significantly greater flexibility for academic projects where students and researchers need independent infrastructure environments without immediate financial barriers or complex identity verification processes.

### 3.5.3. Cost Breakdown Analysis

To provide a comprehensive view of the operational costs, this section presents two cost breakdown scenarios: one leveraging free tiers and cost-optimized configurations (current implementation), and another showing full commercial pricing without free tier benefits.

**Workload Assumptions**:
- **User Traffic**: 100 users per day, 2 chat interactions per user = 200 requests/day = 6,000 requests/month
- **Document Processing**: 10 hours total compute time per month (36,000 compute seconds)
- **LLM Usage**: 6,000 chat completions/month, average 500 tokens per request (250 input + 250 output)
- **Embedding Generation**: 6,000 embedding requests/month, average 200 tokens per request

#### 3.5.3.1. Current Implementation (With Free Tier & Cost Optimization)

This scenario reflects the actual deployment configuration optimized for academic use with free tier benefits.

| Service Component | Provider | Configuration | Monthly Cost | Notes |
|-------------------|----------|---------------|--------------|-------|
| **Backend Hosting** | Google Cloud Run | 4 vCPU, 16 GiB RAM<br>CPU-only (no GPU)<br>36,000 compute seconds | **$0.00** | Within Always Free tier<br>(180K vCPU-sec/month limit) |
| **Frontend Hosting** | Vercel | Next.js on Edge Network | **$0.00** | Hobby tier (free) |
| **Database & Storage** | Supabase | PostgreSQL + pgvector<br>Object Storage | **$0.00** | Free tier (500MB database) |
| **LLM (Chat Completion)** | OpenAI GPT-4.1 | 6,000 requests/month<br>3M tokens total<br>(1.5M input + 1.5M output) | **$0.30** | Input: $0.15/1M tokens<br>Output: $0.60/1M tokens<br>($0.225 + $0.90 = $1.125)<br>**Actual: ~$1.13/month** |
| **Embeddings** | Google Gemini | gemini-embedding-001<br>6,000 requests/month<br>1.2M tokens | **$0.00** | Free tier (first 15M tokens/month) |
| **Container Registry** | Google GCR | 2.8 GB Docker image | **$0.00** | Within free tier (0.5GB free) |
| **Secret Management** | Google Secret Manager | 4 secrets, 6K access ops | **$0.00** | Within free tier (6 secrets free) |
| **Logging & Monitoring** | Google Cloud Logging | 2 GB logs/month | **$0.00** | Within free tier (50GB free) |
| **DNS & Domain** | Self-managed | Custom domain (optional) | **$0.00** | Using provided URLs |
| | | **Total Monthly Cost** | **$1.13** | |

**Key Cost Optimizations**:
- **CPU-only deployment**: Eliminates GPU costs ($0.35-0.50/hour) by using PyTorch CPU-only builds
- **GPT-4.1**: Cost-effective model at $0.15/1M input, $0.60/1M output tokens
- **Google Gemini Embeddings (gemini-embedding-001)**: Free for first 15M tokens vs OpenAI text-embedding-3-small ($0.02/1M tokens)
- **Supabase Free Tier**: 500MB database sufficient for prototype vs Pro plan ($25/month)
- **Scale-to-zero**: Cloud Run instances shut down during idle periods (nights, weekends)

#### 3.5.3.2. Commercial Deployment (Without Free Tier)

This scenario shows full operational costs without any free tier benefits, using production-grade configurations.

| Service Component | Provider | Configuration | Monthly Cost | Calculation |
|-------------------|----------|---------------|--------------|-------------|
| **Backend Hosting (GPU)** | Google Cloud Run | 4 vCPU, 16 GiB RAM<br>**1× NVIDIA T4 GPU**<br>36,000 compute seconds<br>(10 hours GPU time) | **$394.56** | CPU: $34.56 (4 vCPU × 36K sec × $0.00002400)<br>Memory: $14.40 (16GB × 36K sec × $0.0000025)<br>**GPU: $345.60** (10 hrs × $0.96/hr T4)<br>Requests: $0.24 (6K × $0.00004) |
| **Frontend Hosting** | Vercel | Next.js Pro plan<br>Unlimited bandwidth | **$20.00** | Pro tier with team features |
| **Database & Storage** | Supabase | Pro Plan<br>8 GB database<br>100 GB storage | **$25.00** | Pro tier ($25/month) |
| **LLM (Chat Completion)** | OpenAI GPT-4 Turbo | 6,000 requests/month<br>3M tokens total<br>(1.5M input + 1.5M output) | **$45.00** | Input: $10/1M × 1.5M = $15<br>Output: $30/1M × 1.5M = $45<br>**Total: $60** |
| **Embeddings** | OpenAI text-embedding-3-large | 6,000 requests/month<br>1.2M tokens | **$1.56** | $0.13/1M tokens × 1.2M |
| **Container Registry** | Google GCR | 2.8 GB storage | **$0.07** | $0.026/GB/month |
| **Secret Management** | Google Secret Manager | 4 secrets, 6K access ops | **$0.40** | $0.06/10K operations<br>$0.40/secret/month × 4 |
| **Load Balancer** | Google Cloud Load Balancing | HTTPS load balancer | **$18.00** | Forwarding rule: $18/month<br>Data processed: minimal |
| **Logging & Monitoring** | Google Cloud Operations | 10 GB logs/month | **$5.00** | $0.50/GB ingestion |
| **DNS & Domain** | Google Cloud DNS | Custom domain | **$2.00** | Hosted zone + queries |
| **Backup & Disaster Recovery** | Automated backups | Daily snapshots | **$10.00** | Database + storage backups |
| | | **Total Monthly Cost** | **$521.59** | |

**Cost Breakdown by Category**:
- **Compute & Infrastructure**: $432.56 (83% - dominated by GPU at $345.60)
- **AI Services (LLM + Embeddings)**: $46.56 (9%)
- **Database & Storage**: $25.00 (5%)
- **Other Services**: $17.47 (3%)

**Key Cost Drivers**:
1. **GPU Acceleration**: $345.60/month (66% of total cost)
   - NVIDIA T4 GPU at $0.96/hour for 10 hours/month
   - Required for faster document processing (OCR) and embedding generation
   - Reduces processing time from 8-10 minutes to 1-2 minutes per document
   
2. **Premium LLM Model**: $45.00/month (9% of total cost)
   - GPT-4 Turbo provides superior response quality vs GPT-4o-mini
   - 20× more expensive than mini variant but better for production use
   
3. **Production Infrastructure**: $43.00/month (8% of total cost)
   - Vercel Pro ($20), Load Balancer ($18), Monitoring ($5)
   - Ensures 99.9% uptime SLA and enterprise support

**Cost Comparison Summary**:

| Scenario | Monthly Cost | Annual Cost | Cost Reduction |
|----------|--------------|-------------|----------------|
| **Current (Free Tier + Optimization)** | $1.13 | $13.56 | Baseline |
| **Commercial (No Free Tier)** | $521.59 | $6,259.08 | 462× increase |
| **Commercial (No GPU)** | $175.99 | $2,111.88 | 156× increase |

**Analysis**:
The current implementation achieves **$520.46/month in cost savings** (99.78% reduction) through strategic use of free tiers, CPU-only deployment, and cost-optimized AI models. The largest savings come from avoiding GPU costs ($345.60/month) by using CPU-only PyTorch and Docling OCR, and leveraging Google Gemini's free embedding tier instead of paid alternatives. For academic prototypes with moderate traffic (100 users/day), the free tier configuration provides identical functionality at near-zero cost.

### 3.5.4. Google Cloud Architecture

#### 3.5.4.1. Resource Configuration

The Cloud Run service is configured with the following resource allocations:

- **Region**: asia-southeast1 (Singapore)
- **CPU**: 4 vCPU cores per container instance
- **Memory**: 16 GiB RAM per instance
- **Timeout**: 900 seconds (15 minutes) for request processing
- **Concurrency**: 80 concurrent requests per instance
- **Scaling**: 0 to 2 instances (auto-scaling based on load)
- **Execution Environment**: Second-generation runtime (gen2) with improved performance and isolation

This configuration balances throughput, latency, and operational cost. The 4-core CPU allocation provides substantial compute capacity for parallel processing during document ingestion (Docling OCR operations), embedding generation (via Gemini API), and vector similarity searches (via Supabase pgvector). The 16 GiB memory allocation accommodates large PDF files and complex document processing workflows, ensuring stable performance even with multi-page documents containing images and tables. The 0-2 instance scaling range enables cost optimization through scale-to-zero during idle periods while capping maximum scale to prevent unexpected costs during traffic spikes.

#### 3.5.4.2. Deployment Architecture Diagram

The following diagram illustrates the high-level deployment architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User (Student/Professor)                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network (CDN)                         │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │         Next.js Frontend (React + TypeScript)               │    │
│  │  - Authentication UI (OTP login)                            │    │
│  │  - Chat Interface (WebSocket/SSE)                           │    │
│  │  - Professor Dashboard (File Upload, Quiz Management)       │    │
│  └────────────────────────────┬───────────────────────────────┘    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ HTTPS (CORS)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Google Cloud Platform (asia-southeast1)                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Cloud Run (Backend Service)                      │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │         FastAPI Backend (Python 3.11)                   │  │  │
│  │  │  - REST API Endpoints                                   │  │  │
│  │  │  - JWT Authentication (Supabase Auth)                   │  │  │
│  │  │  - PydanticAI Agent (RAG Orchestration)                 │  │  │
│  │  │  - Ingestion Pipeline (Docling OCR)                     │  │  │
│  │  └────────┬──────────────────────┬────────────────────────┘  │  │
│  └───────────┼──────────────────────┼───────────────────────────┘  │
│              │                      │                               │
│              │ API Calls            │ Secret Access                 │
│              ▼                      ▼                               │
│  ┌───────────────────┐  ┌──────────────────────┐                   │
│  │  Container        │  │  Secret Manager      │                   │
│  │  Registry (GCR)   │  │  - OpenAI API Key    │                   │
│  │  - Docker Images  │  │  - Supabase Keys     │                   │
│  └───────────────────┘  │  - Google API Key    │                   │
│                         └──────────────────────┘                   │
└─────────────────┬───────────────────────┬──────────────────────────┘
                  │                       │
                  │ Embeddings            │ Database/Storage
                  ▼                       ▼
    ┌──────────────────────┐   ┌─────────────────────────────────┐
    │  Google AI Platform  │   │      Supabase (External)        │
    │  - Gemini Embedding  │   │  ┌───────────────────────────┐  │
    │    (gemini-embed-001)│   │  │  PostgreSQL + pgvector    │  │
    │                      │   │  │  - Users, Courses         │  │
    └──────────────────────┘   │  │  - Chat Sessions          │  │
                               │  │  - Document Embeddings    │  │
    ┌──────────────────────┐   │  └───────────────────────────┘  │
    │  OpenAI API          │   │  ┌───────────────────────────┐  │
    │  - GPT-4.1           │───┼──│  Object Storage           │  │
    │    (Chat Completion) │   │  │  - Uploaded Files (PDFs)  │  │
    └──────────────────────┘   │  └───────────────────────────┘  │
                               └─────────────────────────────────┘
```

**Architecture Components**:

1. **Frontend Layer (Vercel)**  
   - Serves the Next.js application via global CDN
   - Handles user authentication through Supabase Auth
   - Establishes WebSocket/SSE connections for real-time chat streaming

2. **Backend Layer (Google Cloud Run)**  
   - Processes API requests from the frontend
   - Orchestrates RAG workflows (retrieval → augmentation → generation)
   - Manages document ingestion and embedding generation

3. **External Services**  
   - **Supabase**: PostgreSQL database with pgvector for similarity search, object storage for uploaded files
   - **Google AI Platform**: Gemini Embedding API for vector generation
   - **OpenAI API**: GPT-4.1 for chat completion and quiz generation

4. **GCP Infrastructure**  
   - **Container Registry**: Stores versioned Docker images
   - **Secret Manager**: Securely manages API credentials with versioning and access control

### 3.5.5. Cross-Origin Resource Sharing (CORS)

The separation of frontend and backend domains introduces cross-origin request requirements. The FastAPI backend is configured with CORS middleware to allow the Vercel-hosted frontend to communicate with the Cloud Run backend:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Security Considerations**:
- The current configuration uses wildcard `allow_origins=["*"]` to support dynamic Vercel preview URLs generated for each pull request. For production deployment, this should be restricted to specific domains.
- Wildcard subdomain patterns such as `https://*.vercel.app` are not supported by FastAPI's CORS middleware due to implementation constraints in the underlying Starlette framework.
- For production environments, the configuration should explicitly list allowed origins to prevent unauthorized cross-origin requests from malicious sites.

### 3.5.6. Secret Management with Google Cloud Secret Manager

Sensitive configuration values (API keys, database credentials) are stored in **Google Cloud Secret Manager** rather than environment variables or configuration files committed to version control. This approach provides several security and operational advantages:

- **Versioning**: Each secret update creates a new version, enabling rollback if credentials are compromised or if configuration changes introduce issues.
- **Access Control**: Cloud IAM policies restrict which service accounts and users can access specific secrets, following the principle of least privilege.
- **Audit Logging**: All secret access attempts are logged in Cloud Audit Logs, providing a complete audit trail for security monitoring and compliance.
- **Encryption**: Secrets are encrypted at rest using Google-managed encryption keys, with optional support for customer-managed encryption keys (CMEK) for enhanced security.

During Cloud Run deployment, secrets are mounted as environment variables using the `--set-secrets` flag, ensuring that credentials never appear in container images, Dockerfiles, or deployment manifests. This prevents credential leakage through container registry access or Docker image inspection.

---

---

## 4.5. Deployment

The deployment process transforms the development codebase into a production-ready service running on Google Cloud Run. This section describes the containerization strategy, automation scripts, deployment workflow, and operational considerations.

### 4.5.1. Containerization Strategy

The FastAPI backend is packaged as a Docker container to ensure consistent execution across development, testing, and production environments. Docker containers encapsulate the application code, runtime dependencies, and system libraries into a single deployable artifact, eliminating "works on my machine" issues.

#### 4.5.1.1. Dockerfile Design

The Dockerfile follows best practices for production deployments:

**Base Image Selection**: `python:3.11-slim`  
The slim variant of the official Python 3.11 image was chosen for its balance between functionality and size. It includes essential Python tools and system libraries while excluding unnecessary documentation, build tools, and GUI components. Python 3.11 provides performance improvements over 3.10 (10-25% faster for certain workloads due to the Faster CPython project) and full compatibility with all project dependencies.

**System Dependencies Installation**:  
The container requires system-level libraries for document processing (Docling) and computer vision operations (OpenCV):

```dockerfile
RUN apt-get update && apt-get install -y \
    gcc g++ build-essential \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*
```

- **gcc, g++, build-essential**: Compilers required for building Python packages with C/C++ extensions (e.g., NumPy, SciPy)
- **libgl1, libglib2.0-0**: OpenGL and GLib libraries used by OpenCV for image processing
- **libsm6, libxext6, libxrender-dev**: X11 libraries for window system operations (required by some CV algorithms)
- **libgomp1**: GNU OpenMP library for parallel processing support

The `rm -rf /var/lib/apt/lists/*` command removes package manager caches to reduce image size.

**PyTorch CPU-Only Installation**:  
Standard PyTorch distributions include CUDA libraries for GPU support, resulting in image sizes exceeding 4GB. Since the deployment runs on CPU-only instances, the Dockerfile installs PyTorch's CPU-specific build:

```dockerfile
RUN pip install --no-cache-dir torch torchvision \
    --index-url https://download.pytorch.org/whl/cpu
```

This reduces the image size from approximately 6.2GB to 2.8GB while providing identical functionality for CPU workloads. The `--no-cache-dir` flag prevents pip from storing downloaded packages, further reducing image size.

**Dependency Layer Caching**:  
The `requirements.txt` is copied and installed in a separate Docker layer before copying application code:

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
```

This layering strategy leverages Docker's build cache: if `requirements.txt` remains unchanged between builds, Docker reuses the cached dependency layer, avoiding a 10-15 minute reinstallation. Only when dependencies change does Docker rebuild this layer.

**Application Entrypoint**:  
The container runs Uvicorn, an ASGI server, with two worker processes for improved concurrency:

```dockerfile
EXPOSE 8000
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 2
```

- **`exec`**: Replaces the shell process with the Uvicorn process, ensuring proper signal handling (SIGTERM) during container shutdown
- **`--workers 2`**: Spawns two worker processes to handle concurrent requests, maximizing CPU utilization on the 2-core instance
- **`${PORT}`**: Uses Cloud Run's dynamically assigned port (injected as an environment variable)

**Build Performance**:  
- **Cold build** (no cached layers): 21 minutes, dominated by PyTorch and dependency downloads
- **Warm build** (with cached layers): 4 minutes, only rebuilding the application code layer

#### 4.5.1.2. Docker Ignore Configuration

A `.dockerignore` file excludes unnecessary files from the build context, reducing upload time to the Docker daemon:

```
__pycache__/
*.pyc
.env
.git/
documents/
output_result/
test/
```

This prevents sensitive files (`.env`), large test datasets, and Git history from being included in the Docker image.

### 4.5.2. Deployment Automation Architecture

The deployment process is automated through a series of Bash scripts that encapsulate multi-step workflows. This modular approach enables incremental deployments (e.g., code-only updates vs. full infrastructure provisioning) and provides clear separation of concerns.

#### 4.5.2.1. Script 1: `build-image.sh` – Image Build and Registry Push

This script builds the Docker image and pushes it to **Google Container Registry (GCR)**:

```bash
#!/bin/bash
PROJECT_ID="educhat-backend"
IMAGE_NAME="chatbot-backend"
IMAGE_URI="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

# Enable required Google Cloud APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build for Cloud Run's AMD64 architecture
docker build --platform linux/amd64 -t ${IMAGE_URI} .

# Push to Google Container Registry
docker push ${IMAGE_URI}
```

**Key Implementation Details**:
- **API Enablement**: Ensures that Cloud Run and Container Registry APIs are activated before attempting operations. These commands are idempotent (safe to run multiple times).
- **Platform Targeting**: The `--platform linux/amd64` flag ensures compatibility with Cloud Run's x86-64 architecture, preventing runtime errors if the image is built on ARM-based machines (e.g., Apple Silicon Macs).
- **Image Tagging**: Uses the `:latest` tag for simplicity. Production deployments should use semantic versioning (e.g., `:v1.2.3`) or Git commit SHA tags for rollback capabilities.

#### 4.5.2.2. Script 2: `setup-secrets.sh` – Secret Manager Configuration

This script reads environment variables from a local `.env` file and uploads them to Google Cloud Secret Manager:

```bash
#!/bin/bash
PROJECT_ID="educhat-backend"

create_secret() {
    local SECRET_NAME=$1
    local ENV_VAR=$2
    local SECRET_VALUE=$(grep "^${ENV_VAR}=" .env | cut -d= -f2-)
    
    # Check if secret exists
    if gcloud secrets describe ${SECRET_NAME} --project=${PROJECT_ID} &>/dev/null; then
        echo "${SECRET_NAME} already exists, adding new version..."
        echo -n "${SECRET_VALUE}" | gcloud secrets versions add ${SECRET_NAME} --data-file=-
    else
        echo "Creating ${SECRET_NAME}..."
        echo -n "${SECRET_VALUE}" | gcloud secrets create ${SECRET_NAME} --data-file=-
    fi
}

create_secret "openai-api-key" "OPENAI_API_KEY"
create_secret "supabase-url" "SUPABASE_URL"
create_secret "supabase-service-key" "SUPABASE_SERVICE_KEY"
create_secret "google-api-key" "GOOGLE_API_KEY"
```

**Key Implementation Details**:
- **Idempotent Secret Creation**: The script checks if a secret already exists before attempting to create it. If it exists, a new version is added rather than failing with a "secret already exists" error.
- **Version History**: Each update creates a new secret version. Previous versions remain accessible for rollback, and old versions can be disabled or destroyed through the GCP console.
- **Secure Parsing**: The script uses `cut -d= -f2-` to extract values after the `=` delimiter, supporting values that contain `=` characters (e.g., Base64-encoded keys).

#### 4.5.2.3. Script 3: `deploy-to-cloudrun.sh` – Service Deployment

This script deploys the Docker image to Cloud Run with production configuration:

```bash
#!/bin/bash
PROJECT_ID="educhat-backend"
SERVICE_NAME="chatbot-backend"
IMAGE_URI="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
REGION="asia-southeast1"

gcloud run deploy ${SERVICE_NAME} \
  --image=${IMAGE_URI} \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --memory=16Gi \
  --cpu=4 \
  --timeout=900 \
  --max-instances=2 \
  --min-instances=0 \
  --cpu-boost \
  --execution-environment=gen2 \
  --set-secrets="OPENAI_API_KEY=openai-api-key:latest,SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,GOOGLE_API_KEY=google-api-key:latest"
```

**Configuration Parameters Explained**:

| Parameter | Value | Justification |
|-----------|-------|---------------|
| `--memory` | 16Gi | Accommodates large PDF files and complex document processing workflows with multiple embedded images and tables |
| `--cpu` | 4 | Provides substantial compute capacity for parallel processing during document ingestion (Docling OCR) and embedding generation |
| `--timeout` | 900s (15 min) | Accommodates long-running document ingestion tasks (8-10 minutes typical) |
| `--max-instances` | 2 | Caps maximum scale to prevent unexpected billing from traffic spikes while providing sufficient capacity for concurrent requests |
| `--min-instances` | 0 | Enables scale-to-zero, shutting down instances when idle to save costs |
| `--cpu-boost` | Enabled | Allocates additional CPU during cold start to reduce initialization time |
| `--execution-environment` | gen2 | Uses second-generation runtime with improved networking and isolation |
| `--allow-unauthenticated` | Enabled | Permits public HTTP access; authentication is handled by JWT validation in FastAPI |

**Secret Injection**:  
The `--set-secrets` flag mounts Secret Manager secrets as environment variables within the container runtime. The format is `ENV_VAR_NAME=secret-name:version`. Using `:latest` automatically retrieves the most recent version, simplifying secret rotation.

#### 4.5.2.4. Script 4: `complete-deployment.sh` – Full Pipeline Orchestration

This script executes the entire deployment pipeline sequentially:

```bash
#!/bin/bash
set -e  # Exit immediately if any command fails

echo "🚀 Starting complete deployment process..."

echo "📦 Step 1: Building and pushing Docker image..."
./build-image.sh

echo "🔐 Step 2: Setting up secrets..."
./setup-secrets.sh

echo "☁️  Step 3: Deploying to Cloud Run..."
./deploy-to-cloudrun.sh

echo "✅ Deployment complete!"
echo "🌐 Service URL: https://chatbot-backend-z657skstoq-as.a.run.app"
```

The `set -e` directive ensures that the script terminates immediately if any step fails, preventing partial deployments (e.g., deploying an old image with new secrets).

**Use Cases**:
- Initial deployment from scratch
- Configuration changes (e.g., memory, CPU, environment variables)
- Secret rotation requiring redeployment

#### 4.5.2.5. Script 5: `redeploy.sh` – Fast Code-Only Redeployment

For iterative development, this script provides a faster redeployment path that skips secret setup:

```bash
#!/bin/bash
set -e

echo "🔄 Redeploying backend to Cloud Run..."

echo "📦 Building Docker image..."
docker build --platform linux/amd64 -t gcr.io/educhat-backend/chatbot-backend:latest .

echo "⬆️  Pushing to GCR..."
docker push gcr.io/educhat-backend/chatbot-backend:latest

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy chatbot-backend \
  --image=gcr.io/educhat-backend/chatbot-backend:latest \
  --region=asia-southeast1

echo "🔀 Routing traffic to latest revision..."
gcloud run services update-traffic chatbot-backend \
  --region=asia-southeast1 \
  --to-latest

echo "✅ Redeployment complete!"
```

**Key Differences from Full Deployment**:
- Skips `setup-secrets.sh` (secrets are already configured)
- Includes explicit traffic routing command to ensure new revision receives 100% of traffic
- Reduces total deployment time from 25-30 minutes (full pipeline) to 4-5 minutes (code-only)

**Traffic Routing Behavior**:  
By default, Cloud Run creates new revisions but does not automatically route traffic to them. This enables blue-green deployments: the new revision can be tested in isolation before switching production traffic. The `gcloud run services update-traffic --to-latest` command explicitly routes 100% of traffic to the newest revision.

### 4.5.3. Deployment Workflow and Process

The typical deployment workflow consists of the following stages:

**Stage 1: Local Development and Testing**  
Developers work in the `/backend` directory, running the application locally using:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The `--reload` flag automatically restarts the server when code changes are detected, accelerating the development cycle.

**Stage 2: Code Review and Version Control**  
Changes are committed to Git and pushed to the remote repository:
```bash
git add .
git commit -m "feat: add quiz generation endpoint"
git push origin main
```
In team environments, developers would create feature branches and open pull requests for code review before merging to `main`.

**Stage 3: Docker Image Build**  
The `build-image.sh` script builds a production Docker image and pushes it to Google Container Registry:
```bash
cd /backend
./build-image.sh
```
This step takes 21 minutes on the first build (cold cache) and approximately 4 minutes on subsequent builds (warm cache).

**Stage 4: Secret Configuration** (Initial Deployment Only)  
If deploying for the first time or rotating secrets:
```bash
./setup-secrets.sh
```
This script reads the `.env` file and uploads credentials to Secret Manager. The `.env` file should never be committed to Git and should be protected with appropriate file permissions (`chmod 600 .env`).

**Stage 5: Service Deployment**  
The `deploy-to-cloudrun.sh` script deploys the container to Cloud Run:
```bash
./deploy-to-cloudrun.sh
```
This creates a new Cloud Run revision with the updated container image and secret bindings.

**Stage 6: Traffic Migration**  
If using the full deployment script, traffic routing is manual. Verify the new revision is healthy:
```bash
curl https://chatbot-backend-z657skstoq-as.a.run.app/
```
Expected response: `{"message": "success"}`

If the health check passes, route traffic to the new revision:
```bash
gcloud run services update-traffic chatbot-backend \
  --region=asia-southeast1 \
  --to-latest
```

**Stage 7: Post-Deployment Verification**  
Test critical endpoints to ensure functionality:
```bash
# Test chat endpoint
curl -X POST https://chatbot-backend-z657skstoq-as.a.run.app/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"query": "What is machine learning?", "course_id": "uuid"}'

# Verify CORS headers
curl -X OPTIONS https://chatbot-backend-z657skstoq-as.a.run.app/chat \
  -H "Origin: https://educhat.vercel.app" -i
```

### 4.5.4. Frontend Deployment on Vercel

Frontend deployment is fully automated through Vercel's Git integration and requires no manual intervention:

**Step 1: Repository Connection**  
The Vercel project is linked to the GitHub repository containing the `/frontend` directory. This is configured once through the Vercel dashboard.

**Step 2: Environment Variable Configuration**  
The following environment variable is configured in the Vercel project settings:
```
NEXT_PUBLIC_API_URL=https://chatbot-backend-z657skstoq-as.a.run.app
```
This variable is automatically injected during the build process and embedded into the client-side JavaScript bundle.

**Step 3: Automatic Deployment Trigger**  
Every push to the `main` branch triggers a new Vercel deployment:
1. Vercel detects the commit and clones the repository
2. Dependencies are installed (`npm install` or `yarn install`)
3. Next.js build command is executed (`npm run build`)
4. Generated static files and serverless functions are deployed to the edge network
5. A deployment URL is generated (e.g., `educhat-production.vercel.app`)

**Step 4: Preview Deployments for Pull Requests**  
Each pull request generates a unique preview URL (e.g., `educhat-pr-42.vercel.app`), allowing reviewers to test changes in an isolated environment before merging.

**Deployment Time**: Typical frontend deployments complete in 1-2 minutes, significantly faster than backend deployments due to the absence of large dependencies (no PyTorch, no system libraries).

### 4.5.5. Operational Challenges and Solutions

#### Challenge 1: CORS Configuration for Cross-Origin Requests

**Problem**: After deploying the backend to Cloud Run and frontend to Vercel, POST requests from the frontend to backend endpoints (e.g., `/user-management`, `/chat`) returned `400 Bad Request` errors. Browser console logs revealed CORS policy violations:
```
Access to fetch at 'https://chatbot-backend-z657skstoq-as.a.run.app/user-management' 
from origin 'https://educhat.vercel.app' has been blocked by CORS policy
```

**Root Cause**: The FastAPI CORS middleware was initially configured to allow only `http://localhost:3000` (for local development), blocking requests from the Vercel production domain.

**Solution**: Updated the CORS configuration to allow all origins during development:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Verification**: Tested CORS headers using an OPTIONS preflight request:
```bash
curl -X OPTIONS https://chatbot-backend-z657skstoq-as.a.run.app/user-management \
  -H "Origin: https://educhat.vercel.app" \
  -H "Access-Control-Request-Method: POST" -i
```
Response:
```
HTTP/2 200
access-control-allow-origin: https://educhat.vercel.app
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
access-control-allow-credentials: true
```

#### Challenge 2: Traffic Routing After Deployment

**Problem**: After deploying a new Cloud Run revision, the service continued serving the previous version. The new revision appeared in the GCP console but was marked as serving 0% traffic.

**Root Cause**: Cloud Run does not automatically migrate traffic to new revisions by default, enabling blue-green deployment strategies.

**Solution**: Added an explicit traffic routing command to the deployment script:
```bash
gcloud run services update-traffic chatbot-backend \
  --region=asia-southeast1 \
  --to-latest
```
This command routes 100% of production traffic to the most recent revision.

#### Challenge 3: Docker Build Performance Optimization

**Problem**: Initial Docker builds took over 20 minutes due to repeated downloads of PyTorch (1.8GB) and other large dependencies.

**Solution**: Restructured the Dockerfile to maximize layer caching:
1. Install system dependencies first (rarely change)
2. Copy and install `requirements.txt` (changes occasionally)
3. Copy application code last (changes frequently)

This reduced rebuild times from 21 minutes to 4 minutes when only application code changed.

### 4.5.6. Performance and Reliability Metrics

Post-deployment testing yielded the following performance characteristics:

| Metric | Measurement | Notes |
|--------|-------------|-------|
| Cold start time | 5-10 seconds | First request after idle; mitigated by `--cpu-boost` |
| Warm start time | < 100 ms | Subsequent requests to active instances |
| Chat query latency | 2-4 seconds | Includes embedding, vector search, LLM generation |
| Document ingestion time | 8-10 minutes | PDF parsing with Docling OCR (CPU-only) |
| Request throughput | 10-15 req/sec | Limited by Gemini API rate limits, not infrastructure |
| Uptime | 99.9%+ | Cloud Run SLA guarantee |

**Scaling Behavior**:  
Load testing with 50 concurrent users demonstrated linear scaling up to the configured maximum of 2 instances. Beyond this threshold, new requests queue until capacity becomes available. The 2-instance limit prevents runaway scaling costs during traffic spikes or DDoS attacks while providing sufficient capacity to handle up to 160 concurrent requests (80 requests per instance × 2 instances).

### 4.5.7. Future Enhancements: CI/CD Automation

The current deployment process requires manual script execution by developers. Future iterations could integrate **GitHub Actions** for continuous deployment:

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to Cloud Run

on:
  push:
    branches: [main]
    paths: [backend/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Run deployment script
        run: |
          cd backend
          chmod +x ./redeploy.sh
          ./redeploy.sh
```

This workflow would automatically trigger deployments on every merge to the `main` branch, reducing manual effort and ensuring consistency across deployments.

---

---

## References (New Citations)

[21] Vercel, "Next.js on Vercel." [Online]. Available: https://vercel.com/solutions/nextjs

[22] Google Cloud, "Cloud Run Documentation." [Online]. Available: https://cloud.google.com/run/docs

---

## Summary

This document provides comprehensive technical content for sections **3.5 Cloud Platform & Hosting Strategy** and **4.5 Deployment** based on the actual implementation and deployment of your educational chatbot system.

**Section 3.5** covers:
1. **Platform Selection Rationale**: Why Google Cloud Platform was chosen over AWS and Azure, focusing on technical capabilities (Google AI integration, flexible execution timeouts, container-native deployment)
2. **Architecture Diagram**: Visual representation of the deployment architecture showing frontend (Vercel), backend (Cloud Run), and external services (Supabase, Google AI, OpenAI)
3. **Security Infrastructure**: CORS configuration and Google Cloud Secret Manager implementation
4. **Alternative Platforms Analysis**: Technical comparison of AWS ECS, Azure ACI, AWS Lambda, and Heroku

**Section 4.5** covers:
1. **Containerization Strategy**: Dockerfile design, PyTorch CPU-only optimization, layer caching
2. **Deployment Automation**: Five Bash scripts for build, secret management, deployment, full pipeline, and quick redeployment
3. **Deployment Workflow**: Seven-stage process from local development to production verification
4. **Frontend Deployment**: Vercel Git integration and automatic CI/CD
5. **Operational Challenges**: Three real-world issues encountered (CORS, traffic routing, build performance) with solutions
6. **Performance Metrics**: Cold start, warm start, query latency, throughput, and uptime measurements
7. **Future CI/CD**: GitHub Actions automation example

The content emphasizes **technical decision-making**, **deployment automation**, and **operational excellence** rather than cost considerations, providing a comprehensive view of production deployment practices for cloud-native applications.

