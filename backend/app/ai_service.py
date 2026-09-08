import os
import logging
import asyncio

from .pytorch_vision_engine import vision_engine
from .agri_gpt import agri_gpt_service, FALLBACK_BUSY_MESSAGE

logger = logging.getLogger("uvicorn.error")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class AIService:
    def __init__(self):
        self.vision_engine = vision_engine
        self.agri_gpt = agri_gpt_service
        self.ollama_base_url = OLLAMA_BASE_URL.rstrip("/")
        self.ollama_model = OLLAMA_MODEL

        logger.info("[AgriNex ML] Scanner ready (PyTorch ResNet18 V2-B, 60 classes)")
        logger.info(f"[AgriNex AI] Chat → Ollama Llama 3 ({self.ollama_model}) at {self.ollama_base_url}")

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Disease Detection — Custom PyTorch model ONLY
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def detect_disease(self, image_input) -> dict:
        """
        Runs plant disease detection using the trained PyTorch ML model.
        """
        try:
            result = await asyncio.to_thread(self.vision_engine.predict, image_input)
            return result
        except Exception as e:
            logger.error(f"[AgriNex ML Error] Disease inference failed: {e}")
            raise e

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Internal Ollama /api/generate helper (used by tests)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def _query_ollama_generate(self, prompt: str) -> str:
        """
        Direct Ollama /api/generate call (non-streaming).
        Uses cfNoInterrupt header for Cloudflare tunnel compatibility.
        """
        import httpx
        import json

        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False
        }
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                headers={"cfNoInterrupt": "1"}
            ) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", FALLBACK_BUSY_MESSAGE)
                else:
                    logger.error(f"[AgriNex AI] Ollama HTTP {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"[AgriNex AI] Ollama /api/generate error: {e}")

        return FALLBACK_BUSY_MESSAGE

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # AI Chat — Streaming via Ollama Llama 3
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def stream_chat_response(self, message: str, history: list = [], scan_context: str = ""):
        """
        Streams response tokens from Ollama Llama 3 via /api/generate.
        """
        try:
            async for token in self.agri_gpt.stream_chat(message, history, scan_context):
                yield token
        except Exception as e:
            logger.error(f"[AgriNex AI Stream Exception] {e}")
            yield FALLBACK_BUSY_MESSAGE

    async def get_chat_response(self, message: str, history: list = [], scan_context: str = "") -> str:
        """
        Generates non-streaming response from Ollama Llama 3 via /api/generate.
        """
        try:
            return await self.agri_gpt.get_chat_response(message, history, scan_context)
        except Exception as e:
            logger.error(f"[AgriNex AI Chat Exception] {e}")
            return FALLBACK_BUSY_MESSAGE


ai_service = AIService()
