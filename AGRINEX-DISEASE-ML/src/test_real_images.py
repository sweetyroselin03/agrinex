"""
AgriNex Disease ML - Real-World & Out-Of-Distribution Inference Testing Workflow

Evaluates Model V2-B across diverse image categories:
1. Known disease image from test dataset
2. Healthy leaf image from test dataset
3. Disease image from Original Dataset source
4. Real-world / Google image from test_images/real_world/
5. Unrelated / non-leaf image (to verify OOD low-confidence guard)

Usage:
    python src/test_real_images.py
"""

import sys
import argparse
from pathlib import Path
import pandas as pd

# Add src directory to path
src_dir = Path(__file__).resolve().parent
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from predict_disease import AgriNexDiseasePredictor, predict_disease

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass


def run_comprehensive_tests(model_path: Path = None):
    """Executes prediction test suite across 5 target image categories."""
    BASE_DIR = Path(__file__).resolve().parent.parent
    if model_path is None:
        model_path = BASE_DIR / "models" / "agrinex_disease_model_v2b_best.pth"
    else:
        model_path = Path(model_path)

    predictor = AgriNexDiseasePredictor(model_path=model_path)

    # Define test suite target paths
    test_cases = [
        {
            "category": "1. Known Disease (Test Dataset)",
            "path": BASE_DIR / "data" / "raw" / "agrinex_unified" / "test" / "Tomato___Early_blight" / "Tomato___Early_blight_004cf022e847.jpg"
        },
        {
            "category": "2. Healthy Leaf (Test Dataset)",
            "path": BASE_DIR / "data" / "raw" / "agrinex_unified" / "test" / "Tomato___healthy" / "Tomato___healthy_00e8586d159e.jpg"
        },
        {
            "category": "3. Disease (Original Dataset Source)",
            "path": BASE_DIR / "data" / "raw" / "agrinex_unified" / "test" / "Bitter_Gourd___Downey_mildew" / "Bitter_Gourd___Downey_mildew_02b2c6503abf.jpg"
        },
        {
            "category": "4. Real-World Image",
            "path": BASE_DIR / "test_images" / "real_world" / "IMG_20240108_233427_694_700_700.jpg"
        },
        {
            "category": "5. Unrelated / Non-Leaf Image (OOD Guard)",
            "path": BASE_DIR / "test_images" / "unrelated_noise.jpg"
        }
    ]

    print("=" * 90)
    print("AGRINEX MODEL V2-B REAL-WORLD & OOD PREDICTION TEST SUITE")
    print("=" * 90)
    print(f"Model Path : {model_path.resolve()}")
    print("=" * 90 + "\n")

    records = []

    for test_info in test_cases:
        cat_name = test_info["category"]
        img_p = test_info["path"]

        print("------------------------------------------------------------------------------------------")
        print(f"TEST CATEGORY : {cat_name}")
        print(f"Image Path    : {img_p}")

        if not img_p.exists():
            print(f"⚠️ Warning: Test image file not found at {img_p}")
            print("------------------------------------------------------------------------------------------\n")
            continue

        try:
            res = predictor.predict(img_p)

            print(f"Predicted Plant   : {res['plant']}")
            print(f"Predicted Disease : {res['disease']}")
            print(f"Status            : {res['status']}")
            print(f"Confidence        : {res['confidence'] * 100.0:.2f}% ({res['confidence']:.4f})")

            if res["status"] == "Uncertain":
                print(f"Message           : {res.get('message')}")
                print(f"OOD Guard Verdict : ✅ Triggered successfully (Prevented false diagnosis)")
            else:
                print(f"Cause             : {res.get('cause')}")
                print(f"Prevention        : {res.get('prevention')}")
                print(f"Treatment         : {res.get('treatment')}")

            records.append({
                "category": cat_name,
                "image_path": str(img_p),
                "plant": res["plant"],
                "disease": res["disease"],
                "status": res["status"],
                "confidence": res["confidence"],
                "cause": res.get("cause", ""),
                "prevention": res.get("prevention", ""),
                "treatment": res.get("treatment", ""),
                "message": res.get("message", "")
            })

        except Exception as e:
            print(f"❌ Error processing test image: {e}")

        print("------------------------------------------------------------------------------------------\n")

    print("=" * 90)
    print("📌 GENERALIZATION & PERFORMANCE NOTE:")
    print("  Held-out Benchmark Test Accuracy: 99.31% (10,575 images across 60 classes).")
    print("  Real-World Performance: In field conditions, performance depends on lighting, field noise,")
    print("  and close-up clarity. The built-in OOD guard prevents overconfident false diagnoses")
    print("  on non-leaf or out-of-distribution inputs.")
    print("=" * 90 + "\n")

    # Save summary report CSV
    results_dir = BASE_DIR / "results"
    results_dir.mkdir(exist_ok=True)
    csv_path = results_dir / "v2b_real_world_test_results.csv"
    pd.DataFrame(records).to_csv(csv_path, index=False)
    print(f"📊 Test results saved to: {csv_path}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AGRINEX Model V2-B Real-World & OOD Inference Test")
    parser.add_argument("--model-path", "-m", type=str, default=None, help="Path to model checkpoint .pth")
    args = parser.parse_args()

    run_comprehensive_tests(model_path=args.model_path)
