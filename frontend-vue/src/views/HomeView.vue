<script setup lang="ts">
// 鲜眸 FreshEye · 首页检测视图
// Hero（动态鱼眼 + countUp）+ 上传区（拖拽/粘贴/拍照/示例）+ 4-Tab 分析报告
// + 历史记录（搜索/过滤/收藏）+ PDF 导出 + 骨架屏 + 新手引导
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useApi, ApiError } from '@/composables/useApi'
import type { PredictionResult, FreshnessLabel, HistoryRecord } from '@/types'

const { t, tm, locale } = useI18n()
const { toast } = useToast()
const { history, addHistoryRecord, deleteHistory, clearAllHistory, toggleFavorite } = useHistory()
const { checkApiHealth, callPredictApi } = useApi()

// ============ 模型版本（持久化） ============
const MODEL_KEY = 'fresheye_model_version'
const modelVersion = ref<'v1' | 'v2'>('v2')
try {
  const saved = localStorage.getItem(MODEL_KEY)
  if (saved === 'v1' || saved === 'v2') modelVersion.value = saved
} catch { /* ignore */ }
watch(modelVersion, (v) => {
  try { localStorage.setItem(MODEL_KEY, v) } catch { /* ignore */ }
})

// ============ 文件 / 预览 ============
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const previewDataUrl = ref<string>('')   // 预览压缩（1600px）
const uploadDataUrl = ref<string>('')    // 上传压缩（1280px JPEG q=0.9）
const dragging = ref(false)

const MAX_SIZE = 25 * 1024 * 1024 // 25MB
const ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// ============ 分析状态 ============
const analyzing = ref(false)
const errorMsg = ref<string>('')
const lastResult = ref<PredictionResult | null>(null)
const lastHeatmap = ref<string>('')
const lastOriginalImage = ref<string>('') // 对比滑块用的原图 data URL
const lastDuration = ref<number>(0)
const lastTimestamp = ref<string>('')
const apiHealthy = ref<boolean | null>(null)
const showLowConfidenceModal = ref(false)

// ============ Tab ============
const activeTab = ref(0)
const tabs = computed(() => [
  t('home.result.tabs.overview'),
  t('home.result.tabs.vision'),
  t('home.result.tabs.detail'),
  t('home.result.tabs.advice')
])

// ============ 历史记录 ============
const searchQuery = ref('')
const filterType = ref<'all' | 'high' | 'mid' | 'low' | 'fav'>('all')
const historyRefreshKey = ref(0)
let historyTimer: number | null = null

const favorites = computed(() => history.value.filter((r) => r.favorite))

const filteredHistory = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return history.value.filter((r) => {
    if (filterType.value === 'fav' && !r.favorite) return false
    if (filterType.value !== 'all' && filterType.value !== 'fav') {
      const level = r.prediction?.freshness_level
      const expected: FreshnessLabel = filterType.value === 'high' ? 0 : filterType.value === 'mid' ? 1 : 2
      if (level !== expected) return false
    }
    if (q) {
      const label = (r.prediction?.freshness_label || '').toLowerCase()
      if (!label.includes(q) && !r.id.includes(q)) return false
    }
    return true
  })
})

// ============ 对比滑块 ============
const comparePos = ref(50)
const compareWrap = ref<HTMLElement | null>(null)
let draggingSlider = false

// ============ 手风琴 ============
const accordions = reactive<Record<string, boolean>>({
  appearance: true,
  trend: false,
  standard: false,
  storage: true,
  consumption: false,
  processing: false,
  safety: false,
  best: false
})

// ============ Hero 鱼眼 ============
const pupilX = ref(0)
const pupilY = ref(0)
const heroEyeWrap = ref<HTMLElement | null>(null)
let idleTimer: number | null = null
let lastMoveTime = 0

// ============ countUp ============
const badgeValues = reactive<{ acc: number; resp: number; cls: number }>({
  acc: 0, resp: 0, cls: 0
})

// ============ 新手引导 ============
const GUIDE_KEY = 'fresheye_guide_seen'
const showGuide = ref(false)

// ============ 工具函数 ============
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function confidenceLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 0.8) return 'high'
  if (score >= 0.6) return 'mid'
  return 'low'
}

function freshnessMeta(level: FreshnessLabel | undefined): { color: string; label: string; key: string } {
  if (level === 0) return { color: 'var(--fresh-high)', label: t('home.result.high'), key: 'high' }
  if (level === 1) return { color: 'var(--fresh-mid)', label: t('home.result.mid'), key: 'mid' }
  if (level === 2) return { color: 'var(--fresh-low)', label: t('home.result.low'), key: 'low' }
  return { color: 'var(--muted)', label: '-', key: 'all' }
}

// ============ 图片压缩 ============
function compressImage(src: string, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(src)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch {
        resolve(src)
      }
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read error'))
    reader.readAsDataURL(file)
  })
}

// ============ 文件校验 & 处理 ============
function validateFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (!ACCEPT_TYPES.includes(type)) {
    toast.error(t('home.errors.format'))
    return false
  }
  if (file.size > MAX_SIZE) {
    toast.error(t('home.errors.size'))
    return false
  }
  return true
}

async function handleFile(file: File): Promise<void> {
  if (!validateFile(file)) return
  errorMsg.value = ''
  lastResult.value = null
  selectedFile.value = file
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = URL.createObjectURL(file)
  try {
    const full = await fileToDataUrl(file)
    const [preview, upload] = await Promise.all([
      compressImage(full, 1600, 0.9),
      compressImage(full, 1280, 0.9)
    ])
    previewDataUrl.value = preview
    uploadDataUrl.value = upload
  } catch {
    previewDataUrl.value = ''
    uploadDataUrl.value = ''
  }
  toast.info(t('home.upload.analyze'))
}

function onPickFile(): void {
  fileInput.value?.click()
}

function onFileChange(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}

function onCameraChange(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) handleFile(file)
  input.value = ''
}

function onDragEnter(e: DragEvent): void {
  e.preventDefault()
  dragging.value = true
}
function onDragOver(e: DragEvent): void {
  e.preventDefault()
}
function onDragLeave(e: DragEvent): void {
  if (e.currentTarget === e.target) dragging.value = false
}
function onDrop(e: DragEvent): void {
  e.preventDefault()
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}

function onPaste(e: ClipboardEvent): void {
  const target = e.target as HTMLElement | null
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        handleFile(file)
        e.preventDefault()
        return
      }
    }
  }
}

function openCamera(): void {
  cameraInput.value?.click()
}

