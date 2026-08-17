import type { FreshnessLabel, PredictionResult } from '@/types'

export interface ReportSection {
  key: string
  title: string
  desc: string
  items?: string[]
  icon?: string
}

export interface ReportLabels {
  title: string
  heading: string
  time: string
  duration: string
  model: string
  freshness: string
  confidence: string
  distribution: string
  original: string
  heatmap: string
  evidence: string
  trend: string
  advice: string
  limitation: string
  limitationText: string
  footer: string
  print: string
  download: string
  close: string
  noImage: string
  probabilityNote?: string
  probabilityLabels: [string, string, string]
}

export interface PdfReportInput {
  locale: 'zh' | 'en'
  prediction: PredictionResult
  durationMs: number
  timestamp: string
  modelVersion: string
  modelDisplayName: string
  originalImage?: string
  heatmapImage?: string
  localizedDescription?: string
  detailSections: ReportSection[]
  adviceSections: ReportSection[]
  labels: ReportLabels
}

export interface PdfReportResult {
  html: string
  title: string
  filename: string
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeImageSource(value: string | undefined): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^(data:image\/[a-z0-9.+-]+;base64,|blob:|https?:\/\/)/i.test(raw)) return raw
  if (/^[a-z0-9+/=\s]+$/i.test(raw) && raw.length > 100) {
    return 'data:image/png;base64,' + raw.replace(/\s/g, '')
  }
  return ''
}

function listHtml(items: string[] | undefined, className = 'pdf-list'): string {
  if (!items?.length) return ''
  return '<ul class="' + className + '">' + items.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>'
}

function imageBlock(title: string, source: string | undefined, emptyLabel: string): string {
  const safeSource = safeImageSource(source)
  return '<div class="pdf-img-block">' +
    (safeSource
      ? '<div class="pdf-img-wrap"><img src="' + escapeHtml(safeSource) + '" alt="' + escapeHtml(title) + '" /></div>'
      : '<div class="pdf-img-empty">' + escapeHtml(emptyLabel) + '</div>') +
    '<div class="pdf-caption">' + escapeHtml(title) + '</div>' +
    '</div>'
}

function detailBlock(section: ReportSection): string {
  return '<div class="pdf-detail">' +
    '<strong>' + escapeHtml(section.title) + '</strong>' +
    '<p>' + escapeHtml(section.desc) + '</p>' +
    listHtml(section.items, 'pdf-detail-list') +
    '</div>'
}

function reportFilename(locale: 'zh' | 'en', timestamp: string): string {
  const date = new Date(timestamp)
  const stamp = Number.isNaN(date.getTime())
    ? 'report'
    : date.toISOString().slice(0, 16).replace(/[-:T]/g, '_')
  return locale === 'zh'
    ? 'FreshEye_新鲜度报告_' + stamp + '.html'
    : 'FreshEye_Visual_Freshness_Report_' + stamp + '.html'
}

