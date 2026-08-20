<script setup lang="ts">
// 鲜眸 FreshEye · 首页检测视图
// Hero（动态鱼眼 + countUp）+ 上传区（拖拽/粘贴/拍照/示例）+ 4-Tab 分析报告
// + 历史记录（搜索/过滤/收藏）+ PDF 导出 + 骨架屏 + 新手引导
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'
import { useHistory } from '@/composables/useHistory'
import { useApi, ApiError } from '@/composables/useApi'
import { GUIDE_KEY, LEGACY_GUIDE_KEY, LEGACY_MODEL_KEY, MODEL_KEY } from '@/config'
import type { PredictionResult, FreshnessLabel, HistoryRecord } from '@/types'
import { buildReportHtml } from '@/utils/pdfReport'
import { dataUrlToBlob } from '@/utils/dataUrl'
import CameraCaptureDialog from '@/components/CameraCaptureDialog.vue'
import { useMotionPreference } from '@/composables/useMotionPreference'
import AccessibleDialog from '@/components/AccessibleDialog.vue'

const { t, tm, locale } = useI18n()
const { toast } = useToast()
const { history, initHistory, addHistoryRecord, deleteHistory, clearAllHistory, toggleFavorite } = useHistory()
const { checkApiHealth, callPredictApi } = useApi()
const { reduceMotion, canHover, coarsePointer, allowDecorativeMotion } = useMotionPreference()
const shouldTrackMouse = computed(() => canHover.value && !coarsePointer.value && allowDecorativeMotion.value)

// ============ 模型版本（持久化） ============
const modelVersion = ref<'v1' | 'v2'>('v2')
try {
  const saved = localStorage.getItem(MODEL_KEY) ?? localStorage.getItem(LEGACY_MODEL_KEY)
  if (saved === 'v1' || saved === 'v2') modelVersion.value = saved
} catch { /* ignore */ }
watch(modelVersion, (v, previous) => {
  try { localStorage.setItem(MODEL_KEY, v) } catch { /* ignore */ }
  if (previous && v !== previous && analyzing.value) cancelAnalysis()
})

// ============ 文件 / 预览 ============
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)
const cameraModal = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string>('')
const previewDataUrl = ref<string>('')   // 预览压缩（1600px）
const uploadDataUrl = ref<string>('')    // 上传压缩（1280px JPEG q=0.9）
const imageDimensions = ref<{ width: number; height: number } | null>(null)
const dragging = ref(false)
const sampleLoading = ref(false)

const MAX_SIZE = 25 * 1024 * 1024 // 25MB
const COMPRESS_THRESHOLD = 2 * 1024 * 1024
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
const showMidWarning = ref(true)
const showLowWarning = ref(true)
const showOnboardingTip = ref(false)
const scanStage = ref(0)
let scanTimer: number | null = null
let fileGeneration = 0
let analysisGeneration = 0
let analysisAbortController: AbortController | null = null
const guideDialogTitleId = 'home-guide-dialog-title'
const guideDialogDescriptionId = 'home-guide-dialog-description'
const lowConfidenceDialogTitleId = 'home-low-confidence-dialog-title'
const lowConfidenceDialogDescriptionId = 'home-low-confidence-dialog-description'

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
      const label = String(r.prediction?.freshness_label ?? '').toLowerCase()
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

function toggleAccordion(key: string): void {
  accordions[key] = !accordions[key]
}

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
const showGuide = ref(false)

// ============ 工具函数 ============
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function formatMessage(key: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((message, [name, value]) => {
    return message.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(value))
  }, t(key))
}

function confidenceLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 0.8) return 'high'
  if (score >= 0.6) return 'mid'
  return 'low'
}

function warningLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 0.75) return 'high'
  if (score >= 0.6) return 'mid'
  return 'low'
}

function freshnessMeta(level: FreshnessLabel | undefined): { color: string; label: string; key: string } {
  if (level === 0) return { color: 'var(--fresh-high)', label: t('home.result.high'), key: 'high' }
  if (level === 1) return { color: 'var(--fresh-mid)', label: t('home.result.mid'), key: 'mid' }
  if (level === 2) return { color: 'var(--fresh-low)', label: t('home.result.low'), key: 'low' }
  return { color: 'var(--muted)', label: '-', key: 'all' }
}

function modelDisplayName(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('v1')) return t('home.model.v1')
  if (normalized.includes('v2')) return t('home.model.v2')
  return value.trim() || t('home.model.v2')
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

function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function cancelAnalysis(): void {
  analysisGeneration += 1
  analysisAbortController?.abort()
  analysisAbortController = null
  analyzing.value = false
  stopScanning()
}

function resetPreparedFile(message = ''): void {
  selectedFile.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  previewDataUrl.value = ''
  uploadDataUrl.value = ''
  imageDimensions.value = null
  lastResult.value = null
  lastHeatmap.value = ''
  lastOriginalImage.value = ''
  lastDuration.value = 0
  lastTimestamp.value = ''
  activeTab.value = 0
  errorMsg.value = message
}

// ============ 文件校验 & 处理 ============
function validateFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (file.size === 0) {
    toast.error(t('home.errors.format'))
    return false
  }
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

