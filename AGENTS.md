# FreshEye — Agent 导航

面向 OpenCode / AI 编程助手的仓库指引。只记录容易踩坑、靠看文件难以快速推断的事实。节点与分支细节见下文"工作流节点""分支规则"。

## 仓库布局

- **本目录即为 git 仓库根**。所有开发命令都必须在仓库根目录下执行。
- 模型权重（`*.pth`/`*.onnx` 等）被 `.gitignore` 忽略，不入库；需自行放置（见"模型服务"）。

## 技术栈

- Python **>=3.12**（`pyproject.toml`）。
- 编排：**LangGraph 1.x** + `langchain-core 1.x`，用现代 `StateGraph` API（见 `src/graphs/graph.py`）。
- Web：FastAPI + uvicorn；Pydantic v2。
- 模型服务：torch / torchvision / opencv / matplotlib（仅运行 FishFreshNetV1 推理服务时需要）。

## 安装

- 首选 **uv**：
  ```bash
  uv sync                   # 基础工作流依赖
  uv sync --extra model     # 追加 torch 等模型服务依赖
  uv sync --extra docs      # 追加文档解析依赖（pandas/python-pptx 等）
  uv sync --extra dev       # pytest / pytest-asyncio / ruff
  ```
  > 中国大陆用户如需加速，可设置阿里云镜像：
  > `UV_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/ uv sync`
- 无 uv 回退（等价 `scripts/setup.sh`）：`python -m venv .venv && pip install -r requirements.txt`。注意 `setup.sh` 只装基础依赖；模型服务需再 `pip install -r requirements-model.txt`（该文件 `-r requirements.txt` 并追加 torch 栈）。
- `requirements-lock.example.txt` 只是占位说明，需自行 `pip freeze` 生成真正 lock。

## 导入约定（容易踩坑）

- **`src/` 是包根，导入不带 `src.` 前缀**：`from graphs.graph import main_graph`、`from tools.llm_client import LLMClient`、`from models.fishfreshnet_model import load_model`、`from utils.file.file import File`。
- 由 `pyproject.toml` 的 `[tool.pytest.ini_options] pythonpath = ["src"]` 固化；`src/api/model_service.py` 启动时也把 `src/` 加入 `sys.path`。新增代码沿用同风格，不要改成 `src.xxx`。

## 运行命令（均在仓库根目录下执行）

工作流服务（默认端口 5000，可用 `PORT` 或 `-p` 覆盖；默认仅监听 127.0.0.1，可通过 `HOST=0.0.0.0` 对外暴露）：
```bash
python src/main.py -m http -p 5000                       # HTTP 服务（默认）
python src/main.py -m flow  -i <json|图片路径|URL>        # 单次跑完整图
python src/main.py -m node  -n <node_id> -i <json>        # 单节点调试
# 等价脚本：scripts/http_run.sh -p 5000 / scripts/local_run.sh -m flow -i ...
```
- **必须从仓库根运行**：节点配置以相对路径 `config/...` 引用，且 `uvicorn` 以 `main:app` 导入（依赖 `src/` 在 `sys.path`）。
- HTTP 端点：`GET /health`、`POST /run`（整图）、`POST /stream_run`（SSE 流式）、`POST /node_run/{node_id}`（单节点）、`GET /graph_parameter`（输入 schema + 节点列表）。

FishFreshNetV1 模型服务（默认端口 8000，需模型依赖 + 权重）：
```bash
python -m uvicorn src.api.model_service:app --host 127.0.0.1 --port 8000
# 或：python src/api/model_service.py  （__main__ 监听 8000，可通过 PORT 覆盖）
```
- 端点：`GET /`、`POST /predict`、`POST /predict_with_gradcam`。
- 权重查找顺序：`FISHFRESHNET_MODEL_PATH` → `src/storage/fishfreshnet_v1.pth` → 仓库根上级的 `fishfreshnet_v1.pth`。

## 环境变量

> **注意**：部署版本（`deploy/` 目录）仅使用 CNN 推理，不需要 LLM 配置。以下环境变量仅用于完整工作流（`src/` 目录）。