// ============ 示例图片（内联 SVG data URI，模拟三种新鲜度鱼眼） ============
function sampleEyeSvg(irisColor: string, deepColor: string, clarity: number): string {
  const opacity = (0.4 + clarity * 0.5).toFixed(2)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'>
    <defs>
      <radialGradient id='i' cx='50%' cy='45%' r='55%'>
        <stop offset='0%' stop-color='${deepColor}'/>
        <stop offset='60%' stop-color='${irisColor}'/>
        <stop offset='100%' stop-color='#bdf6ef'/>
      </radialGradient>
    </defs>
    <rect width='300' height='300' fill='#0a2030'/>
    <circle cx='150' cy='150' r='120' fill='#eaf4f9' opacity='${opacity}'/>
    <circle cx='150' cy='150' r='100' fill='url(#i)'/>
    <circle cx='150' cy='150' r='45' fill='#000814'/>
    <ellipse cx='115' cy='110' rx='30' ry='22' fill='#ffffff' opacity='0.6' transform='rotate(-22 115 110)'/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const samples = computed(() => [
  { name: 'sample-1', src: sampleEyeSvg('#10b981', '#0a3a2a', 0.95), label: t('home.result.high') },
  { name: 'sample-2', src: sampleEyeSvg('#d97706', '#3a2a0a', 0.7), label: t('home.result.mid') },
  { name: 'sample-3', src: sampleEyeSvg('#ef4444', '#3a0a0a', 0.3), label: t('home.result.low') }
])

async function loadSample(src: string): Promise<void> {
  try {
    const res = await fetch(src)
    const blob = await res.blob()
    const file = new File([blob], 'sample.webp', { type: 'image/webp' })
    handleFile(file)
  } catch {
    toast.error(t('home.errors.network'))
  }
}

// ============ 分析 ============
async function analyze(): Promise<void> {
  if (!selectedFile.value || !uploadDataUrl.value) {
    toast.error(t('home.upload.hint'))
    return
  }
  if (analyzing.value) return
  analyzing.value = true
  errorMsg.value = ''
  const start = performance.now()
  try {
    const blob = await (await fetch(uploadDataUrl.value)).blob()
    const file = new File([blob], selectedFile.value.name || 'upload.jpg', { type: 'image/jpeg' })
    const { prediction, heatmap_image } = await callPredictApi(file, modelVersion.value)
    const duration = Math.round(performance.now() - start)
    lastResult.value = prediction
    lastHeatmap.value = heatmap_image
    lastOriginalImage.value = previewDataUrl.value
    lastDuration.value = duration
    lastTimestamp.value = prediction.timestamp
    activeTab.value = 0
    const lvl = confidenceLevel(prediction.confidence_score)
    if (lvl === 'low') showLowConfidenceModal.value = true
    await addHistoryRecord(previewDataUrl.value, duration, prediction, heatmap_image)
    toast.success(lvl === 'low' ? t('home.confidence_warn.low') : t('home.confidence_warn.high'))
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = t(`home.errors.${err.code}`)
    } else {
      errorMsg.value = t('home.errors.network')
    }
    toast.error(errorMsg.value)
  } finally {
    analyzing.value = false
  }
}

function resetAll(): void {
  selectedFile.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  previewDataUrl.value = ''
  uploadDataUrl.value = ''
  lastResult.value = null
  lastHeatmap.value = ''
  lastOriginalImage.value = ''
  errorMsg.value = ''
}

// ============ 加载历史记录 ============
function loadHistoryRecord(rec: HistoryRecord): void {
  if (rec.prediction) {
    lastResult.value = rec.prediction
    lastHeatmap.value = rec.heatmap || ''
    lastOriginalImage.value = rec.data
    lastDuration.value = rec.duration
    lastTimestamp.value = rec.timestamp
    activeTab.value = 0
    previewUrl.value = rec.data
    previewDataUrl.value = rec.data
    errorMsg.value = ''
    nextTick(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' })
    })
    toast.info(t('home.history.title'))
  }
}

function onDeleteHistory(id: string, e: Event): void {
  e.stopPropagation()
  deleteHistory(id)
  toast.info(t('home.history.clear'))
}

function onClearAll(): void {
  if (history.value.length === 0) return
  clearAllHistory()
  toast.info(t('home.history.clear'))
}

function onToggleFavorite(id: string, e: Event): void {
  e.stopPropagation()
  toggleFavorite(id)
}

// ============ Tab 键盘导航 ============
function onTabKeydown(e: KeyboardEvent): void {
  const count = tabs.value.length
  if (e.key === 'ArrowRight') {
    activeTab.value = (activeTab.value + 1) % count
    e.preventDefault()
  } else if (e.key === 'ArrowLeft') {
    activeTab.value = (activeTab.value - 1 + count) % count
    e.preventDefault()
  } else if (e.key === 'Home') {
    activeTab.value = 0
    e.preventDefault()
  } else if (e.key === 'End') {
    activeTab.value = count - 1
    e.preventDefault()
  }
}

// ============ 对比滑块 ============
function onComparePointerDown(e: PointerEvent): void {
  draggingSlider = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  updateCompareFromEvent(e)
}
function onComparePointerMove(e: PointerEvent): void {
  if (!draggingSlider) return
  updateCompareFromEvent(e)
}
function onComparePointerUp(e: PointerEvent): void {
  draggingSlider = false
}
function updateCompareFromEvent(e: PointerEvent): void {
  if (!compareWrap.value) return
  const rect = compareWrap.value.getBoundingClientRect()
  const x = clamp(e.clientX - rect.left, 0, rect.width)
  comparePos.value = rect.width > 0 ? (x / rect.width) * 100 : 50
}

// ============ Hero 鱼眼追踪 ============
function onMouseMove(e: MouseEvent): void {
  lastMoveTime = performance.now()
  if (!heroEyeWrap.value) return
  const rect = heroEyeWrap.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const maxOffset = 14
  const angle = Math.atan2(dy, dx)
  const offset = Math.min(maxOffset, dist / 12)
  pupilX.value = Math.cos(angle) * offset
  pupilY.value = Math.sin(angle) * offset
}

function startIdleDrift(): void {
  if (idleTimer) return
  idleTimer = window.setInterval(() => {
    if (performance.now() - lastMoveTime > 2000) {
      pupilX.value = (Math.random() * 2 - 1) * 8
      pupilY.value = (Math.random() * 2 - 1) * 6
    }
  }, 2500)
}

// ============ 鱼眼随置信度变色 ============
const eyeColors = computed(() => {
  const lvl = lastResult.value ? confidenceLevel(lastResult.value.confidence_score) : 'high'
  if (lvl === 'high') return { deep: '#0a2a3a', mid: '#0f5666', sea: '#1185b8', aqua: '#27d0c4' }
  if (lvl === 'mid') return { deep: '#3a2a0a', mid: '#8a5a0a', sea: '#d97706', aqua: '#f0a020' }
  return { deep: '#3a0a0a', mid: '#8a0a0a', sea: '#c41818', aqua: '#ef4444' }
})

