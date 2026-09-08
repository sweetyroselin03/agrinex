import os
import json
import logging
import asyncio
import httpx
from typing import AsyncGenerator, Dict, Any, List

logger = logging.getLogger("uvicorn.error")

# Ollama Configuration — Llama 3 via local Ollama server
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

FALLBACK_BUSY_MESSAGE = "AGRIGPT is temporarily unavailable because the Llama model service is offline."

SYSTEM_PROMPT = (
    "You are AgriGPT, an expert AI agricultural and agronomy advisor for AgriNex. "
    "You provide practical, farmer-friendly, scientifically sound guidance on:\n"
    "- Crop disease diagnosis, symptoms, and pathology\n"
    "- Chemical treatments (precise dosage & fungicide/pesticide names)\n"
    "- Organic and natural farming remedies (neem oil, bio-control, compost)\n"
    "- Prevention strategies and crop rotation techniques\n"
    "- Fertilizer schedules (NPK ratios, micro-nutrients, biofertilizers)\n"
    "- Irrigation management, soil health, and weather impact\n"
    "- Yield optimization and market harvesting strategies\n\n"
    "Formatting Guidelines:\n"
    "- Structure your answers cleanly using Markdown headers (##, ###), bold highlights, and organized bullet points.\n"
    "- Provide clear step-by-step action plans with dosages and safety precautions.\n"
    "- Keep advice practical, warm, encouraging, and easy for farmers to execute.\n"
    "- Detect and respond in the user's preferred language: English, Tamil (தமிழ்), Telugu (తెలుగు), Hindi (हिन्दी), or Malayalam (മലയാളം).\n"
)


def build_prompt(message: str, history: list = [], scan_context: str = "") -> str:
    """
    Builds a plain-text prompt string for Ollama /api/generate.
    Prepends system instructions, optional scan context, and conversation history.
    """
    parts = [SYSTEM_PROMPT]

    if scan_context:
        parts.append(f"\nContext (User's Recent Crop Scans):\n{scan_context}\n")

    for msg in history[-8:]:
        is_ai = getattr(msg, "is_ai", False) if hasattr(msg, "is_ai") else (msg.get("is_ai") if isinstance(msg, dict) else False)
        content = getattr(msg, "message", str(msg)) if hasattr(msg, "message") else (msg.get("message", str(msg)) if isinstance(msg, dict) else str(msg))
        role = "AgriGPT" if is_ai else "User"
        parts.append(f"{role}: {content}")

    parts.append(f"User: {message}")
    parts.append("AgriGPT:")

    return "\n".join(parts)


class AgriGPTService:
    def __init__(self):
        self.ollama_base_url = OLLAMA_BASE_URL
        self.model = OLLAMA_MODEL
        logger.info(f"[AgriGPT] Initialized with Ollama Llama model: {self.model} at {self.ollama_base_url}")

    async def check_llama_health(self) -> bool:
        """
        Health check to verify Ollama service is reachable.
        """
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
                res = await client.get(f"{self.ollama_base_url}/api/tags")
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"[AgriGPT Health] Ollama health check failed: {e}")
            return False

    async def stream_chat(
        self,
        message: str,
        history: list = [],
        scan_context: str = ""
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens from Ollama Llama 3 via /api/generate (stream=true).
        Uses cfNoInterrupt header for Cloudflare tunnel compatibility.
        """
        prompt = build_prompt(message, history, scan_context)
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(90.0, connect=10.0),
                headers={"cfNoInterrupt": "1"}
            ) as client:
                async with client.stream(
                    "POST",
                    f"{self.ollama_base_url}/api/generate",
                    json=payload
                ) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            try:
                                data_json = json.loads(line)
                                token = data_json.get("response", "")
                                if token:
                                    yield token
                                if data_json.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
                        return
                    else:
                        error_body = await response.aread()
                        logger.error(
                            f"[AgriGPT Stream] Ollama returned HTTP {response.status_code}: "
                            f"{error_body.decode('utf-8', errors='ignore')}"
                        )

        except (httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError) as net_err:
            logger.warning(f"[AgriGPT Stream] Ollama network error: {net_err}")
        except Exception as e:
            logger.error(f"[AgriGPT Stream] Unexpected error: {e}")

        yield FALLBACK_BUSY_MESSAGE

    async def get_chat_response(
        self,
        message: str,
        history: list = [],
        scan_context: str = ""
    ) -> str:
        """
        Non-streaming chat via Ollama /api/generate (stream=false).
        Uses cfNoInterrupt header for Cloudflare tunnel compatibility.
        """
        prompt = build_prompt(message, history, scan_context)
        payload = {
            "model": self.model,
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
                    logger.error(
                        f"[AgriGPT Non-Stream] Ollama HTTP {response.status_code}: "
                        f"{response.text}"
                    )
        except (httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError) as net_err:
            logger.warning(f"[AgriGPT Non-Stream] Ollama network error: {net_err}")
        except Exception as e:
            logger.error(f"[AgriGPT Non-Stream] Unexpected error: {e}")

        return FALLBACK_BUSY_MESSAGE


agri_gpt_service = AgriGPTService()
