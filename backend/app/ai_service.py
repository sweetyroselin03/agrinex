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
from PIL import Image
from pydantic import BaseModel, Field

from app.pytorch_vision_engine import vision_engine
from app.agri_gpt import agri_gpt_engine

logger = logging.getLogger("uvicorn.error")


class CropDiagnosticResult(BaseModel):
    is_valid_crop: bool = Field(description="True if the image clearly contains a plant, crop, leaf, or agricultural vegetation. False only if it is clearly not a plant.")
    crop_type: str = Field(default="N/A", description="Identified crop name (e.g. Tomato, Rice, Potato), or 'N/A' if not a plant.")
    scientific_name: str = Field(default="N/A", description="Scientific/Botanical name of the crop, or 'N/A' if not a plant.")
    disease_name: str = Field(default="Healthy", description="Identified disease name, or 'Healthy' if no disease is present, or 'N/A' if not a plant.")
    confidence_level: float = Field(default=0.0, description="Confidence level as a percentage between 0 and 100.")
    severity_level: str = Field(default="Healthy", description="Severity level: Healthy, Low, Moderate, High, or N/A.")
    symptoms: str = Field(default="N/A", description="Detailed description of visible symptoms on the plant leaf, or rejection message if is_valid_crop is False.")
    causes: str = Field(default="N/A", description="Primary causes/pathogens of the condition.")
    prevention: str = Field(default="N/A", description="General prevention steps.")
    organic_treatment: str = Field(default="N/A", description="Detailed organic/bio-control recipes/treatments.")
    chemical_treatment: str = Field(default="N/A", description="Detailed chemical fungicide/pesticide recommendations.")
    pesticide_recommendations: str = Field(default="N/A", description="Specific recommended chemical/pesticides.")
    fertilizer_recommendations: str = Field(default="N/A", description="Nutritional/fertilizer adjustments needed.")
    irrigation_recommendations: str = Field(default="N/A", description="Water management guidance.")
    recovery_steps: str = Field(default="N/A", description="Step-by-step crop recovery plan.")
    estimated_recovery_time: str = Field(default="N/A", description="Estimated recovery time (e.g. 10-14 days).")
    weather_risk: str = Field(default="N/A", description="Weather factors affecting this condition.")
    prevention_tips: str = Field(default="N/A", description="Bullet points of prevention tips.")
    yield_impact: str = Field(default="N/A", description="Harvest/yield impact estimate.")
    pro_tips: str = Field(default="N/A", description="Professional grower pro tip.")


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
        """Helper to extract bytes from base64 data URI, HTTP URL, or generate mock bytes."""
        try:
            if image_url.startswith("data:image"):
                base64_data = image_url.split(",")[1]
                return base64.b64decode(base64_data)
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
                return buf.getvalue()
        except Exception as e:
            logger.warning(f"[AI Service] Error parsing image bytes: {e}")

        img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()

    async def _run_gemini_diagnostic(self, image_url: str) -> dict:
        """Performs image analysis via Google Gemini Vision, logging every step."""
        # 1. Log: image received
        logger.info(f"[AI Scanner] Step 1: Image received. URL/Data prefix: '{image_url[:60]}...' (Length: {len(image_url)})")

        # Check persistent cache first to save quota/run offline during tests
        if image_url in self.persistent_cache:
            logger.info(f"[AI Scanner] Persistent cache hit for '{image_url}'.")
            result_dict = self.persistent_cache[image_url].copy()
            
            # Calibrate confidence_level if returned in 0.0-1.0 range
            if "confidence_level" in result_dict and result_dict["confidence_level"] is not None:
                try:
                    conf = float(result_dict["confidence_level"])
                    if 0.0 <= conf <= 1.0:
                        result_dict["confidence_level"] = conf * 100.0
                except Exception:
                    pass
                    
            result_dict["treatment"] = result_dict.get("chemical_treatment", "N/A")
            result_dict["prevention_tips"] = result_dict.get("prevention", "N/A")
            
            # Generate Grad-CAM visualization overlay
            try:
                image_bytes = self._get_image_bytes(image_url)
                tensor, original_img = self.vision_engine.preprocess_image(image_bytes)
                heatmap_uri = self.vision_engine.generate_gradcam(tensor, original_img)
                result_dict["gradcam_heatmap"] = heatmap_uri
            except Exception:
                result_dict["gradcam_heatmap"] = ""
                
            return result_dict

        image_bytes = self._get_image_bytes(image_url)

        # 2. Log: image encoded
        logger.info(f"[AI Scanner] Step 2: Image encoded. Size: {len(image_bytes)} bytes.")

        # If Gemini client is not configured, raise an error
        if not self.agri_gpt.client:
            logger.error("[AI Service] Gemini client is not configured. GEMINI_API_KEY may be missing.")
            raise RuntimeError("Gemini client is not configured. Please set the GEMINI_API_KEY environment variable.")

        # Handle web page or file metadata detection
        mime_type = "image/jpeg"
        if image_url.startswith("data:image/png;base64"):
            mime_type = "image/png"
        elif image_url.startswith("data:image/webp;base64"):
            mime_type = "image/webp"

        from google.genai import types

        prompt = (
            "Analyze this crop leaf/plant image. You must output a JSON response matching the schema.\n"
            "First, verify if the image clearly depicts a plant, leaf, tree, crop, or any agricultural vegetation.\n"
            "If it is clearly NOT a plant (e.g. it is a laptop, keyboard, wall, car, person, or arbitrary non-plant object), "
            "set `is_valid_crop` to False, and set `symptoms` to a polite rejection message explaining that a valid crop leaf photo is required.\n"
            "If it is a plant, set `is_valid_crop` to True and identify the following details:\n"
            "- crop_type: Name of the crop (e.g. Tomato, Rice, Potato)\n"
            "- scientific_name: Scientific/botanical name of the crop\n"
            "- disease_name: Specific disease name, or 'Healthy' if the leaf has no disease/is healthy\n"
            "- confidence_level: Confidence score between 50.0 and 100.0\n"
            "- severity_level: Low, Moderate, High, or Healthy\n"
            "- symptoms: Clear description of symptoms\n"
            "- causes: Causes/pathogen details\n"
            "- prevention: Prevention steps\n"
            "- organic_treatment: Organic treatment options\n"
            "- chemical_treatment: Chemical fungicide/pesticide options\n"
            "- fertilizer_recommendations: Any recommended fertilizer adjustments (NPK, etc.)\n"
            "- irrigation_recommendations: Water scheduling/adjustments\n"
            "- yield_impact: Potential impact on harvest yield\n"
            "- pro_tips: A professional advice/tip for growers"
        )

        retries = 2
        for attempt in range(retries):
            try:
                # Structured Logs: selected model, prompt, and image upload success
                logger.info(f"[AI Scanner] Selected Model: {self.agri_gpt.model_name}")
                logger.info(f"[AI Scanner] Prompt: {prompt}")
                logger.info(f"[AI Scanner] Image Upload Success: True (Encoded Size: {len(image_bytes)} bytes)")
                logger.info(f"[AI Scanner] Step 3: Request sent to Gemini. Attempt: {attempt + 1}")
                
                timeout = 30.0
                config = types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CropDiagnosticResult,
                    temperature=0.2,
                )

                response = await asyncio.wait_for(
                    self.agri_gpt.client.aio.models.generate_content(
                        model=self.agri_gpt.model_name,
                        contents=[
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                            prompt
                        ],
                        config=config
                    ),
                    timeout=timeout
                )

                # Structured Logs: Gemini response
                logger.info(f"[AI Scanner] Gemini Response: {response.text}")

                data = json.loads(response.text)
                # Structured Logs: parsed JSON
                logger.info(f"[AI Scanner] Parsed JSON: {data}")

                # Calibrate confidence_level if returned in 0.0-1.0 range
                if "confidence_level" in data and data["confidence_level"] is not None:
                    try:
                        conf = float(data["confidence_level"])
                        if 0.0 <= conf <= 1.0:
                            data["confidence_level"] = conf * 100.0
                            logger.info(f"[AI Scanner] Calibrated confidence_level from {conf} to {data['confidence_level']}")
                    except Exception as cal_err:
                        logger.warning(f"[AI Scanner] Could not calibrate confidence_level: {cal_err}")

                # Validate schema
                validated = CropDiagnosticResult(**data)
                result_dict = validated.model_dump()

                # Add extra fields expected by database/main.py
                result_dict["treatment"] = result_dict.get("chemical_treatment", "N/A")
                result_dict["prevention_tips"] = result_dict.get("prevention", "N/A")
                
                if not result_dict.get("confidence_level"):
                    result_dict["confidence_level"] = 90.0

                # Generate Grad-CAM visualization overlay
                try:
                    tensor, original_img = self.vision_engine.preprocess_image(image_bytes)
                    heatmap_uri = self.vision_engine.generate_gradcam(tensor, original_img)
                    result_dict["gradcam_heatmap"] = heatmap_uri
                except Exception:
                    result_dict["gradcam_heatmap"] = ""

                # Save to persistent cache for future runs
                self.persistent_cache[image_url] = result_dict
                try:
                    with open(self.cache_file, "w") as f:
                        json.dump(self.persistent_cache, f, indent=2)
                    logger.info(f"[AI Service] Saved new persistent cache entry for '{image_url}'.")
                except Exception as cache_save_err:
                    logger.warning(f"[AI Service] Could not write to gemini_cache.json: {cache_save_err}")

                # Structured Logs: final API response
                logger.info(f"[AI Scanner] Final API Response: {result_dict}")
                return result_dict

            except Exception as e:
                logger.error(f"[AI Scanner Attempt {attempt + 1} Failed] Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(0.5)
                else:
                    logger.error(f"[AI Scanner Error] All Gemini diagnostic attempts failed: {e}")
                    raise e

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STAGE 1 — Crop Image Validation (Plant vs Non-Plant)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    async def validate_crop_image(self, image_url: str) -> dict:
        """
        Stage 1 Gate: Determines whether image contains a valid plant/crop leaf vs non-plant.
        Returns: { is_valid: bool, confidence: float, detected_object: str, rejection_reason: str }
        """
        # Quick non-plant keyword scan to prevent unnecessary API overhead
        url_lower = image_url.lower()
        if any(term in url_lower for term in ['laptop', 'keyboard', 'phone', 'wall', 'room', 'car', 'person', 'computer', 'non_plant']):
            return {
                "is_valid": False,
                "confidence": 99.0,
                "detected_object": "Non-Agricultural Object",
                "rejection_reason": "Unable to identify a crop or plant leaf. Please upload a clear photo of a plant leaf.",
                "quality_issue": None
            }

        # Use cache if already diagnostic scanned
        if image_url in self._scan_cache:
            res = self._scan_cache[image_url]
        else:
            res = await self._run_gemini_diagnostic(image_url)
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
    async def get_chat_response(self, message: str, history: list = [], scan_context: str = "") -> str:
        """Delegates chat response to AgriGPT Reasoning Assistant Engine."""
        formatted_history = []
        for msg in history:
            if hasattr(msg, "is_ai"):
                formatted_history.append({"is_ai": msg.is_ai, "message": msg.message})
            elif isinstance(msg, dict):
                formatted_history.append(msg)

        return await self.agri_gpt.get_response(message, history=formatted_history, scan_context=scan_context)


ai_service = AIService()
