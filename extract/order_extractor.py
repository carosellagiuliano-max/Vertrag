"""Order extraction powered by OpenAI LLMs."""
from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, Dict, List, Optional

from openai import OpenAI
from openai.types import Response

from config import get_settings
from layout.base import LayoutAnalysisResult
from models.order import OrderExtractionResult
from profiles.customer_profile import CustomerProfile
from reasoning.prompt_builder import PromptBuilder, PromptContext
from schemas.registry import schema_registry

LOGGER = logging.getLogger(__name__)


@dataclass
class ReasoningRequest:
    """Normalized inputs for the reasoning engine."""

    text: str
    raw_filename: str
    customer_profile: CustomerProfile
    schema_literal: str
    json_schema: Dict[str, Any]
    form_id: Optional[str] = None
    layout: Optional[LayoutAnalysisResult] = None


class OrderExtractor:
    """High-level orchestrator that prompts the LLM and parses the response."""

    def __init__(
        self,
        *,
        client: Optional[OpenAI] = None,
        model_name: Optional[str] = None,
        prompt_builder: Optional[PromptBuilder] = None,
    ) -> None:
        settings = get_settings()
        self.client = client or OpenAI(api_key=settings.openai_api_key)
        self.model_name = model_name or settings.model_name
        self.max_tokens = 4096
        self.prompt_builder = prompt_builder or PromptBuilder()

    async def extract_order(
        self,
        *,
        text: str,
        raw_filename: str,
        customer_profile: CustomerProfile,
        form_id: Optional[str] = None,
        layout: Optional[LayoutAnalysisResult] = None,
        schema_name: str = "order_v1",
    ) -> OrderExtractionResult:
        schema_literal = schema_registry.get_literal(schema_name)
        json_schema = schema_registry.get_json_schema(schema_name)
        request = ReasoningRequest(
            text=text,
            raw_filename=raw_filename,
            customer_profile=customer_profile,
            form_id=form_id,
            layout=layout,
            schema_literal=schema_literal,
            json_schema=json_schema,
        )
        return await self.extract_order_with_prompt(request=request, prompt_builder=self.prompt_builder)

    async def extract_order_with_prompt(
        self,
        *,
        request: ReasoningRequest,
        prompt_builder: Optional[PromptBuilder] = None,
    ) -> OrderExtractionResult:
        builder = prompt_builder or self.prompt_builder
        prompt_context = PromptContext(
            profile=request.customer_profile,
            form_id=request.form_id,
            raw_text=request.text,
            raw_filename=request.raw_filename,
            layout=request.layout,
            schema_literal=request.schema_literal,
        )
        system_message, user_message = builder.build_messages(prompt_context)
        payload = await asyncio.to_thread(
            self._call_llm,
            system_message,
            user_message,
            request,
        )
        return OrderExtractionResult(**payload)

    # ------------------------------------------------------------------
    def _call_llm(
        self,
        system_message: str,
        user_message: str,
        request: ReasoningRequest,
    ) -> Dict[str, Any]:
        response = self.client.responses.create(
            model=self.model_name,
            temperature=0.0,
            max_output_tokens=self.max_tokens,
            logprobs=True,
            input=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_schema", "json_schema": request.json_schema},
        )
        json_payload = self._parse_response_json(response)
        json_payload.setdefault("header", {})
        json_payload.setdefault("lines", [])
        json_payload.setdefault("totals", None)
        json_payload.setdefault("customer_profile_id", request.customer_profile.id)
        json_payload.setdefault("confidence", None)
        self._normalize_decimal_fields(json_payload)
        logprob_confidence = self._compute_confidence(response)
        if logprob_confidence is not None:
            json_payload["confidence"] = logprob_confidence
        if not json_payload.get("header", {}).get("raw_filename"):
            json_payload["header"]["raw_filename"] = request.raw_filename
        header = json_payload.get("header", {})
        if not header.get("currency") and request.customer_profile.default_currency:
            header["currency"] = request.customer_profile.default_currency
        json_payload["header"] = header
        return json_payload

    # ------------------------------------------------------------------
    @staticmethod
    def _parse_response_json(response: Response) -> Dict[str, Any]:
        chunks: List[str] = []
        for item in response.output:
            for content in item.content:
                if content.type == "output_text":
                    chunks.append(content.text)
        raw_json = "".join(chunks).strip()
        return json.loads(raw_json)

    @staticmethod
    def _normalize_decimal_fields(payload: Dict[str, Any]) -> None:
        totals = payload.get("totals")
        if totals:
            for field in ["subtotal", "tax_amount", "grand_total"]:
                if field in totals and totals[field] is not None:
                    totals[field] = str(Decimal(str(totals[field])))
            payload["totals"] = totals
        for line in payload.get("lines", []):
            for field in ["unit_price", "line_total"]:
                if line.get(field) is not None:
                    line[field] = str(Decimal(str(line[field])))

    @staticmethod
    def _compute_confidence(response: Response) -> Optional[float]:
        try:
            response_dict = response.model_dump()
        except AttributeError:
            response_dict = json.loads(json.dumps(response))
        scores: List[float] = []
        for item in response_dict.get("output", []):
            for content in item.get("content", []):
                logprob_entries = content.get("logprobs", {}).get("content", [])
                for entry in logprob_entries:
                    top = entry.get("top_logprobs") or []
                    if top:
                        scores.append(top[0].get("logprob", 0.0))
        if not scores:
            return None
        avg = sum(scores) / len(scores)
        return float(min(1.0, max(0.0, 1 + avg / 5)))
