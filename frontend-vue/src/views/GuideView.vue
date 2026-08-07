<script setup lang="ts">
// 使用指南视图：页头 + 三步流程 + 拍照教程 + FAQ
import { ref, computed, watchEffect } from 'vue'
import { useI18n } from '@/i18n'

const { t, tm } = useI18n()
const sampleImage = `${import.meta.env.BASE_URL}assets/samples/highly-fresh.webp`

interface Step { num: string; icon: string; title: string; text: string }
interface Faq { q: string; a: string; open: boolean }
interface PhotoCheck { title: string; text: string }
interface Tip { icon: string; title: string; text: string }

const steps = computed<Step[]>(() => tm<Step[]>('guide.steps'))
const correctChecks = computed<PhotoCheck[]>(() => tm<PhotoCheck[]>('guide.correct_checks'))
const incorrectChecks = computed<PhotoCheck[]>(() => tm<PhotoCheck[]>('guide.incorrect_checks'))
const tips = computed<Tip[]>(() => tm<Tip[]>('guide.tips'))

const faqs = ref<Faq[]>([])

// 初始化 FAQ，标记第一个为展开
watchEffect(() => {
  const raw = tm<{ q: string; a: string }[]>('guide.faqs')
  faqs.value = raw.map((f, i) => ({ ...f, open: i === 0 }))
})

function toggleFaq(idx: number): void {
  faqs.value[idx].open = !faqs.value[idx].open
}
</script>

<template>
  <!-- 页头 -->
  <header class="page-hero reveal">
    <span class="page-hero-eyebrow">{{ t('guide.eyebrow') }}</span>
    <h1 class="page-hero-title">{{ t('guide.title') }}</h1>
    <p class="page-hero-sub">{{ t('guide.subtitle') }}</p>
  </header>

  <!-- 三步使用流程 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('guide.steps_title') }}</h2>
    </div>
    <div class="users-grid">
      <div v-for="s in steps" :key="s.num" class="user-card step-card">
        <span class="step-num" aria-hidden="true">{{ s.num }}</span>
        <div class="user-icon" aria-hidden="true">{{ s.icon }}</div>
        <h3 class="user-title">{{ s.title }}</h3>
        <p class="user-text">{{ s.text }}</p>
      </div>
    </div>
  </section>

  <!-- 拍照教程 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('guide.photo_title') }}</h2>
    </div>
    <p class="intro-sub">{{ t('guide.photo_intro') }}</p>
    <div class="viewfinder-guide glass-card">
      <div class="viewfinder-guide-media">
        <img :src="sampleImage" :alt="t('guide.photo_title')" loading="lazy" decoding="async" />
        <span class="viewfinder-guide-ring" aria-hidden="true"></span>
        <span class="viewfinder-guide-hint">{{ t('guide.photo_hint') }}</span>
      </div>
      <p class="viewfinder-guide-note">{{ t('guide.photo_text') }}</p>
    </div>
    <div class="compare-pain photo-check-grid">
      <div class="pain-card solution">
        <div class="pain-card-head"><span class="pain-icon" aria-hidden="true">✓</span><span>{{ t('guide.correct_title') }}</span></div>
        <ul class="pain-list">
          <li v-for="item in correctChecks" :key="item.title"><strong>{{ item.title }}</strong>：{{ item.text }}</li>
        </ul>
      </div>
      <div class="pain-card pain">
        <div class="pain-card-head"><span class="pain-icon" aria-hidden="true">!</span><span>{{ t('guide.incorrect_title') }}</span></div>
        <ul class="pain-list">
          <li v-for="item in incorrectChecks" :key="item.title"><strong>{{ item.title }}</strong>：{{ item.text }}</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- 常见问题 FAQ -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('guide.faq_title') }}</h2>
    </div>
    <div class="faq-list">
      <div
        v-for="(f, i) in faqs"
        :key="i"
        class="accordion"
        :class="{ 'is-open': f.open }"
      >
        <div
          class="accordion-head"
          role="button"
          tabindex="0"
          :aria-expanded="f.open"
          @click="toggleFaq(i)"
          @keydown.enter.prevent="toggleFaq(i)"
          @keydown.space.prevent="toggleFaq(i)"
        >
          <span class="accordion-title">{{ f.q }}</span>
          <span class="accordion-arrow" aria-hidden="true">▶</span>
        </div>
        <div class="accordion-body">
          <div class="accordion-inner">
            <p style="margin:0; font-size:13.5px; color:var(--foam); line-height:1.7;">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 最佳实践 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('guide.tips_title') }}</h2>
    </div>
    <div class="tips-grid">
      <div v-for="tip in tips" :key="tip.title" class="tip-card">
        <div class="tip-icon" aria-hidden="true">{{ tip.icon }}</div>
        <h3>{{ tip.title }}</h3>
        <p>{{ tip.text }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-5);
}
.user-card {
  position: relative;
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  background: var(--card);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-align: center;
  transition: transform var(--transition), border-color var(--transition), background var(--transition);
}
.user-card:hover { transform: translateY(-4px); border-color: var(--border-hover); background: var(--card-hover); }
.step-card { padding-top: calc(var(--space-5) + 8px); }
.step-num {
  position: absolute;
  top: -14px; left: 50%;
  transform: translateX(-50%);
  width: 32px; height: 32px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 15px;
  color: var(--ink);
  background: linear-gradient(135deg, var(--aqua), var(--sea));
  box-shadow: 0 6px 18px rgba(39, 208, 196, 0.4);
}
.user-icon { font-size: 36px; margin-bottom: var(--space-3); }
.user-title { font-size: 17px; font-weight: 700; color: var(--white); margin: 0 0 var(--space-2); }
.user-text { font-size: 13px; color: var(--muted); line-height: 1.7; margin: 0; }

