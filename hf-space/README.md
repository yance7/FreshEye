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
