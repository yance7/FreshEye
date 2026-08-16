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
  probabilityLabels: [string, string, string]
}

export interface PdfReportInput {
  locale: 'zh' | 'en'
  prediction: PredictionResult
  durationMs: number
  timestamp: string
  modelVersion: string
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
  if (!value) return ''
  if (/^(data:image\/[a-z0-9.+-]+;base64,|blob:|https?:\/\/)/i.test(value)) return value
  return ''
}

function imageCard(title: string, src: string | undefined, noImage: string): string {
  const safeSource = safeImageSource(src)
  return `<section class="report-card image-card"><h2>${escapeHtml(title)}</h2>${
    safeSource
      ? `<img src="${escapeHtml(safeSource)}" alt="${escapeHtml(title)}" />`
      : `<p class="muted">${escapeHtml(noImage)}</p>`
  }</section>`
}

function listItems(items: string[] | undefined): string {
  if (!items?.length) return ''
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function sectionCard(section: ReportSection): string {
  return `<section class="report-card"><h2>${escapeHtml(section.icon ? `${section.icon} ${section.title}` : section.title)}</h2>${listItems(section.items)}<p>${escapeHtml(section.desc)}</p></section>`
}

function reportFilename(locale: 'zh' | 'en', timestamp: string): string {
  const date = new Date(timestamp)
  const stamp = Number.isNaN(date.getTime())
    ? 'report'
    : date.toISOString().slice(0, 16).replace(/[-:T]/g, '_')
  return locale === 'zh'
    ? `FreshEye_新鲜度报告_${stamp}.html`
    : `FreshEye_Visual_Freshness_Report_${stamp}.html`
}

export function buildReportHtml(input: PdfReportInput): PdfReportResult {
  const { prediction, labels } = input
  const lang = input.locale === 'zh' ? 'zh-CN' : 'en'
  const level = prediction.freshness_level
  const levelClass = level === 0 ? 'fresh-high' : level === 1 ? 'fresh-mid' : 'fresh-low'
  const levelLabel = labels.probabilityLabels[level]
  const confidence = Math.max(0, Math.min(1, Number(prediction.confidence_score) || 0))
  const confidencePercent = `${(confidence * 100).toFixed(1)}%`
  const time = new Date(input.timestamp)
  const formattedTime = Number.isNaN(time.getTime())
    ? escapeHtml(input.timestamp)
    : escapeHtml(time.toLocaleString(input.locale === 'zh' ? 'zh-CN' : 'en-US'))
  const probabilities = ([0, 1, 2] as FreshnessLabel[]).map((label, index) => {
    const value = Math.max(0, Math.min(1, Number(prediction.all_probabilities[label]) || 0))
    return `<div class="probability"><div class="probability-head"><span>${escapeHtml(labels.probabilityLabels[index])}</span><strong>${(value * 100).toFixed(1)}%</strong></div><div class="probability-track"><span style="width:${value * 100}%"></span></div></div>`
  }).join('')
  const detail = input.detailSections.map(sectionCard).join('')
  const advice = input.adviceSections.map(sectionCard).join('')
  const title = labels.title

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --ink:#0b2238; --sea:#1185b8; --aqua:#27d0c4; --line:#d8e4ea; --muted:#5f7380; --high:#079669; --mid:#b26700; --low:#c92d2d; }
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin:0; color:var(--ink); background:#fff; font-family:Inter,"Segoe UI","PingFang SC","Microsoft YaHei",Arial,sans-serif; line-height:1.55; font-size:12px; }
    .report-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; margin:0 auto 18px; max-width:900px; background:#062a4d; color:#fff; border-radius:10px; }
    .report-toolbar strong { min-width:0; overflow-wrap:anywhere; }
    .report-actions { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
    .report-actions button { border:1px solid rgba(255,255,255,.35); border-radius:6px; background:transparent; color:#fff; padding:7px 11px; cursor:pointer; font:inherit; }
    .report-actions button:hover, .report-actions button:focus-visible { background:rgba(39,208,196,.2); outline:2px solid var(--aqua); outline-offset:2px; }
    .report { max-width:900px; margin:0 auto; }
    header.report-head { border-bottom:3px solid var(--aqua); padding-bottom:10px; margin-bottom:14px; }
    h1 { color:var(--sea); font-size:25px; line-height:1.2; margin:0 0 8px; overflow-wrap:anywhere; }
    h2 { margin:0 0 8px; font-size:14px; line-height:1.3; }
    p { margin:6px 0; overflow-wrap:anywhere; }
    .meta { color:var(--muted); font-size:11px; overflow-wrap:anywhere; }
    .report-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .report-card { border:1px solid var(--line); border-radius:9px; padding:12px 14px; margin:0 0 12px; break-inside:avoid; min-width:0; }
    .summary { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }
    .level { font-size:22px; font-weight:800; overflow-wrap:anywhere; }
    .fresh-high { color:var(--high); } .fresh-mid { color:var(--mid); } .fresh-low { color:var(--low); }
    .key-value { display:flex; align-items:baseline; justify-content:space-between; gap:12px; border-bottom:1px solid #edf2f4; padding:5px 0; }
    .key-value:last-child { border-bottom:0; }
    .probability { margin:9px 0; }
    .probability-head { display:flex; justify-content:space-between; gap:8px; }
    .probability-track { height:8px; border-radius:99px; background:#e7eef1; overflow:hidden; margin-top:4px; }
    .probability-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--aqua),var(--sea)); }
    ul { margin:6px 0 8px 18px; padding:0; } li { margin:3px 0; overflow-wrap:anywhere; }
    .image-card img { width:100%; max-height:280px; object-fit:contain; border-radius:7px; background:#eef5f7; }
    .muted { color:var(--muted); }
    .limitation { background:#f5fafb; border-color:#bedfe2; }
    .report-foot { color:var(--muted); border-top:1px solid var(--line); margin-top:10px; padding-top:10px; text-align:center; font-size:10px; }
    @media (max-width:640px) { .report-toolbar { align-items:flex-start; flex-direction:column; } .report-actions { justify-content:flex-start; } .summary,.report-grid { grid-template-columns:1fr; } }
    @media print { .report-toolbar { display:none !important; } body { font-size:11px; } .report { max-width:none; } .report-card { margin-bottom:8px; padding:9px 11px; } .image-card img { max-height:230px; } }
  </style>
</head>
<body>
  <div class="report-toolbar" role="toolbar" aria-label="${escapeHtml(title)}">
    <strong>${escapeHtml(title)}</strong>
    <div class="report-actions">
      <button type="button" id="print-report">${escapeHtml(labels.print)}</button>
      <button type="button" id="download-report">${escapeHtml(labels.download)}</button>
      <button type="button" id="close-report">${escapeHtml(labels.close)}</button>
    </div>
  </div>
  <main class="report">
    <header class="report-head"><h1>${escapeHtml(input.labels.heading)}</h1><div class="meta">${escapeHtml(labels.time)}: ${formattedTime} · ${escapeHtml(labels.duration)}: ${Math.max(0, Math.round(input.durationMs))} ms · ${escapeHtml(labels.model)}: ${escapeHtml(input.modelVersion)}</div></header>
    <div class="summary">
      <section class="report-card"><div class="meta">${escapeHtml(labels.freshness)}</div><div class="level ${levelClass}">${escapeHtml(levelLabel)}</div><div class="key-value"><span>${escapeHtml(labels.confidence)}</span><strong>${confidencePercent}</strong></div></section>
      <section class="report-card"><h2>${escapeHtml(labels.distribution)}</h2>${probabilities}</section>
    </div>
    ${imageCard(labels.original, input.originalImage, labels.noImage)}
    ${imageCard(labels.heatmap, input.heatmapImage, labels.noImage)}
    <section class="report-card"><h2>${escapeHtml(labels.evidence)}</h2>${detail}</section>
    <section class="report-card"><h2>${escapeHtml(labels.trend)}</h2>${escapeHtml(input.localizedDescription || labels.noImage)}</section>
    <section class="report-card"><h2>${escapeHtml(labels.advice)}</h2>${advice}</section>
    <section class="report-card limitation"><h2>${escapeHtml(labels.limitation)}</h2><p>${escapeHtml(labels.limitationText)}</p></section>
    <footer class="report-foot">FreshEye © 2026 · ${escapeHtml(labels.footer)}</footer>
  </main>
  <script>
    (() => {
      const print = document.getElementById('print-report');
      const download = document.getElementById('download-report');
      const close = document.getElementById('close-report');
      print?.addEventListener('click', () => window.print());
      close?.addEventListener('click', () => window.close());
      download?.addEventListener('click', () => {
        const blob = new Blob(['<!doctype html>\\n', document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = '${escapeHtml(reportFilename(input.locale, input.timestamp))}';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    })();
  </script>
</body>
</html>`

  return { html, title, filename: reportFilename(input.locale, input.timestamp) }
}
