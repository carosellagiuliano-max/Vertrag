"""CLI helper that mimics LLM extraction using a mock client."""
from __future__ import annotations

import argparse
import asyncio
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

from extract.order_extractor import OrderExtractor
from profiles.customer_profile import CustomerProfile


@dataclass
class _MockContent:
    type: str
    text: str
    logprobs: Dict[str, Any] | None = None


@dataclass
class _MockOutput:
    content: list[_MockContent]


@dataclass
class _MockResponse:
    output: list[_MockOutput]

    def model_dump(self) -> Dict[str, Any]:
        return {
            "output": [
                {
                    "content": [
                        {
                            "logprobs": content.logprobs or {},
                        }
                        for content in block.content
                    ]
                }
                for block in self.output
            ]
        }


class MockOpenAI:
    """Very small subset of the OpenAI client for offline testing."""

    class _Responses:
        def __init__(self, outer: "MockOpenAI") -> None:
            self.outer = outer

        def create(self, **_: Any) -> _MockResponse:  # noqa: ANN401 - mimic SDK signature
            payload = self.outer._build_mock_payload()
            content = _MockContent(type="output_text", text=json.dumps(payload))
            return _MockResponse(output=[_MockOutput(content=[content])])

    def __init__(self, text: str) -> None:
        self.text = text
        self.responses = MockOpenAI._Responses(self)

    def _build_mock_payload(self) -> Dict[str, Any]:
        lines = []
        quantity = self._find_value("qty")
        if quantity:
            lines.append(
                {
                    "line_no": 10000,
                    "customer_item_no": "MOCK-ITEM",
                    "internal_item_no": None,
                    "description": "Mock line derived offline",
                    "quantity": float(quantity),
                    "unit": "EA",
                    "unit_price": "10.00",
                    "discount_percent": 0.0,
                    "line_total": "10.00",
                }
            )
        return {
            "customer_profile_id": "mock",
            "header": {
                "customer_name": self._find_word_after("customer"),
                "customer_number": None,
                "customer_po_number": self._find_word_after("po"),
                "order_date": None,
                "currency": None,
                "delivery_address": None,
                "billing_address": None,
                "payment_terms": None,
                "raw_filename": None,
            },
            "lines": lines,
            "totals": None,
            "confidence": 0.0,
        }

    def _find_value(self, token: str) -> float | None:
        for word in self.text.split():
            if token.lower() in word.lower():
                digits = "".join(filter(str.isdigit, word))
                if digits:
                    return float(digits)
        return None

    def _find_word_after(self, token: str) -> str | None:
        words = self.text.split()
        for idx, word in enumerate(words[:-1]):
            if word.lower().startswith(token.lower()):
                return words[idx + 1]
        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Offline order extraction helper")
    parser.add_argument("text_file", type=Path, help="Path to a plain-text order")
    parser.add_argument("--customer-profile", default=None, help="Profile identifier")
    parser.add_argument(
        "--use-mock",
        action="store_true",
        help="Use the offline mock client even if OPENAI_API_KEY is set",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    raw_text = args.text_file.read_text(encoding="utf-8")
    profile = CustomerProfile.load(args.customer_profile)
    use_mock = args.use_mock or not os.getenv("OPENAI_API_KEY")
    client = MockOpenAI(raw_text) if use_mock else None
    extractor = OrderExtractor(client=client)
    result = await extractor.extract_order(
        text=raw_text,
        raw_filename=str(args.text_file.name),
        customer_profile=profile,
    )
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
