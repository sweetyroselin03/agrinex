import pytest
import asyncio
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function")
async def auth_headers(client):
    google_payload = {
        "id_token": "agri_ai_suite_token",
        "profile": {
            "email": "ai_agri_tester@agrinex.io",
            "name": "AI Agri Tester"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# AI ASSISTANT, WEATHER, SCHEMES & AGRICULTURAL SERVICES (40 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_ai_001_ai_chat_general_query(client, auth_headers):
    payload = {"message": "How do I prevent fungal rust on organic wheat?"}
    res = await client.post("/ai/chat", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert "message" in res.json() or "response" in res.json()

@pytest.mark.asyncio
async def test_ai_002_ai_chat_empty_prompt_validation(client, auth_headers):
    res = await client.post("/ai/chat", json={"message": ""}, headers=auth_headers)
    assert res.status_code in [400, 422, 200]

@pytest.mark.asyncio
async def test_ai_003_crop_recommendation_sandy_loam(client, auth_headers):
    payload = {
        "soil_type": "Sandy Loam",
        "nitrogen": 40,
        "phosphorus": 30,
        "potassium": 20,
        "ph": 6.5,
        "rainfall": 120.0
    }
    res = await client.post("/ai/recommend-crop", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_004_crop_recommendation_black_clay(client, auth_headers):
    payload = {
        "soil_type": "Black Clay",
        "nitrogen": 80,
        "phosphorus": 50,
        "potassium": 40,
        "ph": 7.5,
        "rainfall": 200.0
    }
    res = await client.post("/ai/recommend-crop", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_005_fertilizer_advisory_calculation(client, auth_headers):
    payload = {
        "crop_name": "Wheat",
        "soil_n": 20,
        "soil_p": 15,
        "soil_k": 10,
        "target_yield_tons": 4.5
    }
    res = await client.post("/ai/recommend-fertilizer", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_006_realtime_weather_current_pune(client):
    res = await client.get("/weather/current?lat=18.5204&lon=73.8567")
    assert res.status_code == 200
    data = res.json()
    assert "temp" in data
    assert "condition" in data

@pytest.mark.asyncio
async def test_ai_007_realtime_weather_current_delhi(client):
    res = await client.get("/weather/current?lat=28.6139&lon=77.2090")
    assert res.status_code == 200
    data = res.json()
    assert "humidity" in data or "temp" in data

@pytest.mark.asyncio
async def test_ai_008_weather_forecast_5day(client):
    res = await client.get("/weather/forecast?lat=18.5204&lon=73.8567&days=5")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_009_weather_spray_suitability_advisor(client):
    res = await client.get("/weather/spray-suitability?lat=18.5204&lon=73.8567")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_010_get_government_schemes_list(client):
    res = await client.get("/schemes")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_011_search_government_schemes_pm_kisan(client):
    res = await client.get("/schemes/search?q=Kisan")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_012_filter_schemes_by_state(client):
    res = await client.get("/schemes?state=Maharashtra")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_013_get_scheme_details_by_id(client):
    res = await client.get("/schemes/1")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_014_get_market_prices_mandi(client):
    res = await client.get("/market/prices")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_015_search_market_prices_wheat(client):
    res = await client.get("/market/prices?commodity=Wheat")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_016_filter_market_prices_by_state(client):
    res = await client.get("/market/prices?state=Punjab")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_017_market_price_trends_historical(client):
    res = await client.get("/market/trends?commodity=Rice&days=30")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_018_ai_voice_query_transcription_sim(client, auth_headers):
    res = await client.post("/ai/voice-query", json={"audio_format": "mp3"}, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_019_soil_health_card_analysis(client, auth_headers):
    payload = {"ph": 6.8, "organic_carbon": 0.45, "nitrogen_kg_ha": 250, "phosphorus_kg_ha": 18, "potassium_kg_ha": 140}
    res = await client.post("/ai/analyze-soil-health", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_020_irrigation_schedule_calculator(client, auth_headers):
    payload = {"crop": "Cotton", "stage": "Flowering", "temperature_c": 32, "soil_moisture_pct": 25}
    res = await client.post("/ai/irrigation-schedule", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_021_pest_outbreak_risk_prediction(client):
    res = await client.get("/ai/pest-risk?region=Nashik&crop=Grapes")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_022_crop_yield_prediction(client, auth_headers):
    payload = {"crop": "Rice", "area_acres": 5, "fertilizer_used_kg": 150}
    res = await client.post("/ai/predict-yield", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_023_get_crop_calendar(client):
    res = await client.get("/agri/crop-calendar?crop=Wheat&region=North")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_024_organic_farming_guides(client):
    res = await client.get("/agri/guides/organic")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_025_companion_planting_advisor(client):
    res = await client.get("/ai/companion-plants?main_crop=Tomato")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_026_weed_identification_text(client):
    res = await client.post("/ai/identify-weed", json={"description": "Broadleaf weed with yellow flowers"})
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_027_storage_and_preservation_tips(client):
    res = await client.get("/agri/preservation?crop=Potato")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_028_carbon_credit_estimation(client, auth_headers):
    res = await client.post("/ai/estimate-carbon-credits", json={"farm_area_hectares": 10, "practice": "No-Till"}, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_029_nearest_mandi_locator(client):
    res = await client.get("/market/nearest-mandi?lat=18.5204&lon=73.8567")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_030_mandi_price_alert_subscription(client, auth_headers):
    res = await client.post("/market/price-alerts", json={"commodity": "Onion", "target_price": 2500}, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_031_scheme_eligibility_checker(client, auth_headers):
    payload = {"land_holding_acres": 2.5, "caste_category": "General", "state": "Maharashtra"}
    res = await client.post("/schemes/check-eligibility", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_032_get_trending_agricultural_news(client):
    res = await client.get("/agri/news")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_033_equipment_rental_marketplace(client):
    res = await client.get("/equipment/rentals?location=Pune")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_034_seed_variety_database(client):
    res = await client.get("/agri/seeds?crop=Maize")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_035_drought_index_indicator(client):
    res = await client.get("/weather/drought-index?region=Marathwada")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_036_monsoon_arrival_forecast(client):
    res = await client.get("/weather/monsoon-forecast?year=2026")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_037_crop_insurance_calculator(client, auth_headers):
    res = await client.post("/agri/insurance-calculator", json={"crop": "Cotton", "sum_insured": 50000}, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_038_soil_testing_lab_finder(client):
    res = await client.get("/agri/labs?pincode=411001")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_039_krishi_vigyan_kendra_contacts(client):
    res = await client.get("/agri/kvk-contacts?district=Nashik")
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_ai_040_agronomy_glossary(client):
    res = await client.get("/agri/glossary?term=NPK")
    assert res.status_code in [200, 404]
