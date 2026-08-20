# FreshEye Final Seal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the final, production-ready FreshEye frontend with hardened interactions, motion, responsive behavior, bilingual content, PDF output, automated runtime tests, and verified direct publication to GitHub `main`.

**Architecture:** Preserve the current Vue application, public routes, FastAPI protocol, visual identity, and report architecture. Extract only lifecycle-heavy UI and shared normalization logic from `HomeView.vue`, then prove the result with unit, browser, PDF, backend, repository, deployment, and live-site evidence.

**Tech Stack:** Vue 3.5, TypeScript 5.6, Vite 5.4, Vitest, Vue Test Utils, jsdom, Playwright, Node test runner, FastAPI/PyTorch, GitHub Actions/Pages.

**Spec:** `docs/superpowers/specs/2026-08-20-fresheye-final-seal-design.md`

## Global Constraints

- Keep `/`, `/guide.html`, `/fish.html`, `/about.html`, and `/404.html` unchanged.
- Keep `POST /predict_with_gradcam?model_version=v1|v2`, multipart field `file`, and the backend response contract unchanged.
- Preserve the current deep-sea blue/aqua visual system; do not introduce a second theme or redesign page information architecture.
- Keep Chinese as the default locale and preserve `fresheye-language` plus legacy locale-key compatibility.
- Keep reports self-contained, external-font-free, and single-page A4 in Chinese and English.
- Do not commit `frontend-dist`, `node_modules`, screenshots, generated PDFs, caches, credentials, test data, or temporary QA scripts.
- Commit and push directly to `main`; do not create a pull request or draft pull request.
- Use red-green testing for every behavior change and preserve unrelated user work.

## File Responsibility Map

- `src/utils/prediction.ts`: pure API/history prediction normalization.
- `src/components/AccessibleDialog.vue`: ordinary modal semantics, focus, keyboard, and body-scroll lifecycle.
- `src/components/CameraCaptureDialog.vue`: camera stream ownership, capture, flip, fallback, cleanup, and responsive viewfinder UI.
- `src/composables/useMotionPreference.ts`: live reduced-motion, hover/pointer, and page-visibility state.
- `src/App.vue`: route metadata, route focus, reveal-node observation, progress, and page shell.
- `src/components/AppNavbar.vue`: desktop navigation and self-contained responsive mobile-menu lifecycle.
- `src/components/DeepBackground.vue`: decorative animation that consumes shared motion state.
- `src/views/HomeView.vue`: upload → analysis → result → history orchestration only; integrates extracted components.
- `src/i18n/index.ts`: typed locale shape and locale runtime.
- `src/i18n/zh.ts`, `src/i18n/en.ts`: complete user-facing copy.
- `src/utils/pdfReport.ts`: deterministic bilingual report markup and print layout.
- `src/styles/global.css` plus component styles: shared interaction, responsive, safe-area, and motion rules.
- `tests/unit/*`: executable pure/runtime component behavior.
- `tests/e2e/*`: real browser acceptance behavior.
- `.github/workflows/deploy.yml`: test → build → deploy publication gate.

---

### Task 1: Runtime Test Foundation and Shared Prediction Contract

**Files:**
- Create: `frontend-vue/vitest.config.ts`
- Create: `frontend-vue/tests/unit/prediction.test.ts`
- Create: `frontend-vue/src/utils/prediction.ts`
- Modify: `frontend-vue/package.json`
- Modify: `frontend-vue/package-lock.json`
- Modify: `frontend-vue/src/composables/useApi.ts`
- Modify: `frontend-vue/src/composables/useHistory.ts`
- Modify: `frontend-vue/src/i18n/index.ts`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Produces: `clampProbability(value: unknown): number`.
- Produces: `normalizeProbabilities(raw: unknown): ProbabilityMap`.
- Produces: `normalizeFreshnessLabel(level: unknown, label: unknown, probabilities: ProbabilityMap): FreshnessLabel`.
- Produces: `normalizePrediction(raw: unknown, fallbackModel: 'v1' | 'v2', fallbackTimestamp?: string): PredictionResult`.
- Produces: compile-time `TranslationShape<T>` for matching `zh` and `en` object shapes.

