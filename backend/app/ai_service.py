import os
import json
import logging
import urllib.request
import urllib.error
import asyncio
from pathlib import Path
from typing import Dict, Any, List

from .pytorch_vision_engine import vision_engine

logger = logging.getLogger("uvicorn.error")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class AIService:
    def __init__(self):
        self.vision_engine = vision_engine
        self.ollama_base_url = OLLAMA_BASE_URL.rstrip('/')
        self.ollama_model = OLLAMA_MODEL

        logger.info("[AgriNex ML] Scanner ready (PyTorch ResNet18 V2-B, 60 classes)")
        logger.info(f"[AgriNex AI] Chat → Ollama {self.ollama_model} @ {self.ollama_base_url}")

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Disease Detection — Custom PyTorch model ONLY
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def detect_disease(self, image_input: str) -> Dict[str, Any]:
        """
        Runs plant disease detection using the trained PyTorch ML model only.
        No external vision API is called.
        """
        try:
            result = await asyncio.to_thread(self.vision_engine.predict, image_input)
            return result
        except Exception as e:
            logger.error(f"[AgriNex ML Error] Disease inference failed: {e}")
            raise e

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # AI Chat — Ollama /api/generate ONLY
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def get_chat_response(self, message: str, history: list = [], scan_context: str = "") -> str:
        try:
            system_block = (
                "You are AgriNex AI, an expert agricultural advisory assistant. "
                "You provide detailed, practical, farmer-friendly advice on crop diseases, "
                "symptoms, treatments, prevention, fertilizers, irrigation, soil health, "
                "pests, organic farming, and yield optimization.\n\n"
                "Formatting Guidelines:\n"
                "- Structure responses using Markdown headers (#, ##, ###), bold text, and bullet points.\n"
                "- Provide actionable steps, specific product names/dosages, and timings when applicable.\n"
                "- Keep advice practical, warm, and clear for farmers.\n"
                "- Detect and respond in the user's language: English, Tamil, Telugu, Hindi, or Malayalam.\n"
            )

            if scan_context:
                system_block += f"\nContext (User's recent crop scans):\n{scan_context}\n"

            # Build conversation history as a plain-text prompt for /api/generate
            history_text = ""
            for msg in history[-10:]:
                role = "Assistant" if getattr(msg, "is_ai", False) else "User"
                msg_text = getattr(msg, "message", str(msg))
                history_text += f"{role}: {msg_text}\n"

            prompt = (
                f"SYSTEM:\n{system_block}\n"
                f"{history_text}"
                f"User: {message}\n"
                f"Assistant:"
            )

            # Call Ollama /api/generate in background threadpool (non-blocking)
            response_text = await asyncio.wait_for(
                asyncio.to_thread(self._query_ollama_generate, prompt),
                timeout=90.0
            )
            return response_text

        except asyncio.TimeoutError:
            logger.error("[AgriNex AI Error] Ollama /api/generate timed out after 90s")
            return "AGRIGPT is temporarily unavailable because the Llama model service is offline."
        except Exception as e:
            logger.error(f"[AgriNex AI Error] Ollama communication failure: {e}")
            return "AGRIGPT is temporarily unavailable because the Llama model service is offline."

    def _query_ollama_generate(self, prompt: str) -> str:
        """
        Calls POST {OLLAMA_BASE_URL}/api/generate with:
          { "model": "<OLLAMA_MODEL>", "prompt": "...", "stream": false }

        Adds cfNoInterrupt: 1 header so Cloudflare Quick Tunnels don't intercept the request.
        """
        url = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                # Required to pass Cloudflare interstitial pages on trycloudflare.com tunnels
                "cfNoInterrupt": "1",
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=85) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                # /api/generate returns: { "response": "...", ... }
                if "response" in result:
                    return result["response"].strip()
                else:
                    raise ValueError(f"Unexpected Ollama /api/generate response: {result}")
        except urllib.error.URLError as url_err:
            raise RuntimeError(f"Could not reach Ollama at {url}: {url_err}")


ai_service = AIService()
