import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import pytest

from extract.base import DocumentExtractionContext
from extract.deepseek_ocr import DeepSeekOcrEngine, _DeepSeekPayload


class _DummyClient:
    def __init__(self, response_payload=None, error: Exception | None = None):
        self.calls: list[dict] = []
        self._payload = response_payload
        self._error = error

    async def post(self, endpoint: str, files, data):  # noqa: ANN001 - mirror httpx
        self.calls.append({"endpoint": endpoint, "data": data})
        if self._error:
            raise self._error
        return _DummyResponse(self._payload or {"data": {"text": "OCR text", "layout": [], "confidence": 0.9}})


class _DummyResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
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


@pytest.mark.asyncio
async def test_deepseek_engine_handles_http_errors(monkeypatch, tmp_path):
    pdf_path = tmp_path / "fake.pdf"
    pdf_path.write_bytes(b"%PDF")
    engine = DeepSeekOcrEngine(api_key="key", endpoint="https://example.com/ocr")

    def _fake_render(_: Path):
        return [b"image-bytes-1"]

    async def _failing_call(client, image_bytes, page_number):  # noqa: ARG001
        raise httpx.HTTPStatusError("boom", request=None, response=None)

    @asynccontextmanager
    async def _fake_client_factory():
        yield _DummyClient()

    monkeypatch.setattr(engine, "_render_pages", _fake_render)
    monkeypatch.setattr(engine, "_call_ocr", _failing_call)
    engine._client_factory = _fake_client_factory

    context = DocumentExtractionContext(raw_filename="fake.pdf", customer_profile_id="demo")
    result = await engine.extract(pdf_path, context)
    assert result.combined_text == ""
    assert result.errors and "page" in result.errors[0]


@pytest.mark.asyncio
async def test_deepseek_render_pages_uses_pymupdf(monkeypatch, tmp_path):
    pdf_path = tmp_path / "fake.pdf"
    pdf_path.write_bytes(b"%PDF")
    engine = DeepSeekOcrEngine(api_key="key", endpoint="https://example.com/ocr")

    class _FakeDoc:
        def __init__(self):
            self._pages = [self._FakePage(), self._FakePage()]

        class _FakePage:
            def get_pixmap(self, matrix=None):  # noqa: ARG002
                class _Pixmap:
                    def tobytes(self, fmt):  # noqa: ARG002
                        return b"image-bytes"

                return _Pixmap()

        def __iter__(self):
            return iter(self._pages)

        def close(self):
            return None

    monkeypatch.setattr("extract.deepseek_ocr.fitz.open", lambda *_, **__: _FakeDoc())
    pages = engine._render_pages(pdf_path)
    assert len(pages) == 2


@pytest.mark.asyncio
async def test_call_ocr_rejects_invalid_payload():
    engine = DeepSeekOcrEngine(api_key="key", endpoint="https://example.com/ocr")
    client = _DummyClient(response_payload=["invalid"])
    with pytest.raises(RuntimeError):
        await engine._call_ocr(client, b"bytes", 1)


@pytest.mark.asyncio
async def test_deepseek_requires_configuration(tmp_path):
    engine = DeepSeekOcrEngine(api_key=None, endpoint=None)
    context = DocumentExtractionContext(raw_filename="fake.pdf", customer_profile_id="demo")
    with pytest.raises(RuntimeError):
        await engine.extract(tmp_path / "missing.pdf", context)
