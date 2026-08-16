# Plan: FreshEye Vue 前端重写与双语 UI 优化

> 生成日期：2026-08-16
> 设计依据：`docs/Vue_Rewrite_Design.md`
> 实施状态：Vue 源码位于 `frontend-vue/`；旧 `frontend/` 已删除，Pages workflow 已切换到 `frontend-dist/`，发布按用户要求直接更新 `main`。

## 目标

在不改变后端接口、模型行为、公开内容事实和核心视觉色彩的前提下，建立可扩展的 Vue 3 + TypeScript + Vite 前端，完整复刻当前原生版本的用户流程，并改善组件组织、英文排版、顶部/底部任务栏、右上角语言切换、响应式和报告维护能力。

## 不变量

- 生产基准目录曾为 `frontend/`，在 Vue 独立构建与资源检查通过后删除。
- API 只使用 `/health` 和 `/predict_with_gradcam?model_version=...`。
- Freshness 分类顺序固定为 `0 高度新鲜 / 1 新鲜 / 2 不新鲜`。
- 语言为 `zh`/`en`，默认中文并使用既有 localStorage 持久化。
- 所有英文能力边界继续表达为视觉参考，不变成食品安全保证。
- PDF 仍由浏览器打印/另存为 PDF，且 HTML 下载内容与当前语言一致。

## 实施任务

### Task 1：建立迁移基线与红灯契约测试

**文件：** 新增 `frontend-vue/contract.test.js`，必要时更新 `frontend-vue/package.json`。

**操作：**

1. 把当前页面、资源、API、存储 key、报告和语言行为写成可自动检查的契约。
2. 检查 Vue 入口、路由、核心 composable、翻译 key、构建配置和报告生成器必须存在。
3. 先运行测试，确认在 Vue 源码恢复前得到预期失败；保存失败原因作为 TDD 红灯证据。

**验收：** 测试失败原因明确指向缺少 Vue 实现，而不是测试自身语法错误。

### Task 2：恢复并整理 Vue 工程骨架

**文件：** `frontend-vue/index.html`、`package.json`、`package-lock.json`、`vite.config.ts`、`tsconfig*.json`、`src/main.ts`、`src/App.vue`、`src/router/index.ts`、`src/types/index.ts`、`src/config/index.ts`、`src/env.d.ts`。

**操作：**

1. 以历史 Vue 提交为参考恢复工程文件，并逐项对照当前生产接口修正过时假设。
2. 配置相对 base、路径别名、TypeScript 检查和独立输出 `frontend-dist/`。
3. 将必要图片、示例、图标复制到 `frontend-vue/public/assets`，解除对旧 `frontend/assets` 的依赖；确认 manifest、favicon 和 SW 路径正确。
4. 运行 `npm run build`，让基础工程先达到绿灯。

**验收：** Vue 工程可以在无后端时构建，产物包含入口、CSS、JS 和所有引用资源。

### Task 3：建立双语运行时与共享壳层

**文件：** `src/i18n/*.ts`、`src/components/AppNavbar.vue`、`src/components/AppFooter.vue`、`src/components/DeepBackground.vue`、`src/components/ToastContainer.vue`、`src/styles/global.css`、`src/App.vue`。

**操作：**

1. 以现有双语字典为内容基准，建立类型安全的 `t()`、参数插值、locale 持久化、`html.lang`、title/meta 和语言变更通知。
2. 统一顶栏导航、active 状态、移动菜单、44px 语言 segmented toggle、ARIA label 和隐藏 live region。
3. 重做任务栏与页脚的布局 token，处理英文长度、safe area、focus-visible、reduced motion 和小屏堆叠。
4. 保留深海背景和品牌颜色，但将重复样式收敛为可维护的 CSS token。

**测试：** 增加语言默认值、非法值回退、刷新持久化、动态 key 和页面 meta 的契约测试；运行测试和类型检查。

**验收：** 五条路由共享一致壳层；中英文切换不刷新页面，刷新后语言仍保持；顶栏和页脚在 320px 宽度可用。

### Task 4：迁移 API、错误、toast、历史和本地模型状态

**文件：** `src/composables/useApi.ts`、`src/composables/useHistory.ts`、`src/composables/useToast.ts`、相关 `src/types/index.ts`。

**操作：**

1. 将旧版响应归一化为数值 freshness label、固定概率数组、模型版本、时间和热力图。
2. 复刻 health 检查、超时、AbortController、网络错误和 HTTP 状态映射；原始服务端 detail 只记录诊断。
3. 兼容现有历史数据、新增数值字段和收藏/删除/清空行为，避免切换语言时重写原始记录。
4. 保持模型选择和语言 key 的原有语义，确保旧用户打开 Vue 版不会丢设置。

**测试：** 使用静态 fixture 覆盖外层 prediction、直接 prediction、旧中文概率对象、缺失热力图、非法模型和所有错误状态。

**验收：** API 字段变动或英文页面都不会直接显示后端中文；历史旧记录可读且能按当前语言重绘。

### Task 5：重做首页上传—分析—结果工作区

**文件：** `src/views/HomeView.vue`，必要时新增 `src/components/home/` 下的上传、结果、历史和报告组件。

**操作：**

