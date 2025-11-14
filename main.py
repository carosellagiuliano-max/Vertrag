"""FastAPI entrypoint exposing the order extraction endpoint."""
from __future__ import annotations

import logging
import tempfile
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request

from config import get_settings
from extract.base import ChainedTextExtractor
from extract.deepseek_ocr import DeepSeekOcrEngine
from extract.order_extractor import OrderExtractor
from extract.pdf_text_extractor import PdfTextExtractor
from models.order import OrderExtractionResult
from pipeline.order_ingestion import OrderIngestionPipeline, PipelineConfig

LOGGER = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class APIError(Exception):
    """Custom error for consistent JSON responses."""

    def __init__(self, status_code: int, detail: str, code: str) -> None:
        self.status_code = status_code
        self.detail = detail
        self.code = code


app = FastAPI(title="Order Extraction Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.exception_handler(APIError)
async def handle_api_error(_: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Placeholder middleware for future rate limiting logic."""

    response = await call_next(request)
    return response


@lru_cache(maxsize=1)
def _build_pipeline() -> OrderIngestionPipeline:
    settings = get_settings()
    if not settings.openai_api_key:
        LOGGER.warning("OPENAI_API_KEY is not set. Order extraction will fail without a key.")
    pdf_text_engine = PdfTextExtractor()
    engines = [pdf_text_engine]
    if settings.deepseek_ocr_endpoint and (settings.deepseek_ocr_api_key or settings.deepseek_api_key):
        engines.append(DeepSeekOcrEngine())
    else:
        LOGGER.info("DeepSeek OCR disabled – missing endpoint or API key")
    text_extractor = ChainedTextExtractor(
        engines,
        min_characters=settings.extractor_min_characters,
        min_alpha_ratio=settings.extractor_min_alpha_ratio,
    )
    reasoning_engine = OrderExtractor()
    config = PipelineConfig(text_extractor=text_extractor, reasoning_engine=reasoning_engine)
    return OrderIngestionPipeline(config)


def get_pipeline() -> OrderIngestionPipeline:
    return _build_pipeline()


@app.post("/extract-order", response_model=OrderExtractionResult)
async def extract_order_endpoint(
    file: UploadFile = File(...),
    customer_profile_id: Annotated[str | None, Form()] = None,
    pipeline: OrderIngestionPipeline = Depends(get_pipeline),
) -> OrderExtractionResult:
    if not file.filename:
        raise APIError(422, "Filename missing", "ERR_INPUT")

    tmp_dir = Path(tempfile.mkdtemp(prefix="order_extract_"))
    tmp_path = tmp_dir / file.filename
    try:
        contents = await file.read()
        tmp_path.write_bytes(contents)
        result = await pipeline.run(
            source_path=tmp_path,
            raw_filename=file.filename,
            customer_profile_id=customer_profile_id,
        )
        return result
    except TimeoutError as exc:
        LOGGER.error("LLM timeout: %s", exc)
        raise APIError(502, "Upstream timeout", "ERR_UPSTREAM") from exc
    except HTTPException as exc:
        raise APIError(exc.status_code, str(exc.detail), "ERR_INPUT") from exc
    except Exception as exc:  # noqa: BLE001
        LOGGER.exception("Unexpected error while extracting order")
        raise APIError(500, "Unexpected server error", "ERR_UNEXPECTED") from exc
    finally:
        try:
            if tmp_path.exists():
                tmp_path.unlink()
            tmp_dir.rmdir()
        except OSError:
            LOGGER.debug("Could not clean up temporary directory %s", tmp_dir)
