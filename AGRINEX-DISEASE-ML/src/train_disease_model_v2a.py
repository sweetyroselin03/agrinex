"""
AgriNex Disease ML - Model V2-A Training Pipeline (39 Classes)

Trains a ResNet18 plant disease classification model with 39 classes (38 PlantVillage
+ 1 Background/Non-Crop negative class), real-world data expansion, and field noise augmentations.

Preserves V1 completely untouched.

Outputs:
  - Checkpoint          : models/agrinex_disease_model_v2a_best.pth
  - Training History    : results/training_history_v2a.csv
  - Classification Rep  : results/classification_report_v2a.txt
  - Confusion Matrix    : results/confusion_matrix_v2a.png
"""

import sys
import time
import os
from pathlib import Path
from typing import Dict, Any, List, Tuple

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, models, datasets
from PIL import Image, ImageFile

from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support

ImageFile.LOAD_TRUNCATED_IMAGES = True

# Configure unbuffered output for real-time logging
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    except Exception:
        pass


def audit_dataset(v2a_dir: Path) -> Dict[str, Any]:
    """Audits the v2_augmented dataset structure, per-class counts, and checks for zero-sample classes."""
    train_dir = v2a_dir / "train"
    val_dir = v2a_dir / "val"
    test_dir = v2a_dir / "test"

    train_ds = datasets.ImageFolder(train_dir, allow_empty=True)
    val_ds = datasets.ImageFolder(val_dir, allow_empty=True)
    test_ds = datasets.ImageFolder(test_dir, allow_empty=True)

    class_names = train_ds.classes
    num_classes = len(class_names)

    class_counts = {}
    empty_classes = []

    for cls in class_names:
        tr_cnt = len(list((train_dir / cls).glob("*")))
        va_cnt = len(list((val_dir / cls).glob("*")))
        te_cnt = len(list((test_dir / cls).glob("*")))
        tot = tr_cnt + va_cnt + te_cnt

        class_counts[cls] = {"train": tr_cnt, "val": va_cnt, "test": te_cnt, "total": tot}
        if tot == 0:
            empty_classes.append(cls)

    return {
        "num_classes": num_classes,
        "class_names": class_names,
        "train_count": len(train_ds),
        "val_count": len(val_ds),
        "test_count": len(test_ds),
        "total_count": len(train_ds) + len(val_ds) + len(test_ds),
        "class_counts": class_counts,
        "empty_classes": empty_classes
    }


def train_one_epoch(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    scaler: torch.amp.GradScaler,
    device: torch.device
) -> Tuple[float, float]:
    """Trains model for one epoch using Automatic Mixed Precision (AMP)."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
        optimizer.zero_grad(set_to_none=True)

        with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
            outputs = model(images)
            loss = criterion(outputs, labels)

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc


@torch.no_grad()
def evaluate(
    model: nn.Module,
    dataloader: DataLoader,
    criterion: nn.Module,
    device: torch.device
) -> Tuple[float, float, np.ndarray, np.ndarray]:
    """Evaluates model on validation or test dataset."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    all_preds = []
    all_targets = []

    for images, labels in dataloader:
        images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)

        with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
            outputs = model(images)
            loss = criterion(outputs, labels)

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

        all_preds.extend(preds.cpu().numpy())
        all_targets.extend(labels.cpu().numpy())

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc, np.array(all_preds), np.array(all_targets)


