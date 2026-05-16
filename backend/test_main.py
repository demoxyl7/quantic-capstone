"""
Offline Test Suite — Quantic AI Career Assistant
==================================================
These tests run WITHOUT an API key or database. They validate:
- Health endpoint behaviour
- Request validation (Pydantic model enforcement)
- Error handling for missing AI client
- Fixture file integrity

These tests run on every CI push — no secrets required.

Usage:
    cd backend && pytest test_main.py -v
"""

import os
import sys
import pytest

# ---------------------------------------------------------------------------
# Resolve imports: main.py lives at the project root, one level above backend/
# ---------------------------------------------------------------------------
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from fastapi.testclient import TestClient
from main import app

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


@pytest.fixture(scope="module")
def client():
    """Create a FastAPI test client (no real HTTP server needed)."""
    return TestClient(app)


# ---------------------------------------------------------------------------
# Health Check Tests
# ---------------------------------------------------------------------------
class TestHealthCheck:
    """Tests for the root / health endpoint."""

    def test_health_endpoint_returns_200(self, client):
        """GET / should always return 200 OK."""
        response = client.get("/")
        assert response.status_code == 200

    def test_health_endpoint_has_status(self, client):
        """Response must include a 'status' field."""
        response = client.get("/")
        data = response.json()
        assert "status" in data
        assert data["status"] == "online"

    def test_health_endpoint_reports_db_status(self, client):
        """Response must include a 'db' boolean field."""
        response = client.get("/")
        data = response.json()
        assert "db" in data
        assert isinstance(data["db"], bool)


# ---------------------------------------------------------------------------
# Request Validation Tests
# ---------------------------------------------------------------------------
class TestRequestValidation:
    """Tests for Pydantic request model enforcement."""

    def test_analyze_rejects_empty_body(self, client):
        """POST /analyze with no body should return 422 (validation error)."""
        response = client.post("/analyze")
        assert response.status_code == 422

    def test_analyze_rejects_missing_cv(self, client):
        """POST /analyze without cv_text should return 422."""
        response = client.post("/analyze", json={
            "job_description": "Some JD text"
        })
        assert response.status_code == 422

    def test_analyze_rejects_missing_jd(self, client):
        """POST /analyze without job_description should return 422."""
        response = client.post("/analyze", json={
            "cv_text": "Some CV text"
        })
        assert response.status_code == 422

    def test_cover_letter_rejects_empty_body(self, client):
        """POST /generate-cover-letter with no body should return 422."""
        response = client.post("/generate-cover-letter")
        assert response.status_code == 422

    def test_convert_pdf_rejects_no_file(self, client):
        """POST /convert-pdf-to-docx with no file should return 422."""
        response = client.post("/convert-pdf-to-docx")
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# Error Handling Tests
# ---------------------------------------------------------------------------
class TestErrorHandling:
    """Tests for graceful error handling when the AI client is unavailable."""

    def test_analyze_returns_500_without_ai_key(self, client):
        """
        If GROQ_API_KEY is not set, the AI client is None.
        /analyze should return 500 with a descriptive error, not crash.
        """
        # This test is only meaningful when running without a key
        import main
        if main.client is not None:
            pytest.skip("GROQ_API_KEY is set — skipping missing-client test")

        response = client.post("/analyze", json={
            "cv_text": "Test CV content",
            "job_description": "Test JD content",
        })
        assert response.status_code == 500
        assert "AI Client" in response.json().get("detail", "")

    def test_cover_letter_returns_500_without_ai_key(self, client):
        """
        /generate-cover-letter should also return 500 when client is None.
        """
        import main
        if main.client is not None:
            pytest.skip("GROQ_API_KEY is set — skipping missing-client test")

        response = client.post("/generate-cover-letter", json={
            "cv_text": "Test CV",
            "job_description": "Test JD",
        })
        assert response.status_code == 500
        assert "AI Client" in response.json().get("detail", "")


# ---------------------------------------------------------------------------
# Fixture Integrity Tests
# ---------------------------------------------------------------------------
class TestFixtureIntegrity:
    """Verify that the benchmark test fixtures exist and are well-formed."""

    def test_fixture_directory_exists(self):
        """The fixtures/ directory must exist."""
        assert os.path.isdir(FIXTURES_DIR), \
            f"Fixtures directory not found: {FIXTURES_DIR}"

    def test_test_cv_exists_and_not_empty(self):
        """test_cv.txt must exist and contain substantial text."""
        path = os.path.join(FIXTURES_DIR, "test_cv.txt")
        assert os.path.isfile(path), f"test_cv.txt not found at {path}"
        with open(path, "r") as f:
            content = f.read()
        assert len(content) > 500, \
            f"test_cv.txt is too short ({len(content)} chars) — expected ≥500"

    def test_test_jd_exists_and_not_empty(self):
        """test_jd.txt must exist and contain substantial text."""
        path = os.path.join(FIXTURES_DIR, "test_jd.txt")
        assert os.path.isfile(path), f"test_jd.txt not found at {path}"
        with open(path, "r") as f:
            content = f.read()
        assert len(content) > 200, \
            f"test_jd.txt is too short ({len(content)} chars) — expected ≥200"

    def test_test_cv_contains_key_sections(self):
        """The benchmark CV must contain expected section markers."""
        path = os.path.join(FIXTURES_DIR, "test_cv.txt")
        with open(path, "r") as f:
            content = f.read().upper()
        for section in ["EXPERIENCE", "EDUCATION", "SKILLS"]:
            assert section in content, \
                f"Benchmark CV missing section: {section}"

    def test_test_jd_contains_key_sections(self):
        """The benchmark JD must contain expected section markers."""
        path = os.path.join(FIXTURES_DIR, "test_jd.txt")
        with open(path, "r") as f:
            content = f.read().upper()
        for section in ["RESPONSIBILITIES", "QUALIFICATIONS"]:
            assert section in content, \
                f"Benchmark JD missing section: {section}"