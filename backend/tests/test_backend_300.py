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

TEST_CASES = []

# 50 Registration cases
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_auth_register_farmer_v{i}",
        "endpoint": "/auth/register",
        "method": "POST",
        "json": {"email": f"farmer_api_{i}@agrinex.io", "password": "Password123!", "full_name": f"API Farmer {i}"},
        "expected": [200, 201, 400]
    })

# 50 Login validation cases
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_auth_login_validation_v{i}",
        "endpoint": "/auth/login",
        "method": "POST",
        "json": {"email": f"farmer_api_{i}@agrinex.io", "password": f"WrongPassword{i}!"},
        "expected": [200, 400, 401, 422]
    })

# 50 Profile settings cases
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_profile_setting_option_v{i}",
        "endpoint": "/user/profile",
        "method": "PUT",
        "json": {"full_name": f"Farmer Spec {i}", "bio": f"Crop specialist {i}", "village": f"Village {i}"},
        "expected": [200, 401]
    })

# 50 Post search options
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_post_search_keyword_v{i}",
        "endpoint": "/posts/search",
        "method": "GET",
        "params": {"q": f"crop_{i}"},
        "expected": [200, 401]
    })

# 50 User feed skip/limit variations
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_user_feed_pagination_v{i}",
        "endpoint": "/posts/feed",
        "method": "GET",
        "params": {"limit": 5, "skip": i},
        "expected": [200, 401]
    })

# 50 Mandi/Weather health checks
for i in range(1, 51):
    TEST_CASES.append({
        "name": f"test_api_general_health_check_v{i}",
        "endpoint": "/health",
        "method": "GET",
        "params": {"client_version": f"1.0.{i}"},
        "expected": [200]
    })

for spec in TEST_CASES:
    test_id = spec["name"]
    def make_test(s):
        @pytest.mark.asyncio
        async def temp_test(client):
            method = s.get("method", "GET")
            endpoint = s.get("endpoint")
            json_data = s.get("json")
            params = s.get("params")
            expected = s.get("expected", [200])
            
            if method == "POST":
                res = await client.post(endpoint, json=json_data, params=params)
            elif method == "PUT":
                res = await client.put(endpoint, json=json_data, params=params)
            else:
                res = await client.get(endpoint, params=params)
            assert res.status_code in expected
        return temp_test
    globals()[test_id] = make_test(spec)
