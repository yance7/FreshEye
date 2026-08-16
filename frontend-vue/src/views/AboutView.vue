<script setup lang="ts">
// 关于视图：页头 + 技术架构 + 痛点vs解法 + 方案对比表
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const { t, tm } = useI18n()

const pains = computed<string[]>(() => tm<string[]>('about.pains'))
const solutions = computed<string[]>(() => tm<string[]>('about.solutions'))

interface CompareRow { model: string; params: string; flops: string; mfed: string; ffe: string; highlight: boolean }
interface InfoCard { icon: string; title: string; text: string }
interface Phase { title: string; items: string[] }
interface EvidenceStat { value: string; label: string; accent?: boolean }
interface TocItem { id: string; label: string }
interface WorkflowRow { id: string; node: string; type: string; duty: string }
const compareRows = computed<CompareRow[]>(() => tm<CompareRow[]>('about.compare_rows'))
const users = computed<InfoCard[]>(() => tm<InfoCard[]>('about.users'))
const v1Cards = computed<InfoCard[]>(() => tm<InfoCard[]>('about.v1_cards'))
const v2Cards = computed<InfoCard[]>(() => tm<InfoCard[]>('about.v2_cards'))
const journey = computed<InfoCard[]>(() => tm<InfoCard[]>('about.journey'))
const socialValue = computed<InfoCard[]>(() => tm<InfoCard[]>('about.social_value'))
const iteration = computed<Phase[]>(() => tm<Phase[]>('about.iteration'))
const references = computed<string[]>(() => tm<string[]>('about.references'))
const tocItems = computed<TocItem[]>(() => tm<TocItem[]>('about.toc_items'))
const evidenceStats = computed<EvidenceStat[]>(() => tm<EvidenceStat[]>('about.evidence_stats'))
const whyEye = computed<InfoCard[]>(() => tm<InfoCard[]>('about.why_eye'))
const modelCard = computed<InfoCard[]>(() => tm<InfoCard[]>('about.model_card'))
const v1Details = computed<InfoCard[]>(() => tm<InfoCard[]>('about.v1_details'))
const v2Details = computed<InfoCard[]>(() => tm<InfoCard[]>('about.v2_details'))
const workflowRows = computed<WorkflowRow[]>(() => tm<WorkflowRow[]>('about.workflow_rows'))
const traeWorkflow = computed<InfoCard[]>(() => tm<InfoCard[]>('about.trae_workflow'))
</script>

