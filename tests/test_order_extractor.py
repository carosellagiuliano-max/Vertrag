import json
from dataclasses import dataclass

import pytest
from pydantic import ValidationError

from extract.order_extractor import OrderExtractor, ReasoningRequest
from layout.base import LayoutAnalysisResult
from profiles.customer_profile import CustomerProfile
from reasoning.prompt_builder import PromptBuilder


class _FakeContent:
    def __init__(self, text: str, logprob: float = 0.0):
        self.type = "output_text"
        self.text = text
        self.logprobs = {"content": [{"top_logprobs": [{"logprob": logprob}]}]}


class _FakeOutput:
    def __init__(self, text: str, logprob: float = 0.0):
        self.content = [_FakeContent(text, logprob)]


class _FakeResponse:
    def __init__(self, text: str, logprob: float = 0.0):
        self.output = [_FakeOutput(text, logprob)]

    def model_dump(self):
        return {"output": [
            {"content": [
                {
                    "type": chunk.type,
                    "text": chunk.text,
                    "logprobs": chunk.logprobs,
                }
                for chunk in output.content
            ]}
            for output in self.output
        ]}


@dataclass
class _FakeClient:
    payload: dict

    def __post_init__(self):
        self.responses = self

    def create(self, **kwargs):  # noqa: ANN001
        text = json.dumps(self.payload)
        return _FakeResponse(text, logprob=0.0)


class _StubPrompt(PromptBuilder):
    def build_messages(self, context):  # noqa: D401
        return "system", "user"


def _profile() -> CustomerProfile:
    return CustomerProfile(id="demo", default_currency="USD")


def _request(profile: CustomerProfile) -> ReasoningRequest:
    return ReasoningRequest(
        text="PO 123",
        raw_filename="sample.pdf",
        customer_profile=profile,
        schema_literal="schema",
        json_schema={"type": "object"},
        layout=LayoutAnalysisResult(),
    )


@pytest.mark.asyncio
async def test_order_extractor_injects_defaults():
    payload = {
        "customer_profile_id": "demo",
        "header": {"customer_name": "ACME"},
        "lines": [],
    }
    extractor = OrderExtractor(client=_FakeClient(payload), model_name="test")
    result = await extractor.extract_order_with_prompt(
        request=_request(_profile()),
        prompt_builder=_StubPrompt(),
    )
    assert result.header.raw_filename == "sample.pdf"
    assert result.header.currency == "USD"


def test_parse_response_handles_invalid_json():
    response = _FakeResponse("{""")
    with pytest.raises(json.JSONDecodeError):
        OrderExtractor._parse_response_json(response)


@pytest.mark.asyncio
async def test_order_extractor_raises_on_invalid_payload(monkeypatch):
    extractor = OrderExtractor(client=_FakeClient({}), model_name="test")

    def _fake_call(system_message, user_message, request):  # noqa: ANN001
        return {"customer_profile_id": request.customer_profile.id, "header": "invalid", "lines": []}

    monkeypatch.setattr(extractor, "_call_llm", _fake_call)
    with pytest.raises(ValidationError):
        await extractor.extract_order_with_prompt(
            request=_request(_profile()),
            prompt_builder=_StubPrompt(),
        )


def test_normalize_decimal_fields():
    payload = {
        "totals": {"subtotal": "10.0", "tax_amount": None, "grand_total": 15},
        "lines": [{"unit_price": "12.5", "line_total": 25}],
    }
    OrderExtractor._normalize_decimal_fields(payload)
    assert payload["totals"]["grand_total"] == "15"
    assert payload["lines"][0]["unit_price"] == "12.5"


def test_compute_confidence():
    response = _FakeResponse("{}", logprob=-0.5)
    score = OrderExtractor._compute_confidence(response)
    assert 0 <= score <= 1