1. 先写上传、选择模型、分析状态、结果数据和语言切换的失败测试，再实现最小组件闭环。
2. 复刻点击选择、拖拽、粘贴、相机、示例、文件校验、预览、取消和重新分析。
3. 复刻扫描阶段、按钮 loading/retry/done、toast、低置信度 modal、结果四个 Tab、概率条、置信度、AI 依据、视觉趋势、建议和热力图。
4. 把复杂首页拆成语义组件，使用事件/props 或 composable 明确数据流，避免再次形成一个不可维护的大文件。
5. 处理英文长文案：grid `min-width: 0`、自然换行、Tab 横向滚动、按钮不压缩、卡片不固定高度。

**测试：** Node/组件契约测试先验证状态转换和展示归一化；再构建并用本地静态预览检查资源路径。

**验收：** 不连接后端时错误状态可演示；连接真实 API 时 V1/V2、三类结果、热力图和历史流程与旧版一致。

### Task 6：迁移 Guide/Fish/About/404 内容并完成术语审校

**文件：** `src/views/GuideView.vue`、`FishView.vue`、`AboutView.vue`、`NotFoundView.vue`、`src/i18n/zh.ts`、`src/i18n/en.ts`。

**操作：**

1. 保留旧页面全部事实、章节、图片、链接、FAQ、Model Card、GB 2733-2015 边界和限制说明。
2. 对英文逐条审校统一术语：visual freshness assessment、Highly Fresh、Fresh、Not Fresh、Confidence、Visual Evidence、Fish-eye image 等。
3. 修复英文标题、表格、标签、引用、徽标和长段落的字体、行高、换行与层级。
4. 确认导航、页脚、页面 title/meta/alt/ARIA 全部来自字典，未出现中英文混排遗漏。

**验收：** 每条路由能在两种语言下完整渲染，无未翻译 key、空块、死链接或能力边界扩大。

### Task 7：实现报告 HTML、打印和下载

**文件：** 新增/整理报告 builder 及其样式，例如 `src/utils/pdfReport.ts`、`src/styles/pdf-report.css`、`HomeView.vue` 中的窗口控制。

**操作：**

1. 先测试报告输入缺失图、完整图、三类等级、建议、语言和文件名，再实现 builder。
2. 将报告数据快照和页面窗口生命周期分离；用户点击时同步打开窗口，等待图片/字体/CSS 后再打印。
3. 报告所有可见文本、关键词标签、工具栏、文件名和 `html lang` 按 locale 生成。
4. 复刻 HTML 下载、打印/存为 PDF、关闭、弹窗拦截和错误兜底。
5. 用 CSS 保持 A4 纵向和单页目标，允许英文卡片自然增高，不用裁切隐藏问题。

**验收：** 中文/英文报告没有混用文案；缺少热力图或原图时仍可生成；桌面打印和手机手动打印路径均存在。

### Task 8：PWA、资源、响应式和工程清理

**文件：** `frontend-vue/public/manifest.json`、`public/sw.js`、`vite.config.ts`、`src/styles/global.css`、必要的文档。

**操作：**

1. 更新 Vue 构建产物中的 PWA 元数据和缓存清单，保持页面语言切换不依赖两份 HTML。
2. 核对相对路径、favicon、示例、OG cover、manifest、SW scope 和旧缓存失效策略。
3. 在 320/390/768/1024/1440px 复核顶栏、结果、历史、热力图、报告工具栏和 footer；若本机没有浏览器，记录限制并至少完成静态构建/资源检查。
4. 运行格式/类型/构建/契约测试，确认旧 `frontend/` 已不存在且 `frontend-dist/` 资源完整。

**验收：** `npm run build`、TypeScript、契约测试和 `git diff --check` 通过；构建产物无本地死链。

### Task 9：完整回归与上线前检查

**文件：** 测试文件、`docs/Vue_Rewrite_Design.md`、本计划、`.github/workflows/deploy.yml`。

**操作：**

1. 对照验收矩阵逐项记录旧版与 Vue 版行为差异，差异必须有明确理由或修复。
2. 执行前端静态检查、契约测试、构建和可用的后端回归；不把未执行的浏览器验证写成已通过。
3. 生成构建产物检查报告；确认旧生产目录已删除，workflow 只上传 `frontend-dist`。
4. 检查 GitHub Actions 的 Node 安装、依赖安装、Vue 构建和 Pages artifact 路径。

**验收：** Vue 版达到设计文档的验收矩阵；当前工作树差异可审查；仓库根目录为 `Y:\FreshEye`，并包含 `hf-space`、`models`、`test-samples`。按用户要求直接推送 `main`，不创建草稿 PR。

## 验证命令

在 `Y:\FreshEye\frontend-vue` 下运行：

```powershell
npm test
npm run build
npx vue-tsc --noEmit
```

在仓库根目录运行：

```powershell
git diff --check
git status --short
```

若后端依赖可用，再运行 `Y:\FreshEye\hf-space` 中既有 pytest；API 回归不因前端重写而修改测试期望。

## 完成定义

- 所有生产前端能力在 Vue 中有对应实现和测试/检查证据。
- 语言切换、历史、PDF、PWA、响应式和无障碍不依赖硬编码中文。
- Vue 构建可重复，产物资源完整，旧 `frontend/` 已删除。
- Pages workflow 构建并部署 `frontend-dist/`，不创建 PR，直接更新 `main`。
