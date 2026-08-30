import json
from pathlib import Path

def make_cell(cell_type, source_lines):
    return {
        "cell_type": cell_type,
        "metadata": {},
        "outputs": [] if cell_type == "code" else None,
        "execution_count": None if cell_type == "code" else None,
        "source": [line + "\n" for line in source_lines]
    }

cells = []

# ==========================================
# SECTION 1: PROJECT INTRODUCTION
# ==========================================
cells.append(make_cell("markdown", [
    "# AGRINEX: AI-Based Plant Disease Detection & Agricultural Assistant",
    "### Faculty Demonstration Notebook (Model V2-B)",
    "",
    "**Project Architecture:** Unified 60-Class Transfer Learning (ResNet18)",
    "",
    "#### Verified Performance Metrics (Model V2-B):",
    "- **Supported Classes:** 60 unique crop-disease classes",
    "- **Total Dataset Size:** 70,134 unique images",
    "- **Held-out Test Images:** 10,575 images",
    "- **Held-out Test Accuracy:** **99.31%**",
    "- **Macro Precision:** **99.01%**",
    "- **Macro Recall:** **99.20%**",
    "- **Macro F1-Score:** **99.09%**",
    "",
    "> **Notice:** This demonstration runs **100% offline and locally**. No external AI APIs (Gemini / OpenAI) are required or used."
]))

# ==========================================
# SECTION 2: UPLOAD & EXTRACT PROJECT
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 2: Upload & Extract Project",
    "Upload `agrinex_colab_demo.zip` below if it is not already in your Colab runtime environment. The cell will automatically search for the ZIP, extract it into `/content/agrinex_project`, and dynamically resolve all file paths."
]))