- **工作流（可选，完整版需要）**：`OPENAI_API_KEY`、`OPENAI_BASE_URL`（OpenAI 兼容；`llm_client.py` 也接受 `ARK_API_KEY` / `LLM_BASE_URL` 作别名）。部署版本不需要 LLM。
- **默认模型**：`FISH_AGENT_DEFAULT_MODEL`（当节点 config JSON 中未指定 `model` 时使用；不设置且 config 也未指定时调用会报错）。
- 模型服务相关（可选）：`FISHFRESHNET_API_URL`、`MODEL_SERVICE_URL`（留空时自动回退到 `FISHFRESHNET_API_URL`）、`FISHFRESHNET_MODEL_PATH`。未配置时工作流跳过专用模型服务。
- 服务配置：`HOST`（默认 `127.0.0.1`）、`PORT`（默认 `5000`）、`FISH_AGENT_WORKSPACE`、`CORS_ORIGINS`、`FISH_AGENT_LOG_LEVEL`、`FISH_AGENT_LLM_TIMEOUT`、`FISH_AGENT_LLM_RETRIES`、`FISHFRESHNET_MAX_IMAGE_MB`。模板见 `.env.example`。

## 验证 / 测试

- 冒烟测试：`pytest tests/`（包含 graph 导入和 stub LLM 的 dry-run）。
- Lint：`ruff check src tests`（配置在 `pyproject.toml` 的 `[tool.ruff]`）。
- 最低限度语法检查：`python -m compileall src`。

## 工作流节点

16 个实际节点，14 个逻辑步骤（完整工作流，部署版本不使用）。类型 `agent` = 调用大模型，`task` = 纯数据处理。

| # | 节点 | 文件 | 类型 | 职责 |
| --- | --- | --- | --- | --- |
| 1 | `image_upload` | `src/graphs/nodes/image_upload_node.py` | task | 接收图像并记录上传时间 |
| 2 | `enhanced_quality_check` | `src/graphs/nodes/enhanced_quality_check_node.py` | agent | 判断是否鱼类、是否含鱼眼、图像质量是否合格 |
| 3 | `quality_unqualified` | `src/graphs/nodes/quality_unqualified_node.py` | task | 输出不合格原因和重拍建议 |
| 4 | `image_preprocess` | `src/graphs/nodes/image_preprocess_node.py` | task | 按场景和质量等级做轻量预处理 |
| 5 | `fish_region_detection` | `src/graphs/nodes/fish_region_detection_node.py` | agent | 识别鱼眼、鳃部、体表区域 |
| 6 | `freshness_classification` | `src/graphs/nodes/freshness_classification_node.py` | agent | 优先 FishFreshNetV1，失败回退多模态大模型 |
| 7 | `multi_region_fusion` | `src/graphs/nodes/multi_region_fusion_node.py` | agent | 中置信度路径，融合鱼眼/鳃部/体表 |
| 8 | `backup_model_review` | `src/graphs/nodes/backup_model_review_node.py` | agent | 低置信度路径，大模型复核仲裁 |
| 9 | `low_confidence_prompt` | `src/graphs/nodes/low_confidence_prompt_node.py` | task | 二次低置信度提示重拍或人工确认 |
| 10 | `enhanced_gradcam` | `src/graphs/nodes/enhanced_gradcam_node.py` | agent | 调真实 Grad-CAM 服务，失败生成降级关注区域解释 |
| 11 | `structured_analysis` | `src/graphs/nodes/structured_analysis_node.py` | agent | 鱼眼外观、清澈度、颜色、纹理和质量指标 |
| 12 | `temporal_analysis` | `src/graphs/nodes/temporal_analysis_node.py` | agent | 新鲜度趋势与剩余保质时间预测 |
| 13 | `report_generation` | `src/graphs/nodes/report_generation_node.py` | agent | 结构化报告与知识图谱匹配 |
| 14 | `recommendation_generation` | `src/graphs/nodes/recommendation_generation_node.py` | agent | 储存/食用/处理/安全建议 |
| 15 | `result_visualization` | `src/graphs/nodes/result_visualization_node.py` | task | 汇总最终展示数据 |
| 16 | `feedback_loop` | `src/graphs/nodes/feedback_loop_node.py` | task | 生成记录 ID，为中低置信度样本预留样本池入口 |

