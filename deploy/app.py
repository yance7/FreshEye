"""FreshEye - Fish Freshness Detection API with V1/V2 model support

Developed with TRAE IDE during the TRAE AI Creativity Competition.
Social Service Track · Author: 祈雨柒
"""
import os
import sys
import io
import json
import base64
import logging
import asyncio
import hashlib
import time
import threading
from collections import OrderedDict
from datetime import datetime
from contextlib import asynccontextmanager, contextmanager
from typing import Optional, Tuple, Dict, Any, Iterator

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
from PIL import Image, UnidentifiedImageError
# 与 MAX_IMAGE_DIM(4096) 保持自洽：4096x4096=16,777,216 为上限，
# 避免出现"文档允许 4096x4096，实际却被炸弹阈值拦截"的矛盾。
Image.MAX_IMAGE_PIXELS = 4096 * 4096
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
import uvicorn
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.fishfreshnet_v2_model import FishFreshNetV2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HEATMAP_JPEG_QUALITY = 85
PREDICTION_CACHE_TTL = 1800  # 30 分钟：鱼眼新鲜度是确定性结果，同一张图结果不变
CACHE_MAX_SIZE = 128
CORS_MAX_AGE = 600
MAX_IMAGE_DIM = 4096

_v1_model_path_candidates = ["src/storage/fishfreshnet_v1.pth"]
_v2_model_path_candidates = ["src/storage/fishfreshnet_v2.pth"]
_VALID_MODEL_VERSIONS = {"v1", "v2"}


def _resolve_model_path(env_var: str, candidates: list) -> str:
    env_val = os.getenv(env_var)
    if env_val and os.path.exists(env_val):
        return env_val
    for p in candidates:
        if os.path.exists(p):
            return p
    return candidates[0]


V1_MODEL_PATH = _resolve_model_path("V1_MODEL_PATH", _v1_model_path_candidates)
V2_MODEL_PATH = _resolve_model_path("V2_MODEL_PATH", _v2_model_path_candidates)


def _env_int(name: str, default: int) -> int:
    """安全解析整数型环境变量，非法值回退默认，避免启动崩溃。"""
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        logger.warning(f"环境变量 {name} 解析失败，使用默认值 {default}")
        return default


MAX_IMAGE_MB = _env_int("FISHFRESHNET_MAX_IMAGE_MB", 25)
MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024