def main():
    BASE_DIR = Path(__file__).resolve().parent.parent
    V2A_DATASET_DIR = BASE_DIR / "data" / "raw" / "v2_augmented"
    MODELS_DIR = BASE_DIR / "models"
    RESULTS_DIR = BASE_DIR / "results"

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    CHECKPOINT_PATH = MODELS_DIR / "agrinex_disease_model_v2a_best.pth"
    HISTORY_PATH = RESULTS_DIR / "training_history_v2a.csv"
    REPORT_PATH = RESULTS_DIR / "classification_report_v2a.txt"
    CONF_MATRIX_PATH = RESULTS_DIR / "confusion_matrix_v2a.png"

    print("=" * 80)
    print("AGRINEX DISEASE MODEL V2-A TRAINING PIPELINE")
    print("=" * 80)

    # 1. Device Selection
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None (Using CPU)"

    print(f"💻 Device Selection       : {device.type.upper()}")
    print(f"🎮 GPU Device Name       : {gpu_name}")

    # 2. Pre-Training Dataset Audit
    print("\n🔍 Running Pre-Training Dataset Audit...")
    audit = audit_dataset(V2A_DATASET_DIR)

    num_classes = audit["num_classes"]
    class_names = audit["class_names"]

    print(f"📊 Total V2-A Classes     : {num_classes}")
    print(f"🖼️  Train Set Images       : {audit['train_count']:,}")
    print(f"🖼️  Validation Set Images  : {audit['val_count']:,}")
    print(f"🖼️  Test Set Images        : {audit['test_count']:,}")
    print(f"🖼️  Total Dataset Size     : {audit['total_count']:,}")

    if audit["empty_classes"]:
        print(f"\n⚠️  EMPTY CLASS DETECTED ({len(audit['empty_classes'])} class):")
        for empty_cls in audit["empty_classes"]:
            print(f"   • '{empty_cls}' currently contains 0 training/validation/test samples.")
        print("📌 NOTE ON NEGATIVE CLASS HANDLING:")
        print("   The 39th linear output head ('Background_Or_Non_Crop_Leaf') is preserved in the architecture.")
        print("   Because it currently has 0 training samples, the model will train normally across the 38 active")
        print("   disease classes. Out-Of-Distribution (OOD) rejection for this specific class cannot be trained")
        print("   or evaluated until negative background images are provided. Model training will safely proceed.\n")

    # 3. Field-Oriented Data Augmentation & Normalization
    train_transforms = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0), ratio=(0.85, 1.15)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=25),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomApply([transforms.GaussianBlur(kernel_size=5, sigma=(0.1, 1.5))], p=0.3),
        transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
        transforms.ToTensor(),
        transforms.RandomErasing(p=0.25, scale=(0.02, 0.20)),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_test_transforms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # 4. Load Datasets & DataLoaders
    train_dataset = datasets.ImageFolder(V2A_DATASET_DIR / "train", transform=train_transforms, allow_empty=True)
    val_dataset = datasets.ImageFolder(V2A_DATASET_DIR / "val", transform=val_test_transforms, allow_empty=True)
    test_dataset = datasets.ImageFolder(V2A_DATASET_DIR / "test", transform=val_test_transforms, allow_empty=True)

    initial_batch_size = 32
    num_workers = 2
    batch_size = initial_batch_size

    def create_loaders(bs: int):
        train_ldr = DataLoader(train_dataset, batch_size=bs, shuffle=True, num_workers=num_workers, pin_memory=True)
        val_ldr = DataLoader(val_dataset, batch_size=bs, shuffle=False, num_workers=num_workers, pin_memory=True)
        test_ldr = DataLoader(test_dataset, batch_size=bs, shuffle=False, num_workers=num_workers, pin_memory=True)
        return train_ldr, val_ldr, test_ldr

    train_loader, val_loader, test_loader = create_loaders(batch_size)

    # 5. Initialize Model Architecture (ResNet18 with 39 Classes)
    print("🏗️  Initializing ResNet18 backbone with ImageNet pretrained weights...")
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    model.to(device)

    # 6. Loss Function, Optimizer & Scaler
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))

    num_epochs = 10
    best_val_acc = 0.0
    history = []

    print(f"\n🚀 Starting Training Loop ({num_epochs} Epochs, Initial Batch Size: {batch_size}, LR: 1e-4)...")
    print("=" * 80)
    start_train_time = time.time()

    for epoch in range(1, num_epochs + 1):
        epoch_start = time.time()

        try:
            train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, scaler, device)
        except torch.cuda.OutOfMemoryError:
            print(f"\n⚠️  CUDA OutOfMemoryError detected at batch size {batch_size}! Reducing batch size to 16...")
            torch.cuda.empty_cache()
            batch_size = 16
            train_loader, val_loader, test_loader = create_loaders(batch_size)
            train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, scaler, device)

        val_loss, val_acc, _, _ = evaluate(model, val_loader, criterion, device)
        epoch_time = time.time() - epoch_start

        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "train_acc": train_acc,
            "val_loss": val_loss,
            "val_acc": val_acc,
            "epoch_time_sec": epoch_time
        })

        is_best = val_acc > best_val_acc
        if is_best:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "class_names": class_names,
                "num_classes": num_classes,
                "model_name": "resnet18",
                "image_size": 224
            }, CHECKPOINT_PATH)
            best_mark = "⭐ (Best Saved)"
        else:
            best_mark = ""

        print(
            f"Epoch [{epoch:2d}/{num_epochs:2d}] ({epoch_time:5.1f}s) | "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc * 100:6.2f}% | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc * 100:6.2f}% {best_mark}"
        )

    total_train_time = time.time() - start_train_time
    print("=" * 80)
    print(f"🎉 Training Complete! Total Duration: {total_train_time / 60:.2f} minutes")
    print(f"🏆 Best Validation Accuracy: {best_val_acc * 100:.2f}%")

    # Save training history CSV
    df_history = pd.DataFrame(history)
    df_history.to_csv(HISTORY_PATH, index=False)
    print(f"📄 Training history saved to: {HISTORY_PATH}")

    # 7. Post-Training Evaluation & Verification
    print("\n🔍 Running Evaluation on Test Set using Best Saved Checkpoint...")
    if not CHECKPOINT_PATH.exists():
        raise FileNotFoundError(f"❌ Checkpoint file missing: {CHECKPOINT_PATH}")

    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_loss, test_acc, test_preds, test_targets = evaluate(model, test_loader, criterion, device)

    # Calculate overall metrics
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(test_targets, test_preds, average="macro", zero_division=0)
    w_prec, w_rec, w_f1, _ = precision_recall_fscore_support(test_targets, test_preds, average="weighted", zero_division=0)

    print("\n" + "=" * 80)
    print("AGRINEX V2-A MODEL TEST EVALUATION METRICS")
    print("=" * 80)
    print(f"🎯 Test Accuracy           : {test_acc * 100:.2f}%")
    print(f"📊 Macro Precision        : {macro_prec * 100:.2f}%")
    print(f"📊 Macro Recall           : {macro_rec * 100:.2f}%")
    print(f"📊 Macro F1-Score         : {macro_f1 * 100:.2f}%")
    print(f"📊 Weighted Precision     : {w_prec * 100:.2f}%")
    print(f"📊 Weighted Recall        : {w_rec * 100:.2f}%")
    print(f"📊 Weighted F1-Score      : {w_f1 * 100:.2f}%")
    print("=" * 80)

    # 8. Generate & Save Classification Report
    cls_report = classification_report(
        test_targets,
        test_preds,
        target_names=class_names,
        labels=list(range(num_classes)),
        digits=4,
        zero_division=0
    )

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("AGRINEX V2-A MODEL CLASSIFICATION REPORT (39 CLASSES)\n")
        f.write("=" * 70 + "\n")
        f.write(f"Model Architecture  : ResNet18\n")
        f.write(f"Best Val Accuracy   : {best_val_acc * 100:.2f}%\n")
        f.write(f"Final Test Accuracy : {test_acc * 100:.2f}%\n")
        f.write(f"Total Training Time : {total_train_time / 60:.2f} mins\n")
        f.write("=" * 70 + "\n\n")
        f.write(cls_report)

    print(f"📄 Classification report saved to: {REPORT_PATH}")

    # 9. Generate & Save Confusion Matrix Plot
    cm = confusion_matrix(test_targets, test_preds, labels=list(range(num_classes)))
    fig, ax = plt.subplots(figsize=(20, 18))
    sns.heatmap(cm, annot=False, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names, ax=ax)
    ax.set_title("AgriNex Disease Model V2-A Confusion Matrix (39 Classes)", fontsize=16, fontweight="bold")
    ax.set_xlabel("Predicted Class Index", fontsize=12)
    ax.set_ylabel("True Class Index", fontsize=12)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    plt.savefig(CONF_MATRIX_PATH, dpi=300)
    plt.close()
    print(f"🖼️  Confusion matrix saved to: {CONF_MATRIX_PATH}")

    # 10. Final Checkpoint Verification Test
    print("\n🔍 Verifying V2-A Checkpoint Loading Parity...")
    test_chk = torch.load(CHECKPOINT_PATH, map_location="cpu")
    assert test_chk["num_classes"] == 39, "Verification Error: Checkpoint num_classes != 39"
    assert test_chk["model_name"] == "resnet18", "Verification Error: Checkpoint model_name != resnet18"
    assert len(test_chk["class_names"]) == 39, "Verification Error: Checkpoint class_names length != 39"
    print("✅ V2-A Checkpoint Reload Verification: PASSED SUCCESSFULLY!")
    print("\n🎉 AGRINEX V2-A Model Training Pipeline Completed Successfully!\n")


if __name__ == "__main__":
    main()
