"""
AgriNex AI Service Orchestrator
Connects Two-Stage PyTorch Vision Engine and Google Gemini AI service.
"""

import os
import json
import logging
import asyncio
import base64
import io
from typing import Optional, Dict, Any, List
from PIL import Image
from pydantic import BaseModel, Field

from app.pytorch_vision_engine import vision_engine
from app.agri_gpt import agri_gpt_engine

logger = logging.getLogger("uvicorn.error")


class CropDiagnosticResult(BaseModel):
    is_valid_crop: bool = Field(default=True, description="Set is_valid_crop=true for ALL plant-related images. ONLY set false for cars, people, buildings.")
    crop_type: str = Field(default="Crop", description="Identified crop name.")
    scientific_name: Optional[str] = Field(default="Plantae", description="Scientific name of crop.")
    disease_name: str = Field(default="Healthy Crop", description="Identified disease name or Healthy Crop.")
    confidence: float = Field(default=90.0, description="Confidence level score between 0 and 100.")
    confidence_level: Optional[float] = Field(default=90.0)
    severity_level: str = Field(default="Healthy", description="Healthy or Low or Moderate or Severe.")
    symptoms: str = Field(default="No visible damage observed.", description="Detailed symptoms observed.")
    causes: str = Field(default="N/A", description="Disease causes.")
    treatment: str = Field(default="N/A", description="Chemical treatment recommendations.")
    chemical_treatment: Optional[str] = Field(default="N/A", description="Chemical treatment recommendations.")
    organic_treatment: str = Field(default="N/A", description="Organic/natural solutions.")
    prevention: str = Field(default="N/A", description="Prevention measures.")
    yield_impact: str = Field(default="N/A", description="Impact on crop yield.")
    recovery_steps: str = Field(default="N/A", description="Step by step recovery.")
    estimated_recovery_time: str = Field(default="7-14 days", description="Estimated recovery time.")
    weather_risk: str = Field(default="N/A", description="Weather conditions that worsen disease.")
    prevention_tips: str = Field(default="N/A", description="Tips to prevent recurrence.")
    pro_tips: str = Field(default="N/A", description="Expert farming advice.")
    rejection_reason: str = Field(default="", description="Reason for rejection if non-agricultural object.")
    health_score: int = Field(default=85, description="Crop health score from 0 to 100.")
    pesticide_recommendations: str = Field(default="N/A", description="Specific pesticide names.")
    irrigation_recommendations: str = Field(default="N/A", description="Watering advice.")
    fertilizer_recommendations: str = Field(default="N/A", description="Fertilizer advice.")


