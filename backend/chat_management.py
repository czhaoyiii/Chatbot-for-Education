import os
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from pydantic import BaseModel
from openai import AsyncOpenAI
from supabase.client import create_client

from agent import cpss_chat_expert, CPSSChatDeps


class ChatSendRequest(BaseModel):
    message: str
    # One of these must be provided to identify the user
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    # Identify the course; backend will resolve to course_id
    course_id: Optional[str] = None
    course_code: Optional[str] = None
    # Optional existing session
    session_id: Optional[str] = None


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
            # Count existing sessions for this user+course to append sequence number
            try:
                existing = (
                    supabase_client.table("chat_sessions")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("course_id", course_id)
                    .execute()
                )
                seq = (len(existing.data) if existing and existing.data is not None else 0) + 1
            except Exception:
                # Fallback if count fails
                seq = 1

            base_title_parts = [p for p in [course_code, course_name] if p]
            base_title = " - ".join(base_title_parts) if base_title_parts else "Chat"
            title = f"{base_title} - Chat {seq}"
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


async def list_chat_sessions(user_id: Optional[str] = None, user_email: Optional[str] = None):
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


async def list_session_messages(session_id: str):
    try:
        supabase_client = create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"]
        )
        mres = (
            supabase_client.table("chat_messages")
            .select("id, content, sender, thinking_time, created_at")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .execute()
        )
        return {"success": True, "messages": mres.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"List messages error: {str(e)}")
