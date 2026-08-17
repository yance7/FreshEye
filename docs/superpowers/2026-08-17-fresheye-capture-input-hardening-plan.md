# FreshEye Capture Input Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 修复 FreshEye 的深色选择控件、增加鱼眼圆形拍照取景框，并完成交互稳健性、跨端适配、双语 PDF/文献展示和开源边界的验收。

**Architecture:** 延续现有 Vue 3 + TypeScript + 自写 i18n + 原生浏览器能力。选择控件保留原生 select，相机只增加视觉引导和生命周期保护，PDF 继续由独立 buildReportHtml 生成单页 A4；所有面向用户的文字继续由 zh.ts/en.ts 提供。

**Tech Stack:** Vue 3.5, TypeScript 5.6, Vite 5, Vue Router 4, Node built-in test runner, Chromium/Playwright QA, Poppler pdfinfo/pdftoppm。

## Global Constraints

- 不改变 FastAPI predict_with_gradcam?model_version=v1|v2 接口和 PredictionResult 字段。
- 不引入第三方 UI 组件或运行时 i18n 依赖。
- 模型输入保持完整视频帧/现有压缩链路；圆形取景框只作构图提示。
- PDF 保持单页 A4 portrait，中文/英文分别验收。
- About 参考文献页面不输出可点击 a。
- 仅直接提交和推送 main，不创建 PR 或草稿 PR。
- 生产构建目录 frontend-dist/ 和依赖目录 frontend-vue/node_modules/ 不进入 Git。

---

### Task 1: Add regression contracts for selectors, camera guide, bilingual report and repository boundary

**Files:**
- Modify: frontend-vue/contract.test.js
- Test data: existing source files under frontend-vue/src/

**Interfaces:**
- Consumes: existing source contract tests.
- Produces: failing assertions for the new visual and content contract before production edits.

- [ ] **Step 1: Write failing assertions**

Add tests that assert:

```js
test('select controls use a dark native skin and readable options', () => {
  const home = file('src/views/HomeView.vue');
  const global = file('src/styles/global.css');
  assert.match(home, /class="select-field"/);
  assert.match(global, /color-scheme:\s*dark/);
  assert.match(global, /select-field__native/);
  assert.match(global, /option\s*\{/);
});

test('camera viewfinder exposes a circular fish-eye guide and safe lifecycle hooks', () => {
  const home = file('src/views/HomeView.vue');
  assert.match(home, /camera-guide-ring/);
  assert.match(home, /cameraRequestId/);
  assert.match(home, /camera\.guide/);
  assert.match(home, /aria-keyshortcuts="Escape"/);
});

test('references render as plain citations and reports localize the model name', () => {
  const about = file('src/views/AboutView.vue');
  const home = file('src/views/HomeView.vue');
  const report = file('src/utils/pdfReport.ts');
  assert.doesNotMatch(about, /<a[^>]+reference\.url/);
  assert.match(about, /reference-citation/);
  assert.match(home, /modelDisplayName/);
  assert.match(report, /modelDisplayName/);
});

test('gitignore excludes generated and local cache payloads', () => {
  const ignore = readFileSync(join(repo, '.gitignore'), 'utf8');
  for (const marker of ['.vite/', 'coverage/', '.mypy_cache/', '*.log']) {
    assert.match(ignore, new RegExp(marker.replaceAll('.', '\.')));
  }
});
```

- [ ] **Step 2: Run the focused contract test and verify RED**

Run: npm test

Expected: FAIL because the new classes, camera request guard, localized model display name, plain reference citation, and ignore markers do not all exist yet.

- [ ] **Step 3: Keep the test as the executable acceptance contract**

Do not weaken the assertions to match the existing implementation; the following tasks must make the new contract pass.

### Task 2: Implement shared dark native select styling and interaction labels

**Files:**
- Modify: frontend-vue/src/views/HomeView.vue around model and history selects.
- Modify: frontend-vue/src/styles/global.css.
- Modify: frontend-vue/src/i18n/zh.ts.
- Modify: frontend-vue/src/i18n/en.ts.

**Interfaces:**
- Consumes: modelVersion and filterType refs.
- Produces: select-field wrappers with native select values unchanged.

- [ ] **Step 1: Wrap both selects without changing their values**

Use this structure for the model select:

```vue
<div class="select-field">
  <select id="model-version-select" v-model="modelVersion" class="select-field__native" :aria-label="t('home.model.label')">
    <option value="v2">{{ t('home.model.v2') }}</option>
    <option value="v1">{{ t('home.model.v1') }}</option>
  </select>
  <span class="select-field__chevron" aria-hidden="true">⌄</span>
</div>
```

Use the same wrapper and class for the history filter; preserve all five option values.

- [ ] **Step 2: Add the dark skin and responsive geometry**

Add the shared selector rules to global.css:

