"""Utilities for extracting text from PDF order forms."""
from __future__ import annotations

import asyncio
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

from extract.base import (
    ChainedTextExtractor,
    DocumentExtractionContext,
    PageExtraction,
    TextExtractionResult,
    TextExtractionEngine,
)


class _PdfplumberEngine(TextExtractionEngine):
    name = "pdfplumber"
    priority = 1

    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> TextExtractionResult:
        loop = asyncio.get_running_loop()
        pages = await loop.run_in_executor(None, _extract_with_pdfplumber, source)
        page_models = [
            PageExtraction(page_number=idx + 1, text=page_text or "")
            for idx, page_text in enumerate(pages)
        ]
        combined = "\n".join(page.text for page in page_models)
        metadata = {"engine_name": self.name, "page_count": len(page_models)}
        return TextExtractionResult(combined_text=combined, pages=page_models, metadata=metadata)


class _PyPdfEngine(TextExtractionEngine):
    name = "pypdf"
    priority = 2

    async def extract(self, source: Path, context: DocumentExtractionContext) -> TextExtractionResult:
        loop = asyncio.get_running_loop()
        pages = await loop.run_in_executor(None, _extract_with_pypdf, source)
        page_models = [
            PageExtraction(page_number=idx + 1, text=page_text or "")
            for idx, page_text in enumerate(pages)
        ]
        combined = "\n".join(page.text for page in page_models)
        metadata = {"engine_name": self.name, "page_count": len(page_models)}
        return TextExtractionResult(combined_text=combined, pages=page_models, metadata=metadata)


class PdfTextExtractor(ChainedTextExtractor):
    """Default extractor that tries multiple backends and keeps metadata."""

    def __init__(self) -> None:
        super().__init__([_PdfplumberEngine(), _PyPdfEngine()])


async def extract_text(path: Path, context: DocumentExtractionContext | None = None) -> str:
    """Backwards compatible helper for ad-hoc usage."""

    extractor = PdfTextExtractor()
    context = context or DocumentExtractionContext(raw_filename=path.name, customer_profile_id="unknown")
    artifacts = await extractor.extract(path, context)
    return artifacts.text


def _extract_with_pdfplumber(path: Path) -> list[str]:
    with pdfplumber.open(path) as pdf:
        text_chunks = [page.extract_text() or "" for page in pdf.pages]
    return text_chunks


def _extract_with_pypdf(path: Path) -> list[str]:
    reader = PdfReader(str(path))
    text_chunks = [page.extract_text() or "" for page in reader.pages]
    return text_chunks
