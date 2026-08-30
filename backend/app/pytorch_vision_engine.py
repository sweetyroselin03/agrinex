"""
AgriNex PyTorch Vision Inference Engine
Primary ML authority for crop disease detection & plant validation.
Supports MobileNetV3-Large TwoStageCropClassifier and ResNet18 architectures.
"""

import os
import io
import time
import base64
import logging
import numpy as np
from typing import Dict, Any, Tuple, Optional, List

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms
from PIL import Image

logger = logging.getLogger("uvicorn.error")

# 38 Standard PlantVillage Disease Classes
DEFAULT_38_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
]

# 60 Fine-grained Plant & Disease Classes from AGRINEX V2-B Dataset
DEFAULT_60_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Bitter_Gourd___Downey_mildew", "Bitter_Gourd___Fusarium_wilt", "Bitter_Gourd___Mosaic_virus", "Bitter_Gourd___healthy",
    "Blueberry___healthy", "Bottle_Gourd___Anthracnose", "Bottle_Gourd___Downey_mildew", "Bottle_Gourd___healthy",
    "Cauliflower___Black_Rot", "Cauliflower___Downy_mildew", "Cauliflower___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Cucumber___Anthracnose", "Cucumber___Belly_rot", "Cucumber___Downy_mildew", "Cucumber___healthy",
    "Eggplant___Begomovirus", "Eggplant___Cercospora_leaf_spot", "Eggplant___Verticillium_wilt", "Eggplant___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Cercospora_leaf_spot", "Tomato___Early_blight", "Tomato___Insect_damage",
    "Tomato___Late_blight", "Tomato___Leaf_Mold", "Tomato___Leaf_miner", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus", "Tomato___Tomato_spotted_wilt", "Tomato___healthy"
]

CROP_SPECIES_MAP = {
    "Apple": "Apple",
    "Bitter_Gourd": "Bitter Gourd",
    "Blueberry": "Blueberry",
    "Bottle_Gourd": "Bottle Gourd",
    "Cauliflower": "Cauliflower",
    "Cherry_(including_sour)": "Cherry",
    "Cherry": "Cherry",
    "Corn_(maize)": "Corn",
    "Corn": "Corn",
    "Cucumber": "Cucumber",
    "Eggplant": "Eggplant",
    "Grape": "Grape",
    "Orange": "Citrus / Orange",
    "Peach": "Peach",
    "Pepper,_bell": "Bell Pepper",
    "Potato": "Potato",
    "Raspberry": "Raspberry",
    "Soybean": "Soybean",
    "Squash": "Squash",
    "Strawberry": "Strawberry",
    "Tomato": "Tomato"
}

SCIENTIFIC_NAME_MAP = {
    "Apple": "Malus domestica",
    "Bitter Gourd": "Momordica charantia",
    "Blueberry": "Vaccinium corymbosum",
    "Bottle Gourd": "Lagenaria siceraria",
    "Cauliflower": "Brassica oleracea var. botrytis",
    "Cherry": "Prunus avium",
    "Corn": "Zea mays",
    "Cucumber": "Cucumis sativus",
    "Eggplant": "Solanum melongena",
    "Grape": "Vitis vinifera",
    "Citrus / Orange": "Citrus sinensis",
    "Orange": "Citrus sinensis",
    "Peach": "Prunus persica",
    "Bell Pepper": "Capsicum annuum",
    "Potato": "Solanum tuberosum",
    "Raspberry": "Rubus idaeus",
    "Soybean": "Glycine max",
    "Squash": "Cucurbita pepo",
    "Strawberry": "Fragaria x ananassa",
    "Tomato": "Solanum lycopersicum",
    "Unknown Crop Species": "Plantae"
}


class TwoStageCropClassifier(nn.Module):
    """
    Two-Stage PyTorch Architecture (MobileNetV3-Large Backbone)
    Stage 1: Binary Plant Gate (0 = Plant, 1 = Non-Plant)
    Stage 2: Multi-class Crop Disease Head
    """
    def __init__(self, num_diseases=38):
        super(TwoStageCropClassifier, self).__init__()
        self.backbone = models.mobilenet_v3_large(weights=None)
        in_features = self.backbone.classifier[0].in_features
        self.backbone.classifier = nn.Identity()

        # Stage 1: Binary Plant Gate
        self.stage1_plant_gate = nn.Sequential(
            nn.Linear(in_features, 128),
            nn.ReLU(),
            nn.Dropout(p=0.2),
            nn.Linear(128, 2)
        )

        # Stage 2: Disease Classifier Head
        self.stage2_disease_head = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.Hardswish(),
            nn.Dropout(p=0.3),
            nn.Linear(512, num_diseases)
        )

    def forward(self, x: torch.Tensor):
        features = self.backbone(x)
        plant_logits = self.stage1_plant_gate(features)
        disease_logits = self.stage2_disease_head(features)
        return plant_logits, disease_logits


