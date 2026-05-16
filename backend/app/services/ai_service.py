"""
Peblo Conjure — AI Service
Cerebras Llama 3.1-8B integration via OpenAI-compatible API.
Handles summary generation, action item extraction, and title suggestion.
"""

import json
import logging
from typing import Optional

from openai import OpenAI
from app.core.config import get_settings
from app.core.database import get_supabase_admin

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Cerebras Client (OpenAI-compatible) ──
cerebras_client = OpenAI(
    base_url=settings.CEREBRAS_BASE_URL,
    api_key=settings.CEREBRAS_API_KEY,
)

# ── System Prompt ──
SYSTEM_PROMPT = """You are an intelligent note-analysis assistant for Peblo Conjure, a collaborative AI notes workspace. 
When given note content, you MUST respond with valid JSON only (no markdown, no code fences, no explanation) in this exact format:
{
  "summary": "A concise 2-3 sentence summary of the note's key points",
  "action_items": ["Actionable task 1", "Actionable task 2"],
  "suggested_title": "A clear, descriptive title for this note"
}

Rules:
- summary: Extract the core ideas. Be concise but comprehensive.
- action_items: Extract concrete, actionable tasks. If none exist, return an empty array.
- suggested_title: Create a professional, descriptive title (max 60 chars).
- Return ONLY raw JSON. No markdown formatting. No code blocks. No extra text."""


async def generate_ai_analysis(
    content: str,
    user_id: str,
    note_id: Optional[str] = None,
) -> dict:
    """
    Generate AI summary, action items, and title suggestion from note content.
    Uses Cerebras Llama 3.1-8B for fast inference.
    """
    if not content or len(content.strip()) < 10:
        return {
            "summary": "Note content is too short to generate a meaningful summary.",
            "action_items": [],
            "suggested_title": "Untitled Note",
            "tokens_used": 0,
        }

    try:
        response = cerebras_client.chat.completions.create(
            model=settings.CEREBRAS_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Analyze this note and return JSON:\n\n{content[:4000]}",
                },
            ],
            temperature=0.3,
            max_tokens=800,
        )

        raw_content = response.choices[0].message.content.strip()
        tokens_used = response.usage.total_tokens if response.usage else 0

        # Parse the JSON response — handle potential markdown wrapping
        cleaned = raw_content
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse AI response as JSON: {raw_content[:200]}")
            result = {
                "summary": raw_content[:500],
                "action_items": [],
                "suggested_title": "AI Generated Note",
            }

        result["tokens_used"] = tokens_used

        # Log AI usage to Supabase
        try:
            db = get_supabase_admin()
            db.table("ai_usage_logs").insert(
                {
                    "user_id": user_id,
                    "note_id": note_id,
                    "tokens_used": tokens_used,
                    "operation": "generate_summary",
                }
            ).execute()
        except Exception as log_err:
            logger.error(f"Failed to log AI usage: {log_err}")

        return result

    except Exception as e:
        logger.error(f"Cerebras API error: {e}")
        raise Exception(f"AI service temporarily unavailable: {str(e)}")
