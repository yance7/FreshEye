<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AccessibleDialog from '@/components/AccessibleDialog.vue'
import { useI18n } from '@/i18n'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  capture: [file: File]
  close: []
  fallback: []
}>()

const { t } = useI18n()
const { toast } = useToast()

let idSeed = 0
const dialogId = `camera-dialog-${++idSeed}`
const titleId = `${dialogId}-title`
const descriptionId = `${dialogId}-description`

const video = ref<HTMLVideoElement | null>(null)
const facingMode = ref<'environment' | 'user'>('environment')
const cameraStarting = ref(false)
const cameraError = ref(false)
const capturing = ref(false)

let stream: MediaStream | null = null
let requestGeneration = 0

function stopStream(target: MediaStream | null): void {
  target?.getTracks().forEach((track) => track.stop())
}

function stopActiveStream(): void {
  const active = stream
  stream = null
  if (video.value?.srcObject === active) video.value.srcObject = null
  stopStream(active)
}

function invalidateAndStop(): void {
  requestGeneration += 1
  stopActiveStream()
  cameraStarting.value = false
  capturing.value = false
}

async function startCamera(): Promise<void> {
  const request = ++requestGeneration
  cameraStarting.value = true
  cameraError.value = false
  stopActiveStream()

  await nextTick()
  if (!props.open || request !== requestGeneration) return

  const getUserMedia = navigator.mediaDevices?.getUserMedia
  if (typeof getUserMedia !== 'function') {
    cameraError.value = true
    cameraStarting.value = false
    return
  }

  try {
    const nextStream = await getUserMedia.call(navigator.mediaDevices, {
      video: {
        facingMode: { ideal: facingMode.value },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })

    if (!props.open || request !== requestGeneration) {
      stopStream(nextStream)
      return
    }

    const target = video.value
    if (!target) {
      stopStream(nextStream)
      cameraError.value = true
      return
    }

    stream = nextStream
    target.srcObject = nextStream
    try {
      await target.play()
    } catch {
      // Some browsers resolve the stream before autoplay is permitted; the user can still press Capture.
    }

    if (!props.open || request !== requestGeneration) {
      if (stream === nextStream) stopActiveStream()
      else stopStream(nextStream)
    }
  } catch {
    if (props.open && request === requestGeneration) cameraError.value = true
  } finally {
    if (request === requestGeneration) cameraStarting.value = false
  }
}

function handleClose(): void {
  invalidateAndStop()
  emit('close')
}

function handleDialogClose(): void {
  handleClose()
}

function handleFallback(): void {
  invalidateAndStop()
  emit('fallback')
}

async function flipCamera(): Promise<void> {
  if (cameraStarting.value || !props.open) return
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  await startCamera()
}

async function captureCamera(): Promise<void> {
  const target = video.value
  if (!target || !target.videoWidth || !target.videoHeight) {
    toast.error(t('home.camera.not_ready'))
    return
  }

  capturing.value = true
  const canvas = document.createElement('canvas')
  canvas.width = target.videoWidth
  canvas.height = target.videoHeight
  const context = canvas.getContext('2d')
  if (!context) {
    capturing.value = false
    toast.error(t('home.camera.capture_failed'))
    return
  }

  context.drawImage(target, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  })

  if (!blob) {
    capturing.value = false
    toast.error(t('home.camera.capture_failed'))
    return
  }

  emit('capture', new File([blob], 'fresheye-camera.jpg', { type: 'image/jpeg' }))
  handleClose()
}

watch(() => props.open, (open) => {
  if (open) void startCamera()
  else invalidateAndStop()
}, { immediate: true, flush: 'post' })

onBeforeUnmount(invalidateAndStop)
</script>