- [ ] **Step 1: Install and script the unit-test runtime**

Run from `frontend-vue`:

```powershell
npm install --save-dev vitest@2.1.9 @vue/test-utils@2.4.6 jsdom@25.0.1
```

Set scripts to:

```json
{
  "test": "npm run test:contract && npm run test:unit",
  "test:contract": "node contract.test.js",
  "test:unit": "vitest run",
  "test:unit:watch": "vitest"
}
```

Use this Vitest environment:

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', clearMocks: true, restoreMocks: true }
})
```

- [ ] **Step 2: Write failing normalization tests**

Cover null/blank values, decimal values, percentages, aliases, arrays, malformed payloads, historical keys, and deterministic label fallback:

```ts
import { describe, expect, it } from 'vitest'
import { clampProbability, normalizePrediction, normalizeProbabilities } from '@/utils/prediction'

describe('prediction normalization', () => {
  it.each([[null, 0], ['', 0], ['82', 0.82], [0.82, 0.82], [140, 1], [-2, 0]])(
    'normalizes %p to %p', (input, expected) => expect(clampProbability(input)).toBe(expected)
  )

  it('normalizes API arrays and historical aliases identically', () => {
    expect(normalizeProbabilities([82, 12, 6])).toEqual({ 0: 0.82, 1: 0.12, 2: 0.06 })
    expect(normalizeProbabilities({ highly_fresh: '82', fresh: '12', not_fresh: '6' }))
      .toEqual({ 0: 0.82, 1: 0.12, 2: 0.06 })
  })

  it('uses the largest probability when labels are malformed', () => {
    expect(normalizePrediction({ all_probabilities: [8, 81, 11] }, 'v2', '2026-08-20T00:00:00.000Z').freshness_label).toBe(1)
  })
})
```

- [ ] **Step 3: Run the new tests and verify the red state**

Run:

```powershell
npm run test:unit -- tests/unit/prediction.test.ts
```

Expected: failure because `src/utils/prediction.ts` does not exist.

- [ ] **Step 4: Implement the shared pure utility**

Implement the declared functions without Vue or browser dependencies. `normalizePrediction` must read both current snake_case and legacy camelCase fields, preserve a valid timestamp/model, and use one normalized probability map for label fallback.

Core shape:

```ts
export function normalizePrediction(
  raw: unknown,
  fallbackModel: 'v1' | 'v2',
  fallbackTimestamp = new Date().toISOString()
): PredictionResult {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const probabilities = normalizeProbabilities(source.all_probabilities ?? source.probabilityValues)
  const label = normalizeFreshnessLabel(source.freshness_level, source.freshness_label, probabilities)
  return {
    freshness_level: label,
    freshness_label: label,
    confidence_score: clampProbability(source.confidence_score ?? source.confidenceScore),
    all_probabilities: probabilities,
    description: typeof source.description === 'string' ? source.description : '',
    model_version: typeof source.model_version === 'string' ? source.model_version : fallbackModel,
    timestamp: typeof source.timestamp === 'string' ? source.timestamp : fallbackTimestamp
  }
}
```

- [ ] **Step 5: Replace API/history duplicate normalization**

Import the shared functions in `useApi.ts` and `useHistory.ts`. The API adapts `raw.prediction ?? raw`; history builds a compatible source object and then calls `normalizePrediction`. Remove local duplicate clamp/label/probability helpers.

- [ ] **Step 6: Make locale shape compile-time safe**

Replace the unsafe cast with:

```ts
type TranslationShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? TranslationShape<U>[]
    : T extends object
      ? { [K in keyof T]: TranslationShape<T[K]> }
      : T

