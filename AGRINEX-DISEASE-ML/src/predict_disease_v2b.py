"""
AGRINEX Real-World Disease Prediction Pipeline (V2-B Model - 60 Classes)

Loads the trained ResNet18 V2-B checkpoint (agrinex_disease_model_v2b_best.pth),
preprocesses input images matching training pipelines, predicts the disease class,
and combines the ML inference result with the curated disease knowledge database (data/disease_info.json).

Usage:
    python src/predict_disease_v2b.py data/raw/agrinex_unified/test/Tomato___Early_blight/Tomato___Early_blight_0a1b2c3d4e5f.jpg
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

# Standard project base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_PATH = BASE_DIR / "models" / "agrinex_disease_model_v2b_best.pth"
DEFAULT_DB_PATH = BASE_DIR / "data" / "disease_info.json"


def get_inference_transforms(image_size: int = 224) -> transforms.Compose:
    """Returns exact validation/test image transformation pipeline matching V2-B model training."""
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])


class AgriNexV2BPredictor:
    """Inference engine for AgriNex V2-B disease classification model."""

    def __init__(self, model_path: Union[str, Path] = None, db_path: Union[str, Path] = None, device: str = None):
        self.model_path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH

        if not self.model_path.exists():
            raise FileNotFoundError(f"❌ Model checkpoint not found at: {self.model_path}")

        if not self.db_path.exists():
            raise FileNotFoundError(f"❌ Disease knowledge database not found at: {self.db_path}")

        # Device selection (CUDA if available, else CPU)
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load checkpoint
        checkpoint = torch.load(self.model_path, map_location=self.device)

        self.class_names = checkpoint.get("class_names", [])
        self.num_classes = checkpoint.get("num_classes", len(self.class_names))

        if not self.class_names:
            raise ValueError(f"❌ Checkpoint at {self.model_path} does not contain 'class_names'!")

        # Load disease knowledge database
        with open(self.db_path, "r", encoding="utf-8") as f:
            self.disease_db = json.load(f)

        # Reconstruct ResNet18 model architecture
        self.model = models.resnet18(weights=None)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Linear(in_features, self.num_classes)

        # Load state dictionary
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.transform = get_inference_transforms(image_size=224)

    def predict(self, image_input: Union[str, Path, Image.Image]) -> Dict[str, Any]:
        """Runs disease classification and enriches with knowledge database information."""
        if isinstance(image_input, Image.Image):
            image = image_input.convert("RGB")
        else:
            image_path = Path(image_input)
            if not image_path.exists():
                raise FileNotFoundError(f"❌ Input image file not found at: {image_path}")
            image = Image.open(image_path).convert("RGB")

        # Preprocess tensor
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        # Inference
        with torch.no_grad():
            logits = self.model(input_tensor)
            probabilities = torch.softmax(logits, dim=1).squeeze(0)

        top_prob, top_idx = torch.max(probabilities, dim=0)
        predicted_class = self.class_names[top_idx.item()]
        confidence_percent = round(top_prob.item() * 100.0, 1)

        # Fetch knowledge database record
        db_entry = self.disease_db.get(predicted_class, {
            "plant": predicted_class.split("___")[0].replace("_", " ") if "___" in predicted_class else "Unknown",
            "disease": predicted_class.split("___")[1].replace("_", " ") if "___" in predicted_class else predicted_class,
            "cause": "Information pending verification",
            "symptoms": ["Information pending verification"],
            "prevention": ["Information pending verification"],
            "management": ["Information pending verification"]
        })

        return {
            "plant": db_entry.get("plant", "Unknown Plant"),
            "disease": db_entry.get("disease", predicted_class),
            "confidence": confidence_percent,
            "cause": db_entry.get("cause", "Information pending verification"),
            "symptoms": db_entry.get("symptoms", ["Information pending verification"]),
            "prevention": db_entry.get("prevention", ["Information pending verification"]),
            "management": db_entry.get("management", ["Information pending verification"])
        }


# Global singleton cache for helper function usage
_PREDICTOR_INSTANCE = None


def predict_disease(
    image_path: Union[str, Path, Image.Image],
    model_path: Union[str, Path] = None,
    db_path: Union[str, Path] = None,
    device: str = None
) -> Dict[str, Any]:
    """Reusable standalone Python function to predict plant disease for an image.

    Returns:
        {
          "plant": "Tomato",
          "disease": "Early Blight",
          "confidence": 94.8,
          "cause": "...",
          "symptoms": ["..."],
          "prevention": ["..."],
          "management": ["..."]
        }
    """
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None or model_path or db_path or device:
        _PREDICTOR_INSTANCE = AgriNexV2BPredictor(model_path=model_path, db_path=db_path, device=device)

    return _PREDICTOR_INSTANCE.predict(image_path)


def main():
    parser = argparse.ArgumentParser(description="AGRINEX V2-B Real-World Disease Prediction Pipeline")
    parser.add_argument("image_path", nargs="?", type=str, help="Path to leaf image file")
    parser.add_argument("--image", "-i", type=str, help="Alternative path flag to leaf image file")
    parser.add_argument("--model-path", "-m", type=str, default=None, help="Path to V2-B model checkpoint .pth")
    parser.add_argument("--db-path", "-db", type=str, default=None, help="Path to disease_info.json")
    parser.add_argument("--device", "-d", type=str, default=None, help="Device ('cuda' or 'cpu')")

    args = parser.parse_args()
    target_image = args.image_path or args.image

    if not target_image:
        print("❌ Error: No image path provided!")
        print("Usage: python src/predict_disease_v2b.py <path_to_leaf_image>")
        sys.exit(1)

    result = predict_disease(target_image, model_path=args.model_path, db_path=args.db_path, device=args.device)

    print("\n" + "=" * 80)
    print("AGRINEX V2-B DISEASE PREDICTION RESULT")
    print("=" * 80)
    print(f"Plant      : {result['plant']}")
    print(f"Disease    : {result['disease']}")
    print(f"Confidence : {result['confidence']:.1f}%")
    print(f"Cause      : {result['cause']}")
    print("-" * 80)
    print("Symptoms:")
    for sym in result['symptoms']:
        print(f"  • {sym}")
    print("-" * 80)
    print("Prevention:")
    for prev in result['prevention']:
        print(f"  • {prev}")
    print("-" * 80)
    print("Management:")
    for mgmt in result['management']:
        print(f"  • {mgmt}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
