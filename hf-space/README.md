---
title: FreshEye
emoji: 🐟
colorFrom: blue
colorTo: indigo
sdk: docker
app_file: app.py
pinned: false
---

# FreshEye API

基于鱼眼图像的水产品新鲜度智能评估 API 服务。

> 🏆 使用 TRAE IDE 开发 · TRAE AI 创造力大赛 · 社会服务赛道 · 作者：祈雨柒

## 端点

- `GET /` - 服务状态
- `GET /health` - 健康检查
- `POST /predict` - 预测新鲜度（上传文件）
- `POST /predict_with_gradcam` - 预测 + Grad-CAM 热力图

## 模型

- FishFreshNetV1（经典版）
- FishFreshNetV2（推荐，默认）

## 就绪、版本和兼容性

`GET /health` 的既有 `status: ok` 仅表示进程可响应，不表示所有模型可用。`readiness` 为 `ready`（两个模型就绪）、`degraded`（仅一个就绪）或 `unavailable`；`models.v1/v2.status` 为 `ready` 或 `unavailable`，就绪模型的 `weights_sha256` 是启动时加载文件的 SHA-256。旧的 `v1_loaded`、`v2_loaded` 等字段保留。启动及预热期间进程可能尚未响应，Space 平台的休眠或启动错误也可能在应用之外返回 503。

`revision` 由部署者设置的 `FRESHEYE_REVISION` 提供，未设置时为 `unknown`；它是部署声明，不是容器自证的 Git 提交。将 `hf-space/` 从指定 GitHub 提交部署到 Space 时，记录源提交、Space 提交及权重文件 SHA-256，在 Space 的环境变量中将 `FRESHEYE_REVISION` 设置为对应的完整 GitHub SHA，完成部署后核对 `/health` 的声明和权重指纹。不要将凭据写入版本字段或仓库。Space 发布及环境变量修改须按单独授权执行。

预测 JSON 的已有字段不变。成功响应头 `X-FreshEye-Cache` 为 `hit` 或 `miss`，`X-FreshEye-Revision` 为部署者声明的源版本，`X-FreshEye-Weights-SHA256` 为本次运行加载的权重指纹；应用启动重新加载模型时清空两个缓存。缓存命中时预测中的时间戳仍是该缓存结果首次创建时间，不是本次请求时间。应用返回的错误可用 `X-FreshEye-Error` 区分 `model_unavailable`、`queue_busy` 与 `rate_limited`；平台代理生成的 503 可能没有该头，客户端应视为状态未知。这些头均通过 CORS 暴露。Grad-CAM 失败时仍可返回预测，`heatmap_image` 为空字符串。

`prediction_request` JSON 日志记录状态、分类、缓存状态和服务端总耗时，不记录上传文件名或图像。`inference_lock` 分别记录等待推理锁的时间和持锁工作时间；持锁时间可能包括预处理和热力图生成，不能视为纯模型前向耗时。已有 `metrics.avg_inference_ms` 是整个工作线程调用时间，包含排队和图像处理。缓存命中不会产生推理锁日志。