async function handleFile(file: File): Promise<boolean> {
  if (!validateFile(file)) return false
  const generation = ++fileGeneration
  cancelAnalysis()
  errorMsg.value = ''
  showLowConfidenceModal.value = false
  const nextPreviewUrl = URL.createObjectURL(file)
  try {
    const full = await fileToDataUrl(file)
    const dimensions = await readImageDimensions(full)
    const upload = file.size > COMPRESS_THRESHOLD
      ? await compressImage(full, 1280, 0.9)
      : full
    if (generation !== fileGeneration) {
      URL.revokeObjectURL(nextPreviewUrl)
      return false
    }

    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    selectedFile.value = file
    previewUrl.value = nextPreviewUrl
    previewDataUrl.value = full
    imageDimensions.value = dimensions
    uploadDataUrl.value = upload
    lastResult.value = null
    lastHeatmap.value = ''
    lastOriginalImage.value = ''
    lastDuration.value = 0
    lastTimestamp.value = ''
    activeTab.value = 0
  } catch {
    URL.revokeObjectURL(nextPreviewUrl)
    if (generation === fileGeneration) {
      resetPreparedFile(t('home.errors.preprocess'))
      toast.error(t('home.errors.preprocess'))
    }
    return false
  }
  toast.info(t('home.upload.analyze'))
  showOnboardingTip.value = false
  return true
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
  if (file) {
    cameraModal.value = false
    void handleFile(file)
  }
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

async function onCameraCapture(file: File): Promise<void> {
  cameraModal.value = false
  await handleFile(file)
}

function openCamera(): void {
  cameraModal.value = true
}

const samples = computed(() => [
  { name: 'highly-fresh', src: `${import.meta.env.BASE_URL}assets/samples/highly-fresh.webp`, thumb: `${import.meta.env.BASE_URL}assets/samples/highly-fresh_thumb.webp`, label: t('home.result.high') },
  { name: 'fresh', src: `${import.meta.env.BASE_URL}assets/samples/fresh.webp`, thumb: `${import.meta.env.BASE_URL}assets/samples/fresh_thumb.webp`, label: t('home.result.mid') },
  { name: 'not-fresh', src: `${import.meta.env.BASE_URL}assets/samples/not-fresh.webp`, thumb: `${import.meta.env.BASE_URL}assets/samples/not-fresh_thumb.webp`, label: t('home.result.low') }
])

async function loadSample(src: string): Promise<void> {
  if (sampleLoading.value || analyzing.value) return
  sampleLoading.value = true
  try {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`sample request failed: ${res.status}`)
    const blob = await res.blob()
    const extension = src.endsWith('.png') ? 'png' : 'webp'
    const file = new File([blob], `sample.${extension}`, { type: blob.type || `image/${extension}` })
    if (await handleFile(file)) {
      await nextTick()
      document.getElementById('preview-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  } catch {
    toast.error(t('home.errors.network'))
  } finally {
    sampleLoading.value = false
  }
}

// ============ 分析 ============
const scanStages = computed(() => [
  t('home.scan.connecting'),
  t('home.scan.starting'),
  t('home.scan.analyzing'),
  t('home.scan.heatmap')
])
const scanLabel = computed(() => scanStages.value[Math.min(scanStage.value, scanStages.value.length - 1)])

function startScanning(): void {
  scanStage.value = 0
  if (scanTimer) window.clearInterval(scanTimer)
  scanTimer = window.setInterval(() => {
    if (scanStage.value < scanStages.value.length - 1) scanStage.value += 1
  }, 900)
}

function stopScanning(): void {
  if (scanTimer) window.clearInterval(scanTimer)
  scanTimer = null
  scanStage.value = 0
}

async function analyze(): Promise<void> {
  if (!selectedFile.value || !uploadDataUrl.value) {
    toast.error(t('home.upload.hint'))
    return
  }
  if (analyzing.value) return
  analysisAbortController?.abort()
  const request = ++analysisGeneration
  const controller = new AbortController()
  analysisAbortController = controller
  const sourceFile = selectedFile.value
  const sourcePreviewDataUrl = previewDataUrl.value
  const sourceUploadDataUrl = uploadDataUrl.value
  const sourceModel = modelVersion.value
  analyzing.value = true
  errorMsg.value = ''
  showLowConfidenceModal.value = false
  showMidWarning.value = true
  showLowWarning.value = true
  startScanning()
  const start = performance.now()
  try {
    let file = sourceFile
    if (sourceUploadDataUrl !== sourcePreviewDataUrl) {
      const uploadBlob = dataUrlToBlob(sourceUploadDataUrl)
      file = new File([uploadBlob], sourceFile.name || 'upload.jpg', {
        type: uploadBlob.type || sourceFile.type || 'image/jpeg'
      })
    }
    const { prediction, heatmap_image } = await callPredictApi(file, sourceModel, controller.signal)
    if (request !== analysisGeneration || controller.signal.aborted || sourceFile !== selectedFile.value || sourceUploadDataUrl !== uploadDataUrl.value) return
    const duration = Math.round(performance.now() - start)
    lastResult.value = prediction
    lastHeatmap.value = heatmap_image
    lastOriginalImage.value = sourcePreviewDataUrl
    lastDuration.value = duration
    lastTimestamp.value = prediction.timestamp
    activeTab.value = 0
    const lvl = warningLevel(prediction.confidence_score)
    if (lvl === 'low') showLowConfidenceModal.value = true
    await addHistoryRecord(sourcePreviewDataUrl, duration, prediction, heatmap_image)
    if (request !== analysisGeneration || controller.signal.aborted || sourceFile !== selectedFile.value) return
    toast.success(lvl === 'low'
      ? t('home.confidence_warn.low')
      : lvl === 'mid' ? t('home.confidence_warn.mid') : t('home.confidence_warn.high'))
  } catch (err) {
    if (request !== analysisGeneration || controller.signal.aborted) return
    if (err instanceof ApiError) {
      errorMsg.value = t(`home.errors.${err.code}`)
    } else {
      errorMsg.value = t('home.errors.network')
    }
    toast.error(errorMsg.value)
  } finally {
    if (request === analysisGeneration) {
      analyzing.value = false
      stopScanning()
      if (analysisAbortController === controller) analysisAbortController = null
    }
  }
}

function resetAll(): void {
  fileGeneration += 1
  cancelAnalysis()
  showLowConfidenceModal.value = false
  resetPreparedFile()
  showMidWarning.value = true
  showLowWarning.value = true
}

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function retryLowConfidence(): void {
  showLowConfidenceModal.value = false
  resetAll()
  document.getElementById('uploadZone')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ============ 加载历史记录 ============
function loadHistoryRecord(rec: HistoryRecord): void {
  if (rec.prediction) {
    fileGeneration += 1
    cancelAnalysis()
    showLowConfidenceModal.value = false
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) URL.revokeObjectURL(previewUrl.value)
    selectedFile.value = null
    uploadDataUrl.value = ''
    imageDimensions.value = null
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
  let next = activeTab.value
  if (e.key === 'ArrowRight') {
    next = (activeTab.value + 1) % count
    e.preventDefault()
  } else if (e.key === 'ArrowLeft') {
    next = (activeTab.value - 1 + count) % count
    e.preventDefault()
  } else if (e.key === 'Home') {
    next = 0
    e.preventDefault()
  } else if (e.key === 'End') {
    next = count - 1
    e.preventDefault()
  }
  if (next !== activeTab.value) {
    activeTab.value = next
    nextTick(() => document.getElementById(`tab-${next}`)?.focus())
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
  const target = e.currentTarget as HTMLElement
  if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId)
}

function onCompareKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    comparePos.value = Math.max(0, comparePos.value - 5)
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    comparePos.value = Math.min(100, comparePos.value + 5)
  } else if (e.key === 'Home') {
    e.preventDefault()
    comparePos.value = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    comparePos.value = 100
  }
}
function updateCompareFromEvent(e: PointerEvent): void {
  if (!compareWrap.value) return
  const rect = compareWrap.value.getBoundingClientRect()
  const x = clamp(e.clientX - rect.left, 0, rect.width)
  comparePos.value = rect.width > 0 ? (x / rect.width) * 100 : 50
}

// ============ Hero 鱼眼追踪 ============
function onMouseMove(e: MouseEvent): void {
  if (!shouldTrackMouse.value) return
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
  if (idleTimer || !allowDecorativeMotion.value) return
  idleTimer = window.setInterval(() => {
    if (allowDecorativeMotion.value && performance.now() - lastMoveTime > 2000) {
      pupilX.value = (Math.random() * 2 - 1) * 8
      pupilY.value = (Math.random() * 2 - 1) * 6
    }
  }, 2500)
}

function stopIdleDrift(): void {
  if (idleTimer) window.clearInterval(idleTimer)
  idleTimer = null
}

// ============ 鱼眼随置信度变色 ============
const eyeColors = computed(() => {
  const lvl = lastResult.value ? confidenceLevel(lastResult.value.confidence_score) : 'high'
  if (lvl === 'high') return { deep: '#0a2a3a', mid: '#0f5666', sea: '#1185b8', aqua: '#27d0c4' }
  if (lvl === 'mid') return { deep: '#3a2a0a', mid: '#8a5a0a', sea: '#d97706', aqua: '#f0a020' }
  return { deep: '#3a0a0a', mid: '#8a0a0a', sea: '#c41818', aqua: '#ef4444' }
})

// ============ countUp ============
const countTargets = { acc: 99, resp: 2, cls: 3 }
const countDuration = 1500
let countFrame: number | null = null
let countElapsed = 0

function setFinalBadgeValues(): void {
  badgeValues.acc = countTargets.acc
  badgeValues.resp = countTargets.resp
  badgeValues.cls = countTargets.cls
}

function runCountUp(): void {
  if (countFrame !== null) cancelAnimationFrame(countFrame)
  countFrame = null
  if (reduceMotion.value) {
    countElapsed = countDuration
    setFinalBadgeValues()
    return
  }
  if (!allowDecorativeMotion.value) return
  const start = performance.now() - countElapsed
  function step(now: number): void {
    if (!allowDecorativeMotion.value) {
      countElapsed = clamp(now - start, 0, countDuration)
      countFrame = null
      return
    }
    countElapsed = clamp(now - start, 0, countDuration)
    const p = countElapsed / countDuration
    const eased = 1 - Math.pow(1 - p, 3)
    badgeValues.acc = Math.round(countTargets.acc * eased)
    badgeValues.resp = Math.round(countTargets.resp * eased)
    badgeValues.cls = Math.round(countTargets.cls * eased)
    if (p < 1) countFrame = requestAnimationFrame(step)
    else countFrame = null
  }
  countFrame = requestAnimationFrame(step)
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

const evidenceItems = computed(() => [
  { value: t('home.hero.evidence_mfed_value'), label: t('home.hero.evidence_mfed') },
  { value: t('home.hero.evidence_classes_value'), label: t('home.hero.evidence_classes') },
  { value: t('home.hero.evidence_explainable_value'), label: t('home.hero.evidence_explainable') }
])

const fileInfo = computed(() => {
  if (!selectedFile.value) return null
  const dimensions = imageDimensions.value
  return {
    name: selectedFile.value.name,
    size: formatFileSize(selectedFile.value.size),
    dimensions: dimensions ? `${dimensions.width} × ${dimensions.height}` : '—'
  }
})

const resultHint = computed(() => lastResult.value ? t('home.result.result_hint_ready') : t('home.result.result_hint_empty'))
const healthLabel = computed(() => apiHealthy.value === null
  ? t('home.status.checking')
  : apiHealthy.value ? t('home.status.online') : t('home.status.offline'))

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
  const predictionKey = lvl === 0 ? 'high' : lvl === 1 ? 'mid' : lvl === 2 ? 'low' : 'unknown'
  const appearanceText = t(`home.prediction.${predictionKey}.appearance`)
  const trendText = t(`home.prediction.${predictionKey}.trend`)
  const standardText = t(`home.prediction.${predictionKey}.knowledge`)
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
        t('home.detail.trend_note')
      ],
      desc: trendText
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
      desc: standardText
    }
  ]
})

