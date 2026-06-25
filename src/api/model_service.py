"""FishFreshNetV1 model inference API."""
import os
import io
import base64
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict
from datetime import datetime

import torch
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import requests
import matplotlib.pyplot as plt
import cv2

# src/ 需在 sys.path 中以支持无前缀导入（from models... import）。
# 通过 uvicorn src.api.model_service:app 启动时，CWD 在 projects/，src/ 不自动入 path。
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
_SRC_ROOT = str(_PROJECT_ROOT / "src")
if _SRC_ROOT not in sys.path:
    sys.path.append(_SRC_ROOT)

from models.fishfreshnet_model import load_model  # noqa: E402

from utils.net import validate_url  # noqa: E402

logger = logging.getLogger(__name__)


def _parse_max_image_bytes() -> int:
    """解析最大图片字节数，对非法环境变量值容错。"""
    raw = os.getenv("FISHFRESHNET_MAX_IMAGE_MB", "25")
    try:
        return int(raw) * 1024 * 1024
    except (TypeError, ValueError):
        logger.warning("Invalid FISHFRESHNET_MAX_IMAGE_MB value '%s', falling back to 25", raw)
        return 25 * 1024 * 1024


MAX_IMAGE_BYTES = _parse_max_image_bytes()

model = None
device = None


def parse_cors_origins() -> list[str]:
    """解析 CORS 允许的来源。未配置时返回空列表（同源策略，安全默认）。"""
    cors_env = os.getenv("CORS_ORIGINS")
    if cors_env is None:
        return []
    origins = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model_on_startup()
    yield


