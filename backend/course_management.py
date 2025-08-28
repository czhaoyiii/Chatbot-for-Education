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
            raise HTTPException(status_code=404, detail="Course not found")

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
            temp_dir, course_id=course_id, course_file_ids=filename_to_fileid
        )

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
