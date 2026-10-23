import os
import json
import logging
import asyncio
import httpx
from typing import AsyncGenerator, Dict, Any, List

logger = logging.getLogger("uvicorn.error")

# Groq API Configuration — GPT OSS 120B via Groq Cloud
GROQ_API_KEY = os.getenv("groq_api_key") or os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_URL = os.getenv("GROQ_API_URL", GROQ_URL)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

FALLBACK_BUSY_MESSAGE = "AGRIGPT is temporarily unavailable because the Llama model service is offline."

AGRI_SYSTEM_PROMPT = """You are AgriGPT, an expert 
agricultural AI advisor for AgriNex platform.
Help farmers with crop diseases, fertilizers,
irrigation, soil health, pest control, organic farming,
weather-based advice, and market insights.
Be practical, concise, and farmer-friendly.
Reply in the same language the farmer uses.
Support: English, Tamil, Telugu, Hindi, Malayalam."""

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


async def stream_agri_response(
    message: str,
    history: list = []
) -> AsyncGenerator[str, None]:
    api_key = os.getenv("groq_api_key") or os.getenv("GROQ_API_KEY", GROQ_API_KEY)
    if not api_key:
        yield "data: AgriGPT service is not configured.\n\n"
        return

    messages = [{"role": "system", "content": AGRI_SYSTEM_PROMPT}]

    for h in history[-6:]:
        if isinstance(h, dict) and h.get("role") and h.get("content"):
            messages.append(h)

    messages.append({"role": "user", "content": message})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream(
                "POST",
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "stream": True,
                    "temperature": 0.7,
                    "max_tokens": 1024
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            chunk = json.loads(data)
                            token = chunk["choices"][0]["delta"].get("content", "")
                            if token:
                                yield f"data: {token}\n\n"
                        except Exception:
                            continue
    except Exception as e:
        logger.error(f"[AgriGPT Groq Error] {e}")
        yield "data: AgriGPT is temporarily unavailable. Please try again.\n\n"
        yield "data: [DONE]\n\n"


def build_messages(message: str, history: list = [], scan_context: str = "") -> List[Dict[str, str]]:
    """
    Constructs message payloads for Groq chat completions.
    Combines system prompt with optional scan history and conversational context.
    """
    system_text = SYSTEM_PROMPT
    if scan_context:
        system_text += f"\n\nContext (User's Recent Crop Scans):\n{scan_context}"

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_text}
    ]

    for msg in history[-8:]:
        is_ai = getattr(msg, "is_ai", False) if hasattr(msg, "is_ai") else (msg.get("is_ai") if isinstance(msg, dict) else False)
        content = getattr(msg, "message", str(msg)) if hasattr(msg, "message") else (msg.get("message", str(msg)) if isinstance(msg, dict) else str(msg))
        role = "assistant" if is_ai else "user"
        messages.append({"role": role, "content": str(content)})

    messages.append({"role": "user", "content": message})
    return messages


class AgriGPTService:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = GROQ_MODEL
        self.api_url = GROQ_API_URL
        logger.info(f"[AgriGPT] Initialized with Groq Llama model: {self.model}")

    def _get_api_key(self) -> str:
        return os.getenv("groq_api_key") or os.getenv("GROQ_API_KEY", self.api_key)

    async def check_llama_health(self) -> bool:
        """
        Health check to verify Groq API key is configured.
        """
        api_key = self._get_api_key()
        return bool(api_key and api_key.strip())

    async def stream_chat(
        self,
        message: str,
        history: list = [],
        scan_context: str = ""
    ) -> AsyncGenerator[str, None]:
        """
        Streams response tokens from Groq API (Llama 3.3 70B) using SSE stream=true.
        """
        api_key = self._get_api_key()
        if not api_key:
            logger.warning("[AgriGPT Stream] GROQ_API_KEY not configured in environment.")
            yield FALLBACK_BUSY_MESSAGE
            return

        messages = build_messages(message, history, scan_context)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.5,
            "max_tokens": 1500,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
                async with client.stream("POST", self.api_url, json=payload, headers=headers) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if not line:
                                continue
                            line_str = line.strip()
                            if not line_str.startswith("data:"):
                                continue

                            data_str = line_str[5:].strip()
                            if data_str == "[DONE]":
                                break

                            try:
                                data_json = json.loads(data_str)
                                choices = data_json.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    token = delta.get("content", "")
                                    if token:
                                        yield token
                            except json.JSONDecodeError:
                                continue
                        return
                    else:
                        error_body = await response.aread()
                        logger.error(
                            f"[AgriGPT Stream] Groq API returned HTTP {response.status_code}: "
                            f"{error_body.decode('utf-8', errors='ignore')}"
                        )
        except (httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError) as net_err:
            logger.warning(f"[AgriGPT Stream] Groq network error: {net_err}")
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
        Non-streaming chat via Groq API (stream=false).
        """
        api_key = self._get_api_key()
        if not api_key:
            logger.warning("[AgriGPT Non-Stream] GROQ_API_KEY not configured in environment.")
            return FALLBACK_BUSY_MESSAGE

        messages = build_messages(message, history, scan_context)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.5,
            "max_tokens": 1500,
            "stream": False,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return content
                    return FALLBACK_BUSY_MESSAGE
                else:
                    logger.error(f"[AgriGPT Non-Stream] Groq HTTP {response.status_code}: {response.text}")
        except (httpx.ConnectError, httpx.TimeoutException, asyncio.TimeoutError) as net_err:
            logger.warning(f"[AgriGPT Non-Stream] Groq network error: {net_err}")
        except Exception as e:
            logger.error(f"[AgriGPT Non-Stream] Unexpected error: {e}")

        return FALLBACK_BUSY_MESSAGE


agri_gpt_service = AgriGPTService()
