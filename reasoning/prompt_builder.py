"""Prompt construction utilities for the reasoning layer."""
"""Prompt construction utilities for the reasoning layer."""
from __future__ import annotations

from dataclasses import dataclass

from layout.base import LayoutAnalysisResult
from profiles.customer_profile import CustomerProfile


@dataclass
class PromptContext:
    profile: CustomerProfile
    form_id: str | None
    raw_text: str
    raw_filename: str
    layout: LayoutAnalysisResult | None
    schema_literal: str


class PromptBuilder:
    """High-level builder that injects metadata, schema, and layout cues."""

    def build_messages(self, context: PromptContext) -> tuple[str, str]:
        system_message = self._build_system_message()
        user_message = self._build_user_message(context)
        return system_message, user_message

    def _build_system_message(self) -> str:
        return (
            "You are an order-extraction engine for an ERP system. You read noisy PDF order forms and output exactly one JSON "
            "object conforming to a fixed schema. Use only information present in the text; leave ambiguous fields null. Never "
            "invent internal product numbers. Do not output anything except the JSON."
        )

    def _build_user_message(self, context: PromptContext) -> str:
        profile = context.profile
        intro = profile.to_prompt_metadata(context.form_id)
        schema_literal = context.schema_literal
        instructions = (
            "Return a single JSON object matching the schema. No markdown fences, no comments, no extra whitespace. "
            "If unsure about a field, set it to null."
        )
        examples = profile.few_shot_examples(context.form_id)
        example_section = f"\nFew-shot examples:\n{examples}\n" if examples else ""
        layout_section = (
            f"\n{context.layout.to_prompt_section()}\n" if context.layout and context.layout.blocks else ""
        )
        return (
            f"Document type: customer order form. Active customer profile: {profile.id}."\
            f"\n{intro}\n{layout_section}\nLiteral JSON schema (as provided):\n{schema_literal}\n\n"
            f"Raw text extracted from the PDF (triple-backtick fenced).\n```{context.raw_text}```\n\n"
            f"Instructions:\n{instructions}\n{example_section}Raw filename: {context.raw_filename}"
        )
