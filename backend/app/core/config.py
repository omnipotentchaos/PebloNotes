"""
Peblo Conjure — Core Configuration
Centralized settings via Pydantic v2 BaseSettings with .env support.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Application ──
    APP_NAME: str = "PebloNotes"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Authentication ──
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    # ── Supabase ──
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Cerebras AI ──
    CEREBRAS_API_KEY: str = ""
    CEREBRAS_MODEL: str = "llama3.1-8b"
    CEREBRAS_BASE_URL: str = "https://api.cerebras.ai/v1"

    # ── CORS ──
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()
