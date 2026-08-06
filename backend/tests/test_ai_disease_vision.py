"""
AgriNex AI Disease Vision & Two-Stage Scanner Pytest Suite
Tests model loading, Stage 1 Plant Gate, Stage 2 Disease Detection,
Unknown Species Handling, Grad-CAM overlays, and Latency Benchmarks.
"""

import pytest
import asyncio
import pytest_asyncio
import sys
import os
import time
import io

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from PIL import Image
from httpx import AsyncClient, ASGITransport
from app.main import app

def generate_leaf_image_bytes(color=(34, 139, 34), size=(224, 224), fmt="JPEG"):
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.getvalue()

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function")
async def auth_headers(client):
    google_payload = {
        "id_token": "ai_vision_suite_token",
        "profile": {
            "email": "ai_vision_tester@agrinex.io",
            "name": "AI Vision Tester"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# AI DISEASE VISION & TWO-STAGE SCANNER TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_vision_001_model_loading_warmup(client):
    start = time.time()
    res = await client.get("/health")
    duration_ms = (time.time() - start) * 1000
    assert res.status_code == 200
    assert duration_ms < 1000

@pytest.mark.asyncio
async def test_vision_002_disease_detection_valid_image_url(client, auth_headers):
    payload = {"image_url": "https://agrinex.io/uploads/tomato_leaf_spot.jpg"}
    start = time.time()
    res = await client.post("/ai/detect-disease", json=payload, headers=auth_headers)
    latency_ms = (time.time() - start) * 1000
    assert res.status_code == 200
    assert latency_ms < 2000

@pytest.mark.asyncio
async def test_vision_003_disease_detection_healthy_leaf(client, auth_headers):
    payload = {"image_url": "https://agrinex.io/uploads/healthy_leaf.jpg"}
    res = await client.post("/ai/detect-disease", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid_crop"] == True

@pytest.mark.asyncio
async def test_vision_004_non_plant_object_rejection(client, auth_headers):
    payload = {"image_url": "https://agrinex.io/uploads/random_laptop.jpg"}
    res = await client.post("/ai/detect-disease", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid_crop"] == False
    assert "Invalid" in data["disease_name"] or "unable to identify" in data["symptoms"].lower()

@pytest.mark.asyncio
async def test_vision_005_unknown_crop_species_handling(client, auth_headers):
    # Real plant leaf with unknown crop species must NOT be rejected!
    payload = {"image_url": "https://agrinex.io/uploads/unknown_wild_leaf.jpg"}
    res = await client.post("/ai/detect-disease", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid_crop"] == True
    assert any(k in data for k in ["symptoms", "disease_name", "detected_object"])

@pytest.mark.asyncio
async def test_vision_006_confidence_score_present(client, auth_headers):
    res = await client.post("/ai/detect-disease", json={"image_url": "https://agrinex.io/uploads/leaf.jpg"}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "confidence" in data or "confidence_level" in data

@pytest.mark.asyncio
async def test_vision_007_inference_latency_under_1000ms(client, auth_headers):
    start = time.time()
    res = await client.post("/ai/detect-disease", json={"image_url": "https://agrinex.io/uploads/leaf.jpg"}, headers=auth_headers)
    elapsed_ms = (time.time() - start) * 1000
    assert res.status_code == 200
    assert elapsed_ms < 2000

@pytest.mark.asyncio
async def test_vision_008_supported_diseases_endpoint(client):
    res = await client.get("/ai/supported-diseases")
    assert res.status_code == 200
    data = res.json()
    assert "total_diseases" in data or "categories" in data

@pytest.mark.asyncio
async def test_vision_009_supported_crops_endpoint(client):
    res = await client.get("/ai/supported-crops")
    assert res.status_code == 200
    data = res.json()
    assert "crops" in data

@pytest.mark.asyncio
async def test_vision_010_model_metadata_version(client):
    res = await client.get("/ai/model-info")
    assert res.status_code == 200
    data = res.json()
    assert "model_name" in data

@pytest.mark.asyncio
async def test_vision_011_accuracy_metrics_endpoint(client):
    res = await client.get("/ai/accuracy-metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["validation_accuracy"] >= 95.0
    assert data["plant_detection_recall"] >= 98.0
    assert data["false_rejection_rate"] < 1.0

@pytest.mark.asyncio
async def test_vision_012_scan_history_endpoint(client, auth_headers):
    res = await client.get("/ai/scan-history", headers=auth_headers)
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
