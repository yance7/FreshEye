# FreshEye Vue Migration and Open-Source Sync Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with verification after each boundary. The user explicitly authorizes direct updates to `main`; do not create a pull request.

**Goal:** Make the Vue frontend the sole deployable frontend, move the repository contents and requested model/data directories under `Y:\FreshEye`, remove the legacy HTML frontend, and publish the verified result directly to GitHub `main`.

**Architecture:** Keep `frontend-vue/` as the Vue 3 + TypeScript source project. Make its static assets self-contained under `frontend-vue/public/assets`, build to ignored `frontend-dist/`, and update GitHub Pages to install/build Vue before uploading that output. Move the Git repository metadata and project files to `Y:\FreshEye`, with `hf-space`, `models`, and `test-samples` as top-level source directories.

**Tech Stack:** Vue 3, TypeScript, Vite, Vue Router, Node test runner, FastAPI/PyTorch model files, GitHub Actions Pages.

## Global Constraints

- Preserve the backend API contract: `GET /health` and `POST /predict_with_gradcam?model_version=v1|v2` with multipart field `file`.
- Preserve upload, drag/drop, clipboard, camera, model selection, Grad-CAM, confidence branching, history, favorites, report printing/PDF, PWA, and bilingual behavior.
- Do not retain the old `frontend/` HTML/CSS/JS production directory after migration.
- Deploy the Vue build output, never an unbuilt source directory.
- Exclude generated caches such as `__pycache__`, `*.pyc`, `node_modules`, and local secrets from the published repository.
- Commit only the requested migration, cleanup, source/data sync, documentation, and workflow changes.
- Push directly to `main`; do not create a draft PR.

## Task 1: Establish the parity and repository baseline

**Files:**
- Inspect: `frontend/`, `frontend-vue/`, `.github/workflows/deploy.yml`, `README.md`, `docs/`
- Test: `frontend/bilingual.test.js`, `frontend-vue/contract.test.js`

- [ ] Inventory legacy entry pages, runtime scripts, API fields, localStorage keys, PWA files, and report export behavior.
- [ ] Compare the inventory with Vue source and record any missing production contract before deleting anything.
- [ ] Record current branch, remote, worktree, and parent-directory contents.

## Task 2: Make Vue self-contained and deployable

**Files:**
- Copy: `frontend/assets/icon-*.png`, `frontend/assets/og-cover.png`, `frontend/assets/samples/*.webp` -> `frontend-vue/public/assets/`
- Modify: `frontend-vue/vite.config.ts`
- Modify: `.github/workflows/deploy.yml`
- Modify: `frontend-vue/contract.test.js`

- [ ] Remove the build-time dependency on `../frontend/assets`.
- [ ] Confirm `npm ci` plus `npm run build` succeeds with the legacy directory absent.
- [ ] Build into `frontend-dist/` and upload only that directory in Pages workflow.
- [ ] Add Node setup and dependency installation to the workflow.

## Task 3: Re-root the repository and synchronize requested directories

**Files:**
- Move Git repository root from `Y:\FreshEye\FreshEye` to `Y:\FreshEye`.
- Move project files and `.git` to the new root.
- Move `Y:\FreshEye\hf-space` and `Y:\FreshEye\models` into the repository root.
- Move `Y:\FreshEye\samples\Test_samples` to `Y:\FreshEye\test-samples`.

- [ ] Validate every source/data path before moving it.
- [ ] Remove only generated caches from the synchronized directories.
- [ ] Verify model weights and test images are present and below GitHub file-size limits.
- [ ] Verify no nested Git repositories or accidental secrets are included.

## Task 4: Remove legacy frontend and refresh documentation

**Files:**
- Delete: `frontend/`
- Modify: `.gitignore`, `README.md`, `frontend-vue/contract.test.js`, Vue migration docs

- [ ] Remove only the exact legacy `frontend/` directory after the new build path is proven.
- [ ] Update README structure, Vue commands, deployment path, and links.
- [ ] Assert in tests that the legacy directory is absent and Vue assets are self-contained.

## Task 5: Deep verification

- [ ] Run Vue typecheck, contract tests, production build, and built-artifact reference checks.
- [ ] Run Python tests in `hf-space` and model import/compile checks where dependencies are available.
- [ ] Scan tracked candidates for secrets, generated caches, oversized files, broken references, stale `frontend/` paths, and unsafe build output.
- [ ] Run local HTTP smoke tests for all static entry points.
- [ ] Inspect the staged diff and confirm only intended files are included.

## Task 6: Direct main publication

- [ ] Stage the verified scope explicitly.
- [ ] Commit with a descriptive migration message.
- [ ] Push `main` directly to `origin`.
- [ ] Verify remote `main` points at the pushed commit and the Pages workflow is present for the Vue build.