<template>
  <AccessibleDialog
    :open="open"
    :title-id="titleId"
    :description-id="descriptionId"
    panel-class="camera-dialog-shell"
    @close="handleDialogClose"
  >
    <div class="camera-dialog">
      <div class="camera-dialog-head">
        <h2 :id="titleId">{{ t('home.camera.title') }}</h2>
        <button class="icon-btn" type="button" :aria-label="t('home.camera.close')" @click="handleClose">✕</button>
      </div>

      <p :id="descriptionId" class="camera-description">{{ t('home.camera.guide') }}</p>

      <div class="camera-viewfinder">
        <video ref="video" autoplay playsinline muted></video>
        <div class="camera-guide" aria-hidden="true">
          <span class="camera-guide-ring"></span>
          <span class="camera-guide-crosshair"></span>
        </div>
        <p class="camera-guide-label" aria-hidden="true">{{ t('home.camera.guide') }}</p>
        <div v-if="cameraStarting" class="camera-status" role="status" aria-live="polite"><span class="spinner"></span>{{ t('home.camera.starting') }}</div>
        <div v-else-if="cameraError" class="camera-status camera-error" role="alert">⚠️ {{ t('home.camera.error') }}</div>
        <span class="camera-corner top-left" aria-hidden="true"></span><span class="camera-corner top-right" aria-hidden="true"></span>
        <span class="camera-corner bottom-left" aria-hidden="true"></span><span class="camera-corner bottom-right" aria-hidden="true"></span>
      </div>

      <p v-if="cameraError" class="camera-help">{{ t('home.camera.fallback_help') }}</p>
      <div class="camera-actions">
        <button data-testid="camera-flip" class="btn alt" type="button" :disabled="cameraStarting || cameraError" @click="flipCamera">↻ {{ t('home.camera.flip') }}</button>
        <button data-testid="camera-capture" class="btn" type="button" :disabled="cameraStarting || cameraError || capturing" @click="captureCamera">⌾ {{ t('home.camera.capture') }}</button>
        <button v-if="cameraError" data-testid="camera-fallback" class="btn alt" type="button" @click="handleFallback">{{ t('home.camera.fallback') }}</button>
      </div>
    </div>
  </AccessibleDialog>
</template>

<style scoped>
:global(.camera-dialog-shell) {
  width: min(100%, 620px);
  padding: clamp(16px, 3vw, 24px);
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-xl);
  background: linear-gradient(160deg, rgba(6, 42, 77, 0.97), rgba(4, 22, 43, 0.98));
  box-shadow: 0 24px 60px rgba(1, 8, 18, 0.62);
}

.camera-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.camera-dialog-head h2 { margin: 0; font-size: 18px; }
.camera-description { margin: 0 0 14px; color: var(--muted); font-size: 13px; line-height: 1.6; }

.camera-viewfinder {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  background: #020a16;
  border: 1px solid var(--border);
}

.camera-viewfinder::before { content: ""; position: absolute; inset: 0; z-index: 0; background: #020a16; }
.camera-viewfinder video { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: cover; background: #020a16; }
.camera-guide { position: absolute; inset: 0; z-index: 2; display: grid; place-items: center; pointer-events: none; }
.camera-guide-ring { width: min(66%, 360px); aspect-ratio: 1; border: 1px solid rgba(141, 243, 230, 0.78); border-radius: 50%; box-shadow: 0 0 0 999px rgba(2, 10, 22, 0.09), 0 0 24px rgba(39, 208, 196, 0.28), inset 0 0 18px rgba(39, 208, 196, 0.08); }
.camera-guide-crosshair { position: absolute; width: 18px; height: 18px; border: 1px solid rgba(238, 252, 255, 0.35); border-radius: 50%; }
.camera-guide-label { position: absolute; z-index: 3; left: 50%; bottom: 10px; width: calc(100% - 24px); transform: translateX(-50%); margin: 0; padding: 5px 9px; border-radius: 7px; background: rgba(4, 22, 43, 0.56); color: var(--foam); font-size: 11px; line-height: 1.45; text-align: center; }
.camera-status { position: absolute; z-index: 5; inset: auto 12px 12px; display: flex; justify-content: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(4, 22, 43, 0.86); color: var(--foam); font-size: 13px; text-align: center; }
.camera-error { color: #ffd1d1; }
.camera-corner { position: absolute; z-index: 4; width: 24px; height: 24px; border-color: var(--aqua); border-style: solid; filter: drop-shadow(0 0 7px rgba(39, 208, 196, 0.45)); }
.camera-corner.top-left { top: 14px; left: 14px; border-width: 2px 0 0 2px; border-radius: 6px 0 0 0; }
.camera-corner.top-right { top: 14px; right: 14px; border-width: 2px 2px 0 0; border-radius: 0 6px 0 0; }
.camera-corner.bottom-left { bottom: 14px; left: 14px; border-width: 0 0 2px 2px; border-radius: 0 0 0 6px; }
.camera-corner.bottom-right { right: 14px; bottom: 14px; border-width: 0 2px 2px 0; border-radius: 0 0 6px 0; }
.camera-help { margin: 10px 0 0; color: var(--muted); font-size: 13px; text-align: center; }
.camera-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 16px; }

@media (max-width: 480px) {
  :global(.camera-dialog-shell) { padding: 14px; }
  .camera-actions > * { flex: 1 1 140px; }
}

@media (max-height: 520px) and (orientation: landscape) {
  :global(.camera-dialog-shell) { margin-block: 8px; }
  .camera-viewfinder { aspect-ratio: 16 / 8; }
}
</style>
