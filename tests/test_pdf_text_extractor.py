import asyncio
from pathlib import Path

import pytest

from extract.base import DocumentExtractionContext
from extract.pdf_text_extractor import (
    PdfTextExtractor,
    _extract_with_pdfplumber,
    _extract_with_pypdf,
    extract_text,
)


class DummyPage:
    def __init__(self, text: str) -> None:
        self._text = text

    def extract_text(self) -> str:
        return self._text


class DummyReader:
    def __init__(self, pages):
        self.pages = pages


@pytest.mark.asyncio
async def test_extract_text_falls_back_to_pypdf(monkeypatch, tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 sample")

    class _FailingPdfPlumber:
        def __enter__(self):
            raise RuntimeError("boom")

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr("extract.pdf_text_extractor.pdfplumber.open", lambda _: _FailingPdfPlumber())
    monkeypatch.setattr(
        "extract.pdf_text_extractor.PdfReader",
        lambda *_, **__: DummyReader([DummyPage("hello"), DummyPage("world")]),
    )

    text = await extract_text(pdf_path)
    assert "hello" in text and "world" in text


@pytest.mark.asyncio
async def test_pdf_text_extractor_returns_metadata(monkeypatch, tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 sample")

    def _fake_pdfplumber(path: Path):
        return ["page one", "page two"]

    monkeypatch.setattr("extract.pdf_text_extractor._extract_with_pdfplumber", _fake_pdfplumber)
    extractor = PdfTextExtractor()
    context = DocumentExtractionContext(raw_filename="sample.pdf", customer_profile_id="demo")
    result = await extractor.extract(pdf_path, context)
    assert result.metadata["engine_name"] == "pdfplumber"
    assert result.metadata["page_count"] == 2
    assert len(result.pages) == 2


@pytest.mark.asyncio
async def test_pdf_engines_helpers_extract(monkeypatch, tmp_path):
    pdf_path = tmp_path / "sample.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 sample")

    class _FakePdf:
        def __init__(self):
            self.pages = [DummyPage("one"), DummyPage("two")]

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    monkeypatch.setattr("extract.pdf_text_extractor.pdfplumber.open", lambda _: _FakePdf())
    assert _extract_with_pdfplumber(pdf_path) == ["one", "two"]

    class _FakeReader:
        def __init__(self, *_):
            self.pages = [DummyPage("three"), DummyPage("four")]

    monkeypatch.setattr("extract.pdf_text_extractor.PdfReader", _FakeReader)
    assert _extract_with_pypdf(pdf_path) == ["three", "four"]