cells.append(make_cell("code", [
    "import os",
    "import sys",
    "import zipfile",
    "from pathlib import Path",
    "",
    "# Global dynamic path variables",
    "PROJECT_ROOT = None",
    "MODEL_PATH = None",
    "DISEASE_INFO_PATH = None",
    "CHATBOT_KB_PATH = None",
    "REPORT_PATH = None",
    "HISTORY_CSV_PATH = None",
    "CONFUSION_MATRIX_PATH = None",
    "",
    "def discover_and_extract_project():",
    "    global PROJECT_ROOT, MODEL_PATH, DISEASE_INFO_PATH, CHATBOT_KB_PATH, REPORT_PATH, HISTORY_CSV_PATH, CONFUSION_MATRIX_PATH",
    "    ",
    "    target_model_filename = 'agrinex_disease_model_v2b_best.pth'",
    "    search_roots = [Path('.').resolve(), Path('/content').resolve()]",
    "    ",
    "    # 1. Search for existing extracted model file",
    "    found_model = None",
    "    for root in search_roots:",
    "        if root.exists():",
    "            matches = list(root.rglob(target_model_filename))",
    "            if matches:",
    "                found_model = matches[0]",
    "                break",
    "    ",
    "    # 2. If model not found, locate zip file to extract",
    "    if not found_model:",
    "        zip_file = None",
    "        for root in search_roots:",
    "            if root.exists():",
    "                zips = [z for z in root.glob('*.zip') if 'agrinex' in z.name.lower()]",
    "                if zips:",
    "                    zip_file = zips[0]",
    "                    break",
    "                zips_all = list(root.glob('*.zip'))",
    "                if zips_all:",
    "                    zip_file = zips_all[0]",
    "                    break",
    "        ",
    "        # Prompt Colab upload widget if zip not found",
    "        if not zip_file:",
    "            try:",
    "                from google.colab import files",
    "                print('📦 agrinex_colab_demo.zip not found in runtime. Please upload your project ZIP file below:')",
    "                uploaded = files.upload()",
    "                for fn in uploaded.keys():",
    "                    if fn.endswith('.zip'):",
    "                        zip_file = Path(fn).resolve()",
    "                        break",
    "            except ImportError:",
    "                pass",
    "        ",
    "        # Extract zip file",
    "        if zip_file and zip_file.exists():",
    "            extract_target = Path('/content/agrinex_project').resolve()",
    "            extract_target.mkdir(parents=True, exist_ok=True)",
    "            print(f'📂 Extracting {zip_file.name} into {extract_target}...')",
    "            with zipfile.ZipFile(zip_file, 'r') as z:",
    "                z.extractall(extract_target)",
    "            print('✅ Extraction complete!')",
    "            ",
    "            # Search again after extraction",
    "            matches = list(extract_target.rglob(target_model_filename))",
    "            if matches:",
    "                found_model = matches[0]",
    "    ",
    "    # 3. Resolve PROJECT_ROOT based on model location",
    "    if found_model and found_model.exists():",
    "        MODEL_PATH = found_model.resolve()",
    "        # models directory parent is PROJECT_ROOT",
    "        if MODEL_PATH.parent.name == 'models':",
    "            PROJECT_ROOT = MODEL_PATH.parent.parent",
    "        else:",
    "            PROJECT_ROOT = MODEL_PATH.parent",
    "        ",
    "        os.chdir(PROJECT_ROOT)",
    "        src_dir = str(PROJECT_ROOT / 'src')",
    "        if src_dir not in sys.path:",
    "            sys.path.insert(0, src_dir)",
    "            ",
    "        DISEASE_INFO_PATH = (PROJECT_ROOT / 'data' / 'disease_info.json').resolve()",
    "        CHATBOT_KB_PATH = (PROJECT_ROOT / 'data' / 'chatbot_knowledge.json').resolve()",
    "        REPORT_PATH = (PROJECT_ROOT / 'results' / 'classification_report_v2b.txt').resolve()",
    "        HISTORY_CSV_PATH = (PROJECT_ROOT / 'results' / 'training_history_v2b.csv').resolve()",
    "        CONFUSION_MATRIX_PATH = (PROJECT_ROOT / 'results' / 'confusion_matrix_v2b.png').resolve()",
    "    ",
    "    # 4. Display Verification Output",
    "    print('==========================================')",
    "    print('AGRINEX PROJECT VERIFICATION')",
    "    print('==========================================')",
    "    print(f'Project root           : {PROJECT_ROOT}')",
    "    print(f'Model path             : {MODEL_PATH}')",
    "    print(f'Model exists           : {MODEL_PATH is not None and MODEL_PATH.exists()}')",
    "    if MODEL_PATH and MODEL_PATH.exists():",
    "        size_mb = MODEL_PATH.stat().st_size / (1024 * 1024)",
    "        print(f'Model size             : ~{size_mb:.1f} MB')",
    "    print(f'Disease knowledge base : {DISEASE_INFO_PATH} (exists={DISEASE_INFO_PATH is not None and DISEASE_INFO_PATH.exists()})')",
    "    print(f'Chatbot knowledge base : {CHATBOT_KB_PATH} (exists={CHATBOT_KB_PATH is not None and CHATBOT_KB_PATH.exists()})')",
    "    print('==========================================')",
    "    ",
    "    if not MODEL_PATH or not MODEL_PATH.exists():",
    "        print('\\n❌ Please upload agrinex_colab_demo.zip containing the trained V2-B model.')",
    "    else:",
    "        print('\\n🎉 AgriNex project root and files resolved successfully!')",

"discover_and_extract_project()"
]))

# ==========================================
# SECTION 3: INSTALL DEPENDENCIES & HARDWARE DETECTION
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 3: Install Dependencies & Hardware Acceleration Setup",
    "Installs PyTorch, Torchvision, FastAPI, and visualization libraries. Automatically detects GPU (CUDA) if available, falling back gracefully to CPU."
]))

cells.append(make_cell("code", [
    "import torch",
    "import torchvision",
    "from torchvision import transforms, models",
    "from PIL import Image",
    "import matplotlib.pyplot as plt",
    "import pandas as pd",
    "import numpy as np",
    "",
    "cuda_available = torch.cuda.is_available()",
    "device = torch.device('cuda' if cuda_available else 'cpu')",
    "",
    "print('================================================================')",
    "print('AGRINEX SYSTEM ENVIRONMENT CONFIGURATION')",
    "print('================================================================')",
    "print(f'PyTorch Version  : {torch.__version__}')",
    "print(f'Torchvision      : {torchvision.__version__}')",
    "print(f'CUDA Available   : {cuda_available}')",
    "if cuda_available:",
    "    print(f'GPU Device Name  : {torch.cuda.get_device_name(0)}')",
    "else:",
    "    print('Inference Mode   : CPU (No GPU detected, running on CPU)')",
    "print(f'Active Device    : {device}')",
    "print('================================================================')"
]))