// ============ 处理建议 ============
const adviceSections = computed(() => {
  const lvl = lastResult.value?.freshness_level
  const group = lvl === 1 ? 'mid' : lvl === 2 ? 'low' : 'base'
  const item = (category: string): string[] => tm<string[]>(`home.recommendation.${group}.${category}`)
  return [
    {
      key: 'storage',
      title: t('home.result.storage'),
      icon: '❄️',
      desc: '',
      items: item('storage')
    },
    {
      key: 'consumption',
      title: t('home.result.consumption'),
      icon: '🍽️',
      desc: '',
      items: item('consumption')
    },
    {
      key: 'processing',
      title: t('home.result.processing'),
      icon: '🔪',
      desc: '',
      items: item('handling')
    },
    {
      key: 'safety',
      title: t('home.result.safety'),
      icon: '⚠️',
      desc: '',
      items: item('safety')
    },
    {
      key: 'best',
      title: t('home.result.best'),
      icon: '✨',
      desc: '',
      items: item('best')
    }
  ]
})

// ============ 置信度横幅 ============
const confBannerType = computed<'high' | 'mid' | 'low' | null>(() => {
  if (!lastResult.value) return null
  return warningLevel(lastResult.value.confidence_score)
})

const resultActionText = computed(() => {
  const level = lastResult.value?.freshness_level
  const predictionKey = (lastResult.value?.confidence_score ?? 0) < 0.6
    ? 'unknown'
    : level === 0 ? 'high' : level === 1 ? 'mid' : level === 2 ? 'low' : 'unknown'
  return t(`home.prediction.${predictionKey}.action`)
})

// ============ PDF 导出 ============
function exportPDF(): void {
  if (!lastResult.value) {
    toast.info(t('home.upload.analyze'))
    return
  }
  const current = lastResult.value
  const report = buildReportHtml({
    locale: locale.value,
    prediction: current,
    durationMs: lastDuration.value,
    timestamp: current.timestamp || lastTimestamp.value || new Date().toISOString(),
    modelVersion: current.model_version,
    modelDisplayName: modelDisplayName(current.model_version),
    originalImage: lastOriginalImage.value,
    heatmapImage: lastHeatmap.value,
    localizedDescription: detailSections.value[1]?.desc,
    detailSections: detailSections.value,
    adviceSections: adviceSections.value,
    labels: {
      title: t('home.pdf.title'),
      heading: t('home.pdf.h1'),
      time: t('home.pdf.time'),
      duration: t('home.pdf.duration'),
      model: t('home.pdf.model'),
      freshness: t('home.result.freshness'),
      confidence: t('home.result.confidence'),
      distribution: t('home.result.distribution'),
      original: t('home.result.original'),
      heatmap: t('home.result.heatmap'),
      evidence: t('home.pdf.evidence'),
      trend: t('home.pdf.trend'),
      advice: t('home.pdf.advice'),
      limitation: t('home.pdf.limitation'),
      limitationText: t('home.pdf.limitation_text'),
      footer: t('home.pdf.footer'),
      print: t('home.pdf.print'),
      download: t('home.pdf.download'),
      close: t('home.pdf.close'),
      noImage: t('home.pdf.no_image'),
      probabilityNote: t('home.pdf.probability_note'),
      probabilityLabels: [t('home.result.high'), t('home.result.mid'), t('home.result.low')]
    }
  })
  const win = window.open('', '_blank')
  if (!win) {
    toast.error(t('home.pdf.popup_error'))
    return
  }
  win.document.open()
  win.document.write(report.html)
  win.document.close()
  const printWhenReady = async (): Promise<void> => {
    try {
      await Promise.all(Array.from(win.document.images).map((image) => image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
          image.addEventListener('load', () => resolve(), { once: true })
          image.addEventListener('error', () => resolve(), { once: true })
        })))
      if (win.document.fonts?.ready) await win.document.fonts.ready
      win.focus()
      win.print()
    } catch { /* 用户仍可使用报告工具栏手动打印 */ }
  }
  window.setTimeout(() => { void printWhenReady() }, 350)
}

// ============ 生命周期 ============
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null
let mouseTrackingEnabled = false

function syncMouseTracking(enabled: boolean): void {
  if (!mouseMoveHandler || enabled === mouseTrackingEnabled) return
  mouseTrackingEnabled = enabled
  if (enabled) window.addEventListener('mousemove', mouseMoveHandler)
  else window.removeEventListener('mousemove', mouseMoveHandler)
}

watch(shouldTrackMouse, syncMouseTracking)
watch(allowDecorativeMotion, (allowed) => {
  if (allowed) {
    startIdleDrift()
    runCountUp()
  } else {
    stopIdleDrift()
    runCountUp()
  }
})
watch(reduceMotion, () => { runCountUp() })

onMounted(() => {
  initHistory()
  // 静默 API 健康检查（预热 HF Spaces）
  checkApiHealth().then((ok) => { apiHealthy.value = ok }).catch(() => { apiHealthy.value = false })
  // 鼠标追踪
  mouseMoveHandler = onMouseMove
  syncMouseTracking(shouldTrackMouse.value)
  if (allowDecorativeMotion.value) startIdleDrift()
  // countUp
  runCountUp()
  // 粘贴监听
  window.addEventListener('paste', onPaste)
  // 历史相对时间每分钟刷新
  historyTimer = window.setInterval(() => { historyRefreshKey.value++ }, 60000)
  // 新手引导
  try {
    if (!localStorage.getItem(GUIDE_KEY) && !localStorage.getItem(LEGACY_GUIDE_KEY)) {
      showGuide.value = true
      showOnboardingTip.value = true
    }
  } catch { /* ignore */ }
})