// ============ countUp ============
function runCountUp(): void {
  const targets = { acc: 99, resp: 2, cls: 3 }
  const duration = 1500
  const start = performance.now()
  function step(now: number): void {
    const p = clamp((now - start) / duration, 0, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    badgeValues.acc = Math.round(targets.acc * eased)
    badgeValues.resp = Math.round(targets.resp * eased)
    badgeValues.cls = Math.round(targets.cls * eased)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const badgeDisplay = computed(() => {
  const b1 = t('home.hero.badge1')
  const b2 = t('home.hero.badge2')
  const b3 = t('home.hero.badge3')
  return [
    { icon: '🎯', num: badgeValues.acc, suffix: b1.replace(/^[\d.]+\+?/, '') },
    { icon: '⚡', num: badgeValues.resp, suffix: b2.replace(/^[\d.]+\+?/, '') },
    { icon: '📊', num: badgeValues.cls, suffix: b3.replace(/^[\d.]+\+?/, '') }
  ]
})

// ============ 相对时间 ============
function relativeTime(iso: string): string {
  void historyRefreshKey.value // 依赖刷新触发
  const then = new Date(iso).getTime()
  if (!then) return ''
  const diff = Date.now() - then
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (sec < 60) return t('home.rel_time.now')
  if (min < 60) return `${min}${t('home.rel_time.min_ago')}`
  if (hr < 24) return `${hr}${t('home.rel_time.hr_ago')}`
  if (day < 30) return `${day}${t('home.rel_time.day_ago')}`
  return new Date(iso).toLocaleDateString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

// ============ 置信度仪表盘 ============
const gaugeRadius = 52
const gaugeCircumference = 2 * Math.PI * gaugeRadius
const gaugeOffset = computed(() => {
  const score = lastResult.value?.confidence_score ?? 0
  return gaugeCircumference * (1 - clamp(score, 0, 1))
})
const gaugeColor = computed(() => {
  const lvl = confidenceLevel(lastResult.value?.confidence_score ?? 0)
  return lvl === 'high' ? 'var(--fresh-high)' : lvl === 'mid' ? 'var(--fresh-mid)' : 'var(--fresh-low)'
})

// ============ 概率分布 ============
const probEntries = computed(() => {
  const p = lastResult.value?.all_probabilities
  if (!p) return []
  return ([0, 1, 2] as FreshnessLabel[]).map((k) => {
    const meta = freshnessMeta(k)
    return { level: k, value: p[k] ?? 0, color: meta.color, label: meta.label }
  })
})

// ============ 工作流徽标 ============
const workflowSteps = computed(() => [
  t('home.workflow_steps.preprocess'),
  t('home.workflow_steps.extract'),
  t('home.workflow_steps.classify'),
  t('home.workflow_steps.gradcam')
])

// ============ 详细报告内容 ============
const detailSections = computed(() => {
  const lvl = lastResult.value?.freshness_level
  const conf = lastResult.value?.confidence_score ?? 0
  const meta = freshnessMeta(lvl)
  const appearanceText = lvl === 0 ? t('home.detail.appearance_high') : lvl === 1 ? t('home.detail.appearance_mid') : t('home.detail.appearance_low')
  const shelf = lvl === 0 ? t('home.detail.shelf_high') : lvl === 1 ? t('home.detail.shelf_mid') : t('home.detail.shelf_low')
  return [
    {
      key: 'appearance',
      title: t('home.result.appearance'),
      items: [
        t('home.detail.appearance_items.cornea'),
        t('home.detail.appearance_items.pupil'),
        t('home.detail.appearance_items.lens'),
        t('home.detail.appearance_items.tissue')
      ],
      desc: appearanceText
    },
    {
      key: 'trend',
      title: t('home.result.trend'),
      items: [
        `${t('home.detail.trend_current')}: ${meta.label}`,
        `${t('home.detail.trend_confidence')}: ${(conf * 100).toFixed(1)}%`,
        shelf,
        lvl === 0 ? t('home.detail.trend_stable') : t('home.detail.trend_declining')
      ],
      desc: t('home.detail.trend_desc')
    },
    {
      key: 'standard',
      title: t('home.result.standard'),
      items: [
        t('home.detail.standard_high'),
        t('home.detail.standard_mid'),
        t('home.detail.standard_low'),
        t('home.detail.standard_ref')
      ],
      desc: t('home.detail.standard_desc')
    }
  ]
})

// ============ 处理建议 ============
const adviceSections = computed(() => {
  const lvl = lastResult.value?.freshness_level
  const storage = lvl === 0
    ? t('home.advice.storage_high')
    : lvl === 1
    ? t('home.advice.storage_mid')
    : t('home.advice.storage_low')
  return [
    {
      key: 'storage',
      title: t('home.result.storage'),
      icon: '❄️',
      desc: storage
    },
    {
      key: 'consumption',
      title: t('home.result.consumption'),
      icon: '🍽️',
      desc: lvl === 2 ? t('home.advice.consumption_bad') : t('home.advice.consumption_ok')
    },
    {
      key: 'processing',
      title: t('home.result.processing'),
      icon: '🔪',
      desc: t('home.advice.processing')
    },
    {
      key: 'safety',
      title: t('home.result.safety'),
      icon: '⚠️',
      desc: lvl === 2 ? t('home.advice.safety_bad') : t('home.advice.safety_ok')
    },
    {
      key: 'best',
      title: t('home.result.best'),
      icon: '✨',
      desc: t('home.advice.best')
    }
  ]
})

// ============ 置信度横幅 ============
const confBannerType = computed<'high' | 'mid' | 'low' | null>(() => {
  if (!lastResult.value) return null
  return confidenceLevel(lastResult.value.confidence_score)
})

// ============ PDF 导出 ============
function exportPDF(): void {
  if (!lastResult.value) {
    toast.info(t('home.upload.analyze'))
    return
  }
  const r = lastResult.value
  const meta = freshnessMeta(r.freshness_level)
  const colorHex = meta.key === 'high' ? '#10b981' : meta.key === 'mid' ? '#d97706' : '#ef4444'
  const probRows = ([0, 1, 2] as FreshnessLabel[]).map((k) => {
    const v = (r.all_probabilities[k] ?? 0) * 100
    const lbl = k === 0 ? t('home.result.high') : k === 1 ? t('home.result.mid') : t('home.result.low')
    return `<div class="row"><span>${lbl}</span><span>${v.toFixed(1)}%</span></div><div class="bar"><div style="width:${v}%"></div></div>`
  }).join('')
  const html = `<!DOCTYPE html><html lang="${locale.value}"><head><meta charset="UTF-8"><title>${t('home.pdf.title')}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: "PingFang SC","Microsoft YaHei",Arial,sans-serif; color: #0b2238; line-height: 1.6; }
    h1 { color: #1185b8; border-bottom: 3px solid #27d0c4; padding-bottom: 8px; margin: 0 0 8px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 16px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 14px 18px; margin: 12px 0; }
    .level { font-size: 24px; font-weight: 800; color: ${colorHex}; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 14px; }
    .bar { background: #eee; border-radius: 4px; height: 12px; overflow: hidden; margin-bottom: 6px; }
    .bar > div { height: 100%; background: #27d0c4; }
    img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
    .foot { margin-top: 24px; color: #888; font-size: 11px; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
  </style></head><body>
    <h1>${t('home.pdf.h1')}</h1>
    <div class="meta">${t('home.pdf.time')}: ${new Date(r.timestamp).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')} · ${t('home.pdf.duration')}: ${lastDuration.value}ms · ${t('home.pdf.model')}: ${r.model_version}</div>
    <div class="card">
      <div class="row"><span>${t('home.result.freshness')}</span><span class="level">${meta.label}</span></div>
      <div class="row"><span>${t('home.result.confidence')}</span><span>${(r.confidence_score * 100).toFixed(1)}%</span></div>
    </div>
    <div class="card">
      <h3>${t('home.result.distribution')}</h3>
      ${probRows}
    </div>
    ${lastOriginalImage.value ? `<div class="card"><h3>${t('home.result.original')}</h3><img src="${lastOriginalImage.value}"/></div>` : ''}
    ${lastHeatmap.value ? `<div class="card"><h3>${t('home.result.heatmap')}</h3><img src="${lastHeatmap.value}"/></div>` : ''}
    <div class="card"><h3>${t('home.result.appearance')}</h3><p>${detailSections.value[0].desc}</p></div>
    <div class="foot">FreshEye © 2026 · ${t('home.pdf.footer')}</div>
  </body></html>`
  const win = window.open('', '_blank')
  if (!win) {
    toast.error(t('home.pdf.popup_error'))
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    try { win.focus(); win.print() } catch { /* ignore */ }
  }, 400)
}

// ============ 生命周期 ============
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null

onMounted(() => {
  // 静默 API 健康检查（预热 HF Spaces）
  checkApiHealth().then((ok) => { apiHealthy.value = ok }).catch(() => { apiHealthy.value = false })
  // 鼠标追踪
  mouseMoveHandler = onMouseMove
  window.addEventListener('mousemove', mouseMoveHandler)
  startIdleDrift()
  // countUp
  runCountUp()
  // 粘贴监听
  window.addEventListener('paste', onPaste)
  // 历史相对时间每分钟刷新
  historyTimer = window.setInterval(() => { historyRefreshKey.value++ }, 60000)
  // 新手引导
  try {
    if (!localStorage.getItem(GUIDE_KEY)) showGuide.value = true
  } catch { /* ignore */ }
})

onBeforeUnmount(() => {
  if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler)
  if (idleTimer) window.clearInterval(idleTimer)
  window.removeEventListener('paste', onPaste)
  if (historyTimer) window.clearInterval(historyTimer)
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function dismissGuide(): void {
  showGuide.value = false
  try { localStorage.setItem(GUIDE_KEY, '1') } catch { /* ignore */ }
}
</script>

<template>
  <!-- 新手引导弹窗 -->
  <transition name="route-fade">
    <div v-if="showGuide" class="guide-overlay" @click="dismissGuide">
      <div class="guide-modal" @click.stop>
        <div class="guide-emoji">🐟</div>
        <h3 class="guide-title">{{ t('home.guide_modal.title') }}</h3>
        <p class="guide-text">{{ t('home.guide_modal.text') }}</p>
        <button class="btn" type="button" @click="dismissGuide">{{ t('home.guide_modal.button') }}</button>
      </div>
    </div>
  </transition>

  <!-- 低置信度警告弹窗 -->
  <transition name="route-fade">
    <div v-if="showLowConfidenceModal" class="guide-overlay" @click="showLowConfidenceModal = false">
      <div class="guide-modal" @click.stop>
        <div class="guide-emoji warn">⚠️</div>
        <h3 class="guide-title">{{ t('home.confidence_warn.low') }}</h3>
        <p class="guide-text">{{ t('home.low_conf_modal.text') }}</p>
        <button class="btn" type="button" @click="showLowConfidenceModal = false">{{ t('home.low_conf_modal.button') }}</button>
      </div>
    </div>
  </transition>

  <!-- ============ Hero ============ -->
  <section class="hero reveal" aria-labelledby="hero-title">
    <div ref="heroEyeWrap" class="hero-eye-wrap" role="img" :aria-label="t('home.hero.title')">
      <svg class="hero-eye" viewBox="0 0 240 240" width="240" height="240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="irisGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" :stop-color="eyeColors.deep" />
            <stop offset="22%" :stop-color="eyeColors.mid" />
            <stop offset="52%" :stop-color="eyeColors.sea" />
            <stop offset="80%" :stop-color="eyeColors.aqua" />
            <stop offset="100%" stop-color="#bdf6ef" />
          </radialGradient>
          <radialGradient id="pupilGrad" cx="38%" cy="32%" r="68%">
            <stop offset="0%" stop-color="#1a2238" />
            <stop offset="60%" stop-color="#000814" />
            <stop offset="100%" stop-color="#000000" />
          </radialGradient>
          <radialGradient id="hlGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
            <stop offset="55%" stop-color="#ffffff" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="118" fill="#eaf4f9" />
        <circle cx="120" cy="120" r="100" fill="url(#irisGrad)" />
        <g :transform="`translate(${pupilX} ${pupilY})`">
          <circle cx="120" cy="120" r="50" fill="url(#pupilGrad)" />
          <ellipse cx="92" cy="86" rx="34" ry="26" fill="url(#hlGrad)" transform="rotate(-22 92 86)" />
          <circle cx="98" cy="80" r="5" fill="#ffffff" opacity="0.95" />
          <circle cx="150" cy="150" r="9" fill="#ffffff" opacity="0.65" />
        </g>
      </svg>
    </div>
    <h1 id="hero-title" class="hero-title">{{ t('home.hero.title') }}</h1>
    <p class="hero-desc">{{ t('home.hero.subtitle') }}</p>
    <div class="hero-badges">
      <span v-for="(b, i) in badgeDisplay" :key="i" class="badge">
        <span class="badge-icon" aria-hidden="true">{{ b.icon }}</span>
        <span class="count">{{ b.num }}</span>{{ b.suffix }}
      </span>
    </div>
    <a href="#uploadZone" class="scroll-hint" aria-hidden="true">
      <span>{{ t('home.hero.scroll_hint') }}</span>
      <span class="scroll-arrow">↓</span>
    </a>
  </section>

  <!-- ============ 上传区 ============ -->
  <section id="uploadZone" aria-labelledby="upload-title">
    <div class="section-head">
      <h2 id="upload-title" class="section-title">{{ t('home.upload.title') }}</h2>
      <div class="model-switch" role="radiogroup" :aria-label="t('home.model.label')">
        <button
          v-for="opt in (['v2','v1'] as const)"
          :key="opt"
          type="button"
          role="radio"
          :aria-checked="modelVersion === opt"
          :class="['model-opt', { active: modelVersion === opt }]"
          @click="modelVersion = opt"
        >{{ opt === 'v2' ? t('home.model.v2') : t('home.model.v1') }}</button>
      </div>
    </div>

    <div
      class="upload-zone"
      :class="{ 'is-drag': dragging }"
      role="button"
      tabindex="0"
      @click="onPickFile"
      @keydown.enter.prevent="onPickFile"
      @keydown.space.prevent="onPickFile"
      @dragenter="onDragEnter"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <div class="upload-icon" aria-hidden="true">
        <div class="fish-icon"><span class="fish-eye"></span></div>
      </div>
      <p class="upload-text">{{ previewUrl ? t('home.upload.analyze') : t('home.upload.hint') }}</p>
      <p class="upload-meta">{{ t('home.upload.formats') }} · ≤25MB · Ctrl+V {{ t('home.upload.paste') }}</p>
      <div class="upload-cta-group">
        <button class="upload-cta" type="button" @click.stop="onPickFile">{{ t('home.upload.analyze') }}</button>
        <button class="upload-cta alt" type="button" @click.stop="openCamera">📷 {{ t('home.upload.camera') }}</button>
      </div>
    </div>

    <!-- 示例图片 -->
    <div class="samples">
      <span class="samples-label">{{ t('home.upload.samples') }}：</span>
      <button
        v-for="s in samples"
        :key="s.name"
        type="button"
        class="sample-thumb"
        :aria-label="s.label"
        @click="loadSample(s.src)"
      >
        <img :src="s.src" :alt="s.label" />
        <span class="sample-tag">{{ s.label }}</span>
      </button>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onFileChange" />
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden @change="onCameraChange" />

    <!-- 预览卡片 + 分析按钮 -->
    <div v-if="previewUrl" class="preview-card glass-card">
      <div class="preview-img-wrap" :class="{ scanning: analyzing }">
        <img :src="previewUrl" alt="preview" class="preview-img" />
        <div v-if="analyzing" class="scan-line"></div>
        <div v-if="analyzing" class="scan-overlay">
          <span class="spinner"></span>
          <span class="scan-text">{{ t('home.upload.analyzing') }}</span>
        </div>
      </div>
      <div class="preview-actions">
        <button class="btn" type="button" :disabled="analyzing" @click="analyze">
          <span v-if="analyzing" class="spinner small"></span>
          {{ analyzing ? t('home.upload.analyzing') : (errorMsg ? t('home.upload.retry') : t('home.upload.analyze')) }}
        </button>
        <button class="btn alt" type="button" @click="resetAll">{{ t('home.upload.clear') }}</button>
      </div>
      <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
    </div>
  </section>

  <!-- ============ 骨架屏 ============ -->
  <section v-if="analyzing && !lastResult" class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('home.result.analyzing') }}</h2>
    </div>
    <div class="skeleton-grid">
      <div class="skeleton tall"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>
    </div>
  </section>

  <!-- ============ 结果区 ============ -->
  <section v-if="lastResult" id="result-section" class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('home.result.report_title') }}</h2>
      <button class="btn alt small" type="button" @click="exportPDF">📄 {{ t('home.export') }}</button>
    </div>

    <!-- 置信度横幅 -->
    <div v-if="confBannerType === 'mid'" class="conf-banner mid">
      ⚠️ {{ t('home.confidence_warn.mid') }}
    </div>
    <div v-if="confBannerType === 'low'" class="conf-banner low">
      ⚠️ {{ t('home.confidence_warn.low') }}
    </div>

    <!-- 工作流徽标 -->
    <div class="workflow">
      <span class="workflow-label">{{ t('home.result.workflow') }}:</span>
      <template v-for="(s, i) in workflowSteps" :key="i">
        <span class="workflow-step">{{ s }}</span>
        <span v-if="i < workflowSteps.length - 1" class="workflow-sep" aria-hidden="true">→</span>
      </template>
    </div>

    <!-- Tabs -->
    <div class="tabs" role="tablist" @keydown="onTabKeydown">
      <button
        v-for="(tab, i) in tabs"
        :key="i"
        type="button"
        role="tab"
        :id="`tab-${i}`"
        :aria-selected="activeTab === i"
        :tabindex="activeTab === i ? 0 : -1"
        :class="['tab', { active: activeTab === i }]"
        @click="activeTab = i"
      >{{ tab }}</button>
    </div>

    <!-- Tab 1: 概览 -->
    <div v-show="activeTab === 0" role="tabpanel" aria-labelledby="tab-0" class="tab-panel">
      <div class="overview-grid">
        <div class="overview-card level-card" :style="{ borderColor: freshnessMeta(lastResult.freshness_level).color }">
          <span class="overview-label">{{ t('home.result.freshness') }}</span>
          <span class="overview-level" :style="{ color: freshnessMeta(lastResult.freshness_level).color }">
            {{ freshnessMeta(lastResult.freshness_level).label }}
          </span>
          <span class="overview-desc">{{ lastResult.description || lastResult.freshness_label }}</span>
        </div>
        <div class="overview-card gauge-card">
          <span class="overview-label">{{ t('home.result.confidence') }}</span>
          <svg class="gauge" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
            <circle cx="60" cy="60" :r="gaugeRadius" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
            <circle
              cx="60" cy="60" :r="gaugeRadius"
              fill="none"
              :stroke="gaugeColor"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="gaugeCircumference"
              :stroke-dashoffset="gaugeOffset"
              transform="rotate(-90 60 60)"
              class="gauge-arc"
            />
            <text x="60" y="60" text-anchor="middle" dominant-baseline="central" class="gauge-text">
              {{ Math.round((lastResult.confidence_score ?? 0) * 100) }}%
            </text>
          </svg>
        </div>
      </div>

      <div class="prob-card glass-card">
        <h3 class="block-title">{{ t('home.result.distribution') }}</h3>
        <div v-for="p in probEntries" :key="p.level" class="prob-row">
          <span class="prob-label" :style="{ color: p.color }">{{ p.label }}</span>
          <div class="prob-bar">
            <div class="prob-fill" :style="{ width: (p.value * 100) + '%', background: p.color }"></div>
          </div>
          <span class="prob-val">{{ (p.value * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric">
          <span class="metric-label">{{ t('home.result.freshness') }}</span>
          <span class="metric-val" :style="{ color: freshnessMeta(lastResult.freshness_level).color }">{{ freshnessMeta(lastResult.freshness_level).label }}</span>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t('home.result.confidence') }}</span>
          <span class="metric-val">{{ ((lastResult.confidence_score ?? 0) * 100).toFixed(1) }}%</span>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t('home.result.duration') }}</span>
          <span class="metric-val">{{ lastDuration }}ms</span>
        </div>
        <div class="metric">
          <span class="metric-label">{{ t('home.result.time') }}</span>
          <span class="metric-val small">{{ new Date(lastTimestamp).toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US') }}</span>
        </div>
      </div>
    </div>

    <!-- Tab 2: AI 视觉分析 -->
    <div v-show="activeTab === 1" role="tabpanel" aria-labelledby="tab-1" class="tab-panel">
      <div v-if="lastHeatmap" class="compare-wrap glass-card">
        <h3 class="block-title">{{ t('home.result.compare_title') }}</h3>
        <div
          ref="compareWrap"
          class="compare-slider"
          @pointerdown="onComparePointerDown"
          @pointermove="onComparePointerMove"
          @pointerup="onComparePointerUp"
          @pointercancel="onComparePointerUp"
        >
          <img :src="lastHeatmap" class="compare-img" alt="heatmap" />
          <img
            :src="lastOriginalImage || previewUrl"
            class="compare-img top"
            alt="original"
            :style="{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }"
          />
          <div class="compare-divider" :style="{ left: comparePos + '%' }">
            <div class="compare-handle" aria-hidden="true">⟷</div>
          </div>
          <span class="compare-tag left">{{ t('home.result.original') }}</span>
          <span class="compare-tag right">{{ t('home.result.heatmap') }}</span>
        </div>
        <p class="compare-hint">{{ t('home.result.compare_hint') }}</p>
      </div>
      <div v-else class="empty-state glass-card">
        {{ t('home.result.no_heatmap') }}
      </div>
    </div>

    <!-- Tab 3: 详细报告 -->
    <div v-show="activeTab === 2" role="tabpanel" aria-labelledby="tab-2" class="tab-panel">
      <div
        v-for="sec in detailSections"
        :key="sec.key"
        class="accordion"
        :class="{ 'is-open': accordions[sec.key] }"
      >
        <div
          class="accordion-head"
          role="button"
          tabindex="0"
          :aria-expanded="accordions[sec.key]"
          @click="accordions[sec.key] = !accordions[sec.key]"
          @keydown.enter.prevent="accordions[sec.key] = !accordions[sec.key]"
        >
          <span class="accordion-title">{{ sec.title }}</span>
          <span class="accordion-arrow" aria-hidden="true">▶</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-inner">
            <p class="sec-desc">{{ sec.desc }}</p>
            <ul class="sec-items">
              <li v-for="(it, i) in sec.items" :key="i">{{ it }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: 处理建议 -->
    <div v-show="activeTab === 3" role="tabpanel" aria-labelledby="tab-3" class="tab-panel">
      <div
        v-for="a in adviceSections"
        :key="a.key"
        class="accordion"
        :class="{ 'is-open': accordions[a.key] }"
      >
        <div
          class="accordion-head"
          role="button"
          tabindex="0"
          :aria-expanded="accordions[a.key]"
          @click="accordions[a.key] = !accordions[a.key]"
          @keydown.enter.prevent="accordions[a.key] = !accordions[a.key]"
        >
          <span class="accordion-title"><span class="advice-icon" aria-hidden="true">{{ a.icon }}</span> {{ a.title }}</span>
          <span class="accordion-arrow" aria-hidden="true">▶</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-inner">
            <p class="sec-desc">{{ a.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ 历史记录 ============ -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('home.history.title') }} ({{ history.length }}/50)</h2>
      <button v-if="history.length" class="btn alt small" type="button" @click="onClearAll">🗑 {{ t('home.history.clear') }}</button>
    </div>
    <div class="history-controls">
      <input
        v-model="searchQuery"
        class="history-search"
        type="search"
        :placeholder="t('home.history.search')"
      />
      <select v-model="filterType" class="history-filter">
        <option value="all">{{ t('home.history.filter_all') }}</option>
        <option value="high">{{ t('home.history.filter_high') }}</option>
        <option value="mid">{{ t('home.history.filter_mid') }}</option>
        <option value="low">{{ t('home.history.filter_low') }}</option>
        <option value="fav">{{ t('home.history.filter_fav') }}</option>
      </select>
    </div>
    <div v-if="filteredHistory.length === 0" class="glass-card empty-state">
      {{ t('home.history.empty') }}
    </div>
    <ul v-else class="history-list">
      <li
        v-for="rec in filteredHistory"
        :key="rec.id"
        class="history-item"
        role="button"
        tabindex="0"
        @click="loadHistoryRecord(rec)"
        @keydown.enter.prevent="loadHistoryRecord(rec)"
      >
        <img :src="rec.data" class="history-thumb" alt="" loading="lazy" />
        <div class="history-info">
          <span class="history-level" :style="{ color: freshnessMeta(rec.prediction?.freshness_level).color }">
            {{ freshnessMeta(rec.prediction?.freshness_level).label }}
          </span>
          <span class="history-conf">
            {{ rec.prediction ? ((rec.prediction.confidence_score ?? 0) * 100).toFixed(0) + '%' : '-' }}
          </span>
          <span class="history-time">{{ relativeTime(rec.timestamp) }}</span>
        </div>
        <div class="history-actions">
          <button
            class="icon-btn"
            type="button"
            :class="{ active: rec.favorite }"
            :aria-label="t('home.history.filter_fav')"
            @click="onToggleFavorite(rec.id, $event)"
          >{{ rec.favorite ? '★' : '☆' }}</button>
          <button
            class="icon-btn del"
            type="button"
            :aria-label="t('home.history.clear')"
            @click="onDeleteHistory(rec.id, $event)"
          >✕</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* ============ Hero ============ */
.hero {
  min-height: calc(70vh);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-6) 0 var(--space-4);
  gap: var(--space-3);
  animation: fadeUp 0.9s ease both;
}
.hero-eye-wrap {
  position: relative;
  width: clamp(160px, 22vw, 240px);
  aspect-ratio: 1;
  margin-bottom: var(--space-2);
}
.hero-eye {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(39, 208, 196, 0.5);
  box-shadow: 0 0 50px rgba(39, 208, 196, 0.3), inset 0 0 40px rgba(4, 22, 43, 0.5);
  animation: floatEye 6s ease-in-out infinite;
  transition: filter 0.6s var(--ease-decel);
}
@keyframes floatEye { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(40px, 8vw, 72px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -1px;
  margin: 0 0 var(--space-3);
  background: linear-gradient(135deg, #ffffff 0%, var(--aqua) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  filter: drop-shadow(0 0 26px rgba(39, 208, 196, 0.28));
}
.hero-desc { font-size: clamp(16px, 2.2vw, 20px); color: var(--muted); margin: 0 auto var(--space-5); max-width: 540px; }
.hero-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }
.badge .count { font-family: var(--font-display); font-weight: 800; color: var(--aqua); margin-right: 1px; }
.scroll-hint {
  margin-top: var(--space-5);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--muted);
  font-size: 12px;
  text-decoration: none;
  letter-spacing: 1px;
}
.scroll-arrow { font-size: 18px; animation: bounce 1.8s ease-in-out infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(6px); opacity: 1; } }

/* ============ 模型切换 ============ */
.model-switch {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--border);
}
.model-opt {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  transition: color var(--transition), background var(--transition);
}
.model-opt.active {
  background: linear-gradient(135deg, var(--aqua), var(--sea));
  color: var(--ink);
  box-shadow: 0 4px 14px rgba(39, 208, 196, 0.3);
}

