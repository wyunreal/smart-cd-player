from pathlib import Path

import numpy as np
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


class HalfDigitDataset(Dataset):
    """
    Loads images from source-digits/{0..9}/*.png.
    Extracts the green channel as grayscale (green segments on black bg).
    """

    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        img = Image.open(self.image_paths[idx]).convert("RGB")
        green_channel = np.array(img)[:, :, 1]
        img_gray = Image.fromarray(green_channel, mode="L")

        if self.transform:
            img_gray = self.transform(img_gray)
        else:
            img_gray = transforms.ToTensor()(img_gray)

        return img_gray, self.labels[idx]


def load_dataset(source_dir):
    """Scan source-digits directory and return (paths, labels, class_names) lists.

    Discovers classes dynamically from subdirectory names.
    Digit folders (0-9) are sorted numerically first, then non-numeric
    folders (e.g. 'blank') are appended alphabetically.
    """
    source = Path(source_dir)
    subdirs = sorted(
        [d for d in source.iterdir() if d.is_dir() and not d.name.startswith(".")],
        key=lambda d: (not d.name.isdigit(), int(d.name) if d.name.isdigit() else d.name),
    )
    class_names = [d.name for d in subdirs]

    image_paths = []
    labels = []
    for label_idx, subdir in enumerate(subdirs):
        for img_file in sorted(subdir.glob("*.png")):
            image_paths.append(str(img_file))
            labels.append(label_idx)

    return image_paths, labels, class_names


def compute_normalization(image_paths):
    """Compute mean and std of the green channel across all images."""
    all_pixels = []
    for path in image_paths:
        img = Image.open(path).convert("RGB")
        green = np.array(img)[:, :, 1].astype(np.float32) / 255.0
        all_pixels.append(green.flatten())
    all_pixels = np.concatenate(all_pixels)
    return float(np.mean(all_pixels)), float(np.std(all_pixels))


def get_transforms(mean, std, training=True):
    """
    Returns torchvision transforms.
    Training: augmentation + normalize. Validation: just normalize.
    """
    if training:
        return transforms.Compose(
            [
                transforms.RandomAffine(
                    degrees=2,
                    translate=(0.05, 0.05),
                    scale=(0.95, 1.05),
                ),
                transforms.ColorJitter(brightness=0.3),
                transforms.ToTensor(),
                transforms.Normalize(mean=[mean], std=[std]),
            ]
        )
    else:
        return transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Normalize(mean=[mean], std=[std]),
            ]
        )