onBeforeUnmount(() => {
  fileGeneration += 1
  cancelAnalysis()
  syncMouseTracking(false)
  stopIdleDrift()
  if (countFrame !== null) cancelAnimationFrame(countFrame)
  countFrame = null
  window.removeEventListener('paste', onPaste)
  if (historyTimer) window.clearInterval(historyTimer)
  stopScanning()
  draggingSlider = false
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function dismissGuide(): void {
  showGuide.value = false
  try { localStorage.setItem(GUIDE_KEY, '1') } catch { /* ignore */ }
}

function closeLowConfidenceModal(): void {
  showLowConfidenceModal.value = false
}
</script>

<template>
  <CameraCaptureDialog
    :open="cameraModal"
    @close="cameraModal = false"
    @fallback="cameraInput?.click()"
    @capture="onCameraCapture"
  />

  <!-- 新手引导弹窗 -->
  <AccessibleDialog
    :open="showGuide"
    :title-id="guideDialogTitleId"
    :description-id="guideDialogDescriptionId"
    panel-class="guide-dialog-panel"
    @close="dismissGuide"
  >
    <div class="guide-modal">
      <div class="guide-emoji">🐟</div>
      <h3 :id="guideDialogTitleId" class="guide-title">{{ t('home.guide_modal.title') }}</h3>
      <p :id="guideDialogDescriptionId" class="guide-text">{{ t('home.guide_modal.text') }}</p>
      <button data-testid="guide-dismiss" class="btn" type="button" :aria-label="t('home.guide_modal.close')" @click="dismissGuide">{{ t('home.guide_modal.button') }}</button>
    </div>
  </AccessibleDialog>

  <!-- 低置信度警告弹窗 -->
  <AccessibleDialog
    :open="showLowConfidenceModal"
    :title-id="lowConfidenceDialogTitleId"
    :description-id="lowConfidenceDialogDescriptionId"
    panel-class="guide-dialog-panel"
    @close="closeLowConfidenceModal"
  >
    <div class="guide-modal">
      <div class="guide-emoji warn">⚠️</div>
      <h3 :id="lowConfidenceDialogTitleId" class="guide-title">{{ t('home.low_conf_modal.title') }}</h3>
      <p :id="lowConfidenceDialogDescriptionId" class="guide-text">
        {{ formatMessage('home.low_conf_modal.text', { confidence: Math.round((lastResult?.confidence_score ?? 0) * 100) }) }}
        <br />{{ t('home.low_conf_modal.advice') }}
      </p>
      <div class="confidence-modal-actions">
        <button data-testid="low-confidence-retry" class="btn" type="button" @click="retryLowConfidence">{{ t('home.low_conf_modal.retry') }}</button>
        <button data-testid="low-confidence-view" class="btn alt" type="button" :aria-label="t('home.low_conf_modal.close')" @click="closeLowConfidenceModal">{{ t('home.low_conf_modal.view_anyway') }}</button>
      </div>
    </div>
  </AccessibleDialog>

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
          <radialGradient id="corneaGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
            <stop offset="76%" stop-color="#ffffff" stop-opacity="0" />
            <stop offset="90%" :stop-color="eyeColors.aqua" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#04162b" stop-opacity="0.5" />
          </radialGradient>
          <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ff9eb5" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#ff9eb5" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="hlGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
            <stop offset="55%" stop-color="#ffffff" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" :stop-color="eyeColors.aqua" stop-opacity="0.6" />
            <stop offset="100%" :stop-color="eyeColors.aqua" stop-opacity="0" />
          </radialGradient>
          <radialGradient id="scleraGrad" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="70%" stop-color="#eaf4f9" />
            <stop offset="100%" stop-color="#cfe2ec" />
          </radialGradient>
          <clipPath id="eyeClip"><circle cx="120" cy="120" r="78" /></clipPath>
        </defs>
        <circle cx="120" cy="120" r="120" fill="url(#glowGrad)" opacity="0.6" />
        <circle cx="120" cy="120" r="114" fill="#0c2236" />
        <circle cx="120" cy="120" r="106" fill="none" :stroke="eyeColors.aqua" stroke-width="3" opacity="0.55" />
        <g :fill="eyeColors.aqua" opacity="0.85">
          <circle cx="120" cy="14" r="4.5" /><circle cx="177" cy="30" r="4.5" />
          <circle cx="218" cy="71" r="4.5" /><circle cx="230" cy="120" r="4.5" />
          <circle cx="218" cy="169" r="4.5" /><circle cx="177" cy="210" r="4.5" />
          <circle cx="120" cy="226" r="4.5" /><circle cx="63" cy="210" r="4.5" />
          <circle cx="22" cy="169" r="4.5" /><circle cx="10" cy="120" r="4.5" />
          <circle cx="22" cy="71" r="4.5" /><circle cx="63" cy="30" r="4.5" />
        </g>
        <circle cx="120" cy="120" r="92" fill="url(#scleraGrad)" />
        <circle cx="120" cy="120" r="92" fill="none" stroke="#9fc1d4" stroke-width="1" opacity="0.5" />
        <circle cx="120" cy="120" r="78" fill="url(#irisGrad)" />
        <g clip-path="url(#eyeClip)" opacity="0.2" stroke="#0a2a3a" stroke-width="0.6" fill="none">
          <line x1="120" y1="42" x2="120" y2="198" /><line x1="42" y1="120" x2="198" y2="120" />
          <line x1="65" y1="65" x2="175" y2="175" /><line x1="175" y1="65" x2="65" y2="175" />
        </g>
        <circle cx="120" cy="120" r="55" fill="none" :stroke="eyeColors.aqua" stroke-width="1.5" opacity="0.3" />
        <g :transform="`translate(${pupilX} ${pupilY})`">
          <circle cx="120" cy="120" r="41" fill="url(#pupilGrad)" />
        </g>
        <circle cx="120" cy="120" r="78" fill="url(#corneaGrad)" />
        <ellipse cx="92" cy="83" rx="27" ry="22" fill="url(#hlGrad)" transform="rotate(-22 92 83)" />
        <circle cx="96" cy="80" r="4" fill="#ffffff" opacity="0.95" />
        <circle cx="150" cy="150" r="7" fill="#ffffff" opacity="0.65" />
        <circle cx="150" cy="150" r="3.5" fill="#ffffff" />
        <ellipse cx="68" cy="153" rx="17" ry="10" fill="url(#blushGrad)" />
        <ellipse cx="172" cy="153" rx="17" ry="10" fill="url(#blushGrad)" />
        <path d="M 70 92 Q 120 64 170 92" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.3" stroke-linecap="round" />
        <path d="M 196 70 l 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 z" fill="#bdf6ef" opacity="0.9" />
      </svg>
      <span class="hero-sparkle hero-sparkle--1" aria-hidden="true">✦</span>
      <span class="hero-sparkle hero-sparkle--2" aria-hidden="true">✧</span>
      <span class="hero-sparkle hero-sparkle--3" aria-hidden="true">✦</span>
    </div>
    <h1 id="hero-title" class="hero-title">{{ t('home.hero.title') }}</h1>
    <span class="hero-chip"><span class="hero-chip-dot" aria-hidden="true"></span>{{ t('home.hero.chip') }}</span>
    <p class="hero-tagline">{{ t('home.hero.tagline') }}</p>
    <p class="hero-desc">{{ t('home.hero.subtitle') }}</p>
    <div class="hero-actions" :aria-label="t('home.hero.quick_start')">
      <a class="hero-action-primary" href="#upload-title" @click.prevent="scrollToSection('upload-title')">{{ t('home.hero.start') }} <span aria-hidden="true">→</span></a>
      <a class="hero-action-secondary" href="#sample-card" @click.prevent="scrollToSection('sample-card')">{{ t('home.hero.view_sample') }}</a>
    </div>
    <div class="hero-badges hero-evidence-strip" role="list" :aria-label="t('home.hero.evidence_label')">
      <span v-for="item in evidenceItems" :key="item.value + item.label" class="hero-evidence-item" role="listitem"><strong>{{ item.value }}</strong> {{ item.label }}</span>
    </div>
    <router-link class="hero-evidence-link" to="/about.html">{{ t('home.hero.evidence_link') }} <span aria-hidden="true">→</span></router-link>
    <a href="#upload-title" class="hero-scroll-cue" @click.prevent="scrollToSection('upload-title')">
      <span>{{ t('home.hero.scroll_hint') }}</span>
      <span class="hero-scroll-cue-arrow" aria-hidden="true">⌄</span>
    </a>
  </section>

  <!-- ============ 上传区 ============ -->
  <section id="uploadZone" aria-labelledby="upload-title">
    <div class="section-head">
      <h2 id="upload-title" class="section-title">{{ t('home.upload.title') }}</h2>
      <span class="section-hint">{{ t('home.upload.section_hint') }}</span>
    </div>

    <template v-if="!previewUrl">
    <details class="advanced-settings">
      <summary><span>{{ t('home.model.advanced') }}</span> <span class="advanced-settings-hint">{{ t('home.model.advanced_hint') }}</span></summary>
      <div class="model-selector">
        <label class="model-selector-label" for="model-version-select">{{ t('home.model.label') }}</label>
        <div class="select-field">
          <select id="model-version-select" v-model="modelVersion" class="select-field__native" :aria-label="t('home.model.label')">
            <option value="v2">{{ t('home.model.v2') }}</option>
            <option value="v1">{{ t('home.model.v1') }}</option>
          </select>
          <span class="select-field__chevron" aria-hidden="true">⌄</span>
        </div>
        <p class="advanced-settings-note">{{ t('home.model.note') }}</p>
      </div>
    </details>

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
      <p class="privacy-note">{{ t('home.upload.privacy') }}</p>
      <div class="upload-cta-group">
        <button class="upload-cta" type="button" @click.stop="onPickFile">{{ t('home.upload.choose_photo') }}</button>
        <button class="upload-cta alt" type="button" @click.stop="openCamera">📷 {{ t('home.upload.camera') }}</button>
      </div>
    </div>

    <p v-if="errorMsg && !previewUrl" class="error-msg upload-error">⚠️ {{ errorMsg }}</p>

    <!-- 示例图片 -->
    <div id="sample-card" class="samples">
      <span class="samples-label">{{ t('home.upload.samples') }}：</span>
      <button
        v-for="s in samples"
        :key="s.name"
        type="button"
        class="sample-thumb"
        :class="{ 'is-loading': sampleLoading }"
        :disabled="sampleLoading"
        :aria-busy="sampleLoading"
        :aria-label="s.label"
        @click="loadSample(s.src)"
      >
        <img :src="s.thumb" :alt="s.label" loading="lazy" decoding="async" />
        <span class="sample-tag">{{ s.label }}</span>
      </button>
    </div>
    </template>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onFileChange" />
    <input ref="cameraInput" type="file" accept="image/*" capture="environment" hidden @change="onCameraChange" />

    <!-- 预览卡片 + 分析按钮 -->
    <div v-if="previewUrl" id="preview-card" class="preview-card glass-card">
      <div class="preview-img-wrap" :class="{ scanning: analyzing }">
        <img :src="previewUrl" :alt="t('home.upload.preview_alt')" class="preview-img" />
        <div v-if="analyzing" class="scan-line"></div>
        <div v-if="analyzing" class="scan-overlay">
          <span class="spinner"></span>
          <span class="scan-text">{{ scanLabel }}</span>
        </div>
      </div>
      <div v-if="fileInfo" class="preview-info" aria-live="polite">
        <span>📷 <strong>{{ fileInfo.name }}</strong></span>
        <span>📏 <strong>{{ fileInfo.size }}</strong></span>
        <span>🔲 <strong>{{ fileInfo.dimensions }}</strong></span>
      </div>
      <div class="preview-actions">
        <button v-if="selectedFile && uploadDataUrl" class="btn" type="button" :disabled="analyzing" @click="analyze">
          <span v-if="analyzing" class="spinner small"></span>
          {{ analyzing ? t('home.upload.analyzing') : (errorMsg ? t('home.upload.retry') : t('home.upload.analyze')) }}
        </button>
        <button class="btn alt" type="button" @click="resetAll">{{ t('home.upload.clear') }}</button>
      </div>
      <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>
      <div v-if="showOnboardingTip" class="onboarding-tip">{{ t('home.upload.onboarding') }}</div>
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
  <section v-if="!lastResult && !analyzing" id="results-empty-section" class="reveal" aria-labelledby="result-empty-title">
    <div class="section-head">
      <h2 id="result-empty-title" class="section-title">{{ t('home.result.report_title') }}</h2>
      <span class="section-hint">{{ resultHint }}</span>
    </div>
    <div class="results-empty glass-card">
      <div class="result-icon" aria-hidden="true">◌</div>
      <p class="result-text">{{ t('home.result.empty') }}</p>
      <p class="result-sub">{{ t('home.result.empty_sub') }}</p>
    </div>
  </section>

  <section v-if="lastResult" id="result-section" class="reveal" :class="{ revealed: Boolean(lastResult) }">
    <div class="section-head">
      <h2 class="section-title">{{ t('home.result.report_title') }}</h2>
      <div class="result-toolbar">
        <span class="health-chip" :class="{ online: apiHealthy, offline: apiHealthy === false }">{{ healthLabel }}</span>
        <button class="btn alt small" type="button" @click="exportPDF">📄 {{ t('home.export') }}</button>
      </div>
    </div>

    <!-- 置信度横幅 -->
    <div v-if="confBannerType === 'mid' && showMidWarning" class="conf-banner mid">
      ⚠️ <span>{{ formatMessage('home.result.warning_mid', { confidence: Math.round((lastResult.confidence_score ?? 0) * 100) }) }}</span>
      <button class="warning-dismiss" type="button" :aria-label="t('home.result.close_warning')" @click="showMidWarning = false">✕</button>
    </div>
    <div v-if="confBannerType === 'low' && showLowWarning" class="conf-banner low">
      ⚠️ <span>{{ formatMessage('home.result.warning_low', { confidence: Math.round((lastResult.confidence_score ?? 0) * 100) }) }}</span>
      <button class="warning-dismiss" type="button" :aria-label="t('home.result.close_warning')" @click="showLowWarning = false">✕</button>
    </div>

    <div class="result-primary-card glass-card">
      <div class="result-primary-copy">
        <span class="result-kicker">{{ t('home.result.result_kicker') }}</span>
        <div class="freshness-card" :class="`freshness-${freshnessMeta(lastResult.freshness_level).key}`">
          <span class="freshness-indicator" aria-hidden="true"></span>
          <div><strong>{{ freshnessMeta(lastResult.freshness_level).label }}</strong><small>{{ t('home.result.confidence') }} {{ (lastResult.confidence_score * 100).toFixed(1) }}%</small></div>
        </div>
        <div class="result-action-block">
          <span class="result-action-label">{{ t('home.result.result_action_label') }}</span>
          <p class="result-action">{{ resultActionText }}</p>
          <div class="result-primary-links" :aria-label="t('home.result.tabs.overview')">
            <button class="result-link" type="button" @click="activeTab = 1">{{ t('home.result.show_details') }} →</button>
            <button class="result-link result-link-muted" type="button" @click="activeTab = 3">{{ t('home.result.show_advice') }} →</button>
          </div>
        </div>
      </div>
      <div class="result-primary-confidence">
        <span class="panel-title">{{ t('home.result.confidence') }}</span>
        <div class="primary-gauge-wrap">
          <svg class="primary-gauge" viewBox="0 0 120 120" width="140" height="140" aria-hidden="true">
            <circle cx="60" cy="60" :r="gaugeRadius" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
            <circle
              cx="60" cy="60" :r="gaugeRadius" fill="none" :stroke="gaugeColor" stroke-width="10"
              stroke-linecap="round" :stroke-dasharray="gaugeCircumference" :stroke-dashoffset="gaugeOffset"
              transform="rotate(-90 60 60)" class="gauge-arc"
            />
            <text x="60" y="57" text-anchor="middle" dominant-baseline="central" class="primary-gauge-num">
              {{ Math.round((lastResult.confidence_score ?? 0) * 100) }}%
            </text>
            <text x="60" y="75" text-anchor="middle" class="primary-gauge-cap">{{ t('home.result.confidence_model_score') }}</text>
          </svg>
          <span class="primary-gauge-label">{{ healthLabel }}</span>
        </div>
      </div>
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
            <span class="overview-desc">{{ detailSections[0]?.desc }}</span>
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
          role="slider"
          tabindex="0"
          :aria-label="t('home.result.compare_aria')"
          :aria-valuenow="Math.round(comparePos)"
          aria-valuemin="0"
          aria-valuemax="100"
          @pointerdown="onComparePointerDown"
          @pointermove="onComparePointerMove"
          @pointerup="onComparePointerUp"
          @pointercancel="onComparePointerUp"
          @pointerleave="onComparePointerUp"
          @keydown="onCompareKeydown"
        >
          <img :src="lastHeatmap" class="compare-img" :alt="t('home.result.heatmap')" />
          <img
            :src="lastOriginalImage || previewUrl"
            class="compare-img top"
            :alt="t('home.result.original')"
            :style="{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }"
          />
          <div class="compare-divider" :style="{ left: comparePos + '%' }">
            <div class="compare-handle" aria-hidden="true">⟷</div>
          </div>
          <span class="compare-tag left">{{ t('home.result.original') }}</span>
          <span class="compare-tag right">{{ t('home.result.heatmap') }}</span>
        </div>
        <p class="compare-hint">{{ t('home.result.compare_hint') }}</p>
        <p class="vision-explain">{{ t('home.result.compare_desc') }}</p>
        <p class="vision-explain muted">{{ t('home.result.vision_explain') }}</p>
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
        <button
          :id="`detail-toggle-${sec.key}`"
          class="accordion-head"
          type="button"
          :aria-expanded="accordions[sec.key]"
          :aria-controls="`detail-panel-${sec.key}`"
          @click="toggleAccordion(sec.key)"
        >
          <span class="accordion-title">{{ sec.title }}</span>
          <span class="accordion-arrow" aria-hidden="true">▶</span>
        </button>
        <div :id="`detail-panel-${sec.key}`" class="accordion-body">
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
        <button
          :id="`advice-toggle-${a.key}`"
          class="accordion-head"
          type="button"
          :aria-expanded="accordions[a.key]"
          :aria-controls="`advice-panel-${a.key}`"
          @click="toggleAccordion(a.key)"
        >
          <span class="accordion-title"><span class="advice-icon" aria-hidden="true">{{ a.icon }}</span> {{ a.title }}</span>
          <span class="accordion-arrow" aria-hidden="true">▶</span>
        </button>
        <div :id="`advice-panel-${a.key}`" class="accordion-body">
          <div class="accordion-inner">
            <p v-if="a.desc" class="sec-desc">{{ a.desc }}</p>
            <ul v-if="a.items?.length" class="advice-items">
              <li v-for="(item, i) in a.items" :key="i">{{ item }}</li>
            </ul>
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
      <div class="select-field">
        <select v-model="filterType" class="select-field__native" :aria-label="t('home.history.title')">
          <option value="all">{{ t('home.history.filter_all') }}</option>
          <option value="high">{{ t('home.history.filter_high') }}</option>
          <option value="mid">{{ t('home.history.filter_mid') }}</option>
          <option value="low">{{ t('home.history.filter_low') }}</option>
          <option value="fav">{{ t('home.history.filter_fav') }}</option>
        </select>
        <span class="select-field__chevron" aria-hidden="true">⌄</span>
      </div>
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
.hero-eye-wrap::before {
  content: "";
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(39, 208, 196, 0.35), transparent 70%);
  filter: blur(12px);
  z-index: -1;
  animation: pulseGlow 4s ease-in-out infinite;
}
.hero-eye {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 3px solid rgba(39, 208, 196, 0.5);
  box-shadow: 0 0 50px rgba(39, 208, 196, 0.3), inset 0 0 40px rgba(4, 22, 43, 0.5);
  animation: floatEye 6s ease-in-out infinite;
  transition: filter 0.6s var(--ease-decel);
  overflow: hidden;
}
.hero-pupil { transform-origin: 120px 120px; transform-box: fill-box; }
@keyframes floatEye { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.hero-chip {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 18px;
  border-radius: 999px; background: rgba(39, 208, 196, 0.08);
  border: 1px solid rgba(39, 208, 196, 0.3); color: var(--aqua);
  font-size: 13px; font-weight: 600; letter-spacing: 0.8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 18px rgba(39, 208, 196, 0.1);
  animation: fadeUp 0.9s ease 0.15s both;
}
.hero-chip-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--aqua);
  box-shadow: 0 0 8px var(--aqua); animation: blink 2.2s ease-in-out infinite;
}
.hero-tagline {
  position: relative; display: inline-block; font-size: clamp(18px, 2.5vw, 22px);
  font-weight: 600; color: var(--foam); margin: 0 0 var(--space-3); letter-spacing: 2px;
}
.hero-tagline::after {
  content: ""; position: absolute; left: 50%; bottom: -6px; width: 46px; height: 2px;
  border-radius: 2px; background: linear-gradient(90deg, transparent, var(--aqua), transparent);
  transform: translateX(-50%); opacity: 0.8;
}
.hero-scroll-cue {
  margin-top: var(--space-5); display: inline-flex; flex-direction: column;
  align-items: center; justify-content: center; min-height: 44px; padding: 10px 6px;
  gap: 4px; color: var(--muted); font-size: 12px;
  letter-spacing: 1.5px; text-decoration: none; transition: color var(--transition);
  animation: fadeUp 0.9s ease 0.6s both;
}
.hero-scroll-cue:hover { color: var(--aqua); }
.hero-scroll-cue:focus-visible { outline: 2px solid var(--aqua); outline-offset: 4px; border-radius: 6px; }
.hero-scroll-cue-arrow { font-size: 16px; animation: bounce 2s ease-in-out infinite; }
.hero-sparkle {
  position: absolute; color: #bdf6ef; line-height: 1; pointer-events: none;
  text-shadow: 0 0 8px rgba(39, 208, 196, 0.8); opacity: 0;
  animation: sparkleTwinkle 3.2s ease-in-out infinite; z-index: 2;
}
.hero-sparkle--1 { top: 4%; right: 8%; font-size: 18px; }
.hero-sparkle--2 { bottom: 12%; left: 4%; font-size: 13px; animation-delay: 1.1s; }
.hero-sparkle--3 { top: 16%; left: 2%; font-size: 12px; animation-delay: 2.1s; }
@keyframes sparkleTwinkle {
  0%, 100% { opacity: 0; transform: scale(0.6) rotate(0deg); }
  50% { opacity: 0.9; transform: scale(1) rotate(20deg); }
}
@keyframes pulseGlow { 0%, 100% { opacity: 0.65; transform: scale(0.96); } 50% { opacity: 1; transform: scale(1.04); } }
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
.hero-actions {
  display: flex; align-items: center; justify-content: center; flex-wrap: wrap;
  gap: 10px; margin: 0 0 var(--space-2);
}
.hero-action-primary, .hero-action-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: 10px 18px; border-radius: var(--radius-md);
  font-size: 14px; font-weight: 700; text-decoration: none;
  transition: transform var(--transition), background var(--transition), border-color var(--transition), box-shadow var(--transition);
}
.hero-action-primary { gap: 12px; color: var(--ink); background: linear-gradient(135deg, var(--aqua), var(--sea)); box-shadow: 0 8px 22px rgba(39, 208, 196, 0.24); }
.hero-action-primary:hover { box-shadow: 0 12px 28px rgba(39, 208, 196, 0.34); }
.hero-action-secondary { color: var(--foam); border: 1px solid var(--border-hover); background: rgba(255, 255, 255, 0.035); }
.hero-action-secondary:hover { border-color: var(--aqua); background: rgba(39, 208, 196, 0.08); }
.hero-action-primary:focus-visible, .hero-action-secondary:focus-visible { outline: 2px solid var(--aqua); outline-offset: 3px; }
.hero-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); }
.hero-evidence-strip { gap: 0; margin-top: 4px; }
.hero-evidence-item {
  display: inline-flex; align-items: baseline; gap: 5px; padding: 0 14px;
  color: var(--muted); font-size: 12px; line-height: 1.4;
  border-right: 1px solid rgba(189, 246, 239, 0.16); background: transparent;
}
.hero-evidence-item:first-child { padding-left: 0; }
.hero-evidence-item:last-child { border-right: 0; }
.hero-evidence-item strong { color: var(--foam); font-weight: 700; font-variant-numeric: tabular-nums; }
.hero-evidence-link {
  display: inline-flex; align-items: center; gap: 7px; color: var(--aqua);
  min-height: 44px; padding: 10px 0; font-size: 11px; font-weight: 700; text-decoration: none;
  transition: color var(--transition), transform var(--transition);
}
.hero-evidence-link:hover { color: var(--foam); }
.hero-evidence-link:focus-visible { outline: 2px solid var(--aqua); outline-offset: 4px; border-radius: 3px; }
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
.section-hint { color: var(--muted); font-size: 12px; }
.advanced-settings {
  margin-bottom: var(--space-4); border: 1px solid rgba(39, 208, 196, 0.16);
  border-radius: var(--radius-lg); background: rgba(39, 208, 196, 0.035); overflow: hidden;
}
.advanced-settings > summary {
  padding: 11px 14px; color: var(--foam); cursor: pointer; font-size: 13px;
  font-weight: 700; list-style: none;
}
.advanced-settings > summary::-webkit-details-marker { display: none; }
.advanced-settings > summary::before { content: "＋"; display: inline-block; width: 18px; color: var(--aqua); }
.advanced-settings[open] > summary::before { content: "−"; }
.advanced-settings-hint { margin-left: 8px; color: var(--muted); font-weight: 400; }
.model-selector { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 12px; padding: 0 14px 14px; }
.model-selector-label { color: var(--muted); font-size: 12.5px; }
.advanced-settings-note { flex-basis: 100%; margin: 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
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
  border-color: var(--aqua); background: var(--card-hover);
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
.privacy-note { margin: 12px auto 0; max-width: 560px; color: var(--muted); font-size: 12px; line-height: 1.6; text-align: center; }
.upload-cta-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: var(--space-4); }
.upload-cta {
  padding: 10px 22px; min-height: 44px; border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--aqua) 0%, var(--sea) 100%);
  color: var(--ink); font-weight: 600; font-size: 14px;
  box-shadow: 0 6px 20px rgba(39, 208, 196, 0.3);
  transition: transform var(--transition), box-shadow var(--transition);
}
.upload-cta:hover { box-shadow: 0 10px 28px rgba(39, 208, 196, 0.45); }
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
.sample-thumb:hover { border-color: var(--border-hover); }
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
.preview-info {
  display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3);
  margin-top: var(--space-3); color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums;
}
.preview-info span { display: inline-flex; align-items: center; gap: 5px; }
.preview-info strong { color: var(--foam); font-weight: 600; }
.onboarding-tip {
  position: relative; width: fit-content; margin: var(--space-4) auto 0;
  padding: 10px 18px; border-radius: 12px; color: var(--ink);
  background: linear-gradient(135deg, var(--aqua), var(--sea));
  font-size: 13px; font-weight: 600; box-shadow: 0 8px 28px rgba(39, 208, 196, 0.3);
}
.onboarding-tip::before {
  content: ""; position: absolute; top: -7px; left: 50%; width: 14px; height: 14px;
  background: var(--aqua); transform: translateX(-50%) rotate(45deg);
}
.btn.alt {
  background: var(--card); color: var(--foam); border: 1px solid var(--border);
  box-shadow: none;
}
.btn.alt:hover { border-color: var(--border-hover); background: var(--card-hover); }
.btn.small { padding: 9px 14px; font-size: 13px; min-height: 44px; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.btn .spinner { margin-right: 2px; }
.error-msg {
  margin: var(--space-3) 0 0; color: var(--fresh-low); font-size: 13.5px;
  padding: 10px 14px; background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);
}
.upload-error { margin-inline: 0; }

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
  display: flex; align-items: center; gap: 8px; padding: 10px 12px 10px 16px; border-radius: var(--radius-md);
  font-size: 13.5px; font-weight: 600; margin-bottom: var(--space-4);
  border: 1px solid transparent;
}
.warning-dismiss { margin-left: auto; min-width: 32px; min-height: 32px; border-radius: 8px; color: inherit; opacity: 0.8; }
.warning-dismiss:hover { opacity: 1; background: rgba(255, 255, 255, 0.08); }
.warning-dismiss:focus-visible { outline: 2px solid var(--aqua); outline-offset: 2px; }
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