class ChannelAttention(nn.Module):
    def __init__(self, channels: int, ratio: int = 16) -> None:
        super().__init__()
        hidden_channels = max(1, channels // ratio)
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.fc1 = nn.Conv2d(channels, hidden_channels, kernel_size=1, bias=False)
        self.relu = nn.ReLU(inplace=True)
        self.fc2 = nn.Conv2d(hidden_channels, channels, kernel_size=1, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = self.fc2(self.relu(self.fc1(self.avg_pool(x))))
        max_out = self.fc2(self.relu(self.fc1(self.max_pool(x))))
        return self.sigmoid(avg_out + max_out)


class SpatialAttention(nn.Module):
    def __init__(self, kernel_size: int = 7) -> None:
        super().__init__()
        padding = 3 if kernel_size == 7 else 1
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=padding, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        attention = torch.cat([avg_out, max_out], dim=1)
        return self.sigmoid(self.conv(attention))


class CBAM(nn.Module):
    def __init__(self, channels: int, ratio: int = 16, kernel_size: int = 7) -> None:
        super().__init__()
        self.channel_attention = ChannelAttention(channels, ratio)
        self.spatial_attention = SpatialAttention(kernel_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x * self.channel_attention(x)
        return x * self.spatial_attention(x)


class FishFreshNetV1(nn.Module):
    def __init__(self, num_classes: int = 3, dropout: float = 0.5, pretrained: bool = False) -> None:
        super().__init__()
        if pretrained:
            backbone = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        else:
            backbone = efficientnet_b0(weights=None)
        self.features = backbone.features
        self.attention = CBAM(channels=1280)
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(1280, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.features(x)
        features = self.attention(features)
        features = self.pool(features)
        features = torch.flatten(features, 1)
        return self.classifier(features)


def _load_state_dict_strict(model: nn.Module, checkpoint_path: str, dev: str) -> nn.Module:
    try:
        checkpoint = torch.load(checkpoint_path, map_location=dev, weights_only=True)
    except Exception as exc:
        raise RuntimeError(f"Failed to load weights from {checkpoint_path}: {exc}") from exc
    if isinstance(checkpoint, dict):
        for key in ["model", "state_dict", "model_state_dict"]:
            if key in checkpoint:
                checkpoint = checkpoint[key]
                break
    model.load_state_dict(checkpoint, strict=True)
    model.eval()
    model.to(dev)
    return model


def load_v1_model(dev: str) -> FishFreshNetV1:
    model = FishFreshNetV1(num_classes=3, pretrained=False)
    return _load_state_dict_strict(model, V1_MODEL_PATH, dev)


def load_v2_model(dev: str) -> FishFreshNetV2:
    model = FishFreshNetV2(num_classes=3, pretrained=False)
    return _load_state_dict_strict(model, V2_MODEL_PATH, dev)


preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

FRESHNESS_LABELS: Dict[int, str] = {0: "高度新鲜", 1: "新鲜", 2: "不新鲜"}
FRESHNESS_DESCRIPTIONS: Dict[int, str] = {
    0: "鱼眼清澈明亮，角膜透明，瞳孔清晰，表面有光泽",
    1: "鱼眼基本清澈，角膜略有浑浊，瞳孔可见，表面光泽减弱",
    2: "鱼眼浑浊，角膜不透明，瞳孔模糊，表面无光泽"
}


class PredictionResult(BaseModel):
    freshness_level: str
    freshness_label: int
    confidence_score: float
    all_probabilities: dict
    description: str
    timestamp: str
    model_version: str


class GradCAMResult(BaseModel):
    heatmap_image: str
    prediction: PredictionResult


v1_model: Optional[nn.Module] = None
v2_model: Optional[nn.Module] = None
device: Optional[str] = None
# 模型推理锁：Grad-CAM 依赖模块级 forward/backward hook，
# 并发推理会触发彼此已注册的 hook 导致特征/梯度串扰，故所有模型前向统一串行。
_inference_lock = threading.Lock()
_cache_lock = threading.Lock()


class _TTLCache:
    def __init__(self, maxsize: int = CACHE_MAX_SIZE, ttl: float = PREDICTION_CACHE_TTL):
        self._cache: "OrderedDict[str, Tuple[float, Any]]" = OrderedDict()
        self._maxsize = maxsize
        self._ttl = ttl

    def get(self, key: str) -> Optional[Any]:
        with _cache_lock:
            entry = self._cache.get(key)
            if entry is None:
                return None
            ts, val = entry
            if time.monotonic() - ts > self._ttl:
                del self._cache[key]
                return None
            self._cache.move_to_end(key)
            return val

    def set(self, key: str, val: Any) -> None:
        with _cache_lock:
            self._cache[key] = (time.monotonic(), val)
            self._cache.move_to_end(key)
            while len(self._cache) > self._maxsize:
                self._cache.popitem(last=False)

    def __len__(self) -> int:
        with _cache_lock:
            return len(self._cache)


_prediction_cache = _TTLCache()
_gradcam_cache = _TTLCache()


class _RateLimiter:
    """滑动窗口速率限制器（单实例内存版，适用于 HF Spaces 单副本部署）。

    - 桶数量有上限（_max_buckets），超过时淘汰最久未活动条目，防止伪造 IP 造成内存 DoS。
    - check() 每次调用顺带清理过期时间戳，保持桶内数据量受控。
    """

    def __init__(self, max_requests: int = 15, window_seconds: int = 60, max_buckets: int = 10000):
        self._max = max_requests
        self._window = window_seconds
        self._max_buckets = max_buckets
        self._buckets: "dict[str, list[float]]" = {}
        self._last_activity: "dict[str, float]" = {}
        self._lock = threading.Lock()

    def check(self, client_id: str) -> bool:
        now = time.monotonic()
        with self._lock:
            cutoff = now - self._window
            timestamps = self._buckets.get(client_id, [])
            timestamps = [t for t in timestamps if t > cutoff]
            if len(timestamps) >= self._max:
                self._buckets[client_id] = timestamps
                self._last_activity[client_id] = now
                return False
            # 桶数量超限时，淘汰最久未活动条目
            if client_id not in self._buckets and len(self._buckets) >= self._max_buckets:
                if self._last_activity:
                    oldest = min(self._last_activity, key=self._last_activity.get)
                    self._buckets.pop(oldest, None)
                    self._last_activity.pop(oldest, None)
            timestamps.append(now)
            self._buckets[client_id] = timestamps
            self._last_activity[client_id] = now
            return True


class _Metrics:
    """运行时指标统计，用于 /health 端点运维监控。"""

    def __init__(self):
        self._lock = threading.Lock()
        self.total_requests = 0
        self.cache_hits = 0
        self.total_inference_ms = 0.0
        self.inference_count = 0

    def record_request(self, inference_ms: float = 0.0, cache_hit: bool = False):
        with self._lock:
            self.total_requests += 1
            if cache_hit:
                self.cache_hits += 1
            if inference_ms > 0:
                self.total_inference_ms += inference_ms
                self.inference_count += 1

    def snapshot(self) -> dict:
        with self._lock:
            avg_ms = (self.total_inference_ms / self.inference_count) if self.inference_count else 0.0
            hit_rate = (self.cache_hits / self.total_requests) if self.total_requests else 0.0
            return {
                "total_requests": self.total_requests,
                "cache_hits": self.cache_hits,
                "cache_hit_rate": round(hit_rate, 4),
                "avg_inference_ms": round(avg_ms, 1),
                "inference_count": self.inference_count,
            }


_rate_limiter = _RateLimiter(max_requests=15, window_seconds=60)
_metrics = _Metrics()


def _cache_key(data: bytes, model_version: str) -> str:
    h = hashlib.blake2b(data, digest_size=16)
    return f"{h.hexdigest()}:{model_version}"


def _warmup_model(model: nn.Module, dev: str) -> None:
    dummy = torch.randn(1, 3, 224, 224, device=dev)
    with torch.no_grad():
        _ = model(dummy)
    if dev == "cuda":
        torch.cuda.synchronize()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global v1_model, v2_model, device

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"设备: {device}")

    v1_loaded = False
    v2_loaded = False

    try:
        logger.info(f"正在加载V1模型: {V1_MODEL_PATH}")
        v1_model = load_v1_model(device)
        v1_loaded = True
        logger.info("FishFreshNetV1 模型加载完成，正在预热...")
        _warmup_model(v1_model, device)
        logger.info("V1模型预热完成")
    except Exception as exc:
        logger.warning(f"V1模型加载失败（将继续尝试V2）: {exc}")
        v1_model = None

    try:
        logger.info(f"正在加载V2模型: {V2_MODEL_PATH}")
        v2_model = load_v2_model(device)
        v2_loaded = True
        logger.info("FishFreshNetV2 模型加载完成，正在预热...")
        _warmup_model(v2_model, device)
        logger.info("V2模型预热完成")
    except Exception as exc:
        logger.warning(f"V2模型加载失败: {exc}")
        v2_model = None

    if not v1_loaded and not v2_loaded:
        raise RuntimeError("V1和V2模型均加载失败，服务无法启动")

    if not v2_loaded and v1_loaded:
        logger.warning("V2模型不可用，降级为仅V1模型服务")

    yield


app = FastAPI(title="FreshEye（鲜眸） API", version="2.0.0", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1024)

_cors_env = os.getenv("CORS_ORIGINS", "").strip()
if _cors_env == "*":
    _cors_origins = ["*"]
elif _cors_env:
    _cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
else:
    _cors_origins = [
        "https://fresheye.yance777.com",
        "https://yance77777.github.io",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=CORS_MAX_AGE,
)


class HealthCheckFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if "/health" in msg and ("200" in msg or "GET /health" in msg):
                return False
        except Exception:
            pass
        return True


for _uvicorn_logger_name in ("uvicorn.access",):
    _ulog = logging.getLogger(_uvicorn_logger_name)
    _ulog.addFilter(HealthCheckFilter())


def _validate_model_version(model_version: str) -> str:
    if model_version not in _VALID_MODEL_VERSIONS:
        raise HTTPException(status_code=422, detail=f"无效的模型版本 '{model_version}'，请使用 v1 或 v2")
    return model_version


def _log_inference(endpoint: str, version: str, label: str, confidence: float,
                    duration_ms: float, cache_hit: bool, extra: Optional[Dict] = None) -> None:
    """结构化日志：单行 JSON，便于后续聚合分析模型线上表现。"""
    payload = {
        "event": "inference",
        "endpoint": endpoint,
        "model_version": version,
        "label": label,
        "confidence": round(confidence, 4),
        "duration_ms": round(duration_ms, 1),
        "cache_hit": cache_hit,
        "timestamp": datetime.now().isoformat(),
    }
    if extra:
        payload.update(extra)
    logger.info(json.dumps(payload, ensure_ascii=False))


def get_model(model_version: str = "v2") -> Tuple[nn.Module, str]:
    global v1_model, v2_model
    model_version = _validate_model_version(model_version)
    if model_version == "v1":
        if v1_model is not None:
            return v1_model, "v1"
        if v2_model is not None:
            logger.warning("请求V1模型但不可用，降级使用V2")
            return v2_model, "v2"
        raise HTTPException(status_code=503, detail="没有可用的模型")
    else:
        if v2_model is not None:
            return v2_model, "v2"
        if v1_model is not None:
            logger.warning("请求V2模型但不可用，降级使用V1")
            return v1_model, "v1"
        raise HTTPException(status_code=503, detail="没有可用的模型")


def overlay_heatmap(original_image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    if original_image.shape[:2] != (224, 224):
        original_image = np.array(Image.fromarray(original_image).resize((224, 224)))
    heatmap_colored = np.uint8(plt.cm.jet(heatmap)[:, :, :3] * 255)
    overlay = cv2.addWeighted(original_image, 1 - alpha, heatmap_colored, alpha, 0)
    return overlay


def _build_prediction_result(probs: torch.Tensor, predicted: torch.Tensor,
                              confidence: torch.Tensor, model_version_str: str) -> PredictionResult:
    label_idx = int(predicted.item())
    all_probs = probs[0].detach().cpu().numpy()
    return PredictionResult(
        freshness_level=FRESHNESS_LABELS[label_idx],
        freshness_label=label_idx,
        confidence_score=round(float(confidence.item()), 4),
        all_probabilities={FRESHNESS_LABELS[i]: float(all_probs[i]) for i in range(3)},
        description=FRESHNESS_DESCRIPTIONS[label_idx],
        timestamp=datetime.now().isoformat(),
        model_version=model_version_str
    )


def predict_image_with_model(image: Image.Image, model: nn.Module,
                              model_version_str: str, current_device: str) -> PredictionResult:
    input_tensor = preprocess(image).unsqueeze(0).to(current_device)
    if not _inference_lock.acquire(timeout=30):
        raise HTTPException(status_code=503, detail="模型推理队列繁忙，请稍后重试")
    try:
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)
    finally:
        _inference_lock.release()
    return _build_prediction_result(probs, predicted, confidence, model_version_str)


def load_image_from_bytes(data: bytes) -> Image.Image:
    try:
        img = Image.open(io.BytesIO(data))
        # 尺寸预校验：仅解析文件头即可获得宽高，无需完整解码，避免内存浪费
        w, h = img.size
        if w > MAX_IMAGE_DIM or h > MAX_IMAGE_DIM:
            raise HTTPException(status_code=400, detail=f"图片尺寸过大，最大允许 {MAX_IMAGE_DIM}x{MAX_IMAGE_DIM} 像素")
        img.load()
        return img.convert("RGB")
    except Image.DecompressionBombError as exc:
        raise HTTPException(status_code=400, detail="图片像素数过大，请压缩后重试") from exc
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="图片损坏或格式无效，请上传有效的 JPG/PNG/WebP 图片") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail="无法解析图片文件") from exc


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _is_webp_signature(data: bytes) -> bool:
    # WebP 容器为 RIFF 格式，但 RIFF 也可能承载 WAV/AVI 等文件，
    # 需精确校验第 8-12 字节的 "WEBP" 标识，避免误放行非 WebP 的 RIFF 文件。
    return len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP"


def validate_image_format(file: UploadFile, data: bytes) -> None:
    ct = (file.content_type or "").lower()
    if ct and ct not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="图片格式不支持，请上传 JPG/PNG/WebP")
    is_jpeg = data.startswith(b"\xff\xd8\xff")
    is_png = data.startswith(b"\x89PNG\r\n\x1a\n")
    if not (is_jpeg or is_png or _is_webp_signature(data)):
        raise HTTPException(status_code=400, detail="图片内容与格式不匹配")


