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
from quiz_generation import get_course_quizzes

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


# Quiz endpoints
@app.get("/courses/{course_id}/quizzes")
async def get_course_quizzes_route(course_id: str):
    """
    Get all quiz topics and questions for a course
    """
    return await get_course_quizzes(course_id)


@app.post("/courses/{course_id}/generate-quiz")
async def generate_quiz_for_course_route(
    course_id: str,
    user_email: str = Form(...),
):
    """
    Generate quizzes for all files in a course that don't have quizzes yet
    """
    try:
        from quiz_generation import generate_quiz_for_file, QuizGenerationRequest
        from ingestion import generate_quizzes_for_files
        
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Get all course files
        files_result = supabase_client.table("course_files").select("*").eq("course_id", course_id).execute()
        
        if not files_result.data:
            return {"success": False, "message": "No files found for this course"}
        
        # Check which files already have quizzes
        existing_topics = supabase_client.table("quiz_topics").select("*").eq("course_id", course_id).execute()
        existing_filenames = {topic.get("topic_name", "").split(" - ")[0] for topic in existing_topics.data} if existing_topics.data else set()
        
        # For simplicity, we'll regenerate content from files that need quizzes
        # In a production environment, you might want to store the original content
        quiz_results = []
        
        for file_record in files_result.data:
            filename = file_record["filename"]
            
            # Skip if quiz already exists (basic check)
            if any(filename.replace(".pdf", "").replace(".docx", "").replace(".pptx", "") in topic 
                   for topic in existing_filenames):
                continue
            
            # For this demo, we'll return a message that manual quiz generation is needed
            # In reality, you'd need to either store the original content or re-process the file
            quiz_results.append({
                "filename": filename,
                "status": "Needs manual processing - original content not stored"
            })
        
        return {
            "success": True,
            "message": f"Quiz generation status for {len(quiz_results)} files",
            "results": quiz_results,
            "note": "Quiz generation is automatically done during file upload. For existing files, please re-upload them."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quizzes: {str(e)}")


@app.delete("/courses/{course_id}/quizzes/{topic_id}")
async def delete_quiz_topic_route(
    course_id: str,
    topic_id: str,
    user_email: str = Form(...),
):
    """
    Delete a quiz topic and all its questions
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Verify user has permission (course owner)
        user_res = supabase_client.table("users").select("id").eq("email", user_email).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_res.data[0]["id"]
        
        course_res = supabase_client.table("courses").select("created_by").eq("id", course_id).execute()
        if not course_res.data or course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Delete questions first (foreign key constraint)
        supabase_client.table("quiz_questions").delete().eq("topic_id", topic_id).execute()
        
        # Delete topic
        supabase_client.table("quiz_topics").delete().eq("id", topic_id).execute()
        
        return {"success": True, "message": "Quiz topic and questions deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting quiz topic: {str(e)}")


@app.put("/courses/{course_id}/quizzes/{topic_id}")
async def update_quiz_topic_route(
    course_id: str,
    topic_id: str,
    user_email: str = Form(...),
    topic_name: str = Form(...),
):
    """
    Update a quiz topic name
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Verify user has permission (course owner)
        user_res = supabase_client.table("users").select("id").eq("email", user_email).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_res.data[0]["id"]
        
        course_res = supabase_client.table("courses").select("created_by").eq("id", course_id).execute()
        if not course_res.data or course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Verify topic belongs to the course
        topic_res = supabase_client.table("quiz_topics").select("course_id").eq("id", topic_id).execute()
        if not topic_res.data or topic_res.data[0]["course_id"] != course_id:
            raise HTTPException(status_code=404, detail="Quiz topic not found or doesn't belong to this course")
        
        # Update topic name
        update_res = supabase_client.table("quiz_topics").update({
            "topic_name": topic_name.strip()
        }).eq("id", topic_id).execute()
        
        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to update quiz topic")
        
        return {"success": True, "message": "Quiz topic updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating quiz topic: {str(e)}")


@app.get("/courses/{course_id}/quizzes/{topic_id}/details")
async def get_quiz_topic_details_route(course_id: str, topic_id: str):
    """
    Get detailed information about a quiz topic including all questions
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Get topic details
        topic_res = supabase_client.table("quiz_topics").select("*").eq("id", topic_id).eq("course_id", course_id).execute()
        if not topic_res.data:
            raise HTTPException(status_code=404, detail="Quiz topic not found")
        
        topic = topic_res.data[0]
        
        # Get all questions for this topic
        questions_res = supabase_client.table("quiz_questions").select("*").eq("topic_id", topic_id).order("created_at").execute()
        
        topic["questions"] = questions_res.data or []
        topic["question_count"] = len(questions_res.data or [])
        
        return {"success": True, "topic": topic}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quiz details: {str(e)}")


@app.put("/courses/{course_id}/quizzes/{topic_id}/questions/{question_id}")
async def update_quiz_question_route(
    course_id: str,
    topic_id: str,
    question_id: str,
    user_email: str = Form(...),
    question_text: str = Form(None),
    option_a: str = Form(None),
    option_b: str = Form(None),
    option_c: str = Form(None),
    option_d: str = Form(None),
    correct_answer: str = Form(None),
    explanation: str = Form(None),
):
    """
    Update a quiz question
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Verify user has permission (course owner)
        user_res = supabase_client.table("users").select("id").eq("email", user_email).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_res.data[0]["id"]
        
        course_res = supabase_client.table("courses").select("created_by").eq("id", course_id).execute()
        if not course_res.data or course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Verify question exists and belongs to the topic/course
        question_res = supabase_client.table("quiz_questions").select("topic_id").eq("id", question_id).execute()
        if not question_res.data or question_res.data[0]["topic_id"] != topic_id:
            raise HTTPException(status_code=404, detail="Quiz question not found or doesn't belong to this topic")
        
        # Build update object with only provided fields
        update_data = {}
        if question_text is not None: update_data["question_text"] = question_text.strip()
        if option_a is not None: update_data["option_a"] = option_a.strip()
        if option_b is not None: update_data["option_b"] = option_b.strip()
        if option_c is not None: update_data["option_c"] = option_c.strip()
        if option_d is not None: update_data["option_d"] = option_d.strip()
        if correct_answer is not None: update_data["correct_answer"] = correct_answer.strip()
        if explanation is not None: update_data["explanation"] = explanation.strip()
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update question
        update_res = supabase_client.table("quiz_questions").update(update_data).eq("id", question_id).execute()
        
        if not update_res.data:
            raise HTTPException(status_code=500, detail="Failed to update quiz question")
        
        return {"success": True, "message": "Quiz question updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating quiz question: {str(e)}")


@app.post("/courses/{course_id}/quizzes/{topic_id}/questions")
async def create_quiz_question_route(
    course_id: str,
    topic_id: str,
    user_email: str = Form(...),
    question_text: str = Form(...),
    option_a: str = Form(...),
    option_b: str = Form(...),
    option_c: str = Form(...),
    option_d: str = Form(...),
    correct_answer: str = Form(...),
    explanation: str = Form(...),
):
    """
    Create a new quiz question
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Verify user has permission (course owner)
        user_res = supabase_client.table("users").select("id").eq("email", user_email).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_res.data[0]["id"]
        
        course_res = supabase_client.table("courses").select("created_by").eq("id", course_id).execute()
        if not course_res.data or course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Verify topic exists and belongs to the course
        topic_res = supabase_client.table("quiz_topics").select("course_id").eq("id", topic_id).execute()
        if not topic_res.data or topic_res.data[0]["course_id"] != course_id:
            raise HTTPException(status_code=404, detail="Quiz topic not found or doesn't belong to this course")
        
        # Validate correct answer
        if correct_answer not in ["A", "B", "C", "D"]:
            raise HTTPException(status_code=400, detail="Correct answer must be A, B, C, or D")
        
        # Create new question
        question_data = {
            "topic_id": topic_id,
            "question_text": question_text.strip(),
            "option_a": option_a.strip(),
            "option_b": option_b.strip(),
            "option_c": option_c.strip(),
            "option_d": option_d.strip(),
            "correct_answer": correct_answer.strip(),
            "explanation": explanation.strip(),
        }
        
        create_res = supabase_client.table("quiz_questions").insert(question_data).execute()
        
        if not create_res.data:
            raise HTTPException(status_code=500, detail="Failed to create quiz question")
        
        return {"success": True, "question": create_res.data[0], "message": "Quiz question created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quiz question: {str(e)}")


@app.delete("/courses/{course_id}/quizzes/{topic_id}/questions/{question_id}")
async def delete_quiz_question_route(
    course_id: str,
    topic_id: str,
    question_id: str,
    user_email: str = Form(...),
):
    """
    Delete a quiz question
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"]
        )
        
        # Verify user has permission (course owner)
        user_res = supabase_client.table("users").select("id").eq("email", user_email).execute()
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user_res.data[0]["id"]
        
        course_res = supabase_client.table("courses").select("created_by").eq("id", course_id).execute()
        if not course_res.data or course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Verify question exists and belongs to the topic/course
        question_res = supabase_client.table("quiz_questions").select("topic_id").eq("id", question_id).execute()
        if not question_res.data or question_res.data[0]["topic_id"] != topic_id:
            raise HTTPException(status_code=404, detail="Quiz question not found or doesn't belong to this topic")
        
        # Delete the question
        delete_res = supabase_client.table("quiz_questions").delete().eq("id", question_id).execute()
        
        return {"success": True, "message": "Quiz question deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting quiz question: {str(e)}")