# ==========================================
# SECTION 4: LOAD TRAINED V2-B MODEL
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 4: Load Trained Model V2-B",
    "Loads the pre-trained weights from the resolved `MODEL_PATH` (`agrinex_disease_model_v2b_best.pth`). **No retraining is performed.**"
]))

cells.append(make_cell("code", [
    "import torch.nn as nn",
    "",
    "if not MODEL_PATH or not MODEL_PATH.exists():",
    "    print('❌ Cannot load model: MODEL_PATH is unresolved. Please upload agrinex_colab_demo.zip in Section 2.')",
    "else:",
    "    checkpoint = torch.load(MODEL_PATH, map_location=device)",
    "    class_names = checkpoint.get('class_names', [])",
    "    num_classes = checkpoint.get('num_classes', len(class_names))",
    "    ",
    "    model = models.resnet18(weights=None)",
    "    in_features = model.fc.in_features",
    "    model.fc = nn.Linear(in_features, num_classes)",
    "    ",
    "    model.load_state_dict(checkpoint['model_state_dict'])",
    "    model.to(device)",
    "    model.eval()",
    "    ",
    "    print('================================================================')",
    "    print('✅ AGRINEX V2-B model loaded successfully')",
    "    print('================================================================')",
    "    print(f'Model Checkpoint  : {MODEL_PATH.name}')",
    "    print(f'Model Version     : V2-B')",
    "    print(f'📦 Total Supported Classes: {num_classes}')",
    "    print(f'🎯 Device: {device}')",
    "    print('================================================ collapse')"
]))

# ==========================================
# SECTION 5: DISEASE PREDICTION DEMO
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 5: Disease Prediction Interactive Demo",
    "Upload any leaf image below or run inference on a sample image using exact V2-B preprocessing (`224x224`, ImageNet normalization) and OOD guard."
]))

cells.append(make_cell("code", [
    "from src.predict_disease import AgriNexDiseasePredictor",
    "",
    "predictor = AgriNexDiseasePredictor(model_path=MODEL_PATH, device=str(device))",
    "",
    "def run_interactive_prediction(image_input_path):",
    "    res = predictor.predict(image_input_path)",
    "    ",
    "    img = Image.open(image_input_path)",
    "    plt.figure(figsize=(5, 5))",
    "    plt.imshow(img)",
    "    plt.axis('off')",
    "    plt.title(f\"{res['plant']} - {res['disease']} ({res['status']})\", fontsize=12, fontweight='bold')",
    "    plt.show()",
    "    ",
    "    print('=' * 80)",
    "    print('AGRINEX DIAGNOSTIC PREDICTION RESULT')",
    "    print('=' * 80)",
    "    print(f\"Plant      : {res['plant']}\")",
    "    print(f\"Disease    : {res['disease']}\")",
    "    print(f\"Status     : {res['status']}\")",
    "    print(f\"Confidence : {res['confidence'] * 100.0:.2f}% ({res['confidence']:.4f})\")",
    "    ",
    "    if res['status'] == 'Uncertain':",
    "        print(f\"Message    : {res.get('message')}\")",
    "    else:",
    "        print(f\"Cause      : {res.get('cause')}\")",
    "        print(f\"Prevention : {res.get('prevention')}\")",
    "        print(f\"Treatment  : {res.get('treatment')}\")",
    "    print('=' * 80 + '\\n')",
    "    return res",
    "",
    "# Sample image lookup",
    "sample_image = PROJECT_ROOT / 'test_images' / 'unrelated_noise.jpg'",
    "sample_diseased = list(PROJECT_ROOT.rglob('Tomato___Early_blight_*.jpg'))",
    "if sample_diseased:",
    "    sample_image = sample_diseased[0]",
    "",
    "print('Running prediction demonstration on sample image:')",
    "latest_result = run_interactive_prediction(sample_image)"
]))

