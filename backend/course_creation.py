import os
import tempfile
import shutil
from pathlib import Path
from typing import List

from fastapi import HTTPException, UploadFile
from supabase.client import create_client

from ingestion import files_upload


async def create_course(
    *,
    code: str,
    name: str,
    user_email: str,
    files: List[UploadFile],
):
    """
    Create a new course for the user, store uploaded file metadata, and ingest content.
    - Inserts into courses (code, name, created_by, files_count, quizzes_count)
    - Inserts each file into course_files (course_id, uploaded_by, filename)
    - Runs ingestion to populate ingested_documents with course_id and course_file_id
    """
    temp_dir = None
    try:
        # Initialize Supabase client
        supabase_client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )

        # Resolve user by email to get UUID
        user_res = (
            supabase_client.table("users").select("id").eq("email", user_email).execute()
        )
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found for provided email")
        user_id = user_res.data[0]["id"]

        # Create course (files_count based on current upload)
        try:
            course_insert = {
                "code": code,
                "name": name,
                "created_by": user_id,
                "files_count": len(files),
                "quizzes_count": 0,
            }
            course_res = supabase_client.table("courses").insert(course_insert).execute()
        except Exception as e:
            # Likely duplicate code due to unique constraint
            raise HTTPException(status_code=400, detail=f"Failed to create course: {str(e)}")

        if not course_res.data:
            raise HTTPException(status_code=500, detail="Course creation failed")
        course = course_res.data[0]
        course_id = course["id"]

        # Prepare temp dir and save files while inserting course_files rows
        temp_dir = Path(tempfile.mkdtemp())
        filename_to_fileid = {}
        uploaded_files = []

        for file in files:
            # Validate file type
            if not file.filename.lower().endswith(
                (".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt")
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported file type: {file.filename}. Supported types: "
                        "PDF, DOC, DOCX, PPT, PPTX, TXT"
                    ),
                )

            # Size check 10MB
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} is too large. Maximum size is 10MB.",
                )

            # Insert course_files row first to get course_file_id
            cf_res = (
                supabase_client.table("course_files")
                .insert(
                    {
                        "course_id": course_id,
                        "uploaded_by": user_id,
                        "filename": file.filename,
                    }
                )
                .execute()
            )
            if not cf_res.data:
                raise HTTPException(status_code=500, detail="Failed to create course file record")
            course_file_id = cf_res.data[0]["id"]
            filename_to_fileid[file.filename] = course_file_id

            # Save file to temp dir for ingestion
            file_path = temp_dir / file.filename
            with open(file_path, "wb") as f:
                f.write(content)
            uploaded_files.append({"filename": file.filename, "size": len(content)})

        # Run ingestion with course and file IDs (only add course_id and course_file_id)
        ingestion_result = files_upload(
            temp_dir, 
            course_id=course_id, 
            course_file_ids=filename_to_fileid,
            user_email=user_email,
            generate_quiz=True
        )

        # Generate quizzes if file contents are available
        quiz_results = None
        if isinstance(ingestion_result, dict) and ingestion_result.get("file_contents"):
            try:
                from ingestion import generate_quizzes_for_files
                quiz_results = await generate_quizzes_for_files(
                    course_id=course_id,
                    user_email=user_email,
                    file_contents=ingestion_result["file_contents"],
                    course_file_ids=filename_to_fileid
                )
            except Exception as e:
                print(f"Quiz generation error: {e}")
                quiz_results = {"success": False, "error": str(e)}

        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        temp_dir = None

        return {
            "success": True,
            "message": f"Course created and {len(uploaded_files)} file(s) ingested",
            "course": course,
            "files": uploaded_files,
            "ingestion_result": ingestion_result,
            "quiz_generation_result": quiz_results,
        }

    except HTTPException:
        # Bubble up
        raise
    except Exception as e:
        if temp_dir is not None:
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error creating course: {str(e)}")
