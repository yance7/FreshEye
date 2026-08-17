# FreshEye Visual, Content, and Report Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints. This session executes the plan inline; no pull request will be created.

**Goal:** Restore the complete, accurate bilingual FreshEye experience while polishing the Vue UI, making all collapsible content robust, constraining Grad-CAM on every viewport, and matching the legacy one-page A4 report.

**Architecture:** Keep the existing Vue 3 + TypeScript + Vite single-page application and its four canonical HTML entry points. Centralize shared visual tokens and accordion behavior in existing styles/components, restore legacy About facts through structured bilingual message data, and rebuild `buildReportHtml()` around the legacy single-page A4 layout with inline print CSS. No prediction API or model contract changes.

**Tech Stack:** Vue 3.5, TypeScript, Vite 5, vue-router 4, CSS custom properties, Node `node:test` contract tests, browser print CSS, Poppler/pypdf for PDF verification.

## Global Constraints

- Preserve `/predict_with_gradcam`, `model_version`, freshness labels `0/1/2`, Grad-CAM response data, local history, camera, paste, drag/drop, and PWA behavior.
- Preserve the deep-sea visual identity; use the 4px spacing scale, 8/14/18px component radii, and 160/240/280ms motion tiers defined in the design spec.
- Use real, human-readable references with DOI, publisher, CVF, PMLR, arXiv, or Mendeley Data links; do not invent model claims or food-safety guarantees.
- Never render the same advice item as both a card summary and the first collapsed-list item.
- Collapsible panels must use real buttons, stable `aria-controls`, `aria-expanded`, CSS Grid `0fr`/`1fr` motion, and no fixed content-height cap.
- Grad-CAM comparison width must be capped at `min(100%, 640px)` on desktop and remain within the viewport on mobile.
- Printed report must be exactly one A4 portrait page; screen toolbar remains available and is hidden for print.
- Test before implementation for each behavior; run `npm test`, `npm run typecheck`, and `npm run build` before completion.
- Commit and push directly to remote `main`; do not create a PR or draft PR.

---

### Task 1: Add failing contract coverage for the requested end state

**Files:**
- Modify: `frontend-vue/contract.test.js`
- Read: `frontend-vue/src/views/HomeView.vue`, `frontend-vue/src/views/GuideView.vue`, `frontend-vue/src/views/AboutView.vue`, `frontend-vue/src/utils/pdfReport.ts`, `frontend-vue/src/styles/global.css`, `frontend-vue/src/i18n/zh.ts`, `frontend-vue/src/i18n/en.ts`

**Interfaces:**
- Consumes: current source strings and legacy content markers.
- Produces: deterministic source-contract assertions that fail until each requested behavior is implemented.

- [ ] **Step 1: Write failing assertions**

  Add focused Node tests for:

  ```js
  test('uses semantic resilient accordions and non-duplicated advice rendering', () => {
    const home = file('src/views/HomeView.vue');
    const guide = file('src/views/GuideView.vue');
    assert.match(`${home}\n${guide}`, /<button[^>]+accordion-head/);
    assert.match(`${home}\n${guide}`, /aria-controls/);
    assert.match(`${home}\n${guide}`, /grid-template-rows/);
    assert.doesNotMatch(home, /max-height:\s*500px/);
    assert.doesNotMatch(guide, /max-height:\s*400px/);
    assert.match(home, /v-if="a\.desc"/);
  });
  ```

  Add source checks that the report has `@page { size: A4 portrait;`, a single-page marker, compact overview layout, and print toolbar hiding; that the home comparison has `max-width: 640px`; that About has V1/CBAM/V2/ECA/Light CRA/Grad-CAM detail markers and linked references; and that both language packs contain the restored reference records and non-duplicated recommendation copy.

- [ ] **Step 2: Run the focused contract suite and confirm RED**

  Run from `frontend-vue`:

  ```powershell
  npm test
  ```

  Expected: the new assertions fail because the current source still uses `div[role=button]`, fixed `max-height`, the large comparison wrapper, condensed About data, and the multi-section PDF builder.

- [ ] **Step 3: Keep the failing tests as the acceptance contract**

  Do not weaken assertions to match the current implementation. Existing tests must remain unchanged and continue to cover routes, API, history, PWA, data URL conversion, and sample selection.

### Task 2: Refine global visual tokens, navigation, and result task bar

**Files:**
- Modify: `frontend-vue/src/styles/global.css`
- Modify: `frontend-vue/src/components/AppNavbar.vue`
- Modify: `frontend-vue/src/views/HomeView.vue`

**Interfaces:**
- Consumes: existing `--space-*`, `--radius-*`, `.navbar`, `.lang-switch`, `.result-toolbar`, `.tabs`, and `.glass-card` rules.
- Produces: consistent spacing/radius/motion tokens, aligned bilingual switch, resilient result task bar, and responsive touch targets without changing behavior.