const messages: Record<Locale, TranslationShape<typeof zh>> = { zh, en }
```

If the compiler identifies a real shape mismatch, correct the locale file rather than weakening the type.

- [ ] **Step 7: Run focused and existing tests**

Run:

```powershell
npm run test:unit -- tests/unit/prediction.test.ts
npm run test:contract
npm run typecheck
```

Expected: all commands exit zero.

- [ ] **Step 8: Commit Task 1**

```powershell
git add frontend-vue/package.json frontend-vue/package-lock.json frontend-vue/vitest.config.ts frontend-vue/tests/unit/prediction.test.ts frontend-vue/src/utils/prediction.ts frontend-vue/src/composables/useApi.ts frontend-vue/src/composables/useHistory.ts frontend-vue/src/i18n/index.ts frontend-vue/contract.test.js
git commit -m "test: add typed prediction runtime contract"
```

---

### Task 2: Accessible Dialog Primitive

**Files:**
- Create: `frontend-vue/src/components/AccessibleDialog.vue`
- Create: `frontend-vue/tests/unit/AccessibleDialog.test.ts`
- Modify: `frontend-vue/src/styles/global.css`

**Interfaces:**
- Consumes props: `open: boolean`, `titleId: string`, `descriptionId?: string`, `closeOnBackdrop?: boolean`, `initialFocus?: 'first' | 'dialog'`, `panelClass?: string`.
- Produces event: `close(reason: 'escape' | 'backdrop' | 'action')`.
- Produces slots: default dialog content.

- [ ] **Step 1: Write failing component tests**

Test dialog semantics, autofocus, Tab wrap, Shift+Tab wrap, Escape, backdrop behavior, body lock, and focus restoration:

```ts
const wrapper = mount(AccessibleDialog, {
  attachTo: document.body,
  props: { open: true, titleId: 'dialog-title' },
  slots: { default: '<h2 id="dialog-title">Title</h2><button id="first">First</button><button id="last">Last</button>' }
})
expect(wrapper.get('[role="dialog"]').attributes('aria-modal')).toBe('true')
expect(document.activeElement?.id).toBe('first')
await wrapper.get('[role="dialog"]').trigger('keydown', { key: 'Escape' })
expect(wrapper.emitted('close')?.at(-1)).toEqual(['escape'])
```

- [ ] **Step 2: Run the focused test and verify the red state**

```powershell
npm run test:unit -- tests/unit/AccessibleDialog.test.ts
```

Expected: failure because the component does not exist.

- [ ] **Step 3: Implement dialog lifecycle**

Use a stable dialog ref, store `document.activeElement` on open, derive focusable controls from:

```ts
const focusableSelector = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',')
```

Lock body scroll while preserving its exact previous inline overflow. Use a module-level lock depth so a second dialog cannot restore scrolling while the first is still open. On close/unmount, restore overflow and focus. Handle `Tab`, `Shift+Tab`, and `Escape` inside the dialog; use `Teleport to="body"` and a transition that respects global reduced-motion rules.

- [ ] **Step 4: Add resilient dialog styling**

Shared overlay and surface rules must include:

```css
.app-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
           max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  overflow-y: auto;
  overscroll-behavior: contain;
}
.app-dialog-surface { max-height: calc(100svh - 32px); overflow: auto; }
@supports (height: 100dvh) { .app-dialog-surface { max-height: calc(100dvh - 32px); } }
```

- [ ] **Step 5: Run dialog tests, typecheck, and contract tests**

```powershell
npm run test:unit -- tests/unit/AccessibleDialog.test.ts
npm run typecheck
npm run test:contract
```

- [ ] **Step 6: Commit Task 2**

```powershell
git add frontend-vue/src/components/AccessibleDialog.vue frontend-vue/tests/unit/AccessibleDialog.test.ts frontend-vue/src/styles/global.css
git commit -m "feat: add accessible dialog lifecycle"
```

---

### Task 3: Camera Stream Component and Capture Reliability

**Files:**
- Create: `frontend-vue/src/components/CameraCaptureDialog.vue`
- Create: `frontend-vue/tests/unit/CameraCaptureDialog.test.ts`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Consumes props: `open: boolean`.
- Produces event: `capture(file: File)`.
- Produces event: `close()`.
- Produces event: `fallback()`.
- Owns: current facing mode, request generation, stream, video element, canvas capture, and cleanup.
- Consumes: `AccessibleDialog` with `panelClass="camera-dialog-shell"` for focus, keyboard, backdrop, and body-scroll behavior.

- [ ] **Step 1: Write failing camera lifecycle tests**

Stub `navigator.mediaDevices.getUserMedia`, `HTMLMediaElement.prototype.play`, and a stream track. Assert one request on open, every track stopped on close/unmount/stale request, capture emits a JPEG `File`, permission failure exposes fallback, and flip replaces the previous stream.

```ts
expect(getUserMedia).toHaveBeenCalledOnce()
await wrapper.setProps({ open: false })
expect(stop).toHaveBeenCalledOnce()
expect(document.body.style.overflow).toBe(previousOverflow)
```

- [ ] **Step 2: Run the focused test and verify the red state**

```powershell
npm run test:unit -- tests/unit/CameraCaptureDialog.test.ts
```

Expected: failure because the component does not exist.

- [ ] **Step 3: Move camera ownership into the component**

Use request generations to discard stale streams:

```ts
let generation = 0
async function startCamera(): Promise<void> {
  const request = ++generation
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  if (request !== generation || !props.open) {
    stream.getTracks().forEach(track => track.stop())
    return
  }
  replaceStream(stream)
}
```

Capture at the video source resolution, emit `new File([blob], 'fresheye-camera.jpg', { type: 'image/jpeg' })`, then close only after the blob exists. Keep complete-file-input fallback when camera APIs are missing or permission is denied.

- [ ] **Step 4: Integrate with HomeView**

Replace inline camera template, state, lifecycle, and CSS with:

```vue
<CameraCaptureDialog
  :open="cameraModal"
  @close="cameraModal = false"
  @fallback="cameraInput?.click()"
  @capture="onCameraCapture"
