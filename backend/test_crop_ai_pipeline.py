import sys
from pathlib import Path
from PIL import Image

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.pytorch_vision_engine import vision_engine
from app.ai_service import ai_service
from app.main import app
from fastapi.testclient import TestClient

print("\n" + "=" * 70)
print("AGRINEX AI PIPELINE VALIDATION TEST")
print("=" * 70)

# 1. PyTorch Model Initialization
print("\n[1/5] Validating PyTorch ResNet18 V2-B Model Initialization...")
vision_engine.load_model()
info = vision_engine.get_model_info()
print(f"  Model       : {info['model']}")
print(f"  Provider    : {info['provider']}")
print(f"  Classes     : {info['classes']}")
print(f"  Status      : {info['status']}")

assert info["model"] == "ResNet18 V2-B"
assert info["classes"] == 60
assert info["status"] == "loaded"
print("  [OK] PyTorch Model Initialization Passed")

# 2. Local PyTorch Disease Inference
print("\n[2/5] Testing Local PyTorch Disease Inference (CPU)...")
test_img = Image.new("RGB", (224, 224), color=(40, 160, 40))
res = vision_engine.predict(test_img)
print(f"  Predicted Disease : {res['disease_name']}")
print(f"  Confidence Score  : {res['confidence']}%")
print(f"  Severity Level    : {res['severity_level']}")
assert res["confidence"] > 0
assert res["provider"] == "custom_ml"
print("  [OK] PyTorch Disease Inference Passed")

# 3. /ai/model-info Endpoint
print("\n[3/5] Testing GET /ai/model-info...")
client = TestClient(app)
response = client.get("/ai/model-info")
assert response.status_code == 200
data = response.json()
print(f"  - Scanner        : {data['disease_scanner']}")
print(f"  - Chat           : {data['ai_chat']}")
print(f"  - Gemini         : {data['gemini']}")
print(f"  - Groq           : {data['groq']}")

assert data["disease_scanner"]["provider"] == "custom_ml"
assert data["disease_scanner"]["model"] == "ResNet18 V2-B"
assert data["disease_scanner"]["classes"] == 60
assert data["disease_scanner"]["status"] == "loaded"
assert data["ai_chat"]["provider"] == "ollama"
assert data["ai_chat"]["model"] == "llama3"
assert data["ai_chat"]["status"] == "configured"
assert "/api/generate" in data["ai_chat"]["api_endpoint"]
assert data["gemini"]["status"] == "removed"
assert data["groq"]["status"] == "removed"
print("  [OK] /ai/model-info Verification Passed")

# 4. Gemini / Groq Isolation
print("\n[4/5] Verifying Gemini & Groq Removal...")
assert not hasattr(ai_service.vision_engine, "genai")
assert hasattr(ai_service, "ollama_model")
assert ai_service.ollama_model == "llama3"
# Confirm /api/generate is used (not /api/chat)
import inspect
src = inspect.getsource(ai_service._query_ollama_generate)
assert "/api/generate" in src, "Should use /api/generate endpoint"
assert "cfNoInterrupt" in src, "Should include cfNoInterrupt header for Cloudflare tunnels"
print("  [OK] Uses /api/generate — Cloudflare-compatible")
print("  [OK] No Gemini or Groq dependencies")

# 5. Ollama Offline Fallback
print("\n[5/5] Testing Ollama Offline Fallback Response...")
import asyncio
original_url = ai_service.ollama_base_url
ai_service.ollama_base_url = "http://127.0.0.1:59998"
fallback = asyncio.run(ai_service.get_chat_response("test"))
assert fallback == "AGRIGPT is temporarily unavailable because the Llama model service is offline."
ai_service.ollama_base_url = original_url
print("  [OK] Offline fallback returns exact required error string")

print("\n" + "=" * 70)
print("ALL AGRINEX AI PIPELINE TESTS PASSED 100% SUCCESSFULLY!")
print("=" * 70 + "\n")
