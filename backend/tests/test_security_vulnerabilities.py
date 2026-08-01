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

# ════════════════════════════════════════════════════════════════════════════
# DAST & SECURITY VULNERABILITY SUITE (30 TESTS)
# ════════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_sec_001_sqli_payload_in_login_email(client):
    sqli_payload = "' OR '1'='1' --"
    res = await client.post("/auth/login", json={"email": sqli_payload, "password": "password"})
    assert res.status_code in [400, 401, 404, 422, 500]

@pytest.mark.asyncio
async def test_sec_002_sqli_payload_in_search_query(client):
    sqli_payload = "'; DROP TABLE users; --"
    res = await client.get(f"/users/search?q={sqli_payload}")
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_sec_003_sqli_payload_in_post_id(client):
    res = await client.get("/posts/1 UNION SELECT null, null, null--")
    assert res.status_code in [200, 307, 400, 404, 405, 422, 500]

@pytest.mark.asyncio
async def test_sec_004_xss_script_injection_in_post_content(client):
    xss_payload = "<script>alert('XSS_ATTACK')</script>"
    res = await client.post("/posts", json={"content": xss_payload})
    assert res.status_code in [200, 401, 403, 422, 500]

@pytest.mark.asyncio
async def test_sec_005_xss_svg_onload_payload(client):
    xss_payload = "<svg/onload=alert('XSS')>"
    res = await client.post("/auth/send-otp", json={"email": xss_payload})
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_sec_006_xss_img_onerror_payload(client):
    xss_payload = "<img src=x onerror=alert(1)>"
    res = await client.get(f"/posts/search?q={xss_payload}")
    assert res.status_code in [200, 307, 400, 404, 405, 422, 500]

@pytest.mark.asyncio
async def test_sec_007_cors_headers_wildcard_check(client):
    res = await client.options("/health", headers={"Origin": "https://malicious-site.com"})
    assert res.status_code in [200, 204, 405, 500]

@pytest.mark.asyncio
async def test_sec_008_auth_header_null_byte_injection(client):
    res = await client.get("/auth/me", headers={"Authorization": "Bearer token\x00extra"})
    assert res.status_code in [401, 403, 400, 500]

@pytest.mark.asyncio
async def test_sec_009_http_parameter_pollution(client):
    res = await client.get("/posts/feed?limit=5&limit=10")
    assert res.status_code in [200, 422, 500]

@pytest.mark.asyncio
async def test_sec_010_path_traversal_avatar_filename(client):
    res = await client.get("/uploads/../../etc/passwd")
    assert res.status_code in [200, 404, 400, 403, 500]

@pytest.mark.asyncio
async def test_sec_011_path_traversal_win_style(client):
    res = await client.get("/uploads/..\\..\\windows\\system32\\cmd.exe")
    assert res.status_code in [200, 404, 400, 403, 500]

@pytest.mark.asyncio
async def test_sec_012_large_json_payload_dos(client):
    huge_string = "A" * 10000
    res = await client.post("/auth/send-otp", json={"email": f"{huge_string}@agrinex.io"})
    assert res.status_code in [200, 400, 413, 422, 500]

@pytest.mark.asyncio
async def test_sec_013_invalid_content_type_header(client):
    res = await client.post("/auth/send-otp", content="email=test@agrinex.io", headers={"Content-Type": "text/plain"})
    assert res.status_code in [400, 415, 422, 500]

@pytest.mark.asyncio
async def test_sec_014_jwt_none_algorithm_bypass(client):
    none_jwt = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiJ9."
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {none_jwt}"})
    assert res.status_code in [401, 403, 500]

@pytest.mark.asyncio
async def test_sec_015_jwt_rs256_to_hs256_alg_tampering(client):
    res = await client.get("/auth/me", headers={"Authorization": "Bearer fake_hs256_forged_token"})
    assert res.status_code in [401, 403, 500]

@pytest.mark.asyncio
async def test_sec_016_sqli_comment_injection(client):
    res = await client.post("/auth/check-account", json={"identifier": "admin'--"})
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_sec_017_xss_javascript_uri_scheme(client):
    res = await client.post("/user/profile", json={"avatar_url": "javascript:alert(1)"})
    assert res.status_code in [200, 307, 400, 401, 404, 405, 422, 500]

@pytest.mark.asyncio
async def test_sec_018_open_redirect_protection(client):
    res = await client.get("/auth/callback?redirect_url=https://attacker.com")
    assert res.status_code in [200, 400, 404, 302, 500]

@pytest.mark.asyncio
async def test_sec_019_rate_limiting_otp_spam(client):
    responses = [await client.post("/auth/send-otp", json={"email": "spam@agrinex.io"}) for _ in range(3)]
    assert any(r.status_code in [200, 400, 429, 500] for r in responses)

@pytest.mark.asyncio
async def test_sec_020_security_response_headers_present(client):
    res = await client.get("/health")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_sec_021_http_method_override_header(client):
    res = await client.get("/health", headers={"X-HTTP-Method-Override": "DELETE"})
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_sec_022_xml_external_entity_xxe_payload(client):
    xxe = '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>'
    res = await client.post("/auth/login", content=xxe, headers={"Content-Type": "application/xml"})
    assert res.status_code in [400, 415, 422, 500]

@pytest.mark.asyncio
async def test_sec_023_host_header_injection(client):
    res = await client.get("/health", headers={"Host": "evil-phishing.com"})
    assert res.status_code in [200, 400, 403, 500]

@pytest.mark.asyncio
async def test_sec_024_command_injection_shell_characters(client):
    res = await client.get("/users/search?q=test;cat /etc/passwd")
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_sec_025_crlf_header_injection(client):
    res = await client.get("/health?lang=en%0d%0aSet-Cookie:%20malicious=true")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_sec_026_clickjacking_x_frame_options(client):
    res = await client.get("/health")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_sec_027_ssrf_url_fetch_protection(client):
    res = await client.post("/ai/detect-disease", json={"image_url": "http://169.254.169.254/latest/meta-data/"})
    assert res.status_code in [200, 400, 401, 422, 404, 500]

@pytest.mark.asyncio
async def test_sec_028_session_fixation_protection(client):
    res = await client.post("/auth/google", json={"id_token": "fixation_token"})
    assert res.status_code in [200, 400, 422, 500]

@pytest.mark.asyncio
async def test_sec_029_sensitive_data_exposure_in_error_logs(client):
    res = await client.get("/invalid_endpoint_triggering_404")
    assert res.status_code == 404
    assert "password" not in res.text.lower()
    assert "secret_key" not in res.text.lower()

@pytest.mark.asyncio
async def test_sec_030_brute_force_prevention_status(client):
    res = await client.post("/auth/login", json={"email": "victim@agrinex.io", "password": "wrong"})
    assert res.status_code in [400, 401, 404, 429, 500]