/* ============ 上传区 ============ */
.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center;
  padding: clamp(32px, 6vw, 56px) var(--space-5);
  border: 2px dashed var(--border);
  border-radius: var(--radius-xl);
  background: var(--card);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition), transform var(--transition);
  min-height: 240px;
}
.upload-zone:hover, .upload-zone:focus-visible {
  border-color: var(--aqua); background: var(--card-hover); transform: translateY(-2px);
  outline: none;
}
.upload-zone.is-drag {
  border-color: var(--aqua);
  background: rgba(39, 208, 196, 0.1);
  transform: scale(1.01);
}
.upload-icon {
  width: 72px; height: 72px; margin-bottom: var(--space-4); border-radius: 50%;
  display: grid; place-items: center;
  background: radial-gradient(circle at 30% 30%, rgba(39, 208, 196, 0.25), rgba(17, 133, 184, 0.15));
  border: 1px solid var(--border-hover);
}
.fish-icon { width: 38px; height: 24px; position: relative; }
.fish-icon::before {
  content: ""; position: absolute; left: 0; top: 4px; width: 26px; height: 16px;
  background: linear-gradient(135deg, var(--aqua), var(--sea));
  border-radius: 50% 60% 60% 50% / 50% 50% 50% 50%;
}
.fish-icon::after {
  content: ""; position: absolute; right: 0; top: 0; width: 0; height: 0;
  border-left: 12px solid var(--aqua);
  border-top: 12px solid transparent; border-bottom: 12px solid transparent;
}
.fish-eye {
  position: absolute; left: 6px; top: 9px; width: 4px; height: 4px; border-radius: 50%;
  background: var(--ink); box-shadow: 0 0 0 1px var(--foam); z-index: 2;
}
.upload-text { font-size: 17px; font-weight: 600; color: var(--foam); margin: 0 0 var(--space-2); }
.upload-meta { font-size: 13px; color: var(--muted); margin: 0; line-height: 1.7; }
.upload-cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: var(--space-4); }
.upload-cta {
  padding: 10px 22px; border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--aqua) 0%, var(--sea) 100%);
  color: var(--ink); font-weight: 600; font-size: 14px;
  box-shadow: 0 6px 20px rgba(39, 208, 196, 0.3);
  transition: transform var(--transition), box-shadow var(--transition);
}
.upload-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(39, 208, 196, 0.45); }
.upload-cta.alt {
  background: var(--card); color: var(--foam); border: 1px solid var(--border);
  box-shadow: none;
}
.upload-cta.alt:hover { border-color: var(--border-hover); background: var(--card-hover); }

