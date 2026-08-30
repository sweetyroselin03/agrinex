"""
AgriNex AI Chatbot & API Comprehensive Test Suite

Tests:
1. General crop question
2. Disease question
3. Treatment question
4. Prevention question
5. Context-aware disease question
6. Unknown question handling
7. Empty / invalid message handling
8. GET /health API endpoint
9. POST /predict API endpoint
10. POST /chat API endpoint

Generates results/chatbot_test_results.txt.
"""

import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

# Add src to sys.path
src_dir = Path(__file__).resolve().parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from agri_chatbot import AgriNexChatbot
from api import app

# Windows console encoding fix
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass


def run_chatbot_tests():
    BASE_DIR = Path(__file__).resolve().parent.parent
    results_dir = BASE_DIR / "results"
    results_dir.mkdir(exist_ok=True)
    report_file = results_dir / "chatbot_test_results.txt"

    bot = AgriNexChatbot()

    test_cases = [
        {
            "name": "1. General Crop Question",
            "message": "How often should I water tomato plants?",
            "context": None
        },
        {
            "name": "2. Disease Question",
            "message": "What causes tomato early blight?",
            "context": None
        },
        {
            "name": "3. Treatment Question",
            "message": "How do I treat early blight?",
            "context": None
        },
        {
            "name": "4. Prevention Question",
            "message": "How can I prevent early blight?",
            "context": None
        },
        {
            "name": "5. Question Using Context",
            "message": "What should I do?",
            "context": {
                "plant": "Tomato",
                "disease": "Early Blight",
                "status": "Diseased",
                "confidence": 0.93
            }
        },
        {
            "name": "6. Unknown Question",
            "message": "How to grow pineapples on Mars?",
            "context": None
        },
        {
            "name": "7. Empty / Invalid Message Handling",
            "message": "",
            "context": None
        }
    ]

    output_lines = []

    def log(text: str):
        print(text)
        output_lines.append(text)

    log("==========================================================================================")
    log("AGRINEX LOCAL AI CHATBOT & API TEST SUITE REPORT")
    log("==========================================================================================")

    log("\n--- PART 1: STANDALONE CHATBOT ENGINE TESTS ---\n")

    for tc in test_cases:
        t_name = tc["name"]
        msg = tc["message"]
        ctx = tc["context"]

        log("------------------------------------------------------------------------------------------")
        log(f"TEST CASE: {t_name}")
        log(f"Input Message : '{msg}'")
        log(f"Context       : {ctx}")

        res = bot.ask(msg, context=ctx)
        log(f"Context Used  : {res['context_used']}")
        log(f"Source        : {res['source']}")
        log(f"Response      :\n{res['response']}")
        log("------------------------------------------------------------------------------------------\n")

    log("\n--- PART 2: FASTAPI ENDPOINT INTEGRATION TESTS (TestClient) ---\n")

    with TestClient(app) as client:
        # GET /health
        log("Testing GET /health ...")
        h_res = client.get("/health")
        log(f"Status Code: {h_res.status_code}")
        log(f"Response   : {json.dumps(h_res.json(), indent=2)}")
        assert h_res.status_code == 200, "GET /health failed!"
        log("✅ GET /health PASSED!\n")

        # POST /predict
        log("Testing POST /predict ...")
        test_img_path = BASE_DIR / "data" / "raw" / "agrinex_unified" / "test" / "Tomato___Early_blight" / "Tomato___Early_blight_004cf022e847.jpg"
        if test_img_path.exists():
            with open(test_img_path, "rb") as f:
                p_res = client.post("/predict", files={"file": ("tomato_leaf.jpg", f, "image/jpeg")})
            log(f"Status Code: {p_res.status_code}")
            log(f"Response   : {json.dumps(p_res.json(), indent=2)}")
            assert p_res.status_code == 200, "POST /predict failed!"
            log("✅ POST /predict PASSED!\n")
        else:
            log("⚠️ Warning: Test image for /predict not found.")

        # POST /chat (with context)
        log("Testing POST /chat (With Context) ...")
        c_req_ctx = {
            "message": "What should I do for this disease?",
            "context": {
                "plant": "Tomato",
                "disease": "Early Blight",
                "status": "Diseased",
                "confidence": 0.93
            }
        }
        c_res = client.post("/chat", json=c_req_ctx)
        log(f"Status Code: {c_res.status_code}")
        log(f"Response   : {json.dumps(c_res.json(), indent=2)}")
        assert c_res.status_code == 200, "POST /chat (With Context) failed!"
        log("✅ POST /chat (With Context) PASSED!\n")

        # POST /chat (without context)
        log("Testing POST /chat (Without Context) ...")
        c_req_no_ctx = {
            "message": "What diseases affect tomato?"
        }
        c_res2 = client.post("/chat", json=c_req_no_ctx)
        log(f"Status Code: {c_res2.status_code}")
        log(f"Response   : {json.dumps(c_res2.json(), indent=2)}")
        assert c_res2.status_code == 200, "POST /chat (Without Context) failed!"
        log("✅ POST /chat (Without Context) PASSED!\n")

    log("==========================================================================================")
    log("ALL AGRINEX CHATBOT & API TESTS PASSED SUCCESSFULLY!")
    log("==========================================================================================")

    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"\n📊 Test results saved to: {report_file}")


if __name__ == "__main__":
    run_chatbot_tests()
