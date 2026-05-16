"""
Peblo Conjure — Schema Validation Tests
Tests for Pydantic v2 request/response model validation.
"""

import pytest
from pydantic import ValidationError
from app.schemas.auth import SignupRequest, LoginRequest
from app.schemas.notes import NoteCreate, NoteUpdate
from app.schemas.ai import AISummaryRequest


class TestAuthSchemas:
    def test_valid_signup(self):
        req = SignupRequest(name="John Doe", email="john@example.com", password="secret123")
        assert req.name == "John Doe"
        assert req.email == "john@example.com"

    def test_signup_short_name_fails(self):
        with pytest.raises(ValidationError):
            SignupRequest(name="J", email="john@example.com", password="secret123")

    def test_signup_invalid_email_fails(self):
        with pytest.raises(ValidationError):
            SignupRequest(name="John", email="not-an-email", password="secret123")

    def test_signup_short_password_fails(self):
        with pytest.raises(ValidationError):
            SignupRequest(name="John", email="john@example.com", password="12345")

    def test_valid_login(self):
        req = LoginRequest(email="john@example.com", password="secret")
        assert req.email == "john@example.com"


class TestNoteSchemas:
    def test_note_create_defaults(self):
        note = NoteCreate()
        assert note.title == "Untitled"
        assert note.content == ""
        assert note.tags == []
        assert note.is_pinned is False

    def test_note_create_with_data(self):
        note = NoteCreate(title="My Note", content="Hello", tags=["work"], category="General")
        assert note.title == "My Note"
        assert note.tags == ["work"]

    def test_note_update_partial(self):
        update = NoteUpdate(title="Updated Title")
        data = update.model_dump(exclude_none=True)
        assert "title" in data
        assert "content" not in data


class TestAISchemas:
    def test_ai_request_with_content(self):
        req = AISummaryRequest(content="This is my note content")
        assert req.content == "This is my note content"
        assert req.note_id is None

    def test_ai_request_with_note_id(self):
        req = AISummaryRequest(content="Content", note_id="note-123")
        assert req.note_id == "note-123"