/* ============ 示例图片 ============ */
.samples {
  display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-3);
  margin-top: var(--space-4);
}
.samples-label { font-size: 13px; color: var(--muted); }
.sample-thumb {
  position: relative; width: 72px; height: 72px; border-radius: var(--radius-md);
  overflow: hidden; border: 1px solid var(--border); padding: 0;
  transition: transform var(--transition), border-color var(--transition);
}
.sample-thumb:hover { transform: translateY(-3px) scale(1.04); border-color: var(--border-hover); }
.sample-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sample-tag {
  position: absolute; left: 0; right: 0; bottom: 0;
  font-size: 10px; color: #fff; text-align: center;
  padding: 2px 4px; background: rgba(0,0,0,0.55);
}

/* ============ 预览卡片 ============ */
.preview-card { margin-top: var(--space-5); }
.preview-img-wrap {
  position: relative; border-radius: var(--radius-lg); overflow: hidden;
  max-height: 420px; background: var(--ink);
}
.preview-img { width: 100%; max-height: 420px; object-fit: contain; display: block; }
.preview-img-wrap.scanning::after {
  content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--aqua), transparent);
  box-shadow: 0 0 16px var(--aqua);
  animation: scan 1.6s linear infinite;
}
@keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
.scan-line {
  position: absolute; left: 0; right: 0; top: 0; height: 3px;
  background: linear-gradient(90deg, transparent, var(--aqua), transparent);
  box-shadow: 0 0 16px var(--aqua);
  animation: scan 1.6s linear infinite;
}
.scan-overlay {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
  background: rgba(4, 22, 43, 0.55); backdrop-filter: blur(2px);
}
.scan-text { color: var(--aqua); font-size: 14px; font-weight: 600; letter-spacing: 1px; }
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.18); border-top-color: var(--aqua);
  animation: spin 0.9s linear infinite;
}
.spinner.small { width: 16px; height: 16px; border-width: 2px; border-top-color: var(--ink); }
@keyframes spin { to { transform: rotate(360deg); } }
.preview-actions {
  display: flex; gap: 12px; flex-wrap: wrap; margin-top: var(--space-4);
}
.btn.alt {
  background: var(--card); color: var(--foam); border: 1px solid var(--border);
  box-shadow: none;
}
.btn.alt:hover { border-color: var(--border-hover); background: var(--card-hover); transform: translateY(-2px); }
.btn.small { padding: 7px 14px; font-size: 13px; min-height: 36px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn .spinner { margin-right: 2px; }
.error-msg {
  margin: var(--space-3) 0 0; color: var(--fresh-low); font-size: 13.5px;
  padding: 10px 14px; background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);
}

