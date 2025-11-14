import pytest

import pytest

from extract.pdf_text_extractor import extract_text


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
