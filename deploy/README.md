# FreshEye API

基于鱼眼图像的水产品新鲜度智能评估 API 服务。

> 🏆 使用 TRAE IDE 开发 · TRAE AI 创造力大赛 · 社会服务赛道 · 作者：祈雨柒

## 部署方式

本目录包含可直接部署到 Hugging Face Spaces 的 FastAPI 后端。

### 本地运行

```bash
pip install -r requirements.txt
# 将模型权重放置于 src/storage/fishfreshnet_v1.pth 和 src/storage/fishfreshnet_v2.pth
python app.py
# 服务启动于 http://localhost:7860
```

### Docker 部署

```bash
docker build -t fresheye-api .
docker run -p 7860:7860 fresheye-api
```

### Hugging Face Spaces 部署

添加 HF Spaces YAML frontmatter（参见 hf-deploy 分支或已部署 Space），然后推送到 HF Spaces。

## 端点

- `GET /` - 服务状态
- `GET /health` - 健康检查
- `POST /predict` - 预测新鲜度（上传文件）
- `POST /predict_with_gradcam` - 预测 + Grad-CAM 热力图

## 模型

- FishFreshNetV1（经典版）：EfficientNet-B0 + CBAM，4.216M 参数，98.88% 准确率
- FishFreshNetV2（推荐，默认）：EfficientNet-B0 + ECA + Light CRA，4.095M 参数，99.29% 准确率
