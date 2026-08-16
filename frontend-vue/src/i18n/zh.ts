// 鲜眸 FreshEye · 中文语言包
const zh = {
  nav: {
    home: '首页', guide: '指南', fish: '百科', about: '关于', source: '开源',
    aria: '主导航', mobile_aria: '移动端导航', brand_aria: '返回鲜眸首页',
    menu_open: '打开导航菜单', menu_close: '关闭导航菜单',
    switch_to_en: '切换到 English', switch_to_zh: '切换到中文', brand_subtitle: '水产品视觉新鲜度参考'
  },
  meta: {
    home: { title: '鲜眸 · FreshEye · 水产品新鲜度智能评估', description: '上传鱼眼照片，获得基于视觉证据的新鲜度参考与 Grad-CAM 热力图。' },
    guide: { title: '使用指南 · 鲜眸 FreshEye', description: '了解如何拍摄、上传和解读鲜眸的鱼眼视觉新鲜度评估结果。' },
    fish: { title: '鱼种百科 · 鲜眸 FreshEye', description: '了解常见水产品鱼眼特征、新鲜度变化参考和选购建议。' },
    about: { title: '关于鲜眸 · FreshEye', description: '了解 FreshEye 的模型架构、Grad-CAM 解释、数据范围和能力边界。' },
    notfound: { title: '页面不存在 · 鲜眸 FreshEye', description: '你访问的页面不存在，返回 FreshEye 首页继续浏览。' }
  },
  home: {
    hero: {
      title: '看一眼鱼眼，判断新鲜度',
      subtitle: '从鱼眼清澈度、瞳孔轮廓与光泽等视觉特征出发，给出新鲜度等级、置信度和可解释热力图。结果仅供参考，不能替代法定食品检验。',
      chip: '鲜眸 · FreshEye',
      tagline: '上传照片，获得 AI 辅助评估',
      badge1: '99.29% MFED 测试',
      badge2: '3 级视觉分类',
      badge3: 'Grad-CAM 可解释',
      start: '开始检测', view_sample: '看一个示例', quick_start: '快速开始',
      evidence_label: '项目验证与能力摘要', evidence_mfed: 'MFED 测试', evidence_classes: '级视觉分类', evidence_explainable: '可解释',
      evidence_mfed_value: '99.29%', evidence_classes_value: '3', evidence_explainable_value: 'Grad-CAM', evidence_link: '查看模型验证范围与限制',
      scroll_hint: '下滑开始检测'
    },
    upload: {
      title: '上传鱼眼照片',
      section_hint: '支持点击 · 拖拽 · 粘贴',
      hint: '点击、拖拽或粘贴图片',
      formats: '支持 JPG / PNG / WebP',
      camera: '拍照',
      samples: '示例图片',
      choose_photo: '选择照片',
      privacy: '照片仅发送至 FreshEye AI 服务用于即时分析；历史记录只保存在当前设备。',
      onboarding: '点击或拖拽鱼眼照片到此处 📸',
      preview_alt: '鱼眼照片预览',
      analyze: '开始分析',
      analyzing: '分析中...',
      retry: '重试',
      paste: '粘贴',
      clear: '清除'
    },
    camera: {
      title: '相机取景器', starting: '正在打开相机…', error: '无法访问相机，请检查浏览器权限。',
      fallback_help: '也可以使用设备文件选择器上传照片。', fallback: '选择图片',
      flip: '切换镜头', capture: '拍摄', close: '关闭取景器', not_ready: '相机尚未准备好', capture_failed: '拍摄失败，请重试'
    },
    model: { v2: '高精度版（推荐）', v1: '经典版', label: '模型版本', advanced: '高级设置', advanced_hint: '默认使用高精度版', note: 'V2 为当前默认推荐版本；V1 仅用于对比与复现实验。' },
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
      compare_desc: '高亮区域 = 模型判断的关键依据，颜色越深表示该区域对新鲜度判断贡献越大。',
      vision_explain: '模型主要关注鱼眼瞳孔与角膜边缘区域，这些区域的清澈度与光泽度是新鲜度的视觉参考。',
      compare_aria: '拖动对比原图与热力图',
      no_heatmap: '暂无热力图数据',
      empty: '上传鱼眼照片后，AI 将在此展示新鲜度分析结果',
      empty_sub: 'AI 完成分析后，这里会显示等级、置信度、热力图和处理建议。',
      result_hint_empty: '上传后将在此展示', result_hint_ready: 'AI 已完成鱼眼特征分析',
      result_kicker: '视觉新鲜度', result_action_label: '现在可以做什么',
      result_action: '请结合鱼鳃、气味与肉质确认，不要仅凭本结果判断食用安全。',
      show_details: '查看 AI 判断依据', show_advice: '处理建议', confidence_model_score: '模型分数', metrics_summary: '查看 AI 依据与完整指标',
      warning_mid: 'AI 判断把握一般，建议在光线充足处重新拍摄，或结合鱼鳃、气味与肉质综合判断。',
      warning_low: 'AI 对这张图片的判断不够确定。请确认鱼眼清晰、正面且光线充足；低置信度不等于图片不是鱼眼。',
      close_warning: '关闭警告'
    },
    prediction: {
      high: {
        appearance: '鱼眼清澈明亮，角膜透明，瞳孔清晰，表面有自然光泽。',
        action: '建议结合鱼鳃、气味与肉质确认，并尽快处理；实际可保存时间取决于储存条件。',
        trend: '视觉特征接近高度新鲜样本。实际可保存时间高度依赖储存温度、鱼种与处理方式，本结果不作为保质期或食品安全证明。',
        knowledge: '✅ 视觉特征对照：角膜透明、瞳孔清晰、表面有自然光泽。当前样本接近高度新鲜样本。'
      },
      mid: {
        appearance: '鱼眼基本清澈，角膜略有浑浊，瞳孔仍可辨认，表面光泽减弱。',
        action: '结合鱼鳃、气味与肉质确认后尽快处理；本结果不构成保质期或食品安全保证。',
        trend: '视觉特征处于中等新鲜度范围。建议尽快处理；实际可保存时间高度依赖储存温度、鱼种与处理方式。',
        knowledge: '✅ 视觉特征对照：角膜略浑浊、瞳孔尚可辨认。当前样本与中等新鲜度特征匹配。'
      },
      low: {
        appearance: '鱼眼浑浊，角膜不透明，瞳孔模糊，表面光泽明显减弱。',
        action: '视觉特征显示明显不新鲜，不要仅凭本结果判断食用安全；如有异味或组织异常，避免食用。',
        trend: '视觉特征显示明显不新鲜，建议避免食用；本结果仍不能替代对微生物、毒素、污染物等项目的检验。',
        knowledge: '✅ 视觉特征对照：角膜浑浊、瞳孔模糊、表面失去光泽。当前样本与不新鲜特征匹配。'
      },
      unknown: {
        appearance: '暂无鱼眼外观描述。',
        action: '先重新拍摄清晰鱼眼特写；如果仍不确定，请结合鱼鳃、气味与肉质判断。',
        trend: '暂无法形成视觉新鲜度趋势，请重新拍摄清晰鱼眼特写。',
        knowledge: '暂无标准特征对照数据。'
      }
    },
    recommendation: {
      base: {
        storage: ['0–4°C 冷藏保存', '避免反复解冻', '实际可保存时间取决于鱼种与处理方式'],
        consumption: ['尽快食用获得最佳口感', '清蒸或刺身为优选', '搭配柠檬汁去腥提鲜'],
        handling: ['从冰箱取出后直接处理', '用利刀去除鱼鳞', '清理内脏时保持鱼眼完整'],
        safety: ['鱼眼清澈，仅代表视觉特征较好', '注意检查鳃部是否鲜红', '食用前确认无异味'],
        best: ['购买后 2 小时内处理最佳', '处理前后勤洗手', '使用专用砧板避免交叉污染']
      },
      mid: {
        storage: ['0–4°C 冷藏', '如需长期保存请冷冻', '建议 12 小时内食用'],
        consumption: ['建议尽快处理并充分加热', '推荐红烧或煎炸', '实际食用安排取决于储存条件'],
        handling: ['解冻后在冷水中冲洗', '去除鱼鳃和内脏', '切块烹饪更易入味'],
        safety: ['鱼眼视觉特征一般，不能单独证明安全', '注意观察是否有异味', '烹饪时间适当延长'],
        best: ['尽快处理不宜久放', '冷冻保存前用保鲜膜包裹', '解冻后不要再次冷冻']
      },
      low: {
        storage: ['不建议继续储存', '如必须保存请深度冷冻', '尽快处理或丢弃'],
        consumption: ['不建议仅凭本结果决定食用', '如有异味或组织异常应避免食用', '必要时咨询专业检验人员'],
        handling: ['佩戴手套处理', '避免接触其他食材', '处理工具需彻底消毒'],
        safety: ['⚠ 鱼眼浑浊，请谨慎对待', '如有异味或异常组织状态应避免食用', '本结果不替代食品安全检测'],
        best: ['购买时注意辨别新鲜度', '选择信誉良好的商家', '保留购买凭证以便追溯']
      }
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
      unavailable: '模型服务暂时不可用',
      rate_limit: '请求过于频繁，请稍后再试',
      format: '图片格式不支持',
      size: '图片过大'
    },
    export: '导出 PDF 报告',
    lang_switch: 'EN',
    guide_modal: {
      title: '欢迎使用鲜眸',
      text: '上传一张鱼眼照片，AI 会自动分析新鲜度并生成可解释热力图。支持拖拽、粘贴与拍照。',
      button: '开始使用'
    },
    low_conf_modal: {
      title: 'AI 对这张图片的判断不够确定',
      text: '当前模型分数为 {{confidence}}%。低分可能来自模糊、反光、边界样本、未覆盖鱼种或模型判断困难，并不等于图片不是鱼眼。',
      advice: '建议重新拍摄清晰的鱼眼特写；若仍然偏低，请结合鱼鳃、气味与肉质判断。',
      retry: '📸 重新拍摄', view_anyway: '仍要查看结果',
      button: '我知道了'
    },
    scan: { connecting: '正在连接 AI 服务', starting: '服务已连接，准备分析', analyzing: '正在分析鱼眼特征', heatmap: '正在生成热力图', done: '分析完成' },
    status: { checking: '正在检查 AI 服务', online: 'AI 服务在线', offline: 'AI 服务暂时离线' },
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
      trend_note: '实际可保存时间取决于储存条件；本结果不作为保质期或食品安全证明。',
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
      evidence: 'AI 依据',
      trend: '视觉趋势',
      advice: '处理建议',
      limitation: '能力边界',
      limitation_text: '本报告仅提供基于鱼眼图像的视觉新鲜度参考，不替代法定食品检验、质量合格证明、保质期预测或食用安全判断。',
      footer: '本报告由 AI 模型生成，仅供参考',
      print: '打印 / 存为 PDF',
      download: '下载报告 HTML',
      close: '关闭',
      no_image: '暂无可用图片',
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
    levels_intro: '参考 GB 2733-2015 中动物性水产品感官要求，并结合项目鱼眼视觉特征与实验数据建立三级视觉新鲜度分类。本页内容仅用于理解视觉特征，不替代完整食品安全检验。',
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
      { icon: '🐟', title: '高度新鲜', text: '角膜几乎无浑浊，瞳孔清晰明亮，晶体透明。鱼眼饱满凸出，视觉特征接近高度新鲜样本。', color: 'high' },
      { icon: '🐠', title: '新鲜', text: '角膜轻微浑浊，瞳孔可见但略模糊，晶体开始泛白。该等级仅描述视觉特征，不单独证明食用安全。', color: 'mid' },
      { icon: '🐡', title: '不新鲜', text: '角膜严重浑浊，瞳孔变形或消失，晶体混浊发白。视觉特征显示明显不新鲜，建议不要仅凭本结果判断食用安全。', color: 'low' }
    ],
    species: [
      { icon: '🐟', name: '鲫鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼大而凸出，角膜透明度高，新鲜度变化明显。', angle: '正侧面', cook: '清蒸、炖汤' },
      { icon: '🐠', name: '稻花鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼中等大小，瞳孔黑色深沉，浑浊变化较慢。', angle: '正侧面', cook: '红烧、干炸' },
      { icon: '🐟', name: '草鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼较大，角膜厚实，新鲜时眼球饱满凸出。', angle: '45度侧面', cook: '水煮、酸菜鱼' },
      { icon: '🐠', name: '鲤鱼', tag: '淡水', tag_en: 'freshwater', desc: '鱼眼圆形凸出，瞳孔清晰，浑浊时颜色变浅。', angle: '正侧面', cook: '红烧、糖醋' },
      { icon: '🐟', name: '鲈鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼明亮有神，角膜清澈，新鲜度保持较好。', angle: '正侧面', cook: '清蒸' },
      { icon: '🐠', name: '带鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼较小但凸出，新鲜时角膜透明带银光。', angle: '正面', cook: '煎炸、红烧' },
      { icon: '🐟', name: '黄花鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼大而圆，新鲜时角膜金黄透亮。', angle: '正侧面', cook: '清蒸、红烧' },
      { icon: '🐠', name: '鳕鱼', tag: '海水', tag_en: 'seawater', desc: '鱼眼中等偏大，新鲜时晶体透明呈球状。', angle: '正侧面', cook: '香煎、烤制' }
    ],
    timeline: [
      { icon: '0', color: 'aqua', title: '初始阶段 · 刚捕捞/死亡', text: '角膜完全透明，瞳孔深黑，晶体清晰。鱼眼饱满凸出，各项指标处于最佳水平。' },
      { icon: '1', color: 'aqua', title: '早期阶段', text: '角膜开始轻微变化，瞳孔仍清晰，晶体透明，仍符合国标新鲜要求。' },
      { icon: '2', color: 'green', title: '高度新鲜阶段', text: '角膜轻微浑浊，瞳孔略浅，晶体开始变化。视觉特征仍接近“高度新鲜”等级，需结合鱼鳃、气味、肉质与储存条件继续判断。' },
      { icon: '3', color: 'gold', title: '新鲜阶段', text: '角膜明显浑浊，瞳孔颜色变浅，晶体泛白。进入“新鲜”等级，建议尽快处理。' },
      { icon: '4', color: 'gold', title: '新鲜临界阶段', text: '角膜浑浊加重，瞳孔模糊，晶体白色加深。视觉特征更接近不新鲜样本，需结合其他感官指标判断。' },
      { icon: '!', color: 'red', title: '不新鲜阶段 · 视觉特征明显异常', text: '角膜严重浑浊，瞳孔变形或消失，晶体完全不透明。建议结合异味、组织状态与来源信息判断，必要时避免食用。' }
    ],
    standards: [
      { icon: '📜', title: '标准名称', text: 'GB 2733-2015《食品安全国家标准 鲜、冻动物性水产品》。标准包含感官、理化、污染物等多类要求；FreshEye 只参考其中与视觉相关的感官维度。' },
      { icon: '🧪', title: '判定标准', text: '完整国标判定不等同于一张鱼眼照片的视觉分类。鲜眸（FreshEye）聚焦鱼眼特征，为购买和复核提供非破坏式辅助参考。' },
      { icon: '👁', title: '感官指标', text: '标准的感官要求涉及状态、色泽、组织和气味等多个维度。鲜眸聚焦其中的鱼眼视觉特征，不能检测病原菌、组胺、毒素、污染物或药物残留。' },
      { icon: '🗂', title: '训练数据', text: 'MFED 约 4800 张照片，覆盖 2 种淡水鱼与 4 种受控环境；三级标签结合储存时间、鱼眼视觉特征与项目实验数据建立。' }
    ],
    buying_tips: [
      { icon: '👀', title: '看鱼眼', items: ['优先选择鱼眼饱满凸出、角膜透明的鱼', '避免鱼眼平坦下陷、角膜浑浊的鱼'] },
      { icon: '🐟', title: '看鱼鳃', items: ['注意鱼鳃颜色，鲜红色为佳', '暗红 / 灰白色为劣质品，避免购买'] },
      { icon: '👆', title: '摸鱼肉', items: ['按压鱼肉测试弹性，迅速回弹为新鲜', '按痕难恢复或松软无弹性则不新鲜'] },
      { icon: '👃', title: '闻气味', items: ['新鲜鱼带有海水 / 淡水自然气味', '出现腥臭味、酸败味则已变质'] },
      { icon: '✨', title: '看体表', items: ['鱼鳞完整有光泽、黏液透明为新鲜', '鱼鳞脱落、体表暗淡发干则不新鲜'] },
      { icon: '📸', title: '善用鲜眸（FreshEye）', items: ['对准鱼眼正侧面拍摄，避免反光', '结合 AI 检测结果与感官经验综合判断'] }
    ]
  },
  about: {
    eyebrow: '关于鲜眸',
    title: '技术细节与创作历程',
    subtitle: 'FishFreshNetV1/V2 模型架构、Grad-CAM 可解释性、创作历程与社会价值。',
    toc_title: '本页目录',
    toc_items: [
      { id: 'evidence-card', label: '01 评委速览' },
      { id: 'project-architecture', label: '02 项目架构' },
      { id: 'pain-points', label: '03 痛点与解法' },
      { id: 'why-fish-eye', label: '04 为什么选择鱼眼' },
      { id: 'users', label: '05 面向用户' },
      { id: 'comparison', label: '06 模型表现' },
      { id: 'model-card', label: '07 Model Card' },
      { id: 'workflow', label: '08 推理流程' },
      { id: 'journey', label: '09 创作历程' },
      { id: 'social-value', label: '10 社会价值' }
    ],
    evidence_title: '先看可验证的事实',
    evidence_heading: '一个可运行、可解释、边界清晰的视觉辅助评估工具',
    evidence_link: '查看 Model Card',
    capabilities: '已实现能力',
    capability_items: ['✓ 真实 CNN 推理', '✓ Grad-CAM', '✓ 手机相机', '✓ PWA', '✓ 数据集公开'],
    evidence_stats: [
      { value: '约 4,800', label: 'MFED 样本' },
      { value: '2', label: '种已验证淡水鱼' },
      { value: '4', label: '种受控环境' },
      { value: '4.095M', label: 'V2 参数量' },
      { value: '0.414G', label: 'V2 FLOPs' },
      { value: '99.29%', label: 'MFED 测试集', accent: true },
      { value: '81.18%', label: 'FFE 公开数据集', accent: true }
    ],
    evidence_note: '99.29% 与 81.18% 是对应数据集上的验证结果，不代表现实环境中的食品安全准确率；其他鱼种、模糊反光图片与非视觉安全风险仍需额外判断。',
    why_eye_title: '为什么选择鱼眼作为入口？',
    why_eye_intro: '鱼眼是本项目的视觉切入点，不等于对完整食品安全状态的判断。',
    why_eye: [
      { icon: '◌', title: '非破坏', text: '只采集鱼眼图像即可获得视觉参考，不需要切开或消耗样品。' },
      { icon: '◉', title: '特征可观察', text: '鱼眼的光泽、角膜与瞳孔区域提供了适合视觉模型分析的外观线索。' },
      { icon: '⌁', title: '手机友好', text: '无需额外传感器，手机相机即可完成采集，适合先做基础视觉辅助判断。' }
    ],
    model_card_title: 'Model Card · 模型说明卡',
    model_card: [
      { icon: '◈', title: '模型能做什么', text: '鱼眼视觉新鲜度三级分类：高度新鲜 / 新鲜 / 不新鲜。' },
      { icon: '✓', title: '验证结果', text: 'FishFreshNetV2：MFED 99.29%；FFE 81.18%。' },
      { icon: '⌁', title: '训练与验证范围', text: 'MFED 约 4800 张、2 种淡水鱼、4 种受控环境；清晰鱼眼、主体占比较大、光线充足时更适合使用。' },
      { icon: '!', title: '已知限制', text: '其他鱼种、极端光线、模糊或反光图片，以及病原微生物、污染物、毒素、兽药残留等，均不在本视觉结果的证明范围内。' },
      { icon: '⚠', title: '食品安全边界', text: '本工具是 AI 辅助评估，不适合作为法定食品检测报告、质量合格证明或食用安全保证。' },
      { icon: '▦', title: '混淆矩阵', text: '当前仓库只公开汇总准确率，未公开逐样本预测记录，因此不从汇总指标推导混淆矩阵。' }
    ],
    model_card_disclaimer: '参考 GB 2733-2015 中动物性水产品感官要求，并结合鱼眼视觉特征与项目实验数据建立三级视觉新鲜度分类；这不是对完整国标食品安全项目的替代。',
    v1_detail_title: 'FishFreshNetV1 结构详解',
    v2_detail_title: 'FishFreshNetV2 结构详解',
    v1_details: [
      { icon: '🧠', title: 'EfficientNet-B0 骨干', text: '通过 MBConv 与复合缩放完成高效特征提取，约 4.22M 参数、0.41G FLOPs，适合轻量化部署。' },
      { icon: '🎯', title: 'CBAM 注意力', text: '沿通道与空间两个维度抑制背景干扰，帮助模型聚焦瞳孔与角膜等关键区域。' },
      { icon: '📊', title: '分类头与解释', text: '自定义分类头输出三类概率，并通过 Grad-CAM 生成模型关注区域。'
      }
    ],
    v2_details: [
      { icon: '⚡', title: 'ECA 通道注意力', text: '用轻量一维卷积替代共享 MLP，降低参数开销并保留局部通道交互。' },
      { icon: '🎯', title: 'Light CRA', text: '利用鱼眼圆形几何先验划分瞳孔、角膜、眼眶三环，强化区域特征表达。' },
      { icon: '📈', title: '验证表现', text: 'MFED 准确率从 V1 的 98.88% 提升至 99.29%，同时维持轻量化部署。'
      }
    ],
    workflow_table_title: '流程节点说明',
    workflow_table_node: '节点', workflow_table_type: '类型', workflow_table_duty: '职责',
    workflow_rows: [
      { id: '1', node: 'image_upload', type: '前端', duty: '接收图像（点击 / 拖拽 / 粘贴 / 相机）' },
      { id: '2', node: 'quality_check', type: '前端', duty: '校验格式（JPG / PNG / WebP）、大小（≤25MB）' },
      { id: '3', node: 'quality_reject', type: '前端', duty: '不合格时提示原因与重拍建议' },
      { id: '4', node: 'image_preprocess', type: '前端', duty: '大图自动压缩（1280px，质量 0.9）' },
      { id: '5', node: 'api_request', type: '前端', duty: 'FormData POST 至 /predict_with_gradcam' },
      { id: '6', node: 'model_inference', type: '后端', duty: 'FishFreshNet V1 / V2 CNN 推理并输出概率' },
      { id: '7b', node: 'mid_conf_hint', type: '前端', duty: '中置信度黄色横幅提示结合感官判断' },
      { id: '7c', node: 'low_conf_prompt', type: '前端', duty: '低置信度弹窗建议重新拍摄清晰照片' },
      { id: '8', node: 'gradcam', type: '后端', duty: '生成 Grad-CAM 热力图' },
      { id: '9', node: 'prob_output', type: '后端', duty: '返回概率、等级、置信度与描述' },
      { id: '10', node: 'desc_render', type: '前端', duty: '根据等级渲染结构化分析文案' },
      { id: '11', node: 'rec_match', type: '前端', duty: '从预设模板匹配 5 大类处置建议' },
      { id: '12', node: 'visualization', type: '前端', duty: '渲染仪表盘、概率条、热力图与 Tab 报告' },
      { id: '13', node: 'export_log', type: '前端', duty: '导出 PDF 报告并保存 localStorage 历史记录' }
    ],
    trae_title: 'TRAE 如何参与 FreshEye',
    trae_intro: 'TRAE 在这里承担的是从研究 Demo 到可运行产品之间的协同工作：拆解需求、推进开发、定位问题，再根据反馈收紧表达与体验。',
    trae_workflow: [
      { icon: '01', title: '需求拆解', text: '把模型能力拆成上传、推理、结果、历史记录、PDF 报告与移动端体验等用户可操作模块。' },
      { icon: '02', title: '协同开发', text: '协助完成多页面前端、FastAPI 接入、Grad-CAM 展示与 PWA 能力。' },
      { icon: '03', title: 'Debug', text: '围绕网络异常、Service Worker 缓存、响应式布局、图片格式与 PDF 打印等实际问题持续排查。' },
      { icon: '04', title: '产品迭代', text: '根据测试与评审反馈调整结果层级、置信度边界、模型卡与页面文案，让能力和承诺保持一致。' }
    ],
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
    users_title: '面向三类使用者',
    users: [
      { icon: '🛒', title: '消费者', text: '菜市场或超市买鱼时拍照即知新鲜度，告别凭手感挑鱼的盲选。' },
      { icon: '🐟', title: '商贩与采购', text: '批量进货验收，历史记录本地留存、方便对账，降低退货纠纷。' },
      { icon: '📋', title: '记录与复核', text: '生成含结论、置信度、建议与时间戳的报告，方便后续复核与留档。' }
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
      { icon: '🛡️', title: '降低经验门槛', text: '为缺少专业经验的消费者提供额外视觉判断参考，减少只凭经验挑鱼的不确定性。' },
      { icon: '📋', title: '辅助采购初筛', text: '商户与采购人员可将结果作为购买验收复核的辅助参考，并留存本地历史记录。' },
      { icon: '🔄', title: '可拓展研究方向', text: '视觉特征、轻量模型与可解释分析可探索其他生鲜场景，但仍需新的数据与验证。' }
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
    inference: '推理流水线',
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
  common: { back_top: '回到顶部', skip: '跳到主内容', language_changed: '已切换为中文' }
}

export default zh