/* ============ 结果首屏层级 ============ */
.results-empty {
  padding: clamp(32px, 5vw, 48px) var(--space-5); border: 2px dashed var(--border);
  border-radius: var(--radius-xl); text-align: center;
}
.results-empty:hover { border-color: var(--border-hover); }
.results-empty .result-icon {
  width: 60px; height: 60px; margin: 0 auto var(--space-4); border-radius: 50%;
  display: grid; place-items: center; background: rgba(39, 208, 196, 0.08);
  border: 1px solid var(--border); color: var(--aqua); font-size: 30px;
}
.result-text { margin: 0 0 var(--space-2); color: var(--foam); font-size: 15px; font-weight: 500; }
.result-sub { margin: 0; color: var(--muted); font-size: 12.5px; }
.result-toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  max-width: 100%;
  padding: 4px;
  border: 1px solid rgba(189, 246, 239, 0.12);
  border-radius: var(--radius-card);
  background: rgba(0, 8, 20, 0.2);
}
.health-chip {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px;
  border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: 11px;
}
.health-chip::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.health-chip.online { color: var(--fresh-high); border-color: rgba(16, 185, 129, 0.28); }
.health-chip.offline { color: var(--fresh-low); border-color: rgba(239, 68, 68, 0.3); }
.result-primary-card {
  display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(220px, 0.7fr); gap: var(--space-4);
  align-items: stretch; margin-bottom: var(--space-4); padding: clamp(20px, 4vw, 32px);
  border: 1px solid rgba(39, 208, 196, 0.28); border-left: 3px solid var(--aqua);
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, rgba(15, 86, 102, 0.32), rgba(4, 22, 43, 0.72));
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(189, 246, 239, 0.08);
}
.result-primary-copy { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.result-kicker, .result-action-label { display: block; color: var(--aqua); font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.freshness-card { display: flex; align-items: center; gap: 12px; margin-top: 10px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(0, 8, 20, 0.2); }
.freshness-card strong { display: block; font-family: var(--font-display); font-size: clamp(26px, 5vw, 42px); line-height: 1.15; }
.freshness-card small { display: block; margin-top: 5px; color: var(--muted); font-size: 12px; }
.freshness-indicator { width: 11px; height: 48px; flex: 0 0 11px; border-radius: 999px; background: var(--muted); box-shadow: 0 0 18px currentColor; }
.freshness-high { color: var(--fresh-high); }
.freshness-mid { color: var(--fresh-mid); }
.freshness-low { color: var(--fresh-low); }
.freshness-high .freshness-indicator, .freshness-mid .freshness-indicator, .freshness-low .freshness-indicator { background: currentColor; }
.result-action-block { margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(189, 246, 239, 0.14); }
.result-action { margin: 7px 0 0; max-width: 46em; color: var(--foam); font-size: 15px; line-height: 1.7; }
.result-primary-links { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 16px; }
.result-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 0;
  color: var(--aqua);
  font-size: 13px;
  font-weight: 700;
}
.result-link:hover { color: var(--foam); }
.result-link-muted { color: var(--muted); }
.result-primary-confidence { display: flex; flex-direction: column; justify-content: center; min-width: 0; padding: 16px; border: 1px solid rgba(189, 246, 239, 0.1); border-radius: var(--radius-lg); background: rgba(0, 8, 20, 0.22); }
.result-primary-confidence .panel-title { margin-bottom: 8px; color: var(--foam); font-size: 14px; font-weight: 700; }
.primary-gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.primary-gauge { display: block; max-width: 100%; }
.primary-gauge-num { fill: var(--foam); font-family: var(--font-display); font-size: 21px; font-weight: 800; }
.primary-gauge-cap { fill: var(--muted); font-size: 8px; }
.primary-gauge-label { color: var(--muted); font-size: 12px; text-align: center; }

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
  flex: 1; min-width: 80px; min-height: 44px; padding: 10px 14px; border-radius: var(--radius-sm);
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
  position: relative;
  width: min(100%, calc(100svh - 240px));
  max-width: min(100%, 640px);
  max-height: min(640px, calc(100svh - 240px));
  aspect-ratio: 1;
  margin-inline: auto;
  overflow: hidden;
  contain: layout paint;
  border-radius: var(--radius-card);
  user-select: none;
  touch-action: none;
  cursor: ew-resize;
  background: var(--ink);
}
.compare-slider:focus-visible { outline: 2px solid var(--aqua); outline-offset: 4px; }
.compare-img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; -webkit-user-drag: none; }

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
.vision-explain { margin: 10px auto 0; max-width: 70ch; color: var(--foam); font-size: 13px; line-height: 1.7; text-align: center; }
.vision-explain.muted { color: var(--muted); }

