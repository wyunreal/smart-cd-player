import json
from pathlib import Path

import torch
import torch.nn as nn
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from torch.optim.lr_scheduler import ReduceLROnPlateau
from torch.utils.data import DataLoader

from dataset import HalfDigitDataset, compute_normalization, get_transforms, load_dataset
from export_onnx import export_to_onnx
from model import HalfDigitCNN

SOURCE_DIR = Path(__file__).parent.parent / "source-digits"
MODEL_DIR = Path(__file__).parent.parent / "model"
CHECKPOINT_PATH = Path(__file__).parent / "best_model.pt"

BATCH_SIZE = 16
MAX_EPOCHS = 100
EARLY_STOP_PATIENCE = 20
LR = 1e-3


def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(dim=1) == labels).sum().item()
        total += images.size(0)
    return total_loss / total, correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += images.size(0)
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(labels.cpu().tolist())
    return total_loss / total, correct / total, all_preds, all_labels


def main():
    device = torch.device("cpu")
    print(f"Using device: {device}")

    # Load dataset
    paths, labels, class_names = load_dataset(str(SOURCE_DIR))
    num_classes = len(class_names)
    print(f"Loaded {len(paths)} images across {num_classes} classes: {class_names}")

    # Stratified train/val split
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        paths, labels, test_size=0.2, stratify=labels, random_state=42
    )
    print(f"Train: {len(train_paths)}, Validation: {len(val_paths)}")

    # Compute normalization from training set
    mean, std = compute_normalization(train_paths)
    print(f"Normalization - mean: {mean:.4f}, std: {std:.4f}")

    # Create datasets
    train_dataset = HalfDigitDataset(
        train_paths, train_labels, get_transforms(mean, std, training=True)
    )
    val_dataset = HalfDigitDataset(
        val_paths, val_labels, get_transforms(mean, std, training=False)
    )

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    # Model, optimizer, scheduler, loss
    model = HalfDigitCNN(num_classes=num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    scheduler = ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
    criterion = nn.CrossEntropyLoss()

    param_count = sum(p.numel() for p in model.parameters())
    print(f"Model parameters: {param_count:,}")

    # Training loop
    best_val_acc = 0.0
    patience_counter = 0

    for epoch in range(MAX_EPOCHS):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        val_loss, val_acc, _, _ = evaluate(model, val_loader, criterion, device)
        scheduler.step(val_loss)

        lr = optimizer.param_groups[0]["lr"]
        print(
            f"Epoch {epoch + 1:3d}/{MAX_EPOCHS} | "
            f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f} | "
            f"LR: {lr:.6f}"
        )

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), CHECKPOINT_PATH)
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= EARLY_STOP_PATIENCE:
                print(f"Early stopping at epoch {epoch + 1}")
                break

    # Load best model and final evaluation
    model.load_state_dict(torch.load(CHECKPOINT_PATH, weights_only=True))
    _, final_acc, all_preds, all_labels = evaluate(
        model, val_loader, criterion, device
    )

    print(f"\nBest validation accuracy: {best_val_acc:.4f}")
    print("\nClassification Report:")
    print(
        classification_report(
            all_labels, all_preds, target_names=class_names
        )
    )
    print("Confusion Matrix:")
    print(confusion_matrix(all_labels, all_preds))

    # Export to ONNX
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    onnx_path = str(MODEL_DIR / "digit_classifier.onnx")
    export_to_onnx(model, onnx_path)

    # Write metadata
    metadata = {
        "input_width": 26,
        "input_height": 21,
        "input_channels": 1,
        "channel_extraction": "green",
        "mean": mean,
        "std": std,
        "class_labels": class_names,
        "validation_accuracy": best_val_acc,
    }
    metadata_path = MODEL_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata written: {metadata_path}")

    # Cleanup checkpoint
    CHECKPOINT_PATH.unlink(missing_ok=True)
    print("\nTraining complete!")


if __name__ == "__main__":
    main()