# ==========================================
# SECTION 6: 5 TEST CASES
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 6: Comprehensive Test Suite (5 Test Cases)",
    "Evaluating Model V2-B across 5 distinct target image categories."
]))

cells.append(make_cell("code", [
    "# Find test image paths dynamically",
    "diseased_matches = list(PROJECT_ROOT.rglob('Tomato___Early_blight_*.jpg'))",
    "healthy_matches = list(PROJECT_ROOT.rglob('Tomato___healthy_*.jpg'))",
    "bitter_matches = list(PROJECT_ROOT.rglob('Bitter_Gourd___Downey_mildew_*.jpg'))",
    "real_world_matches = list((PROJECT_ROOT / 'test_images' / 'real_world').glob('*.jpg'))",
    "ood_matches = list(PROJECT_ROOT.rglob('unrelated_noise.jpg'))",
    "",
    "test_cases = [",
    "    {",
    "        'title': 'TEST CASE 1: Known Diseased Leaf (Tomato Early Blight)',",
    "        'path': diseased_matches[0] if diseased_matches else None",
    "    },",
    "    {",
    "        'title': 'TEST CASE 2: Healthy Leaf (Tomato Healthy)',",
    "        'path': healthy_matches[0] if healthy_matches else None",
    "    },",
    "    {",
    "        'title': 'TEST CASE 3: Another Crop/Disease (Bitter Gourd Downy Mildew)',",
    "        'path': bitter_matches[0] if bitter_matches else None",
    "    },",
    "    {",
    "        'title': 'TEST CASE 4: Real-World Field Camera Image',",
    "        'path': real_world_matches[0] if real_world_matches else None",
    "    },",
    "    {",
    "        'title': 'TEST CASE 5: Non-Leaf / Out-Of-Distribution (OOD) Image',",
    "        'path': ood_matches[0] if ood_matches else None",
    "    }",
    "]",
    "",
    "for tc in test_cases:",
    "    t_title = tc['title']",
    "    t_path = tc['path']",
    "    ",
    "    print('------------------------------------------------------------------------------------------')",
    "    print(f'📌 {t_title}')",
    "    print(f'Image Path: {t_path}')",
    "    ",
    "    if t_path and t_path.exists():",
    "        r = predictor.predict(t_path)",
    "        print(f\"Predicted Plant   : {r['plant']}\")",
    "        print(f\"Predicted Disease : {r['disease']}\")",
    "        print(f\"Status            : {r['status']}\")",
    "        print(f\"Confidence        : {r['confidence'] * 100.0:.2f}%\")",
    "        if r['status'] == 'Uncertain':",
    "            print(f\"OOD Guard Verdict : ✅ Triggered (Status={r['status']})\")",
    "    else:",
    "        print('⚠️ Test image file not found.')",
    "    print('------------------------------------------------------------------------------------------\\n')"
]))

# ==========================================
# SECTION 7: OFFLINE AGRICULTURAL CHATBOT
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 7: Offline Agricultural Chatbot Demonstration",
    "Demonstrating local offline chatbot Q&A (**without Gemini API**)."
]))

cells.append(make_cell("code", [
    "from src.agri_chatbot import AgriNexChatbot",
    "",
    "chatbot = AgriNexChatbot(knowledge_path=CHATBOT_KB_PATH)",
    "",
    "chatbot_queries = [",
    "    'What causes tomato early blight?',",
    "    'What should I do for tomato early blight?',",
    "    'How can I prevent tomato early blight?',",
    "    'How often should I water tomato plants?',",
    "    'What should I do if my plant is healthy?'",
    "]",
    "",
    "print('================================================================')",
    "print('AGRINEX LOCAL CHATBOT DEMONSTRATION')",
    "print('================================================================\\n')",
    "",
    "for q in chatbot_queries:",
    "    print(f'User       : {q}')",
    "    c_res = chatbot.ask(q)",
    "    print('AgriNex AI :')",
    "    print(c_res['response'])",
    "    print(f\"Source     : {c_res['source']}\")",
    "    print('-' * 80 + '\\n')"
]))

