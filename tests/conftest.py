from pathlib import Path

import fitz
import pytest


@pytest.fixture
def sample_text_pdf(tmp_path: Path) -> Path:
    """Create a simple text-based PDF via PyMuPDF."""

    pdf_path = tmp_path / "text.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Order 123 for ACME Corp")
    doc.save(pdf_path)
    doc.close()
    return pdf_path


@pytest.fixture
def blank_pdf(tmp_path: Path) -> Path:
    pdf_path = tmp_path / "blank.pdf"
    doc = fitz.open()
    doc.new_page()
    doc.save(pdf_path)
    doc.close()
    return pdf_path
