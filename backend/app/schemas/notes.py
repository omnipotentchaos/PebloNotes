"""
Peblo Conjure — Notes Schemas
Request/response models for notes CRUD and management.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NoteCreate(BaseModel):
    title: str = Field(default="Untitled", max_length=500)
    content: str = Field(default="")
    tags: list[str] = Field(default_factory=list)
    category: Optional[str] = None
    is_pinned: bool = False


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None


class NoteResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    tags: list[str]
    category: Optional[str]
    is_pinned: bool
    is_archived: bool
    is_public: bool
    share_id: Optional[str]
    ai_summary: Optional[str]
    ai_action_items: Optional[list[str]]
    ai_suggested_title: Optional[str]
    word_count: int
    created_at: str
    updated_at: str


class NoteListResponse(BaseModel):
    notes: list[NoteResponse]
    total: int


class ShareResponse(BaseModel):
    share_id: str
    share_url: str
    is_public: bool