- [ ] **Step 1: Add token and selector assertions to the failing contract**

  Assert the global stylesheet contains the 8/14/18px radius values, motion variables, a 44px language control, and task-bar wrapping rules; assert the navbar exposes both desktop and mobile language controls with translated labels and `aria-pressed`.

- [ ] **Step 2: Run `npm test` and confirm the new visual assertions fail**

- [ ] **Step 3: Implement the visual system**

  Update `:root` with named motion tokens and set the component radius ladder. Refine `.glass-card`, `.user-card`, `.pain-card`, `.tip-card`, `.tabs`, `.tab`, `.navbar`, `.nav-links`, `.lang-switch`, `.lang-option`, `.result-toolbar`, `.health-chip`, and the export button so:

  - card padding is 12/16/20px by component size;
  - desktop task-bar contents align on one baseline and wrap at 720px/640px without overlap;
  - language segments remain at least 44px tall, have an obvious active segment, and do not shift the navbar when the locale changes;
  - focus rings remain visible and hover lift is disabled under reduced motion;
  - mobile controls retain at least 44px touch targets and safe-area padding.

  Keep the current focus restoration and overlay behavior in `AppNavbar.vue`; only adjust markup if the visual/semantic contract needs a stable wrapper.

- [ ] **Step 4: Run tests and typecheck**

  ```powershell
  npm test
  npm run typecheck
  ```

### Task 3: Replace fixed-height accordions with semantic resilient panels

**Files:**
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/views/GuideView.vue`
- Modify: `frontend-vue/src/views/AboutView.vue`
- Modify: `frontend-vue/src/styles/global.css`

**Interfaces:**
- Consumes: existing `accordions`, `faqs`, `model-detail`, detailSections, and adviceSections state.
- Produces: stable panel IDs, real toggle buttons, keyboard support, CSS Grid height animation, and last-click-wins state with no timers or layout reads.

- [ ] **Step 1: Add/keep RED checks for semantic controls and no fixed caps**

  Require every interactive accordion header to be a `<button type="button">`, have `aria-expanded` and `aria-controls`, and require the styles to use `grid-template-rows: 0fr` and `1fr` with no `max-height` rules for accordion bodies.

- [ ] **Step 2: Run `npm test` and verify RED**

- [ ] **Step 3: Implement one toggle shape across Home and Guide**

  Add stable panel IDs such as `detail-panel-appearance`, `advice-panel-storage`, and `guide-faq-0`. Replace clickable `div` headers with buttons. Keep Enter/Space native button behavior and set `aria-controls` to the matching body ID. Render the body as:

  ```html
  <div class="accordion-body" :id="panelId">
    <div class="accordion-inner">...</div>
  </div>
  ```

  Use:

  ```css
  .accordion-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 280ms var(--ease-decel); }
  .accordion.is-open .accordion-body { grid-template-rows: 1fr; }
  .accordion-inner { min-height: 0; overflow: hidden; }
  ```

  Toggle only the relevant reactive boolean. Do not add debounced timers, `scrollHeight` reads, or duplicate global listeners. Update About model details and directory details to share the same visible spacing and focus treatment where applicable.

- [ ] **Step 4: Run the contract suite and a rapid-toggle DOM smoke check**

  ```powershell
  npm test
  ```

  The browser smoke check will click each FAQ/detail/advice button 30 times in alternating states and confirm the final `aria-expanded` value equals the last click, with no console error.

### Task 4: Restore complete bilingual Guide/About content and card layout

**Files:**
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/src/views/GuideView.vue`
- Modify: `frontend-vue/src/views/AboutView.vue`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Consumes: legacy `frontend/about.html`, `frontend/assets/locale-zh.js`, and `frontend/assets/locale-en.js` content as the source baseline.
- Produces: typed `PhotoCheck`, `InfoCard`, `Phase`, `Reference`, model-detail, workflow, journey, social-value, roadmap, and linked-reference collections in both locales.

- [ ] **Step 1: Add failing content assertions**

  Assert the language packs include the old content markers `v1FeatureScaling`, `v1CbamIntro`, `v1GradcamResult`, `v2EcaIntro`, `v2CraIntro`, `workflowDuty13`, `journeyResearchText`, `socialResearchText`, `refFfeNote`, `refGb`, and at least 10 reference entries. Assert Guide uses `photo-check-card`, `photo-check-item`, and a separate explanatory lead rather than a raw `<li><strong>...` concatenation.

- [ ] **Step 2: Run `npm test` and confirm RED**

