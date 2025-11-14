"""Application configuration helpers."""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, Field


class Settings(BaseModel):
    """Runtime configuration loaded from environment variables."""

    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    model_name: str = Field(default="gpt-4o-2025-09-01", alias="MODEL_NAME")
    openai_timeout: float = Field(default=60.0, alias="OPENAI_TIMEOUT")
    request_timeout: float = Field(default=90.0, alias="REQUEST_TIMEOUT")

    class Config:
        populate_by_name = True
        extra = "ignore"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()
