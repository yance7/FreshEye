const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

const frontendRoot = __dirname;
const pages = ["index.html", "guide.html", "fish.html", "about.html", "404.html"];

function loadI18n() {
  const listeners = new Map();
  const storage = new Map();
  const document = {
    readyState: "complete",
    documentElement: { lang: "zh-CN" },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  const window = {
    document,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    dispatchEvent(event) {
      (listeners.get(event.type) || []).forEach((listener) => listener(event));
      return true;
    }
  };
  class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  }
  const context = vm.createContext({ window, document, CustomEvent, console });
  for (const file of [
    "assets/locale-zh.js",
    "assets/locale-en.js",
    "assets/i18n.js"
  ]) {
    const source = fs.readFileSync(path.join(frontendRoot, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }
  return { window, document, storage };
}

test("all user-facing pages load the bilingual runtime and language control", () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(frontendRoot, page), "utf8");
    assert.match(html, /assets\/locale-zh\.js/,
      `${page} should load the Chinese locale`);
    assert.match(html, /assets\/locale-en\.js/,
      `${page} should load the English locale`);
    assert.match(html, /assets\/i18n\.js/,
      `${page} should load the bilingual runtime`);
    assert.match(html, /id=["']languageToggle["']/,
      `${page} should expose the language toggle`);
    assert.match(html, /data-i18n=/,
      `${page} should declare translatable content`);
    assert.match(html, /name=["']viewport["'][^>]*viewport-fit=cover/,
      `${page} should opt into safe-area-aware mobile rendering`);
    assert.match(html, /assets\/style\.css/,
      `${page} should load the shared responsive stylesheet`);
  }
  assert.match(fs.readFileSync(path.join(frontendRoot, "index.html"), "utf8"), /assets\/pdf-report\.js/,
    "the analysis page should load the PDF report builder");
});

test("page translation keys resolve in English, including metadata and workflow tips", () => {
  const { window } = loadI18n();
  window.FreshEyeI18n.setLocale("en");
  for (const page of pages) {
    const html = fs.readFileSync(path.join(frontendRoot, page), "utf8");
    const keys = [...html.matchAll(/data-i18n(?:-(?:aria-label|title|placeholder|content|alt|tip))?="([^"]+)"/g)].map((match) => match[1]);
    for (const key of keys) {
      assert.notEqual(window.FreshEyeI18n.t(key), key, `${page} has an unresolved key: ${key}`);
    }
  }
});

test("language runtime defaults to Chinese, persists English, and exposes localized prediction copy", () => {
  const { window } = loadI18n();
  const i18n = window.FreshEyeI18n;

  assert.equal(i18n.getLocale(), "zh");
  assert.equal(i18n.t("nav.home"), "首页");
  assert.deepEqual(Array.from(i18n.getProbabilityValues({ "高度新鲜": 0.8, "新鲜": 0.15, "不新鲜": 0.05 })), [0.8, 0.15, 0.05]);

  i18n.setLocale("en");
  assert.equal(window.localStorage.getItem("fresheye-language"), "en");
  assert.equal(i18n.t("nav.home"), "Home");
  assert.equal(i18n.t("language.switchToChinese"), "Switch to Chinese");
  assert.equal(i18n.getPredictionCopy({ freshness_label: 0 }).label, "Highly fresh");
  assert.equal(i18n.getPredictionCopy({ freshness_label: 2 }).label, "Not fresh");
});

test("English history search and dynamic accessibility copy stay localized", () => {
  const { window } = loadI18n();
  const i18n = window.FreshEyeI18n;
  i18n.setLocale("en");

  const searchValues = i18n.getHistorySearchValues({
    freshness_label: 1,
    freshnessLevel: "新鲜",
    description: "鱼眼略有浑浊"
  });
  assert.ok(searchValues.includes("Fresh"), "history search should include the English freshness label");
  assert.ok(searchValues.some((value) => value.includes("slightly cloudy")),
    "history search should include localized feature text");

  const appSource = fs.readFileSync(path.join(frontendRoot, "assets", "app.js"), "utf8");
  assert.match(appSource, /tr\("page\.index\.compareAria"\)/,
    "the comparison slider label should follow the active locale");
  assert.doesNotMatch(appSource, /async function exportPDF\(/,
    "the retired non-localized PDF exporter should not remain in the runtime");
  assert.match(appSource, /showToast\(tr\("app\.analysis\.unexpected"\)/,
    "unhandled promise errors should use the active locale");
  assert.match(appSource, /refreshOpenConfidenceModal\(\);/,
    "an already-open confidence dialog should refresh when the language changes");

  const indexHtml = fs.readFileSync(path.join(frontendRoot, "index.html"), "utf8");
  assert.equal((indexHtml.match(/data-i18n-aria-label="page\.index\.uploadAria"/g) || []).length, 1,
    "the upload zone should not declare duplicate ARIA translation attributes");

  const responsiveCss = fs.readFileSync(path.join(frontendRoot, "assets", "css", "responsive.css"), "utf8");
  const polishCss = fs.readFileSync(path.join(frontendRoot, "assets", "css", "polish.css"), "utf8");
  assert.match(responsiveCss, /\.language-toggle[\s\S]*min-height:\s*44px/,
    "the language switch should retain a touch-sized target");
  assert.match(polishCss, /@media\s*\(max-width:\s*640px\)[\s\S]*\.report-tabs[\s\S]*grid-template-columns:\s*repeat\(2/,
    "mobile report tabs should use a two-column layout");
});

test("PDF builder emits an English document without Chinese-only report labels", () => {
  const pdfPath = path.join(frontendRoot, "assets", "pdf-report.js");
  const source = fs.readFileSync(pdfPath, "utf8");
  const context = vm.createContext({ window: {}, document: {}, console });
  vm.runInContext(source, context, { filename: "assets/pdf-report.js" });

  const report = context.window.FreshEyePdf.buildReportHtml({
    locale: "en",
    prediction: { freshness_label: 0, confidence: 0.91 },
    probabilities: { "高度新鲜": 0.91, "新鲜": 0.07, "不新鲜": 0.02 },
    recommendations: ["Keep refrigerated"],
    originalImage: "data:image/png;base64,AA==",
    heatmapImage: "data:image/png;base64,AA==",
    durationSec: 1.2,
    timestamp: "2026-08-15 12:00",
    modelVersion: "test-model"
  });

  assert.match(report.html, /<html[^>]+lang=["']en["']/i);
  assert.match(report.html, /AI-assisted freshness assessment/i);
  assert.match(report.html, /Recommendations/i);
  assert.match(report.html, /The fish eye is clear and bright/i,
    "the report should distinguish the appearance description from reference features");
  assert.equal(report.filename, "FreshEye-freshness-report-2026-08-15.pdf");
  assert.doesNotMatch(report.html, /新鲜度评估报告|处理建议|免责声明/);
});
