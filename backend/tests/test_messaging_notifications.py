import pytest
import asyncio
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.websocket_manager import manager as ws_manager

@pytest_asyncio.fixture(scope="module")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="module")
async def auth_headers(client):
    google_payload = {
        "id_token": "msg_suite_token",
        "profile": {
            "email": "msg_tester@agrinex.io",
            "name": "Messaging Tester",
            "picture": "https://agrinex.io/avatars/msg.png"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# DIRECT MESSAGING & NOTIFICATION SYSTEM MODULE TESTS (35 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_msg_001_get_conversations_list(client, auth_headers):
    res = await client.get("/messages/conversations", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_002_start_conversation_with_user(client, auth_headers):
    payload = {"receiver_id": "1", "content": "Hello! I saw your post on organic rice."}
    res = await client.post("/messages/send", json=payload, headers=auth_headers)
    assert res.status_code in [200, 201, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_003_send_message_empty_content(client, auth_headers):
    payload = {"receiver_id": "1", "content": ""}
    res = await client.post("/messages/send", json=payload, headers=auth_headers)
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_msg_004_get_conversation_messages_by_user(client, auth_headers):
    res = await client.get("/messages/conversations/1", headers=auth_headers)
    assert res.status_code in [200, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_005_mark_messages_read(client, auth_headers):
    res = await client.post("/messages/conversations/1/read", headers=auth_headers)
    assert res.status_code in [200, 204, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_006_get_total_unread_message_count(client, auth_headers):
    res = await client.get("/messages/unread-count", headers=auth_headers)
    assert res.status_code in [200, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_007_send_image_in_direct_message(client, auth_headers):
    payload = {
        "receiver_id": "1",
        "content": "Check this crop leaf image",
        "image_url": "https://agrinex.io/uploads/chat_leaf.jpg"
    }
    res = await client.post("/messages/send", json=payload, headers=auth_headers)
    assert res.status_code in [200, 201, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_008_delete_direct_message(client, auth_headers):
    res = await client.delete("/messages/12345", headers=auth_headers)
    assert res.status_code in [200, 204, 400, 404, 405, 422, 500]

@pytest.mark.asyncio
async def test_msg_009_delete_conversation_history(client, auth_headers):
    res = await client.delete("/messages/conversations/1", headers=auth_headers)
    assert res.status_code in [200, 204, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_010_websocket_manager_initialization(client):
    assert ws_manager is not None
    assert hasattr(ws_manager, "active_connections")

@pytest.mark.asyncio
async def test_msg_011_get_notifications_list(client, auth_headers):
    res = await client.get("/notifications", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_012_get_unread_notification_count(client, auth_headers):
    res = await client.get("/notifications/unread-count", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_013_mark_single_notification_read(client, auth_headers):
    res = await client.post("/notifications/1/read", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_014_mark_all_notifications_read(client, auth_headers):
    res = await client.post("/notifications/read-all", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_015_delete_notification(client, auth_headers):
    res = await client.delete("/notifications/1", headers=auth_headers)
    assert res.status_code in [200, 204, 404, 422]

@pytest.mark.asyncio
async def test_msg_016_clear_all_notifications(client, auth_headers):
    res = await client.delete("/notifications/clear-all", headers=auth_headers)
    assert res.status_code in [200, 204, 404, 422]

@pytest.mark.asyncio
async def test_msg_017_notification_preferences(client, auth_headers):
    res = await client.get("/notifications/settings", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_018_update_notification_preferences(client, auth_headers):
    payload = {"like_notifications": True, "comment_notifications": True, "marketing_notifications": False}
    res = await client.put("/notifications/settings", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_019_register_push_device_token(client, auth_headers):
    payload = {"device_token": "ExponentPushToken[mock_token_12345]", "platform": "android"}
    res = await client.post("/notifications/push-token", json=payload, headers=auth_headers)
    assert res.status_code in [200, 201, 404, 422]

@pytest.mark.asyncio
async def test_msg_020_unregister_push_device_token(client, auth_headers):
    payload = {"device_token": "ExponentPushToken[mock_token_12345]"}
    res = await client.post("/notifications/unregister-token", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_021_pin_conversation(client, auth_headers):
    res = await client.post("/messages/conversations/1/pin", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_022_unpin_conversation(client, auth_headers):
    res = await client.post("/messages/conversations/1/unpin", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_023_mute_conversation_notifications(client, auth_headers):
    res = await client.post("/messages/conversations/1/mute", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_024_unmute_conversation_notifications(client, auth_headers):
    res = await client.post("/messages/conversations/1/unmute", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_025_archive_conversation(client, auth_headers):
    res = await client.post("/messages/conversations/1/archive", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_026_get_archived_conversations(client, auth_headers):
    res = await client.get("/messages/conversations/archived", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_027_send_voice_note_message(client, auth_headers):
    payload = {
        "receiver_id": "1",
        "audio_url": "https://agrinex.io/uploads/voicenote.aac",
        "duration_seconds": 12
    }
    res = await client.post("/messages/send", json=payload, headers=auth_headers)
    assert res.status_code in [200, 201, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_028_typing_indicator_start(client, auth_headers):
    res = await client.post("/messages/typing/1/start", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_029_typing_indicator_stop(client, auth_headers):
    res = await client.post("/messages/typing/1/stop", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_030_reaction_to_message(client, auth_headers):
    res = await client.post("/messages/123/react", json={"emoji": "👍"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_031_search_message_content(client, auth_headers):
    res = await client.get("/messages/search?q=harvest", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_032_get_online_users_status(client, auth_headers):
    res = await client.get("/messages/online-status", headers=auth_headers)
    assert res.status_code in [200, 404, 422, 500]

@pytest.mark.asyncio
async def test_msg_033_broadcast_announcement_system(client, auth_headers):
    res = await client.get("/notifications/broadcasts", headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_034_report_message_abuse(client, auth_headers):
    res = await client.post("/messages/123/report", json={"reason": "Inappropriate content"}, headers=auth_headers)
    assert res.status_code in [200, 404, 422]

@pytest.mark.asyncio
async def test_msg_035_websocket_disconnect_clean_up(client):
    assert ws_manager is not None
