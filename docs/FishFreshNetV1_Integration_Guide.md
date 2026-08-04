# FishFreshNet 模型与 API 集成指南

本文介绍 FreshEye 生产后端（`deploy/`）中 FishFreshNetV1/V2 的模型结构、推理服务、接口约定与部署方式。模型权重体积较大，默认不纳入源码仓库。

## 代码组成

| 模块 | 文件 | 说明 |
| --- | --- | --- |
| API 服务 | `deploy/app.py` | FastAPI 推理服务：`/predict`、`/predict_with_gradcam`、`/health` |
| V1 模型 | `deploy/app.py` | EfficientNet-B0 + CBAM + 三分类头 |
| V2 模型 | `deploy/src/fishfreshnet_v2_model.py` | EfficientNet-B0 + ECA + Light CRA |

## 模型输入输出

输入图像在服务中统一预处理为 `224 x 224` RGB，并使用 ImageNet 均值方差归一化。

支持格式：`JPG` / `PNG` / `WebP`；大小上限 25MB；尺寸上限 `4096 x 4096`。

输出字段（`PredictionResult`）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `freshness_level` | string | `高度新鲜`、`新鲜` 或 `不新鲜` |
| `freshness_label` | int | 0、1、2 |
| `confidence_score` | float | 预测类别概率 |
| `all_probabilities` | object | 三个类别的概率分布 |
| `description` | string | 面向用户的结果说明 |
| `timestamp` | string | 推理时间 |
| `model_version` | string | `v1` 或 `v2` |

`/predict_with_gradcam` 额外返回 `heatmap_image`（Grad-CAM 热力图叠加原图的 JPEG base64）。

## 模型权重

- 环境变量 `V1_MODEL_PATH` / `V2_MODEL_PATH` 优先；未设置时默认查找 `deploy/src/storage/fishfreshnet_v1.pth` / `fishfreshnet_v2.pth`。
- 某个版本权重缺失时自动降级：请求 V1 会回退到 V2（反之亦然）；两个版本都缺失时服务启动失败。
- 权重使用 PyTorch `weights_only=True` 安全加载，拒绝执行任意 pickle 字节码。

## API

### `GET /`

返回服务在线状态、V1/V2 可用性与设备信息。

### `GET /health`

返回健康状态、模型加载情况、设备、缓存大小与运行指标（请求数、缓存命中率、平均推理耗时）。

### `POST /predict`

上传本地图片，返回三分类结果。

```bash
curl -X POST "$FRESHEYE_API_URL/predict?model_version=v2" \
  -F "file=@fish_eye.jpg"
```

### `POST /predict_with_gradcam`

上传本地图片，返回预测结果与 Grad-CAM 热力图 base64。

```bash
curl -X POST "$FRESHEYE_API_URL/predict_with_gradcam?model_version=v2" \
  -F "file=@fish_eye.jpg"
```

## 部署

```bash
cd deploy
docker build -t fresheye-api .
docker run -p 7860:7860 fresheye-api
```

生产环境（Hugging Face Spaces）需配置 `V1_MODEL_PATH`、`V2_MODEL_PATH`、`PORT`、`CORS_ORIGINS` 等环境变量。前端 `frontend/index.html` 中的 `API_BASE_URL` 指向后端地址，`CORS_ORIGINS` 需包含前端页面来源。

## 说明与限制

- 限流：同一客户端 15 次/分钟，超限返回 429。
- 缓存：相同图片 30 分钟内命中 TTL 缓存，命中时不再重复推理。
- 安全：JPG/PNG/WebP 魔数校验、尺寸预校验、上传大小限制、GZip 压缩与 CORS 白名单。
- 推理与 Grad-CAM 通过同一线程锁串行执行，避免并发 hook 串扰导致热力图异常。
