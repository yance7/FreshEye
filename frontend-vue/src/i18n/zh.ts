// 鲜眸 FreshEye · 中文语言包
const zh = {
  nav: { home: '首页', guide: '指南', fish: '百科', about: '关于', source: '开源' },
  home: {
    hero: {
      title: 'AI 鱼眼新鲜度检测',
      subtitle: '上传鱼眼照片，秒级分析水产品新鲜度',
      badge1: '99%+ 准确率',
      badge2: '2秒响应',
      badge3: '3级分类',
      scroll_hint: '下滑开始检测'
    },
    upload: {
      title: '上传鱼眼照片',
      hint: '点击、拖拽或粘贴图片',
      formats: '支持 JPG / PNG / WebP',
      camera: '拍照',
      samples: '示例图片',
      analyze: '开始分析',
      analyzing: '分析中...',
      retry: '重试',
      paste: '粘贴',
      clear: '清除'
    },
    model: { v2: '高精度版', v1: '经典版', label: '识别模式' },
    result: {
      tabs: { overview: '概览', vision: 'AI视觉分析', detail: '详细报告', advice: '处理建议' },
      confidence: '置信度',
      duration: '分析耗时',
      time: '分析时间',
      freshness: '新鲜度等级',
      high: '高度新鲜',
      mid: '新鲜',
      low: '不新鲜',
      distribution: '概率分布',
      original: '原图',
      heatmap: '热力图',
      workflow: '工作流',
      appearance: '鱼眼外观评估',
      trend: '新鲜度趋势预测',
      standard: '标准特征对照',
      storage: '储存建议',
      consumption: '食用建议',
      processing: '处理建议',
      safety: '安全提示',
      best: '最佳实践',
      analyzing: '分析中',
      report_title: '分析报告',
      compare_title: '原图 vs Grad-CAM 热力图',
      compare_hint: '拖动滑块对比原图与热力图，红色区域为 AI 关注的关键特征。',
      no_heatmap: '暂无热力图数据'
    },
    history: {
      title: '历史记录',
      search: '搜索记录...',
      filter_all: '全部',
      filter_high: '高度新鲜',
      filter_mid: '新鲜',
      filter_low: '不新鲜',
      filter_fav: '收藏',
      clear: '清空全部',
      empty: '暂无历史记录'
    },
    confidence_warn: {
      high: '分析结果可信',
      mid: '结果仅供参考，建议重新拍摄',
      low: '置信度过低，请重新拍摄清晰照片'
    },
    errors: {
      timeout: '请求超时，请重试',
      network: '网络错误，请检查连接',
      server: 'AI服务暂时不可用',
      format: '图片格式不支持',
      size: '图片过大'
    },
    export: '导出PDF报告',
    lang_switch: 'EN',
    guide_modal: {
      title: '欢迎使用鲜眸',
      text: '上传一张鱼眼照片，AI 会自动分析新鲜度并生成可解释热力图。支持拖拽、粘贴与拍照。',
      button: '开始使用'
    },
    low_conf_modal: {
      text: '建议重新拍摄：正面、清晰、光线充足、对焦准确。',
      button: '我知道了'
    },
    rel_time: { now: '刚刚', min_ago: '分钟前', hr_ago: '小时前', day_ago: '天前' },
    workflow_steps: {
      preprocess: '图像预处理',
      extract: '特征提取',
      classify: '分类推理',
      gradcam: 'Grad-CAM 可视化'
    },
    detail: {
      appearance_items: {
        cornea: '角膜状态',
        pupil: '瞳孔清晰度',
        lens: '晶状体透明度',
        tissue: '眼周组织'
      },
      appearance_high: '瞳孔明亮清澈，角膜透明有光泽，晶状体通透，眼周组织饱满有弹性。',
      appearance_mid: '角膜略有浑浊，瞳孔仍可辨认，光泽度下降，眼周组织弹性减弱。',
      appearance_low: '角膜严重浑浊发白，瞳孔模糊不可辨，组织松软塌陷，可能出现血丝。',
      trend_current: '当前等级',
      trend_confidence: '置信度',
      shelf_high: '3-5 天保鲜期',
      shelf_mid: '1-2 天内食用',
      shelf_low: '建议立即处理',
      trend_stable: '新鲜度稳定',
      trend_declining: '新鲜度下降中',
      trend_desc: '基于鱼眼特征综合判断，新鲜度随时间推移持续下降。结合储存温度与处理方式，可估算剩余保鲜窗口。',
      standard_high: '高度新鲜：清澈明亮',
      standard_mid: '新鲜：轻微浑浊',
      standard_low: '不新鲜：浑浊发白',
      standard_ref: '参照水产品鲜度感官标准',
      standard_desc: '本判定参照水产品鲜度感官评价标准，结合 AI 模型在 FishFreshNet 数据集上的训练经验，给出综合分级。'
    },
    advice: {
      storage_high: '0-4°C 冰箱冷藏，覆盖保鲜膜，避免与其他食材串味。可保鲜 3-5 天。',
      storage_mid: '0-4°C 冷藏，1-2 天内食用完毕，避免延长储存。',
      storage_low: '不建议储存，应立即处理或丢弃，避免污染其他食材。',
      consumption_bad: '不建议食用，可能引发肠胃不适或食物中毒。',
      consumption_ok: '充分加热至 70°C 以上，避免生食。',
      processing: '处理前清洗双手与器具，去除鱼鳃与内脏，流水冲洗。生熟分开避免交叉污染。',
      safety_bad: '不新鲜水产品可能含组胺与致病菌，食用风险高，建议丢弃。',
      safety_ok: '如有异味、黏液或变色应停止食用。过敏人群慎食。',
      best: '购买后尽快处理；拍摄时正面、清晰、光线充足，可提高 AI 判断准确率。'
    },
    pdf: {
      title: '鲜眸检测报告',
      h1: '鲜眸 · 鱼眼新鲜度检测报告',
      time: '分析时间',
      duration: '耗时',
      model: '模型',
      footer: '本报告由 AI 模型生成，仅供参考',
      popup_error: '请允许弹窗以导出 PDF'
    }
  },
  guide: {
    eyebrow: '使用指南',
    title: '三步get鲜眸',
    subtitle: '从拍照到看懂结果，一分钟掌握鱼眼新鲜度智能评估。',
    steps_title: '三步使用流程',
    photo_title: '拍照教程',
    faq_title: '常见问题 FAQ',
    photo_text: '好的照片是准确检测的前提。请正面拍摄鱼眼，保持光线充足、距离适中（10–30cm）、对焦清晰，拍照前擦干鱼眼表面水分避免反光。避免侧面角度、昏暗环境、距离过远/过近、模糊失焦与反光遮挡。',
    steps: [
      { num: '1', icon: '📷', title: '上传鱼眼照片', text: '支持点击上传、拖拽、剪贴板粘贴三种方式，移动端还可直接调用相机拍照。JPG/PNG/WebP 格式，最大 25MB。' },
      { num: '2', icon: '⚡', title: 'AI 秒级分析', text: 'AI 分析鱼眼特征，给出高度新鲜 / 新鲜 / 不新鲜 三种结果，并同步生成可解释热力图展示判断依据。' },
      { num: '3', icon: '📊', title: '查看分析报告', text: '4-Tab 报告自由切换：概览（新鲜度等级 + 置信度）、AI 视觉（热力图对比）、详细报告、处理建议。' }
    ],
    faqs: [
      { q: '支持哪些图片格式？', a: '支持 JPG / PNG / WebP 三种常见图片格式，单张图片最大 25MB。建议使用原图上传，避免过度压缩导致鱼眼细节丢失。' },
      { q: '分析需要多长时间？', a: '通常 3–10 秒即可完成分析。首次使用可能需要 20–30 秒唤醒 AI 服务（Hugging Face Spaces 冷启动），后续检测会显著加快。' },
      { q: '置信度低怎么办？', a: '当置信度低于 60% 时会弹出提示。建议重新拍摄：确保鱼眼清晰可见、光线充足、正面拍摄、对焦准确。若多次重拍置信度仍低，可能为少见鱼种或质量边界样本，建议结合人工判断。' },
      { q: 'AI 服务未运行怎么办？', a: '当 AI 服务未启动或网络不可达时，分析会失败并明确提示"AI 服务未运行"。此时不会生成任何模拟结果，请等待服务启动后重试。历史记录仍可查看。' }
    ]
  },
  fish: {
    eyebrow: '鱼种百科',
    title: '常见水产品鱼眼图鉴',
    subtitle: '不同鱼种的眼部特征各异，了解它们有助于更准确地判断新鲜度。',
    levels_title: '鱼眼新鲜度三级分类标准',
    levels_intro: '基于 GB 2733-2015 国标构建的三级新鲜度判定体系，结合鱼眼感官特征进行分类，是鲜眸识别训练与判断的核心依据。',
    species_title: '常见鱼种图鉴',
    species_intro: '常见淡水鱼与海水鱼的鱼眼特征、拍摄角度与烹饪建议速查。',
    best_angle: '最佳拍摄角度',
    recommended_cook: '推荐烹饪',
    levels: [
      { icon: '🐟', title: '高度新鲜', text: '角膜几乎无浑浊，瞳孔清晰明亮，晶体透明。鱼眼饱满凸出，各项指标均处于最佳食用状态。', color: 'high' },
      { icon: '🐠', title: '新鲜', text: '角膜轻微浑浊，瞳孔可见但略模糊，晶体开始泛白。鱼眼仍具有一定凸出度，符合国标新鲜要求。', color: 'mid' },
      { icon: '🐡', title: '不新鲜', text: '角膜严重浑浊，瞳孔变形或消失，晶体混浊发白。鱼眼平坦下陷，已不符合国标食用安全要求。', color: 'low' }
    ],
    species: [
      { icon: '🐟', name: '鲫鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼大而凸出，角膜透明度高，新鲜度变化明显。', angle: '正侧面', cook: '清蒸、炖汤' },
      { icon: '🐠', name: '稻花鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼中等大小，瞳孔黑色深沉，浑浊变化较慢。', angle: '正侧面', cook: '红烧、干炸' },
      { icon: '🐟', name: '草鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼较大，角膜厚实，新鲜时眼球饱满凸出。', angle: '45度侧面', cook: '水煮、酸菜鱼' },
      { icon: '🐠', name: '鲤鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼圆形凸出，瞳孔清晰，浑浊时颜色变浅。', angle: '正侧面', cook: '红烧、糖醋' },
      { icon: '🐟', name: '鲈鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼明亮有神，角膜清澈，新鲜度保持较好。', angle: '正侧面', cook: '清蒸' },
      { icon: '🐠', name: '带鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼较小，角膜薄，浑浊时变化显著。', angle: '正面', cook: '红烧、干煎' }
    ]
  },
  about: {
    eyebrow: '关于鲜眸',
    title: '技术细节与创作历程',
    subtitle: 'FishFreshNetV1/V2 模型架构、Grad-CAM 可解释性、创作历程与社会价值。',
    arch_title: '技术架构',
    pain_title: '痛点 vs 解法',
    compare_title: '方案对比',
    arch_layer_frontend: '用户浏览器（GitHub Pages 静态托管）',
    arch_layer_backend: 'HF Spaces 后端（FastAPI + PyTorch）',
    arch_boxes: {
      home: '首页',
      home_sub: '检测主页',
      guide: '指南',
      guide_sub: '使用指南',
      fish: '百科',
      fish_sub: '鱼种图鉴',
      about: '关于',
      about_sub: '技术细节'
    },
    arch_inference: 'FishFreshNetV1/V2 推理 → 三类概率分布 + Grad-CAM',
    arch_branch_high: '置信度 ≥ 80% → 高置信度直出',
    arch_branch_mid: '60–80% → 建议结合感官判断',
    arch_branch_low: '＜60% → 提示重新拍摄',
    pain_head: '当前痛点',
    solution_head: '鲜眸（FreshEye）解法',
    pains: [
      '肉眼判别依赖个人经验，新手难以掌握',
      '化学检测成本高、周期长，且破坏样品',
      '现有工具只给结论，不告诉"为什么"与"怎么办"',
      '便携式仪器单价 5000-20000 元，基层摊位难以普及',
      '传统感官评估存在评估者间变异性，结论可能不一致'
    ],
    solutions: [
      '鱼眼照片一键上传，零成本非破坏式检测',
      'FishFreshNetV1（EfficientNet-B0 + CBAM）准确率 99%+',
      'FishFreshNetV2（ECA + Light CRA）提升至 99.29%',
      'Grad-CAM 热力图解释"为什么"，结构化报告给出"怎么办"',
      '置信度驱动自适应分支，低置信度主动提示重拍'
    ],
    compare_intro: '在 MFED（自建数据集）与 FFE（公开数据集）上的全面性能对比',
    compare_footer: 'V2 相对 V1 提升 0.41 个百分点（98.88% → 99.29%），以 VGG16 约 3% 的参数量实现更高准确率。',
    table_headers: { model: '模型', params: '参数/M', flops: 'FLOPs/G', mfed: 'MFED 准确率', ffe: 'FFE 准确率' },
    compare_rows: [
      { model: 'VGG16', params: '134.27', flops: '15.47', mfed: '98.08%', ffe: '77.40%', highlight: false },
      { model: 'ResNet18', params: '11.18', flops: '1.82', mfed: '98.67%', ffe: '79.36%', highlight: false },
      { model: 'MobileNetV2', params: '2.23', flops: '0.33', mfed: '98.54%', ffe: '79.59%', highlight: false },
      { model: 'EfficientNet-B0', params: '4.01', flops: '0.41', mfed: '98.96%', ffe: '81.64%', highlight: false },
      { model: 'FishFreshNetV1（基线）', params: '4.22', flops: '0.41', mfed: '98.88%', ffe: '81.78%', highlight: true },
      { model: 'FishFreshNetV2（本作品）', params: '4.10', flops: '0.41', mfed: '99.29%', ffe: '81.18%', highlight: true }
    ]
  },
  notfound: {
    code: '404',
    title: '页面潜入深海',
    desc: '你访问的页面不存在，或已被洋流带走。',
    home: '回到首页'
  },
  footer: {
    desc: '上传鱼眼照片，AI 秒级分析水产品新鲜度。轻量化模型 + Grad-CAM 可解释热力图，让每一次判断都有据可依。',
    nav_title: '快速导航',
    stack_title: '技术栈',
    nav_home: '首页 · 开始检测',
    nav_guide: '使用指南',
    nav_fish: '鱼种百科',
    nav_about: '技术细节',
    nav_source: '开源代码 ↗',
    competition1: '🏆 TRAE AI 创造力大赛',
    competition2: '🏷 社会服务赛道',
    competition3: '👤 参赛者：祈雨柒',
    copy: '鲜眸 · FreshEye © 2026 · 一拍知鲜，吃得放心'
  },
  common: { back_top: '回到顶部', skip: '跳到主内容' }
}

export default zh
