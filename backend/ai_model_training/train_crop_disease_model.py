"""
AgriNex Deep Learning Crop Disease Classifier & Non-Crop Filter
PyTorch Training & Quantization Pipeline for Agricultural Scanner
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, models, transforms
from torch.utils.data import DataLoader, WeightedRandomSampler

# 1. Dataset Configuration & Hyperparameters
DATASET_DIR = "./dataset"  # Standard PlantVillage + Non-Crop Negative Set
BATCH_SIZE = 32
NUM_EPOCHS = 25
LEARNING_RATE = 0.001
IMAGE_SIZE = (224, 224)
NUM_CLASSES = 39  # 38 PlantVillage Crop-Disease Classes + 1 Non-Crop Negative Class

# 2. Data Transformations & Augmentation (Preprocessing & Normalization)
data_transforms = {
    'train': transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])  # ImageNet Norm
    ]),
    'val': transforms.Compose([
        transforms.Resize(IMAGE_SIZE),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ]),
}

def build_model(num_classes=NUM_CLASSES):
    """
    Constructs a MobileNetV3-Large transfer learning architecture
    with custom classification head for 38 disease classes + non-crop gate.
    """
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    
    # Freeze backbone feature extractor
    for param in model.parameters():
        param.requires_grad = False
        
    # Custom head with Dropout & Linear layers
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 512),
        nn.Hardswish(),
        nn.Dropout(p=0.3),
        nn.Linear(512, num_classes)
    )
    return model

def train_pipeline(data_dir=DATASET_DIR):
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"[AgriNex AI] Training initialized on device: {device}")
    
    if not os.path.exists(data_dir):
        print(f"Dataset directory '{data_dir}' not found. Please refer to README.md to download PlantVillage dataset.")
        return

    image_datasets = {
        x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
        for x in ['train', 'val']
    }
    
    dataloaders = {
        x: DataLoader(image_datasets[x], batch_size=BATCH_SIZE, shuffle=True, num_workers=4)
        for x in ['train', 'val']
    }

    model = build_model().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3)

    best_acc = 0.0

    for epoch in range(NUM_EPOCHS):
        print(f"Epoch {epoch+1}/{NUM_EPOCHS}")
        for phase in ['train', 'val']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            epoch_loss = running_loss / len(image_datasets[phase])
            epoch_acc = running_corrects.double() / len(image_datasets[phase])

            print(f"{phase.capitalize()} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}")

            if phase == 'val':
                scheduler.step(epoch_loss)
                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    torch.save(model.state_dict(), "agrinex_crop_disease_mobilenetv3.pth")
                    print(f"--> Saved new best checkpoint with accuracy: {best_acc:.4f}")

    print(f"Training complete. Highest Validation Accuracy: {best_acc:.4f}")

if __name__ == "__main__":
    train_pipeline()
