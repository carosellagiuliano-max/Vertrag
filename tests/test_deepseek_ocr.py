from contextlib import asynccontextmanager
from pathlib import Path

import pytest

from extract.base import DocumentExtractionContext
from extract.deepseek_ocr import DeepSeekOcrEngine, _DeepSeekPayload


class _DummyClient:
    def __init__(self):
        self.calls: list[dict] = []

    async def post(self, endpoint: str, *, files, data):  # noqa: ANN001, D401 - signature mirrors httpx
        self.calls.append({"endpoint": endpoint, "data": data})
        return _DummyResponse({"data": {"text": "OCR text", "layout": [{"text": "row"}], "confidence": 0.9}})


class _DummyResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):  # noqa: D401
        return None

    def json(self):  # noqa: D401
        return self._payload


@pytest.mark.asyncio
async def test_deepseek_engine_emits_pages(monkeypatch, tmp_path):
    pdf_path = tmp_path / "fake.pdf"
    pdf_path.write_bytes(b"%PDF")
    engine = DeepSeekOcrEngine(api_key="key", endpoint="https://example.com/ocr")

    def _fake_render(_: Path):
        return [b"image-bytes-1", b"image-bytes-2"]

    async def _fake_call(client, image_bytes, page_number):
        return _DeepSeekPayload(text=f"text-{page_number}", layout=[], confidence=0.99)

    @asynccontextmanager
    async def _fake_client_factory():
        yield _DummyClient()

    monkeypatch.setattr(engine, "_render_pages", _fake_render)
    monkeypatch.setattr(engine, "_call_ocr", _fake_call)
    engine._client_factory = _fake_client_factory

    context = DocumentExtractionContext(raw_filename="fake.pdf", customer_profile_id="demo")
    result = await engine.extract(pdf_path, context)
    assert len(result.pages) == 2
    assert "text-1" in result.combined_text
    assert result.metadata["ocr_provider"] == "deepseek"