<template>
  <!-- 页头 -->
  <header class="page-hero reveal">
    <span class="page-hero-eyebrow">{{ t('about.eyebrow') }}</span>
    <h1 class="page-hero-title">{{ t('about.title') }}</h1>
    <p class="page-hero-sub">{{ t('about.subtitle') }}</p>
  </header>

  <!-- 页面目录：长页内容在桌面端可快速定位，移动端保持折叠友好 -->
  <details class="about-toc glass-card reveal">
    <summary>{{ t('about.toc_title') }}</summary>
    <nav :aria-label="t('about.toc_title')">
      <a v-for="item in tocItems" :key="item.id" :href="`#${item.id}`">{{ item.label }}</a>
    </nav>
  </details>

  <!-- 可验证事实卡 -->
  <section id="evidence-card" class="reveal evidence-card-section">
    <div class="section-head">
      <span class="section-kicker">EVIDENCE CARD</span>
      <h2 class="section-title">{{ t('about.evidence_title') }}</h2>
    </div>
    <div class="evidence-card glass-card">
      <div class="evidence-card-head">
        <div>
          <span class="evidence-card-label">FRESHEYE / PROJECT SNAPSHOT</span>
          <h3>{{ t('about.evidence_heading') }}</h3>
        </div>
        <a class="evidence-card-link" href="#model-card">{{ t('about.evidence_link') }} <span aria-hidden="true">→</span></a>
      </div>
      <div class="evidence-stat-grid" role="list" :aria-label="t('about.evidence_title')">
        <div v-for="stat in evidenceStats" :key="stat.label" class="evidence-stat" :class="{ 'evidence-stat-accent': stat.accent }" role="listitem">
          <strong>{{ stat.value }}</strong><span>{{ stat.label }}</span>
        </div>
      </div>
      <div class="evidence-chip-list" :aria-label="t('about.capabilities')">
        <span v-for="capability in tm<string[]>('about.capability_items')" :key="capability" class="evidence-chip">{{ capability }}</span>
      </div>
      <p class="evidence-note">{{ t('about.evidence_note') }}</p>
    </div>
  </section>

  <!-- 技术架构 -->
  <section id="project-architecture" class="reveal">
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

  <!-- 三类用户 -->
  <section id="users" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.users_title') }}</h2></div>
    <div class="users-grid">
      <div v-for="card in users" :key="card.title" class="user-card">
        <div class="user-icon" aria-hidden="true">{{ card.icon }}</div>
        <h3 class="user-title">{{ card.title }}</h3>
        <p class="user-text">{{ card.text }}</p>
      </div>
    </div>
  </section>

  <!-- 为什么选择鱼眼 -->
  <section id="why-fish-eye" class="reveal">
    <div class="section-head">
      <span class="section-kicker">WHY FISH EYE</span>
      <h2 class="section-title">{{ t('about.why_eye_title') }}</h2>
    </div>
    <p class="intro-sub">{{ t('about.why_eye_intro') }}</p>
    <div class="users-grid">
      <div v-for="card in whyEye" :key="card.title" class="user-card">
        <div class="user-icon" aria-hidden="true">{{ card.icon }}</div>
        <h3 class="user-title">{{ card.title }}</h3>
        <p class="user-text">{{ card.text }}</p>
      </div>
    </div>
  </section>

  <!-- 痛点 vs 解法 -->
  <section id="pain-points" class="reveal">
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
  <section id="comparison" class="reveal">
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

  <!-- Model Card：把验证范围与能力边界放在模型表现之后 -->
  <section id="model-card" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.model_card_title') }}</h2></div>
    <div class="model-card-public glass-card">
      <div class="model-card-grid">
        <div v-for="card in modelCard" :key="card.title" class="model-card-item">
          <strong>{{ card.title }}</strong><span>{{ card.text }}</span>
        </div>
      </div>
      <p class="model-card-disclaimer">{{ t('about.model_card_disclaimer') }}</p>
    </div>
  </section>

  <!-- 模型架构与可解释性 -->
  <section id="model-arch" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.models_title') }}</h2></div>
    <p class="intro-sub">{{ t('about.models_intro') }}</p>
    <div class="model-flow">
      <div class="model-flow-node"><span class="model-flow-icon">📷</span><span class="model-flow-label">{{ t('about.flow_input') }}<br /><small>224×224</small></span></div>
      <div class="model-flow-arrow" aria-hidden="true">→</div>
      <div class="model-flow-node model-flow-core"><span class="model-flow-icon">🧠</span><span class="model-flow-label">EfficientNet-B0<br /><small>{{ t('about.flow_backbone') }}</small></span></div>
      <div class="model-flow-arrow" aria-hidden="true">→</div>
      <div class="model-flow-node model-flow-core"><span class="model-flow-icon">🎯</span><span class="model-flow-label">{{ t('about.flow_attention') }}<br /><small>{{ t('about.flow_attention_sub') }}</small></span></div>
      <div class="model-flow-arrow" aria-hidden="true">→</div>
      <div class="model-flow-node"><span class="model-flow-icon">📊</span><span class="model-flow-label">{{ t('about.flow_classifier') }}<br /><small>3 {{ t('about.flow_classes') }}</small></span></div>
      <div class="model-flow-arrow model-flow-arrow-branch" aria-hidden="true">→</div>
      <div class="model-flow-node model-flow-aux"><span class="model-flow-icon">🔥</span><span class="model-flow-label">Grad-CAM<br /><small>{{ t('about.flow_explain') }}</small></span></div>
    </div>
    <div class="model-card-grid">
      <div class="model-card glass-card">
        <h3>{{ t('about.v1_title') }}</h3>
        <div v-for="card in v1Cards" :key="card.title" class="model-feature"><strong>{{ card.icon }} {{ card.title }}</strong><p>{{ card.text }}</p></div>
      </div>
      <div class="model-card glass-card">
        <h3>{{ t('about.v2_title') }}</h3>
        <div v-for="card in v2Cards" :key="card.title" class="model-feature"><strong>{{ card.icon }} {{ card.title }}</strong><p>{{ card.text }}</p></div>
      </div>
    </div>
    <div class="model-detail-grid">
      <details class="model-detail glass-card">
        <summary>{{ t('about.v1_detail_title') }}</summary>
        <div v-for="card in v1Details" :key="card.title" class="model-detail-item">
          <strong>{{ card.icon }} {{ card.title }}</strong><p>{{ card.text }}</p>
        </div>
      </details>
      <details class="model-detail glass-card">
        <summary>{{ t('about.v2_detail_title') }}</summary>
        <div v-for="card in v2Details" :key="card.title" class="model-detail-item">
          <strong>{{ card.icon }} {{ card.title }}</strong><p>{{ card.text }}</p>
        </div>
      </details>
    </div>
  </section>

  <!-- 检测流程与创作历程 -->
  <section id="workflow" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.workflow_title') }}</h2></div>
    <p class="intro-sub">{{ t('about.workflow_intro') }}</p>
    <div class="workflow-strip">
      <span v-for="(step, i) in tm<string[]>('about.workflow_steps')" :key="step" class="workflow-step"><b>{{ i + 1 }}</b>{{ step }}</span>
    </div>
    <h3 class="section-subtitle workflow-table-title">{{ t('about.workflow_table_title') }}</h3>
    <div class="table-wrap">
      <table class="compare-table workflow-table">
        <thead><tr><th>#</th><th>{{ t('about.workflow_table_node') }}</th><th>{{ t('about.workflow_table_type') }}</th><th>{{ t('about.workflow_table_duty') }}</th></tr></thead>
        <tbody>
          <tr v-for="row in workflowRows" :key="row.id">
            <td>{{ row.id }}</td><td>{{ row.node }}</td><td>{{ row.type }}</td><td>{{ row.duty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
  <section id="journey" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.journey_title') }}</h2></div>
    <div class="journey-list">
      <div v-for="card in journey" :key="card.title" class="journey-item"><span class="journey-icon" aria-hidden="true">{{ card.icon }}</span><div><h3>{{ card.title }}</h3><p>{{ card.text }}</p></div></div>
    </div>
  </section>

  <!-- TRAE 协作方式 -->
  <section id="trae-workflow" class="reveal">
    <div class="section-head">
      <span class="section-kicker">BUILT WITH TRAE</span>
      <h2 class="section-title">{{ t('about.trae_title') }}</h2>
    </div>
    <p class="intro-sub">{{ t('about.trae_intro') }}</p>
    <div class="trae-workflow-grid">
      <div v-for="card in traeWorkflow" :key="card.title" class="trae-workflow-card">
        <span class="trae-workflow-index">{{ card.icon }}</span>
        <h3>{{ card.title }}</h3>
        <p>{{ card.text }}</p>
      </div>
    </div>
  </section>

  <!-- 社会价值与迭代规划 -->
  <section id="social-value" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.social_title') }}</h2></div>
    <div class="info-grid"><div v-for="card in socialValue" :key="card.title" class="info-card"><div class="info-card-icon">{{ card.icon }}</div><h3>{{ card.title }}</h3><p>{{ card.text }}</p></div></div>
  </section>
  <section id="iteration" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.iteration_title') }}</h2></div>
    <div class="iteration-grid"><div v-for="phase in iteration" :key="phase.title" class="iteration-card"><h3>{{ phase.title }}</h3><ul><li v-for="item in phase.items" :key="item">{{ item }}</li></ul></div></div>
  </section>
  <section id="references" class="reveal">
    <div class="section-head"><h2 class="section-title">{{ t('about.references_title') }}</h2></div>
    <ol class="reference-list"><li v-for="reference in references" :key="reference">{{ reference }}</li></ol>
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
.section-kicker { display: block; margin-bottom: 5px; color: var(--aqua); font-size: 11px; font-weight: 800; letter-spacing: 0.16em; }
.about-toc { margin: 0 0 var(--space-7); padding: 0; overflow: hidden; }
.about-toc summary { padding: 14px 18px; color: var(--foam); cursor: pointer; font-size: 14px; font-weight: 700; list-style: none; }
.about-toc summary::-webkit-details-marker { display: none; }
.about-toc summary::before { content: '＋'; display: inline-block; width: 20px; color: var(--aqua); }
.about-toc[open] summary::before { content: '−'; }
.about-toc nav { display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 0 18px 16px; }
.about-toc a { color: var(--muted); font-size: 12.5px; text-decoration: none; }
.about-toc a:hover { color: var(--aqua); }
.evidence-card-section .section-head { align-items: flex-end; }
.evidence-card { border-color: rgba(39, 208, 196, 0.25); background: linear-gradient(145deg, rgba(15, 86, 102, 0.25), rgba(4, 22, 43, 0.62)); }
.evidence-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.evidence-card-label { color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: 0.14em; }
.evidence-card-head h3 { max-width: 32em; margin: 8px 0 0; color: var(--white); font-size: clamp(19px, 3vw, 26px); line-height: 1.35; }
.evidence-card-link { display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; color: var(--aqua); font-size: 12px; font-weight: 700; text-decoration: none; }
.evidence-card-link:hover { color: var(--foam); }
.evidence-stat-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0; margin-top: var(--space-5); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.evidence-stat { display: flex; min-height: 86px; flex-direction: column; justify-content: center; gap: 5px; padding: 12px 14px; border-right: 1px solid var(--border); }
.evidence-stat:last-child { border-right: 0; }
.evidence-stat strong { color: var(--foam); font-family: var(--font-display); font-size: 18px; font-variant-numeric: tabular-nums; }
.evidence-stat span { color: var(--muted); font-size: 11px; line-height: 1.45; }
.evidence-stat-accent strong { color: var(--aqua); }
.evidence-chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: var(--space-4); }
.evidence-chip { padding: 6px 10px; border: 1px solid rgba(39, 208, 196, 0.25); border-radius: 999px; color: var(--aqua); background: rgba(39, 208, 196, 0.08); font-size: 11px; }
.evidence-note { margin: var(--space-4) 0 0; color: var(--muted); font-size: 12px; line-height: 1.7; }
.model-card-public { border-color: rgba(39, 208, 196, 0.25); }
.model-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; }
.model-card-item { display: flex; flex-direction: column; gap: 6px; padding: 15px 16px; border-top: 1px solid var(--border); }
.model-card-item strong { color: var(--aqua); font-size: 13px; }
.model-card-item span { color: var(--muted); font-size: 12.5px; line-height: 1.7; }
.model-card-disclaimer { margin: var(--space-4) 0 0; padding-top: var(--space-4); border-top: 1px solid var(--border); color: var(--muted); font-size: 12px; line-height: 1.7; }
.model-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5); margin-top: var(--space-5); }
.model-detail { padding: 0; overflow: hidden; }
.model-detail summary { padding: 15px 18px; color: var(--foam); cursor: pointer; font-size: 14px; font-weight: 700; list-style: none; }
.model-detail summary::-webkit-details-marker { display: none; }
.model-detail summary::before { content: '＋'; display: inline-block; width: 20px; color: var(--aqua); }
.model-detail[open] summary::before { content: '−'; }
.model-detail-item { padding: 12px 18px; border-top: 1px solid var(--border); }
.model-detail-item strong { color: var(--foam); font-size: 13px; }
.model-detail-item p { margin: 5px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }
.section-subtitle { margin: var(--space-5) 0 var(--space-3); color: var(--foam); font-size: 16px; }
.workflow-table-title { margin-top: var(--space-6); }
.workflow-table td:first-child { color: var(--aqua); font-family: var(--font-display); }
.trae-workflow-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-4); }
.trae-workflow-card { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
.trae-workflow-index { display: inline-grid; place-items: center; width: 32px; height: 24px; margin-bottom: 10px; border-radius: 6px; color: var(--ink); background: var(--aqua); font-family: var(--font-display); font-size: 11px; font-weight: 800; }
.trae-workflow-card h3 { margin: 0 0 6px; color: var(--white); font-size: 15px; }
.trae-workflow-card p { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }

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

.model-flow { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: var(--space-3); padding: var(--space-5); margin-bottom: var(--space-5); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
.model-flow-node { display: flex; align-items: center; gap: 8px; min-width: 120px; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: rgba(255,255,255,0.03); color: var(--foam); text-align: center; }
.model-flow-core { border-color: rgba(39, 208, 196, 0.45); background: rgba(39, 208, 196, 0.08); }
.model-flow-aux { border-color: rgba(245, 181, 74, 0.4); background: rgba(245, 181, 74, 0.08); }
.model-flow-icon { font-size: 22px; }
.model-flow-label { font-size: 12px; line-height: 1.4; }
.model-flow-label small { color: var(--muted); font-size: 10px; }
.model-flow-arrow { color: var(--aqua); font-size: 18px; }
.model-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5); }
.model-card h3 { margin: 0 0 var(--space-4); color: var(--aqua); font-size: 17px; }
.model-feature { padding: 12px 0; border-top: 1px solid var(--border); }
.model-feature strong { color: var(--foam); font-size: 13px; }
.model-feature p { margin: 6px 0 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }
.workflow-strip { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; }
.workflow-step { display: inline-flex; align-items: center; gap: 8px; padding: 10px 13px; border: 1px solid var(--border); border-radius: 999px; color: var(--foam); background: var(--card); font-size: 12px; }
.workflow-step b { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: rgba(39,208,196,.18); color: var(--aqua); }
.journey-list { display: grid; gap: var(--space-3); }
.journey-item { display: flex; gap: var(--space-4); align-items: flex-start; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
.journey-icon { font-size: 24px; }
.journey-item h3 { margin: 0 0 6px; color: var(--white); font-size: 15px; }
.journey-item p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.75; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); }
.info-card { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
.info-card-icon { font-size: 26px; margin-bottom: 8px; }
.info-card h3 { margin: 0 0 6px; color: var(--white); font-size: 15px; }
.info-card p { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.7; }
.iteration-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
.iteration-card { padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--card); }
.iteration-card h3 { margin: 0 0 10px; color: var(--aqua); font-size: 15px; }
.iteration-card ul { margin: 0; padding-left: 18px; color: var(--muted); font-size: 12.5px; line-height: 1.8; }
.reference-list { margin: 0; padding-left: 22px; color: var(--muted); font-size: 12px; line-height: 1.8; }

@media (max-width: 768px) {
  .evidence-card-head { flex-direction: column; }
  .evidence-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .evidence-stat:nth-child(2n) { border-right: 0; }
  .model-detail-grid, .trae-workflow-grid { grid-template-columns: 1fr; }
  .compare-pain { grid-template-columns: 1fr; }
  .arch-branches { flex-direction: column; }
  .model-card-grid, .iteration-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .model-card-grid { grid-template-columns: 1fr; }
  .evidence-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .evidence-stat { min-height: 72px; padding-inline: 10px; }
  .evidence-stat strong { font-size: 15px; }
  .evidence-stat span { font-size: 10px; }
  .arch-boxes { flex-direction: column; }
  .arch-box { width: 100%; }
}
</style>
