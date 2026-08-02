import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models


class ECA(nn.Module):
    def __init__(self, channels: int, kernel_size: int = 3) -> None:
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.conv = nn.Conv1d(1, 1, kernel_size=kernel_size, padding=kernel_size // 2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.size()
        y = self.avg_pool(x).squeeze(-1).squeeze(-1)
        y = y.unsqueeze(1)
        y = self.conv(y)
        y = self.sigmoid(y).squeeze(1)
        return x * y.unsqueeze(-1).unsqueeze(-1)


class LightweightCRA(nn.Module):
    def __init__(self, channels: int, num_rings: int = 3, hidden: int = 64) -> None:
        super().__init__()
        self.num_rings = num_rings
        self.shared_proj = nn.Conv2d(channels, channels, kernel_size=1, groups=channels, bias=False)
        self.ring_mlp = nn.Sequential(
            nn.Linear(channels, hidden, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(hidden, num_rings, bias=False),
            nn.Softmax(dim=-1),
        )

    def _create_ring_masks(self, h: int, w: int, device: torch.device) -> list:
        cy, cx = h / 2.0, w / 2.0
        y_grid = torch.arange(h, device=device).float().unsqueeze(1).expand(h, w)
        x_grid = torch.arange(w, device=device).float().unsqueeze(0).expand(h, w)
        dist = torch.sqrt((y_grid - cy) ** 2 + (x_grid - cx) ** 2)
        max_dist = (cy ** 2 + cx ** 2) ** 0.5
        dist_norm = dist / (max_dist + 1e-6)
        masks = []
        for i in range(self.num_rings):
            lower = i / self.num_rings
            upper = (i + 1) / self.num_rings
            mask = ((dist_norm >= lower) & (dist_norm < upper)).float()
            masks.append(mask.unsqueeze(0).unsqueeze(0))
        mask_sum = torch.sum(torch.cat(masks, dim=0), dim=0, keepdim=True) + 1e-6
        return [m / mask_sum for m in masks]

    def _ring_weights(self, x: torch.Tensor):
        _, _, h, w = x.size()
        masks = self._create_ring_masks(h, w, x.device)
        descriptors = []
        for mask in masks:
            masked = x * mask
            descriptors.append(masked.sum(dim=[2, 3]) / (mask.sum() + 1e-6))
        descriptor = torch.stack(descriptors, dim=1).mean(dim=1)
        return self.ring_mlp(descriptor), masks

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, _, _, _ = x.size()
        ring_weights, masks = self._ring_weights(x)
        projected = self.shared_proj(x)
        attention = torch.zeros_like(projected[:, :1])
        for i, mask in enumerate(masks):
            weight = ring_weights[:, i].view(b, 1, 1, 1)
            attention = attention + weight * mask
        return projected * attention * self.num_rings


class CompactClassifier(nn.Module):
    def __init__(self, in_features: int, num_classes: int, dropout: float = 0.3) -> None:
        super().__init__()
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.dropout = nn.Dropout(p=dropout)
        self.fc = nn.Linear(in_features, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        return self.fc(x)


class FishFreshNetV2(nn.Module):
    def __init__(self, num_classes: int = 3, dropout: float = 0.3, pretrained: bool = True) -> None:
        super().__init__()
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        backbone = models.efficientnet_b0(weights=weights)
        self.features = backbone.features
        self.last_channels = 1280
        self.cra = LightweightCRA(self.last_channels, num_rings=3)
        self.attention = ECA(self.last_channels, kernel_size=3)
        self.classifier = CompactClassifier(self.last_channels, num_classes, dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.cra(x)
        x = self.attention(x)
        return self.classifier(x)
