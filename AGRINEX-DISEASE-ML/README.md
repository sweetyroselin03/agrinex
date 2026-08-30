# AgriNex Disease ML: Crop Disease Detection

A dedicated, high-accuracy Machine Learning & Computer Vision project designed for **Crop Disease Identification** from plant leaf images.

> **Note**: This model strictly focuses on identifying disease symptoms and healthy conditions across agricultural crops, rather than acting primarily as a general plant species classifier.

---

## 📁 Project Structure

```text
AGRINEX-DISEASE-ML/
├── data/
│   ├── raw/                 # Original uncompressed dataset (e.g., PlantVillage)
│   └── processed/           # Cleaned, split, and normalized image sets / metadata CSVs
├── notebooks/
│   └── 01_eda_and_data_prep.ipynb   # Google Colab starter notebook for EDA & data verification
├── models/                  # Exported model weights (.pth, .pt, .onnx)
├── src/                     # Reusable Python modules for dataset handling & utils
│   ├── __init__.py
│   └── utils.py             # Image integrity verification and metadata helper scripts
├── test_images/             # Sample unseen images for quick inference testing
├── results/                 # Confusion matrices, training curves, metrics reports
├── requirements.txt         # Project dependencies for local or cloud environments
├── README.md                # Project documentation
└── .gitignore               # Git exclusion rules
```

---

## ⚡ Getting Started in Google Colab

1. **Upload Notebook**: Upload `notebooks/01_eda_and_data_prep.ipynb` to Google Colab.
2. **Set GPU Hardware Accelerator**: Go to `Runtime` -> `Change runtime type` -> select `GPU (T4 or higher)`.
3. **Execute Setup & EDA**: Run the cells in sequence to install dependencies, load crop disease images, check class distribution, inspect image resolutions, detect corrupted files, and create train/validation splits.

---

## 🔬 Dataset Overview & Objectives

- **Primary Goal**: Detect pathological leaf states (e.g., *Early Blight*, *Late Blight*, *Bacterial Spot*, *Powdery Mildew*, *Healthy*).
- **Core Criteria**:
  - Filter out non-leaf images or low-quality noise.
  - High focus on symptoms and visual spot patterns over background/species variations.
  - Detect and eliminate zero-byte or corrupt image files before model training.

---

## 🚀 Next Steps (Phase 2 Roadmap)
1. Complete exploratory data analysis using `01_eda_and_data_prep.ipynb`.
2. Build baseline convolutional model (ResNet / EfficientNet / ConvNeXt architecture via PyTorch).
3. Evaluate model accuracy, per-disease precision/recall, and generate confusion matrices.
4. Export lightweight PyTorch/TorchScript artifacts for downstream application deployment.
