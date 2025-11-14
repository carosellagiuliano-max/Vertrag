from layout.base import LayoutAnalysisResult
from profiles.customer_profile import CustomerProfile
from reasoning.prompt_builder import PromptBuilder, PromptContext


def _profile() -> CustomerProfile:
    return CustomerProfile(
        id="acme",
        default_currency="EUR",
        label_aliases={"PO": ["Purchase order", "Order No"]},
        example_orders=[{"header": {"customer_po_number": "123"}}],
        forms={
            "default_form": {
                "id": "default_form",
                "label_aliases": {"Ship": ["Lieferadresse"]},
                "example_orders": [{"header": {"customer_name": "ACME"}}],
            }
        },
    )


def test_prompt_builder_includes_schema_and_examples():
    builder = PromptBuilder()
    context = PromptContext(
        profile=_profile(),
        form_id="default_form",
        raw_text="Line 1",
        raw_filename="order.pdf",
        layout=LayoutAnalysisResult(blocks=[{"type": "table", "text": "row"}]),
        schema_literal="class OrderLine(BaseModel): ...",
        extraction_metadata={"engine_name": "pdfplumber", "page_count": 2},
    )
    system, user = builder.build_messages(context)
    assert "order-extraction engine" in system
    assert "class OrderLine" in user
    assert "Few-shot examples" in user
    assert "Layout summary" in user
    assert "engine_name" in user


def test_prompt_builder_handles_missing_examples():
    builder = PromptBuilder()
    profile = CustomerProfile(id="default")
    context = PromptContext(
        profile=profile,
        form_id=None,
        raw_text="text",
        raw_filename="file.pdf",
        layout=None,
        schema_literal="schema",
        extraction_metadata=None,
    )
    _, user = builder.build_messages(context)
    assert "Few-shot" not in user
