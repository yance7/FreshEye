import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = dirname(fileURLToPath(import.meta.url));
const repo = dirname(root);

function file(relativePath) {
  const absolutePath = join(root, relativePath);
  assert.equal(existsSync(absolutePath), true, `missing Vue file: ${relativePath}`);
  return readFileSync(absolutePath, 'utf8');
}

test('Vue source exposes the application and view contract', () => {
  file('index.html');
  file('src/main.ts');
  file('src/App.vue');
  file('src/router/index.ts');

  for (const view of ['HomeView.vue', 'GuideView.vue', 'FishView.vue', 'AboutView.vue', 'NotFoundView.vue']) {
    file(`src/views/${view}`);
  }

  const home = file('src/views/HomeView.vue');
  const fish = file('src/views/FishView.vue');
  const about = file('src/views/AboutView.vue');
  assert.match(home, /getUserMedia/);
  assert.match(home, /buildReportHtml/);
  assert.match(home, /low_conf_modal/);
  assert.match(fish, /buyingTips/);
  assert.match(about, /evidence-card/);
  assert.match(about, /workflowRows/);
});

test('shared shell and bilingual runtime are present', () => {
  file('src/components/AppNavbar.vue');
  file('src/components/AppFooter.vue');
  file('src/i18n/index.ts');
  const zh = file('src/i18n/zh.ts');
  const en = file('src/i18n/en.ts');

  for (const source of [zh, en]) {
    assert.match(source, /home/);
    assert.match(source, /guide/);
    assert.match(source, /fish/);
    assert.match(source, /about/);
  }
  assert.match(file('src/config/index.ts'), /fresheye_locale/);
});

test('API and history adapters retain the legacy browser contract', () => {
  const api = file('src/composables/useApi.ts');
  const history = file('src/composables/useHistory.ts');

  assert.match(api, /predict_with_gradcam/);
  assert.match(api, /model_version/);
  assert.match(api, /health/);
  assert.match(history, /localStorage/);
  assert.match(file('src/config/index.ts'), /fresheye-history/);
});

test('Vue preserves the legacy interaction surface', () => {
  const home = file('src/views/HomeView.vue');
  const app = file('src/App.vue');
  const entry = file('src/main.ts');
  const router = file('src/router/index.ts');
  const serviceWorker = file('public/sw.js');
  const api = file('src/composables/useApi.ts');
  const report = file('src/utils/pdfReport.ts');

  for (const marker of ['onDrop', 'onPaste', 'getUserMedia', 'modelVersion', 'lastHeatmap', 'showLowConfidenceModal', 'toggleFavorite', 'clearAllHistory', 'exportPDF', 'localStorage']) {
    assert.match(home, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')), `missing Home behavior: ${marker}`);
  }
  assert.match(api, /predict_with_gradcam/);
  assert.match(report, /window\.print/);
  assert.match(router, /guide\.html/);
  assert.match(router, /fish\.html/);
  assert.match(router, /about\.html/);
  assert.match(entry, /serviceWorker\.register/);
  assert.match(app, /AppNavbar/);
  assert.match(app, /AppFooter/);
  assert.match(serviceWorker, /fresheye-vue/);
});

test('canonical pages use clean HTML5 history navigation', () => {
  const router = file('src/router/index.ts');
  const main = file('src/main.ts');
  const navbar = file('src/components/AppNavbar.vue');
  const footer = file('src/components/AppFooter.vue');

  assert.match(router, /createWebHistory/);
  assert.doesNotMatch(router, /createWebHashHistory/);
  for (const path of ['/', '/guide.html', '/fish.html', '/about.html', '/404.html']) {
    assert.match(router, new RegExp(`path: ['"]${path.replace('/', '\\/')}['"]`), `missing canonical route: ${path}`);
  }
  assert.doesNotMatch(main, /getEntryRoute|router\.replace\(entryRoute/);
  for (const path of ['/guide.html', '/fish.html', '/about.html']) {
    assert.match(`${navbar}\n${footer}`, new RegExp(`to=["']${path.replace('.', '\\.')}["']`), `missing clean nav link: ${path}`);
  }
});

test('analysis converts local data URLs without a CSP-blocked fetch', () => {
  const home = file('src/views/HomeView.vue');
  const dataUrl = file('src/utils/dataUrl.ts');
  assert.match(home, /dataUrlToBlob|dataUrlToFile/);
  assert.doesNotMatch(home, /fetch\(uploadDataUrl\.value\)/);
  assert.match(dataUrl, /atob/);
  assert.match(dataUrl, /Uint8Array/);
});

test('English locale has no accidental visible Chinese copy', () => {
  const english = file('src/i18n/en.ts')
    .replace(/\/\/.*$/gm, '')
    .replace(/['"]中['"]/g, '');
  assert.doesNotMatch(english, /[\u4e00-\u9fff]/);
});

test('report builder is independent from page window orchestration', () => {
  const report = file('src/utils/pdfReport.ts');
  assert.match(report, /buildReportHtml/);
  assert.match(report, /html/);
  assert.match(report, /filename/);
});

test('Vue build is self-contained and is the production frontend contract', () => {
  const config = file('vite.config.ts');
  assert.match(config, /frontend-dist/);
  assert.doesNotMatch(config, /legacyAssetsRoot/);
  assert.equal(existsSync(join(repo, 'frontend-vue', 'public', 'assets', 'icon-192.png')), true);
  assert.equal(existsSync(join(repo, 'frontend-vue', 'public', 'assets', 'samples', 'fresh.webp')), true);
  assert.equal(existsSync(join(repo, 'frontend')), false);
  const workflow = readFileSync(join(repo, '.github', 'workflows', 'deploy.yml'), 'utf8');
  assert.match(workflow, /setup-node@v4/);
  assert.match(workflow, /working-directory: frontend-vue/);
  assert.match(workflow, /path: '\.\/frontend-dist'/);
});

test('open-source repository payload excludes local test data and uses the renamed model', () => {
  assert.equal(existsSync(join(repo, 'hf-space', 'app.py')), true);
  assert.equal(existsSync(join(repo, 'models')), true);
  assert.equal(existsSync(join(repo, 'test-samples')), false);
  assert.equal(existsSync(join(repo, 'test_examples')), false);
  assert.equal(existsSync(join(repo, 'models', 'fishfreshnetv2.pth')), true);
  assert.equal(existsSync(join(repo, 'models', 'best_fishfreshnetv2.pth')), false);
});

test('history previews cannot trigger a stale file re-analysis', () => {
  const home = file('src/views/HomeView.vue');
  assert.match(home, /selectedFile\.value = null/);
  assert.match(home, /uploadDataUrl\.value = ''/);
  assert.match(home, /v-if="selectedFile && uploadDataUrl"/);
});

test('sample selection keeps one detection workspace and bilingual copy stays natural', () => {
  const home = file('src/views/HomeView.vue');
  const zh = file('src/i18n/zh.ts');
  assert.match(home, /v-if="!previewUrl"/);
  assert.match(home, /sampleLoading/);
  assert.doesNotMatch(zh, /三步get鲜眸/);
});
