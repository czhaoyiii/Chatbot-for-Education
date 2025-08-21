import os
import uuid
from datetime import datetime
from supabase import create_client, Client
from pydantic import BaseModel
from fastapi import HTTPException
from zoneinfo import ZoneInfo

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

class UserLoginRequest(BaseModel):
    email: str

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    created_at: str

async def login_user(request: UserLoginRequest) -> UserResponse:
    """
    Handle user login - create user with Student role if first time, 
    or return existing user (preserving admin-assigned Professor role)
    """
    try:        
        # Check if user already exists
        existing_user = supabase.table("users").select("*").eq("email", request.email).execute()
        
        if existing_user.data:
            # User exists, return existing data (preserves admin-assigned roles)
            user = existing_user.data[0]
            return UserResponse(
                id=user["id"],
                email=user["email"],
                role=user["role"],
                created_at=user["created_at"]
            )
        else:
            new_user_data = {
                "email": request.email,
                "role": "student"  # Use lowercase to match your database constraint
            }
            
            result = supabase.table("users").insert(new_user_data).execute()
            
            if result.data:
                user = result.data[0]
                return UserResponse(
                    id=user["id"],
                    email=user["email"],
                    role=user["role"],
                    created_at=user["created_at"]
                )
            else:
                raise HTTPException(status_code=500, detail="Failed to create user")
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during login: {str(e)}")

async def get_user_by_email(email: str) -> UserResponse:
    """
    Get user information by email
    """
    try:        
        user_data = supabase.table("users").select("*").eq("email", email).execute()
        
        if user_data.data:
            user = user_data.data[0]
            return UserResponse(
                id=user["id"],
                email=user["email"],
                role=user["role"],
                created_at=user["created_at"]
            )
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving user: {str(e)}")
