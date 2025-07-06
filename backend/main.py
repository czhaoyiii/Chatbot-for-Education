import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ingestion import pdf_upload
from agent import cpss_chat_expert, CPSSChatDeps
from supabase.client import create_client
from openai import AsyncOpenAI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "success"}

@app.get("/ingestion")
async def ingestion():
    return pdf_upload()

@app.post("/query")
async def query(q: str):
    supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
    openai_client = AsyncOpenAI()
    deps = CPSSChatDeps(supabase=supabase_client, openai_client=openai_client)
    response = await cpss_chat_expert.run(q, deps=deps)
    print(response.output)
    return response.output