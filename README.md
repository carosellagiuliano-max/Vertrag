# Order Extraction Service

A lean FastAPI microservice that converts incoming customer order PDFs into a single JSON object that maps directly to Microsoft Dynamics NAV Sales Headers and Sales Lines.

## Features

- **Pipeline-driven ingestion** – `/extract-order` streams every document through a configurable pipeline with swappable text extraction, layout analysis, reasoning, and schema-validation stages.
- **Extensible extraction layer** – `extract/base.py` exposes a `TextExtractionEngine` interface. The default chain runs `pdfplumber`, `pypdf`, and the new DeepSeek-OCR backend so digitally born PDFs, scans, and photos all share the same API contract.
- **Advanced customer profiles** – YAML-backed metadata now supports hundreds of customers, form-level overrides, label aliases, reasoning notes, and few-shot exemplars per template.
- **Reasoning layer primitives** – the `PromptBuilder`, schema registry, and `OrderExtractor` accept alternate schemas, LLM backends, and layout hints, paving the way for hybrid/step-by-step chains.
- **Reliability hooks** – deterministic JSON schema validation, logprob-based confidence, middleware placeholders, and a pipeline abstraction designed for retries, monitoring, and human-in-the-loop augmentation.
- Offline CLI with mock LLM client plus pytest fixtures for local testing.

## High-Level Architecture

```
┌────────────┐   ┌────────────────┐   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────────┐
│ FastAPI    │ → │ Ingestion       │ → │ Layout Analyzer     │ → │ Reasoning Engine     │ → │ NAV-compatible payload │
│ /extract…  │   │ Pipeline        │   │ (Null by default)   │   │ (OpenAI GPT-4o)      │   │ OrderExtractionResult  │
└────────────┘   └────────────────┘   └────────────────────┘   └────────────────────┘   └────────────────────────┘
                       ↑                         ↑                        ↑
             Customer profiles ↔ schema registry ↔ prompt builder ↔ monitoring hooks
```

Every block is replaceable: drop in a future OCR engine, connect a structured table extractor, use a different prompt builder, or point to another LLM backend with a different schema.

## Installation

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...
# optional but recommended for OCR fallback
export DEEPSEEK_OCR_API_KEY=sk-...
export DEEPSEEK_OCR_ENDPOINT=https://api.deepseek.com/ocr
uvicorn main:app --reload
```

### Configuration

| Env Var | Purpose |
|---------|---------|
| `OPENAI_API_KEY` | Required for the GPT-4o reasoning layer. |
| `MODEL_NAME` | Override the default `gpt-4o-2025-09-01`. |
| `DEEPSEEK_OCR_API_KEY` / `DEEPSEEK_API_KEY` | Credentials for the DeepSeek OCR service. |
| `DEEPSEEK_OCR_ENDPOINT` | HTTPS endpoint for the OCR API. |
| `DEEPSEEK_OCR_TIMEOUT` | Optional request timeout (seconds). |
| `OCR_RENDER_DPI` | Rasterization DPI for PyMuPDF (defaults to 220). |
| `EXTRACTOR_MIN_CHARACTERS` | Chain-level heuristic before falling back to OCR (default 200). |
| `EXTRACTOR_MIN_ALPHA_RATIO` | Reject extremely noisy outputs (< 5% signal by default). |

## API Usage

```bash
curl -F "file=@example.pdf" -F "customer_profile_id=acme" http://localhost:8000/extract-order
```

### Response Schema

`OrderExtractionResult` contains header, lines, totals, and confidence fields. Monetary values are returned as strings to preserve precision.

### Sample Response

```json
{
  "customer_profile_id": "acme",
  "header": {
    "customer_name": "Example Machines Ltd.",
    "customer_number": null,
    "customer_po_number": "PO-98765",
    "order_date": "2025-01-05",
    "currency": "EUR",
    "delivery_address": "42 Galaxy Way",
    "billing_address": null,
    "payment_terms": "Net 30",
    "raw_filename": "example.pdf"
  },
  "lines": [
    {
      "line_no": 10000,
      "customer_item_no": "X-123",
      "internal_item_no": null,
      "description": "Widget",
      "quantity": 15,
      "unit": "EA",
      "unit_price": "12.00",
      "discount_percent": 0,
      "line_total": "180.00"
    }
  ],
  "totals": {
    "subtotal": "180.00",
    "tax_amount": "36.00",
    "grand_total": "216.00"
  },
  "confidence": 0.87
}
```

## Customer Profiles

Profiles live in `data/customer_profiles.yaml` and now contain:

- Global defaults: currency, metadata tags, and baseline aliases.
- `forms`: each customer can register multiple form templates with their own aliases, reasoning hints, schema overrides, and few-shot exemplars.

`CustomerProfileRepository` handles loading, caching, and form resolution, while `PromptBuilder` automatically merges base + form-specific instructions. Extraction hints (e.g., `force_ocr`) can be stored inside `metadata.extraction_hints` so specific customers/templates force OCR or other behaviors.

## Extraction + OCR Pipeline

The ingestion pipeline wires a `ChainedTextExtractor` that evaluates each engine's output against configurable heuristics:

1. **pdfplumber** – fast text extraction for digitally born PDFs.
2. **pypdf** – structural fallback when pdfplumber fails.
3. **DeepSeek-OCR** – renders every page with PyMuPDF, uploads PNGs to DeepSeek, captures layout metadata, and feeds that signal to the reasoning layer.

If an engine returns too little text, fails, or the active profile requests `force_ocr`, the chain automatically proceeds to the next engine. Every result includes provenance (`engine_name`, `page_count`, OCR provider) so prompts and downstream monitoring can reason about quality.

## Offline CLI

Run the mock extractor against a text file (still bypasses the PDF extractor but exercises the reasoning stack):

```bash
python -m scripts.offline_extract tests/fixtures/sample_order.txt --use-mock
```

## Testing

```bash
pytest
```

## Docker

Build and run:

```bash
docker build -t order-extraction .
docker run -p 8000:8000 -e OPENAI_API_KEY=sk-... order-extraction
```
