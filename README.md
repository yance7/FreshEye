# FreshEye 水产品新鲜度智能评估系统

> [English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

FreshEye is an AI-powered aquatic product freshness assessment system. Using fish-eye images as the core input, it combines the **FishFreshNetV1/V2** lightweight CNN models, **Grad-CAM** explainability analysis, and **confidence-adaptive interaction** to output freshness grade, confidence, visual evidence, structured reports, and handling recommendations.

**Live Demo**: Frontend on [GitHub Pages](https://yance77777.github.io/FreshEye/) · Backend on [Hugging Face Spaces](https://huggingface.co/spaces/andreas777/fresheye)

> 🏆 Developed with **TRAE IDE** · TRAE AI Creativity Competition · Social Service Track · Author: 祈雨柒 (Qi Yuqi)

### Key Features

- Determines fish freshness from fish-eye images via **FishFreshNetV1/V2** CNN inference (no LLM dependency).
- Three-class classification: **Highly Fresh / Fresh / Not Fresh**.
- Dual-model routing — users can switch between V1 (EfficientNet-B0 + CBAM) and V2 (EfficientNet-B0 + ECA + Light CRA).
- **Grad-CAM** heatmaps with natural-language explanations for model decision transparency.
- Confidence-adaptive frontend interaction — green/yellow/red dashboard with retake prompts for low-confidence results.
- Rule-based structured analysis and 5-category recommendations (storage / consumption / handling / safety / best practices).
- PDF report export with original image, heatmap, probability distribution, and detailed analysis.
- PWA support with offline Service Worker caching.

### Detection Workflow

```text
image_upload
  -> format_validation (JPG/PNG/WebP, max 25MB, 4096x4096)
  -> model_routing (V1 or V2, default V2)
  -> cnn_classification (FishFreshNetV1/V2 inference)
  -> gradcam_visualization (gradient-weighted class activation mapping)
  -> structured_analysis (rule-based: eye appearance / clarity / color / texture / quality)
  -> recommendation_generation (5-category rule templates)
  -> report_generation (structured report + PDF export)
  -> frontend_confidence_display (3-color dashboard + badges + warnings)
  -> END
```

### Quick Start (Deployed Version)

#### Backend (FastAPI + PyTorch)

```bash
cd deploy
pip install -r requirements.txt
# Place model weights at deploy/src/storage/fishfreshnet_v1.pth and fishfreshnet_v2.pth
python app.py  # Starts on port 8000
```

Endpoints: `GET /health` · `POST /predict` · `POST /predict_with_gradcam`

#### Frontend (Pure HTML/CSS/JS)

```bash
cd frontend
python -m http.server 8080  # Open http://localhost:8080
```

### Quick Start (Full Workflow — Optional)

The repository also includes a full LangGraph-based workflow with optional LLM integration for advanced multi-node orchestration. This is **not required** for the deployed version.

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-model.txt  # For local model service

# Configure environment
cp .env.example .env  # Edit .env — LLM keys are optional

# Start the workflow service
python src/main.py -m http -p 5000
```

### Models

| Model | Architecture | Parameters | Accuracy | Key Innovation |
| --- | --- | --- | --- | --- |
| FishFreshNetV1 | EfficientNet-B0 + CBAM | 4.216M | 98.88% | CBAM channel + spatial attention |
| FishFreshNetV2 | EfficientNet-B0 + ECA + Light CRA | 4.095M | 99.29% | Light CRA (ring-mask + shared conv) + ECA |

Both models are trained on the **MFED** dataset (4800+ samples, 4 environments, 2 fish species), open-sourced on [Mendeley Data](https://data.mendeley.com/).

### Repository Structure

```text
FreshEye/
├── deploy/                     # Production backend (deployed on HF Spaces)
│   ├── app.py                  # FastAPI app: /predict, /predict_with_gradcam, /health
│   ├── src/
│   │   ├── fishfreshnet_v2_model.py  # V2 model architecture
│   │   └── storage/            # Model weights (gitignored)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # Production frontend (deployed on GitHub Pages)
│   ├── index.html              # Main analysis page
│   ├── about.html              # Tech architecture & model details
│   ├── fish.html               # Fish encyclopedia
│   ├── guide.html              # User guide
│   ├── 404.html
│   └── assets/                 # CSS, JS, Service Worker, samples
├── src/                        # Full workflow source (LangGraph + optional LLM)
│   ├── api/model_service.py    # FishFreshNet model service
│   ├── graphs/                 # LangGraph workflow, state, and nodes
│   ├── models/                 # FishFreshNet model architecture
│   ├── tools/                  # LLM client & model service client
│   ├── utils/                  # File objects, URL safety
│   └── main.py                 # HTTP / CLI entry point
├── config/                     # LLM prompt configs (optional, for workflow extension)
├── docs/                       # Model integration & workflow docs
├── scripts/                    # Helper scripts
├── tests/                      # Smoke tests
├── AGENTS.md                   # Agent navigation guide
├── LICENSE
├── pyproject.toml
├── requirements.txt
└── requirements-model.txt
```

### Documentation

- `AGENTS.md` — Repository navigation guide.
- `docs/FishFreshNetV1_Integration_Guide.md` — Model service & Grad-CAM integration guide.
- `docs/Workflow_Optimization_Complete_Report.md` — Workflow technical report.

### License

MIT License

---

<a id="中文"></a>

## 中文

FreshEye 是一个基于 AI 的水产品新鲜度智能评估系统。系统以鱼眼图像为核心输入，结合 **FishFreshNetV1/V2** 轻量化 CNN 模型、**Grad-CAM** 可解释性分析和**置信度自适应交互**，输出新鲜度等级、置信度、视觉依据、结构化报告和处理建议。

**在线演示**：前端部署于 [GitHub Pages](https://yance77777.github.io/FreshEye/) · 后端部署于 [Hugging Face Spaces](https://huggingface.co/spaces/andreas777/fresheye)

> 🏆 使用 **TRAE IDE** 全程开发 · TRAE AI 创造力大赛 · 社会服务赛道 · 作者：祈雨柒

### 核心能力

- 使用 **FishFreshNetV1/V2** CNN 推理判断鱼眼新鲜度（不依赖大语言模型）。
- 三分类：**高度新鲜 / 新鲜 / 不新鲜**。
- 双模型路由——用户可在 V1（EfficientNet-B0 + CBAM）和 V2（EfficientNet-B0 + ECA + Light CRA）之间切换。
- **Grad-CAM** 热力图配合自然语言解释，让模型决策过程透明可见。
- 置信度自适应前端交互——绿/黄/红三色仪表盘，低置信度时提示重拍。
- 基于规则模板的结构化分析和五大类建议（储存 / 食用 / 处理 / 安全警告 / 最佳实践）。
- PDF 报告导出，含原图、热力图、概率分布和详细分析。
- PWA 支持，Service Worker 离线缓存。

### 检测流程

```text
图片上传
  -> 格式校验（JPG/PNG/WebP，最大 25MB，4096x4096）
  -> 模型路由（V1 或 V2，默认 V2）
  -> CNN 分类（FishFreshNetV1/V2 推理）
  -> Grad-CAM 可视化（梯度加权类激活映射）
  -> 结构化分析（规则模板：鱼眼外观 / 清澈度 / 颜色 / 纹理 / 质量指标）
  -> 建议生成（五大类规则模板）
  -> 报告生成（结构化报告 + PDF 导出）
  -> 前端置信度展示（三色仪表盘 + 徽标 + 警告）
  -> END
```

### 快速开始（部署版本）

#### 后端（FastAPI + PyTorch）

```bash
cd deploy
pip install -r requirements.txt
# 将模型权重放置于 deploy/src/storage/fishfreshnet_v1.pth 和 fishfreshnet_v2.pth
python app.py  # 启动于 8000 端口
```

端点：`GET /health` · `POST /predict` · `POST /predict_with_gradcam`

#### 前端（纯 HTML/CSS/JS）

```bash
cd frontend
python -m http.server 8080  # 打开 http://localhost:8080
```

### 快速开始（完整工作流 — 可选）

仓库还包含基于 LangGraph 的完整工作流，支持可选的 LLM 集成，用于高级多节点编排。部署版本**不需要**此部分。

```bash
# 安装依赖
pip install -r requirements.txt
pip install -r requirements-model.txt  # 如需本地模型服务

# 配置环境变量
cp .env.example .env  # 编辑 .env — LLM 密钥为可选项

# 启动工作流服务
python src/main.py -m http -p 5000
```

### 模型

| 模型 | 架构 | 参数量 | 准确率 | 核心创新 |
| --- | --- | --- | --- | --- |
| FishFreshNetV1 | EfficientNet-B0 + CBAM | 4.216M | 98.88% | CBAM 通道 + 空间注意力 |
| FishFreshNetV2 | EfficientNet-B0 + ECA + Light CRA | 4.095M | 99.29% | Light CRA（环形掩码 + 共享卷积）+ ECA |

两个模型均在 **MFED** 数据集（4800+ 样本，4 种环境，2 种鱼类）上训练，已开源至 [Mendeley Data](https://data.mendeley.com/)。

### 仓库结构

```text
FreshEye/
├── deploy/                     # 生产后端（部署于 HF Spaces）
│   ├── app.py                  # FastAPI 应用：/predict, /predict_with_gradcam, /health
│   ├── src/
│   │   ├── fishfreshnet_v2_model.py  # V2 模型架构
│   │   └── storage/            # 模型权重（gitignored）
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # 生产前端（部署于 GitHub Pages）
│   ├── index.html              # 主分析页
│   ├── about.html              # 技术架构与模型详情
│   ├── fish.html               # 鱼类百科
│   ├── guide.html              # 使用指南
│   ├── 404.html
│   └── assets/                 # CSS、JS、Service Worker、示例图片
├── src/                        # 完整工作流源码（LangGraph + 可选 LLM）
│   ├── api/model_service.py    # FishFreshNet 模型服务
│   ├── graphs/                 # LangGraph 工作流、状态和节点
│   ├── models/                 # FishFreshNet 模型架构
│   ├── tools/                  # LLM 客户端与模型服务客户端
│   ├── utils/                  # 文件对象、URL 安全
│   └── main.py                 # HTTP / CLI 入口
├── config/                     # LLM 提示词配置（可选，用于工作流扩展）
├── docs/                       # 模型集成与工作流文档
├── scripts/                    # 辅助脚本
├── tests/                      # 冒烟测试
├── AGENTS.md                   # Agent 导航指引
├── LICENSE
├── pyproject.toml
├── requirements.txt
└── requirements-model.txt
```

### 文档

- `AGENTS.md`：仓库导航指引。
- `docs/FishFreshNetV1_Integration_Guide.md`：模型服务与 Grad-CAM 集成说明。
- `docs/Workflow_Optimization_Complete_Report.md`：工作流技术说明。

### 许可证

MIT License
