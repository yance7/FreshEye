# FreshEye Runtime UX Repair Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with verification after each boundary. The user explicitly authorizes direct updates to `main`; do not create a pull request.

**Goal:** Repair the FreshEye Vue runtime, restore parity with the former HTML product, complete bilingual and responsive polish, and publish the verified result directly to `main`.

**Architecture:** Keep `frontend-vue/` as the only frontend source. Use Vite's static HTML entries with HTML5 history routes, eager shared views, local `Blob` conversion for compressed uploads, one upload/detection workspace, and the existing FastAPI API contract. Keep `frontend-dist/` as ignored CI output only.

**Tech Stack:** Vue 3, TypeScript, Vite, Vue Router, Node test runner, Playwright smoke tests, FastAPI/PyTorch, GitHub Pages.

## Global constraints

- Preserve `GET /health` and `POST /predict_with_gradcam?model_version=v1|v2` with multipart field `file`.
- Preserve upload, drag/drop, clipboard, camera, model selection, Grad-CAM, low-confidence handling, result tabs, history/favorites, report export and PWA behavior.
- Do not restore `test-samples` or publish `test_examples`.
- Rename only the repository model filename `models/best_fishfreshnetv2.pth`; do not rewrite the separate deployed HF Space weight unless a text reference explicitly requires it.
- Do not commit generated `frontend-dist/`, caches, `node_modules`, or secrets.
- Commit and push directly to `main`; do not create a draft PR.
- Use `apply_patch` for text edits and preserve unrelated user changes.

## Task 1: Lock the failing contracts before implementation

**Files:**
- Modify: `frontend-vue/contract.test.js`
- Inspect: `frontend-vue/src/router/index.ts`, `frontend-vue/src/main.ts`, `frontend-vue/src/views/HomeView.vue`, `frontend-vue/src/i18n/zh.ts`

1. Add red tests for HTML5 history routes and `.html` navigation targets; assert `createWebHashHistory` is absent.
2. Add a red test for local data URL conversion and assert analysis no longer contains `fetch(uploadDataUrl.value)`.
3. Add red tests for the renamed model, absent `test-samples`/`test_examples`, and no stale test-directory contract.
4. Add a red test for preview-state workspace gating and the Chinese mixed-language typo.
5. Run `npm test` from `frontend-vue` and record the expected failures before changing production code.

## Task 2: Repair routes, entry points and fast navigation

**Files:**
- Modify: `frontend-vue/src/router/index.ts`
- Modify: `frontend-vue/src/main.ts`
- Modify: `frontend-vue/src/components/AppNavbar.vue`
- Modify: `frontend-vue/src/components/AppFooter.vue`
- Modify: `frontend-vue/src/App.vue`
- Modify: `frontend-vue/src/views/HomeView.vue`

1. Replace hash history with `createWebHistory('/')` and make `/`, `/guide.html`, `/fish.html`, `/about.html`, and `/404.html` the canonical routes.
2. Keep compatible redirects for `/guide`, `/fish`, and `/about` only if they do not reintroduce hash URLs; make all internal navigation use `.html` paths.
3. Eagerly import shared views, remove entry-route replacement logic that was specific to hash history, and mount only after the router is ready.
4. Keep route transitions short and non-blocking; honor reduced motion and avoid a blank out-in gap.
5. Replace home CTA hash navigation with safe scrolling helpers where it improves URL cleanliness.
6. Run contract tests, typecheck and a production build.

## Task 3: Fix real image analysis and single-workspace sample behavior

**Files:**
- Add: `frontend-vue/src/utils/dataUrl.ts` if needed
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/composables/useApi.ts` only if verification finds an API error mapping gap

1. Add a pure local data URL to `Blob` conversion function using base64 decoding; never call `fetch()` on a `data:` URL.
2. Submit the original `File` when no compression happened; submit a locally constructed `File` only for compressed data.
3. Preserve MIME type, filename, timeout, model version and existing API error handling.
4. Await sample file handling, add loading/disabled state, and prevent duplicate sample clicks.
5. Render upload entry controls and sample grid only when there is no preview; render one preview/analyze workspace when selected. Clear/reset restores the entry state without stale error/result tabs.
6. Run the red-to-green tests, typecheck and build, then use a browser against a local server to verify a real API request completes without CSP console errors.

## Task 4: Resource, model and documentation cleanup

**Files:**
- Rename: `models/best_fishfreshnetv2.pth` -> `models/fishfreshnetv2.pth`
- Modify: `README.md`, `frontend-vue/contract.test.js`, relevant docs/workflows/config references
- Delete locally: exact generated `frontend-dist/` after final artifact checks

1. Scan text files for the old model filename, `test-samples`, `test_examples`, old `frontend/` production paths, and hash URLs.
2. Update source/docs/tests to the new model name and explain that `frontend-dist/` is generated by CI and ignored locally.
3. Preserve the user's staged/unstaged deletion of all `test-samples` files; do not use restore/checkout/reset.
4. Verify no forbidden test directory or generated artifact is in the intended publication set.

## Task 5: Bilingual and interaction polish

**Files:**
- Modify: `frontend-vue/src/i18n/zh.ts`, `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/src/components/AppNavbar.vue`
- Modify: `frontend-vue/src/views/GuideView.vue`, `FishView.vue`, `AboutView.vue`, `HomeView.vue`
- Modify: `frontend-vue/src/styles/global.css` and page styles as required
- Inspect: `frontend-vue/src/utils/pdfReport.ts`

1. Remove mixed Chinese/English phrasing and improve awkward English while keeping translation keys stable.
2. Replace the plain language text with an accessible segmented control, active state, focus state and mobile sizing.
3. Ensure all visible status, modal, history, result, advice and PDF strings use the current locale; remove hardcoded visible Chinese punctuation/labels where English would expose it.
4. Tune route focus/scroll behavior, onboarding dismissal, toasts, disabled/loading states, tabs and mobile menu behavior.
5. Add/adjust responsive styles for desktop and 390px mobile layouts, including overflow, image sizing, comparison slider and report actions.
6. Confirm PDF report generation uses the active locale for content and controls and has no external runtime dependency.

## Task 6: Automated and browser verification

1. Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`.
2. Run the backend test suite in `hf-space` and confirm model import/health checks where dependencies are available.
3. Serve the built output locally and use Playwright to verify:
   - direct `/`, `/guide.html`, `/fish.html`, `/about.html`, `/404.html` rendering;
   - navigation has no `#` and no page errors/blank content;
   - real upload and sample selection complete analysis;
   - preview mode has one workspace and clear restores entry controls;
   - Chinese/English on every page, including the report popup;
   - PDF report original/heatmap images, print/save, download and close controls;
   - mobile menu and 390px viewport have no horizontal overflow.
4. Capture desktop/mobile screenshots for visual review and inspect them when layout assertions fail.
5. Re-check tracked file list, model size, absent test directories and stale references.

## Task 7: Direct main publication

1. Review `git diff` and `git status`; stage only the intended source, docs, model rename, and user-requested deletions.
2. Commit with a descriptive message.
3. Push the local `main` directly to `origin/main`; do not open or create any PR.
4. Verify remote `main` points to the pushed commit and inspect the GitHub Pages workflow result.
5. If deployment passes, run final live smoke checks against the canonical pages and API, then mark the acceptance goal complete.