/* ============ 骨架屏 ============ */
.skeleton-grid {
  display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--space-4);
}
.skeleton {
  height: 120px; border-radius: var(--radius-lg);
  background: linear-gradient(100deg, var(--card) 30%, var(--card-hover) 50%, var(--card) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.skeleton.tall { height: 240px; grid-row: span 2; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ============ 置信度横幅 ============ */
.conf-banner {
  padding: 10px 16px; border-radius: var(--radius-md);
  font-size: 13.5px; font-weight: 600; margin-bottom: var(--space-4);
  border: 1px solid transparent;
}
.conf-banner.mid {
  color: var(--fresh-mid);
  background: rgba(217, 119, 6, 0.12);
  border-color: rgba(217, 119, 6, 0.35);
}
.conf-banner.low {
  color: var(--fresh-low);
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
}

/* ============ 工作流徽标 ============ */
.workflow {
  display: flex; align-items: center; flex-wrap: wrap; gap: 6px;
  margin-bottom: var(--space-4); font-size: 12.5px;
}
.workflow-label { color: var(--muted); margin-right: 4px; }
.workflow-step {
  padding: 4px 10px; border-radius: 999px;
  background: rgba(39, 208, 196, 0.1); border: 1px solid rgba(39, 208, 196, 0.28);
  color: var(--aqua); font-weight: 600;
}
.workflow-sep { color: var(--muted); }

/* ============ Tabs ============ */
.tabs {
  display: flex; gap: 4px; padding: 4px;
  border-radius: var(--radius-md); background: var(--card);
  border: 1px solid var(--border); margin-bottom: var(--space-4);
  overflow-x: auto;
}
.tab {
  flex: 1; min-width: 80px; padding: 10px 14px; border-radius: var(--radius-sm);
  font-size: 13.5px; font-weight: 600; color: var(--muted);
  transition: color var(--transition), background var(--transition);
  white-space: nowrap;
}
.tab:hover { color: var(--foam); background: var(--card-hover); }
.tab.active {
  color: var(--ink);
  background: linear-gradient(135deg, var(--aqua), var(--sea));
  box-shadow: 0 4px 12px rgba(39, 208, 196, 0.3);
}
.tab-panel { animation: fadeUp 0.4s var(--ease-decel) both; }

/* ============ 概览 ============ */
.overview-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
  margin-bottom: var(--space-4);
}
.overview-card {
  padding: var(--space-5); border-radius: var(--radius-lg);
  background: var(--card); border: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; text-align: center; backdrop-filter: blur(10px);
}
.level-card { border-width: 2px; }
.overview-label { font-size: 12px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; }
.overview-level { font-family: var(--font-display); font-size: 28px; font-weight: 800; }
.overview-desc { font-size: 12.5px; color: var(--muted); line-height: 1.6; }
.gauge { display: block; }
.gauge-arc { transition: stroke-dashoffset 1s var(--ease-decel); }
.gauge-text { fill: var(--foam); font-size: 22px; font-weight: 800; font-family: var(--font-display); }

.prob-card { margin-bottom: var(--space-4); }
.block-title { font-size: 15px; font-weight: 700; color: var(--foam); margin: 0 0 var(--space-3); }
.prob-row {
  display: grid; grid-template-columns: 90px 1fr 56px; align-items: center;
  gap: var(--space-3); margin-bottom: var(--space-2);
}
.prob-label { font-size: 13px; font-weight: 600; }
.prob-bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
.prob-fill { height: 100%; border-radius: 999px; transition: width 0.8s var(--ease-decel); }
.prob-val { font-size: 12.5px; color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; }

.metrics-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);
}
.metric {
  padding: var(--space-3); border-radius: var(--radius-md);
  background: var(--card); border: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 4px; text-align: center;
}
.metric-label { font-size: 11px; color: var(--muted); letter-spacing: 0.5px; }
.metric-val { font-size: 16px; font-weight: 700; color: var(--foam); font-family: var(--font-display); }
.metric-val.small { font-size: 13px; font-family: var(--font-stack); }

