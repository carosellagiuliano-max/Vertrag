"""Composable ingestion pipeline for order extraction."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from extract.base import DocumentExtractionContext, TextExtractionEngine
from layout.base import LayoutAnalyzer, NullLayoutAnalyzer
from models.order import OrderExtractionResult
from profiles.customer_profile import CustomerProfileRepository
from reasoning.prompt_builder import PromptBuilder
from schemas.registry import schema_registry
from extract.order_extractor import OrderExtractor, ReasoningRequest


@dataclass
class PipelineConfig:
    text_extractor: TextExtractionEngine
    reasoning_engine: OrderExtractor
    layout_analyzer: LayoutAnalyzer | None = None
    profile_repository: CustomerProfileRepository | None = None
    prompt_builder: PromptBuilder | None = None
    schema_name: str = "order_v1"


class OrderIngestionPipeline:
    """Coordinates the end-to-end ingestion flow."""

    def __init__(self, config: PipelineConfig) -> None:
        self.config = config
        self.layout_analyzer = config.layout_analyzer or NullLayoutAnalyzer()
        self.profile_repo = config.profile_repository or CustomerProfileRepository()
        self.prompt_builder = config.prompt_builder or PromptBuilder()

    async def run(
        self,
        *,
        source_path: Path,
        raw_filename: str,
        customer_profile_id: Optional[str],
        form_id: Optional[str] = None,
    ) -> OrderExtractionResult:
        profile = self.profile_repo.load(customer_profile_id)
        context = DocumentExtractionContext(
            raw_filename=raw_filename,
            customer_profile_id=profile.id,
        )
        extraction = await self.config.text_extractor.extract(source_path, context)
        layout_result = await self.layout_analyzer.analyze(source_path, extraction, context)
        schema_literal = schema_registry.get_literal(self.config.schema_name)
        json_schema = schema_registry.get_json_schema(self.config.schema_name)
        prompt_context = ReasoningRequest(
            text=extraction.text,
            raw_filename=raw_filename,
            customer_profile=profile,
            form_id=form_id,
            layout=layout_result,
            schema_literal=schema_literal,
            json_schema=json_schema,
        )
        return await self.config.reasoning_engine.extract_order_with_prompt(
            request=prompt_context,
            prompt_builder=self.prompt_builder,
        )
