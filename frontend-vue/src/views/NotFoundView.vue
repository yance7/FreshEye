<script setup lang="ts">
// 404 视图：深海主题的页面找不到提示
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <section class="notfound-wrap reveal">
    <div class="num-404">{{ t('notfound.code') }}</div>
    <h1 class="notfound-title">{{ t('notfound.title') }}</h1>
    <p class="notfound-desc">{{ t('notfound.desc') }}</p>
    <router-link to="/" class="btn">{{ t('notfound.home') }}</router-link>
  </section>
</template>

<style scoped>
.notfound-wrap {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-4);
  animation: fadeUp 0.9s ease both;
}
.notfound-title {
  font-family: var(--font-display);
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 800;
  color: var(--white);
  margin: 0;
  letter-spacing: 0.5px;
}
.notfound-desc {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.7;
  margin: 0 auto var(--space-3);
  max-width: 420px;
}
</style>
