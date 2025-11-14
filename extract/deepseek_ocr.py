"""DeepSeek OCR engine that renders PDFs into images and extracts text."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any, AsyncIterator, Callable, Dict, List, Optional

import fitz  # type: ignore[import-untyped]
import httpx

from config import get_settings
from extract.base import (
    DocumentExtractionContext,
    PageExtraction,
    TextExtractionEngine,
    TextExtractionResult,
)

LOGGER = logging.getLogger(__name__)


@dataclass
class _DeepSeekPayload:
    text: str
    layout: List[Dict[str, Any]]
    confidence: float | None


class DeepSeekOcrEngine(TextExtractionEngine):
    """High-quality OCR stage powered by the DeepSeek OCR API."""

    name = "deepseek_ocr"
    priority = 50
    capabilities = ("ocr", "vision", "text")

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        timeout: float | None = None,
        render_dpi: int | None = None,
        client_factory: Callable[[], AsyncIterator[httpx.AsyncClient]] | None = None,
    ) -> None:
        settings = get_settings()
        self.api_key = api_key or settings.deepseek_ocr_api_key or settings.deepseek_api_key
        self.endpoint = endpoint or settings.deepseek_ocr_endpoint
        self.timeout = timeout or settings.deepseek_ocr_timeout
        self.render_dpi = render_dpi or settings.ocr_render_dpi
        self._client_factory = client_factory or self._default_client_factory

    async def extract(
        self, source: Path, context: DocumentExtractionContext
    ) -> TextExtractionResult:
        if not self.endpoint or not self.api_key:
            raise RuntimeError("DeepSeek OCR is not configured")
        loop = asyncio.get_running_loop()
        try:
            pages = await loop.run_in_executor(None, self._render_pages, source)
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Failed to render PDF for OCR: {exc}") from exc
        page_results: List[PageExtraction] = []
        ocr_errors: List[str] = []
        if not pages:
            return TextExtractionResult(
                combined_text="",
                pages=[],
                metadata={"engine_name": self.name, "page_count": 0},
                errors=["deepseek_ocr: no pages rendered"],
            )
        async with self._client_factory() as client:
            for idx, page_bytes in enumerate(pages, start=1):
                try:
                    payload = await self._call_ocr(client, page_bytes, idx)
                except Exception as exc:  # noqa: BLE001
                    LOGGER.warning("DeepSeek OCR failed for page %s: %s", idx, exc)
                    ocr_errors.append(f"page {idx}: {exc}")
                    continue
                page_results.append(
                    PageExtraction(
                        page_number=idx,
                        text=payload.text,
                        layout=payload.layout,
                        metadata={"confidence": payload.confidence},
                    )
                )
        combined_text = "\n\n".join(page.text for page in page_results)
        metadata = {
            "engine_name": self.name,
            "page_count": len(pages),
            "ocr_provider": "deepseek",
        }
        return TextExtractionResult(
            combined_text=combined_text,
            pages=page_results,
            metadata=metadata,
            errors=ocr_errors,
        )

    # ------------------------------------------------------------------
    def _render_pages(self, source: Path) -> List[bytes]:
        """Render each PDF page to PNG bytes using PyMuPDF."""

        doc = fitz.open(str(source))  # type: ignore[arg-type]
        try:
            zoom = self.render_dpi / 72
            matrix = fitz.Matrix(zoom, zoom)
            images: List[bytes] = []
            for page in doc:
                pixmap = page.get_pixmap(matrix=matrix)
                images.append(pixmap.tobytes("png"))
            return images
        finally:
            doc.close()

    # ------------------------------------------------------------------
    async def _call_ocr(
        self,
        client: httpx.AsyncClient,
        image_bytes: bytes,
        page_number: int,
    ) -> _DeepSeekPayload:
        files = {"file": (f"page-{page_number}.png", image_bytes, "image/png")}
        data = {"page": str(page_number), "engine": "deepseek-ocr"}
        response = await client.post(self.endpoint, files=files, data=data)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise RuntimeError("Unexpected DeepSeek OCR payload")
        body = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        text = body.get("text", "")
        layout = body.get("layout", []) or []
        confidence = body.get("confidence")
        return _DeepSeekPayload(text=text or "", layout=layout, confidence=confidence)

    # ------------------------------------------------------------------
    def _default_client_factory(self) -> AsyncIterator[httpx.AsyncClient]:
        headers = {"Authorization": f"Bearer {self.api_key}"}

        @asynccontextmanager
        async def _factory() -> AsyncIterator[httpx.AsyncClient]:
            async with httpx.AsyncClient(headers=headers, timeout=self.timeout) as client:
                yield client

        return _factory()
