"""Utilities for extracting text from PDF order forms."""
from __future__ import annotations

import asyncio
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

from extract.base import ChainedTextExtractor, DocumentExtractionContext, ExtractionArtifacts, TextExtractionEngine


class _PdfplumberEngine(TextExtractionEngine):
    name = "pdfplumber"
    priority = 1

    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> ExtractionArtifacts:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, _extract_with_pdfplumber, source)
        return ExtractionArtifacts(text=text, metadata={"engine_name": self.name})


class _PyPdfEngine(TextExtractionEngine):
    name = "pypdf"
    priority = 2

    async def extract(self, source: Path, context: DocumentExtractionContext) -> ExtractionArtifacts:
        loop = asyncio.get_running_loop()
        text = await loop.run_in_executor(None, _extract_with_pypdf, source)
        return ExtractionArtifacts(text=text, metadata={"engine_name": self.name})


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


def _extract_with_pdfplumber(path: Path) -> str:
    with pdfplumber.open(path) as pdf:
        text_chunks = [page.extract_text() or "" for page in pdf.pages]
    return "\n".join(text_chunks)


def _extract_with_pypdf(path: Path) -> str:
    reader = PdfReader(str(path))
    text_chunks = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(text_chunks)
