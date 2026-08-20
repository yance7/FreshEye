<script lang="ts">
let bodyLockDepth = 0
let savedBodyOverflow = ''
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type CloseReason = 'escape' | 'backdrop' | 'action'

const props = withDefaults(defineProps<{
  open: boolean
  titleId: string
  descriptionId?: string
  closeOnBackdrop?: boolean
  initialFocus?: 'first' | 'dialog'
  panelClass?: string
}>(), {
  closeOnBackdrop: true,
  initialFocus: 'first',
  panelClass: ''
})

const emit = defineEmits<{
  close: [reason: CloseReason]
}>()

const focusableSelector = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',')

const dialogRef = ref<HTMLElement | null>(null)
let focusedBeforeOpen: HTMLElement | null = null
let ownsBodyLock = false

function focusableControls(): HTMLElement[] {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(focusableSelector))
}

function lockBody(): void {
  if (ownsBodyLock) return
  if (bodyLockDepth === 0) savedBodyOverflow = document.body.style.overflow
  bodyLockDepth += 1
  ownsBodyLock = true
  document.body.style.overflow = 'hidden'
}

function unlockBody(): void {
  if (!ownsBodyLock) return
  ownsBodyLock = false
  bodyLockDepth = Math.max(0, bodyLockDepth - 1)
  if (bodyLockDepth === 0) document.body.style.overflow = savedBodyOverflow
}

function restoreFocus(): void {
  const target = focusedBeforeOpen
  focusedBeforeOpen = null
  if (target?.isConnected) target.focus()
}

async function activate(): Promise<void> {
  focusedBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : null
  lockBody()
  await nextTick()
  if (!props.open || !dialogRef.value) return

  if (props.initialFocus === 'dialog') {
    dialogRef.value.focus()
    return
  }

  const [firstControl] = focusableControls()
  ;(firstControl ?? dialogRef.value).focus()
}

function deactivate(): void {
  unlockBody()
  restoreFocus()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close', 'escape')
    return
  }

  if (event.key !== 'Tab') return

  const controls = focusableControls()
  if (controls.length === 0) {
    event.preventDefault()
    dialogRef.value?.focus()
    return
  }

  const first = controls[0]
  const last = controls[controls.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || !dialogRef.value?.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (active === last || !dialogRef.value?.contains(active))) {
    event.preventDefault()
    first.focus()
  }
}

function onBackdropClick(event: MouseEvent): void {
  if (props.closeOnBackdrop && event.target === event.currentTarget) emit('close', 'backdrop')
}

watch(() => props.open, (isOpen) => {
  if (isOpen) void activate()
  else deactivate()
}, { immediate: true, flush: 'post' })

onBeforeUnmount(deactivate)
</script>

<template>
  <Teleport to="body">
    <Transition name="app-dialog">
      <div v-if="open" class="app-dialog-overlay" @click="onBackdropClick">
        <div
          ref="dialogRef"
          class="app-dialog-surface"
          :class="panelClass"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId || undefined"
          tabindex="-1"
          @keydown="onKeydown"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
