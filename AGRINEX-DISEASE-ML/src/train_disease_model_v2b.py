import os
import time
import csv
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support
import seaborn as sns
from pathlib import Path

# Paths
BASE_DIR = Path(".")
DATA_DIR = BASE_DIR / "data" / "raw" / "agrinex_unified"
TRAIN_DIR = DATA_DIR / "train"
VAL_DIR = DATA_DIR / "val"
TEST_DIR = DATA_DIR / "test"

MODELS_DIR = BASE_DIR / "models"
RESULTS_DIR = BASE_DIR / "results"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_SAVE_PATH = MODELS_DIR / "agrinex_disease_model_v2b_best.pth"
TRAIN_HISTORY_CSV = RESULTS_DIR / "training_history_v2b.csv"
CLASSIFICATION_REPORT_TXT = RESULTS_DIR / "classification_report_v2b.txt"
CONFUSION_MATRIX_PNG = RESULTS_DIR / "confusion_matrix_v2b.png"

# Hyperparameters
BATCH_SIZE = 32
NUM_WORKERS = 2
EPOCHS = 10
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
LABEL_SMOOTHING = 0.05
IMAGE_SIZE = 224
SEED = 42

torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed(SEED)

def get_transforms():
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=25),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 2.0)),
        transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.2))
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return train_transform, val_test_transform

def inspect_datasets():
    train_classes = sorted(os.listdir(TRAIN_DIR))
    val_classes = sorted(os.listdir(VAL_DIR))
    test_classes = sorted(os.listdir(TEST_DIR))

    assert train_classes == val_classes == test_classes, "Train, Val, and Test class lists do not match!"
    num_classes = len(train_classes)

    print("=" * 80)
    print("AGRINEX V2-B PRE-TRAINING AUDIT & DATASET INSPECTION")
    print("=" * 80)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device:               {device}")
    if device.type == "cuda":
        print(f"GPU Name:             {torch.cuda.get_device_name(0)}")
    print(f"Batch Size:           {BATCH_SIZE}")
    print(f"Number of Classes:    {num_classes}")

    train_counts = {c: len(os.listdir(TRAIN_DIR / c)) for c in train_classes}
    val_counts = {c: len(os.listdir(VAL_DIR / c)) for c in val_classes}
    test_counts = {c: len(os.listdir(TEST_DIR / c)) for c in test_classes}

    total_train = sum(train_counts.values())
    total_val = sum(val_counts.values())
    total_test = sum(test_counts.values())

    print(f"Total Train Images:   {total_train}")
    print(f"Total Val Images:     {total_val}")
    print(f"Total Test Images:    {total_test}")
    print(f"Total Combined:       {total_train + total_val + total_test}")

    min_cnt = min(train_counts.values())
    max_cnt = max(train_counts.values())
    imbalance_ratio = max_cnt / min_cnt

    print(f"\nClass Imbalance Metrics (Train):")
    print(f"  - Smallest Class:  {min_cnt} images")
    print(f"  - Largest Class:   {max_cnt} images")
    print(f"  - Imbalance Ratio: {imbalance_ratio:.2f}x")

    print("\nPer-Class Breakdown:")
    print(f"{'Class Name':<50} | {'Train':<7} | {'Val':<7} | {'Test':<7} | {'Total':<7}")
    print("-" * 85)
    for c in train_classes:
        tr, va, te = train_counts[c], val_counts[c], test_counts[c]
        print(f"{c:<50} | {tr:<7} | {va:<7} | {te:<7} | {tr+va+te:<7}")
    print("=" * 80 + "\n")

    return train_classes, train_counts

def build_model(num_classes):
    weights = models.ResNet18_Weights.DEFAULT
    model = models.resnet18(weights=weights)
    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model

