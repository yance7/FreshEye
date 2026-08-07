<script setup lang="ts">
// 鱼种百科视图：页头 + 三级新鲜度分类 + 常见鱼种图鉴占位
import { useI18n } from '@/i18n'

const { t } = useI18n()

// 三级新鲜度分类标准
const levels = [
  {
    icon: '🐟',
    title: '高度新鲜',
    text: '角膜几乎无浑浊，瞳孔清晰明亮，晶体透明。鱼眼饱满凸出，各项指标均处于最佳食用状态。',
    color: 'high'
  },
  {
    icon: '🐠',
    title: '新鲜',
    text: '角膜轻微浑浊，瞳孔可见但略模糊，晶体开始泛白。鱼眼仍具有一定凸出度，符合国标新鲜要求。',
    color: 'mid'
  },
  {
    icon: '🐡',
    title: '不新鲜',
    text: '角膜严重浑浊，瞳孔变形或消失，晶体混浊发白。鱼眼平坦下陷，已不符合国标食用安全要求。',
    color: 'low'
  }
]

// 常见鱼种图鉴
const species = [
  { icon: '🐟', name: '鲫鱼', tag: '淡水', desc: '鱼眼大而凸出，角膜透明度高，新鲜度变化明显。', angle: '正侧面', cook: '清蒸、炖汤' },
  { icon: '🐠', name: '稻花鱼', tag: '淡水', desc: '鱼眼中等大小，瞳孔黑色深沉，浑浊变化较慢。', angle: '正侧面', cook: '红烧、干炸' },
  { icon: '🐟', name: '草鱼', tag: '淡水', desc: '鱼眼较大，角膜厚实，新鲜时眼球饱满凸出。', angle: '45度侧面', cook: '水煮、酸菜鱼' },
  { icon: '🐠', name: '鲤鱼', tag: '淡水', desc: '鱼眼圆形凸出，瞳孔清晰，浑浊时颜色变浅。', angle: '正侧面', cook: '红烧、糖醋' },
  { icon: '🐟', name: '鲈鱼', tag: '海水', desc: '鱼眼明亮有神，角膜清澈，新鲜度保持较好。', angle: '正侧面', cook: '清蒸' },
  { icon: '🐠', name: '带鱼', tag: '海水', desc: '鱼眼较小，角膜薄，浑浊时变化显著。', angle: '正面', cook: '红烧、干煎' }
]
</script>

<template>
  <!-- 页头 -->
  <header class="page-hero reveal">
    <span class="page-hero-eyebrow">{{ t('fish.eyebrow') }}</span>
    <h1 class="page-hero-title">{{ t('fish.title') }}</h1>
    <p class="page-hero-sub">{{ t('fish.subtitle') }}</p>
  </header>

  <!-- 鱼眼新鲜度三级分类标准 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">鱼眼新鲜度三级分类标准</h2>
    </div>
    <p class="intro-sub">基于 GB 2733-2015 国标构建的三级新鲜度判定体系，结合鱼眼感官特征进行分类，是鲜眸识别训练与判断的核心依据。</p>
    <div class="levels-grid">
      <div
        v-for="l in levels"
        :key="l.title"
        class="level-card"
        :class="`level-${l.color}`"
      >
        <div class="level-icon" aria-hidden="true">{{ l.icon }}</div>
        <h3 class="level-title">{{ l.title }}</h3>
        <p class="level-text">{{ l.text }}</p>
      </div>
    </div>
  </section>

  <!-- 常见鱼种图鉴 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">常见鱼种图鉴</h2>
    </div>
    <p class="intro-sub">常见淡水鱼与海水鱼的鱼眼特征、拍摄角度与烹饪建议速查。</p>
    <div class="species-grid">
      <div v-for="s in species" :key="s.name" class="species-card">
        <div class="species-icon" aria-hidden="true">{{ s.icon }}</div>
        <h3 class="species-name">
          {{ s.name }}
          <span class="tag-pill" :class="s.tag === '海水' ? 'tag-sea' : ''">{{ s.tag }}</span>
        </h3>
        <p class="species-desc">{{ s.desc }}</p>
        <p class="species-meta">
          📷 最佳拍摄角度：{{ s.angle }}<br />🍳 推荐烹饪：{{ s.cook }}
        </p>
      </div>
    </div>
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

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-5);
}
.level-card {
  padding: var(--space-5);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  background: var(--card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-align: center;
  transition: transform var(--transition), border-color var(--transition);
}
.level-card:hover { transform: translateY(-4px); }
.level-high { border-color: rgba(16, 185, 129, 0.45); background: rgba(16, 185, 129, 0.07); }
.level-mid { border-color: rgba(217, 119, 6, 0.45); background: rgba(217, 119, 6, 0.07); }
.level-low { border-color: rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.07); }
.level-icon {
  width: 56px; height: 56px;
  margin: 0 auto var(--space-3);
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 28px;
  border: 1px solid var(--border);
}
.level-high .level-icon { background: rgba(16, 185, 129, 0.18); border-color: var(--fresh-high); }
.level-mid .level-icon { background: rgba(217, 119, 6, 0.18); border-color: var(--mid); }
.level-low .level-icon { background: rgba(239, 68, 68, 0.18); border-color: var(--bad); }
.level-high .level-title { color: var(--fresh-high); }
.level-mid .level-title { color: var(--mid); }
.level-low .level-title { color: var(--bad); }
.level-title { font-size: 17px; font-weight: 700; margin: 0 0 var(--space-2); }
.level-text { font-size: 13px; color: var(--muted); line-height: 1.7; margin: 0; }

.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}
.species-card {
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--card);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: transform var(--transition), border-color var(--transition), background var(--transition);
}
.species-card:hover { transform: translateY(-3px); border-color: var(--border-hover); background: var(--card-hover); }
.species-icon { font-size: 30px; margin-bottom: var(--space-2); }
.species-name {
  font-size: 16px; font-weight: 700; color: var(--white);
  margin: 0 0 var(--space-2);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.tag-pill {
  font-size: 11px; font-weight: 600;
  padding: 2px 9px; border-radius: 999px;
  background: rgba(17, 133, 184, 0.18);
  color: var(--sea);
  border: 1px solid rgba(17, 133, 184, 0.35);
}
.tag-pill.tag-sea { background: rgba(39, 208, 196, 0.18); color: var(--aqua); border-color: rgba(39, 208, 196, 0.35); }
.species-desc { font-size: 13px; color: var(--foam); line-height: 1.7; margin: 0 0 var(--space-2); }
.species-meta { font-size: 12px; color: var(--muted); line-height: 1.8; margin: 0; }

@media (max-width: 640px) {
  .levels-grid { grid-template-columns: 1fr; }
}
</style>
