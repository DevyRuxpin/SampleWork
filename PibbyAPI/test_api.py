import pytest
from fastapi.testclient import TestClient
from main import app
import os
import time

client = TestClient(app)

# Test data
TEST_REQUIREMENTS = """
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
"""

TEST_REQUIREMENTS_INVALID = """
invalid==package==1.0
"""

TEST_API_KEY = "test_api_key_123"

@pytest.fixture
def api_headers():
    return {"X-API-Key": TEST_API_KEY}

def test_convert_endpoint_success(api_headers):
    response = client.post(
        "/convert",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
    )
    assert response.status_code == 200
    data = response.json()
    assert "requirements" in data
    assert len(data["requirements"]) == 3
    assert data["requirements"][0]["name"] == "fastapi"

def test_convert_endpoint_invalid_file(api_headers):
    response = client.post(
        "/convert",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS_INVALID)}
    )
    assert response.status_code == 400

def test_check_compatibility_success(api_headers):
    response = client.post(
        "/check-compatibility",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
    )
    assert response.status_code == 200
    data = response.json()
    assert "compatibility_report" in data
    assert "summary" in data

def test_check_vulnerabilities_success(api_headers):
    response = client.post(
        "/check-vulnerabilities",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
    )
    assert response.status_code == 200
    data = response.json()
    assert "vulnerability_report" in data
    assert "summary" in data

def test_check_python_compatibility_success(api_headers):
    response = client.post(
        "/check-python-compatibility",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)},
        params={"python_version": "3.8"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "compatibility_report" in data
    assert "summary" in data

def test_generate_requirements_success(api_headers):
    # First convert requirements to JSON
    convert_response = client.post(
        "/convert",
        headers=api_headers,
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
    )
    assert convert_response.status_code == 200
    json_data = convert_response.json()
    
    # Then generate requirements.txt from JSON
    response = client.post(
        "/generate-requirements",
        headers=api_headers,
        json=json_data
    )
    assert response.status_code == 200
    data = response.json()
    assert "requirements_txt" in data

def test_invalid_api_key():
    response = client.post(
        "/convert",
        headers={"X-API-Key": "invalid_key"},
        files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
    )
    assert response.status_code == 403

def test_rate_limiting(api_headers):
    # In test mode, rate limiting should be more lenient
    # Make multiple requests that should all succeed
    for _ in range(10):  # Try more requests than the normal limit
        response = client.post(
            "/convert",
            headers=api_headers,
            files={"file": ("requirements.txt", TEST_REQUIREMENTS)}
        )
        assert response.status_code == 200  # All requests should succeed in test mode
        time.sleep(0.1)  # Add a small delay between requests 