import asyncio
import sys
import os
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.main import app

async def main():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get token
        google_payload = {
            "id_token": "mock_token",
            "profile": {
                "email": "test@agrinex.io",
                "name": "Test User"
            }
        }
        res = await client.post("/auth/google", json=google_payload)
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        payload = {"image_url": "https://agrinex.io/uploads/leaf.jpg"}
        res2 = await client.post("/ai/detect-disease", json=payload, headers=headers)
        print("Status code:", res2.status_code)
        print("Response body:", res2.text)

if __name__ == "__main__":
    asyncio.run(main())