async def read_limited_upload(file: UploadFile) -> bytes:
    if file.size is not None and file.size > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"图片过大，最大允许 {MAX_IMAGE_MB}MB")
    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail=f"图片过大，最大允许 {MAX_IMAGE_MB}MB")
    validate_image_format(file, data)
    return data


@contextmanager
def _gradcam_hooks(model: nn.Module) -> Iterator[Tuple[list, list]]:
    gradients_list: list = []
    feature_maps_list: list = []

    def save_grad(module: nn.Module, grad_input: tuple, grad_output: tuple) -> None:
        gradients_list.append(grad_output[0])

    def save_fmap(module: nn.Module, module_input: tuple, module_output: torch.Tensor) -> None:
        feature_maps_list.append(module_output)

    last_conv = model.features[-1]
    hook_grad = last_conv.register_full_backward_hook(save_grad)
    hook_fwd = last_conv.register_forward_hook(save_fmap)
    try:
        yield gradients_list, feature_maps_list
    finally:
        hook_grad.remove()
        hook_fwd.remove()


def _compute_cam_vectorized(gradients: torch.Tensor, feature_maps: torch.Tensor) -> np.ndarray:
    pooled = gradients.mean(dim=[0, 2, 3])
    cam = torch.einsum("c,chw->hw", pooled, feature_maps[0])
    cam = F.relu(cam)
    cam = cam - cam.min()
    cam_max = cam.max()
    if cam_max > 1e-8:
        cam = cam / cam_max
    else:
        cam = torch.zeros_like(cam)
    cam = F.interpolate(
        cam.unsqueeze(0).unsqueeze(0),
        size=(224, 224),
        mode="bilinear",
        align_corners=False,
    ).squeeze()
    return cam.detach().cpu().numpy()


