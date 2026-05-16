"""
Peblo Conjure — Auth Tests
Tests for signup, login, and authentication logic.
"""

import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_token


class TestPasswordHashing:
    def test_hash_password_returns_hash(self):
        hashed = hash_password("testpassword")
        assert hashed != "testpassword"
        assert len(hashed) > 20

    def test_verify_correct_password(self):
        hashed = hash_password("mypassword123")
        assert verify_password("mypassword123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("mypassword123")
        assert verify_password("wrongpassword", hashed) is False

    def test_different_hashes_for_same_password(self):
        hash1 = hash_password("samepass")
        hash2 = hash_password("samepass")
        assert hash1 != hash2  # bcrypt uses random salt


class TestJWT:
    def test_create_and_decode_token(self):
        token = create_access_token({"sub": "user-123", "email": "test@example.com"})
        payload = decode_token(token)
        assert payload["sub"] == "user-123"
        assert payload["email"] == "test@example.com"

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "user-123"})
        payload = decode_token(token)
        assert "exp" in payload

    def test_invalid_token_raises(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_token("invalid.token.here")