class PyTorchVisionEngine:
    """
    Singleton PyTorch ML Engine for AgriNex Crop Scanner.
    Handles model loading ONCE at backend startup and executes high-speed inference.
    """
    _instance: Optional['PyTorchVisionEngine'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PyTorchVisionEngine, cls).__new__(cls)
            cls._instance._is_initialized = False
        return cls._instance

    def _ensure_initialized(self):
        if not getattr(self, "_is_initialized", False):
            self._initialize()
            self._is_initialized = True

    def _initialize(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"[AgriNex ML] Initializing PyTorch Vision Engine on device: {self.device}")

        # Transforms matching PyTorch validation & test pipelines
        self.preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        self.class_names = DEFAULT_38_CLASSES
        self.num_classes = len(self.class_names)
        self.architecture_name = "MobileNetV3-Large (TwoStageCropClassifier)"
        self.active_weights_file = ""
        self.is_loaded = False
        self.model = None

        # Candidate paths for model weights files in priority order
        base_dir = os.path.dirname(__file__)
        weights_candidates = [
            os.path.join(base_dir, "..", "ai_model_training", "agrinex_disease_model_v2b_best.pth"),
            os.path.join(base_dir, "..", "ai_model_training", "agrinex_crop_disease_mobilenetv3.pth"),
            os.path.join(base_dir, "..", "..", "AGRINEX-DISEASE-ML", "models", "agrinex_disease_model_v2b_best.pth"),
            os.path.join(base_dir, "..", "..", "AGRINEX-DISEASE-ML", "models", "agrinex_disease_model_best.pth"),
            os.path.join(os.getcwd(), "agrinex_disease_model_v2b_best.pth"),
            "agrinex_disease_model_v2b_best.pth",
            "agrinex_crop_disease_mobilenetv3.pth"
        ]

        logger.info("[AgriNex ML] Loading MobileNetV3 model...")

        for path in weights_candidates:
            if os.path.exists(path):
                try:
                    checkpoint = torch.load(path, map_location=self.device)
                    
                    # Extract state_dict and metadata if dictionary format
                    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                        state_dict = checkpoint["model_state_dict"]
                        if "class_names" in checkpoint:
                            self.class_names = checkpoint["class_names"]
                            self.num_classes = len(self.class_names)
                    elif isinstance(checkpoint, dict):
                        state_dict = checkpoint
                    else:
                        state_dict = checkpoint

                    # Determine model architecture from state_dict keys
                    is_two_stage = any(k.startswith("backbone.") or k.startswith("stage1_plant_gate") for k in state_dict.keys())

                    if is_two_stage:
                        num_dis = len(self.class_names) if len(self.class_names) in [38, 60] else 38
                        model_inst = TwoStageCropClassifier(num_diseases=num_dis)
                        model_inst.load_state_dict(state_dict, strict=False)
                        self.architecture_name = "MobileNetV3-Large (TwoStageCropClassifier)"
                        self.model = model_inst
                    else:
                        # Fallback / Alternative ResNet18 architecture
                        num_dis = len(self.class_names)
                        model_inst = models.resnet18(weights=None)
                        in_features = model_inst.fc.in_features
                        model_inst.fc = nn.Linear(in_features, num_dis)
                        model_inst.load_state_dict(state_dict, strict=False)
                        self.architecture_name = "ResNet18 V2-B"
                        self.model = model_inst

                    self.active_weights_file = os.path.basename(path)
                    self.is_loaded = True
                    logger.info(f"[AgriNex ML] Model loaded successfully from '{path}' (Classes: {self.num_classes}, Architecture: {self.architecture_name})")
                    break

                except Exception as load_err:
                    logger.warning(f"[AgriNex ML] Checkpoint load attempt failed for '{path}': {load_err}")

        if not self.is_loaded:
            logger.error("[AgriNex ML] Failed to load PyTorch checkpoint. Flagging PyTorch ML engine as unavailable.")
            self.model = None
            return

        self.model.to(self.device)
        self.model.eval()

        # Warmup model once at startup to avoid first-request inference delay
        try:
            dummy_input = torch.zeros(1, 3, 224, 224).to(self.device)
            with torch.no_grad():
                self.model(dummy_input)
            logger.info("[AgriNex ML] PyTorch Vision Engine warmed up successfully.")
        except Exception as warmup_err:
            logger.warning(f"[AgriNex ML] Warmup warning: {warmup_err}")

    def preprocess_image(self, image_bytes: bytes) -> Tuple[torch.Tensor, Image.Image]:
        self._ensure_initialized()
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), color=(34, 139, 34))
        tensor = self.preprocess(img).unsqueeze(0).to(self.device)
        return tensor, img

    def run_inference(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs two-stage PyTorch inference:
        Stage 1: Plant vs Non-Plant validation
        Stage 2: Multi-class crop disease detection
        """
        self._ensure_initialized()
        if not self.is_loaded or self.model is None:
            raise RuntimeError("PyTorch ML model weights not loaded")

        start_time = time.time()
        tensor, original_img = self.preprocess_image(image_bytes)

        # STAGE 1 & STAGE 2 INFERENCE
        with torch.no_grad():
            outputs = self.model(tensor)
            if isinstance(outputs, tuple):
                plant_logits, disease_logits = outputs
                
                # Stage 1: Check plant vs non-plant
                plant_probs = F.softmax(plant_logits, dim=1).squeeze(0)
                is_plant_idx = torch.argmax(plant_probs).item()
                plant_confidence = float(plant_probs[0].item())
                
                if is_plant_idx == 1 or plant_confidence < 0.40:
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    logger.info(f"[AgriNex ML] Stage 1 Gate: Non-plant object detected (Plant Prob: {plant_confidence*100:.1f}%)")
                    return {
                        "is_valid_crop": False,
                        "is_plant": False,
                        "crop_type": "Non-Agricultural Object",
                        "disease_name": "Unable to Identify Crop",
                        "confidence": round(float(plant_probs[1].item()) * 100.0, 1) if is_plant_idx == 1 else round((1.0 - plant_confidence) * 100.0, 1),
                        "confidence_level": round((1.0 - plant_confidence) * 100.0, 1),
                        "severity_level": "Critical",
                        "symptoms": "Unable to identify a crop or plant leaf. Please upload a clear photo of a plant leaf.",
                        "causes": "Non-agricultural object or non-foliage background in frame.",
                        "prevention": "Center a plant leaf, fruit, or stem directly in the camera lens.",
                        "treatment": "Please re-scan with a clear, direct crop photograph.",
                        "rejection_reason": "Unable to identify a crop or plant leaf. Please upload a clear photo of a plant leaf.",
                        "scientific_name": "N/A",
                        "latency_ms": latency_ms
                    }
                
                probabilities = F.softmax(disease_logits, dim=1).squeeze(0)
            else:
                probabilities = F.softmax(outputs, dim=1).squeeze(0)

        top_prob, top_idx = torch.max(probabilities, dim=0)
        idx_val = top_idx.item()
        predicted_class = self.class_names[idx_val] if idx_val < len(self.class_names) else "Unknown"
        confidence_pct = round(float(top_prob.item()) * 100.0, 1)
        latency_ms = round((time.time() - start_time) * 1000, 2)

        # Parse crop and disease taxonomy
        raw_crop_name = predicted_class.split("___")[0] if "___" in predicted_class else "Unknown"
        crop_display = CROP_SPECIES_MAP.get(raw_crop_name, raw_crop_name.replace("_", " "))

        disease_part = predicted_class.split("___")[1] if "___" in predicted_class else predicted_class
        disease_display = disease_part.replace("_", " ").strip()

        crop_scientific = SCIENTIFIC_NAME_MAP.get(crop_display, SCIENTIFIC_NAME_MAP.get(raw_crop_name, "Plantae"))

        is_healthy = "healthy" in disease_display.lower()
        disease_name_formatted = f"Healthy {crop_display}" if is_healthy else f"{crop_display} {disease_display}"

        return {
            "is_valid_crop": True,
            "is_plant": True,
            "crop_type": crop_display,
            "disease_name": disease_name_formatted,
            "confidence": confidence_pct,
            "confidence_level": confidence_pct,
            "severity_level": "Healthy" if is_healthy else ("Moderate" if confidence_pct < 85.0 else "Critical"),
            "symptoms": f"No disease detected on {crop_display} foliage." if is_healthy else f"Symptoms consistent with {disease_display} observed on {crop_display}.",
            "causes": "Optimal nutrient and watering management." if is_healthy else f"Pathogenic infection affecting {crop_display}.",
            "prevention": f"Maintain standard {crop_display} care and field monitoring.",
            "treatment": "None required." if is_healthy else f"Apply recommended management spray for {disease_display}.",
            "organic_treatment": "Apply compost tea or neem oil solution as preventive measure.",
            "pesticide_recommendations": "N/A" if is_healthy else f"Apply standard fungicide/treatment for {disease_display}.",
            "fertilizer_recommendations": "Maintain balanced NPK fertilization.",
            "irrigation_recommendations": "Water early morning at soil level.",
            "recovery_steps": "N/A" if is_healthy else f"1. Prune foliage showing {disease_display}.\n2. Improve aeration around plants.",
            "estimated_recovery_time": "N/A" if is_healthy else "10-14 days",
            "weather_risk": "Low risk under dry conditions.",
            "prevention_tips": f"• Inspect {crop_display} crops regularly\n• Ensure good soil drainage",
            "yield_impact": "Optimal yield expected." if is_healthy else "Potential yield impact if left untreated.",
            "pro_tips": f"Continue regular foliage monitoring for {crop_display}.",
            "scientific_name": crop_scientific,
            "latency_ms": latency_ms,
            "architecture": self.architecture_name,
            "weights_file": self.active_weights_file
        }

    def get_model_info(self) -> Dict[str, Any]:
        """Returns metadata regarding active PyTorch ML model architecture and load status."""
        self._ensure_initialized()
        return {
            "model_name": "AgriNex PyTorch Vision Engine",
            "architecture": self.architecture_name,
            "num_classes": self.num_classes,
            "is_loaded": self.is_loaded,
            "device": str(self.device),
            "input_size": [224, 224],
            "weights_file": self.active_weights_file,
            "version": "2.0-B"
        }


vision_engine = PyTorchVisionEngine()