export function buildReportHtml(input: PdfReportInput): PdfReportResult {
  const { prediction, labels } = input
  const lang = input.locale === 'zh' ? 'zh-CN' : 'en'
  const level = prediction.freshness_level
  const palette = [
    { primary: '#0f9f83', deep: '#075e55', background: '#ecfbf7', badge: '#d3f5e9', icon: '✓' },
    { primary: '#c27a13', deep: '#8b4e08', background: '#fff8e8', badge: '#ffedbf', icon: '!' },
    { primary: '#d54343', deep: '#9e2727', background: '#fff0f0', badge: '#ffd9d9', icon: '⚠' }
  ]
  const tone = palette[level] ?? palette[1]
  const levelLabel = labels.probabilityLabels[level] ?? labels.noImage
  const confidence = Math.max(0, Math.min(1, Number(prediction.confidence_score) || 0))
  const confidencePercent = (confidence * 100).toFixed(1)
  const time = new Date(input.timestamp)
  const formattedTime = Number.isNaN(time.getTime())
    ? escapeHtml(input.timestamp)
    : escapeHtml(time.toLocaleString(input.locale === 'zh' ? 'zh-CN' : 'en-US'))
  const stackedProbabilities = ([0, 1, 2] as FreshnessLabel[]).map((probabilityLevel, index) => {
    const value = Math.max(0, Math.min(1, Number(prediction.all_probabilities[probabilityLevel]) || 0))
    const percent = (value * 100).toFixed(1)
    const text = value >= 0.1 ? escapeHtml(labels.probabilityLabels[index]) + ' ' + percent + '%' : ''
    return '<div class="pdf-bar-segment" style="flex:' + Math.max(value, 0.0001).toFixed(4) + ';background:' + palette[index].primary + '">' + text + '</div>'
  }).join('')
  const probabilityLegend = ([0, 1, 2] as FreshnessLabel[]).map((probabilityLevel, index) => {
    const value = Math.max(0, Math.min(1, Number(prediction.all_probabilities[probabilityLevel]) || 0))
    return '<span class="pdf-legend-item"><i style="background:' + palette[index].primary + '"></i>' +
      escapeHtml(labels.probabilityLabels[index]) + ' ' + (value * 100).toFixed(1) + '%</span>'
  }).join('')
  const details = input.detailSections.map(detailBlock).join('')
  const adviceCards = input.adviceSections
    .filter((section) => section.key !== 'safety')
    .map((section) => '<article class="pdf-advice-card">' +
      '<h3>' + escapeHtml((section.icon ? section.icon + ' ' : '') + section.title) + '</h3>' +
      listHtml(section.items, 'pdf-advice-list') +
      '</article>')
    .join('')
  const safetySection = input.adviceSections.find((section) => section.key === 'safety')
  const safety = safetySection
    ? '<div class="pdf-safety-banner ' + (level === 2 ? 'is-danger' : level === 1 ? 'is-warn' : 'is-safe') + '">' +
      '<h3>' + escapeHtml((safetySection.icon ? safetySection.icon + ' ' : '') + safetySection.title) + '</h3>' +
      listHtml(safetySection.items, 'pdf-safety-list') +
      '</div>'
    : ''
  const detailTrend = input.detailSections.find((section) => section.key === 'trend')?.desc || input.localizedDescription || ''
  const pageMarker = input.locale === 'en' ? 'Page 1 / 1' : '第 1 页 / 共 1 页'
  const footerText = labels.footer + ' · ' + pageMarker
  const title = labels.title
  const displayModel = input.modelDisplayName || input.modelVersion

  const html = [
    '<!doctype html>',
    '<html lang="' + lang + '">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
    '<title>' + escapeHtml(title) + '</title>',
    '<style>',
    ':root{color-scheme:light;--ink:#1e293b;--muted:#64748b;--line:#dfe9ed;--primary:' + tone.primary + ';--deep:' + tone.deep + ';--tone-bg:' + tone.background + ';--tone-badge:' + tone.badge + ';}',
    '@page { margin: 0; size: A4 portrait; }',
    '*{margin:0;padding:0;box-sizing:border-box;}',
    'html,body{width:100%;min-width:0;background:#e8f0f4;}',
    'body{font-family:-apple-system,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif;color:var(--ink);font-size:10.5px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-variant-numeric:tabular-nums;}',
    '.report-toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:linear-gradient(90deg,#0f766e,#0e7490);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.18);}',
    '.report-toolbar strong{font-size:13px;font-weight:700;overflow-wrap:anywhere;}',
    '.report-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}',
    '.report-actions button{min-height:36px;padding:8px 12px;border:0;border-radius:7px;background:#fff;color:#0f172a;cursor:pointer;font:inherit;font-size:12px;font-weight:600;}',
    '.report-actions button:hover,.report-actions button:focus-visible{transform:translateY(-1px);outline:2px solid #8df3e6;outline-offset:2px;box-shadow:0 3px 10px rgba(0,0,0,.2);}',
    '.report-actions button:first-child{background:#fde68a;}',
    '.report{width:210mm;margin:16px auto;}',
    '.pdf-page{position:relative;display:flex;flex-direction:column;width:210mm;height:297mm;min-height:297mm;overflow:hidden;margin:0 auto;padding:15mm 12mm 10mm;background:#fff;border:1px solid #d9e4ea;box-shadow:0 12px 34px rgba(15,23,42,.12);break-inside:avoid;}',
    '@media (min-width:641px){.pdf-page.locale-en{padding-top:13mm;padding-bottom:7mm;}.pdf-page.locale-en .pdf-header{padding-bottom:8px;}.pdf-page.locale-en .pdf-header-divider{margin-bottom:8px;}.pdf-page.locale-en .pdf-section{margin-bottom:7px;}.pdf-page.locale-en .pdf-section-title{margin-bottom:6px;}.pdf-page.locale-en .pdf-detail{margin-bottom:2px;padding:5px 10px;line-height:1.45;}.pdf-page.locale-en .pdf-detail-list{margin-top:2px;line-height:1.4;}.pdf-page.locale-en .pdf-advice-grid{gap:8px;}.pdf-page.locale-en .pdf-advice-card{padding:9px 11px 8px;}.pdf-page.locale-en .pdf-advice-card h3{margin-bottom:3px;}.pdf-page.locale-en .pdf-advice-list li,.pdf-page.locale-en .pdf-safety-list li{line-height:1.45;}.pdf-page.locale-en .pdf-safety-banner{padding:7px 11px;}.pdf-page.locale-en .pdf-scope-note{margin-top:6px;padding:6px 11px;line-height:1.45;}.pdf-page.locale-en .pdf-footer{padding-top:5px;}}',
    '.pdf-page:before{content:"";position:absolute;inset:0 0 auto;height:5px;background:linear-gradient(90deg,var(--deep),var(--primary),#34d3c2 72%,#d8fbf5);}',
    '.pdf-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:11px;}',
    '.pdf-header-brand{flex:1;color:#0f172a;letter-spacing:-.3px;}.pdf-brand-main{font-size:16px;font-weight:800;line-height:1.25;}.pdf-brand-sub{margin-top:3px;color:var(--deep);font-size:8.5px;font-weight:650;letter-spacing:.35px;}',
    '.pdf-header-title{flex:1.4;padding-top:1px;color:#0f172a;text-align:center;letter-spacing:.5px;}.pdf-title-kicker{display:block;margin-bottom:3px;color:#94a3b8;font-size:7.5px;font-weight:700;letter-spacing:1.4px;}.pdf-title-main{display:block;font-size:15px;font-weight:700;line-height:1.25;}',
    '.pdf-header-meta{display:flex;flex:1.2;flex-wrap:wrap;gap:6px;justify-content:flex-end;color:#64748b;font-size:8px;line-height:1.6;text-align:right;}.pdf-meta-tag{padding:3px 7px;border:1px solid #e5eef2;border-radius:5px;background:#f5f9fb;font-size:8px;white-space:nowrap;}.pdf-meta-tag strong{color:#475569;font-weight:600;}',
    '.pdf-header-divider{height:1px;margin:0 0 11px;border:0;background:linear-gradient(90deg,var(--primary),#dbeafe,transparent);}',
    '.pdf-section{margin-bottom:10px;break-inside:avoid;}.pdf-section-title{display:flex;align-items:center;gap:7px;margin-bottom:8px;color:#1e293b;font-size:12.5px;font-weight:750;letter-spacing:.3px;}.pdf-section-title:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,#e2e8f0,transparent);}.pdf-section-mark{display:inline-grid;place-items:center;width:24px;height:19px;border-radius:5px;background:var(--primary);color:#fff;font-size:8px;letter-spacing:.4px;}',
    '.pdf-overview{display:flex;align-items:stretch;gap:10px;break-inside:avoid;}.pdf-images{display:flex;flex:0 0 56%;gap:8px;}.pdf-img-block{display:flex;flex:1;flex-direction:column;min-width:0;}.pdf-img-wrap{aspect-ratio:1;padding:3px;overflow:hidden;border:1px solid #dce9ee;border-radius:10px;background:#fff;box-shadow:0 5px 14px rgba(15,23,42,.09);}.pdf-img-wrap img{display:block;width:100%;height:100%;object-fit:cover;}.pdf-img-empty{display:flex;align-items:center;justify-content:center;aspect-ratio:1;border:1px dashed #e2e8f0;border-radius:8px;background:#f8fafc;color:#94a3b8;font-size:10px;}.pdf-caption{margin-top:5px;color:#7c93a1;font-size:8px;font-weight:600;text-align:center;}',
    '.pdf-conclusion{position:relative;display:flex;flex:1;flex-direction:column;justify-content:center;overflow:hidden;padding:13px 15px 12px;border:1px solid rgba(15,159,131,.35);border-radius:12px;background:var(--tone-bg);box-shadow:0 6px 16px rgba(15,23,42,.08);break-inside:avoid;}.pdf-conclusion:after{content:"";position:absolute;top:-32px;right:-26px;width:92px;height:92px;border:1px solid rgba(15,159,131,.35);border-radius:50%;box-shadow:0 0 0 12px rgba(15,159,131,.1),0 0 0 24px rgba(15,159,131,.08);}.pdf-conclusion-kicker{position:relative;z-index:1;margin-bottom:8px;color:#64748b;font-size:8.5px;font-weight:700;letter-spacing:.55px;}.pdf-level-badge{display:inline-block;align-self:flex-start;margin-bottom:6px;padding:4px 10px;border-radius:6px;background:var(--tone-badge);color:var(--deep);font-size:12px;font-weight:700;letter-spacing:.3px;}.pdf-badge-icon{margin-right:3px;}.pdf-conf-label{position:relative;z-index:1;margin:1px 0;color:#64748b;font-size:8.5px;}.pdf-conf-num{position:relative;z-index:1;margin-bottom:8px;color:var(--primary);font-size:36pt;font-weight:750;line-height:1.05;letter-spacing:-1px;}.pdf-conf-bar{height:7px;overflow:hidden;border-radius:999px;background:#e1e9ed;}.pdf-conf-bar-fill{height:100%;border-radius:999px;background:var(--primary);}.pdf-conf-meta{margin-top:5px;color:#94a3b8;font-size:8.5px;line-height:1.4;}.pdf-conclusion-foot{position:relative;z-index:1;margin-top:8px;padding-top:7px;border-top:1px solid rgba(15,159,131,.25);color:var(--deep);font-size:8px;font-weight:650;}',
    '.pdf-stacked-bar{display:flex;height:27px;overflow:hidden;margin-bottom:7px;border-radius:999px;box-shadow:0 3px 8px rgba(15,23,42,.08);}.pdf-bar-segment{display:flex;align-items:center;justify-content:center;min-width:0;color:#fff;font-size:9px;font-weight:700;letter-spacing:.2px;text-shadow:0 1px 2px rgba(0,0,0,.25);white-space:nowrap;}.pdf-bar-legend{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;color:#64748b;font-size:9px;}.pdf-legend-item{display:flex;align-items:center;gap:4px;}.pdf-legend-item i{display:block;width:8px;height:8px;border-radius:999px;}.pdf-section-note{margin-top:7px;color:#94a3b8;font-size:8.5px;text-align:center;}',
    '.pdf-detail{margin-bottom:4px;padding:6px 11px;border:1px solid #e7eff3;border-left:3px solid var(--primary);border-radius:0 8px 8px 0;background:#f8fafc;color:#475569;font-size:9.5px;line-height:1.55;break-inside:avoid;}.pdf-detail strong{color:#1e293b;font-weight:650;}.pdf-detail p{display:inline;margin-left:4px;}.pdf-detail-list{display:flex;flex-wrap:wrap;gap:1px 16px;margin:3px 0 0 15px;padding:0;color:#64748b;font-size:8.8px;}.pdf-detail-list li{margin:0;max-width:46%;}',
    '.pdf-advice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;align-items:stretch;break-inside:avoid;}.pdf-advice-card{position:relative;display:flex;flex-direction:column;overflow:hidden;padding:12px 12px 10px;border:1px solid #e3edf1;border-radius:10px;background:linear-gradient(145deg,#fbfdfe,#f5f9fb);box-shadow:0 4px 12px rgba(15,23,42,.05);break-inside:avoid;}.pdf-advice-card:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,var(--primary),rgba(15,159,131,.08));}.pdf-advice-card h3{display:flex;align-items:center;gap:4px;margin-bottom:4px;color:#334155;font-size:10.5px;font-weight:650;}.pdf-advice-list{margin:0;padding:0;list-style:none;}.pdf-advice-list li{position:relative;margin-bottom:1px;padding-left:9px;color:#64748b;font-size:9px;line-height:1.55;}.pdf-advice-list li:before{content:"•";position:absolute;left:1px;color:var(--primary);font-size:10px;font-weight:700;}.pdf-safety-banner{grid-column:1/-1;padding:9px 13px;border:1px solid rgba(0,0,0,.04);border-left:4px solid var(--primary);border-radius:10px;background:var(--tone-bg);break-inside:avoid;}.pdf-safety-banner.is-danger{border-left-color:#d54343;background:#fff0f0;}.pdf-safety-banner.is-warn{border-left-color:#c27a13;background:#fff8e8;}.pdf-safety-banner h3{margin-bottom:3px;color:#334155;font-size:10.5px;font-weight:650;}.pdf-safety-list{display:flex;flex-wrap:wrap;gap:2px 16px;margin:0;padding:0;list-style:none;}.pdf-safety-list li{position:relative;padding-left:10px;color:#475569;font-size:9px;line-height:1.55;}.pdf-safety-list li:before{content:"•";position:absolute;left:1px;color:var(--primary);font-weight:700;}',
    '.pdf-scope-note{margin-top:9px;padding:8px 13px;border:1px solid #cbdde3;border-left:4px solid #0f766e;border-radius:9px;background:linear-gradient(135deg,#f7fbfc,#f1f7f8);color:#475569;font-size:8.8px;line-height:1.55;break-inside:avoid;}.pdf-scope-note strong{display:block;margin-bottom:3px;color:#0f172a;font-size:10px;}.pdf-footer{margin-top:auto;padding-top:7px;border-top:1px solid #dfe9ed;text-align:center;}.pdf-footer-main{color:#94a3b8;font-size:8.5px;letter-spacing:.3px;}.pdf-footer-sub{margin-top:1px;color:#cbd5e1;font-size:7.5px;}',
    '@media (max-width:640px){.report{width:calc(100vw - 20px);margin:10px auto;}.report-toolbar{align-items:stretch;flex-direction:column;gap:8px;padding:10px 12px;}.report-toolbar strong{text-align:center;}.report-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}.report-actions button{min-height:44px;padding-inline:8px;}.pdf-page{width:100%;height:auto;min-height:auto;overflow:visible;padding:20px 16px 16px;box-shadow:0 5px 18px rgba(15,23,42,.12);}.pdf-header{display:grid;grid-template-columns:1fr;gap:6px;}.pdf-header-title{order:-1;text-align:left;}.pdf-header-meta{justify-content:flex-start;text-align:left;}.pdf-overview{flex-direction:column;}.pdf-images{flex:initial;}.pdf-advice-grid{grid-template-columns:1fr;}.pdf-safety-banner{grid-column:auto;}.pdf-detail-list li{max-width:none;}}',
    '@media print{html,body{width:210mm!important;min-width:210mm!important;max-width:210mm!important;background:#fff;}body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}.report-toolbar{display:none!important;}.report{width:210mm!important;margin:0;}.pdf-page{width:210mm!important;min-width:210mm!important;max-width:210mm!important;height:297mm!important;min-height:297mm!important;margin:0;padding:15mm 12mm 10mm;border:0;box-shadow:none;overflow:hidden;page-break-inside:avoid;break-inside:avoid;}}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="report-toolbar" role="toolbar" aria-label="' + escapeHtml(title) + '"><strong>' + escapeHtml(title) + '</strong><div class="report-actions">',
    '<button type="button" id="print-report">' + escapeHtml(labels.print) + '</button>',
    '<button type="button" id="download-report">' + escapeHtml(labels.download) + '</button>',
    '<button type="button" id="close-report">' + escapeHtml(labels.close) + '</button>',
    '</div></div>',
    '<main class="report"><div class="pdf-page pdf-single-page locale-' + input.locale + '" style="--primary:' + tone.primary + ';--deep:' + tone.deep + ';--tone-bg:' + tone.background + ';--tone-badge:' + tone.badge + '">',
    '<header class="pdf-header"><div class="pdf-header-brand"><div class="pdf-brand-main">FreshEye</div><div class="pdf-brand-sub">' + escapeHtml(labels.footer) + '</div></div>',
    '<div class="pdf-header-title"><span class="pdf-title-kicker">FRESHEYE REPORT</span><span class="pdf-title-main">' + escapeHtml(title) + '</span></div>',
    '<div class="pdf-header-meta"><span class="pdf-meta-tag"><strong>' + escapeHtml(labels.model) + '</strong> ' + escapeHtml(displayModel) + '</span><span class="pdf-meta-tag"><strong>' + escapeHtml(labels.duration) + '</strong> ' + Math.max(0, Math.round(input.durationMs)) + ' ms</span><span class="pdf-meta-tag"><strong>' + escapeHtml(labels.time) + '</strong> ' + formattedTime + '</span></div></header>',
    '<hr class="pdf-header-divider" />',
    '<section class="pdf-section"><h2 class="pdf-section-title"><span class="pdf-section-mark">01</span>' + escapeHtml(labels.heading) + '</h2><div class="pdf-overview"><div class="pdf-images">',
    imageBlock(labels.original, input.originalImage, labels.noImage),
    imageBlock(labels.heatmap, input.heatmapImage, labels.noImage),
    '</div><div class="pdf-conclusion"><div class="pdf-conclusion-kicker">' + escapeHtml(labels.freshness) + '</div><div class="pdf-level-badge"><span class="pdf-badge-icon">' + tone.icon + '</span>' + escapeHtml(levelLabel) + '</div><div class="pdf-conf-label">' + escapeHtml(labels.confidence) + '</div><div class="pdf-conf-num">' + confidencePercent + '%</div><div class="pdf-conf-bar"><div class="pdf-conf-bar-fill" style="width:' + confidencePercent + '%"></div></div><div class="pdf-conf-meta">' + escapeHtml(labels.model) + ' · ' + escapeHtml(displayModel) + ' · AI</div><div class="pdf-conclusion-foot">' + escapeHtml(labels.trend) + ': ' + escapeHtml(detailTrend) + '</div></div></div></section>',
    '<section class="pdf-section"><h2 class="pdf-section-title"><span class="pdf-section-mark">02</span>' + escapeHtml(labels.distribution) + '</h2><div class="pdf-stacked-bar">' + stackedProbabilities + '</div><div class="pdf-bar-legend">' + probabilityLegend + '</div><p class="pdf-section-note">' + escapeHtml(labels.probabilityNote || labels.limitationText) + '</p></section>',
    '<section class="pdf-section"><h2 class="pdf-section-title"><span class="pdf-section-mark">03</span>' + escapeHtml(labels.evidence) + '</h2>' + details + '</section>',
    '<section class="pdf-section"><h2 class="pdf-section-title"><span class="pdf-section-mark">04</span>' + escapeHtml(labels.advice) + '</h2><div class="pdf-advice-grid">' + adviceCards + safety + '</div></section>',
    '<aside class="pdf-scope-note"><strong>' + escapeHtml(labels.limitation) + '</strong>' + escapeHtml(labels.limitationText) + '</aside>',
    '<footer class="pdf-footer"><div class="pdf-footer-main">FreshEye · ' + escapeHtml(footerText) + '</div><div class="pdf-footer-sub">' + escapeHtml(labels.model) + ': ' + escapeHtml(displayModel) + ' · ' + escapeHtml(labels.time) + ': ' + formattedTime + '</div></footer>',
    '</div></main>',
    '<script>(() => {',
    'const print = document.getElementById("print-report");',
    'const download = document.getElementById("download-report");',
    'const close = document.getElementById("close-report");',
    'print?.addEventListener("click", () => window.print());',
    'close?.addEventListener("click", () => window.close());',
    'download?.addEventListener("click", () => { const blob = new Blob([document.documentElement.outerHTML], { type: "text/html;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; const filename = document.title.replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "_") + ".html"; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });',
    '})();</script>',
    '</body>',
    '</html>'
  ].join('')

  return { html, title, filename: reportFilename(input.locale, input.timestamp) }
}
