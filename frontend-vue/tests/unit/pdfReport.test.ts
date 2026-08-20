import { describe, expect, it } from 'vitest'
import { buildReportHtml, type PdfReportInput, type ReportLabels } from '@/utils/pdfReport'
import type { FreshnessLabel, PredictionResult } from '@/types'

const labels: ReportLabels = {
  title: 'Freshness report <unsafe>',
  heading: 'Assessment',
  time: 'Time',
  duration: 'Duration',
  model: 'Model',
  freshness: 'Freshness',
  confidence: 'Confidence',
  distribution: 'Probability',
  original: 'Original',
  heatmap: 'Heatmap',
  evidence: 'Evidence',
  trend: 'Trend',
  advice: 'Advice',
  limitation: 'Limitation',
  limitationText: 'Reference only <script>alert("x")</script> & keep food-safety checks.',
  footer: 'FreshEye footer',
  print: 'Print',
  download: 'Download',
  close: 'Close',
  noImage: 'No image',
  probabilityNote: 'Probabilities are visual model estimates.',
  probabilityLabels: ['Highly Fresh', 'Fresh', 'Not Fresh']
}

function prediction(level: FreshnessLabel): PredictionResult {
  return {
    freshness_level: level,
    freshness_label: level,
    confidence_score: Number.POSITIVE_INFINITY,
    all_probabilities: { 0: 0.25, 1: 0.5, 2: 0.25 },
    description: 'description',
    model_version: 'v2',
    timestamp: '2026-08-20T12:34:56.000Z'
  }
}

function reportInput(locale: 'zh' | 'en', level: FreshnessLabel): PdfReportInput {
  const unsafe = '<strong>unsafe & long</strong> '.repeat(20)
  return {
    locale,
    prediction: prediction(level),
    durationMs: Number.POSITIVE_INFINITY,
    timestamp: 'invalid <timestamp>',
    modelVersion: 'v2',
    modelDisplayName: locale === 'en' ? 'High-accuracy model (recommended)' : '高精度版（推荐）',
    originalImage: 'data:image/jpeg;base64,aGVsbG8=',
    heatmapImage: 'data:image/png;base64,aGVhdG1hcA==',
    localizedDescription: unsafe,
    detailSections: [{ key: 'appearance', title: unsafe, desc: unsafe, items: [unsafe] }],
    adviceSections: [{ key: 'storage', title: unsafe, desc: '', items: [unsafe] }],
    labels
  }
}

describe('deterministic PDF report builder', () => {
  it('renders one safe A4 page for every locale and freshness level', () => {
    for (const locale of ['zh', 'en'] as const) {
      for (const level of [0, 1, 2] as const) {
        const report = buildReportHtml(reportInput(locale, level))
        expect(report.html.match(/class="pdf-page/g)).toHaveLength(1)
        expect(report.html).toContain(`class="pdf-page pdf-single-page locale-${locale}"`)
        expect(report.html).toContain('@page { margin: 0; size: A4 portrait; }')
        expect(report.html).toContain('data:image/jpeg;base64,aGVsbG8=')
        expect(report.html).toContain('data:image/png;base64,aGVhdG1hcA==')
        expect(report.html).toContain('&lt;strong&gt;unsafe &amp; long&lt;/strong&gt;')
        expect(report.html).not.toMatch(/<strong>unsafe & long<\/strong>/)
        expect(report.html).not.toMatch(/https?:\/\/[^"']+\.(?:woff2?|ttf)/i)
        expect(report.html).not.toContain('Infinity')
        expect(report.html).not.toContain('NaN')
        expect(report.html).toContain(locale === 'en' ? 'Page 1 / 1' : '第 1 页 / 共 1 页')
      }
    }
  })

  it('keeps localized model names and probability order deterministic', () => {
    const report = buildReportHtml(reportInput('en', 0))
    const labelsInLegend = Array.from(report.html.matchAll(/class="pdf-legend-item"[^>]*>.*?<\/span>/g))
      .map((match) => match[0].replace(/^class="pdf-legend-item">/, '').replace(/<[^>]+>/g, '').trim())
    expect(labelsInLegend).toEqual(['Highly Fresh 25.0%', 'Fresh 50.0%', 'Not Fresh 25.0%'])
    expect(report.html).toContain('High-accuracy model (recommended)')
    expect(report.html).toContain('width:100%')
  })
})