def _encode_heatmap(overlay: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(overlay).save(buf, format="JPEG", quality=HEATMAP_JPEG_QUALITY, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def _predict_and_gradcam_sync(image: Image.Image, model: nn.Module,
                               model_version_str: str, current_device: str) -> Tuple[PredictionResult, str]:
    # 整个 Grad-CAM 流程（hook 注册、前向、反向）必须在推理锁内执行，
    # 否则并发请求会触发彼此注册的模块级 hook，导致热力图数据串扰。
    if not _inference_lock.acquire(timeout=30):
        raise HTTPException(status_code=503, detail="模型推理队列繁忙，请稍后重试")
    try:
        original = np.array(image.resize((224, 224)))
        input_tensor = preprocess(image).unsqueeze(0).to(current_device)
        model.eval()

        with _gradcam_hooks(model) as (gradients_list, feature_maps_list):
            input_tensor_gc = input_tensor.requires_grad_(True)
            try:
                with torch.enable_grad():
                    outputs = model(input_tensor_gc)
                    probs = F.softmax(outputs, dim=1)
                    confidence, predicted = torch.max(probs, 1)
                    label_idx = int(predicted.item())
                    model.zero_grad()
                    outputs[0, label_idx].backward()
            except Exception as exc:
                logger.warning(f"前向/反向传播失败，降级为纯预测: {exc}")
                with torch.no_grad():
                    outputs = model(input_tensor)
                    probs = F.softmax(outputs, dim=1)
                    confidence, predicted = torch.max(probs, 1)
                prediction = _build_prediction_result(probs, predicted, confidence, model_version_str)
                heatmap = np.zeros((224, 224), dtype=np.float32)
                overlay = overlay_heatmap(original, heatmap)
                heatmap_b64 = _encode_heatmap(overlay)
                return prediction, heatmap_b64

        prediction = _build_prediction_result(probs, predicted, confidence, model_version_str)

        try:
            if gradients_list and feature_maps_list:
                gradients = gradients_list[0]
                feature_maps = feature_maps_list[0].detach()
                heatmap = _compute_cam_vectorized(gradients, feature_maps)
                # 显式释放张量引用：仅 del 局部别名无法释放内存，
                # 需同时清空 hook 收集列表，避免引用滞留至函数返回
                gradients_list.clear()
                feature_maps_list.clear()
            else:
                heatmap = np.zeros((224, 224), dtype=np.float32)
        except Exception as exc:
            logger.warning(f"Grad-CAM 生成失败，降级为空热力图: {exc}")
            heatmap = np.zeros((224, 224), dtype=np.float32)

        overlay = overlay_heatmap(original, heatmap)
        heatmap_b64 = _encode_heatmap(overlay)
        return prediction, heatmap_b64
    finally:
        _inference_lock.release()


def _predict_from_bytes(data: bytes, model: nn.Module, version_str: str,
                         current_device: str) -> PredictionResult:
    image = load_image_from_bytes(data)
    return predict_image_with_model(image, model, version_str, current_device)


def _gradcam_from_bytes(data: bytes, model: nn.Module, version_str: str,
                         current_device: str) -> Tuple[PredictionResult, str]:
    image = load_image_from_bytes(data)
    return _predict_and_gradcam_sync(image, model, version_str, current_device)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "FreshEye",
        "v1_available": v1_model is not None,
        "v2_available": v2_model is not None,
        "device": device,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "FreshEye",
        "v1_loaded": v1_model is not None,
        "v2_loaded": v2_model is not None,
        "device": device,
        "cuda_available": torch.cuda.is_available(),
        "prediction_cache_size": len(_prediction_cache),
        "gradcam_cache_size": len(_gradcam_cache),
        "metrics": _metrics.snapshot(),
        "timestamp": datetime.now().isoformat(),
    }


def _check_rate_limit(request: Request):
    # 防绕过：客户端标识 = 连接 IP + X-Forwarded-For 最后一个转发地址。
    # HF Space 等反向代理会把真实客户端 IP *追加*到 XFF 末尾，而攻击者自填的
    # 伪造 XFF 只会出现在前面的位置——取末位 + 连接 IP 组合，攻击者无法仅靠伪造
    # XFF 头改变标识，从而规避按真实客户端的限流。
    connect_ip = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        forwarded_ips = [p.strip() for p in forwarded.split(",") if p.strip()]
        xff_last = forwarded_ips[-1] if forwarded_ips else "none"
    else:
        xff_last = "none"
    client_id = f"{connect_ip}|{xff_last}"
    if not _rate_limiter.check(client_id):
        raise HTTPException(status_code=429, detail="请求过于频繁，请稍后重试（每分钟限 15 次）")


@app.post("/predict", response_model=PredictionResult)
async def predict_freshness(
    request: Request,
    file: UploadFile = File(...),
    model_version: str = Query("v2", description="Model version: v1 or v2")
):
    _check_rate_limit(request)
    try:
        model, version_str = get_model(model_version)
        data = await read_limited_upload(file)
        key = _cache_key(data, version_str)
        cached = _prediction_cache.get(key)
        if cached is not None:
            _log_inference("/predict", version_str, cached.freshness_level,
                           cached.confidence_score, 0.0, cache_hit=True)
            _metrics.record_request(cache_hit=True)
            return cached
        t0 = time.monotonic()
        result = await asyncio.to_thread(_predict_from_bytes, data, model, version_str, device)
        duration_ms = (time.monotonic() - t0) * 1000
        _prediction_cache.set(key, result)
        _log_inference("/predict", version_str, result.freshness_level,
                       result.confidence_score, duration_ms, cache_hit=False)
        _metrics.record_request(inference_ms=duration_ms)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("predict failed")
        raise HTTPException(status_code=500, detail="图片预测失败，请稍后重试") from exc


@app.post("/predict_with_gradcam", response_model=GradCAMResult)
async def predict_with_gradcam(
    request: Request,
    file: UploadFile = File(...),
    model_version: str = Query("v2", description="Model version: v1 or v2")
):
    _check_rate_limit(request)
    try:
        model, version_str = get_model(model_version)
        data = await read_limited_upload(file)
        key = _cache_key(data, version_str)
        cached = _gradcam_cache.get(key)
        if cached is not None:
            _log_inference("/predict_with_gradcam", version_str, cached.prediction.freshness_level,
                           cached.prediction.confidence_score, 0.0, cache_hit=True)
            _metrics.record_request(cache_hit=True)
            return cached
        t0 = time.monotonic()
        prediction, heatmap_b64 = await asyncio.to_thread(
            _gradcam_from_bytes, data, model, version_str, device
        )
        duration_ms = (time.monotonic() - t0) * 1000
        result = GradCAMResult(heatmap_image=heatmap_b64, prediction=prediction)
        _gradcam_cache.set(key, result)
        _log_inference("/predict_with_gradcam", version_str, prediction.freshness_level,
                       prediction.confidence_score, duration_ms, cache_hit=False)
        _metrics.record_request(inference_ms=duration_ms)
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("predict_with_gradcam failed")
        raise HTTPException(status_code=500, detail="图片预测失败，请稍后重试") from exc


if __name__ == "__main__":
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