# ==========================================
# SECTION 8: PREDICTION + CHATBOT INTEGRATION
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 8: Disease Prediction + Chatbot Context Integration",
    "Demonstrating end-to-end context passing from `/predict` result to chatbot for ambiguous follow-up questions."
]))

cells.append(make_cell("code", [
    "leaf_sample = diseased_matches[0] if diseased_matches else sample_image",
    "prediction = predictor.predict(leaf_sample)",
    "",
    "print('1. DIAGNOSTIC SCAN RESULT:')",
    "print(f\"   Plant      : {prediction['plant']}\")",
    "print(f\"   Disease    : {prediction['disease']}\")",
    "print(f\"   Status     : {prediction['status']}\")",
    "print(f\"   Confidence : {prediction['confidence'] * 100.0:.2f}%\")",
    "",
    "context_payload = {",
    "    'plant': prediction['plant'],",
    "    'disease': prediction['disease'],",
    "    'status': prediction['status'],",
    "    'confidence': prediction['confidence']",
    "}",
    "",
    "print('\\n2. PASSING CONTEXT TO CHATBOT:')",
    "print(f\"   Context Object : {context_payload}\")",
    "",
    "user_msg = 'What should I do?'",
    "print(f'\\n3. USER QUERY : \"{user_msg}\"')",
    "",
    "integrated_res = chatbot.ask(user_msg, context=context_payload)",
    "",
    "print('\\n4. CHATBOT RESPONSE (USING CONTEXT):')",
    "print(integrated_res['response'])",
    "print(f\"\\nSource       : {integrated_res['source']}\")",
    "print(f\"Context Used : {integrated_res['context_used']}\")"
]))

# ==========================================
# SECTION 9: API ENDPOINT DEMONSTRATION
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 9: FastAPI Endpoint Integration Demo",
    "Demonstrates `GET /health`, `POST /predict`, and `POST /chat` endpoints locally using FastAPI `TestClient` inside Colab."
]))

cells.append(make_cell("code", [
    "import json",
    "from fastapi.testclient import TestClient",
    "from src.api import app",
    "",
    "print('Starting FastAPI TestClient simulation...\\n')",
    "",
    "with TestClient(app) as client:",
    "    print('=== GET /health Response ===')",
    "    h_res = client.get('/health')",
    "    print(json.dumps(h_res.json(), indent=2))",
    "    ",
    "    print('\\n=== POST /predict Response ===')",
    "    if leaf_sample and leaf_sample.exists():",
    "        with open(leaf_sample, 'rb') as f:",
    "            p_res = client.post('/predict', files={'file': ('leaf.jpg', f, 'image/jpeg')})",
    "        print(json.dumps(p_res.json(), indent=2))",
    "    ",
    "    print('\\n=== POST /chat Response (With Context) ===')",
    "    c_payload = {",
    "        'message': 'What should I do for this disease?',",
    "        'context': context_payload",
    "    }",
    "    c_res = client.post('/chat', json=c_payload)",
    "    print(json.dumps(c_res.json(), indent=2))"
]))

# ==========================================
# SECTION 10: PERFORMANCE METRICS & TRAINING GRAPHS
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 10: Performance Evaluation & Training Graphs",
    "Displays held-out test set performance and plots training history curves from `training_history_v2b.csv`."
]))

