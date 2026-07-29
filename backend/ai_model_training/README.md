# AgriNex AI Crop Disease Classifier & Non-Crop Filter Model Architecture

This directory contains the deep learning training pipeline, preprocessing specifications, dataset structure, and quantization guidelines for the **AgriNex Crop Scanner Engine**.

---

## 1. Dataset Structure

The model expects the PlantVillage dataset combined with a mandatory `non_crop_negative` class to filter non-agricultural images (laptops, keyboards, people, vehicles, indoor walls, electronic screens).

```
dataset/
├── train/
│   ├── Apple___Apple_scab/
│   ├── Apple___Black_rot/
│   ├── Apple___Cedar_apple_rust/
│   ├── Apple___healthy/
│   ├── Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot/
│   ├── Corn_(maize)___Common_rust_/
│   ├── Corn_(maize)___Northern_Leaf_Blight/
│   ├── Corn_(maize)___healthy/
│   ├── Potato___Early_blight/
│   ├── Potato___Late_blight/
│   ├── Potato___healthy/
│   ├── Rice___Brown_spot/
│   ├── Rice___Hispa/
│   ├── Rice___Leaf_blast/
│   ├── Tomato___Bacterial_spot/
│   ├── Tomato___Early_blight/
│   ├── Tomato___Late_blight/
│   ├── Tomato___Leaf_Mold/
│   ├── Tomato___Septoria_leaf_spot/
│   ├── Tomato___Spider_mites Two-spotted_spider_mite/
│   ├── Tomato___Target_Spot/
│   ├── Tomato___Tomato_Yellow_Leaf_Curl_Virus/
│   ├── Tomato___Tomato_mosaic_virus/
│   ├── Tomato___healthy/
│   └── non_crop_negative/          <-- 10,000+ Non-Crop Object Images (Laptops, Electronics, Furniture, Walls)
└── val/
    ├── [Same 39 Class Folders as train/]
```

---

## 2. Preprocessing & Normalization Specs

| Parameter | Value | Description |
|---|---|---|
| **Input Shape** | `(3, 224, 224)` | RGB 3-Channel 224x224 Resolution |
| **Mean** | `[0.485, 0.456, 0.406]` | ImageNet standard RGB channel mean |
| **Std Dev** | `[0.229, 0.224, 0.225]` | ImageNet standard RGB channel standard deviation |
| **Data Augmentation** | Random Crop (0.8-1.0), Horizontal Flip, 20° Rotation, Color Jitter | Prevents overfitting and handles varying field lighting |

---

## 3. Two-Stage Inference Pipeline

1. **Stage 1 — Matrix Pre-check & Non-Crop Filter**:
   - Resizes image to 224x224 RGB.
   - Calculates foliage HSV color coverage and texture variance.
   - Evaluates Groq Vision / MobileNet non-crop probability.
   - **Gate Check**: If probability of `non_crop_negative` > 0.30 OR confidence < 70.0%, execution halts immediately with:
     > `"Unable to identify a crop. Please upload a clear image of a plant leaf."`

2. **Stage 2 — Pathology & Diagnosis**:
   - Classifies plant disease or verifies crop health.
   - Generates symptoms, organic treatment options, chemical remedies, irrigation advice, and recovery timelines.

---

## 4. How to Train & Export to ONNX / TFLite

```bash
# Install PyTorch & Torchvision dependencies
pip install torch torchvision pillow

# Run training
python train_crop_disease_model.py
```

To export the trained PyTorch `.pth` model to ONNX / TFLite for edge devices:
```python
import torch

model = build_model()
model.load_state_dict(torch.load("agrinex_crop_disease_mobilenetv3.pth"))
model.eval()

dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy_input, "agrinex_crop_model.onnx", input_names=["input"], output_names=["output"])
```
