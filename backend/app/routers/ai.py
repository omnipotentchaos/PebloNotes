"""
Peblo Conjure — AI Router
Endpoints for AI-powered summary generation, action item extraction, and title suggestion.
"""

from fastapi import APIRouter, HTTPException, Depends
import logging

from app.schemas.ai import AISummaryRequest, AISummaryResponse
from app.services.ai_service import generate_ai_analysis
from app.core.security import get_current_user
from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-summary", response_model=AISummaryResponse)
async def generate_summary(
    req: AISummaryRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate AI summary, action items, and title suggestion from note content."""
    try:
        result = await generate_ai_analysis(
            content=req.content,
            user_id=current_user["id"],
            note_id=req.note_id,
        )

        # If note_id provided, persist AI results to the note
        if req.note_id:
            try:
                db = get_supabase_admin()
                db.table("notes").update({
                    "ai_summary": result.get("summary"),
                    "ai_action_items": result.get("action_items", []),
                    "ai_suggested_title": result.get("suggested_title"),
                }).eq("id", req.note_id).eq("user_id", current_user["id"]).execute()
            except Exception as e:
                logger.error(f"Failed to persist AI results: {e}")

        return AISummaryResponse(
            summary=result.get("summary", ""),
            action_items=result.get("action_items", []),
            suggested_title=result.get("suggested_title", ""),
            tokens_used=result.get("tokens_used", 0),
        )

    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/usage")
async def get_ai_usage(current_user: dict = Depends(get_current_user)):
    """Get AI usage statistics for the current user."""
    db = get_supabase_admin()

    try:
        result = db.table("ai_usage_logs").select("*").eq("user_id", current_user["id"]).execute()
        logs = result.data or []

        from datetime import datetime, timezone, timedelta
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())

        total_tokens = sum(log.get("tokens_used", 0) for log in logs)
        today_count = sum(
            1 for log in logs
            if log.get("created_at") and datetime.fromisoformat(log["created_at"].replace("Z", "+00:00")) >= today_start
        )
        week_count = sum(
            1 for log in logs
            if log.get("created_at") and datetime.fromisoformat(log["created_at"].replace("Z", "+00:00")) >= week_start
        )

        return {
            "total_summaries": len(logs),
            "total_tokens_used": total_tokens,
            "summaries_today": today_count,
            "summaries_this_week": week_count,
        }
    except Exception as e:
        logger.error(f"Failed to get AI usage: {e}")
        return {
            "total_summaries": 0,
            "total_tokens_used": 0,
            "summaries_today": 0,
            "summaries_this_week": 0,
        }
