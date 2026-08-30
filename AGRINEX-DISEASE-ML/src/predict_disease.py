"""
AgriNex Disease ML - Integrated Disease Prediction & Inference Pipeline (Model V2-B - 60 Classes)

Loads trained ResNet18 Model V2-B checkpoint (models/agrinex_disease_model_v2b_best.pth),
runs image preprocessing matching V2-B training, implements an OOD / low-confidence guard,
and returns structured diagnostic JSON.

Usage:
    python src/predict_disease.py data/raw/agrinex_unified/test/Tomato___Early_blight/Tomato___Early_blight_004cf022e847.jpg
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, Union

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

# Encoding fix for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_V2B_MODEL_PATH = BASE_DIR / "models" / "agrinex_disease_model_v2b_best.pth"
DEFAULT_DB_PATH = BASE_DIR / "data" / "disease_info.json"

# Out-of-Distribution / Low-confidence probability threshold (50.0%)
OOD_CONFIDENCE_THRESHOLD = 0.50


def get_v2b_transforms(image_size: int = 224) -> transforms.Compose:
    """Exact image preprocessing matching V2-B model validation/test pipeline."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


class AgriNexDiseasePredictor:
    """Engine for AgriNex Disease ML predictions using Model V2-B (60 classes)."""

    def __init__(self, model_path: Union[str, Path] = None, db_path: Union[str, Path] = None, device: str = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_V2B_MODEL_PATH
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH

        if not self.model_path.exists():
            raise FileNotFoundError(f"❌ Model checkpoint file not found at: {self.model_path}")

        # Hardware Device Selection
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load Checkpoint
        print(f"📦 Loading AgriNex V2-B checkpoint: {self.model_path}")
        checkpoint = torch.load(self.model_path, map_location=self.device)

        self.class_names = checkpoint.get("class_names", [])
        self.num_classes = checkpoint.get("num_classes", len(self.class_names))

        if not self.class_names:
            raise ValueError(f"❌ Checkpoint at {self.model_path} lacks 'class_names' key!")

        if self.num_classes != 60:
            print(f"⚠️ Warning: Expected 60 classes for Model V2-B, found {self.num_classes}.")

        # Reconstruct ResNet18 Architecture
        self.model = models.resnet18(weights=None)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Linear(in_features, self.num_classes)

        # Load Trained Weights
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.transform = get_v2b_transforms(image_size=224)

        # Load Disease Knowledge Database
        self.disease_info_db = self._load_disease_db()

        print(f"✅ AgriNex V2-B Predictor initialized on device: {self.device} ({self.num_classes} classes)")

    def _load_disease_db(self) -> Dict[str, Any]:
        """Loads disease info database from JSON if present, otherwise returns default map."""
        if self.db_path.exists():
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ Warning loading disease_info.json: {e}")

        return {}

    def predict(self, image_input: Union[str, Path, Image.Image]) -> Dict[str, Any]:
        """Runs disease classification with OOD guard and returns structured prediction."""
        if isinstance(image_input, Image.Image):
            image = image_input.convert("RGB")
        else:
            image_path = Path(image_input)
            if not image_path.exists():
                raise FileNotFoundError(f"❌ Input image not found: {image_path}")
            try:
                image = Image.open(image_path).convert("RGB")
            except Exception as e:
                raise ValueError(f"❌ Error decoding image file {image_path}: {e}")

        # Preprocess Image
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        # Forward Pass & Softmax
        with torch.no_grad():
            logits = self.model(input_tensor)
            probabilities = torch.softmax(logits, dim=1).squeeze(0)

        top_prob, top_idx = torch.max(probabilities, dim=0)
        confidence = float(top_prob.item())
        predicted_class = self.class_names[top_idx.item()]

        # OOD / Low-Confidence Guard
        if confidence < OOD_CONFIDENCE_THRESHOLD:
            return {
                "plant": "Unknown",
                "disease": "Unknown",
                "status": "Uncertain",
                "confidence": round(confidence, 4),
                "message": "The image could not be confidently matched to a supported disease class. Please upload a clear close-up image of the affected leaf."
            }

        # Retrieve Disease Info
        db_entry = self.disease_info_db.get(predicted_class, {})

        # Plant and Disease parsing fallback
        plant_name = db_entry.get("plant")
        disease_name = db_entry.get("disease")
        
        if not plant_name or not disease_name:
            if "___" in predicted_class:
                p_raw, d_raw = predicted_class.split("___", 1)
                plant_name = plant_name or p_raw.replace("_", " ").strip()
                disease_name = disease_name or d_raw.replace("_", " ").strip()
            else:
                plant_name = plant_name or "Unknown Plant"
                disease_name = disease_name or predicted_class.replace("_", " ").strip()

        is_healthy = "healthy" in predicted_class.lower() or disease_name.lower() in ["healthy", "none"]
        status_str = "Healthy" if is_healthy else "Diseased"
        if is_healthy and disease_name == "healthy":
            disease_name = "None"

        # Format Cause, Prevention, Treatment
        cause_val = db_entry.get("cause")
        if not cause_val:
            cause_val = "None - Plant foliage is healthy and free of disease symptoms." if is_healthy else "Information pending verification"

        prevention_val = db_entry.get("prevention")
        if isinstance(prevention_val, list):
            prevention_val = "; ".join(prevention_val)
        elif not prevention_val:
            prevention_val = "General preventive care: maintain crop rotation and balanced watering." if is_healthy else "Information pending verification"

        treatment_val = db_entry.get("management") or db_entry.get("treatment")
        if isinstance(treatment_val, list):
            treatment_val = "; ".join(treatment_val)
        elif not treatment_val:
            treatment_val = "No treatment required." if is_healthy else "Information pending verification"

        return {
            "plant": plant_name,
            "disease": disease_name,
            "status": status_str,
            "confidence": round(confidence, 4),
            "cause": cause_val,
            "prevention": prevention_val,
            "treatment": treatment_val
        }


# Singleton cache for module-level function
_PREDICTOR_CACHE = None


def predict_disease(
    image_path: Union[str, Path, Image.Image],
    model_path: Union[str, Path] = None,
    db_path: Union[str, Path] = None,
    device: str = None
) -> Dict[str, Any]:
    """Reusable Python function for disease prediction with Model V2-B.

    Returns structured JSON:
    {
      "plant": "Tomato",
      "disease": "Early Blight",
      "status": "Diseased",
      "confidence": 0.948,
      "cause": "...",
      "prevention": "...",
      "treatment": "..."
    }
    """
    global _PREDICTOR_CACHE
    if _PREDICTOR_CACHE is None or model_path or db_path or device:
        _PREDICTOR_CACHE = AgriNexDiseasePredictor(model_path=model_path, db_path=db_path, device=device)

    return _PREDICTOR_CACHE.predict(image_path)


def main():
    parser = argparse.ArgumentParser(description="AGRINEX V2-B Disease Prediction & Inference Pipeline")
    parser.add_argument("image_path", nargs="?", type=str, help="Path to input leaf image")
    parser.add_argument("--image", "-i", type=str, help="Path to input leaf image (alternative flag)")
    parser.add_argument("--model-path", "-m", type=str, default=None, help="Path to V2-B model checkpoint .pth")
    parser.add_argument("--db-path", "-db", type=str, default=None, help="Path to disease_info.json")
    parser.add_argument("--device", "-d", type=str, default=None, help="Device ('cuda' or 'cpu')")

    args = parser.parse_args()
    target_image = args.image_path or args.image

    if not target_image:
        print("❌ Error: No image path provided!")
        print("Usage: python src/predict_disease.py path/to/leaf_image.jpg")
        sys.exit(1)

    predictor = AgriNexDiseasePredictor(model_path=args.model_path, db_path=args.db_path, device=args.device)
    result = predictor.predict(target_image)

    print("\n" + "=" * 80)
    print("AGRINEX V2-B DISEASE PREDICTION RESULT")
    print("=" * 80)
    print(f"Plant      : {result['plant']}")
    print(f"Disease    : {result['disease']}")
    print(f"Status     : {result['status']}")
    print(f"Confidence : {result['confidence'] * 100.0:.2f}% ({result['confidence']:.4f})")
    
    if result["status"] == "Uncertain":
        print(f"Message    : {result.get('message')}")
    else:
        print(f"Cause      : {result['cause']}")
        print(f"Prevention : {result['prevention']}")
        print(f"Treatment  : {result['treatment']}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
