"""
Peblo Conjure — AI Schemas
Request/response models for AI-powered features.
"""

from pydantic import BaseModel
from typing import Optional


class AISummaryRequest(BaseModel):
    content: str
    note_id: Optional[str] = None


class AISummaryResponse(BaseModel):
    summary: str
    action_items: list[str]
    suggested_title: str
    tokens_used: int


class AIUsageStats(BaseModel):
    total_summaries: int
    total_tokens_used: int
    summaries_today: int
    summaries_this_week: int
