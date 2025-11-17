import pytest

from extract.base import DocumentExtractionContext, TextExtractionEngine, TextExtractionResult
from layout.base import LayoutAnalysisResult, LayoutAnalyzer
from models.order import OrderExtractionResult, OrderHeader
from pipeline.order_ingestion import OrderIngestionPipeline, PipelineConfig
from profiles.customer_profile import CustomerProfileRepository
from reasoning.prompt_builder import PromptBuilder


class _StubExtractor(TextExtractionEngine):
    name = "stub-text"

    def __init__(self, text: str):
        self._text = text
        self.called_with: DocumentExtractionContext | None = None

    async def extract(self, source, context):  # noqa: D401
        self.called_with = context
        return TextExtractionResult(combined_text=self._text, metadata={"engine_name": self.name})


class _StubLayout(LayoutAnalyzer):
    name = "stub-layout"

    async def analyze(self, source, artifacts, context):  # noqa: D401
        return LayoutAnalysisResult(blocks=[{"type": "table", "text": "line"}], engine_name=self.name)


class _StubPromptBuilder(PromptBuilder):
    def __init__(self):
        self.last_context = None

    def build_messages(self, context):  # noqa: D401
        self.last_context = context
        return "system", "user"


class _StubReasoningEngine:
    def __init__(self):
        self.last_request = None
        self.last_builder = None

    async def extract_order_with_prompt(self, request, prompt_builder):  # noqa: D401
        self.last_request = request
        self.last_builder = prompt_builder
        return OrderExtractionResult(
            customer_profile_id=request.customer_profile.id,
            header=OrderHeader(raw_filename=request.raw_filename, currency="EUR"),
            lines=[],
            totals=None,
        )


@pytest.fixture
def profile_repo(tmp_path):
    data = tmp_path / "profiles.yaml"
    data.write_text(
        """
        default:
          default_currency: EUR
          example_orders: []
        """,
        encoding="utf-8",
    )
    return CustomerProfileRepository(data)


@pytest.mark.asyncio
async def test_pipeline_wires_components(sample_text_pdf, profile_repo):
    extractor = _StubExtractor("Customer: ACME")
    layout = _StubLayout()
    reasoning = _StubReasoningEngine()
    prompt_builder = _StubPromptBuilder()
    pipeline = OrderIngestionPipeline(
        PipelineConfig(
            text_extractor=extractor,
            reasoning_engine=reasoning,
            layout_analyzer=layout,
            profile_repository=profile_repo,
            prompt_builder=prompt_builder,
        )
    )
    result = await pipeline.run(
        source_path=sample_text_pdf,
        raw_filename="sample.pdf",
        customer_profile_id="default",
    )
    assert result.header.raw_filename == "sample.pdf"
    assert reasoning.last_request.text == "Customer: ACME"
    assert reasoning.last_request.layout.engine_name == "stub-layout"
    assert "OrderLine" in reasoning.last_request.schema_literal


class _StaticProfileRepo(CustomerProfileRepository):
    def __init__(self, profile):
        self._profile = profile

    def load(self, profile_id):  # noqa: D401
        return self._profile


@pytest.mark.asyncio
async def test_pipeline_passes_hints_to_extractor(blank_pdf, profile_repo):
    extractor = _StubExtractor("text")
    profile = profile_repo.load("default")
    profile.metadata["extraction_hints"] = {"force_ocr": True}
    repo = _StaticProfileRepo(profile)
    reasoning = _StubReasoningEngine()
    pipeline = OrderIngestionPipeline(
        PipelineConfig(
            text_extractor=extractor,
            reasoning_engine=reasoning,
            profile_repository=repo,
        )
    )
    await pipeline.run(
        source_path=blank_pdf,
        raw_filename="blank.pdf",
        customer_profile_id="default",
    )
    assert extractor.called_with.force_ocr is True
