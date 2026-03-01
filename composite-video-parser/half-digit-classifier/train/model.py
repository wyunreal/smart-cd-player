import torch.nn as nn


class HalfDigitCNN(nn.Module):
    """
    Small CNN for classifying 26x21 grayscale images of 7-segment
    display bottom halves into digits 0-9.
    """

    def __init__(self, num_classes=10):
        super().__init__()
        self.features = nn.Sequential(
            # Conv block 1: 1 -> 16 channels, 26x21 -> 13x10
            nn.Conv2d(1, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            # Conv block 2: 16 -> 32 channels, 13x10 -> 6x5
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),  # 32 channels -> 32x1x1
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(32, 64),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(64, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x
