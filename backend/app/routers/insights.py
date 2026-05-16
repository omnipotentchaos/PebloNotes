"""
Peblo Conjure — Insights Router
Productivity dashboard analytics — total notes, activity, tag usage, AI stats.
"""

from fastapi import APIRouter, Depends
from datetime import datetime, timezone, timedelta
import logging

from app.core.security import get_current_user
from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("")
async def get_insights(current_user: dict = Depends(get_current_user)):
    """Get comprehensive productivity insights for the dashboard."""
    db = get_supabase_admin()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)

    try:
        # ── Total notes ──
        all_notes = db.table("notes").select("*").eq("user_id", user_id).execute()
        notes = all_notes.data or []

        total_notes = len(notes)
        active_notes = sum(1 for n in notes if not n.get("is_archived", False))
        archived_notes = sum(1 for n in notes if n.get("is_archived", False))
        shared_notes = sum(1 for n in notes if n.get("is_public", False))
        total_words = sum(len((n.get("content") or "").split()) for n in notes)

        # ── Recently edited (last 7 days) ──
        week_ago = (now - timedelta(days=7)).isoformat()
        recent_notes = [
            {
                "id": n["id"],
                "title": n.get("title", "Untitled"),
                "updated_at": n.get("updated_at", ""),
            }
            for n in notes
            if n.get("updated_at", "") >= week_ago and not n.get("is_archived", False)
        ]
        recent_notes.sort(key=lambda x: x["updated_at"], reverse=True)

        # ── Most used tags ──
        tag_counts = {}
        for note in notes:
            for tag in (note.get("tags") or []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        top_tags = sorted(tag_counts.items(), key=lambda x: -x[1])[:10]

        # ── Weekly activity (last 4 weeks) ──
        weekly_activity = []
        for i in range(4):
            week_start = now - timedelta(weeks=i + 1)
            week_end = now - timedelta(weeks=i)
            count = sum(
                1 for n in notes
                if week_start.isoformat() <= n.get("updated_at", "") <= week_end.isoformat()
            )
            weekly_activity.append({
                "week": f"Week {4 - i}",
                "week_start": week_start.strftime("%b %d"),
                "week_end": week_end.strftime("%b %d"),
                "notes_edited": count,
            })
        weekly_activity.reverse()

        # ── Daily activity (last 7 days) ──
        daily_activity = []
        for i in range(7):
            day = now - timedelta(days=6 - i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = sum(
                1 for n in notes
                if day_start.isoformat() <= n.get("updated_at", "") <= day_end.isoformat()
            )
            daily_activity.append({
                "day": day.strftime("%a"),
                "date": day.strftime("%b %d"),
                "notes_edited": count,
            })

        # ── AI usage ──
        try:
            ai_result = db.table("ai_usage_logs").select("*").eq("user_id", user_id).execute()
            ai_logs = ai_result.data or []
            ai_stats = {
                "total_summaries": len(ai_logs),
                "total_tokens": sum(log.get("tokens_used", 0) for log in ai_logs),
            }
        except Exception:
            ai_stats = {"total_summaries": 0, "total_tokens": 0}

        # ── Category breakdown ──
        category_counts = {}
        for note in notes:
            cat = note.get("category") or "Uncategorized"
            category_counts[cat] = category_counts.get(cat, 0) + 1

        return {
            "overview": {
                "total_notes": total_notes,
                "active_notes": active_notes,
                "archived_notes": archived_notes,
                "shared_notes": shared_notes,
                "total_words": total_words,
            },
            "recent_notes": recent_notes[:5],
            "top_tags": [{"name": t[0], "count": t[1]} for t in top_tags],
            "weekly_activity": weekly_activity,
            "daily_activity": daily_activity,
            "ai_usage": ai_stats,
            "categories": [{"name": k, "count": v} for k, v in sorted(category_counts.items(), key=lambda x: -x[1])],
        }

    except Exception as e:
        logger.error(f"Insights error: {e}")
        return {
            "overview": {"total_notes": 0, "active_notes": 0, "archived_notes": 0, "shared_notes": 0, "total_words": 0},
            "recent_notes": [],
            "top_tags": [],
            "weekly_activity": [],
            "daily_activity": [],
            "ai_usage": {"total_summaries": 0, "total_tokens": 0},
            "categories": [],
        }
