<script setup lang="ts">
// 页脚：品牌简介 + 快速导航 + 技术栈 + 大赛信息 + 版权
import { useI18n } from '@/i18n'

const { t } = useI18n()

const techStack = ['Python + FastAPI', 'PyTorch', 'EfficientNet-B0', 'Grad-CAM', 'Vue 3 + TS', '推理流水线']
</script>

<template>
  <footer class="competition-footer">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="footer-brand-row">
          <span class="footer-brand-logo" aria-hidden="true"><span class="brand-eye"></span></span>
          <span class="footer-brand-name">FreshEye</span>
        </div>
        <p class="footer-brand-desc">{{ t('footer.desc') }}</p>
      </div>

      <nav aria-label="页脚导航">
        <h4 class="footer-col-title">{{ t('footer.nav_title') }}</h4>
        <div class="footer-links">
          <router-link to="/">{{ t('footer.nav_home') }}</router-link>
          <router-link to="/guide">{{ t('footer.nav_guide') }}</router-link>
          <router-link to="/fish">{{ t('footer.nav_fish') }}</router-link>
          <router-link to="/about">{{ t('footer.nav_about') }}</router-link>
          <a href="https://github.com/yance7/FreshEye" target="_blank" rel="noopener noreferrer">{{ t('footer.nav_source') }}</a>
        </div>
      </nav>

      <div>
        <h4 class="footer-col-title">{{ t('footer.stack_title') }}</h4>
        <div class="footer-stack">
          <span v-for="s in techStack" :key="s">{{ s }}</span>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="competition-info">
        <span class="badge">{{ t('footer.competition1') }}</span>
        <span class="badge">{{ t('footer.competition2') }}</span>
        <span class="badge">{{ t('footer.competition3') }}</span>
      </div>
      <div class="footer-copy">{{ t('footer.copy') }}</div>
    </div>
  </footer>
</template>