/>
```

`onCameraCapture(file)` awaits `handleFile(file)` and never leaves a stale modal or stream.

- [ ] **Step 5: Run camera, contract, and type tests**

```powershell
npm run test:unit -- tests/unit/CameraCaptureDialog.test.ts
npm run test:contract
npm run typecheck
```

- [ ] **Step 6: Commit Task 3**

```powershell
git add frontend-vue/src/components/CameraCaptureDialog.vue frontend-vue/tests/unit/CameraCaptureDialog.test.ts frontend-vue/src/views/HomeView.vue frontend-vue/src/i18n/zh.ts frontend-vue/src/i18n/en.ts frontend-vue/contract.test.js
git commit -m "feat: isolate camera capture lifecycle"
```

---

### Task 4: Live Motion Policy, Reveal Efficiency, and Navigation Focus

**Files:**
- Create: `frontend-vue/src/composables/useMotionPreference.ts`
- Create: `frontend-vue/tests/unit/useMotionPreference.test.ts`
- Modify: `frontend-vue/src/components/DeepBackground.vue`
- Modify: `frontend-vue/src/App.vue`
- Modify: `frontend-vue/src/components/AppNavbar.vue`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/styles/global.css`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Produces readonly refs: `reduceMotion`, `canHover`, `coarsePointer`, `pageVisible`, `allowDecorativeMotion`.
- `allowDecorativeMotion` is true only when motion is allowed and the document is visible.

- [ ] **Step 1: Write failing motion tests**

Provide a controllable `matchMedia` stub and dispatch `change`/`visibilitychange`. Assert initial values, live updates, listener cleanup, and `allowDecorativeMotion` behavior.

```ts
const state = useMotionPreference()
expect(state.reduceMotion.value).toBe(false)
reducedQuery.matches = true
reducedQuery.dispatchEvent(new Event('change'))
expect(state.reduceMotion.value).toBe(true)
```

- [ ] **Step 2: Verify the red state**

```powershell
npm run test:unit -- tests/unit/useMotionPreference.test.ts
```

- [ ] **Step 3: Implement and consume the shared motion policy**

Register modern `addEventListener('change')` with a `addListener` fallback for older Safari. DeepBackground builds bubbles only when `allowDecorativeMotion` is true; Home mouse-follow logic starts only when `canHover && !coarsePointer && allowDecorativeMotion`.

- [ ] **Step 4: Replace global reveal rescanning**

Observe only added nodes and their descendants:

```ts
function observeTree(root: ParentNode): void {
  if (root instanceof HTMLElement && root.matches('.reveal:not(.revealed)')) observeReveal(root)
  root.querySelectorAll<HTMLElement>('.reveal:not(.revealed)').forEach(observeReveal)
}
```

