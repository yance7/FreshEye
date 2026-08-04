# 鲜眸（FreshEye） API

鲜眸（FreshEye）是一款基于鱼眼图像的水产品新鲜度智能评估 API 服务，使用 **FishFreshNetV1/V2** 纯 CNN 推理，无 LLM 依赖。

> 🐟 使用 TRAE IDE 开发 · TRAE AI 创造力大赛 · 社会服务赛道 · 作者：祈雨柒

## 部署方式

本目录包含可部署到 Hugging Face Spaces 的 FastAPI 后端。

### Docker

```bash
docker build -t fresheye-api .
docker run -p 7860:7860 fresheye-api
```

### Hugging Face Spaces

将本目录推送至 HF Space（FastAPI + Dockerfile 即可），并配置模型权重与环境变量。

### 模型权重

将 `fishfreshnet_v1.pth` 与 `fishfreshnet_v2.pth` 放入 `src/storage/`，或通过 `V1_MODEL_PATH` / `V2_MODEL_PATH` 指定路径。权重文件不随仓库分发。

## 端点

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/` | 服务状态 |
| `GET` | `/health` | 健康检查与运行指标 |
| `POST` | `/predict?model_version=v1\|v2` | 上传图片，返回三分类结果 |
| `POST` | `/predict_with_gradcam?model_version=v1\|v2` | 上传图片，返回预测 + Grad-CAM 热力图 |

## 模型

- **FishFreshNetV1**（经典版）：EfficientNet-B0 + CBAM，4.216M 参数，98.88% 准确率。
- **FishFreshNetV2**（推荐，默认）：EfficientNet-B0 + ECA + Light CRA，4.095M 参数，99.29% 准确率。

## 环境变量

- `V1_MODEL_PATH` / `V2_MODEL_PATH`：模型权重路径。
- `PORT`：监听端口（默认 `8000`；Docker 内默认 `7860`）。
- `CORS_ORIGINS`：逗号分隔的前端来源白名单（默认：`https://fresheye.yance777.com`、`https://yance77777.github.io`）。
- `FISHFRESHNET_MAX_IMAGE_MB`：上传大小上限（默认 `25`）。