- [ ] **Step 3: Add exact bilingual source content**

  Restore the old V1/V2 technical explanations and project journey/social-value copy, but render HTML emphasis through structured fields or safe explicit template elements instead of injecting unsanitized HTML. Use precise English terms: “fish-eye”, “visual freshness reference”, “confidence”, “Grad-CAM heatmap”, “channel attention”, “spatial attention”, “circular-region attention”, and “food-safety boundary”.

  Replace short string-only references with:

  ```ts
  interface Reference { citation: string; url: string; note?: string }
  ```

  Populate both locales with the corrected Prasetyo/FFE DOI, Yildiz DOI, VGG16, ResNet, MobileNetV2, EfficientNet, CBAM, Grad-CAM, ECA-Net, fish-eye/gill freshness research, GB 2733-2015, and the artificial-senses review. Link the FFE dataset separately to Mendeley Data.

- [ ] **Step 4: Implement the card templates**

  Render `photo-check-card` with a status badge, lead paragraph, and individually padded check rows. Render About users/why-eye/social/model details through the same information-card proportions; add `min-height` only to the card shell, not to text blocks. Use responsive grids that become one column below 768px and prevent long English words from overflowing.

- [ ] **Step 5: Run bilingual source and type checks**

  ```powershell
  npm test
  npm run typecheck
  ```

### Task 5: Correct homepage detail/advice composition and constrain Grad-CAM

**Files:**
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Consumes: `detailSections`, `adviceSections`, `lastHeatmap`, `lastOriginalImage`, pointer comparison handlers, and current prediction copy.
- Produces: non-repeating advice cards, accurate visual-only result copy, stable comparison bounds, and touch-safe interaction.

- [ ] **Step 1: Add failing assertions**

  Assert advice data does not assign its first list item as `desc`, the template conditionally renders descriptions, comparison CSS includes `max-width: 640px`, `max-height: min(...)`, and image layers use `aspect-ratio`/`object-fit` without a natural-size page expansion.

- [ ] **Step 2: Run `npm test` and confirm RED**

- [ ] **Step 3: Remove duplicated advice lead text**

  Set advice sections to use `desc: ''` unless a distinct category introduction exists. Render the lead paragraph only when it is non-empty; keep all recommendation items once in the list. Update the Chinese and English recommendation strings so each item is an actionable, safety-bounded sentence and the English punctuation/hyphenation is consistent.

- [ ] **Step 4: Implement bounded Grad-CAM comparison**

  Wrap the slider in a centered `.compare-stage` with `width: min(100%, 640px)`, `max-height: min(640px, calc(100svh - 240px))`, `aspect-ratio: 1`, and `contain: layout paint`. Make both image layers fill the stage with `object-fit: cover` and preserve the existing clip path. Add an accessible hidden range fallback or keyboard-adjustable comparison control if the existing pointer interaction has no keyboard path; keep pointer capture release on `pointerup`, `pointercancel`, and unmount.

- [ ] **Step 5: Run tests and typecheck**

  ```powershell
  npm test
  npm run typecheck
  ```

### Task 6: Rebuild the Vue report as a one-page A4 artifact

**Files:**
- Modify: `frontend-vue/src/utils/pdfReport.ts`
- Modify: `frontend-vue/src/i18n/zh.ts`
- Modify: `frontend-vue/src/i18n/en.ts`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Consumes: `PdfReportInput`, `ReportSection`, prediction probabilities, localized labels, original/heatmap data URLs, detail/advice arrays.
- Produces: `{ html, title, filename }` with inline CSS, toolbar controls, safe image sources, and a print layout constrained to one A4 portrait page.

- [ ] **Step 1: Start PDF artifact operation before authoring/export verification**

  Run exactly once immediately before the first PDF create/edit authoring command:

  ```powershell
  node container_tools/mark_artifact_operation_started.mjs --operation-kind edit --expected-output-count 1 --output-format pdf
  ```

- [ ] **Step 2: Add failing report assertions**

  Require `@page { margin: 0; size: A4 portrait; }`, `210mm`, `297mm`, `.pdf-single-page`, `.pdf-overview`, `.pdf-images`, `.pdf-advice-grid`, `@media print`, toolbar hiding, and a one-page footer marker. Assert the report no longer uses the current long `report-grid`/separate full-width image-card structure.

- [ ] **Step 3: Run `npm test` and verify RED**

- [ ] **Step 4: Implement the legacy-aligned single-page template**

  Port the old report structure into TypeScript with escaped text and safe image URLs. Keep the toolbar only for screen. Use a 210mm × 297mm `.pdf-page` with compact spacing, a header row, two square image blocks plus conclusion panel, stacked probability bar, three evidence rows, two-column advice cards, safety banner, scope note, and footer. Use locale-specific labels and filename; retain print, HTML download, and close actions.

  Keep image `alt`, captions, and empty states localized. Do not place model probabilities or visual confidence in food-safety language. Use only ASCII hyphens in generated print CSS where a hyphen is required by the PDF skill.