/* ============ 手风琴 ============ */
.accordion {
  border: 1px solid var(--border); border-radius: var(--radius-card);
  background: var(--card); overflow: hidden; margin-bottom: var(--space-3);
  transition: border-color var(--transition), background var(--transition);
}
.accordion:hover { border-color: var(--border-hover); }
.accordion-head {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; min-height: 48px; padding: 14px 18px;
  color: inherit; text-align: left; cursor: pointer; user-select: none;
}
.accordion-title { font-size: 14.5px; font-weight: 600; color: var(--foam); display: flex; align-items: center; gap: 8px; }
.advice-icon { font-size: 16px; }
.accordion-arrow { font-size: 11px; color: var(--aqua); transition: transform var(--transition); }
.accordion.is-open .accordion-arrow { transform: rotate(90deg); }
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--motion-expand) var(--ease-decel);
}
.accordion.is-open .accordion-body { grid-template-rows: 1fr; }
.accordion-inner { min-height: 0; overflow: hidden; padding: 0 18px 16px; }
.sec-desc { margin: 0 0 var(--space-2); font-size: 13.5px; color: var(--foam); line-height: 1.7; }
.sec-items { margin: var(--space-2) 0 0; padding-left: 18px; font-size: 13px; color: var(--muted); line-height: 1.8; }
.sec-items li { margin-bottom: 2px; }
.advice-items { margin: var(--space-2) 0 0; padding-left: 18px; color: var(--muted); font-size: 13px; line-height: 1.8; }
.advice-items li { margin-bottom: 3px; }

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
.history-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.history-item {
  display: flex; align-items: center; gap: var(--space-3); padding: 10px 14px;
  border-radius: var(--radius-md); background: var(--card); border: 1px solid var(--border);
  cursor: pointer; transition: border-color var(--transition), background var(--transition), transform var(--transition);
}
.history-item:hover { border-color: var(--border-hover); background: var(--card-hover); }
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
  width: 44px; height: 44px; border-radius: 8px; display: grid; place-items: center;
  font-size: 14px; color: var(--muted); background: transparent;
  border: 1px solid var(--border); transition: all var(--transition);
}
.icon-btn:hover { color: var(--aqua); border-color: var(--border-hover); background: var(--card-hover); }
.icon-btn.active { color: #f0a020; border-color: rgba(240, 160, 32, 0.5); }
.icon-btn.del:hover { color: var(--fresh-low); border-color: rgba(239, 68, 68, 0.5); }

/* ============ 引导弹窗 ============ */
:global(.guide-dialog-panel) {
  width: min(100%, 420px);
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
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
.confidence-modal-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
.confidence-modal-actions .btn { flex: 1 1 150px; }

@media (hover: hover) and (pointer: fine) {
  .hero-action-primary:hover, .hero-action-secondary:hover { transform: translateY(-2px); }
  .hero-evidence-link:hover { transform: translateX(2px); }
  .upload-zone:hover { transform: translateY(-2px); }
  .upload-cta:hover { transform: translateY(-2px); }
  .sample-thumb:hover { transform: translateY(-3px) scale(1.04); }
  .btn.alt:hover { transform: translateY(-2px); }
  .history-item:hover { transform: translateX(3px); }
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .hero { min-height: auto; padding-top: var(--space-7); }
  .hero-actions { width: 100%; }
  .hero-action-primary, .hero-action-secondary { flex: 1 1 0; min-width: 0; padding-inline: 12px; }
  .hero-evidence-strip { width: 100%; flex-wrap: wrap; }
  .hero-evidence-item { min-width: 0; padding-inline: 9px; }
  .hero-evidence-item:first-child { padding-left: 0; }
  .hero-evidence-link { align-self: center; }
  .overview-grid { grid-template-columns: 1fr; }
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .skeleton-grid { grid-template-columns: 1fr; }
  .skeleton.tall { grid-row: auto; height: 160px; }
  .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .model-switch { align-self: stretch; justify-content: center; }
  .prob-row { grid-template-columns: 72px 1fr 48px; }
}
@media (max-width: 640px) {
  .advanced-settings > summary { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; }
  .advanced-settings-hint { margin-left: auto; text-align: right; }
  .hero-evidence-item { font-size: 11px; }
  .preview-info { gap: 8px 12px; font-size: 11px; }
  .preview-info span { min-width: 0; max-width: 100%; }
  .preview-info strong { max-width: 12em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .result-toolbar { width: 100%; justify-content: space-between; }
  .result-primary-card { grid-template-columns: 1fr; padding: 18px 16px; gap: 18px; }
  .result-primary-confidence { order: -1; padding: 14px 10px; }
  .tabs { gap: 2px; padding: 3px; }
  .tab { min-width: 64px; padding: 9px 8px; font-size: 12.5px; }
  .history-thumb { width: 40px; height: 40px; }
  .history-time { display: none; }
  .preview-actions { flex-direction: column; }
  .preview-actions .btn { width: 100%; }
  .compare-handle { width: 30px; height: 30px; font-size: 14px; }
  .guide-modal { padding: var(--space-5); }
  .hero-chip { font-size: 12px; padding: 6px 14px; }
  .hero-scroll-cue { margin-top: var(--space-4); }
}

/* ============ 减少动画偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .hero-eye, .scroll-arrow, .scan-line, .preview-img-wrap.scanning::after,
  .skeleton, .spinner, .tab-panel { animation: none !important; }
  .hero-chip, .hero-scroll-cue, .hero-sparkle { animation: none !important; opacity: 1 !important; }
  .hero-chip-dot { animation: none !important; }
  .hero-eye-wrap::before { animation: none !important; opacity: 0.6 !important; }
  .gauge-arc, .prob-fill, .hero-action-primary, .hero-action-secondary { transition: none !important; }
}
</style>