## 分支规则

质量检测：
```text
enhanced_quality_check
  -> 合格: image_preprocess
  -> 非鱼类 / 无鱼眼 / 质量不合格: quality_unqualified -> END
```
置信度（阈值 0.8 / 0.5；`None`/`NaN` 归为低）：
```text
freshness_classification
  -> confidence_score >= 0.8: enhanced_gradcam
  -> 0.5 <= confidence_score < 0.8: multi_region_fusion -> enhanced_gradcam
  -> confidence_score < 0.5: backup_model_review
```
复核（复用同一 `confidence_decision`）：
```text
backup_model_review
  -> 高/中置信度: enhanced_gradcam
  -> 低置信度: low_confidence_prompt -> END
```
统一报告路径：
```text
enhanced_gradcam -> structured_analysis -> temporal_analysis
  -> report_generation -> recommendation_generation
  -> result_visualization -> feedback_loop -> END
```

## 节点配置文件

`config/<node>_llm_cfg.json` 结构：`{ "config": {模型参数, 含 "model", "temperature", "top_p", "max_completion_tokens"}, "tools": [], "sp": "系统提示词", "up": "用户提示词模板（Jinja2，如 {{image_url}}）" }`。通过图节点 `metadata={"llm_cfg": "config/xxx.json"}` 注入；`src/main.py` 的 `NODE_SPECS` 为单节点调试复制了同一映射。

| 配置 | 节点 |
| --- | --- |
| `config/enhanced_quality_check_llm_cfg.json` | `enhanced_quality_check` |
| `config/fish_region_detection_llm_cfg.json` | `fish_region_detection` |
| `config/freshness_classification_llm_cfg.json` | `freshness_classification` 回退路径 |
| `config/multi_region_fusion_llm_cfg.json` | `multi_region_fusion` |
| `config/backup_model_review_llm_cfg.json` | `backup_model_review` |
| `config/enhanced_gradcam_llm_cfg.json` | `enhanced_gradcam` |
| `config/structured_analysis_llm_cfg.json` | `structured_analysis` |
| `config/temporal_analysis_llm_cfg.json` | `temporal_analysis` |
| `config/report_generation_llm_cfg.json` | `report_generation` |
| `config/recommendation_generation_llm_cfg.json` | `recommendation_generation` |

## 运行入口

- 主图：`src/graphs/graph.py` 中的 `main_graph`（`builder.compile()`）。
- HTTP/CLI：`src/main.py`。
- 模型服务：`src/api/model_service.py`。

## 设计要点

- 节点用 Pydantic 输入输出模型，字段集中在 `src/graphs/state.py`（`GlobalState` / `GraphInput` / `GraphOutput` 及各节点 `*Input`）。
- `confidence_score` 是分支唯一依据；`multi_region_fusion` 与 `backup_model_review` 会回写 `freshness_level` 与 `confidence_score`，后续节点读最新值。
- LLM 调用走 `src/tools/llm_client.py`：用 `requests` 直连 OpenAI 兼容 `/chat/completions`（**非 openai SDK**），带指数退避重试；`image_url` 为本地路径时自动转 base64 data URI；支持 `top_p` / `frequency_penalty` 透传。
- FishFreshNetV1 走 `src/tools/fishfreshnet_client.py`（HTTP），全局单例 `get_client()`；新鲜度三类 `高度新鲜(0)/新鲜(1)/不新鲜(2)`，失败兜底 `confidence_score=0.0`。Grad-CAM 节点通过该客户端调用 `/predict_with_gradcam`（本地文件走 multipart 上传）。
- URL 安全：`src/utils/net.py` 提供 SSRF 防护（校验 scheme、拒绝私有/环回 IP、禁用重定向），所有用户 URL 抓取均经过校验。
- `src/agents/` 与 `src/storage/` 目前为空（`storage/` 仅用于放权重文件）。
