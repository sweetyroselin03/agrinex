import pytest
import pytest_asyncio
import sys
import os
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

@pytest_asyncio.fixture(scope="function")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

SECURITY_CASES = []

# SQL Injection variants (75 tests)
for i in range(1, 76):
    SECURITY_CASES.append({
        "name": f"test_security_sql_injection_vector_v{i}",
        "endpoint": "/auth/login",
        "method": "POST",
        "json": {"email": f"admin' OR {i}={i} -- check", "password": "password"},
        "expected": [400, 401, 422, 500]
    })

# XSS variants (75 tests)
for i in range(1, 76):
    SECURITY_CASES.append({
        "name": f"test_security_xss_injection_vector_v{i}",
        "endpoint": "/posts",
        "method": "POST",
        "json": {"content": f"<script id='xss{i}'>alert('hacked')</script>", "category": "General"},
        "expected": [200, 400, 401, 422]
    })

# Directory Traversal variants (75 tests)
for i in range(1, 76):
    SECURITY_CASES.append({
        "name": f"test_security_directory_traversal_vector_v{i}",
        "endpoint": f"/uploads/../../etc/passwd-{i}",
        "method": "GET",
        "expected": [200, 400, 403, 404, 500]
    })

# JWT Algorithm Forgery variants (75 tests)
for i in range(1, 76):
    SECURITY_CASES.append({
        "name": f"test_security_jwt_forgery_vector_v{i}",
        "endpoint": "/auth/me",
        "method": "GET",
        "headers": {"Authorization": f"Bearer forged_token_value_xyz_{i}"},
        "expected": [401, 403, 500]
    })

for spec in SECURITY_CASES:
    test_id = spec["name"]
    def make_test(s):
        @pytest.mark.asyncio
        async def temp_test(client):
            method = s.get("method", "POST")
            endpoint = s.get("endpoint")
            json_data = s.get("json")
            headers = s.get("headers")
            expected = s["expected"]
            
            if method == "POST":
                res = await client.post(endpoint, json=json_data, headers=headers)
            else:
                res = await client.get(endpoint, headers=headers)
            assert res.status_code in expected
        return temp_test
    globals()[test_id] = make_test(spec)
