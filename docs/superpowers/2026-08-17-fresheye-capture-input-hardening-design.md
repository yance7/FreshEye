# FreshEye 输入控件与多端体验加固设计

## 背景

FreshEye 已完成 Vue 迁移、中英文运行时、动态结果、历史记录和单页 A4 报告升级。本轮处理剩余的输入与交互细节：模型/历史筛选下拉框在部分系统中出现白底浅字、拍照缺少鱼眼取景提示、相机生命周期和跨端适配仍有加固空间、报告和英文文案需要继续收口，以及 About 页参考文献需要回到普通引用格式。

当前代码证据：

- HomeView.vue 使用两个原生 select：模型版本和历史记录筛选；现有样式没有 appearance、color-scheme 和 option 的深色策略。
- 相机流程已经使用 navigator.mediaDevices.getUserMedia，取景器只有四角标记，没有圆形鱼眼引导框；启动请求没有请求序号保护，关闭弹窗时也没有焦点恢复。
- pdfReport.ts 已固定 A4 单页，但报告元信息传入的是原始 v1/v2，没有根据当前界面语言翻译模型名。
- AboutView.vue 把 citation 渲染为外链；仓库已忽略 node_modules 和 frontend-dist，但没有覆盖常见的 Vite、测试、Python 和 IDE 缓存模式。

## 设计决策

### 1. 选择控件：保留原生语义，统一深色视觉

不引入自定义 listbox。原生 select 对桌面键盘、Android/iOS 触控、辅助技术和系统滚动行为更可靠；本问题的根因是控件皮肤没有声明深色颜色体系，而不是交互模型不够复杂。

两个选择控件统一包裹在 select-field 中：

- select 使用 appearance: none，深海蓝实色背景、浅色文字、color-scheme: dark 和高对比边框。
- 通过伪元素绘制稳定的下拉箭头；原生弹出菜单的 option 同时声明深色背景和浅色文字，提供 Windows、macOS 和移动浏览器可读回退。
- 最小高度 44px，窄屏时控件占满可用宽度，长英文选项不改变真实值。
- 聚焦、悬停、禁用和错误状态使用同一套 focus-visible 轮廓与 token。

### 2. 拍照：圆形鱼眼引导，不改变模型输入

取景器继续捕获完整视频帧，圆形框只用于构图提示，不裁切、不变更后端接口和模型预处理。桌面端保留 16:10 预览，移动端采用 3:4 预览；圆形引导框使用 aspect-ratio: 1、最大尺寸和百分比尺寸，在两种方向和安全区内都保持可见。

视觉层包括低透明度圆环、四个角标、圆环中央极细十字辅助线和本地化说明。相机逻辑增加请求序号 cameraRequestId：每次打开、切换镜头、关闭或卸载都使旧请求失效，防止异步 getUserMedia 在弹窗已关闭后重新挂载视频流。打开时保存当前焦点并锁定 body 滚动；关闭时停止所有 track、清空 srcObject、恢复滚动和焦点。弹窗支持 Escape 和 Tab 循环，按钮继续保持 44px 触控目标。

### 3. 技术链路与交互稳健性

- API 概率归一化保留后端字段兼容性；空字符串标签不再被 JavaScript 的 Number('') 等于 0 误判为高度新鲜。
- 模型名通过当前 locale 映射为“高精度版（推荐）/经典版”或 “High-accuracy model (recommended)/Classic model”，页面、历史结果和 PDF 使用同一显示契约。
- 选择控件、相机按钮、折叠按钮和报告操作继续使用真实语义元素，动态状态通过 aria-live 或明确的 aria-* 关系暴露。
- prefers-reduced-motion、键盘焦点、svh、safe-area inset、触摸拖动和英文长文本均纳入 CSS/浏览器验收。

### 4. PDF 和英文内容

报告继续输出单页 A4 portrait，打印时固定 210mm × 297mm，屏幕预览响应式。升级点：

- PDF 顶部显示已本地化的模型名称，不再只显示 v1/v2；
- 置信度和三分类概率仍严格按后端 0/1/2 顺序输出，先夹紧到 0–1，再按百分比显示；
- 保留概率是相对模型判断、不是食品安全概率的说明、能力边界、时间、耗时、原图、Grad-CAM、证据和建议；
- 中文和英文分别验证标题、换行、页脚页码和安全提示没有溢出；
- 英文选词以用户动作和结果边界为准，使用 High-accuracy model、Choose an image、Camera viewfinder、Visual freshness report 等一致表达。

### 5. 参考文献与开源边界

About 页只渲染标准 citation 文本和非链接注释，不输出 a 元素，不发生点击跳转；文献数据中的来源 URL 可以继续作为维护者元数据保留，但不进入页面交互。

.gitignore 增加根目录和子目录通用的构建、Vite、覆盖率、Python、日志和 IDE 缓存规则。只删除或忽略生成物，不删除模型权重、训练代码、Hugging Face 部署文件、公开样例或项目文档。用 git ls-files 和 git status --ignored 验证没有把缓存纳入版本控制。

## 数据流与错误处理

```text
select model/filter
  -> typed Vue state
  -> API query / history computed filter

camera open
  -> capability + secure-context check
  -> request id guarded getUserMedia
  -> video metadata/play
  -> circular composition guide
  -> full-frame JPEG File
  -> existing handleFile -> compression -> API

prediction
  -> normalized result
  -> localized page model label
  -> buildReportHtml(locale-aware input)
  -> print/save A4 report
```

相机不支持、权限拒绝、视频尚未有尺寸、截图编码失败和网络错误分别落到现有本地化 toast/回退按钮；任何失败都必须清理 stream 和 loading 状态。

## 验收标准

1. 两个下拉控件在 Chromium 桌面、Firefox/系统原生菜单回退和移动窄屏上均能读出文字，聚焦时有可见轮廓。
2. 拍照弹窗在桌面和移动 viewport 中出现圆形鱼眼引导框；关闭、Escape、切换镜头和权限失败均不残留媒体流。
3. npm test、npm run typecheck、npm run build 全部通过，新增测试先红后绿。
4. Playwright 验证 1440×900、390×844 和至少一个窄英文 viewport 无横向溢出；执行 100 次折叠/筛选交互没有页面错误。
5. 中文和英文 PDF 都只有一页 A4，打印工具栏隐藏，文本和图像无裁切；PDF 中显示本地化模型名称与准确概率说明。
6. About 参考文献不包含可点击链接；git status --short --ignored 只显示预期本地生成目录，git ls-files 不包含缓存、测试样例目录或临时报告。
