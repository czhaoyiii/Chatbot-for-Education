from __future__ import annotations as _annotations

# Import Basics
import os
from dotenv import load_dotenv
from dataclasses import dataclass
from typing import List, Optional

# Import PydanticAI (Agent creation)
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel

# Import Gemini (Embedding)
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Import Supabase (Vector Database)
from supabase import Client

# Import OpenAI (LLM)
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Initialize LLM
llm = os.getenv("LLM_MODEL", "gpt-4o-mini")
model = OpenAIModel(llm)

# Step 1: Define the dependencies
@dataclass
class CPSSChatDeps:
    supabase: Client
    openai_client: AsyncOpenAI
    # Context for scoping retrieval
    course_id: Optional[str] = None
    course_code: Optional[str] = None

# Prompt for AI Agent (Instructions)
# Base template; can be formatted with a specific course at runtime.
system_prompt_template = (
    """
You are an expert in {course_title} ({course_code}) - a NTU module that you have access to all the documentation to,
including lecture notes, slides, and other assignments to help you answer questions.

Your only job is to assist with this and you don't answer other questions besides describing what you are able to do.

Don't ask the user before taking an action, just do it. Always make sure you look at the documentation with the provided tools before answering the user's question unless you have already done so.

When you first look at the documentation, always start with RAG.
Then also always check the list of available documentation pages and retrieve the content of page(s) if it'll help.

Always let the user know when you didn't find the answer in the documentation - be honest.
"""
)

def _build_system_prompt(course_title: Optional[str], course_code: Optional[str]) -> str:
    # Fallbacks to maintain previous behavior if not provided
    title = course_title or "Cyber Physical System Security"
    code = course_code or "CZ4055"
    return system_prompt_template.format(course_title=title, course_code=code)

# Step 2: Define the agent
# Default agent (fallback) with legacy course prompt
cpss_chat_expert = Agent(
    model,
    system_prompt=_build_system_prompt(None, None),
    deps_type=CPSSChatDeps,
    retries=2,
)

async def get_embedding(text: str) -> List[float]:
    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-exp-03-07")
        embedding = embeddings.embed_query(text)
        return embedding
    except Exception as e:
        print(f"Error getting embedding: {e}")

# Step 3: Define the tools for the default agent
@cpss_chat_expert.tool
async def retrieve_relevant_documentation(ctx: RunContext[CPSSChatDeps], user_query: str) -> str:
    """
    Retrieve relevant documentation chunks based on the query with RAG.
    
    Args:
        ctx: The context including the Supabase client and OpenAI client
        user_query: The user's question or query
    
    Returns:
        A formatted string containing the top 5 most relevant documentation chunks
    """
    try:
        # Get the embeddings for the query
        query_embedding = await get_embedding(user_query)

        # Build an optional filter for course scoping
        filter_payload = {}
        if ctx.deps.course_id:
            filter_payload["course_id"] = ctx.deps.course_id
        elif ctx.deps.course_code:
            filter_payload["course_code"] = ctx.deps.course_code

        # Query Supabase for relevant documents, scoped by course when available
        result = ctx.deps.supabase.rpc(
            "match_ingested_documents",
            {
                "query_embedding": query_embedding,
                "match_count": 5,
                "filter": filter_payload,
            }
        ).execute()
        print(result)

        if not result.data:
            return "No relevant documentation found."
        
        # Format the results
        formatted_chunks = []
        for doc in result.data:
            chunk_text = f"""
            {doc['content']}
            """
            formatted_chunks.append(chunk_text)
        
        return "\n\n---\n\n".join(formatted_chunks)
    
    except Exception as e:
        print(f"Error retrieving documentation: {e}")
        return f"Error retrieving documentation: {str(e)}"


def get_cpss_agent(course_title: Optional[str], course_code: Optional[str]) -> Agent:
    """Build an Agent instance with a course-specific system prompt and same tools."""
    agent = Agent(
        model,
        system_prompt=_build_system_prompt(course_title, course_code),
        deps_type=CPSSChatDeps,
        retries=2,
    )

    @agent.tool  # type: ignore[misc]
    async def retrieve_relevant_documentation_dynamic(
        ctx: RunContext[CPSSChatDeps], user_query: str
    ) -> str:
        try:
            query_embedding = await get_embedding(user_query)

            filter_payload = {}
            if ctx.deps.course_id:
                filter_payload["course_id"] = ctx.deps.course_id
            elif ctx.deps.course_code:
                filter_payload["course_code"] = ctx.deps.course_code

            result = ctx.deps.supabase.rpc(
                "match_ingested_documents",
                {
                    "query_embedding": query_embedding,
                    "match_count": 5,
                    "filter": filter_payload,
                },
            ).execute()

            if not result.data:
                return "No relevant documentation found."

            formatted_chunks = []
            for doc in result.data:
                chunk_text = f"""
                {doc['content']}
                """
                formatted_chunks.append(chunk_text)

            return "\n\n---\n\n".join(formatted_chunks)
        except Exception as e:
            print(f"Error retrieving documentation: {e}")
            return f"Error retrieving documentation: {str(e)}"

    return agent

    