MutationObserver callbacks pass each added `Element` to `observeTree`; they do not query `document` for unrelated mutations. Update the stale lazy-loading comment.

- [ ] **Step 5: Harden route and mobile-menu focus**

Give `<main id="main-content" tabindex="-1">`. After a non-popstate route navigation and `nextTick`, focus main with `{ preventScroll: true }`. In AppNavbar, watch `route.fullPath`, listen to the desktop media query, and close an open menu without stealing focus when the viewport becomes desktop.

- [ ] **Step 6: Make hover behavior capability-aware**

Move translated hover effects into:

```css
@media (hover: hover) and (pointer: fine) {
  .btn:hover { transform: translateY(-2px); }
  .footer-links a:hover { transform: translateX(3px); }
}
```

Keep `:active` and `:focus-visible` outside this query.

- [ ] **Step 7: Run focused and shell tests**

```powershell
npm run test:unit -- tests/unit/useMotionPreference.test.ts
npm run test:contract
npm run typecheck
```

- [ ] **Step 8: Commit Task 4**

```powershell
git add frontend-vue/src/composables/useMotionPreference.ts frontend-vue/tests/unit/useMotionPreference.test.ts frontend-vue/src/components/DeepBackground.vue frontend-vue/src/App.vue frontend-vue/src/components/AppNavbar.vue frontend-vue/src/views/HomeView.vue frontend-vue/src/styles/global.css frontend-vue/contract.test.js
git commit -m "feat: unify motion and navigation lifecycle"
```

---

### Task 5: Home Interaction Integration and Async Race Protection

**Files:**
- Create: `frontend-vue/tests/unit/HomeView.test.ts`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/components/AccessibleDialog.vue`
- Modify: `frontend-vue/src/composables/useApi.ts`
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Home owns monotonically increasing `fileGeneration` and `analysisGeneration` values.
- `handleFile(file): Promise<boolean>` returns whether a usable analysis payload was prepared.
- `callPredictApi(file, modelVersion, signal?)` accepts an optional external abort signal while retaining the timeout.

- [ ] **Step 1: Write failing Home interaction tests**

Mount with router and i18n providers. Test guide dialog semantics and restoration, low-confidence dialog Escape/view/retry, preprocess failure recovery, rapid file replacement, stale analysis suppression, and repeated analyze-button locking. Define test helpers with these signatures in the same file:

```ts
function deferredPrediction(): {
  promise: Promise<GradCAMResult>
  resolve: (value: GradCAMResult) => void
  reject: (reason?: unknown) => void
}
async function chooseFile(wrapper: VueWrapper, file: File): Promise<void>
async function clickAnalyze(wrapper: VueWrapper): Promise<void>
```

```ts
const first = deferredPrediction()
const second = deferredPrediction()
await chooseFile(wrapper, fileA)
void clickAnalyze(wrapper)
await chooseFile(wrapper, fileB)
void clickAnalyze(wrapper)
second.resolve(freshResult)
first.resolve(staleResult)
expect(wrapper.text()).toContain('高度新鲜')
expect(wrapper.text()).not.toContain('不新鲜')
```

- [ ] **Step 2: Verify the red state**

```powershell
npm run test:unit -- tests/unit/HomeView.test.ts
```

- [ ] **Step 3: Integrate AccessibleDialog for guide and low confidence**

Use unique title/description IDs, explicit action-close handlers, and translated close labels. Preserve the first-visit localStorage behavior, but make all dismissal paths accessible and deterministic.

- [ ] **Step 4: Protect image preprocessing**

Increment `fileGeneration` before reading. Build all derived payloads in local variables, then commit them only when the generation is still current. On error, clear the incomplete selection, expose the translated preprocessing error, and return `false`.

```ts
const generation = ++fileGeneration
try {
  const full = await fileToDataUrl(file)
  const upload = file.size > COMPRESS_THRESHOLD ? await compressImage(full, 1280, 0.9) : full
  if (generation !== fileGeneration) return false
  commitPreparedFile(file, full, upload)
  return true
} catch {
  if (generation === fileGeneration) resetPreparedFile(t('home.errors.preprocess'))
  return false
}
```

- [ ] **Step 5: Protect analysis requests**

Abort the previous request when a new file/model analysis begins; also compare `analysisGeneration` before updating result, history, warnings, timing, or toast state. `callPredictApi` connects the optional external signal to its existing timeout controller and removes that listener in `finally`:

```ts
const abortFromCaller = (): void => controller.abort()
signal?.addEventListener('abort', abortFromCaller, { once: true })
try {
  // existing multipart fetch uses controller.signal
} finally {
  signal?.removeEventListener('abort', abortFromCaller)
  window.clearTimeout(timer)
}
```

User-initiated aborts caused by replacement do not show a network-error toast.

- [ ] **Step 6: Audit resource cleanup and comments**

Release object URLs before replacement, stop count/scan/history timers on unmount, remove stale or section-only comments, and retain concise comments only where browser lifecycle or compatibility behavior is non-obvious.

- [ ] **Step 7: Run Home and full frontend tests**

```powershell
npm run test:unit -- tests/unit/HomeView.test.ts
npm test
npm run typecheck
```

- [ ] **Step 8: Commit Task 5**

```powershell
git add frontend-vue/tests/unit/HomeView.test.ts frontend-vue/src/views/HomeView.vue frontend-vue/src/components/AccessibleDialog.vue frontend-vue/src/composables/useApi.ts frontend-vue/src/i18n/zh.ts frontend-vue/src/i18n/en.ts frontend-vue/contract.test.js
git commit -m "fix: harden analysis and modal interactions"
```

---

### Task 6: Responsive UI and Short-Viewport Seal

**Files:**
- Modify: `frontend-vue/src/styles/global.css`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/views/GuideView.vue`
- Modify: `frontend-vue/src/views/FishView.vue`
- Modify: `frontend-vue/src/views/AboutView.vue`
- Modify: `frontend-vue/src/components/AccessibleDialog.vue`
- Modify: `frontend-vue/src/components/CameraCaptureDialog.vue`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- No public JavaScript interface changes.
- Produces responsive behavior for the complete viewport matrix and 200% text scaling.

