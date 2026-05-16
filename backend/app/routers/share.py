"""
Peblo Conjure — Share Router
Public endpoints for accessing shared notes (no authentication required).
"""

from fastapi import APIRouter, HTTPException
import logging

from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/shared", tags=["Sharing"])


@router.get("/{share_id}")
async def get_shared_note(share_id: str):
    """Get a publicly shared note by its share ID. No authentication required."""
    db = get_supabase_admin()

    result = (
        db.table("notes")
        .select("id, title, content, tags, category, ai_summary, ai_action_items, created_at, updated_at")
        .eq("share_id", share_id)
        .eq("is_public", True)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Shared note not found or is no longer public")

    note = result.data[0]

    # Get author name
    try:
        author_result = (
            db.table("notes")
            .select("user_id")
            .eq("share_id", share_id)
            .execute()
        )
        if author_result.data:
            user_result = (
                db.table("users")
                .select("name")
                .eq("id", author_result.data[0]["user_id"])
                .execute()
            )
            note["author_name"] = user_result.data[0]["name"] if user_result.data else "Anonymous"
    except Exception:
        note["author_name"] = "Anonymous"

    note["word_count"] = len((note.get("content") or "").split())
    return note
