from .models import (
    FishFreshNetV2,
    FishFreshNetV2A,
    FishFreshNetV2B,
    FishFreshNetV2C,
    FishFreshNetV2MSFF,
    FishFreshNetV2MobileNet,
    build_model,
)

FishFreshNetV2Lite = FishFreshNetV2A

__all__ = [
    "FishFreshNetV2",
    "FishFreshNetV2Lite",
    "FishFreshNetV2MSFF",
    "FishFreshNetV2MobileNet",
    "FishFreshNetV2A",
    "FishFreshNetV2B",
    "FishFreshNetV2C",
    "build_model",
]
