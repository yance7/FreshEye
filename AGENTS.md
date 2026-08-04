# FreshEye — Agent 导航

面向 AI 编程助手的仓库指引，只记录容易踩坑、靠看文件难以快速推断的事实。

## 仓库布局

- **本目录即为 git 仓库根**。所有开发命令都必须在仓库根目录下执行。
- 本项目为**纯 CNN 推理架构**（FishFreshNetV1/V2），无大语言模型依赖。
- 模型权重（`*.pth` 等）被 `.gitignore` 忽略，不入库；需自行放入 `deploy/src/storage/`（见"模型权重"）。

## 技术栈

- 后端：Python 3.12 + FastAPI + PyTorch / torchvision / opencv / matplotlib（`deploy/`）。
- 前端：纯 HTML/CSS/JS + PWA（`frontend/`），无构建步骤，由 GitHub Actions 部署到 GitHub Pages。
- 依赖声明：`deploy/requirements.txt`；前端无第三方运行时依赖。

## 关键文件

| 文件 | 说明 |
| --- | --- |
| `deploy/app.py` | FastAPI 后端：`/predict`、`/predict_with_gradcam`、`/health`；V1/V2 双模型 + Grad-CAM |
| `deploy/src/fishfreshnet_v2_model.py` | FishFreshNetV2 架构（EfficientNet-B0 + ECA + Light CRA） |
| `frontend/index.html` | 主分析页：上传、压缩、调用 API、置信度展示、PDF 导出、历史记录 |
| `frontend/about.html` | 技术架构与检测流程说明（与真实前后端流程保持一致） |
| `.github/workflows/deploy.yml` | 推送 `main` 后自动部署 `frontend/` 到 GitHub Pages |

## 运行与测试

- 后端测试：`cd deploy && python -m pytest test_app.py -v`
- **注意**：测试需要模型权重（`deploy/src/storage/fishfreshnet_v1.pth` / `fishfreshnet_v2.pth`），否则服务无法启动。
- 前端无需构建，直接托管 `frontend/` 目录即可；仓库内不提供本地开发服务器说明。

## 环境变量（后端）

- `V1_MODEL_PATH` / `V2_MODEL_PATH`：权重路径（默认 `deploy/src/storage/fishfreshnet_v1.pth` / `fishfreshnet_v2.pth`）。
- `PORT`：监听端口（默认 `8000`；Docker 内默认 `7860`）。
- `CORS_ORIGINS`：逗号分隔的前端来源白名单；留空时使用默认生产来源（`https://fresheye.yance777.com`、`https://yance77777.github.io`）。
- `FISHFRESHNET_MAX_IMAGE_MB`：上传大小上限（默认 `25`）。

## 设计要点

- 前端置信度阈值：`>= 0.8` 高（绿）、`0.6–0.8` 中（黄）、`< 0.6` 低（红，提示重拍）。
- 后端对图片做 JPG/PNG/WebP 魔数校验、尺寸上限 `4096 x 4096`、大小上限 25MB。
- 推理与 Grad-CAM 通过同一线程锁串行执行，避免 hook 串扰；相同图片带 TTL 缓存（30 分钟）。
- CORS 白名单由 `CORS_ORIGINS` 控制；默认只放行生产前端来源。
- 权重文件使用 PyTorch `weights_only=True` 安全加载。