- [ ] **Step 5: Run tests, typecheck, and build**

  ```powershell
  npm test
  npm run typecheck
  npm run build
  ```

### Task 7: Finish responsive behavior and animation lifecycle

**Files:**
- Modify: `frontend-vue/src/styles/global.css`
- Modify: `frontend-vue/src/App.vue`
- Modify: `frontend-vue/src/views/HomeView.vue`
- Modify: `frontend-vue/src/views/GuideView.vue`
- Modify: `frontend-vue/src/views/AboutView.vue`

**Interfaces:**
- Consumes: reveal observer, scroll progress, route transition, camera/compare listeners, responsive style blocks.
- Produces: stable lifecycle cleanup, 320/360/390/430px layouts, reduced-motion behavior, and no animation-induced layout shift.

- [ ] **Step 1: Add failing responsive/source assertions**

  Require explicit breakpoints or fluid rules for 320px/360px/640px/768px, safe-area-aware fixed controls, reduced-motion overrides, and cleanup hooks for observers/listeners used by modified interactive views.

- [ ] **Step 2: Run `npm test` and confirm RED**

- [ ] **Step 3: Implement responsive and motion refinements**

  Make cards, tables, workflow strips, task bars, reports, and language controls wrap without horizontal overflow. Ensure mobile result tabs scroll inside their own strip, image comparison leaves room for labels/handle, and action buttons stack when needed. Reduce reveal blur and disable decorative movement for reduced-motion users. Preserve pointer listener cleanup and reset comparison drag state on unmount.

- [ ] **Step 4: Run all static checks**

  ```powershell
  npm test
  npm run typecheck
  npm run build
  ```

### Task 8: Browser, PDF, and source-level acceptance

**Files:**
- Create: `frontend-vue/qa/visual-acceptance.mjs`
- Create: `frontend-vue/qa/pdf-acceptance.mjs`
- Modify: `frontend-vue/contract.test.js`

**Interfaces:**
- Consumes: built `frontend-dist`, local Vite preview, report HTML, browser automation runtime, Poppler/pypdf where installed.
- Produces: repeatable desktop/mobile measurements, console-error checks, rapid-toggle checks, and one-page PDF evidence. QA scripts are local-only and do not ship in `frontend-dist`.

- [ ] **Step 1: Add failing QA assertions before the final implementation is claimed**

  The browser script must open `/`, `/guide.html`, `/fish.html`, and `/about.html` at 1440×900 and 390×844, assert no horizontal overflow, assert language switching changes visible page title/labels, measure the comparison stage below 640px, click all collapsible controls 30 times, and fail on console errors. The PDF script must print a representative report fixture or report popup, assert exactly one page with pypdf/pdfinfo, and render it with `pdftoppm` when available.

- [ ] **Step 2: Run the acceptance scripts and inspect screenshots/PDF PNG**

  Run the built app through a local preview. Inspect desktop and mobile screenshots with the image viewer; inspect the rendered A4 PNG for clipping, overflow, broken glyphs, unreadable text, and section alignment. If a tool is unavailable, record the exact missing dependency and use available browser metrics plus source checks.

- [ ] **Step 3: Fix any discovered issue with a new failing test first**

  For each defect, add the smallest reproducing assertion, observe RED, patch the implementation, and rerun all checks.

- [ ] **Step 4: Final verification**

  ```powershell
  npm test
  npm run typecheck
  npm run build
  node qa/visual-acceptance.mjs
  node qa/pdf-acceptance.mjs
  git diff --check
  git status --short --branch
  ```

### Task 9: Direct-main delivery

**Files:**
- Modify: all files from Tasks 1-8 only

**Interfaces:**
- Consumes: green tests, verified screenshots/PDF, clean scoped diff.
- Produces: one intentional commit on `main` and a direct push to `origin/main`; no PR objects.

- [ ] **Step 1: Review the diff and remove generated QA output**

  Keep only source, tests, design/plan docs, and intentional QA scripts. Remove temporary screenshots, PDFs, rendered PNGs, and generated `frontend-dist` output if ignored/generated.

- [ ] **Step 2: Commit directly on `main`**

  ```powershell
  git add frontend-vue docs/superpowers/2026-08-17-fresheye-visual-report-hardening-design.md docs/superpowers/2026-08-17-fresheye-visual-report-hardening-plan.md
  git commit -m "feat: polish bilingual visual report experience"
  ```

- [ ] **Step 3: Push only `main`**

  ```powershell
  git push origin main
  ```

- [ ] **Step 4: Confirm remote state and no PR workflow**

  ```powershell
  git status --short --branch
  git rev-parse HEAD
  git ls-remote origin refs/heads/main
  ```

  Expected: clean `main`, local and remote hashes equal, and no draft PR created.
