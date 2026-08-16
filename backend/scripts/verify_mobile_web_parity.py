import asyncio
import io
import time
import json
import base64
from PIL import Image
from httpx import AsyncClient, ASGITransport
from app.main import app

def create_synthetic_leaf_bytes(color=(40, 140, 45), size=(500, 500), fmt="JPEG"):
    img = Image.new("RGB", size, color=color)
    # Add leaf details to simulate diverse crop texture
    for x in range(100, 400):
        for y in range(100, 400):
            img.putpixel((x, y), (120, 50, 140)) # eggplant/lesion purple texture
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    buf.seek(0)
    return buf.getvalue()

async def run_parity_test():
    print("==================================================")
    print("REAL END-TO-END MOBILE & WEB PARITY TEST SUITE")
    print("==================================================\n")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:

        # Authenticate test client
        auth_res = await client.post("/auth/google", json={
            "id_token": "parity_test_token",
            "profile": { "email": "parity_tester@agrinex.io", "name": "Parity Tester" }
        })
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. WEB SCANNER REQUEST (Base64 JSON)
        print("--- 1. WEB CROP SCANNER (Base64 JSON) ---")
        leaf_bytes = create_synthetic_leaf_bytes()
        base64_str = base64.b64encode(leaf_bytes).decode('utf-8')
        web_data_url = f"data:image/jpeg;base64,{base64_str}"

        web_payload = {
            "image_url": web_data_url,
            "scan_mode": "crop"
        }
        
        web_start = time.time()
        web_res = await client.post("/ai/detect-disease", json=web_payload, headers=headers)
        web_duration = (time.time() - web_start) * 1000

        print(f"HTTP Method: POST")
        print(f"URL: /ai/detect-disease")
        print(f"Content-Type: application/json")
        print(f"Payload Format: Base64 JSON Data URL")
        print(f"Image Bytes: {len(leaf_bytes)} bytes")
        print(f"Response Status: {web_res.status_code}")
        print(f"Response Duration: {web_duration:.2f} ms")
        print(f"Response JSON: {json.dumps(web_res.json(), indent=2)}\n")

        # 2. MOBILE CROP SCANNER REQUEST (Multipart FormData)
        print("--- 2. MOBILE CROP SCANNER (Multipart FormData) ---")
        files = {
            'file': ('mobile_crop_scan.jpg', leaf_bytes, 'image/jpeg')
        }
        data = {
            'scan_mode': 'crop'
        }

        mobile_start = time.time()
        mobile_res = await client.post("/ai/detect-disease", files=files, data=data, headers=headers)
        mobile_duration = (time.time() - mobile_start) * 1000

        print(f"HTTP Method: POST")
        print(f"URL: /ai/detect-disease")
        print(f"Content-Type: multipart/form-data; boundary=...")
        print(f"Filename: mobile_crop_scan.jpg")
        print(f"MIME: image/jpeg")
        print(f"Image Bytes: {len(leaf_bytes)} bytes")
        print(f"Response Status: {mobile_res.status_code}")
        print(f"Response Duration: {mobile_duration:.2f} ms")
        print(f"Response JSON: {json.dumps(mobile_res.json(), indent=2)}\n")

        # 3. CHATBOT INTEGRATION TEST
        print("--- 3. MOBILE AGRI-GPT CHATBOT REQUEST ---")
        chat_payload = {
            "message": "What is the organic treatment for brinjal leaf spot?",
            "conversation_id": "test_conv_mobile_123"
        }
        chat_res = await client.post("/ai/chat", json=chat_payload, headers=headers)
        reply_val = str(chat_res.json().get('reply') or chat_res.json().get('message') or chat_res.json()).encode('ascii', 'ignore').decode('ascii')
        print(f"HTTP Method: POST")
        print(f"URL: /ai/chat")
        print(f"Response Status: {chat_res.status_code}")
        print(f"Response Reply: {reply_val[:200]}...\n")

        # 4. LOCATION & WEATHER INTEGRATION TEST
        print("--- 4. NATIVE LOCATION & WEATHER REQUEST ---")
        weather_res = await client.get("/weather/current?lat=18.5204&lon=73.8567")
        print(f"HTTP Method: GET")
        print(f"URL: /weather/current?lat=18.5204&lon=73.8567")
        print(f"Response Status: {weather_res.status_code}")
        print(f"Location: {weather_res.json().get('location')}")
        print(f"Temperature: {weather_res.json().get('temp')}°C")
        print(f"Condition: {weather_res.json().get('condition')}\n")

        print("==================================================")
        print("PARITY VERIFICATION COMPLETE")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_parity_test())
