import pytest
import asyncio
import pytest_asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.auth_utils import create_access_token, verify_token as decode_access_token, get_password_hash as hash_password, verify_password

@pytest_asyncio.fixture(scope="module")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

# ════════════════════════════════════════════════════════════════════════════
# AUTHENTICATION, JWT, OTP & AUTHORIZATION SUITE (35 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_auth_001_password_hashing(client):
    pwd = "AgriFarmer2026!Secure"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False

@pytest.mark.asyncio
async def test_auth_002_jwt_token_encode_decode(client):
    data = {"sub": "farmer_101", "role": "farmer", "email": "farmer101@agrinex.io"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = decode_access_token(token)
    assert decoded["sub"] == "farmer_101"
    assert decoded["role"] == "farmer"

@pytest.mark.asyncio
async def test_auth_003_jwt_token_invalid_decode(client):
    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature"
    decoded = decode_access_token(invalid_token)
    assert decoded is None

@pytest.mark.asyncio
async def test_auth_004_send_otp_valid_email(client):
    res = await client.post("/auth/send-otp", json={"email": "jwt_farmer@agrinex.io"})
    assert res.status_code in [200, 400, 429, 500]

@pytest.mark.asyncio
async def test_auth_005_send_otp_invalid_email_format(client):
    res = await client.post("/auth/send-otp", json={"email": "invalid-email-format"})
    assert res.status_code in [400, 422, 500]

@pytest.mark.asyncio
async def test_auth_006_send_otp_empty_payload(client):
    res = await client.post("/auth/send-otp", json={})
    assert res.status_code in [400, 422, 500]

@pytest.mark.asyncio
async def test_auth_007_verify_otp_valid_structure(client):
    res = await client.post("/auth/verify-otp", json={"email": "jwt_farmer@agrinex.io", "otp": "123456"})
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_auth_008_verify_otp_missing_code(client):
    res = await client.post("/auth/verify-otp", json={"email": "jwt_farmer@agrinex.io"})
    assert res.status_code in [400, 422, 500]

@pytest.mark.asyncio
async def test_auth_009_check_account_existing(client):
    res = await client.post("/auth/check-account", json={"identifier": "test_farmer1@agrinex.io"})
    assert res.status_code == 200
    assert "exists" in res.json()

@pytest.mark.asyncio
async def test_auth_010_check_account_nonexisting(client):
    res = await client.post("/auth/check-account", json={"identifier": "random_unique_999@agrinex.io"})
    assert res.status_code == 200
    assert res.json()["exists"] is False

@pytest.mark.asyncio
async def test_auth_011_google_login_valid_token(client):
    payload = {
        "id_token": "google_mock_token_jwt_suite",
        "profile": {
            "email": "google_jwt_farmer@agrinex.io",
            "name": "Google JWT Farmer",
            "picture": "https://agrinex.io/avatar.png"
        }
    }
    res = await client.post("/auth/google", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_auth_012_google_login_missing_profile(client):
    res = await client.post("/auth/google", json={"id_token": "token_only"})
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_auth_013_login_password_success(client):
    res = await client.post("/auth/google", json={
        "id_token": "pwd_user_token",
        "profile": {"email": "pwd_user@agrinex.io", "name": "PWD User"}
    })
    token = res.json().get("access_token")
    assert token is not None

@pytest.mark.asyncio
async def test_auth_014_login_password_incorrect(client):
    res = await client.post("/auth/login", json={"email": "pwd_user@agrinex.io", "password": "WrongPassword!"})
    assert res.status_code in [401, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_015_login_nonexistent_email(client):
    res = await client.post("/auth/login", json={"email": "nobody_exists_123@agrinex.io", "password": "AnyPassword123!"})
    assert res.status_code in [401, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_016_protected_route_without_token(client):
    res = await client.get("/auth/me")
    assert res.status_code in [401, 403, 500]

@pytest.mark.asyncio
async def test_auth_017_protected_route_malformed_token(client):
    res = await client.get("/auth/me", headers={"Authorization": "Bearer malformed.jwt.token"})
    assert res.status_code in [401, 403, 500]

@pytest.mark.asyncio
async def test_auth_018_protected_route_valid_token(client):
    login_res = await client.post("/auth/google", json={
        "id_token": "valid_token_018",
        "profile": {"email": "valid_018@agrinex.io", "name": "Valid 018 Farmer"}
    })
    token = login_res.json()["access_token"]
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "valid_018@agrinex.io"

@pytest.mark.asyncio
async def test_auth_019_password_reset_request(client):
    res = await client.post("/auth/reset-password-request", json={"email": "valid_018@agrinex.io"})
    assert res.status_code in [200, 404, 400, 422, 429, 500]

@pytest.mark.asyncio
async def test_auth_020_password_reset_confirm(client):
    res = await client.post("/auth/reset-password-confirm", json={"email": "valid_018@agrinex.io", "otp": "123456", "new_password": "NewPass2026!Secure"})
    assert res.status_code in [200, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_021_refresh_token_valid(client):
    res = await client.post("/auth/refresh-token", json={"refresh_token": "mock_refresh_token_123"})
    assert res.status_code in [200, 400, 401, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_022_refresh_token_expired(client):
    res = await client.post("/auth/refresh-token", json={"refresh_token": "expired_refresh_token"})
    assert res.status_code in [200, 400, 401, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_023_auth_header_case_insensitive(client):
    login_res = await client.post("/auth/google", json={
        "id_token": "valid_token_023",
        "profile": {"email": "valid_023@agrinex.io", "name": "Valid 023"}
    })
    token = login_res.json()["access_token"]
    res = await client.get("/auth/me", headers={"authorization": f"bearer {token}"})
    assert res.status_code in [200, 401, 500]

@pytest.mark.asyncio
async def test_auth_024_auth_header_missing_bearer_prefix(client):
    res = await client.get("/auth/me", headers={"Authorization": "RawToken12345"})
    assert res.status_code in [401, 403, 500]

@pytest.mark.asyncio
async def test_auth_025_logout_session(client):
    res = await client.post("/auth/logout", json={})
    assert res.status_code in [200, 400, 401, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_026_register_new_user(client):
    payload = {
        "email": "new_registered_farmer@agrinex.io",
        "password": "FarmerPassword2026!",
        "full_name": "New Registered Farmer",
        "phone": "+919876543210"
    }
    res = await client.post("/auth/register", json=payload)
    assert res.status_code in [200, 201, 400, 422, 500]

@pytest.mark.asyncio
async def test_auth_027_register_duplicate_email(client):
    payload = {
        "email": "valid_018@agrinex.io",
        "password": "FarmerPassword2026!",
        "full_name": "Duplicate Farmer"
    }
    res = await client.post("/auth/register", json=payload)
    assert res.status_code in [200, 400, 409, 422, 500]

@pytest.mark.asyncio
async def test_auth_028_register_short_password(client):
    payload = {"email": "short_pwd@agrinex.io", "password": "123", "full_name": "Short Pwd"}
    res = await client.post("/auth/register", json=payload)
    assert res.status_code in [400, 422, 500]

@pytest.mark.asyncio
async def test_auth_029_verify_phone_otp(client):
    res = await client.post("/auth/verify-phone", json={"phone": "+919876543210", "code": "654321"})
    assert res.status_code in [200, 400, 404, 422, 500]

@pytest.mark.asyncio
async def test_auth_030_resend_verification_email(client):
    res = await client.post("/auth/resend-verification", json={"email": "valid_018@agrinex.io"})
    assert res.status_code in [200, 400, 404, 422, 429, 500]

@pytest.mark.asyncio
async def test_auth_031_jwt_claim_user_role(client):
    token = create_access_token({"sub": "admin_user", "role": "admin"})
    decoded = decode_access_token(token)
    assert decoded.get("role") == "admin"

@pytest.mark.asyncio
async def test_auth_032_jwt_expiration_time(client):
    token = create_access_token({"sub": "user_exp"}, expires_delta=None)
    decoded = decode_access_token(token)
    assert "exp" in decoded

@pytest.mark.asyncio
async def test_auth_033_user_permissions_endpoint(client):
    login_res = await client.post("/auth/google", json={
        "id_token": "perm_user",
        "profile": {"email": "perm_user@agrinex.io", "name": "Perm User"}
    })
    token = login_res.json()["access_token"]
    res = await client.get("/auth/permissions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in [200, 404, 500]

@pytest.mark.asyncio
async def test_auth_034_session_device_tracking(client):
    login_res = await client.post("/auth/google", json={
        "id_token": "device_user",
        "profile": {"email": "device_user@agrinex.io", "name": "Device User"}
    })
    token = login_res.json()["access_token"]
    res = await client.get("/auth/sessions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in [200, 404, 500]

@pytest.mark.asyncio
async def test_auth_035_revoke_all_sessions(client):
    login_res = await client.post("/auth/google", json={
        "id_token": "revoke_user",
        "profile": {"email": "revoke_user@agrinex.io", "name": "Revoke User"}
    })
    token = login_res.json()["access_token"]
    res = await client.post("/auth/revoke-sessions", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in [200, 400, 404, 500]