- [ ] **Step 1: Extend static responsive contracts before CSS changes**

Add assertions for `svh`/`dvh`, safe-area padding, hover-capability query, short-landscape modal/camera scrolling, full-width mobile controls, fluid table wrappers, and absence of fixed content heights.

- [ ] **Step 2: Verify at least one new contract fails**

```powershell
npm run test:contract
```

- [ ] **Step 3: Apply shared responsive interaction rules**

Use fluid sizing and text-safe layout:

```css
.btn, .select-field__native, .nav-toggle { min-height: 44px; }
.table-wrap { max-width: 100%; overflow-x: auto; overscroll-behavior-inline: contain; }
@media (max-width: 640px) { .action-row > * { flex: 1 1 100%; } }
@media (max-height: 520px) and (orientation: landscape) {
  .app-dialog-overlay, .camera-overlay { place-items: start center; }
  .camera-dialog { margin-block: 8px; }
}
```

Do not use `overflow-x: hidden` as the sole fix for a child that is wider than its container.

- [ ] **Step 4: Refine visual state hierarchy**

Unify disabled opacity/cursor, busy feedback, active tab contrast, accordion hover/focus, destructive actions, image placeholders, and card edge contrast. Keep decorative glows subordinate to text and avoid adding new gradients where a border/state token is sufficient.

- [ ] **Step 5: Run contract, type, and build checks**

```powershell
npm run test:contract
npm run typecheck
npm run build
```

- [ ] **Step 6: Commit Task 6**

```powershell
git add frontend-vue/src/styles/global.css frontend-vue/src/views/HomeView.vue frontend-vue/src/views/GuideView.vue frontend-vue/src/views/FishView.vue frontend-vue/src/views/AboutView.vue frontend-vue/src/components/AccessibleDialog.vue frontend-vue/src/components/CameraCaptureDialog.vue frontend-vue/contract.test.js
git commit -m "style: seal responsive interaction states"
```

---

### Task 7: Bilingual Copy and PDF Accuracy Seal

