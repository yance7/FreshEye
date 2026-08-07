<script setup lang="ts">
// Toast 通知容器：读取 useToast 单例中的消息列表并渲染
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container" role="status" aria-live="polite">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="[
        t.type === 'success' ? 'is-success' : t.type === 'info' ? 'is-info' : '',
        t.leaving ? 'is-leaving' : ''
      ]"
      @click="removeToast(t.id)"
    >
      <span class="toast-dot"></span>
      <span>{{ t.message }}</span>
    </div>
  </div>
</template>