app = FastAPI(
    title="FishFreshNetV1 API",
    description="鱼眼新鲜度分类服务",
    version="3.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

FRESHNESS_LABELS = {
    0: "高度新鲜",
    1: "新鲜",
    2: "不新鲜"
}

FRESHNESS_DESCRIPTIONS = {
    0: "鱼眼清澈明亮，角膜透明，瞳孔清晰，表面有光泽",
    1: "鱼眼基本清澈，角膜略有浑浊，瞳孔可见，表面光泽减弱",
    2: "鱼眼浑浊，角膜不透明，瞳孔模糊，表面无光泽"
}


class PredictionResult(BaseModel):
    """预测结果模型"""
    freshness_level: str
    freshness_label: int
    confidence_score: float
    all_probabilities: Dict[str, float]
    description: str
    timestamp: str


class GradCAMResult(BaseModel):
    """Grad-CAM结果模型"""
    heatmap_image: str  # base64编码的图像
    prediction: PredictionResult


def resolve_model_path() -> Path:
    env_path = os.getenv("FISHFRESHNET_MODEL_PATH")
    candidates = [
        Path(env_path) if env_path else None,
        _PROJECT_ROOT / "src" / "storage" / "fishfreshnet_v1.pth",
        _PROJECT_ROOT.parent / "fishfreshnet_v1.pth",
    ]
    for candidate in candidates:
        if candidate and candidate.exists():
            return candidate
    return _PROJECT_ROOT / "src" / "storage" / "fishfreshnet_v1.pth"


def load_model_on_startup() -> None:
    """应用启动时加载模型"""
    global model, device
    
    logger.info("🚀 正在加载FishFreshNetV1模型...")
    
    # 设置设备
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    logger.info(f"📱 使用设备: {device}")
    
    model_path = resolve_model_path()
    
    try:
        model = load_model(model_path, device)
        logger.info("✅ 模型加载成功")
    except Exception as e:
        logger.error(f"❌ 模型加载失败: {e}")
        raise


def ensure_model_loaded() -> None:
    if model is None or device is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")


async def read_limited_upload(file: UploadFile) -> bytes:
    data = await file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Uploaded image is too large")
    return data


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc


def predict_image(image: Image.Image) -> PredictionResult:
    ensure_model_loaded()
    input_tensor = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    label_idx = predicted.item()
    confidence_score = confidence.item()
    all_probs = probabilities[0].cpu().numpy()
    return PredictionResult(
        freshness_level=FRESHNESS_LABELS[label_idx],
        freshness_label=label_idx,
        confidence_score=round(confidence_score, 4),
        all_probabilities={
            FRESHNESS_LABELS[i]: float(all_probs[i])
            for i in range(3)
        },
        description=FRESHNESS_DESCRIPTIONS[label_idx],
        timestamp=datetime.now().isoformat()
    )


def download_image(image_url: str) -> Image.Image:
    try:
        validate_url(image_url)
        response = requests.get(image_url, timeout=10, stream=True, allow_redirects=False)
        response.raise_for_status()
        content_length = response.headers.get("content-length")
        if content_length and int(content_length) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Remote image is too large")
        data = response.raw.read(MAX_IMAGE_BYTES + 1, decode_content=True)
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Remote image is too large")
        return load_image_from_bytes(data)
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image URL: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch image: {exc}") from exc


@app.get("/")
async def root():
    """健康检查"""
    return {
        "status": "online",
        "model": "FishFreshNetV1",
        "device": device,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict", response_model=PredictionResult)
async def predict_freshness(file: UploadFile = File(...)):
    """
    预测鱼眼新鲜度
    
    Args:
        file: 上传的图片文件
    
    Returns:
        预测结果
    """
    try:
        image = load_image_from_bytes(await read_limited_upload(file))
        result = predict_image(image)
        
        logger.info(f"✅ 预测完成: {result.freshness_level} ({result.confidence_score:.2%})")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict_with_gradcam", response_model=GradCAMResult)
async def predict_with_gradcam(file: UploadFile = File(...)):
    """
    预测新鲜度并生成Grad-CAM热力图
    
    Args:
        file: 上传的图片文件
    
    Returns:
        预测结果和热力图
    """
    try:
        ensure_model_loaded()
        image = load_image_from_bytes(await read_limited_upload(file))
        original_image = np.array(image)
        input_tensor = preprocess(image).unsqueeze(0).to(device)
        prediction = predict_image(image)
        label_idx = prediction.freshness_label
        
        # 生成Grad-CAM
        heatmap = generate_gradcam(model, input_tensor, label_idx)
        
        # 叠加热力图到原图
        heatmap_overlay = overlay_heatmap(original_image, heatmap)
        
        # 转换为base64
        heatmap_pil = Image.fromarray(heatmap_overlay)
        buffered = io.BytesIO()
        heatmap_pil.save(buffered, format="JPEG", quality=95)
        heatmap_base64 = base64.b64encode(buffered.getvalue()).decode()
        
        result = GradCAMResult(
            heatmap_image=heatmap_base64,
            prediction=prediction
        )
        
        logger.info(f"✅ 预测+Grad-CAM完成: {prediction.freshness_level} ({prediction.confidence_score:.2%})")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_gradcam(model, input_tensor, target_class):
    """
    生成Grad-CAM热力图

    梯度和特征图必须来自同一层（features[-1]），确保归因正确。

    Args:
        model: 模型实例
        input_tensor: 输入张量
        target_class: 目标类别

    Returns:
        热力图数组
    """
    model.eval()

    gradients_list = []
    feature_maps_list = []

    def save_gradient(module, grad_input, grad_output):
        gradients_list.append(grad_output[0])

    def save_feature_map(module, input, output):
        feature_maps_list.append(output)

    last_conv_layer = model.features[-1]
    # 在同一层注册 forward hook 和 backward hook，确保梯度与特征图对应
    hook_grad = last_conv_layer.register_full_backward_hook(save_gradient)
    hook_fwd = last_conv_layer.register_forward_hook(save_feature_map)

    input_tensor.requires_grad_(True)

    output = model(input_tensor)

    model.zero_grad()
    output[0][target_class].backward(retain_graph=False)

    hook_grad.remove()
    hook_fwd.remove()

    if not gradients_list or not feature_maps_list:
        return np.zeros((224, 224))

    gradients = gradients_list[0]
    feature_maps = feature_maps_list[0].detach()
    
    pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
    
    cam = torch.zeros(feature_maps.shape[2:], dtype=torch.float32, device=device)
    for i in range(feature_maps.shape[1]):
        cam += pooled_gradients[i] * feature_maps[0, i, :, :]
    
    cam = F.relu(cam)
    
    cam = cam - cam.min()
    cam = cam / (cam.max() + 1e-8)
    
    # 上采样到原图大小
    cam = F.interpolate(
        cam.unsqueeze(0).unsqueeze(0),
        size=(224, 224),
        mode='bilinear',
        align_corners=False
    ).squeeze()
    
    return cam.cpu().numpy()


def overlay_heatmap(original_image, heatmap, alpha=0.4):
    """
    将热力图叠加到原图上
    
    Args:
        original_image: 原图数组
        heatmap: 热力图数组
        alpha: 透明度
    
    Returns:
        叠加后的图像
    """
    # 调整原图大小
    if original_image.shape[:2] != (224, 224):
        original_image = np.array(Image.fromarray(original_image).resize((224, 224)))
    
    # 应用颜色映射
    heatmap_colored = np.uint8(plt.cm.jet(heatmap)[:, :, :3] * 255)
    
    # 叠加
    overlay = cv2.addWeighted(original_image, 1-alpha, heatmap_colored, alpha, 0)
    
    return overlay


class ImageUrlRequest(BaseModel):
    image_url: str


@app.post("/predict_url")
async def predict_from_url(request: ImageUrlRequest):
    """
    从URL预测鱼眼新鲜度
    
    Args:
        request: 包含图片URL的请求体
        
    Returns:
        预测结果
    """
    image_url: str = request.image_url
    try:
        return predict_image(download_image(image_url))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ URL预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/gradcam_url")
async def gradcam_url(request: ImageUrlRequest):
    """
    通过图片URL生成Grad-CAM热力图

    Args:
        request: 包含图片URL的请求体

    Returns:
        Grad-CAM热力图结果
    """
    image_url = request.image_url
    
    try:
        ensure_model_loaded()
        image = download_image(image_url)
        input_tensor = preprocess(image).unsqueeze(0).to(device)
        prediction = predict_image(image)
        target_class = prediction.freshness_label
        cam = generate_gradcam(model, input_tensor, target_class)

        original_image = np.array(image.resize((224, 224)))  # PIL -> RGB
        original_image = cv2.cvtColor(original_image, cv2.COLOR_RGB2BGR)  # 转 BGR 以匹配 cv2.applyColorMap 输出
        heatmap = cv2.resize(cam, (224, 224))
        heatmap = np.uint8(255 * heatmap)
        heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)  # BGR
        superimposed = cv2.addWeighted(original_image, 0.6, heatmap_colored, 0.4, 0)

        _, buffer = cv2.imencode('.jpg', superimposed)
        heatmap_base64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "heatmap_base64": heatmap_base64,
            "target_class": target_class,
            "freshness_level": prediction.freshness_level,
            "confidence_score": prediction.confidence_score
        }
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ GradCAM URL失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Windows 上 torch 可能因 OpenMP 重复加载报错，启动时设置环境变量
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    # 启动服务（默认仅监听本地，可通过 HOST 环境变量覆盖）
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
