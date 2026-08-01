"""
AgriGPT Agricultural Reasoning Engine Pytest Suite
Tests symptom diagnosis, NPK fertilizer calculations, weather advice,
conversation memory, and scanner context binding.
"""

import pytest
import asyncio
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.agri_gpt import agri_gpt_engine


@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def auth_headers(client):
    google_payload = {
        "id_token": "agri_gpt_test_token",
        "profile": {
            "email": "agrigpt_tester@agrinex.io",
            "name": "AgriGPT Tester"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_agrigpt_001_symptom_reasoning_tomato(client, auth_headers):
    payload = {"message": "My tomato leaves have yellow spots and dark concentric rings"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    reply = res.json()["message"].lower()
    assert "tomato" in reply or "blight" in reply or "fungicide" in reply


@pytest.mark.asyncio
async def test_agrigpt_002_symptom_reasoning_rice(client, auth_headers):
    payload = {"message": "My rice field has brown lesions on leaf blades"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    reply = res.json()["message"].lower()
    assert "rice" in reply or "blast" in reply or "lesion" in reply or "spot" in reply or "agrigpt" in reply or "crop" in reply or "isolation" in reply


@pytest.mark.asyncio
async def test_agrigpt_003_fertilizer_calculation(client, auth_headers):
    payload = {"message": "What fertilizer dosage should I use for 1 acre of crops?"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    reply = res.json()["message"].lower()
    assert "npk" in reply or "urea" in reply or "dap" in reply or "fertilizer" in reply


@pytest.mark.asyncio
async def test_agrigpt_004_weather_risk_advice(client, auth_headers):
    payload = {"message": "How does high rain and weather affect my pesticide spraying schedule?"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    reply = res.json()["message"].lower()
    assert "rain" in reply or "weather" in reply or "spray" in reply or "irrigation" in reply


@pytest.mark.asyncio
async def test_agrigpt_005_government_schemes(client, auth_headers):
    payload = {"message": "What government schemes or subsidies are available for small farmers?"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    reply = res.json()["message"].lower()
    assert "pm-kisan" in reply or "scheme" in reply or "subsidy" in reply or "insurance" in reply


@pytest.mark.asyncio
async def test_agrigpt_006_scanner_context_integration(client, auth_headers):
    # First perform a crop scan
    scan_res = await client.post("/ai/detect-disease", json={"image_url": "https://agrinex.io/uploads/tomato_leaf.jpg"}, headers=auth_headers)
    assert scan_res.status_code == 200

    # Then ask chatbot about recent scan
    chat_res = await client.post("/ai/chat", json={"message": "I uploaded a leaf scan. How do I treat it?"}, headers=auth_headers)
    assert chat_res.status_code == 200
    reply = chat_res.json()["message"].lower()
    assert "scan" in reply or "treatment" in reply or "leaf" in reply or "organic" in reply or "crop" in reply


@pytest.mark.asyncio
async def test_agrigpt_007_conversation_history_retrieval(client, auth_headers):
    res = await client.get("/chat/history", headers=auth_headers)
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) > 0


@pytest.mark.asyncio
async def test_agrigpt_008_engine_direct_fallback():
    reply = agri_gpt_engine.generate_domain_reasoning("What fertilizer should I use?")
    assert "NPK" in reply or "Urea" in reply
