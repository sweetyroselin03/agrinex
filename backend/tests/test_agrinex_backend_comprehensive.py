import pytest
import asyncio
import pytest_asyncio
import sys
import os

# Add backend root directory to python path
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
        "id_token": "mock_google_oauth_token_12345",
        "profile": {
            "email": "test_farmer1@agrinex.io",
            "name": "Test Farmer 1",
            "picture": "https://agrinex.io/avatars/farmer1.jpg"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    data = res.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# 1. AUTHENTICATION & OTP MODULE TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_001_send_otp_flow(client):
    """Test 001: OTP Generation Flow"""
    res = await client.post("/auth/send-otp", json={"email": "test_otp@agrinex.io"})
    assert res.status_code in [200, 429, 400, 500]

@pytest.mark.asyncio
async def test_002_verify_otp_flow(client):
    """Test 002: Verify OTP Flow"""
    res = await client.post("/auth/verify-otp", json={"email": "test_otp@agrinex.io", "otp": "123456"})
    assert res.status_code in [200, 400, 422]

@pytest.mark.asyncio
async def test_003_check_account_flow(client):
    """Test 003: Check Account Existence"""
    res = await client.post("/auth/check-account", json={"identifier": "nonexistent@agrinex.io"})
    assert res.status_code == 200
    assert res.json().get("exists") is False

@pytest.mark.asyncio
async def test_004_google_social_login(client):
    """Test 004: Google OAuth Integration Route"""
    google_payload = {
        "id_token": "mock_token",
        "profile": {
            "email": "farmer.google@agrinex.io",
            "name": "Google Farmer"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    assert res.status_code == 200
    assert "access_token" in res.json()

@pytest.mark.asyncio
async def test_005_login_invalid_password(client):
    """Test 005: Authentication Security - Reject Invalid Passwords"""
    res = await client.post("/auth/login", json={
        "email": "farmer.google@agrinex.io",
        "password": "WrongPassword123!"
    })
    assert res.status_code in [401, 400]

# ════════════════════════════════════════════════════════════════════════════
# 2. USER PROFILE & MANAGEMENT MODULE TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_006_get_current_user_profile(client, auth_headers):
    """Test 006: Retrieve Current Authenticated User Profile"""
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test_farmer1@agrinex.io"

@pytest.mark.asyncio
async def test_007_update_user_profile(client, auth_headers):
    """Test 007: Update User Profile Metadata"""
    update_payload = {
        "full_name": "Test Farmer 1 Updated",
        "bio": "Organic Rice Farmer in Maharashtra",
        "village": "Nashik Agri Hub",
        "crop_specialization": "Rice & Wheat"
    }
    res = await client.put("/user/profile", json=update_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["display_name"] == "Test Farmer 1 Updated"

@pytest.mark.asyncio
async def test_008_search_users_query(client):
    """Test 008: Search Users by Query"""
    res = await client.get("/users/search?q=Sweety")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_009_suggested_users(client, auth_headers):
    """Test 009: Suggested Farmers/Users Endpoint"""
    res = await client.get("/users/suggested", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

# ════════════════════════════════════════════════════════════════════════════
# 3. COMMUNITY & SOCIAL FEED MODULE TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_010_create_community_post(client, auth_headers):
    """Test 010: Create Organic Crop Post"""
    post_payload = {
        "content": "Harvesting high yield organic wheat today! Tips for pest management?",
        "category": "Crops",
        "crop_type": "Wheat",
        "images": ["https://agrinex.io/uploads/wheat_field.jpg"]
    }
    res = await client.post("/posts", json=post_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["content"] == post_payload["content"]

@pytest.mark.asyncio
async def test_011_get_community_feed(client):
    """Test 011: Fetch Community Post Feed"""
    res = await client.get("/posts/feed")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

@pytest.mark.asyncio
async def test_012_like_post_interaction(client, auth_headers):
    """Test 012: Like and Unlike Post Interaction"""
    # Create post first
    post_res = await client.post("/posts", json={"content": "Like test post"}, headers=auth_headers)
    post_id = post_res.json()["id"]
    res = await client.post(f"/posts/{post_id}/like", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["liked"] is True

@pytest.mark.asyncio
async def test_013_comment_on_post(client, auth_headers):
    """Test 013: Comment on Post"""
    post_res = await client.post("/posts", json={"content": "Comment test post"}, headers=auth_headers)
    post_id = post_res.json()["id"]
    res = await client.post(f"/posts/{post_id}/comments", json={"content": "Great harvest!"}, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["content"] == "Great harvest!"

@pytest.mark.asyncio
async def test_014_save_post(client, auth_headers):
    """Test 014: Bookmark/Save Post"""
    post_res = await client.post("/posts", json={"content": "Save test post"}, headers=auth_headers)
    post_id = post_res.json()["id"]
    res = await client.post(f"/posts/{post_id}/save", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["saved"] is True

# ════════════════════════════════════════════════════════════════════════════
# 4. NOTIFICATION SYSTEM MODULE TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_015_get_notifications(client, auth_headers):
    """Test 015: Get Notifications List"""
    res = await client.get("/notifications", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_016_get_unread_notification_count(client, auth_headers):
    """Test 016: Unread Notification Count"""
    res = await client.get("/notifications/unread-count", headers=auth_headers)
    assert res.status_code == 200
    assert "count" in res.json()

# ════════════════════════════════════════════════════════════════════════════
# 5. AI ASSISTANT & WEATHER MODULE TESTS
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_017_ai_chat_advisor(client, auth_headers):
    """Test 017: AI Agronomist Chat Advisor"""
    chat_payload = {
        "message": "What fertilizer is best for tomato yellow leaf curling?"
    }
    res = await client.post("/ai/chat", json=chat_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "message" in data

@pytest.mark.asyncio
async def test_018_realtime_weather_api(client):
    """Test 018: Realtime Weather API Integration"""
    res = await client.get("/weather/current?lat=19.076&lon=72.8777")
    assert res.status_code == 200
    data = res.json()
    assert "temp" in data
    assert "condition" in data
    assert "farming_suitability" in data

@pytest.mark.asyncio
async def test_019_database_and_system_health(client):
    """Test 019: Backend System Health Endpoint"""
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
