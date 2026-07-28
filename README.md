# FreshEye 水产品新鲜度智能评估系统

> [English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

FreshEye is an AI agent workflow for aquatic product food safety. Using fish-eye images as the core input, it combines the FishFreshNetV1 vision model, multimodal large language models, LangGraph orchestration, and Grad-CAM explainability analysis to output freshness grade, confidence, visual evidence, structured reports, and handling recommendations.

### Key Features

- Determines whether an uploaded image is a fish, contains a clear fish eye, and meets quality standards.
- Three-class classification via **FishFreshNetV1** (EfficientNet-B0 + CBAM attention): **Highly Fresh / Fresh / Not Fresh**.
- Automatic fallback to an OpenAI-compatible multimodal LLM when the dedicated model service is unavailable.
- Confidence-driven adaptive branching (high / medium / low confidence paths).
- Generates **Grad-CAM** heatmaps (or degraded attention-region overlays) with natural-language explanations.
- Outputs structured reports, shelf-life trend prediction, and storage / consumption / handling / safety recommendations.
- Records a feedback entry for each run to support future sample-pool expansion and model iteration.

### Workflow

```text
image_upload
  -> enhanced_quality_check
      -> [unqualified / not a fish / no eye] quality_unqualified -> END
      -> [qualified] image_preprocess
  -> fish_region_detection
  -> freshness_classification
      -> [confidence >= 0.8] enhanced_gradcam
      -> [0.5 <= confidence < 0.8] multi_region_fusion -> enhanced_gradcam
      -> [confidence < 0.5] backup_model_review
            -> [second high/medium] enhanced_gradcam
            -> [second low] low_confidence_prompt -> END
  -> structured_analysis
  -> temporal_analysis
  -> report_generation
  -> recommendation_generation
  -> result_visualization
  -> feedback_loop
  -> END
```

### Quick Start

```bash
# 1. Clone
git clone https://github.com/yance77777/FreshEye.git
cd FreshEye

# 2. Install dependencies
pip install -r requirements.txt
# For the local model service (optional):
pip install -r requirements-model.txt

# 3. Configure environment
cp .env.example .env          # Linux/macOS
# Copy-Item .env.example .env # PowerShell
# Edit .env — OPENAI_API_KEY and OPENAI_BASE_URL are required.

# 4. Start the workflow service
python src/main.py -m http -p 5000

# 5. (Optional) Start the FishFreshNetV1 model service
python -m uvicorn src.api.model_service:app --host 0.0.0.0 --port 8000
```

### LLM Configuration

The workflow calls any **OpenAI-compatible** chat endpoint (`/chat/completions`). Set `OPENAI_BASE_URL` to your provider's `/v1` endpoint and `OPENAI_API_KEY` to your key.

| Provider | Example `OPENAI_BASE_URL` |
| --- | --- |
| OpenAI | `https://api.openai.com/v1` |
| Volcano Engine Ark (Doubao) | `https://ark.cn-beijing.volces.com/api/v3` |
| Ollama | `http://<your-ollama-host>:11434/v1` |
| vLLM | `http://<your-vllm-host>:8000/v1` |

The default model is specified per-node in `config/*_llm_cfg.json`. To override globally, set `FISH_AGENT_DEFAULT_MODEL` in `.env`. The shipped configs use a Doubao model ID — change it to match your provider.

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | LLM API key (`ARK_API_KEY` accepted as alias) |
| `OPENAI_BASE_URL` | Yes | OpenAI-compatible endpoint (`LLM_BASE_URL` as alias) |
| `FISH_AGENT_DEFAULT_MODEL` | No | Default model ID when config JSON omits `model` |
| `FISHFRESHNET_API_URL` | No | FishFreshNetV1 inference service URL |
| `MODEL_SERVICE_URL` | No | Grad-CAM service URL (defaults to `FISHFRESHNET_API_URL`) |
| `FISHFRESHNET_MODEL_PATH` | No | Model weights file path |
| `HOST` | No | Bind address (default `127.0.0.1`, set `0.0.0.0` to expose) |
| `PORT` | No | Workflow HTTP port (default `5000`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (empty = no CORS) |
| `FISH_AGENT_LOG_LEVEL` | No | Log level (default `INFO`) |
| `FISH_AGENT_LLM_TIMEOUT` | No | LLM request timeout in seconds (default `60`) |
| `FISH_AGENT_LLM_RETRIES` | No | LLM request retry count (default `3`) |
| `FISHFRESHNET_MAX_IMAGE_MB` | No | Max upload size for model service (default `25`) |

### Directory Structure

```text
FreshEye/
├── config/                     # LLM prompts and model params per node
├── docs/                       # Model integration & workflow docs
├── scripts/                    # Helper scripts
├── src/
│   ├── api/model_service.py    # FishFreshNetV1 inference service
│   ├── graphs/                 # LangGraph workflow, state, and nodes
│   ├── models/                 # FishFreshNetV1 model architecture
│   ├── tools/                  # LLM client & model service client
│   ├── utils/                  # File objects, URL safety, doc parsing
│   └── main.py                 # HTTP / CLI entry point
├── tests/                      # Smoke tests
├── AGENTS.md                   # Agent navigation guide
├── LICENSE
├── pyproject.toml
├── requirements.txt
└── requirements-model.txt
```

### Documentation

- `AGENTS.md` — Workflow node index and branch rules.
- `docs/FishFreshNetV1_Integration_Guide.md` — Model service & Grad-CAM integration guide.
- `docs/Workflow_Optimization_Complete_Report.md` — Workflow technical report.

### License

MIT License

---

<a id="中文"></a>

## 中文

FreshEye 是一个面向水产品食品安全场景的 AI 智能体工作流。系统以鱼眼图像为核心输入，结合 FishFreshNetV1 视觉模型、多模态大模型、LangGraph 编排和 Grad-CAM 可解释分析，输出新鲜度等级、置信度、视觉依据、结构化报告和处理建议。

### 核心能力

- 判断上传图片是否为鱼类、是否包含清晰鱼眼、图像质量是否合格。
- 使用 **FishFreshNetV1**（EfficientNet-B0 + CBAM 注意力）对鱼眼图像进行三分类：**高度新鲜 / 新鲜 / 不新鲜**。
- 当专用模型服务不可用时，回退到 OpenAI-compatible 多模态大模型。
- 根据置信度自动选择高、中、低三条分析路径。
- 生成 Grad-CAM 热力图或降级关注区域标注图，并配套自然语言解释。
- 输出结构化报告、保质期趋势预测、储存/食用/处理/安全建议。
- 记录反馈入口，为后续样本池扩充和模型迭代保留接口。

### 工作流

```text
image_upload
  -> enhanced_quality_check
      -> [不合格 / 非鱼类 / 无鱼眼] quality_unqualified -> END
      -> [合格] image_preprocess
  -> fish_region_detection
  -> freshness_classification
      -> [confidence >= 0.8] enhanced_gradcam
      -> [0.5 <= confidence < 0.8] multi_region_fusion -> enhanced_gradcam
      -> [confidence < 0.5] backup_model_review
            -> [二次高/中置信度] enhanced_gradcam
            -> [二次低置信度] low_confidence_prompt -> END
  -> structured_analysis
  -> temporal_analysis
  -> report_generation
  -> recommendation_generation
  -> result_visualization
  -> feedback_loop
  -> END
```

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/yance77777/FreshEye.git
cd FreshEye

# 2. 安装依赖
pip install -r requirements.txt
# 如需本地运行模型服务，额外安装：
pip install -r requirements-model.txt

# 3. 配置环境变量
cp .env.example .env          # Linux/macOS
# Copy-Item .env.example .env # PowerShell
# 编辑 .env。OPENAI_API_KEY 和 OPENAI_BASE_URL 为工作流必填。

# 4. 启动工作流服务
python src/main.py -m http -p 5000

# 5. （可选）启动 FishFreshNetV1 模型服务
python -m uvicorn src.api.model_service:app --host 0.0.0.0 --port 8000
```

### LLM 配置说明

工作流通过 OpenAI-compatible `/chat/completions` 接口调用大模型。将 `OPENAI_BASE_URL` 指向你的服务 `/v1` 端点，`OPENAI_API_KEY` 填写密钥。

| 服务商 | `OPENAI_BASE_URL` 示例 |
| --- | --- |
| OpenAI | `https://api.openai.com/v1` |
| 火山引擎 Ark（豆包） | `https://ark.cn-beijing.volces.com/api/v3` |
| Ollama | `http://<your-ollama-host>:11434/v1` |
| vLLM | `http://<your-vllm-host>:8000/v1` |

默认模型在 `config/*_llm_cfg.json` 中逐节点配置。如需全局覆盖，在 `.env` 中设置 `FISH_AGENT_DEFAULT_MODEL`。仓库自带配置使用豆包模型 ID，切换其他服务商时请相应修改。

### 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 是 | 大模型接口密钥（`ARK_API_KEY` 为别名） |
| `OPENAI_BASE_URL` | 是 | OpenAI-compatible 服务地址（`LLM_BASE_URL` 为别名） |
| `FISH_AGENT_DEFAULT_MODEL` | 否 | 默认模型 ID（config JSON 未指定 model 时使用） |
| `FISHFRESHNET_API_URL` | 否 | FishFreshNetV1 推理服务地址 |
| `MODEL_SERVICE_URL` | 否 | Grad-CAM 服务地址（默认回退到 `FISHFRESHNET_API_URL`） |
| `FISHFRESHNET_MODEL_PATH` | 否 | 模型权重文件路径 |
| `HOST` | 否 | 服务绑定地址（默认 `127.0.0.1`，设为 `0.0.0.0` 可对外暴露） |
| `PORT` | 否 | 工作流 HTTP 端口（默认 `5000`） |
| `CORS_ORIGINS` | 否 | CORS 允许来源（逗号分隔，留空则不启用） |
| `FISH_AGENT_LOG_LEVEL` | 否 | 日志级别（默认 `INFO`） |
| `FISH_AGENT_LLM_TIMEOUT` | 否 | LLM 请求超时秒数（默认 `60`） |
| `FISH_AGENT_LLM_RETRIES` | 否 | LLM 请求重试次数（默认 `3`） |
| `FISHFRESHNET_MAX_IMAGE_MB` | 否 | 模型服务上传图片上限 MB（默认 `25`） |

### 目录结构

```text
FreshEye/
├── config/                     # 多模态/文本大模型提示词与模型参数
├── docs/                       # 模型集成与工作流说明
├── scripts/                    # 辅助脚本
├── src/
│   ├── api/model_service.py    # FishFreshNetV1 推理服务
│   ├── graphs/                 # LangGraph 工作流、状态和节点
│   ├── models/                 # FishFreshNetV1 模型结构
│   ├── tools/                  # LLM 客户端与模型服务客户端
│   ├── utils/                  # 文件对象、URL 安全、文档解析
│   └── main.py                 # HTTP / CLI 入口
├── tests/                      # 冒烟测试
├── AGENTS.md                   # Agent 导航指引
├── LICENSE
├── pyproject.toml
├── requirements.txt
└── requirements-model.txt
```

### 文档

- `AGENTS.md`：工作流节点索引和分支规则。
- `docs/FishFreshNetV1_Integration_Guide.md`：模型服务与 Grad-CAM 集成说明。
- `docs/Workflow_Optimization_Complete_Report.md`：工作流技术说明。

### 许可证

MIT License
