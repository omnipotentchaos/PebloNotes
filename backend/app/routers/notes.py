"""
Peblo Conjure — Notes Router
Full CRUD for notes with auto-save, tagging, archiving, and search.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from typing import Optional
import uuid
import logging

from app.schemas.notes import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse, ShareResponse
from app.core.security import get_current_user
from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes"])


def _format_note(raw: dict) -> dict:
    """Normalize a raw DB row into a NoteResponse-compatible dict."""
    return {
        "id": raw["id"],
        "user_id": raw["user_id"],
        "title": raw.get("title", "Untitled"),
        "content": raw.get("content", ""),
        "tags": raw.get("tags", []) or [],
        "category": raw.get("category"),
        "is_pinned": raw.get("is_pinned", False),
        "is_archived": raw.get("is_archived", False),
        "is_public": raw.get("is_public", False),
        "share_id": raw.get("share_id"),
        "ai_summary": raw.get("ai_summary"),
        "ai_action_items": raw.get("ai_action_items"),
        "ai_suggested_title": raw.get("ai_suggested_title"),
        "word_count": len((raw.get("content") or "").split()),
        "created_at": raw.get("created_at", ""),
        "updated_at": raw.get("updated_at", ""),
    }


@router.get("", response_model=NoteListResponse)
async def list_notes(
    search: Optional[str] = Query(None, description="Search keyword"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    category: Optional[str] = Query(None, description="Filter by category"),
    is_archived: bool = Query(False, description="Show archived notes"),
    sort_by: str = Query("updated_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List notes with search, filtering, and sorting."""
    db = get_supabase_admin()
    query = db.table("notes").select("*").eq("user_id", current_user["id"])

    # Filters
    query = query.eq("is_archived", is_archived)

    if search:
        # Full-text search on title and content
        query = query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")

    if tag:
        query = query.contains("tags", [tag])

    if category:
        query = query.eq("category", category)

    # Sorting
    ascending = sort_order.lower() == "asc"
    query = query.order(sort_by, desc=not ascending)

    # Pagination
    query = query.range(offset, offset + limit - 1)

    result = query.execute()
    notes = [_format_note(n) for n in (result.data or [])]

    # Get total count
    count_query = db.table("notes").select("id", count="exact").eq("user_id", current_user["id"]).eq("is_archived", is_archived)
    if search:
        count_query = count_query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")
    if tag:
        count_query = count_query.contains("tags", [tag])
    if category:
        count_query = count_query.eq("category", category)
    count_result = count_query.execute()

    return NoteListResponse(notes=notes, total=count_result.count or len(notes))


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    req: NoteCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new note."""
    db = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()
    note_id = str(uuid.uuid4())

    note_data = {
        "id": note_id,
        "user_id": current_user["id"],
        "title": req.title,
        "content": req.content,
        "tags": req.tags,
        "category": req.category,
        "is_pinned": req.is_pinned,
        "is_archived": False,
        "is_public": False,
        "share_id": None,
        "ai_summary": None,
        "ai_action_items": None,
        "ai_suggested_title": None,
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = db.table("notes").insert(note_data).execute()
        return NoteResponse(**_format_note(result.data[0]))
    except Exception as e:
        logger.error(f"Create note error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create note")


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single note by ID."""
    db = get_supabase_admin()
    result = db.table("notes").select("*").eq("id", note_id).eq("user_id", current_user["id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Note not found")

    return NoteResponse(**_format_note(result.data[0]))


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    req: NoteUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a note (supports partial updates for auto-save)."""
    db = get_supabase_admin()

    # Verify ownership
    existing = db.table("notes").select("id").eq("id", note_id).eq("user_id", current_user["id"]).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = req.model_dump(exclude_none=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = db.table("notes").update(update_data).eq("id", note_id).execute()
        return NoteResponse(**_format_note(result.data[0]))
    except Exception as e:
        logger.error(f"Update note error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update note")


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    """Permanently delete a note."""
    db = get_supabase_admin()

    existing = db.table("notes").select("id").eq("id", note_id).eq("user_id", current_user["id"]).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Note not found")

    db.table("notes").delete().eq("id", note_id).execute()


@router.post("/{note_id}/share", response_model=ShareResponse)
async def toggle_share(note_id: str, current_user: dict = Depends(get_current_user)):
    """Generate or toggle public share link for a note."""
    db = get_supabase_admin()

    result = db.table("notes").select("*").eq("id", note_id).eq("user_id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Note not found")

    note = result.data[0]
    is_currently_public = note.get("is_public", False)

    if is_currently_public:
        # Unshare
        db.table("notes").update({"is_public": False, "share_id": None}).eq("id", note_id).execute()
        return ShareResponse(share_id="", share_url="", is_public=False)
    else:
        # Share with new ID
        share_id = str(uuid.uuid4())[:8]
        db.table("notes").update({"is_public": True, "share_id": share_id}).eq("id", note_id).execute()
        return ShareResponse(
            share_id=share_id,
            share_url=f"/shared/{share_id}",
            is_public=True,
        )


@router.get("/tags/all")
async def get_all_tags(current_user: dict = Depends(get_current_user)):
    """Get all unique tags used by the current user."""
    db = get_supabase_admin()
    result = db.table("notes").select("tags").eq("user_id", current_user["id"]).eq("is_archived", False).execute()

    all_tags = {}
    for note in result.data or []:
        for tag in (note.get("tags") or []):
            all_tags[tag] = all_tags.get(tag, 0) + 1

    return {"tags": [{"name": k, "count": v} for k, v in sorted(all_tags.items(), key=lambda x: -x[1])]}