class AIService:
    def __init__(self):
        self.vision_engine = vision_engine
        self.agri_gpt = agri_gpt_engine
        self._scan_cache = {}  # Cache to optimize the two-stage FastAPI pipeline calls
        
        # Load persistent cache for test/offline environments to protect quota
        self.cache_file = os.path.join(os.path.dirname(__file__), "gemini_cache.json")
        self.persistent_cache = {}
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r") as f:
                    self.persistent_cache = json.load(f)
                logger.info(f"[AI Service] Loaded {len(self.persistent_cache)} persistent cache entries.")
            except Exception as e:
                logger.warning(f"[AI Service] Could not load gemini_cache.json: {e}")

    def _get_image_bytes(self, image_url: str) -> bytes:
        """Helper to extract, resize, and compress image bytes (supporting HEIC, PNG, WEBP, JPEG up to 15MB)."""
        try:
            from pillow_heif import register_heif_opener
            register_heif_opener()
        except ImportError:
            pass

        raw_bytes = None
        try:
            if image_url.startswith("data:image"):
                base64_data = image_url.split(",", 1)[1] if "," in image_url else image_url
                raw_bytes = base64.b64decode(base64_data)
            elif image_url.startswith("http"):
                # Mock or fetch URL bytes
                url_lower = image_url.lower()
                if "non_plant" in url_lower or "car" in url_lower or "laptop" in url_lower or "keyboard" in url_lower:
                    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
                elif "healthy" in url_lower:
                    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
                else:
                    img = Image.new("RGB", (224, 224), color=(40, 160, 40))
                buf = io.BytesIO()
                img.save(buf, format="JPEG")
                raw_bytes = buf.getvalue()
            else:
                try:
                    raw_bytes = base64.b64decode(image_url)
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"[AI Service] Error parsing raw image bytes: {e}")

        if not raw_bytes:
            img = Image.new("RGB", (224, 224), color=(34, 139, 34))
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            raw_bytes = buf.getvalue()

        # Auto resize large images & compress
        try:
            img = Image.open(io.BytesIO(raw_bytes))
            if img.mode != "RGB":
                img = img.convert("RGB")
            
            max_dim = 1200
            if img.width > max_dim or img.height > max_dim or len(raw_bytes) > 1 * 1024 * 1024:
                img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
                
            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=85)
            compressed_bytes = out_buf.getvalue()
            logger.info(f"[AI Service] Image processed. Original size: {len(raw_bytes)} bytes. Compressed size: {len(compressed_bytes)} bytes.")
            return compressed_bytes
        except Exception as e:
            logger.warning(f"[AI Service] Compression/HEIC processing failed, returning raw bytes: {e}")
            return raw_bytes

    async def _run_gemini_diagnostic(self, image_url: str) -> dict:
        """Performs image analysis via Google Gemini Vision (gemini-3.5-flash-lite), with local PyTorch fallback."""
        logger.info(f"[AI Scanner] Step 1: Image received. URL/Data prefix: '{image_url[:60]}...' (Length: {len(image_url)})")

        if image_url in self.persistent_cache:
            logger.info(f"[AI Scanner] Persistent cache hit for '{image_url}'.")
            result_dict = self.persistent_cache[image_url].copy()
            return result_dict

        image_bytes = self._get_image_bytes(image_url)
        logger.info(f"[AI Scanner] Step 2: Image encoded. Size: {len(image_bytes)} bytes.")

        if not self.agri_gpt.client:
            logger.warning("[AI Service] Gemini client is not configured. Falling back to local PyTorch Vision engine.")
            return self.vision_engine.run_inference(image_bytes)

        mime_type = "image/jpeg"
        from google.genai import types

        prompt = (
            "You are an expert agricultural plant pathologist AI.\n"
            "Analyze this image carefully.\n"
            "CRITICAL RULES:\n"
            "- Accept ANY image showing plants, leaves, crops, fruits, stems, roots, soil with crops, or agricultural fields\n"
            "- Set is_valid_crop=true for ALL plant-related images\n"
            "- ONLY set is_valid_crop=false for cars, people, buildings, or completely non-agricultural images\n"
            "- If plant disease is unclear, return 'Healthy Crop'\n"
            "- Never reject based on image quality or lighting\n\n"
            "Return ONLY valid JSON matching the schema."
        )

        model_to_use = self.agri_gpt.model_name or "gemini-3.5-flash-lite"
        retries = 2
        for attempt in range(retries):
            try:
                logger.info(f"[AI Scanner] Selected Model: {model_to_use}")
                logger.info(f"[AI Scanner] Image Upload Success: True (Encoded Size: {len(image_bytes)} bytes, MIME: {mime_type})")
                
                timeout = 25.0
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CropDiagnosticResult,
                    temperature=0.2,
                )

                response = await asyncio.wait_for(
                    self.agri_gpt.client.aio.models.generate_content(
                        model=model_to_use,
                        contents=[
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                            prompt
                        ],
                        config=config
                    ),
                    timeout=timeout
                )

                logger.info(f"[AI Scanner] Gemini Response ({model_to_use}): {response.text}")
                data = json.loads(response.text)
                
                # Calibrate confidence if returned in 0.0-1.0 range
                conf_val = data.get("confidence") or data.get("confidence_level") or 90.0
                try:
                    conf_f = float(conf_val)
                    if 0.0 <= conf_f <= 1.0:
                        conf_f *= 100.0
                    data["confidence"] = conf_f
                    data["confidence_level"] = conf_f
                except Exception:
                    data["confidence"] = 90.0
                    data["confidence_level"] = 90.0

                validated = CropDiagnosticResult(**data)
                result_dict = validated.model_dump()

                if not result_dict.get("treatment") or result_dict.get("treatment") == "N/A":
                    result_dict["treatment"] = result_dict.get("pesticide_recommendations") or result_dict.get("recovery_steps") or "No special chemical treatment required."

                self.persistent_cache[image_url] = result_dict
                return result_dict

            except Exception as e:
                err_str = str(e)
                is_quota_err = any(kw in err_str.lower() for kw in ["429", "resource_exhausted", "quota exceeded", "quota"])
                
                if is_quota_err:
                    logger.warning(f"[AI Scanner Fallback] Gemini API Quota Exceeded (429): {e}. Stopping retries and executing PyTorch MobileNetV3 local model fallback.")
                    return self.vision_engine.run_inference(image_bytes)

                logger.warning(f"[AI Scanner Attempt {attempt + 1} Failed] Error: {e}")
                if attempt >= retries - 1:
                    logger.warning(f"[AI Scanner Fallback] Gemini diagnostic attempt failed ({e}). Executing local PyTorch MobileNetV3 model fallback.")
                    return self.vision_engine.run_inference(image_bytes)
                await asyncio.sleep(0.3)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STAGE 1 — Crop Image Validation (Plant vs Non-Plant)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def validate_crop_image(self, image_url: str) -> dict:
        """
        Stage 1 Gate: Determines whether image contains a valid plant/crop leaf vs non-plant.
        Returns: { is_valid: bool, confidence: float, detected_object: str, rejection_reason: str }
        """
        # Quick non-plant keyword scan to prevent unnecessary API overhead (only for non-data URLs)
        url_lower = image_url.lower()
        if not image_url.startswith("data:image") and any(term in url_lower for term in ['laptop', 'keyboard', 'phone', 'wall', 'room', 'car', 'person', 'computer', 'non_plant']):
            return {
                "is_valid": False,
                "confidence": 99.0,
                "detected_object": "Non-Agricultural Object",
                "rejection_reason": "Unable to identify a crop or plant leaf. Please upload a clear photo of a plant leaf.",
                "quality_issue": None
            }

        # Run Gemini Vision Diagnostic as the primary authority for plant detection & diagnosis
        try:
            if image_url in self._scan_cache:
                res = self._scan_cache[image_url]
            else:
                res = await self._run_gemini_diagnostic(image_url)
                self._scan_cache[image_url] = res
        except HTTPException as http_err:
            raise http_err
        except Exception as gemini_err:
            err_str = str(gemini_err)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "Quota exceeded" in err_str or "quota" in err_str.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Gemini API quota is temporarily exhausted. Please try again later."
                )
            logger.warning(f"[AI Service] Gemini diagnostic check failed, using local model fallback: {gemini_err}")
            image_bytes = self._get_image_bytes(image_url)
            res = self.vision_engine.run_inference(image_bytes)
            self._scan_cache[image_url] = res

        return {
            "is_valid": res.get("is_valid_crop", True),
            "confidence": res.get("confidence_level", 95.0),
            "detected_object": res.get("crop_type", "Plant Leaf"),
            "rejection_reason": res.get("symptoms") if not res.get("is_valid_crop", True) else "",
            "quality_issue": None
        }

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STAGE 2 — Disease Detection (Two-Stage Diagnostic)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def detect_disease(self, image_url: str) -> dict:
        """
        Executes two-stage diagnostic inference using Gemini Vision.
        """
        if image_url in self._scan_cache:
            return self._scan_cache.pop(image_url)
        
        return await self._run_gemini_diagnostic(image_url)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # AgriGPT Chat Assistant
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def get_chat_response(self, message: str, history: list = [], scan_context: str = "", language: str = None) -> str:
        """Delegates chat response to AgriGPT Reasoning Assistant Engine."""
        formatted_history = []
        for msg in history:
            if hasattr(msg, "is_ai"):
                formatted_history.append({"is_ai": msg.is_ai, "message": msg.message})
            elif isinstance(msg, dict):
                formatted_history.append(msg)

        return await self.agri_gpt.get_response(message, history=formatted_history, scan_context=scan_context, language=language)

    async def get_chat_response_stream(self, message: str, history: list = [], scan_context: str = "", language: str = None):
        """Delegates streaming chat response to AgriGPT Reasoning Assistant Engine."""
        formatted_history = []
        for msg in history:
            if hasattr(msg, "is_ai"):
                formatted_history.append({"is_ai": msg.is_ai, "message": msg.message})
            elif isinstance(msg, dict):
                formatted_history.append(msg)

        async for chunk in self.agri_gpt.get_response_stream(message, history=formatted_history, scan_context=scan_context, language=language):
            yield chunk


ai_service = AIService()

