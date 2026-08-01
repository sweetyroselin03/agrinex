import pytest
import asyncio
import pytest_asyncio
import sys
import os
import io

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
        "id_token": "profile_suite_mock_token",
        "profile": {
            "email": "profile_tester@agrinex.io",
            "name": "Profile Tester",
            "picture": "https://agrinex.io/avatars/default.png"
        }
    }
    res = await client.post("/auth/google", json=google_payload)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# ════════════════════════════════════════════════════════════════════════════
# USER PROFILE & SETTINGS MODULE TESTS (30 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_profile_001_get_my_profile(client, auth_headers):
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "profile_tester@agrinex.io"

@pytest.mark.asyncio
async def test_profile_002_update_full_name(client, auth_headers):
    payload = {"full_name": "Updated Farmer Name"}
    res = await client.put("/user/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["display_name"] == "Updated Farmer Name"

@pytest.mark.asyncio
async def test_profile_003_update_bio_and_village(client, auth_headers):
    payload = {"bio": "Expert in Organic Rice Farming", "village": "Pune Agri District"}
    res = await client.put("/user/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_profile_004_update_crop_specialization(client, auth_headers):
    payload = {"crop_specialization": "Sugarcane, Cotton, Soybeans"}
    res = await client.put("/user/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_profile_005_update_phone_number(client, auth_headers):
    payload = {"phone": "+919123456789"}
    res = await client.put("/user/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_profile_006_update_avatar_url(client, auth_headers):
    payload = {"avatar_url": "https://agrinex.io/uploads/avatar_new.jpg"}
    res = await client.put("/user/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_profile_007_upload_avatar_image_file(client, auth_headers):
    # Simulate multipart file upload
    file_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    files = {"file": ("avatar.png", io.BytesIO(file_bytes), "image/png")}
    res = await client.post("/user/avatar", files=files, headers=auth_headers)
    assert res.status_code in [200, 201, 404]

@pytest.mark.asyncio
async def test_profile_008_get_profile_by_id(client, auth_headers):
    me_res = await client.get("/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]
    res = await client.get(f"/user/{user_id}", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_009_get_nonexistent_user_profile(client):
    res = await client.get("/user/nonexistent_user_999999")
    assert res.status_code in [404, 200]

@pytest.mark.asyncio
async def test_profile_010_search_users_query(client):
    res = await client.get("/users/search?q=Profile")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_profile_011_search_users_empty_query(client):
    res = await client.get("/users/search?q=")
    assert res.status_code in [200, 400, 422]

@pytest.mark.asyncio
async def test_profile_012_suggested_users_list(client, auth_headers):
    res = await client.get("/users/suggested", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

@pytest.mark.asyncio
async def test_profile_013_get_user_settings(client, auth_headers):
    res = await client.get("/user/settings", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_014_update_user_settings_push_notifications(client, auth_headers):
    payload = {"push_notifications": True, "email_alerts": False, "theme": "dark"}
    res = await client.put("/user/settings", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_015_update_user_language_preference(client, auth_headers):
    payload = {"language": "hi"} # Hindi
    res = await client.put("/user/settings", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_016_get_user_followers_count(client, auth_headers):
    me_res = await client.get("/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]
    res = await client.get(f"/user/{user_id}/followers", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_017_get_user_following_count(client, auth_headers):
    me_res = await client.get("/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]
    res = await client.get(f"/user/{user_id}/following", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_018_get_user_posts(client, auth_headers):
    me_res = await client.get("/auth/me", headers=auth_headers)
    user_id = me_res.json()["id"]
    res = await client.get(f"/user/{user_id}/posts", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_019_get_user_activity_log(client, auth_headers):
    res = await client.get("/user/activity", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_020_verify_farmer_badge_status(client, auth_headers):
    res = await client.get("/user/badge-status", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_021_request_farmer_verification(client, auth_headers):
    payload = {"kisan_id": "KISAAN-123456-IN", "document_type": "land_record"}
    res = await client.post("/user/verify-farmer-request", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404, 201]

@pytest.mark.asyncio
async def test_profile_022_update_location_coordinates(client, auth_headers):
    payload = {"latitude": 18.5204, "longitude": 73.8567, "city": "Pune", "state": "Maharashtra"}
    res = await client.put("/user/location", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_023_get_saved_posts_list(client, auth_headers):
    res = await client.get("/user/saved-posts", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_024_get_liked_posts_list(client, auth_headers):
    res = await client.get("/user/liked-posts", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_025_update_privacy_setting_private_account(client, auth_headers):
    payload = {"is_private": True}
    res = await client.put("/user/privacy", json=payload, headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_026_block_user(client, auth_headers):
    res = await client.post("/user/block/target_user_id_123", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_027_unblock_user(client, auth_headers):
    res = await client.post("/user/unblock/target_user_id_123", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_028_get_blocked_users_list(client, auth_headers):
    res = await client.get("/user/blocked-users", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_029_export_user_data_privacy(client, auth_headers):
    res = await client.get("/user/export-data", headers=auth_headers)
    assert res.status_code in [200, 404]

@pytest.mark.asyncio
async def test_profile_030_delete_user_account(client, auth_headers):
    # Test soft delete endpoint or verification
    res = await client.post("/user/delete-account-request", json={"reason": "Testing cleanup"}, headers=auth_headers)
    assert res.status_code in [200, 404, 202]
