"""
AgriNex Disease ML - PyTorch ResNet18 Training Pipeline

Trains a 38-class plant disease classification model using:
- PyTorch & ResNet18 pretrained on ImageNet
- 224x224 input images
- RTX 3050 Laptop GPU (CUDA mixed precision with torch.amp)
- AdamW optimizer (lr=1e-4) & CrossEntropyLoss
- 10 epochs
"""

import sys
import time
import copy
from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from torchvision.models import ResNet18_Weights
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from PIL import ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass



def train_model():
    # 1. Directory Setup
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data" / "raw" / "PlantVillage"
    MODELS_DIR = BASE_DIR / "models"
    RESULTS_DIR = BASE_DIR / "results"

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    train_dir = DATA_DIR / "train"
    val_dir = DATA_DIR / "val"
    test_dir = DATA_DIR / "test"

    # Verify folder existence
    if not (train_dir.exists() and val_dir.exists() and test_dir.exists()):
        print(f"❌ Error: Dataset directories missing in {DATA_DIR}. Required: train/, val/, test/")
        sys.exit(1)

    # 2. Class Verification (Deterministic Sorted Order)
    train_classes = sorted([d.name for d in train_dir.iterdir() if d.is_dir()])
    val_classes = sorted([d.name for d in val_dir.iterdir() if d.is_dir()])
    test_classes = sorted([d.name for d in test_dir.iterdir() if d.is_dir()])

    if len(train_classes) != 38 or train_classes != val_classes or train_classes != test_classes:
        print("❌ Error: Dataset class verification failed!")
        print(f"   Train class count: {len(train_classes)}")
        print(f"   Val class count  : {len(val_classes)}")
        print(f"   Test class count : {len(test_classes)}")
        print(f"   Classes identical: {train_classes == val_classes == test_classes}")
        sys.exit(1)

    class_names = train_classes
    num_classes = len(class_names)
    print("✅ Dataset class verification passed! All splits contain 38 identical classes.")

    # 3. Data Transformations
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 4. Datasets and DataLoaders
    train_dataset = datasets.ImageFolder(root=str(train_dir), transform=train_transform)
    val_dataset = datasets.ImageFolder(root=str(val_dir), transform=val_test_transform)
    test_dataset = datasets.ImageFolder(root=str(test_dir), transform=val_test_transform)

    batch_size = 16
    num_workers = 2
    pin_memory = torch.cuda.is_available()

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers, pin_memory=pin_memory)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=pin_memory)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers, pin_memory=pin_memory)

    # 5. Device Setup & Pre-training Info
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A (CPU)"

    print("\n" + "=" * 75)
    print("AGRINEX PLANT DISEASE MODEL TRAINING CONFIGURATION")
    print("=" * 75)
    print(f"Device                  : {device}")
    print(f"GPU Name                : {gpu_name}")
    print(f"Number of Classes       : {num_classes}")
    print(f"Train Image Count       : {len(train_dataset)}")
    print(f"Validation Image Count   : {len(val_dataset)}")
    print(f"Test Image Count        : {len(test_dataset)}")
    print(f"Batch Size              : {batch_size}")
    print(f"Number of Workers       : {num_workers}")
    print(f"Class Names (38)        :\n{class_names}")
    print("=" * 75 + "\n")

    # 6. Model Initialization
    weights = ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

    # Mixed Precision Scaler
    scaler = torch.amp.GradScaler('cuda') if device.type == 'cuda' else None

    # Training State Tracking
    num_epochs = 10
    best_val_acc = 0.0
    best_model_wts = copy.deepcopy(model.state_dict())
    history = []

    best_model_path = MODELS_DIR / "agrinex_disease_model_best.pth"
    final_model_path = MODELS_DIR / "agrinex_disease_model_final.pth"

    # 7. Training Loop
    print("🚀 Starting Training Loop...")
    total_start_time = time.time()

    for epoch in range(num_epochs):
        epoch_start_time = time.time()

        # --- Training Phase ---
        model.train()
        running_train_loss = 0.0
        running_train_corrects = 0

        for inputs, labels in train_loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            optimizer.zero_grad()

            if scaler is not None:
                with torch.amp.autocast('cuda'):
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
                scaler.scale(loss).backward()
                scaler.step(optimizer)
                scaler.update()
            else:
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

            _, preds = torch.max(outputs, 1)
            running_train_loss += loss.item() * inputs.size(0)
            running_train_corrects += torch.sum(preds == labels.data).item()

        epoch_train_loss = running_train_loss / len(train_dataset)
        epoch_train_acc = (running_train_corrects / len(train_dataset)) * 100.0

        # --- Validation Phase ---
        model.eval()
        running_val_loss = 0.0
        running_val_corrects = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs = inputs.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)

                if scaler is not None:
                    with torch.amp.autocast('cuda'):
                        outputs = model(inputs)
                        loss = criterion(outputs, labels)
                else:
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)

                _, preds = torch.max(outputs, 1)
                running_val_loss += loss.item() * inputs.size(0)
                running_val_corrects += torch.sum(preds == labels.data).item()

        epoch_val_loss = running_val_loss / len(val_dataset)
        epoch_val_acc = (running_val_corrects / len(val_dataset)) * 100.0
        epoch_time = time.time() - epoch_start_time

        # Print per-epoch metrics
        print(f"Epoch {epoch + 1}/{num_epochs}")
        print(f"Train Loss: {epoch_train_loss:.4f}")
        print(f"Train Accuracy: {epoch_train_acc:.2f}%")
        print(f"Validation Loss: {epoch_val_loss:.4f}")
        print(f"Validation Accuracy: {epoch_val_acc:.2f}%")
        print(f"Epoch time: {epoch_time:.2f}s")

        history.append({
            "epoch": epoch + 1,
            "train_loss": epoch_train_loss,
            "train_acc": epoch_train_acc,
            "val_loss": epoch_val_loss,
            "val_acc": epoch_val_acc,
            "epoch_time": epoch_time
        })

        # Save best model check
        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            best_model_wts = copy.deepcopy(model.state_dict())

            checkpoint_best = {
                "model_state_dict": model.state_dict(),
                "class_names": class_names,
                "num_classes": num_classes,
                "model_name": "resnet18",
                "image_size": 224
            }
            torch.save(checkpoint_best, best_model_path)
            print(f"⭐ Saved new best model checkpoint to {best_model_path} (Val Acc: {best_val_acc:.2f}%)")

        print("-" * 50)

    total_training_time = time.time() - total_start_time
    print(f"\n✅ Training Complete in {total_training_time / 60:.2f} minutes! Best Val Acc: {best_val_acc:.2f}%")

    # 8. Save Final Model Checkpoint
    checkpoint_final = {
        "model_state_dict": model.state_dict(),
        "class_names": class_names,
        "num_classes": num_classes,
        "model_name": "resnet18",
        "image_size": 224
    }
    torch.save(checkpoint_final, final_model_path)
    print(f"💾 Saved final model checkpoint to {final_model_path}")

    # 9. Save Training History to CSV
    df_history = pd.DataFrame(history)
    history_csv_path = RESULTS_DIR / "training_history.csv"
    df_history.to_csv(history_csv_path, index=False)
    print(f"📊 Saved training history to {history_csv_path}")

    # 10. Post-Training Evaluation on Test Set
    print("\n" + "=" * 75)
    print("POST-TRAINING EVALUATION ON TEST SET (LOAD BEST MODEL)")
    print("=" * 75)

    best_checkpoint = torch.load(best_model_path, map_location=device)
    model.load_state_dict(best_checkpoint["model_state_dict"])
    model.eval()

    test_running_loss = 0.0
    test_running_corrects = 0
    all_preds = []
    all_targets = []

    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)

            if scaler is not None:
                with torch.amp.autocast('cuda'):
                    outputs = model(inputs)
                    loss = criterion(outputs, labels)
            else:
                outputs = model(inputs)
                loss = criterion(outputs, labels)

            _, preds = torch.max(outputs, 1)
            test_running_loss += loss.item() * inputs.size(0)
            test_running_corrects += torch.sum(preds == labels.data).item()

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())

    test_loss = test_running_loss / len(test_dataset)
    test_acc = (test_running_corrects / len(test_dataset)) * 100.0

    print(f"Test Loss    : {test_loss:.4f}")
    print(f"Test Accuracy: {test_acc:.2f}%\n")

    # 11. Classification Report
    cls_report = classification_report(all_targets, all_preds, target_names=class_names, digits=4)
    print("📋 Classification Report:")
    print(cls_report)

    report_path = RESULTS_DIR / "classification_report.txt"
    report_header = (
        f"AGRINEX DISEASE ML - MODEL EVALUATION REPORT\n"
        f"Model: ResNet18 (38 classes)\n"
        f"Test Loss: {test_loss:.4f}\n"
        f"Test Accuracy: {test_acc:.2f}%\n"
        f"{'=' * 80}\n\n"
    )
    report_path.write_text(report_header + cls_report, encoding='utf-8')
    print(f"✅ Saved classification report to {report_path}")

    # 12. Confusion Matrix Generation
    cm = confusion_matrix(all_targets, all_preds)
    plt.figure(figsize=(20, 16))
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues',
                xticklabels=class_names, yticklabels=class_names)
    plt.title(f'AgriNex 38-Class Plant Disease Confusion Matrix\nTest Accuracy: {test_acc:.2f}%', fontsize=16, fontweight='bold')
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()

    cm_path = RESULTS_DIR / "confusion_matrix.png"
    plt.savefig(cm_path, dpi=200, bbox_inches='tight')
    plt.close()
    print(f"🖼️ Saved confusion matrix plot to {cm_path}")

    print("\n" + "=" * 75)
    print("ALL TRAINING & EVALUATION TASKS COMPLETED SUCCESSFULLY!")
    print("=" * 75)


if __name__ == "__main__":
    train_model()
