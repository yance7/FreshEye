<script setup lang="ts">
// 关于视图：页头 + 技术架构 + 痛点vs解法 + 方案对比表
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const { t, tm } = useI18n()

const pains = computed<string[]>(() => tm<string[]>('about.pains'))
const solutions = computed<string[]>(() => tm<string[]>('about.solutions'))

interface CompareRow { model: string; params: string; flops: string; mfed: string; ffe: string; highlight: boolean }
const compareRows = computed<CompareRow[]>(() => tm<CompareRow[]>('about.compare_rows'))
</script>

<template>
  <!-- 页头 -->
  <header class="page-hero reveal">
    <span class="page-hero-eyebrow">{{ t('about.eyebrow') }}</span>
    <h1 class="page-hero-title">{{ t('about.title') }}</h1>
    <p class="page-hero-sub">{{ t('about.subtitle') }}</p>
  </header>

  <!-- 技术架构 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('about.arch_title') }}</h2>
    </div>
    <div class="arch-diagram glass-card">
      <div class="arch-layer">
        <div class="arch-layer-title">{{ t('about.arch_layer_frontend') }}</div>
        <div class="arch-boxes">
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">🏠</span><span>{{ t('about.arch_boxes.home') }}<br /><small>{{ t('about.arch_boxes.home_sub') }}</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">📖</span><span>{{ t('about.arch_boxes.guide') }}<br /><small>{{ t('about.arch_boxes.guide_sub') }}</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">🐟</span><span>{{ t('about.arch_boxes.fish') }}<br /><small>{{ t('about.arch_boxes.fish_sub') }}</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">📋</span><span>{{ t('about.arch_boxes.about') }}<br /><small>{{ t('about.arch_boxes.about_sub') }}</small></span></div>
        </div>
      </div>
      <div class="arch-arrow">↓ HTTPS POST /predict_with_gradcam</div>
      <div class="arch-layer arch-layer-backend">
        <div class="arch-layer-title">{{ t('about.arch_layer_backend') }}</div>
        <div class="arch-boxes">
          <div class="arch-box arch-box-wide"><span>{{ t('about.arch_inference') }}</span></div>
        </div>
        <div class="arch-branches">
          <div class="arch-branch arch-branch-high">{{ t('about.arch_branch_high') }}</div>
          <div class="arch-branch arch-branch-mid">{{ t('about.arch_branch_mid') }}</div>
          <div class="arch-branch arch-branch-low">{{ t('about.arch_branch_low') }}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 痛点 vs 解法 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('about.pain_title') }}</h2>
    </div>
    <div class="compare-pain">
      <div class="pain-card pain">
        <div class="pain-card-head">
          <span class="pain-icon" aria-hidden="true">!</span>
          <span>{{ t('about.pain_head') }}</span>
        </div>
        <ul class="pain-list">
          <li v-for="(p, i) in pains" :key="i">{{ p }}</li>
        </ul>
      </div>
      <div class="pain-card solution">
        <div class="pain-card-head">
          <span class="pain-icon" aria-hidden="true">✓</span>
          <span>{{ t('about.solution_head') }}</span>
        </div>
        <ul class="pain-list">
          <li v-for="(s, i) in solutions" :key="i">{{ s }}</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- 方案对比表 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">{{ t('about.compare_title') }}</h2>
    </div>
    <p class="intro-sub">{{ t('about.compare_intro') }}</p>
    <div class="table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>{{ t('about.table_headers.model') }}</th>
            <th>{{ t('about.table_headers.params') }}</th>
            <th>{{ t('about.table_headers.flops') }}</th>
            <th>{{ t('about.table_headers.mfed') }}</th>
            <th>{{ t('about.table_headers.ffe') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in compareRows" :key="r.model" :class="{ 'compare-table-highlight': r.highlight }">
            <td :class="{ highlight: r.highlight }">{{ r.model }}</td>
            <td :class="{ highlight: r.highlight }">{{ r.params }}</td>
            <td :class="{ highlight: r.highlight }">{{ r.flops }}</td>
            <td :class="{ highlight: r.highlight }">{{ r.mfed }}</td>
            <td :class="{ highlight: r.highlight }">{{ r.ffe }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="intro-sub" style="margin-top: 16px;">
      {{ t('about.compare_footer') }}
    </p>
  </section>
</template>

<style scoped>
.intro-sub {
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.75;
  margin: 0 0 var(--space-5);
  max-width: 640px;
}

/* 技术架构图 */
.arch-diagram { display: flex; flex-direction: column; gap: var(--space-4); }
.arch-layer {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
}
.arch-layer-backend { border-color: rgba(39, 208, 196, 0.3); background: rgba(39, 208, 196, 0.05); }
.arch-layer-title {
  font-size: 13px; font-weight: 700; color: var(--aqua);
  margin-bottom: var(--space-3); letter-spacing: 0.5px;
  text-transform: uppercase;
}
.arch-boxes { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.arch-box {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  font-size: 13px; color: var(--foam);
}
.arch-box small { color: var(--muted); font-size: 11px; }
.arch-box-wide { width: 100%; justify-content: center; }
.arch-box-icon { font-size: 18px; }
.arch-arrow {
  text-align: center;
  font-size: 12px; color: var(--muted);
  font-family: var(--font-display);
  letter-spacing: 0.5px;
}
.arch-branches { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); }
.arch-branch {
  flex: 1; min-width: 180px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 12.5px; color: var(--foam);
  border: 1px solid var(--border);
  background: var(--card);
}
.arch-branch-high { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08); }
.arch-branch-mid { border-color: rgba(217, 119, 6, 0.4); background: rgba(217, 119, 6, 0.08); }
.arch-branch-low { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08); }

/* 痛点 vs 解法 */
.compare-pain {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
}
.pain-card {
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.pain-card.pain { border-color: rgba(239, 68, 68, 0.3); }
.pain-card.solution { border-color: rgba(39, 208, 196, 0.3); }
.pain-card-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: var(--space-4);
  font-size: 15px; font-weight: 700; color: var(--white);
}
.pain-icon {
  width: 26px; height: 26px;
  border-radius: 50%;
  display: grid; place-items: center;
  font-weight: 800; font-size: 14px;
}
.pain .pain-icon { background: rgba(239, 68, 68, 0.2); color: var(--bad); }
.solution .pain-icon { background: rgba(39, 208, 196, 0.2); color: var(--aqua); }
.pain-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.pain-list li {
  font-size: 13px; color: var(--muted); line-height: 1.7;
  padding-left: 18px; position: relative;
}
.pain-list li::before {
  content: ""; position: absolute; left: 0; top: 9px;
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--aqua);
}

/* 对比表 */
.table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card);
}
.compare-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.compare-table th, .compare-table td {
  padding: 12px 16px; text-align: left;
  border-bottom: 1px solid var(--border);
  color: var(--foam);
}
.compare-table th {
  font-size: 12px; font-weight: 700; color: var(--aqua);
  letter-spacing: 0.5px; text-transform: uppercase;
  background: rgba(39, 208, 196, 0.06);
}
.compare-table tr:last-child td { border-bottom: none; }
.compare-table-highlight { background: rgba(39, 208, 196, 0.08); }
.compare-table .highlight { color: var(--aqua); font-weight: 600; }

@media (max-width: 768px) {
  .compare-pain { grid-template-columns: 1fr; }
  .arch-branches { flex-direction: column; }
}
@media (max-width: 640px) {
  .arch-boxes { flex-direction: column; }
  .arch-box { width: 100%; }
}
</style>