.viewfinder-guide { display: grid; grid-template-columns: minmax(220px, 360px) 1fr; gap: var(--space-5); align-items: center; margin-bottom: var(--space-5); }
.viewfinder-guide-media { position: relative; aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--ink); }
.viewfinder-guide-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.viewfinder-guide-ring { position: absolute; width: 48%; aspect-ratio: 1; left: 26%; top: 17%; border: 2px solid var(--aqua); border-radius: 50%; box-shadow: 0 0 0 999px rgba(4, 16, 29, 0.16), 0 0 24px rgba(39, 208, 196, 0.45); }
.viewfinder-guide-hint { position: absolute; left: 0; right: 0; bottom: 12px; text-align: center; color: var(--white); font-size: 12px; text-shadow: 0 1px 4px #00111f; }
.viewfinder-guide-note { margin: 0; color: var(--foam); line-height: 1.8; font-size: 13.5px; }
.photo-check-grid { margin-bottom: var(--space-5); }
.tips-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); }
.tip-card { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); transition: transform var(--transition), border-color var(--transition); }
.tip-card:hover { transform: translateY(-3px); border-color: var(--border-hover); }
.tip-icon { font-size: 28px; margin-bottom: var(--space-2); }
.tip-card h3 { margin: 0 0 var(--space-2); color: var(--white); font-size: 15px; }
.tip-card p { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }

.faq-list { display: flex; flex-direction: column; gap: var(--space-3); }
.accordion {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
  overflow: hidden;
  transition: border-color var(--transition), background var(--transition);
}
.accordion:hover { border-color: var(--border-hover); }
.accordion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  user-select: none;
}
.accordion-title { font-size: 15px; font-weight: 600; color: var(--foam); }
.accordion-arrow {
  font-size: 11px;
  color: var(--aqua);
  transition: transform var(--transition);
}
.accordion.is-open .accordion-arrow { transform: rotate(90deg); }
.accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s var(--ease-decel);
}
.accordion.is-open .accordion-body { max-height: 400px; }
.accordion-inner { padding: 0 20px 16px; }

@media (max-width: 640px) {
  .users-grid { grid-template-columns: 1fr; }
  .viewfinder-guide { grid-template-columns: 1fr; }
}
</style>
