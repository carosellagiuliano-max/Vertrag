import pytest

from extract.base import ChainedTextExtractor, TextExtractionEngine, TextExtractionResult
from extract.pdf_text_extractor import PdfTextExtractor
from models.order import OrderExtractionResult, OrderHeader
from pipeline.order_ingestion import OrderIngestionPipeline, PipelineConfig
from profiles.customer_profile import CustomerProfileRepository


class _StubReasoning:
    def __init__(self, expected_text: str):
        self.expected_text = expected_text

    async def extract_order_with_prompt(self, request, prompt_builder):  # noqa: D401
        assert self.expected_text in request.text
        return OrderExtractionResult(
            customer_profile_id=request.customer_profile.id,
            header=OrderHeader(raw_filename=request.raw_filename, currency="USD"),
            lines=[],
        )


class _StubOcrEngine(TextExtractionEngine):
    name = "stub_ocr"
    priority = 50
    capabilities = ("ocr",)

    def __init__(self, text: str):
        self._text = text

    async def extract(self, source, context):  # noqa: D401
        return TextExtractionResult(combined_text=self._text, metadata={"engine_name": self.name})


class _EmptyEngine(TextExtractionEngine):
    name = "empty"
    priority = 1

    async def extract(self, source, context):  # noqa: D401
        return TextExtractionResult(combined_text="", metadata={"engine_name": self.name})


@pytest.fixture
def profile_repo(tmp_path):
    data = tmp_path / "profiles.yaml"
    data.write_text(
        """
        default:
          default_currency: USD
        """,
        encoding="utf-8",
    )
    return CustomerProfileRepository(data)


@pytest.mark.asyncio
async def test_end_to_end_text_pdf(sample_text_pdf, profile_repo):
    extractor = PdfTextExtractor()
    reasoning = _StubReasoning("ACME")
    pipeline = OrderIngestionPipeline(
        PipelineConfig(
            text_extractor=extractor,
            reasoning_engine=reasoning,
            profile_repository=profile_repo,
        )
    )
    result = await pipeline.run(
        source_path=sample_text_pdf,
        raw_filename="text.pdf",
        customer_profile_id="default",
    )
    assert result.header.currency == "USD"


@pytest.mark.asyncio
async def test_end_to_end_ocr_fallback(blank_pdf, profile_repo):
    chain = ChainedTextExtractor([_EmptyEngine(), _StubOcrEngine("OCR output for table")], min_characters=5)
    reasoning = _StubReasoning("OCR output")
    pipeline = OrderIngestionPipeline(
        PipelineConfig(
            text_extractor=chain,
            reasoning_engine=reasoning,
            profile_repository=profile_repo,
        )
    )
    result = await pipeline.run(
        source_path=blank_pdf,
        raw_filename="scan.pdf",
        customer_profile_id="default",
    )
    assert result.header.raw_filename == "scan.pdf"
