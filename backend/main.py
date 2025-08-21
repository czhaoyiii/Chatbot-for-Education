import os
import tempfile
import shutil
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from ingestion import files_upload
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

