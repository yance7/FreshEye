<script setup lang="ts">
// 使用指南视图：页头 + 三步流程 + 拍照教程占位 + FAQ 占位
// 完整内容将在后续迭代中按需补充，当前保证结构与样式一致
import { ref } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

// 三步使用流程数据
const steps = [
  {
    num: '1',
    icon: '📷',
    title: '上传鱼眼照片',
    text: '支持点击上传、拖拽、剪贴板粘贴三种方式，移动端还可直接调用相机拍照。JPG/PNG/WebP 格式，最大 25MB。'
  },
  {
    num: '2',
    icon: '⚡',
    title: 'AI 秒级分析',
    text: 'AI 分析鱼眼特征，给出高度新鲜 / 新鲜 / 不新鲜 三种结果，并同步生成可解释热力图展示判断依据。'
  },
  {
    num: '3',
    icon: '📊',
    title: '查看分析报告',
    text: '4-Tab 报告自由切换：概览（新鲜度等级 + 置信度）、AI 视觉（热力图对比）、详细报告、处理建议。'
  }
]

// FAQ 折叠面板状态
const faqs = ref([
  {
    q: '支持哪些图片格式？',
    a: '支持 JPG / PNG / WebP 三种常见图片格式，单张图片最大 25MB。建议使用原图上传，避免过度压缩导致鱼眼细节丢失。',
    open: true
  },
  {
    q: '分析需要多长时间？',
    a: '通常 3–10 秒即可完成分析。首次使用可能需要 20–30 秒唤醒 AI 服务（Hugging Face Spaces 冷启动），后续检测会显著加快。',
    open: false
  },
  {
    q: '置信度低怎么办？',
    a: '当置信度低于 60% 时会弹出提示。建议重新拍摄：确保鱼眼清晰可见、光线充足、正面拍摄、对焦准确。若多次重拍置信度仍低，可能为少见鱼种或质量边界样本，建议结合人工判断。',
    open: false
  },
  {
    q: 'AI 服务未运行怎么办？',
    a: '当 AI 服务未启动或网络不可达时，分析会失败并明确提示"AI 服务未运行"。此时不会生成任何模拟结果，请等待服务启动后重试。历史记录仍可查看。',
    open: false
  }
])

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
      <h2 class="section-title">三步使用流程</h2>
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

  <!-- 拍照教程占位 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">拍照教程</h2>
    </div>
    <div class="glass-card">
      <p class="upload-meta" style="color: var(--foam); line-height: 1.8;">
        好的照片是准确检测的前提。请正面拍摄鱼眼，保持光线充足、距离适中（10–30cm）、对焦清晰，
        拍照前擦干鱼眼表面水分避免反光。避免侧面角度、昏暗环境、距离过远/过近、模糊失焦与反光遮挡。
      </p>
    </div>
  </section>

  <!-- 常见问题 FAQ -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">常见问题 FAQ</h2>
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
}
</style>
