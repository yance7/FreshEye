<script setup lang="ts">
// 关于视图：页头 + 技术架构 + 痛点vs解法 + 方案对比表占位
import { useI18n } from '@/i18n'

const { t } = useI18n()

// 痛点 vs 解法
const pains = [
  '肉眼判别依赖个人经验，新手难以掌握',
  '化学检测成本高、周期长，且破坏样品',
  '现有工具只给结论，不告诉"为什么"与"怎么办"',
  '便携式仪器单价 5000-20000 元，基层摊位难以普及',
  '传统感官评估存在评估者间变异性，结论可能不一致'
]
const solutions = [
  '鱼眼照片一键上传，零成本非破坏式检测',
  'FishFreshNetV1（EfficientNet-B0 + CBAM）准确率 99%+',
  'FishFreshNetV2（ECA + Light CRA）提升至 99.29%',
  'Grad-CAM 热力图解释"为什么"，结构化报告给出"怎么办"',
  '置信度驱动自适应分支，低置信度主动提示重拍'
]

// 方案对比表
const compareRows = [
  { model: 'VGG16', params: '134.27', flops: '15.47', mfed: '98.08%', ffe: '77.40%', highlight: false },
  { model: 'ResNet18', params: '11.18', flops: '1.82', mfed: '98.67%', ffe: '79.36%', highlight: false },
  { model: 'MobileNetV2', params: '2.23', flops: '0.33', mfed: '98.54%', ffe: '79.59%', highlight: false },
  { model: 'EfficientNet-B0', params: '4.01', flops: '0.41', mfed: '98.96%', ffe: '81.64%', highlight: false },
  { model: 'FishFreshNetV1（基线）', params: '4.22', flops: '0.41', mfed: '98.88%', ffe: '81.78%', highlight: true },
  { model: 'FishFreshNetV2（本作品）', params: '4.10', flops: '0.41', mfed: '99.29%', ffe: '81.18%', highlight: true }
]
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
      <h2 class="section-title">技术架构</h2>
    </div>
    <div class="arch-diagram glass-card">
      <div class="arch-layer">
        <div class="arch-layer-title">用户浏览器（GitHub Pages 静态托管）</div>
        <div class="arch-boxes">
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">🏠</span><span>首页<br /><small>检测主页</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">📖</span><span>指南<br /><small>使用指南</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">🐟</span><span>百科<br /><small>鱼种图鉴</small></span></div>
          <div class="arch-box"><span class="arch-box-icon" aria-hidden="true">📋</span><span>关于<br /><small>技术细节</small></span></div>
        </div>
      </div>
      <div class="arch-arrow">↓ HTTPS POST /predict_with_gradcam</div>
      <div class="arch-layer arch-layer-backend">
        <div class="arch-layer-title">HF Spaces 后端（FastAPI + PyTorch）</div>
        <div class="arch-boxes">
          <div class="arch-box arch-box-wide"><span>FishFreshNetV1/V2 推理 → 三类概率分布 + Grad-CAM</span></div>
        </div>
        <div class="arch-branches">
          <div class="arch-branch arch-branch-high">置信度 ≥ 80% → 高置信度直出</div>
          <div class="arch-branch arch-branch-mid">60–80% → 建议结合感官判断</div>
          <div class="arch-branch arch-branch-low">＜60% → 提示重新拍摄</div>
        </div>
      </div>
    </div>
  </section>

  <!-- 痛点 vs 解法 -->
  <section class="reveal">
    <div class="section-head">
      <h2 class="section-title">痛点 vs 解法</h2>
    </div>
    <div class="compare-pain">
      <div class="pain-card pain">
        <div class="pain-card-head">
          <span class="pain-icon" aria-hidden="true">!</span>
          <span>当前痛点</span>
        </div>
        <ul class="pain-list">
          <li v-for="(p, i) in pains" :key="i">{{ p }}</li>
        </ul>
      </div>
      <div class="pain-card solution">
        <div class="pain-card-head">
          <span class="pain-icon" aria-hidden="true">✓</span>
          <span>鲜眸（FreshEye）解法</span>
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
      <h2 class="section-title">方案对比</h2>
    </div>
    <p class="intro-sub">在 MFED（自建数据集）与 FFE（公开数据集）上的全面性能对比</p>
    <div class="table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th>模型</th>
            <th>参数/M</th>
            <th>FLOPs/G</th>
            <th>MFED 准确率</th>
            <th>FFE 准确率</th>
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
      V2 相对 V1 提升 0.41 个百分点（98.88% → 99.29%），以 VGG16 约 3% 的参数量实现更高准确率。
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