**Files:**
- Create: `frontend-vue/tests/unit/i18n.test.ts`
- Create: `frontend-vue/tests/unit/pdfReport.test.ts`
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/src/utils/pdfReport.ts`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Produces identical flattened key sets for Chinese and English.
- Preserves `buildPdfReport(input): { html: string; title: string }`.

- [ ] **Step 1: Write failing locale and PDF tests**

Flatten both dictionaries and compare keys/value shapes. Build reports for every level and locale with long deterministic strings; assert escaped content, localized level/model/time/footer, fixed probability order, one `.pdf-page`, images, and no remote font/style URL.

```ts
expect(flattenKeys(en)).toEqual(flattenKeys(zh))
expect(report.html.match(/class="pdf-page/g)).toHaveLength(1)
expect(report.html).toContain('High-accuracy model (recommended)')
expect(report.html).not.toMatch(/https?:\/\/[^"']+\.(woff2?|ttf)/)
```

- [ ] **Step 2: Run focused tests and record failures**

```powershell
npm run test:unit -- tests/unit/i18n.test.ts tests/unit/pdfReport.test.ts
```

- [ ] **Step 3: Refine bilingual copy**

Review visible English by workflow: navigation → upload → camera → loading/errors → confidence notices → results/tabs → history → dialogs → PDF. Prefer concise product language; keep technical proper nouns and food-safety boundaries accurate. Fix Chinese only where clarity or symmetry requires it.

- [ ] **Step 4: Harden deterministic report markup**

Clamp all visible numeric fields, escape every external string, keep the locale class, use localized timestamp everywhere, and ensure long English metadata wraps inside its grid without changing the A4 dimensions.

- [ ] **Step 5: Run unit, contract, type, and build checks**

```powershell
npm run test:unit -- tests/unit/i18n.test.ts tests/unit/pdfReport.test.ts
npm test
npm run typecheck
npm run build
```

- [ ] **Step 6: Commit Task 7**

```powershell
git add frontend-vue/tests/unit/i18n.test.ts frontend-vue/tests/unit/pdfReport.test.ts frontend-vue/src/i18n/zh.ts frontend-vue/src/i18n/en.ts frontend-vue/src/utils/pdfReport.ts frontend-vue/contract.test.js
git commit -m "fix: seal bilingual report accuracy"
```

---

### Task 8: Playwright Acceptance Suite and Deployment Gate

**Files:**
- Create: `frontend-vue/playwright.config.ts`
- Create: `frontend-vue/tests/e2e/public-pages.spec.ts`
- Create: `frontend-vue/tests/e2e/home-flow.spec.ts`
- Create: `frontend-vue/tests/e2e/accessibility-responsive.spec.ts`
- Create: `frontend-vue/tests/e2e/report.spec.ts`
- Modify: `frontend-vue/package.json`
- Modify: `frontend-vue/package-lock.json`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.gitignore`
- Modify: `frontend-vue/.gitignore`

**Interfaces:**
- Produces script: `npm run test:e2e`.
- Produces script: `npm run verify` as `npm test && npm run typecheck && npm run build && npm run test:e2e`.

- [ ] **Step 1: Install and configure Playwright**

```powershell
npm install --save-dev @playwright/test@1.55.0
```

Use:

```ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
```

- [ ] **Step 2: Write public-page and language tests**

For all five routes, clear locale/guide storage, assert title/H1/main content, no `#` navigation, no page error, and exact document width. Toggle English and assert `html[lang="en"]`, English title, and persisted locale after reload.

- [ ] **Step 3: Write mocked Home workflow tests**

Route health and prediction calls with deterministic fixtures. Exercise first-visit guide, sample selection, model selection, analysis, confidence warning, tabs, heatmap keyboard control, accordion, history favorite/delete, clear/retry, and stale-response protection.

- [ ] **Step 4: Write modal, motion, and viewport tests**

Run the public pages at `320×568`, `360×800`, `390×844`, `430×932`, `844×390`, `768×1024`, `1024×768`, `1280×720`, `1440×900`, and `1920×1080`. Assert `scrollWidth <= clientWidth`, visible 44px targets, reachable modal actions, menu auto-close, focus restoration, reduced-motion final states, and no console/page errors except an explicitly mocked service-status response.

- [ ] **Step 5: Write report popup tests**

After a mocked analysis, capture the popup, assert Chinese and English title/model/time/level/disclaimer/image content, one page container, working close and download controls, and no remote resource requests.

- [ ] **Step 6: Run the local browser suite**

```powershell
npx playwright install chromium
npm run test:e2e
```

Expected: all browser tests pass in headless Chromium.

- [ ] **Step 7: Gate GitHub Pages deployment**

Before build/deploy, add workflow steps:

```yaml
- name: Run frontend tests
  run: npm test
  working-directory: frontend-vue
- name: Install Playwright Chromium
  run: npx playwright install --with-deps chromium
  working-directory: frontend-vue
- name: Run browser acceptance tests
  run: npm run test:e2e
  working-directory: frontend-vue
```

Ignore `test-results/`, `playwright-report/`, and `blob-report/` recursively.

- [ ] **Step 8: Run the full frontend verifier**

```powershell
npm run verify
git diff --check
```

- [ ] **Step 9: Commit Task 8**

```powershell
git add frontend-vue/playwright.config.ts frontend-vue/tests/e2e frontend-vue/package.json frontend-vue/package-lock.json .github/workflows/deploy.yml .gitignore frontend-vue/.gitignore
git commit -m "ci: gate deployment with browser acceptance"
```

---

### Task 9: Deep Review, PDF Rendering, Backend Verification, and Direct Publication

**Files:**
- Modify only files required by validated Critical or Important review findings.
- Remove locally: exact `Y:\FreshEye\tmp\audit-baseline` and all new QA output directories after evidence is recorded.

**Interfaces:**
- Produces final verified Git commit on local and remote `main`.
- Produces no PR.

- [ ] **Step 1: Perform independent requirement and code review**

Review the complete diff from `019b73a` through `HEAD` against every section of the spec. Resolve all Critical and Important findings; rerun the affected focused tests after each fix.

- [ ] **Step 2: Run fresh complete frontend verification**

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
git diff --check
```

Read exit codes and failure counts; do not infer success from prior runs.

- [ ] **Step 3: Run backend verification**

From `hf-space`:

```powershell
python -m pytest test_app.py -v
```

The 13 tests must cover health, root, CORS, invalid model, V1, V2, Grad-CAM, invalid format, oversized dimensions, PNG, WebP, cache hit, and rate limiting.

- [ ] **Step 4: Render and inspect bilingual PDFs**

Use Playwright/Chrome to generate Chinese and English report PDFs from deterministic high/mid/low fixtures. Use `pdfinfo`, `pdftotext`, and page PNG rendering to prove one A4 page, visible footer, correct model/time/labels, complete images, no clipping, and no print toolbar in content.

- [ ] **Step 5: Run repository hygiene and secret checks**

```powershell
git status --short --ignored
git ls-files
git grep -n -I -E "(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})"
```

Confirm no tracked dependency, build, cache, report, screenshot, QA, environment, credential, or deleted test-data payload.

- [ ] **Step 6: Remove exact temporary artifacts created by this work**

Resolve and verify `Y:\FreshEye\tmp\audit-baseline`, `frontend-vue/test-results`, `frontend-vue/playwright-report`, generated PDF directories, and local `frontend-dist` before deleting only those exact paths. Report that these generated artifacts are not recoverable and can be regenerated.

- [ ] **Step 7: Commit final review fixes if present**

Inspect `git status --short`, pass only the exact validated paths to `git add --`, and then commit:

```powershell
git commit -m "fix: resolve final seal review findings"
```

Skip this commit only when the review produced no file changes.

- [ ] **Step 8: Push directly to GitHub main**

```powershell
git push origin main
```

Do not create any PR. If rejected, fetch and inspect remote changes; never force-push without explicit user authorization.

- [ ] **Step 9: Verify GitHub and live deployment**

Confirm local `HEAD`, `origin/main`, and `git ls-remote origin refs/heads/main` are identical. Inspect the Pages workflow for that SHA until terminal success, then smoke-test the canonical live URLs at desktop/mobile sizes and verify the backend health/API status.

- [ ] **Step 10: Complete the acceptance goal**

Map each numbered user objective and every spec completion criterion to its authoritative command, browser, PDF, repository, or remote-deployment evidence. Mark the goal complete only when every row is proven and no required work remains.
