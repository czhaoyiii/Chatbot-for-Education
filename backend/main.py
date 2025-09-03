import os
import tempfile
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from ingestion import files_upload
from course_creation import create_course
from course_management import upload_course_files, delete_course_file, delete_course
from agent import cpss_chat_expert, CPSSChatDeps
from supabase.client import create_client
from openai import AsyncOpenAI
from user_management import login_user, UserLoginRequest
from chat_management import (
    chat_send as chat_send_service,
    ChatSendRequest,
    list_chat_sessions as list_chat_sessions_service,
    list_session_messages as list_session_messages_service,
)

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


@app.post("/courses/{course_id}/upload")
async def upload_course_files_route(
    course_id: str,
    user_email: str = Form(...),
    files: List[UploadFile] = File(...),
):
    return await upload_course_files(course_id=course_id, user_email=user_email, files=files)


@app.post("/courses/{course_id}/files/{course_file_id}/delete")
async def delete_course_file_route(
    course_id: str,
    course_file_id: str,
    user_email: str = Form(...),
):
    return await delete_course_file(course_id=course_id, course_file_id=course_file_id, user_email=user_email)


@app.post("/courses/{course_id}/delete")
async def delete_course_route(
    course_id: str,
    user_email: str = Form(...),
):
    return await delete_course(course_id=course_id, user_email=user_email)


@app.post("/chat/send")
async def chat_send(payload: ChatSendRequest):
    return await chat_send_service(payload)


@app.get("/chat/sessions")
async def list_chat_sessions(user_id: str | None = None, user_email: str | None = None):
    return await list_chat_sessions_service(user_id=user_id, user_email=user_email)


@app.get("/chat/sessions/{session_id}/messages")
async def list_session_messages(session_id: str):
    return await list_session_messages_service(session_id)

# DELETE chat session endpoint
@app.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """
    Delete a chat session and its messages.
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        # Delete messages first
        supabase_client.table("chat_messages").delete().eq("session_id", session_id).execute()
        # Delete session
        supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {str(e)}")

