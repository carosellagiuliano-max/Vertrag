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

    deepseek_api_key: Optional[str] = Field(default=None, alias="DEEPSEEK_API_KEY")
    deepseek_ocr_api_key: Optional[str] = Field(default=None, alias="DEEPSEEK_OCR_API_KEY")
    deepseek_ocr_endpoint: Optional[str] = Field(default=None, alias="DEEPSEEK_OCR_ENDPOINT")
    deepseek_ocr_timeout: float = Field(default=45.0, alias="DEEPSEEK_OCR_TIMEOUT")
    ocr_render_dpi: int = Field(default=220, alias="OCR_RENDER_DPI")

    extractor_min_characters: int = Field(default=200, alias="EXTRACTOR_MIN_CHARACTERS")
    extractor_min_alpha_ratio: float = Field(default=0.05, alias="EXTRACTOR_MIN_ALPHA_RATIO")

    class Config:
        populate_by_name = True
        extra = "ignore"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached settings instance."""

    return Settings()