```css
.select-field { position: relative; min-width: 0; }
.select-field__native {
  appearance: none;
  min-height: 44px;
  min-width: 168px;
  padding: 9px 38px 9px 13px;
  border: 1px solid rgba(141, 243, 230, .34);
  border-radius: var(--radius-md);
  background: #062a4d;
  color: var(--foam);
  color-scheme: dark;
  font: inherit;
  cursor: pointer;
}
.select-field__native option { background: #062a4d; color: #eefcff; }
.select-field__native:focus-visible { outline: 2px solid var(--aqua); outline-offset: 3px; border-color: var(--aqua); }
.select-field__chevron { position: absolute; top: 50%; right: 13px; transform: translateY(-58%); color: var(--aqua); pointer-events: none; }
@media (max-width: 640px) { .select-field, .select-field__native { width: 100%; } .select-field__native { min-width: 0; } }
```

Use background-color rather than only a translucent background so a system menu cannot inherit a white/transparent contrast failure.

- [ ] **Step 3: Improve bilingual selector copy**

Change English model copy to High-accuracy model (recommended) and Classic model; keep Chinese 高精度版（推荐） and 经典版.

- [ ] **Step 4: Run the focused test and typecheck**

Run: npm test && npm run typecheck

Expected: Task 1 selector assertions pass and TypeScript exits 0.

### Task 3: Add circular fish-eye camera guide and lifecycle hardening

**Files:**
- Modify: frontend-vue/src/views/HomeView.vue.
- Modify: frontend-vue/src/i18n/zh.ts.
- Modify: frontend-vue/src/i18n/en.ts.

**Interfaces:**
- Consumes: existing camera refs, handleFile, and toast runtime.
- Produces: guarded startCamera, stopCamera, closeCamera, focus-safe camera dialog, and circular overlay.

- [ ] **Step 1: Add the failing camera contract before implementation**

This is covered by Task 1's camera test; run npm test again after adding only the test to confirm it still reports the missing cameraRequestId and guide markers.

- [ ] **Step 2: Add localized guide copy**

Add home.camera.guide:

```ts
// zh
guide: '请将鱼眼置于圆形取景框内，保持正面、清晰、光线充足。'
// en
guide: 'Place the fish eye inside the circle; keep it front-facing, sharp, and well lit.'
```

- [ ] **Step 3: Add request invalidation and focus state**

Introduce cameraOpenButton, cameraCloseButton, cameraRequestId, cameraPreviousBodyOverflow and cameraLastFocused. Increment cameraRequestId in openCamera, closeCamera, and onBeforeUnmount. startCamera stores the local request id, checks it after getUserMedia and after video.play(), and stops a stale stream instead of attaching it. closeCamera always stops tracks, clears srcObject, restores body overflow, and focuses the trigger.

- [ ] **Step 4: Add keyboard-safe dialog behavior**

Add onCameraKeydown, aria-keyshortcuts Escape, and a Tab loop over camera dialog buttons. Focus the close button after opening. Keep the existing file-input fallback for unsupported or denied camera access.

- [ ] **Step 5: Add the circular guide markup**

Place this inside camera-viewfinder after the video:

```vue
<div class="camera-guide" aria-hidden="true">
  <span class="camera-guide-ring"></span>
  <span class="camera-guide-crosshair"></span>
</div>
<p class="camera-guide-label">{{ t('home.camera.guide') }}</p>
```

The label must be visually associated with the viewfinder, not placed inside the video bitmap.

- [ ] **Step 6: Add responsive guide CSS**

Use a bounded circular overlay:

```css
.camera-guide { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.camera-guide-ring { width: min(66%, 360px); aspect-ratio: 1; border: 1px solid rgba(141,243,230,.78); border-radius: 50%; box-shadow: 0 0 0 999px rgba(2,10,22,.09), 0 0 24px rgba(39,208,196,.28), inset 0 0 18px rgba(39,208,196,.08); }
.camera-guide-crosshair { position: absolute; width: 18px; height: 18px; border: 1px solid rgba(238,252,255,.35); border-radius: 50%; }
.camera-guide-label { margin: 8px 0 0; color: var(--muted); font-size: 12px; text-align: center; line-height: 1.5; }
@media (max-width: 480px) { .camera-guide-ring { width: min(74%, 300px); } }
```

Use the existing corner marks as secondary framing cues. Respect reduced motion by disabling any guide pulse.

- [ ] **Step 7: Run test, typecheck, and build**

Run: npm test && npm run typecheck && npm run build

Expected: all contract tests pass, typecheck and Vite build exit 0.

### Task 4: Harden API normalization and localize report model metadata

**Files:**
- Modify: frontend-vue/src/composables/useApi.ts.
- Modify: frontend-vue/src/views/HomeView.vue.
- Modify: frontend-vue/src/utils/pdfReport.ts.

**Interfaces:**
- Consumes: existing backend response shapes and ReportLabels.
- Produces: finite normalized probability/label values and localized modelDisplayName in page/PDF.

- [ ] **Step 1: Add RED assertions**

Extend contract.test.js to require empty-string protection in the API adapter and modelDisplayName in PdfReportInput or the builder. Run npm test and observe failure before editing production code.

