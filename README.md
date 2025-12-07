# Chatbot for Education (FYP)

An AI-powered educational assistant designed to help students and professors manage course materials, generate quizzes, and facilitate context-aware Q&A using RAG (Retrieval-Augmented Generation).

## 🚀 Features

- **RAG-based Chatbot**: Ask questions about course materials and get accurate, cited answers.
- **Course Management**: Professors can create courses and upload documents (PDF, DOCX, PPTX, TXT).
- **Automated Ingestion**: Uploaded files are automatically OCR'd (using Docling), chunked, and embedded for search.
- **Quiz Generation**: Automatically generate quizzes from course content to test student knowledge.
- **Role-Based Access**: Distinct interfaces for Students (Chat, Quiz) and Professors (Course Management).

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Auth**: Supabase Auth

### Backend
- **Framework**: FastAPI (Python 3.11)
- **AI Orchestration**: PydanticAI, LangChain
- **OCR/Ingestion**: Docling
- **Database**: Supabase (PostgreSQL + pgvector)
- **LLM**: OpenAI GPT-4 (Chat), Google Gemini (Embeddings)

---

## 📋 Prerequisites

Before you begin, ensure you have the following:

1.  **Node.js** (v18 or higher)
2.  **Python** (v3.11 or higher)
3.  **Docker** (Optional, for containerized backend)
4.  **Supabase Account**: For Database and Auth.
5.  **API Keys**:
    *   **OpenAI API Key** (for Chat generation)
    *   **Google Gemini API Key** (for Embeddings)

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/czhaoyiii/Chatbot-for-Education.git
cd Chatbot-for-Education
```

### 2. Database Setup (Supabase)

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Run the following SQL script to set up the schema and enable vector search:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Users table
create table users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text default 'student' check (role in ('student', 'professor', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses table
create table courses (
  id uuid default gen_random_uuid() primary key,
  code text not null,
  name text not null,
  created_by uuid references users(id) on delete cascade,
  files_count int default 0,
  quizzes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Course Files table
create table course_files (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  uploaded_by uuid references users(id) on delete set null,
  filename text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat Sessions table
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat Messages table
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade,
  content text not null,
  sender text check (sender in ('user', 'ai')),
  thinking_time float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ingested Documents (Vector Store)
create table ingested_documents (
  id uuid default gen_random_uuid() primary key,
  content text,
  embedding vector(768), -- Gemini embedding dimension
  course_id uuid references courses(id) on delete cascade,
  course_file_id uuid references course_files(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quiz Topics table
create table quiz_topics (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  topic_name text not null,
  question_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Quiz Questions table
create table quiz_questions (
  id uuid default gen_random_uuid() primary key,
  topic_id uuid references quiz_topics(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3. Authentication Setup (Supabase)

1.  Go to the **Authentication** section in your Supabase dashboard.
2.  Enable **Email/Password** provider (or Magic Link).
3.  (Optional) Disable "Confirm email" if you want to allow immediate login without email verification during testing.

### 4. Environment Configuration

You need to set up environment variables for both the frontend and backend.

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
```

**Backend (`backend/.env`)**
```env
SUPABASE_URL="your_supabase_url"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_API_KEY="your_gemini_api_key"
```

### 5. Running Locally

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:3000`.

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
fastapi run main.py
```
The backend will be available at `http://localhost:8000`.

---

## ☁️ Deployment

### Frontend Deployment (Vercel)
The frontend is optimized for **Vercel**.
1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  Set the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`).
4.  Deploy.

### Backend Deployment (Cloud)
The backend is containerized and can be deployed to any platform that supports Docker (Google Cloud Run, AWS App Runner, Azure Container Apps, etc.).

**Google Cloud Run (Example)**:
The `backend/script/` folder contains deployment scripts specifically for **Google Cloud Run** used during the development of this project. You can use them as a reference or deploy using your preferred method.

**Other Providers**:
Use the provided `Dockerfile` to build and deploy the container to your cloud provider of choice. Ensure you set the required environment variables in your cloud provider's dashboard.

---

## 📄 License

[MIT License](LICENSE)