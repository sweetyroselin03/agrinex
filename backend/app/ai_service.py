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

        logger.info("[AgriNex ML] Scanner ready (Powered by trained PyTorch ResNet18 V2-B model - 60 classes)")
        logger.info(f"[AgriNex AI] Chat provider: Ollama (Model: {self.ollama_model}, Endpoint: {self.ollama_base_url})")

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # Disease Detection (CUSTOM TRAINED PYTORCH MODEL ONLY)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def detect_disease(self, image_input: str) -> Dict[str, Any]:
        """
        Runs plant disease detection using ONLY the trained PyTorch ML model.
        Does NOT send images to Gemini, Groq, OpenAI, or any external vision API.
        """
        try:
            result = await asyncio.to_thread(self.vision_engine.predict, image_input)
            return result
        except Exception as e:
            logger.error(f"[AgriNex ML Error] Disease inference failed: {e}")
            raise e

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # AI Chat / Agronomist (OLLAMA LLAMA3 ONLY)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def get_chat_response(self, message: str, history: list = [], scan_context: str = "") -> str:
        try:
            system_prompt = (
                "You are AgriNex AI, an expert agricultural advisory assistant. "
                "You provide detailed, practical, farmer-friendly advice on crop diseases, symptoms, treatments, "
                "prevention, fertilizers, irrigation, soil health, pests, organic farming, and yield optimization.\n\n"
                "Formatting Guidelines:\n"
                "- Structure responses cleanly using Markdown headers (#, ##, ###), bold text, and bullet points.\n"
                "- Provide actionable steps, specific product names/dosages, and timings when applicable.\n"
                "- Keep advice practical, warm, and clear for farmers.\n"
                "- If the user writes in Tamil, Telugu, Hindi, Malayalam, or English, respond fluently in that SAME language."
            )

            if scan_context:
                system_prompt += f"\n\nContext (User's recent crop scans):\n{scan_context}\nUse this context if relevant to the query."

            messages = [{"role": "system", "content": system_prompt}]

            for msg in history[-10:]:
                role = "assistant" if getattr(msg, "is_ai", False) else "user"
                msg_text = getattr(msg, "message", str(msg))
                messages.append({"role": role, "content": msg_text})

            messages.append({"role": "user", "content": message})

            # Call Ollama HTTP API in background threadpool
            response_text = await asyncio.wait_for(
                asyncio.to_thread(self._query_ollama, messages),
                timeout=30.0
            )
            return response_text

        except asyncio.TimeoutError:
            logger.error("[AgriNex AI Error] Ollama Llama request timed out after 30s")
            return "AGRIGPT is temporarily unavailable because the Llama model service is offline."
        except Exception as e:
            logger.error(f"[AgriNex AI Error] Ollama Llama Communication Failure: {e}")
            return "AGRIGPT is temporarily unavailable because the Llama model service is offline."

    def _query_ollama(self, messages: list) -> str:
        url = f"{self.ollama_base_url}/api/chat"
        payload = {
            "model": self.ollama_model,
            "messages": messages,
            "stream": False
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if "message" in result and "content" in result["message"]:
                    return result["message"]["content"]
                elif "response" in result:
                    return result["response"]
                else:
                    raise ValueError(f"Unexpected response structure from Ollama: {result}")
        except urllib.error.URLError as url_err:
            raise RuntimeError(f"Could not connect to Ollama at {url}: {url_err}")


ai_service = AIService()
