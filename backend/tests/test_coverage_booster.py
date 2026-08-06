import pytest
import asyncio
import pytest_asyncio
import sys
import os
from unittest.mock import AsyncMock, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.websocket_manager import manager as ws_manager
from app.auth_utils import create_access_token, create_refresh_token
from app.database import get_db

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="function")
async def auth_headers(client):
    google_payload = {
        "id_token": "booster_mock_google_oauth_token",
        "profile": {
            "email": "booster_farmer@agrinex.io",
            "name": "Booster Farmer",
            "picture": "https://agrinex.io/avatars/booster.jpg"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    data = res.json()
    token = data["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_booster_root_and_health(client):
    res = await client.get("/")
    assert res.status_code == 200
    assert "AgriNex" in res.json()["message"]

    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_booster_auth_edge_cases(client, auth_headers):
    # Invalid token decryption / verification
    headers = {"Authorization": "Bearer invalid_token_bytes"}
    res = await client.get("/auth/me", headers=headers)
    assert res.status_code == 401

    headers = {"Authorization": "Bearer \x00nullbytes"}
    res = await client.get("/auth/me", headers=headers)
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_booster_otp_handling(client):
    # 1. OTP invalid formats
    res = await client.post("/auth/send-otp", json={"email": "invalidformat"})
    assert res.status_code == 400
    
    res = await client.post("/auth/send-otp", json={"email": "   "})
    assert res.status_code == 400

    # 2. OTP Check Account
    res = await client.post("/auth/check-account", json={"identifier": "nonexistent@agrinex.io"})
    assert res.status_code == 200
    assert res.json()["exists"] is False

    # 3. OTP Verify invalid
    res = await client.post("/auth/verify-otp", json={"email": "nonexistent@agrinex.io", "otp": "000000"})
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_booster_user_profile_management(client, auth_headers):
    # Get profile details
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    user_id = res.json()["id"]

    # Update profile info (using PUT/PATCH)
    res = await client.put("/user/profile", headers=auth_headers, json={
        "full_name": "Booster Updated",
        "bio": "New Bio info for booster test",
        "village": "Test Ville",
        "crop_type": "Rice"
    })
    assert res.status_code == 200
    assert res.json()["full_name"] == "Booster Updated"

    # Upload avatar/profile picture
    avatar_data = {"file": ("avatar.png", b"dummy_avatar_content_bytes", "image/png")}
    res = await client.post("/upload", headers=auth_headers, files=avatar_data)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_booster_community_feed_and_posts(client, auth_headers):
    # Create Post
    res = await client.post("/posts", headers=auth_headers, json={
        "title": "Booster Post Title",
        "content": "Booster Post Content description for testing.",
        "category": "General"
    })
    assert res.status_code == 200
    post_id = res.json()["id"]

    # Get Feed
    res = await client.get("/posts/feed", headers=auth_headers)
    assert res.status_code == 200

    # Get Single Post
    res = await client.get(f"/posts/{post_id}", headers=auth_headers)
    assert res.status_code == 200

    # Add Comment
    res = await client.post(f"/posts/{post_id}/comments", headers=auth_headers, json={
        "content": "Nice post booster!"
    })
    assert res.status_code == 200
    comment_id = res.json()["id"]

    # Toggle Like
    res = await client.post(f"/posts/{post_id}/like", headers=auth_headers)
    assert res.status_code == 200

    # Delete Post
    res = await client.delete(f"/posts/{post_id}", headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_booster_notifications_and_social(client, auth_headers):
    # Get Unread Count
    res = await client.get("/notifications/unread-count", headers=auth_headers)
    assert res.status_code == 200

    # Get Notifications
    res = await client.get("/notifications", headers=auth_headers)
    assert res.status_code == 200

    # Clear Notifications
    res = await client.delete("/notifications", headers=auth_headers)
    assert res.status_code == 200

    # User Search and Suggestions
    res = await client.get("/users/search?q=Booster", headers=auth_headers)
    assert res.status_code == 200

    res = await client.get("/users/suggested", headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_booster_chat_advisory(client, auth_headers):
    # Send message to chat AI
    res = await client.post("/ai/chat", headers=auth_headers, json={
        "message": "Which crop is suitable for clay soil?",
        "conversation_id": "booster_conv_id"
    })
    assert res.status_code == 200

    # Legacy chat
    res = await client.post("/chat", headers=auth_headers, json={
        "message": "Hello legacy chat",
        "conversation_id": "booster_conv_id"
    })
    assert res.status_code == 200

    # Chat history
    res = await client.get("/chat/history?conversation_id=booster_conv_id", headers=auth_headers)
    assert res.status_code == 200

    # Delete chat conversation
    res = await client.delete("/chat/conversation/booster_conv_id", headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_booster_websocket_manager():
    # Test ConnectionManager direct calls for complete coverage
    mock_ws = AsyncMock()
    mock_ws.accept = AsyncMock()
    mock_ws.send_json = AsyncMock()

    await ws_manager.connect(mock_ws, 999)
    assert ws_manager.is_online(999) is True

    await ws_manager.send_json_to_user(999, {"test": "data"})
    mock_ws.send_json.assert_called_once_with({"test": "data"})

    await ws_manager.broadcast_to_users([999], {"broadcast": "data"})
    await ws_manager.broadcast_typing(1, 999, "Booster", True, [999])
    await ws_manager.broadcast_read_receipt(1, 999, [1, 2], [999])
    await ws_manager.broadcast_message({"content": "hello"}, [999])
    await ws_manager.broadcast_online_status(999, True, "now", [999])

    ws_manager.disconnect(mock_ws, 999)
    assert ws_manager.is_online(999) is False

@pytest.mark.asyncio
async def test_booster_auth_router_more(client):
    # Set password invalid user
    res = await client.post("/auth/set-password", json={
        "email": "invalid_booster@agrinex.io",
        "password": "Password123!"
    })
    assert res.status_code == 404

    # Google social login missing email
    res = await client.post("/auth/google", json={
        "id_token": "google_token",
        "profile": {
            "name": "Missing Email User"
        }
    })
    assert res.status_code == 400

    # Refresh token invalid
    res = await client.post("/auth/refresh", json={
        "refresh_token": "invalid_refresh_token"
    })
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_booster_weather(client, auth_headers):
    # Current weather with different query parameter cases (e.g. UV, temperature, humidity triggers)
    res = await client.get("/weather/current?lat=19.076&lon=72.8777", headers=auth_headers)
    assert res.status_code == 200

    res = await client.get("/weather/location?lat=19.076&lon=72.8777", headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_booster_direct_messaging_and_blocking(client, auth_headers):
    # 1. Register a recipient user with a unique email to avoid state leakage
    import time
    unique_email = f"recipient_{int(time.time() * 1000)}@agrinex.io"
    google_payload = {
        "id_token": "booster_recipient_token",
        "profile": {
            "email": unique_email,
            "name": "Booster Recipient"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    assert res.status_code == 200
    recipient_id = res.json()["user"]["id"]

    # 2. Start a conversation
    res = await client.post("/conversations", headers=auth_headers, json={"target_user_id": recipient_id})
    assert res.status_code == 200
    conv_id = res.json()["id"]

    # 3. Get conversations
    res = await client.get("/conversations", headers=auth_headers)
    assert res.status_code == 200

    # 4. Pin, Mute, Archive conversation
    res = await client.post(f"/api/conversations/{conv_id}/pin", headers=auth_headers)
    assert res.status_code == 200
    res = await client.post(f"/api/conversations/{conv_id}/mute", headers=auth_headers)
    assert res.status_code == 200
    res = await client.post(f"/api/conversations/{conv_id}/archive", headers=auth_headers)
    assert res.status_code == 200

    # 5. Send message
    res = await client.post(f"/conversations/{conv_id}/messages", headers=auth_headers, json={
        "content": "Hi recipient!"
    })
    assert res.status_code == 200
    msg_id = res.json()["id"]

    # 6. Get messages
    res = await client.get(f"/conversations/{conv_id}/messages", headers=auth_headers)
    assert res.status_code == 200

    # 7. Edit message
    res = await client.patch(f"/api/messages/{msg_id}?msg_id={msg_id}", headers=auth_headers, json={
        "content": "Hi recipient (edited)!"
    })
    assert res.status_code == 200

    # 8. React to message
    res = await client.post(f"/api/messages/{msg_id}/react?msg_id={msg_id}", headers=auth_headers, json={
        "emoji": "👍"
    })
    assert res.status_code == 200

    # 9. Mark read
    res = await client.post(f"/api/messages/{conv_id}/read?conv_id={conv_id}", headers=auth_headers)
    assert res.status_code == 200

    # 10. Delete message
    res = await client.delete(f"/api/messages/{msg_id}?msg_id={msg_id}", headers=auth_headers)
    assert res.status_code == 200

    # 11. User Blocking
    # Try to block self
    res = await client.post(f"/api/users/{recipient_id}/block", headers=auth_headers)  # Block recipient
    assert res.status_code == 200

    res = await client.post(f"/api/users/{recipient_id}/block", headers=auth_headers)  # Block again (conflict)
    assert res.status_code == 409

    res = await client.get("/api/users/blocked", headers=auth_headers)
    assert res.status_code == 200, res.json()

    res = await client.delete(f"/api/users/{recipient_id}/block", headers=auth_headers)  # Unblock
    assert res.status_code == 200, res.json()


@pytest.mark.asyncio
async def test_booster_otp_expiration_and_replay(client):
    email = f"exp_otp_{int(asyncio.get_event_loop().time())}@agrinex.io"
    # 1. Request OTP
    res = await client.post("/auth/send-otp", json={"email": email})
    assert res.status_code == 200
    
    # Let's find the OTP from DB to simulate expiration/replay
    from app.database import SessionLocal
    from app.models import OTPCode
    from datetime import datetime, timezone, timedelta
    
    db = SessionLocal()
    otp_code = None
    try:
        db_otp = db.query(OTPCode).filter(OTPCode.email_or_phone == email).first()
        assert db_otp is not None
        otp_code = db_otp.otp_code
        # Simulate expired OTP
        db_otp.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)
        db.commit()
    finally:
        db.close()
        
    # Verify expired OTP fails verification
    res = await client.post("/auth/verify-otp", json={"email": email, "otp": otp_code})
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_booster_otp_rate_limiting(client):
    email = f"rate_otp_{int(asyncio.get_event_loop().time())}@agrinex.io"
    # First request should succeed
    res = await client.post("/auth/send-otp", json={"email": email})
    assert res.status_code == 200
    
    # Second request immediately after must trigger 429 cooldown limit
    res = await client.post("/auth/send-otp", json={"email": email})
    assert res.status_code == 429
    assert "wait" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_booster_jwt_token_expiry(client):
    # Try requesting protected resource with an expired token
    # Create token with -5 min expiration
    from datetime import timedelta
    expired_token = create_access_token({"sub": "expired_user@agrinex.io"}, expires_delta=timedelta(minutes=-5))
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code in [401, 403]


@pytest.mark.asyncio
async def test_booster_refresh_token_rotation(client):
    # Register/login a user to get valid refresh token
    email = f"refresh_user_{int(asyncio.get_event_loop().time())}@agrinex.io"
    google_payload = {
        "id_token": "mock_google_oauth_token",
        "profile": {
            "email": email,
            "name": "Refresh Tester",
            "picture": "https://agrinex.io/avatars/refresh.jpg"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    assert res.status_code == 200
    data = res.json()
    access_token = data["access_token"]
    
    # Obtain a fresh refresh token
    refresh_token = create_refresh_token(data={"sub": email})
    
    # Call refresh endpoint
    res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    res_data = res.json()
    assert "access_token" in res_data
    assert "refresh_token" in res_data


@pytest.mark.asyncio
async def test_booster_db_session_exception(client):
    from app.database import get_db
    
    def mock_get_db():
        mock_session = MagicMock()
        # Make database execution throw an error
        mock_session.execute.side_effect = Exception("Operational database crash")
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db
    try:
        # Trigger an endpoint that queries database health
        res = await client.get("/health")
        # Ensure it handles the database error gracefully (200, status: error)
        assert res.status_code == 200
        assert res.json()["status"] == "error"
        assert "database crash" in res.json()["database"].lower()
    finally:
        app.dependency_overrides.clear()

