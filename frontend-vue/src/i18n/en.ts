// 鲜眸 FreshEye · English language pack
const en = {
  nav: { home: 'Home', guide: 'Guide', fish: 'Species', about: 'About', source: 'GitHub' },
  home: {
    hero: {
      title: 'AI Fish Eye Freshness Detection',
      subtitle: 'Upload a fish eye photo, analyze freshness in seconds',
      badge1: '99%+ Accuracy',
      badge2: '2s Response',
      badge3: '3-Level'
    },
    upload: {
      title: 'Upload Fish Eye Photo',
      hint: 'Click, drag or paste image',
      formats: 'JPG / PNG / WebP',
      camera: 'Camera',
      samples: 'Sample Images',
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      retry: 'Retry'
    },
    model: { v2: 'High-Precision', v1: 'Classic', label: 'Detection Mode' },
    result: {
      tabs: { overview: 'Overview', vision: 'AI Vision', detail: 'Detail Report', advice: 'Advice' },
      confidence: 'Confidence',
      duration: 'Duration',
      time: 'Time',
      freshness: 'Freshness Level',
      high: 'Highly Fresh',
      mid: 'Fresh',
      low: 'Not Fresh',
      distribution: 'Probability',
      original: 'Original',
      heatmap: 'Heatmap',
      workflow: 'Workflow',
      appearance: 'Eye Appearance',
      trend: 'Freshness Trend',
      standard: 'Standard Reference',
      storage: 'Storage',
      consumption: 'Consumption',
      processing: 'Processing',
      safety: 'Safety',
      best: 'Best Practice'
    },
    history: {
      title: 'History',
      search: 'Search...',
      filter_all: 'All',
      filter_high: 'Highly Fresh',
      filter_mid: 'Fresh',
      filter_low: 'Not Fresh',
      filter_fav: 'Favorites',
      clear: 'Clear All',
      empty: 'No history'
    },
    confidence_warn: {
      high: 'Result is reliable',
      mid: 'For reference only, consider re-shooting',
      low: 'Low confidence, please retake'
    },
    errors: {
      timeout: 'Request timeout, please retry',
      network: 'Network error',
      server: 'AI service unavailable',
      format: 'Unsupported format',
      size: 'Image too large'
    },
    export: 'Export PDF',
    lang_switch: '中'
  },
  guide: {
    eyebrow: 'User Guide',
    title: 'FreshEye in 3 Steps',
    subtitle: 'From photo to result — master fish-eye freshness detection in a minute.'
  },
  fish: {
    eyebrow: 'Species Encyclopedia',
    title: 'Common Seafood Eye Atlas',
    subtitle: 'Different species have distinct eye features. Knowing them helps judge freshness.'
  },
  about: {
    eyebrow: 'About FreshEye',
    title: 'Tech Details & Journey',
    subtitle: 'FishFreshNetV1/V2 architecture, Grad-CAM interpretability, journey and social value.'
  },
  notfound: {
    code: '404',
    title: 'Page Dived into the Deep',
    desc: 'The page you visited does not exist, or has been carried away by the currents.',
    home: 'Back to Home'
  },
  footer: {
    desc: 'Upload a fish eye photo, AI analyzes freshness in seconds. Lightweight model + Grad-CAM heatmap — every judgment backed by evidence.',
    nav_title: 'Quick Links',
    stack_title: 'Tech Stack',
    nav_home: 'Home · Detect',
    nav_guide: 'User Guide',
    nav_fish: 'Species Encyclopedia',
    nav_about: 'Tech Details',
    nav_source: 'Source Code ↗',
    competition1: '🏆 TRAE AI Creativity Contest',
    competition2: '🏷 Social Service Track',
    competition3: '👤 Contestant: Qiyuqi',
    copy: 'FreshEye © 2026 · Snap to know, eat with confidence'
  },
  common: { back_top: 'Back to top', skip: 'Skip to main content' }
}

export default en
