"""
Peblo Conjure — Supabase Database Client
Provides singleton Supabase client instances for data operations.
"""

from functools import lru_cache
from supabase import create_client, Client
from app.core.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client using anon key (respects RLS)."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache()
def get_supabase_admin() -> Client:
    """Get Supabase admin client using service role key (bypasses RLS)."""
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