/* ============ 对比滑块 ============ */
.compare-wrap { padding: var(--space-4); }
.block-title { margin-bottom: var(--space-3); }
.compare-slider {
  position: relative; overflow: hidden; border-radius: var(--radius-md);
  user-select: none; touch-action: none; cursor: ew-resize;
  background: var(--ink);
}
.compare-img { display: block; width: 100%; pointer-events: none; -webkit-user-drag: none; }
.compare-img.top {
  position: absolute; top: 0; left: 0; height: 100%; object-fit: cover;
}
.compare-divider {
  position: absolute; top: 0; bottom: 0; width: 2px;
  background: var(--aqua); box-shadow: 0 0 12px rgba(39, 208, 196, 0.6);
  transform: translateX(-1px); pointer-events: none;
}
.compare-handle {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 36px; height: 36px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--aqua); color: var(--ink); font-size: 16px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(39, 208, 196, 0.5);
}
.compare-tag {
  position: absolute; top: 10px; padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 600; color: #fff;
  background: rgba(4, 22, 43, 0.7); backdrop-filter: blur(4px); pointer-events: none;
}
.compare-tag.left { left: 10px; }
.compare-tag.right { right: 10px; }
.compare-hint { margin: var(--space-3) 0 0; font-size: 12.5px; color: var(--muted); text-align: center; }