def train_one_epoch(model, loader, criterion, optimizer, scaler, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()

        with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
            outputs = model(images)
            loss = criterion(outputs, labels)

        if device.type == 'cuda':
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def evaluate(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    all_preds = []
    all_labels = []

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            with torch.amp.autocast('cuda', enabled=(device.type == 'cuda')):
                outputs = model(images)
                loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc, np.array(all_preds), np.array(all_labels)

def main():
    train_classes, train_counts = inspect_datasets()
    num_classes = len(train_classes)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_tf, val_tf = get_transforms()

    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_tf)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_tf)
    test_dataset = datasets.ImageFolder(TEST_DIR, transform=val_tf)

    assert train_dataset.classes == train_classes, "Dataset class indices do not match inspected train_classes!"

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=NUM_WORKERS, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=NUM_WORKERS, pin_memory=True)

    # Class weights calculation for CrossEntropyLoss
    counts_tensor = torch.tensor([train_counts[c] for c in train_classes], dtype=torch.float32)
    total_samples = float(sum(train_counts.values()))
    class_weights = total_samples / (num_classes * counts_tensor)
    class_weights = class_weights.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=LABEL_SMOOTHING)
    model = build_model(num_classes).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
    scaler = torch.amp.GradScaler('cuda', enabled=(device.type == 'cuda'))

    best_val_acc = 0.0
    history = []

    print("=" * 80)
    print("STARTING TRAINING (AGRINEX MODEL V2-B - 60 CLASSES)")
    print("=" * 80)

    start_time = time.time()
    for epoch in range(1, EPOCHS + 1):
        ep_start = time.time()
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, scaler, device)
        val_loss, val_acc, _, _ = evaluate(model, val_loader, criterion, device)
        scheduler.step()
        ep_time = time.time() - ep_start

        current_lr = optimizer.param_groups[0]['lr']
        print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] | Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.2f}% | Val Loss: {val_loss:.4f} | Val Acc: {val_acc*100:.2f}% | LR: {current_lr:.6f} | Time: {ep_time:.1f}s")

        history.append({
            'epoch': epoch,
            'train_loss': train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'val_acc': val_acc,
            'lr': current_lr
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'class_names': train_classes,
                'num_classes': num_classes
            }, MODEL_SAVE_PATH)
            print(f"  --> Saved new best checkpoint to {MODEL_SAVE_PATH} (Val Acc: {val_acc*100:.2f}%)")

    total_time = time.time() - start_time
    print(f"\nTraining completed in {total_time/60:.2f} minutes. Best Val Acc: {best_val_acc*100:.2f}%")

    # Save training history CSV
    with open(TRAIN_HISTORY_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['epoch', 'train_loss', 'train_acc', 'val_loss', 'val_acc', 'lr'])
        writer.writeheader()
        writer.writerows(history)

    # Reload best model checkpoint for evaluation
    print("\n" + "=" * 80)
    print("RELOADING BEST CHECKPOINT & EVALUATING ON HELD-OUT TEST SET")
    print("=" * 80)

    checkpoint = torch.load(MODEL_SAVE_PATH, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])

    test_loss, test_acc, test_preds, test_labels = evaluate(model, test_loader, criterion, device)
    precision, recall, f1, _ = precision_recall_fscore_support(test_labels, test_preds, average='macro')

    print(f"Held-out Test Loss:     {test_loss:.4f}")
    print(f"Held-out Test Accuracy: {test_acc*100:.2f}%")
    print(f"Macro Precision:        {precision*100:.2f}%")
    print(f"Macro Recall:           {recall*100:.2f}%")
    print(f"Macro F1 Score:         {f1*100:.2f}%")

    # Save Classification Report
    cls_report = classification_report(test_labels, test_preds, target_names=train_classes, digits=4)
    with open(CLASSIFICATION_REPORT_TXT, 'w', encoding='utf-8') as f:
        f.write("================================================================================\n")
        f.write("AGRINEX MODEL V2-B HELD-OUT TEST EVALUATION REPORT\n")
        f.write("================================================================================\n\n")
        f.write(f"Best Val Accuracy:      {best_val_acc*100:.2f}%\n")
        f.write(f"Held-out Test Accuracy: {test_acc*100:.2f}%\n")
        f.write(f"Macro Precision:        {precision*100:.2f}%\n")
        f.write(f"Macro Recall:           {recall*100:.2f}%\n")
        f.write(f"Macro F1 Score:         {f1*100:.2f}%\n\n")
        f.write("--- DETAILED CLASSIFICATION REPORT ---\n")
        f.write(cls_report)

    print(f"Classification report saved to: {CLASSIFICATION_REPORT_TXT}")

    # Generate Confusion Matrix Plot
    cm = confusion_matrix(test_labels, test_preds)
    plt.figure(figsize=(24, 20))
    sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', xticklabels=train_classes, yticklabels=train_classes)
    plt.title(f'AGRINEX V2-B Confusion Matrix (60 Classes, Test Acc: {test_acc*100:.2f}%)', fontsize=16)
    plt.xlabel('Predicted Label', fontsize=12)
    plt.ylabel('True Label', fontsize=12)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    plt.savefig(CONFUSION_MATRIX_PNG, dpi=300)
    plt.close()

    print(f"Confusion matrix plot saved to: {CONFUSION_MATRIX_PNG}")

    # Comparison against Model V1 and Model V2-A
    print("\n" + "=" * 80)
    print("MODEL COMPARISON (V1 vs V2-A vs V2-B)")
    print("=" * 80)
    print(f"Model V1   (38 classes, PlantVillage Baseline) : 99.20% Test Acc")
    print(f"Model V2-A (39 classes, PV + Background Class): 99.00% Test Acc")
    print(f"Model V2-B (60 classes, Unified Multi-Dataset): {test_acc*100:.2f}% Test Acc")
    print("-" * 80)
    print("NOTE ON REAL-WORLD GENERALIZATION:")
    print("High accuracy on held-out dataset splits evaluates consistency across standard benchmarks.")
    print("Out-of-distribution real-world field generalization will be evaluated separately.")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