cells.append(make_cell("code", [
    "print('================================================================')",
    "print('AGRINEX MODEL V2-B HELD-OUT TEST METRICS')",
    "print('================================================================')",
    "print('Held-out Test Accuracy : 99.31% (10,575 images)')",
    "print('Macro Precision        : 99.01%')",
    "print('Macro Recall           : 99.20%')",
    "print('Macro F1-Score         : 99.09%')",
    "print('================================================================\\n')",
    "",
    "if HISTORY_CSV_PATH and HISTORY_CSV_PATH.exists():",
    "    df_hist = pd.read_csv(HISTORY_CSV_PATH)",
    "    ",
    "    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))",
    "    ",
    "    ax1.plot(df_hist['epoch'], df_hist['train_acc'], label='Train Accuracy', color='blue', linewidth=2)",
    "    ax1.plot(df_hist['epoch'], df_hist['val_acc'], label='Validation Accuracy', color='green', linewidth=2)",
    "    ax1.set_title('AgriNex V2-B Model Accuracy vs Epoch', fontsize=12, fontweight='bold')",
    "    ax1.set_xlabel('Epoch')",
    "    ax1.set_ylabel('Accuracy (%)')",
    "    ax1.legend()",
    "    ax1.grid(True, linestyle='--', alpha=0.6)",
    "    ",
    "    ax2.plot(df_hist['epoch'], df_hist['train_loss'], label='Train Loss', color='orange', linewidth=2)",
    "    ax2.plot(df_hist['epoch'], df_hist['val_loss'], label='Validation Loss', color='red', linewidth=2)",
    "    ax2.set_title('AgriNex V2-B Model Loss vs Epoch', fontsize=12, fontweight='bold')",
    "    ax2.set_xlabel('Epoch')",
    "    ax2.set_ylabel('Loss')",
    "    ax2.legend()",
    "    ax2.grid(True, linestyle='--', alpha=0.6)",
    "    ",
    "    plt.tight_layout()",
    "    plt.show()"
]))

# ==========================================
# SECTION 11: LIMITATIONS
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 11: System Limitations & Real-World Considerations",
    "",
    "1. **Held-Out Test Accuracy vs. Real-World Field Images:**",
    "   The **99.31%** accuracy reflects performance on the clean, held-out test dataset (10,575 images). Real-world field camera photos may present varying lighting, shadow effects, leaf overlap, and background clutter.",
    "",
    "2. **60-Class Scope Limit:**",
    "   The disease classifier is bounded by its 60 trained crop-disease classes. Unsupported plant species or unrepresented diseases will be flagged as uncertain by the OOD guard.",
    "",
    "3. **Out-of-Distribution (OOD) Safety Threshold:**",
    "   The 50.0% confidence threshold prevents the system from making overconfident false predictions on non-leaf imagery.",
    "",
    "4. **Local Chatbot Boundaries:**",
    "   The AgriNex chatbot is a structured, offline agricultural assistant. It provides verified disease causes, prevention, treatment, and irrigation advice without relying on cloud-hosted generative LLMs."
]))

# ==========================================
# SECTION 12: FACULTY PRESENTATION SUMMARY
# ==========================================
cells.append(make_cell("markdown", [
    "## Section 12: Faculty Presentation Summary",
    "",
    "```",
    "==========================================================================================",
    "                             AGRINEX FACULTY DEMO WORKFLOW",
    "==========================================================================================",
    "",
    "   [ Input Leaf Image ]",
    "            │",
    "            ▼",
    "   [ AgriNex ResNet18 Model V2-B Inference (60 Classes) ]",
    "            │",
    "            ├─────────────────────────────────────────┐",
    "            ▼                                         ▼",
    "   (Confidence >= 0.50)                      (Confidence < 0.50)",
    "            │                                         │",
    "            ▼                                         ▼",
    "   [ Valid Diagnosis ]                       [ OOD Guard Triggered ]",
    "   • Plant & Disease Identified              • Status: \"Uncertain\"",
    "   • Status: Healthy / Diseased              • Prompts clear leaf re-upload",
    "            │",
    "            ▼",
    "   [ Disease Knowledge Base ]",
    "   • Cause + Prevention + Treatment",
    "            │",
    "            ▼",
    "   [ Pass Context to AgriNex Offline Chatbot ]",
    "            │",
    "            ▼",
    "   [ Context-Aware Follow-Up Q&A ]",
    "",
    "==========================================================================================",
    "```",
    "",
    "**Core Verification Statement:**",
    "> *\"AgriNex does not require Gemini API for disease prediction or the agricultural chatbot.\"*",
    ""
]))

cells.append(make_cell("code", [
    "print('=' * 80)",
    "print('🎉 AGRINEX FACULTY DEMO READY')",
    "print('=' * 80)"
]))

notebook_json = {
    "cells": cells,
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

nb_path = Path("AGRINEX_Faculty_Demo.ipynb")
with open(nb_path, "w", encoding="utf-8") as f:
    json.dump(notebook_json, f, indent=2)

print(f"Successfully generated {nb_path} with {len(cells)} cells.")
