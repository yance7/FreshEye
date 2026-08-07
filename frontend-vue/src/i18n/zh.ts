// 鲜眸 FreshEye · 中文语言包
const zh = {
  nav: { home: '首页', guide: '指南', fish: '百科', about: '关于', source: '开源' },
  home: {
    hero: {
      title: 'AI 鱼眼新鲜度检测',
      subtitle: '上传鱼眼照片，秒级分析水产品新鲜度',
      badge1: '99%+ 准确率',
      badge2: '2秒响应',
      badge3: '3级分类'
    },
    upload: {
      title: '上传鱼眼照片',
      hint: '点击、拖拽或粘贴图片',
      formats: '支持 JPG / PNG / WebP',
      camera: '拍照',
      samples: '示例图片',
      analyze: '开始分析',
      analyzing: '分析中...',
      retry: '重试'
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
      best: '最佳实践'
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
    lang_switch: 'EN'
  },
  guide: {
    eyebrow: '使用指南',
    title: '三步get鲜眸',
    subtitle: '从拍照到看懂结果，一分钟掌握鱼眼新鲜度智能评估。'
  },
  fish: {
    eyebrow: '鱼种百科',
    title: '常见水产品鱼眼图鉴',
    subtitle: '不同鱼种的眼部特征各异，了解它们有助于更准确地判断新鲜度。'
  },
  about: {
    eyebrow: '关于鲜眸',
    title: '技术细节与创作历程',
    subtitle: 'FishFreshNetV1/V2 模型架构、Grad-CAM 可解释性、创作历程与社会价值。'
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
