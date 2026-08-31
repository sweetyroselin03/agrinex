import os
import json
import logging
import socket
import urllib.request
import urllib.error
import asyncio
import httpx
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
    # AI Chat — Streaming & Non-Streaming Ollama /api/generate
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def stream_chat_response(self, message: str, history: list = [], scan_context: str = ""):
        """
        Streams response tokens from Ollama /api/generate with stream=true.
        Yields individual token strings.
        Handles timeout (180s), connection failures, and error messages cleanly.
        """
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

        url = f"{self.ollama_base_url}/api/generate"
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=10.0)) as client:
                async with client.stream(
                    "POST",
                    url,
                    json=payload,
                    headers={"cfNoInterrupt": "1", "Content-Type": "application/json"}
                ) as response:
                    if response.status_code != 200:
                        yield "AGRIGPT is temporarily unavailable because the Llama model service is offline."
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            token = data.get("response", "")
                            if token:
                                yield token
                            if data.get("done", False):
                                break
                        except Exception:
                            continue

        except httpx.ConnectError as ce:
            logger.error(f"[AgriNex AI Stream Error] Connection failure: {ce}")
            yield "AGRIGPT is temporarily unavailable because the Llama model service is offline."
        except (httpx.TimeoutException, asyncio.TimeoutError):
            logger.error("[AgriNex AI Stream Error] Request timed out after 180s")
            yield "AGRIGPT is taking longer than expected to respond. Please try again."
        except Exception as e:
            err_str = str(e).lower()
            if "timeout" in err_str or "timed out" in err_str:
                logger.error(f"[AgriNex AI Stream Error] Timeout: {e}")
                yield "AGRIGPT is taking longer than expected to respond. Please try again."
            else:
                logger.error(f"[AgriNex AI Stream Error] Exception: {e}")
                yield "AGRIGPT is temporarily unavailable because the Llama model service is offline."

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
                timeout=180.0
            )
            return response_text

        except (asyncio.TimeoutError, TimeoutError):
            logger.error("[AgriNex AI Error] Ollama /api/generate timed out after 180s")
            return "AGRIGPT is taking longer than expected to respond. Please try again."
        except ConnectionError as ce:
            logger.error(f"[AgriNex AI Error] Ollama connection failure: {ce}")
            return "AGRIGPT is temporarily unavailable because the Llama model service is offline."
        except Exception as e:
            err_str = str(e).lower()
            if "timeout" in err_str or "timed out" in err_str:
                logger.error(f"[AgriNex AI Error] Ollama generation timeout: {e}")
                return "AGRIGPT is taking longer than expected to respond. Please try again."
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
            with urllib.request.urlopen(req, timeout=175) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if "response" in result:
                    return result["response"].strip()
                else:
                    raise ValueError(f"Unexpected Ollama /api/generate response: {result}")
        except socket.timeout:
            raise TimeoutError("Ollama HTTP request timed out after 175 seconds")
        except urllib.error.URLError as url_err:
            if isinstance(url_err.reason, socket.timeout) or "timed out" in str(url_err).lower():
                raise TimeoutError("Ollama HTTP request timed out after 175 seconds")
            raise ConnectionError(f"Could not reach Ollama at {url}: {url_err}")


ai_service = AIService()