- [ ] **Step 2: Make label normalization reject blank numeric values**

Accept a numeric label only when the input is a number or a non-empty string. Let the existing text aliases/probability fallback decide for null, undefined, and blank strings.

- [ ] **Step 3: Add a localized model display name**

In HomeView.vue, compute a helper that maps any value containing v1 to t(home.model.v1), and otherwise maps to t(home.model.v2). Pass the result to buildReportHtml as modelDisplayName; keep raw modelVersion for API/history compatibility.

- [ ] **Step 4: Render the display name in the report**

Add required modelDisplayName to PdfReportInput, replace visible occurrences of input.modelVersion in the PDF header, conclusion and footer with input.modelDisplayName, and retain the raw model value only if needed in hidden/debug metadata.

- [ ] **Step 5: Verify regression and build**

Run: npm test && npm run typecheck && npm run build

Expected: all tests pass and both locales compile.

### Task 5: Restore plain reference formatting and strengthen open-source ignore boundary

**Files:**
- Modify: frontend-vue/src/views/AboutView.vue.
- Create: frontend-vue/.gitignore.
- Modify: .gitignore.
- Modify: frontend-vue/contract.test.js.

**Interfaces:**
- Consumes: reference citation/note objects and existing Git tracking.
- Produces: non-clickable reference list and shared cache exclusion rules.

- [ ] **Step 1: Add the RED reference and ignore assertions**

Task 1 already asserts no linked reference output and the new ignore markers. Run npm test before editing this task and confirm the failure is attributable to the current anchor and missing markers.

- [ ] **Step 2: Render citations as text**

Replace the reference anchor with a span class reference-citation. Keep reference.note as a normal block of text and change styles from link colors/hover to readable citation text with hanging indentation and overflow-wrap anywhere.

- [ ] **Step 3: Add cache rules without hiding source artifacts**

Add these patterns to the root ignore file:

```gitignore
.vite/
**/.vite/
coverage/
**/coverage/
.mypy_cache/
**/.mypy_cache/
.ruff_cache/
**/.ruff_cache/
*.log
*.tmp
*.report.html
.idea/
**/.idea/
.vscode/
**/.vscode/
```

Add matching frontend-vue/.gitignore for local frontend output if the package is copied independently. Do not ignore public/assets, src or package-lock.json.

- [ ] **Step 4: Verify tracked payload**

Run:

```powershell
git status --short --ignored
git ls-files | Select-String -Pattern 'node_modules|frontend-dist|coverage|\\.vite|\\.pytest_cache|__pycache__|test-samples|test_examples'
```

Expected: ignored local directories may appear only under git status --ignored; the git ls-files filter returns no output.

- [ ] **Step 5: Run test and typecheck**

Run: npm test && npm run typecheck

Expected: About reference test and all existing tests pass.

### Task 6: Perform browser, PDF, responsive, and final Git acceptance

**Files:**
- No production changes unless a verification failure requires a targeted TDD fix.
- Temporary QA artifacts: outside the repository or under tmp/pdfs/, removed after inspection.

**Interfaces:**
- Consumes: built frontend, local Vite server, existing mock analysis fixture pattern.
- Produces: fresh acceptance evidence for all nine requirements.

- [ ] **Step 1: Run the complete local suite**

Run from frontend-vue:

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, typecheck exits 0, build emits frontend-dist successfully.

- [ ] **Step 2: Browser-check desktop and mobile routes**

Start npm run dev -- --host 127.0.0.1, visit /, /guide.html, /fish.html and /about.html at 1440×900, 390×844 and a narrow English viewport. Assert no horizontal overflow, one visible header language switch, readable select text, circular camera guide markup and no console/page errors.

- [ ] **Step 3: Exercise interactive paths**

Use a mock health and predict response to verify upload → result → detail/advice accordions → history filter/search → export. Dispatch 100 accordion clicks and confirm no exceptions or stuck geometry. Open the camera with mocked getUserMedia, close it with the button and Escape, and assert tracks are stopped and body overflow is restored.

- [ ] **Step 4: Generate and inspect both PDF locales**

Use buildReportHtml through the dev server, print the Chinese and English report in Chromium, then run pdfinfo and pdftoppm. Require one page, A4 size, hidden toolbar, localized model text, intact Chinese glyphs/English wrapping, no clipped footer or advice cards. Delete rendered PNGs and temporary PDFs after inspection.

- [ ] **Step 5: Review repository payload and diff**

Run:

```powershell
git diff --check
git status --short --branch
git ls-files
```

Confirm only intended source, tests, docs, ignore rules and existing project assets are tracked; no cache, local report, generated build or unrelated test data is staged.

- [ ] **Step 6: Commit and push main directly**

After fresh verification:

```powershell
git add -A
git commit -m "feat: harden capture controls and bilingual reports"
git -c http.proxy= push origin main
git status --short --branch
git -c http.proxy= ls-remote origin refs/heads/main
```

Expected: origin/main equals the new commit, worktree is clean, and no PR or draft PR is created.
