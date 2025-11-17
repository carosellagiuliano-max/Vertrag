import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import main
from main import app, get_pipeline
from models.order import OrderExtractionResult, OrderHeader


class _StubPipeline:
    def __init__(self, result: OrderExtractionResult, *, error: Exception | None = None):
        self.result = result
        self.error = error
        self.called_with = None

    async def run(self, **kwargs):
        self.called_with = kwargs
        if self.error:
            raise self.error
        return self.result


@pytest.fixture
def client():
    client = TestClient(app)
    default_result = OrderExtractionResult(customer_profile_id="default", header=OrderHeader(), lines=[])
    app.dependency_overrides[get_pipeline] = lambda: _StubPipeline(default_result)
    yield client
    app.dependency_overrides.clear()


def _override_pipeline(pipeline):
    app.dependency_overrides[get_pipeline] = lambda: pipeline


def test_extract_order_success(client, tmp_path, monkeypatch):
    result = OrderExtractionResult(
        customer_profile_id="default",
        header=OrderHeader(raw_filename="file.pdf"),
        lines=[],
    )
    pipeline = _StubPipeline(result)
    _override_pipeline(pipeline)
    pdf_bytes = b"%PDF-1.4 sample"

    temp_dir = tmp_path / "uploads"
    temp_dir.mkdir()

    def _fake_mkdtemp(prefix):  # noqa: D401
        path = temp_dir / "session"
        path.mkdir(exist_ok=True)
        return str(path)

    monkeypatch.setattr(main.tempfile, "mkdtemp", _fake_mkdtemp)

    response = client.post(
        "/extract-order",
        files={"file": ("file.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"customer_profile_id": "default"},
    )
    assert response.status_code == 200
    assert response.json()["customer_profile_id"] == "default"
    assert not (temp_dir / "session").exists()


def test_extract_order_missing_file(client):
    response = client.post("/extract-order", files={})
    assert response.status_code == 422


def test_extract_order_timeout(client):
    pipeline = _StubPipeline(
        OrderExtractionResult(customer_profile_id="default", header=OrderHeader(), lines=[]),
        error=TimeoutError("slow"),
    )
    _override_pipeline(pipeline)
    response = client.post(
        "/extract-order",
        files={"file": ("file.pdf", io.BytesIO(b"%PDF"), "application/pdf")},
    )
    assert response.status_code == 502


def test_extract_order_pipeline_failure(client):
    pipeline = _StubPipeline(
        OrderExtractionResult(customer_profile_id="default", header=OrderHeader(), lines=[]),
        error=RuntimeError("boom"),
    )
    _override_pipeline(pipeline)
    response = client.post(
        "/extract-order",
        files={"file": ("file.pdf", io.BytesIO(b"%PDF"), "application/pdf")},
    )
    assert response.status_code == 500
