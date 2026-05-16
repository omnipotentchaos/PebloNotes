"""
Peblo Conjure — Auth Router
Handles user signup, login, and profile retrieval.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid
import logging

from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse, UserResponse
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest):
    """Register a new user with email and password."""
    db = get_supabase_admin()

    # Check if email already exists
    existing = db.table("users").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.password)

    user_data = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "password_hash": hashed,
        "created_at": now,
        "updated_at": now,
    }

    try:
        db.table("users").insert(user_data).execute()
    except Exception as e:
        logger.error(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again.",
        )

    # Generate token
    token = create_access_token({"sub": user_id, "email": req.email})

    return AuthResponse(
        access_token=token,
        user={"id": user_id, "name": req.name, "email": req.email, "created_at": now},
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user with email and password."""
    db = get_supabase_admin()

    result = db.table("users").select("*").eq("email", req.email).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = result.data[0]
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": user["id"], "email": user["email"]})

    return AuthResponse(
        access_token=token,
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"],
        },
    )


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user's profile."""
    db = get_supabase_admin()
    result = db.table("users").select("id, name, email, created_at").eq("id", current_user["id"]).execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserResponse(**result.data[0])
