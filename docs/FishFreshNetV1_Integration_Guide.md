# FishFreshNet 模型与 API 集成指南

本文介绍鲜眸（FreshEye）生产后端（`hf-space/`）中 FishFreshNetV1/V2 的模型结构、推理服务、接口约定与部署方式。模型权重已随 `hf-space/src/storage/` 纳入开源仓库；训练代码和独立权重副本位于 `models/`。

## 代码组成

| 模块 | 文件 | 说明 |
| --- | --- | --- |
| API 服务 | `hf-space/app.py` | FastAPI 推理服务：`/predict`、`/predict_with_gradcam`、`/health` |
| V1 模型 | `hf-space/app.py` | EfficientNet-B0 + CBAM + 三分类头 |
| V2 模型 | `hf-space/src/fishfreshnet_v2_model.py` | EfficientNet-B0 + ECA + Light CRA |

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

## 前端双语与报告契约

FreshEye 的前端使用 Vue 3 + TypeScript，不要求后端增加语言参数，也不改变上述接口字段。

| 前端资源 | 职责 |
| --- | --- |
| `frontend-vue/src/i18n/zh.ts` | 中文默认文案、动态结果、历史记录、错误与 PDF 文案 |
| `frontend-vue/src/i18n/en.ts` | English 文案覆盖 |
| `frontend-vue/src/i18n/index.ts` | 读取 `fresheye-language`、维护 `document.lang` 与右上角语言切换 |
| `frontend-vue/src/utils/pdfReport.ts` | 由结构化预测数据生成当前语言的单页 A4 报告 |

语言切换只影响前端呈现。预测数据仍使用既有字段；概率展示固定遵循 `高度新鲜 / 新鲜 / 不新鲜`（对应标签 `0 / 1 / 2`）顺序，避免前后端字典顺序变化造成误读。PDF 报告提供打印/存为 PDF、下载 HTML 与关闭操作，且与页面一样明确声明：视觉结果不能替代法定食品安全检测。

The bilingual layer is presentation-only. The API contract and `PredictionResult` fields stay unchanged. `src/i18n/zh.ts` is the default dictionary, `src/i18n/en.ts` supplies English copy, `src/i18n/index.ts` persists `fresheye-language`, and `src/utils/pdfReport.ts` renders the active language. Probability order is always label `0 / 1 / 2`: `Highly fresh / Fresh / Not fresh`.

## 模型权重

- 环境变量 `V1_MODEL_PATH` / `V2_MODEL_PATH` 优先；从 `hf-space/` 运行且未设置时默认查找 `src/storage/fishfreshnet_v1.pth` / `fishfreshnet_v2.pth`。
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
cd hf-space
docker build -t fresheye-api .
docker run -p 7860:7860 fresheye-api
```

生产环境（Hugging Face Spaces）需配置 `V1_MODEL_PATH`、`V2_MODEL_PATH`、`PORT`、`CORS_ORIGINS` 等环境变量。前端 `frontend-vue/src/config/index.ts` 中的 `API_BASE_URL` 指向后端地址，`CORS_ORIGINS` 需包含 `https://fresheye.yance777.com` 等前端页面来源。

## 说明与限制

- 限流：同一客户端 15 次/分钟，超限返回 429。
- 缓存：相同图片 30 分钟内命中 TTL 缓存，命中时不再重复推理。
- 安全：JPG/PNG/WebP 魔数校验、尺寸预校验、上传大小限制、GZip 压缩与 CORS 白名单。
- 推理与 Grad-CAM 通过同一线程锁串行执行，避免并发 hook 串扰导致热力图异常。
