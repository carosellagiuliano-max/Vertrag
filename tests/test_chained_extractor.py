import asyncio
from pathlib import Path

import pytest

from extract.base import (
    ChainedTextExtractor,
    DocumentExtractionContext,
    TextExtractionEngine,
    TextExtractionResult,
)


class _StubEngine(TextExtractionEngine):
    def __init__(self, name: str, text: str, priority: int, capabilities: tuple[str, ...] = ("text",)) -> None:
        self.name = name
        self._text = text
        self.priority = priority
        self.capabilities = capabilities

    async def extract(self, source: Path, context: DocumentExtractionContext) -> TextExtractionResult:
        await asyncio.sleep(0)
        return TextExtractionResult(combined_text=self._text, metadata={"engine_name": self.name})


@pytest.mark.asyncio
async def test_chained_extractor_falls_back_to_ocr(tmp_path):
    primary = _StubEngine(name="text", text="short", priority=1)
    ocr = _StubEngine(name="ocr", text="this is a much longer body", priority=2, capabilities=("ocr",))
    chain = ChainedTextExtractor([primary, ocr], min_characters=10)
    context = DocumentExtractionContext(raw_filename="file.pdf", customer_profile_id="demo")
    result = await chain.extract(tmp_path / "fake.pdf", context)
    assert result.metadata["engine_name"] == "ocr"
    assert "longer body" in result.text


@pytest.mark.asyncio
async def test_chained_extractor_honors_force_ocr(tmp_path):
    primary = _StubEngine(name="text", text="this has enough characters", priority=1)
    ocr_text = "ocr output " * 30
    ocr = _StubEngine(name="ocr", text=ocr_text, priority=2, capabilities=("ocr",))
    chain = ChainedTextExtractor([primary, ocr])
    context = DocumentExtractionContext(
        raw_filename="file.pdf",
        customer_profile_id="demo",
        hints={"force_ocr": "true"},
    )
    result = await chain.extract(tmp_path / "fake.pdf", context)
    assert result.metadata["engine_name"] == "ocr"