/* ============ 手风琴 ============ */
.accordion {
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--card); overflow: hidden; margin-bottom: var(--space-3);
  transition: border-color var(--transition), background var(--transition);
}
.accordion:hover { border-color: var(--border-hover); }
.accordion-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; cursor: pointer; user-select: none;
}
.accordion-title { font-size: 14.5px; font-weight: 600; color: var(--foam); display: flex; align-items: center; gap: 8px; }
.advice-icon { font-size: 16px; }
.accordion-arrow { font-size: 11px; color: var(--aqua); transition: transform var(--transition); }
.accordion.is-open .accordion-arrow { transform: rotate(90deg); }
.accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.35s var(--ease-decel); }
.accordion.is-open .accordion-body { max-height: 500px; }
.accordion-inner { padding: 0 18px 16px; }
.sec-desc { margin: 0 0 var(--space-2); font-size: 13.5px; color: var(--foam); line-height: 1.7; }
.sec-items { margin: var(--space-2) 0 0; padding-left: 18px; font-size: 13px; color: var(--muted); line-height: 1.8; }
.sec-items li { margin-bottom: 2px; }

/* ============ 空状态 ============ */
.empty-state {
  text-align: center; padding: var(--space-6); color: var(--muted); font-size: 14px;
}

/* ============ 历史记录 ============ */
.history-controls {
  display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap;
}
.history-search {
  flex: 1; min-width: 180px; padding: 10px 14px;
  border-radius: var(--radius-md); background: var(--card);
  border: 1px solid var(--border); color: var(--foam); font-size: 14px;
  font-family: inherit;
  transition: border-color var(--transition);
}
.history-search:focus { outline: none; border-color: var(--aqua); }
.history-search::placeholder { color: var(--muted); }
.history-filter {
  padding: 10px 14px; border-radius: var(--radius-md); background: var(--card);
  border: 1px solid var(--border); color: var(--foam); font-size: 14px;
  font-family: inherit; cursor: pointer; min-width: 120px;
}
.history-filter:focus { outline: none; border-color: var(--aqua); }
.history-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.history-item {
  display: flex; align-items: center; gap: var(--space-3); padding: 10px 14px;
  border-radius: var(--radius-md); background: var(--card); border: 1px solid var(--border);
  cursor: pointer; transition: border-color var(--transition), background var(--transition), transform var(--transition);
}
.history-item:hover { border-color: var(--border-hover); background: var(--card-hover); transform: translateX(3px); }
.history-item:focus-visible { outline: 2px solid var(--aqua); outline-offset: 2px; }
.history-thumb {
  width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover;
  flex-shrink: 0; border: 1px solid var(--border);
}
.history-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.history-level { font-size: 14px; font-weight: 700; }
.history-conf { font-size: 12px; color: var(--muted); }
.history-time { font-size: 11.5px; color: var(--muted); }
.history-actions { display: flex; gap: 4px; flex-shrink: 0; }
.icon-btn {
  width: 32px; height: 32px; border-radius: 8px; display: grid; place-items: center;
  font-size: 14px; color: var(--muted); background: transparent;
  border: 1px solid var(--border); transition: all var(--transition);
}
.icon-btn:hover { color: var(--aqua); border-color: var(--border-hover); background: var(--card-hover); }
.icon-btn.active { color: #f0a020; border-color: rgba(240, 160, 32, 0.5); }
.icon-btn.del:hover { color: var(--fresh-low); border-color: rgba(239, 68, 68, 0.5); }

/* ============ 引导弹窗 ============ */
.guide-overlay {
  position: fixed; inset: 0; z-index: var(--z-modal);
  display: grid; place-items: center; padding: var(--space-4);
  background: rgba(4, 22, 43, 0.78); backdrop-filter: blur(8px);
  animation: overlay-fade 0.25s ease;
}
.guide-modal {
  max-width: 380px; width: 100%; padding: var(--space-6);
  border-radius: var(--radius-xl); text-align: center;
  background: linear-gradient(180deg, var(--deep), var(--abyss));
  border: 1px solid var(--border-hover);
  box-shadow: 0 24px 60px rgba(1, 8, 18, 0.6);
  animation: fadeUp 0.4s var(--ease-bounce) both;
}
.guide-emoji {
  font-size: 48px; margin-bottom: var(--space-3);
  width: 80px; height: 80px; margin-inline: auto;
  display: grid; place-items: center; border-radius: 50%;
  background: rgba(39, 208, 196, 0.14); border: 1px solid rgba(39, 208, 196, 0.35);
}
.guide-emoji.warn { background: rgba(239, 68, 68, 0.14); border-color: rgba(239, 68, 68, 0.4); }
.guide-title {
  font-family: var(--font-display); font-size: 20px; font-weight: 800;
  color: var(--white); margin: 0 0 var(--space-2);
}
.guide-text {
  font-size: 13.5px; color: var(--muted); line-height: 1.7;
  margin: 0 0 var(--space-5);
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .overview-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .skeleton-grid { grid-template-columns: 1fr; }
  .skeleton.tall { grid-row: auto; height: 160px; }
  .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .model-switch { align-self: stretch; justify-content: center; }
  .prob-row { grid-template-columns: 72px 1fr 48px; }
}
@media (max-width: 640px) {
  .tabs { gap: 2px; padding: 3px; }
  .tab { min-width: 64px; padding: 9px 8px; font-size: 12.5px; }
  .history-thumb { width: 40px; height: 40px; }
  .history-time { display: none; }
  .preview-actions { flex-direction: column; }
  .preview-actions .btn { width: 100%; }
  .compare-handle { width: 30px; height: 30px; font-size: 14px; }
  .guide-modal { padding: var(--space-5); }
}

/* ============ 减少动画偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .hero-eye, .scroll-arrow, .scan-line, .preview-img-wrap.scanning::after,
  .skeleton, .spinner, .tab-panel { animation: none !important; }
  .gauge-arc, .prob-fill { transition: none !important; }
}
</style>