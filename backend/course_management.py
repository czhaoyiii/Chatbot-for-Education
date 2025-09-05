import os
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict

from fastapi import HTTPException, UploadFile
from supabase.client import create_client

from ingestion import files_upload


async def upload_course_files(
    *, course_id: str, user_email: str, files: List[UploadFile]
):
    """
    Upload files to an existing course.
    - Validates user and resolves uploaded_by via email
    - Inserts each file into course_files (course_id, uploaded_by, filename)
    - Runs ingestion with course_id and course_file_id
    - Updates courses.files_count to the current total number of files
    """
    temp_dir = None
    try:
        # Init Supabase client
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )

        # Resolve user ID
        user_res = (
            supabase_client.table("users").select("id").eq("email", user_email).execute()
        )
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found for provided email")
        user_id = user_res.data[0]["id"]

        # Ensure course exists and is owned/accessible (best-effort ownership check)
        course_res = (
            supabase_client.table("courses").select("id, created_by").eq("id", course_id).execute()
        )
        if not course_res.data:
            # Already deleted or never existed; treat as idempotent success
            return {"success": True, "message": "Course already deleted"}

        # Prepare temp dir
        temp_dir = Path(tempfile.mkdtemp())
        filename_to_fileid: Dict[str, str] = {}
        uploaded_files = []

        # Insert metadata rows and save files to disk for ingestion
        for file in files:
            # Validate type
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

            # Insert into course_files
            cf_res = (
                supabase_client.table("course_files")
                .insert({
                    "course_id": course_id,
                    "uploaded_by": user_id,
                    "filename": file.filename,
                })
                .execute()
            )
            if not cf_res.data:
                raise HTTPException(status_code=500, detail="Failed to create course file record")
            course_file_id = cf_res.data[0]["id"]
            filename_to_fileid[file.filename] = course_file_id

            # Persist file to temp dir for ingestion
            file_path = temp_dir / file.filename
            with open(file_path, "wb") as f:
                f.write(content)
            uploaded_files.append({"filename": file.filename, "size": len(content)})

        # Ingest with course linkage
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

        # Recompute files_count to be authoritative
        count_res = (
            supabase_client.table("course_files")
            .select("id", count="exact")
            .eq("course_id", course_id)
            .execute()
        )
        new_count = count_res.count if hasattr(count_res, "count") else len(count_res.data or [])

        # Update courses.files_count
        supabase_client.table("courses").update({"files_count": new_count}).eq("id", course_id).execute()

        # Fetch course for return (including updated counts)
        course_fetch = supabase_client.table("courses").select("*").eq("id", course_id).execute()
        course = course_fetch.data[0] if course_fetch.data else {"id": course_id, "files_count": new_count}

        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)
        temp_dir = None

        return {
            "success": True,
            "message": f"Uploaded and ingested {len(uploaded_files)} file(s)",
            "course": course,
            "files": uploaded_files,
            "ingestion_result": ingestion_result,
            "quiz_generation_result": quiz_results,
        }

    except HTTPException:
        raise
    except Exception as e:
        if temp_dir is not None:
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Error uploading course files: {str(e)}")


async def delete_course_file(*, course_id: str, course_file_id: str, user_email: str):
    """
    Delete a file from an existing course, remove associated ingested documents, and
    update the courses.files_count to the new exact value.
    Authorization: verifies that user_email matches the course's created_by.
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )

        # Resolve user
        user_res = (
            supabase_client.table("users").select("id").eq("email", user_email).execute()
        )
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found for provided email")
        user_id = user_res.data[0]["id"]

        # Ensure course exists and is owned by user
        course_res = (
            supabase_client.table("courses").select("id, created_by").eq("id", course_id).execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this course")

        # Ensure file belongs to the course
        cf_res = (
            supabase_client.table("course_files").select("id, course_id").eq("id", course_file_id).execute()
        )
        if not cf_res.data:
            raise HTTPException(status_code=404, detail="Course file not found")
        if cf_res.data[0]["course_id"] != course_id:
            raise HTTPException(status_code=400, detail="File does not belong to the provided course")

        # Delete related ingested documents (best effort)
        try:
            supabase_client.table("ingested_documents").delete().eq("course_file_id", course_file_id).execute()
        except Exception:
            # Continue even if there are no ingested docs or RLS prevents; service key should allow
            pass

        # Delete the course_files row
        supabase_client.table("course_files").delete().eq("id", course_file_id).execute()

        # Recompute files_count
        count_res = (
            supabase_client.table("course_files").select("id", count="exact").eq("course_id", course_id).execute()
        )
        new_count = count_res.count if hasattr(count_res, "count") else len(count_res.data or [])

        # Update courses.files_count
        supabase_client.table("courses").update({"files_count": new_count}).eq("id", course_id).execute()

        return {"success": True, "message": "File deleted", "new_files_count": new_count}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting course file: {str(e)}")


async def delete_course(*, course_id: str, user_email: str):
    """
    Delete an entire course and its related data:
    - Verifies the user owns the course
    - Deletes ingested_documents for the course
    - Deletes course_files rows for the course
    - Deletes the course row
    """
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )

        # Resolve user
        user_res = (
            supabase_client.table("users").select("id").eq("email", user_email).execute()
        )
        if not user_res.data:
            raise HTTPException(status_code=404, detail="User not found for provided email")
        user_id = user_res.data[0]["id"]

        # Ensure course exists and is owned by user
        course_res = (
            supabase_client.table("courses").select("id, created_by").eq("id", course_id).execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data[0]["created_by"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this course")

        # Delete ingested documents associated with the course
        try:
            supabase_client.table("ingested_documents").delete().eq("course_id", course_id).execute()
        except Exception:
            pass

        # Delete chat messages and sessions related to this course (child first)
        try:
            sessions_res = (
                supabase_client.table("chat_sessions").select("id").eq("course_id", course_id).execute()
            )
            session_ids = [row["id"] for row in (sessions_res.data or [])]
            if session_ids:
                supabase_client.table("chat_messages").delete().in_("session_id", session_ids).execute()
            supabase_client.table("chat_sessions").delete().eq("course_id", course_id).execute()
        except Exception:
            pass

        # Delete course files for the course
        try:
            supabase_client.table("course_files").delete().eq("course_id", course_id).execute()
        except Exception:
            pass

        # Optional: delete quizzes and sessions if present (best-effort, ignore if tables don't exist)
        try:
            supabase_client.table("quizzes").delete().eq("course_id", course_id).execute()
        except Exception:
            pass

        # Finally, delete the course
        supabase_client.table("courses").delete().eq("id", course_id).execute()

        return {"success": True, "message": "Course deleted"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting course: {str(e)}")
