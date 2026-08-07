// 鲜眸 FreshEye · 中文语言包
const zh = {
  nav: { home: '首页', guide: '指南', fish: '百科', about: '关于', source: '开源' },
  home: {
    hero: {
      title: 'AI 鱼眼新鲜度检测',
      subtitle: '上传鱼眼照片，秒级分析水产品新鲜度',
      chip: 'AI 驱动 · 非破坏式新鲜度检测',
      tagline: '一拍知鲜 · 吃得放心',
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
    tips_title: '最佳实践 Tips',
    photo_intro: '好的照片是准确检测的前提。请参考以下正确与错误示例对比，拍摄时遵循正确示例的要求。',
    photo_hint: '把鱼眼对准圆圈中心',
    photo_text: '好的照片是准确检测的前提。请正面拍摄鱼眼，保持光线充足、距离适中（10–30cm）、对焦清晰，拍照前擦干鱼眼表面水分避免反光。避免侧面角度、昏暗环境、距离过远/过近、模糊失焦与反光遮挡。',
    correct_title: '正确示例',
    incorrect_title: '错误示例',
    correct_checks: [
      { title: '正面拍摄鱼眼', text: '镜头正对鱼眼，避免侧角' },
      { title: '光线充足', text: '自然光或白色光源，均匀照亮鱼眼' },
      { title: '距离适中', text: '10–30cm，鱼眼占图片面积 30% 以上' },
      { title: '对焦清晰', text: '点击屏幕对焦鱼眼，确保瞳孔与角膜细节可见' },
      { title: '擦干水分', text: '拍照前擦干鱼眼表面，避免反光' }
    ],
    incorrect_checks: [
      { title: '侧面角度', text: '鱼眼变形，关键特征缺失' },
      { title: '光线不足', text: '昏暗环境导致噪点高、细节丢失' },
      { title: '距离过远或过近', text: '鱼眼太小或失焦模糊' },
      { title: '模糊失焦', text: '手抖或未对焦，瞳孔边界不清' },
      { title: '反光遮挡', text: '强光直射或水珠反光遮盖角膜' }
    ],
    tips: [
      { icon: '💧', title: '擦干水分', text: '拍照前轻轻擦干鱼眼表面，避免水珠反光遮挡角膜特征。' },
      { icon: '☀️', title: '优选光源', text: '选择自然光或白色光源，避免黄色灯光影响颜色判断。' },
      { icon: '🎯', title: '构图占比', text: '确保鱼眼占图片面积 30% 以上，便于提取细节特征。' },
      { icon: '🚫', title: '避免反光', text: '避开直射强光和阴影遮挡，调整角度消除镜面反光。' },
      { icon: '🧹', title: '清理记录', text: '定期清理历史记录释放 localStorage 空间，保持应用流畅。' }
    ],
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
    timeline_title: '鱼眼新鲜度变化参考时序',
    timeline_intro: '常温储存条件下鱼眼外观的典型变化过程（仅供参考，实际新鲜度判定以 GB 2733-2015 国家标准为准）。',
    standard_title: 'GB 2733-2015 国标解读',
    standard_intro: '鲜眸（FreshEye）三级分类体系所参照的国家标准依据。',
    buying_title: '选购建议',
    buying_intro: '日常挑鱼时除了用鲜眸拍照检测，也可结合以下感官经验快速判断。',
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
    ],
    timeline: [
      { icon: '0', color: 'aqua', title: '初始阶段 · 刚捕捞/死亡', text: '角膜完全透明，瞳孔深黑，晶体清晰。鱼眼饱满凸出，各项指标处于最佳水平。' },
      { icon: '1', color: 'aqua', title: '早期阶段', text: '角膜开始轻微变化，瞳孔仍清晰，晶体透明，仍符合国标新鲜要求。' },
      { icon: '2', color: 'green', title: '高度新鲜阶段', text: '角膜轻微浑浊，瞳孔略浅，晶体开始变化，仍属于高度新鲜等级。' },
      { icon: '3', color: 'gold', title: '新鲜阶段', text: '角膜明显浑浊，瞳孔颜色变浅，晶体泛白，建议尽快食用。' },
      { icon: '4', color: 'gold', title: '新鲜临界阶段', text: '角膜浑浊加重，瞳孔模糊，临近国标限值，需谨慎判断。' },
      { icon: '!', color: 'red', title: '不新鲜阶段 · 超出国标限值', text: '角膜严重浑浊，瞳孔变形或消失，鱼眼平坦下陷，不可食用。' }
    ],
    standards: [
      { icon: '📜', title: '标准名称', text: 'GB 2733-2015《食品安全国家标准 鲜、冻动物性水产品》是水产品新鲜度判定的重要强制性标准。' },
      { icon: '🧪', title: '判定标准', text: '国标通过实验室理化检测判定新鲜度，鲜眸聚焦最直观的鱼眼特征，为购买时提供快速参考。' },
      { icon: '👁', title: '感官指标', text: '新鲜鱼眼球饱满突出、角膜透明清亮；不新鲜鱼眼球平坦凹陷、角膜浑浊、肌肉松软。' },
      { icon: '🗂', title: '训练数据', text: '鲜眸基于 4800 余张真实鱼眼照片训练，覆盖 4 种环境场景，并按国家标准标定新鲜度等级。' }
    ],
    buying_tips: [
      { icon: '👀', title: '看鱼眼', text: '优先选择鱼眼饱满凸出、角膜透明的鱼，避免鱼眼平坦下陷、角膜浑浊。' },
      { icon: '🐟', title: '看鱼鳃', text: '鲜红色为佳；暗红或灰白色通常意味着品质较差。' },
      { icon: '👆', title: '摸鱼肉', text: '按压后迅速回弹为新鲜，按痕难恢复或松软无弹性则不新鲜。' },
      { icon: '👃', title: '闻气味', text: '新鲜鱼带有自然气味，出现腥臭味或酸败味则已变质。' },
      { icon: '✨', title: '看体表', text: '鱼鳞完整有光泽、黏液透明为新鲜；体表暗淡发干则不新鲜。' },
      { icon: '📸', title: '善用鲜眸', text: '对准鱼眼正侧面拍摄，避免反光，并结合 AI 结果与感官经验综合判断。' }
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
    ],
    users_title: '面向三类用户',
    users: [
      { icon: '🛒', title: '消费者', text: '菜市场或超市买鱼时拍照即知新鲜度，告别凭手感挑鱼的盲选。' },
      { icon: '🐟', title: '商贩与采购', text: '批量进货验收，历史记录本地留存、方便对账，降低退货纠纷。' },
      { icon: '📋', title: '质检监管', text: '生成含结论、置信度、建议与时间戳的报告，全程可追溯。' }
    ],
    models_title: 'FishFreshNet 模型架构',
    models_intro: '轻量化、可解释的视觉分类框架，围绕鱼眼的圆形结构提取关键特征。',
    flow_input: '鱼眼图像',
    flow_backbone: '特征提取骨干',
    flow_attention: '注意力机制',
    flow_attention_sub: '聚焦关键区域',
    flow_classifier: '分类头',
    flow_classes: '类新鲜度',
    flow_explain: '可解释热力图',
    v1_title: 'FishFreshNetV1 · 基线',
    v1_cards: [
      { icon: '🧠', title: 'EfficientNet-B0', text: '使用 MBConv 与复合缩放，在 4.22M 参数、0.41G FLOPs 下保持高效特征提取。' },
      { icon: '🎯', title: 'CBAM 注意力', text: '通过通道与空间注意力抑制背景干扰，帮助模型聚焦瞳孔和角膜区域。' },
      { icon: '📊', title: '三分类输出', text: '自定义分类头输出高度新鲜、新鲜、不新鲜三类概率，并生成 Grad-CAM 热力图。' }
    ],
    v2_title: 'FishFreshNetV2 · 升级',
    v2_cards: [
      { icon: '⚡', title: 'ECA 通道注意力', text: '用轻量一维卷积替代共享 MLP，降低参数开销并保留局部通道交互。' },
      { icon: '🎯', title: 'Light CRA', text: '利用鱼眼圆形几何先验划分瞳孔、角膜、眼眶三环，强化区域特征。' },
      { icon: '📈', title: '精度提升', text: 'MFED 准确率从 V1 的 98.88% 提升至 99.29%，同时维持轻量化部署。' }
    ],
    workflow_title: '检测流程',
    workflow_intro: '前端图像校验与压缩 → FastAPI 后端 PyTorch 推理 → Grad-CAM 可视化 → 置信度自适应提示。',
    workflow_steps: ['图片上传', '质量校验', '图像预处理', 'API 请求', '模型推理', '报告与建议'],
    journey_title: '创作历程',
    journey: [
      { icon: '💡', title: '灵感诞生', text: '从菜市场买鱼的真实痛点出发，发现鱼眼是反映新鲜度的重要视觉信号。' },
      { icon: '🔬', title: '独立研究', text: '设计 EfficientNet-B0 + CBAM 架构，构建 MFED 数据集并按 GB 2733-2015 标注。' },
      { icon: '⚙️', title: '后端开发', text: 'FastAPI + PyTorch 推理服务部署至 Hugging Face Spaces，支持 V1/V2 与 Grad-CAM。' },
      { icon: '🎨', title: '前端迭代', text: '完成深海动态主题、4-Tab 报告、移动端适配与 PWA 离线缓存。' },
      { icon: '🚀', title: '产品化打磨', text: '从能用的 Demo 进化为包含历史记录、低置信度提示和可解释报告的产品。' }
    ],
    social_title: '社会价值',
    social_value: [
      { icon: '👥', title: '扩大可及性', text: '一部手机与浏览器即可获得低成本、非破坏式的初步判别能力。' },
      { icon: '🛡️', title: '填平经验壁垒', text: '让普通消费者也能参考老师傅级别的鱼眼视觉信号。' },
      { icon: '🏥', title: '降低食安风险', text: '在购买与食用前识别问题产品，帮助减少食品安全隐患。' },
      { icon: '🔄', title: '场景可迁移', text: 'CPU 推理与标准化部署方案可迁移至肉类、果蔬和其他水产品场景。' }
    ],
    iteration_title: '迭代规划',
    iteration: [
      { title: '短期（1–3 个月）', items: ['量化推理置信度', '受控混淆因子训练', '数据集扩充到 1 万+ 张', '批量分析功能'] },
      { title: '中期（3–12 个月）', items: ['鱼种识别与烹饪建议', '农贸市场监管对接', 'ONNX 离线 SDK', '微信小程序'] },
      { title: '长期（1 年以上）', items: ['实时场景验证', 'B 端 SaaS 平台', 'G 端监管平台', '图像、气味、质地与温度多模态融合'] }
    ],
    references_title: '参考文献',
    references: [
      'Prasetyo et al. (2022), fish-eye freshness classification with MobileNetV1, Information Processing in Agriculture.',
      'Yildiz et al. (2024), fisheye freshness detection with deep learning, European Food Research and Technology.',
      'Tan & Le (2019), EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks.',
      'Woo et al. (2018), CBAM: Convolutional Block Attention Module.',
      'Selvaraju et al. (2017), Grad-CAM: Visual Explanations from Deep Networks.'
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
