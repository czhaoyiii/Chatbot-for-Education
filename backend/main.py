import os
import tempfile
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from pydantic import BaseModel
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from ingestion import files_upload
from course_creation import create_course
from agent import cpss_chat_expert, CPSSChatDeps
from supabase.client import create_client
from openai import AsyncOpenAI
from user_management import login_user, UserLoginRequest

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

@app.post("/user-management")
async def user_management(request: UserLoginRequest):
    """
    Handle user login - create user with Student role if first time,
    or return existing user (preserving admin-assigned Professor role)
    """
    return await login_user(request)

@app.post("/upload-files")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Upload multiple files and process them for ingestion into the vector database
    """
    try:
        # Create a temporary directory for uploaded files
        temp_dir = Path(tempfile.mkdtemp())
        uploaded_files = []
        
        # Save uploaded files to temporary directory
        for file in files:
            # Validate file type
            if not file.filename.lower().endswith(('.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt')):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file.filename}. Supported types: PDF, DOC, DOCX, PPT, PPTX, TXT"
                )
            
            # Check file size (10MB limit)
            file_content = await file.read()
            if len(file_content) > 10 * 1024 * 1024:  # 10MB in bytes
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is too large. Maximum size is 10MB."
                )
            
            # Save file to temporary directory
            file_path = temp_dir / file.filename
            with open(file_path, "wb") as buffer:
                buffer.write(file_content)
            
            uploaded_files.append({
                "filename": file.filename,
                "path": str(file_path),
                "size": len(file_content)
            })
        
        # Process the uploaded files
        result = files_upload(temp_dir)
        
        # Clean up temporary directory
        shutil.rmtree(temp_dir)
        
        return {
            "success": True,
            "message": f"Successfully processed {len(uploaded_files)} files",
            "files": uploaded_files,
            "ingestion_result": result
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up temporary directory in case of error
        if 'temp_dir' in locals():
            shutil.rmtree(temp_dir, ignore_errors=True)
        
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

# @app.get("/ingestion")
# async def ingestion():
#     return pdf_upload()

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


@app.post("/courses/create")
async def create_course_route(
    code: str = Form(...),
    name: str = Form(...),
    user_email: str = Form(...),
    files: List[UploadFile] = File(...),
):
    # Delegate to service function for modularity
    return await create_course(
        code=code, name=name, user_email=user_email, files=files
    )


# ========== Chat endpoints ==========
class ChatSendRequest(BaseModel):
    message: str
    # One of these must be provided to identify the user
    user_id: str | None = None
    user_email: str | None = None
    # Identify the course; backend will resolve to course_id
    course_id: str | None = None
    course_code: str | None = None
    # Optional existing session
    session_id: str | None = None


@app.post("/chat/send")
async def chat_send(payload: ChatSendRequest):
    """
    Persist chat session/messages and return AI response.
    - If session_id not provided, create a chat_session for (user, course) at first message time.
    - Store both user message and AI response in chat_messages.
    """
    try:
        if not payload.message or not (payload.user_id or payload.user_email):
            raise HTTPException(status_code=400, detail="message and user are required")

        # Init clients
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )
        openai_client = AsyncOpenAI()

        # Resolve user_id if only email provided
        user_id = payload.user_id
        if not user_id and payload.user_email:
            ures = (
                supabase_client.table("users")
                .select("id")
                .eq("email", payload.user_email)
                .execute()
            )
            if not ures.data:
                raise HTTPException(status_code=404, detail="User not found")
            user_id = ures.data[0]["id"]

        # Resolve course_id
        course_id = payload.course_id
        if not course_id:
            if not payload.course_code:
                raise HTTPException(status_code=400, detail="course_id or course_code is required")
            cres = (
                supabase_client.table("courses")
                .select("id, code, name")
                .eq("code", payload.course_code)
                .execute()
            )
            if not cres.data:
                raise HTTPException(status_code=404, detail="Course not found")
            course_id = cres.data[0]["id"]
            course_code = cres.data[0]["code"]
            course_name = cres.data[0]["name"]
        else:
            course_code = payload.course_code
            course_name = None

        # Ensure a session exists or create one
        session_id = payload.session_id
        if session_id:
            # Validate session belongs to user and course
            sres = (
                supabase_client.table("chat_sessions")
                .select("id, user_id, course_id")
                .eq("id", session_id)
                .execute()
            )
            if not sres.data:
                raise HTTPException(status_code=400, detail="Session not found")
            srow = sres.data[0]
            if srow.get("user_id") != user_id or srow.get("course_id") != course_id:
                raise HTTPException(status_code=400, detail="Invalid session for this user/course")
        else:
            # Create a session with a sensible title
            if not course_code or not course_name:
                # fetch for title if missing
                cres2 = (
                    supabase_client.table("courses")
                    .select("code, name")
                    .eq("id", course_id)
                    .execute()
                )
                if cres2.data:
                    course_code = cres2.data[0]["code"]
                    course_name = cres2.data[0]["name"]
            title = f"{course_code or ''} - {course_name or 'Chat'}".strip()
            screate = (
                supabase_client.table("chat_sessions")
                .insert({
                    "user_id": user_id,
                    "course_id": course_id,
                    "title": title,
                })
                .execute()
            )
            if not screate.data:
                raise HTTPException(status_code=500, detail="Failed to create session")
            session_id = screate.data[0]["id"]

        # Store user message
        umsg = (
            supabase_client.table("chat_messages")
            .insert({
                "session_id": session_id,
                "content": payload.message,
                "sender": "user",
            })
            .execute()
        )

        # Get AI response
        start = datetime.utcnow()
        deps = CPSSChatDeps(supabase=supabase_client, openai_client=openai_client)
        ai_output = await cpss_chat_expert.run(payload.message, deps=deps)
        end = datetime.utcnow()
        thinking_time = int((end - start).total_seconds())
        ai_text = ai_output.output if hasattr(ai_output, "output") else str(ai_output)

        # Store AI message
        amsg = (
            supabase_client.table("chat_messages")
            .insert({
                "session_id": session_id,
                "content": ai_text,
                "sender": "ai",
                "thinking_time": thinking_time,
            })
            .execute()
        )

        return {
            "success": True,
            "response": ai_text,
            "session_id": session_id,
            "user_message_id": (umsg.data[0]["id"] if umsg.data else None),
            "ai_message_id": (amsg.data[0]["id"] if amsg.data else None),
            "thinking_time": thinking_time,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat send error: {str(e)}")


@app.get("/chat/sessions")
async def list_chat_sessions(user_id: str | None = None, user_email: str | None = None):
    """Return sessions for a user, enriched with course code/name."""
    try:
        if not user_id and not user_email:
            raise HTTPException(status_code=400, detail="user_id or user_email required")

        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )

        # Resolve user
        if not user_id and user_email:
            ures = (
                supabase_client.table("users").select("id").eq("email", user_email).execute()
            )
            if not ures.data:
                raise HTTPException(status_code=404, detail="User not found")
            user_id = ures.data[0]["id"]

        sres = (
            supabase_client.table("chat_sessions")
            .select("id, course_id, title, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        sessions = sres.data or []
        if not sessions:
            return {"success": True, "sessions": []}

        # Fetch courses for referenced ids
        course_ids = list({row["course_id"] for row in sessions if row.get("course_id")})
        cmap = {}
        if course_ids:
            cres = (
                supabase_client.table("courses")
                .select("id, code, name")
                .in_("id", course_ids)
                .execute()
            )
            for c in (cres.data or []):
                cmap[c["id"]] = {"id": c["id"], "code": c["code"], "name": c["name"]}

        enriched = []
        for row in sessions:
            course = cmap.get(row["course_id"]) if row.get("course_id") else None
            enriched.append(
                {
                    "id": row["id"],
                    "title": row.get("title"),
                    "created_at": row.get("created_at"),
                    "course": course,
                }
            )

        return {"success": True, "sessions": enriched}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List sessions error: {str(e)}")


@app.get("/chat/sessions/{session_id}/messages")
async def list_session_messages(session_id: str):
    """Return messages for a session in chronological order."""
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )
        mres = (
            supabase_client.table("chat_messages")
            .select("id, content, sender, thinking_time, created_at")
            .eq("session_id", session_id)
            .order("created_at", asc=True)
            .execute()
        )
        return {"success": True, "messages": mres.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List messages error: {str(e)}")

