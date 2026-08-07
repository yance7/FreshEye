<script setup lang="ts">
// 深海动态背景层：光晕 + 气泡 + 波浪
// 根据设备宽度生成 6/12 个气泡，尊重 prefers-reduced-motion
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isMobile = ref(false)
const reduceMotion = ref(false)
const bubbles = ref<Array<{ left: string; size: string; duration: string; delay: string; sway: string }>>([])

function buildBubbles(): void {
  const count = isMobile.value ? 6 : 12
  const list: typeof bubbles.value = []
  for (let i = 0; i < count; i++) {
    const size = 8 + Math.random() * 34
    list.push({
      left: `${Math.random() * 100}%`,
      size: `${size}px`,
      duration: `${10 + Math.random() * 16}s`,
      delay: `${Math.random() * 12}s`,
      sway: `${(Math.random() * 60 - 30).toFixed(1)}px`
    })
  }
  bubbles.value = list
}

function updateViewport(): void {
  const mobile = window.matchMedia('(max-width: 640px)').matches
  if (mobile !== isMobile.value) {
    isMobile.value = mobile
    if (!reduceMotion.value) buildBubbles()
  }
}

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isMobile.value = window.matchMedia('(max-width: 640px)').matches
  if (!reduceMotion.value) buildBubbles()
  window.addEventListener('resize', updateViewport, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<template>
  <div class="bg-layer" aria-hidden="true">
    <div class="glow glow-1"></div>
    <div class="glow glow-2"></div>
    <div class="glow glow-3"></div>
    <div class="bubbles" v-if="!reduceMotion">
      <div
        v-for="(b, i) in bubbles"
        :key="i"
        class="bubble"
        :style="{
          left: b.left,
          width: b.size,
          height: b.size,
          animationDuration: b.duration,
          animationDelay: b.delay,
          '--sway': b.sway
        }"
      ></div>
    </div>
    <div class="wave wave-1" v-if="!reduceMotion"></div>
    <div class="wave wave-2" v-if="!reduceMotion"></div>
  </div>
</template>
