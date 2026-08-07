// 鲜眸 FreshEye · English language pack
const en = {
  nav: { home: 'Home', guide: 'Guide', fish: 'Species', about: 'About', source: 'GitHub' },
  home: {
    hero: {
      title: 'AI Fish Eye Freshness Detection',
      subtitle: 'Upload a fish eye photo, analyze freshness in seconds',
      badge1: '99%+ Accuracy',
      badge2: '2s Response',
      badge3: '3-Level',
      scroll_hint: 'Scroll to detect'
    },
    upload: {
      title: 'Upload Fish Eye Photo',
      hint: 'Click, drag or paste image',
      formats: 'JPG / PNG / WebP',
      camera: 'Camera',
      samples: 'Sample Images',
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      retry: 'Retry',
      paste: 'Paste',
      clear: 'Clear'
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
      best: 'Best Practice',
      analyzing: 'Analyzing',
      report_title: 'Analysis Report',
      compare_title: 'Original vs Grad-CAM Heatmap',
      compare_hint: 'Drag to compare. Red regions are key features AI focused on.',
      no_heatmap: 'No heatmap available'
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
    lang_switch: '中',
    guide_modal: {
      title: 'Welcome to FreshEye',
      text: 'Upload a fish eye photo, AI will analyze freshness and generate an explainable heatmap. Drag, paste or camera supported.',
      button: 'Get Started'
    },
    low_conf_modal: {
      text: 'Please retake: frontal, clear, well-lit, properly focused.',
      button: 'OK'
    },
    rel_time: { now: 'just now', min_ago: 'm ago', hr_ago: 'h ago', day_ago: 'd ago' },
    workflow_steps: {
      preprocess: 'Preprocess',
      extract: 'Feature Extract',
      classify: 'Classify',
      gradcam: 'Grad-CAM'
    },
    detail: {
      appearance_items: {
        cornea: 'Cornea',
        pupil: 'Pupil Clarity',
        lens: 'Lens Transparency',
        tissue: 'Surrounding Tissue'
      },
      appearance_high: 'Pupil bright and clear, cornea transparent and glossy, lens translucent, surrounding tissue plump and elastic.',
      appearance_mid: 'Cornea slightly cloudy, pupil still discernible, gloss reduced, tissue elasticity decreased.',
      appearance_low: 'Cornea severely cloudy/white, pupil blurred, tissue soft and sunken, possible blood streaks.',
      trend_current: 'Current',
      trend_confidence: 'Confidence',
      shelf_high: '3-5 day shelf life',
      shelf_mid: 'Consume in 1-2 days',
      shelf_low: 'Process immediately',
      trend_stable: 'Stable',
      trend_declining: 'Declining',
      trend_desc: 'Based on eye features, freshness declines over time. Storage temperature and handling determine remaining shelf window.',
      standard_high: 'High: Clear & bright',
      standard_mid: 'Fresh: Slightly cloudy',
      standard_low: 'Not fresh: Cloudy & white',
      standard_ref: 'Per seafood sensory standard',
      standard_desc: 'Grading per seafood sensory freshness standard, combined with AI model trained on FishFreshNet dataset.'
    },
    advice: {
      storage_high: 'Refrigerate 0-4°C, wrap, keep 3-5 days.',
      storage_mid: 'Refrigerate 0-4°C, consume within 1-2 days.',
      storage_low: 'Do not store, process or discard immediately.',
      consumption_bad: 'Not edible, may cause food poisoning.',
      consumption_ok: 'Cook thoroughly above 70°C, avoid raw.',
      processing: 'Wash hands & tools, remove gills & guts, rinse under running water. Keep raw and cooked separate.',
      safety_bad: 'May contain histamine & pathogens, high risk, discard.',
      safety_ok: 'Stop eating if off-odor/slime/color change. Allergy-prone use caution.',
      best: 'Process soon after purchase; shoot frontally, clearly, well-lit to improve AI accuracy.'
    },
    pdf: {
      title: 'FreshEye Report',
      h1: 'FreshEye · Fish Eye Freshness Report',
      time: 'Time',
      duration: 'Duration',
      model: 'Model',
      footer: 'AI-generated, for reference only',
      popup_error: 'Allow popups to export PDF'
    }
  },
  guide: {
    eyebrow: 'User Guide',
    title: 'FreshEye in 3 Steps',
    subtitle: 'From photo to result — master fish-eye freshness detection in a minute.',
    steps_title: '3-Step Workflow',
    photo_title: 'Photo Tutorial',
    faq_title: 'FAQ',
    photo_text: 'A good photo is essential for accurate detection. Shoot the fish eye frontally with adequate lighting, moderate distance (10–30cm), and clear focus. Dry the eye surface before shooting to avoid glare. Avoid side angles, dim environments, extreme distances, blur, and glare obstruction.',
    steps: [
      { num: '1', icon: '📷', title: 'Upload Fish Eye Photo', text: 'Click to upload, drag-and-drop, or paste from clipboard. Mobile devices can use the camera directly. JPG/PNG/WebP, max 25MB.' },
      { num: '2', icon: '⚡', title: 'AI Instant Analysis', text: 'AI analyzes fish eye features and classifies into Highly Fresh / Fresh / Not Fresh, with an explainable Grad-CAM heatmap.' },
      { num: '3', icon: '📊', title: 'View Analysis Report', text: '4-Tab report: Overview (freshness level + confidence), AI Vision (heatmap comparison), Detail Report, and Advice.' }
    ],
    faqs: [
      { q: 'What image formats are supported?', a: 'JPG, PNG, and WebP are supported. Max 25MB per image. Original resolution is recommended to preserve fish eye details.' },
      { q: 'How long does analysis take?', a: 'Typically 3–10 seconds. First use may take 20–30 seconds to wake the AI service (Hugging Face Spaces cold start). Subsequent detections are much faster.' },
      { q: 'What if confidence is low?', a: 'A prompt appears when confidence drops below 60%. Retake the photo: ensure the eye is clearly visible, well-lit, frontal, and in focus. If confidence remains low after multiple attempts, it may be a rare species or borderline sample — consider manual judgment.' },
      { q: 'What if the AI service is down?', a: 'When the AI service is unavailable or unreachable, analysis fails with a clear "AI service unavailable" message. No mock results are generated. Please retry after the service restarts. History records remain accessible.' }
    ]
  },
  fish: {
    eyebrow: 'Species Encyclopedia',
    title: 'Common Seafood Eye Atlas',
    subtitle: 'Different species have distinct eye features. Knowing them helps judge freshness.',
    levels_title: 'Three-Level Freshness Classification',
    levels_intro: 'A three-level freshness system based on GB 2733-2015 national standard, combining fish eye sensory features. This is the core training and classification criteria for FreshEye.',
    species_title: 'Common Species Atlas',
    species_intro: 'Quick reference for eye features, shooting angles, and cooking tips of common freshwater and seawater fish.',
    best_angle: 'Best Angle',
    recommended_cook: 'Cooking',
    levels: [
      { icon: '🐟', title: 'Highly Fresh', text: 'Cornea almost clear, pupil bright and distinct, lens transparent. Eye plump and protruding — optimal for consumption.', color: 'high' },
      { icon: '🐠', title: 'Fresh', text: 'Cornea slightly cloudy, pupil visible but slightly blurred, lens beginning to whiten. Eye still protruding — meets national freshness standard.', color: 'mid' },
      { icon: '🐡', title: 'Not Fresh', text: 'Cornea severely cloudy, pupil deformed or gone, lens opaque and white. Eye flat and sunken — fails food safety standard.', color: 'low' }
    ],
    species: [
      { icon: '🐟', name: 'Crucian Carp', tag: '淡水', tag_en: 'freshwater', desc: 'Large protruding eyes, high cornea transparency, freshness changes are obvious.', angle: 'Side', cook: 'Steam, Soup' },
      { icon: '🐠', name: 'Rice Flower Fish', tag: '淡水', tag_en: 'freshwater', desc: 'Medium eyes, deep black pupil, clouding changes slowly.', angle: 'Side', cook: 'Braised, Deep-fry' },
      { icon: '🐟', name: 'Grass Carp', tag: '淡水', tag_en: 'freshwater', desc: 'Large eyes, thick cornea, plump and protruding when fresh.', angle: '45° Side', cook: 'Boiled, Spicy' },
      { icon: '🐠', name: 'Common Carp', tag: '淡水', tag_en: 'freshwater', desc: 'Round protruding eyes, clear pupil, color lightens when cloudy.', angle: 'Side', cook: 'Braised, Sweet & Sour' },
      { icon: '🐟', name: 'Sea Bass', tag: '海水', tag_en: 'seawater', desc: 'Bright alert eyes, clear cornea, freshness holds well.', angle: 'Side', cook: 'Steam' },
      { icon: '🐠', name: 'Hairtail', tag: '海水', tag_en: 'seawater', desc: 'Small eyes, thin cornea, clouding changes are significant.', angle: 'Front', cook: 'Braised, Pan-fry' }
    ]
  },
  about: {
    eyebrow: 'About FreshEye',
    title: 'Tech Details & Journey',
    subtitle: 'FishFreshNetV1/V2 architecture, Grad-CAM interpretability, journey and social value.',
    arch_title: 'Architecture',
    pain_title: 'Pain Points vs Solutions',
    compare_title: 'Model Comparison',
    arch_layer_frontend: 'User Browser (GitHub Pages Static Hosting)',
    arch_layer_backend: 'HF Spaces Backend (FastAPI + PyTorch)',
    arch_boxes: {
      home: 'Home',
      home_sub: 'Detection',
      guide: 'Guide',
      guide_sub: 'User Guide',
      fish: 'Species',
      fish_sub: 'Encyclopedia',
      about: 'About',
      about_sub: 'Tech Details'
    },
    arch_inference: 'FishFreshNetV1/V2 Inference → 3-Class Probability + Grad-CAM',
    arch_branch_high: 'Confidence ≥ 80% → Direct Output',
    arch_branch_mid: '60–80% → Combine with Sensory Judgment',
    arch_branch_low: '＜60% → Prompt Retake',
    pain_head: 'Current Pain Points',
    solution_head: 'FreshEye Solution',
    pains: [
      'Visual inspection relies on personal experience — hard for beginners',
      'Chemical testing is costly, slow, and destructive to samples',
      'Existing tools give conclusions without "why" or "what to do"',
      'Portable instruments cost ¥5,000–20,000 — impractical for street vendors',
      'Traditional sensory assessment has inter-rater variability'
    ],
    solutions: [
      'One-click photo upload — zero-cost, non-destructive detection',
      'FishFreshNetV1 (EfficientNet-B0 + CBAM) achieves 99%+ accuracy',
      'FishFreshNetV2 (ECA + Light CRA) improves to 99.29%',
      'Grad-CAM heatmap explains "why"; structured report tells "what to do"',
      'Confidence-driven adaptive branching — low confidence prompts retake'
    ],
    compare_intro: 'Comprehensive performance comparison on MFED (custom dataset) and FFE (public dataset)',
    compare_footer: 'V2 improves 0.41 percentage points over V1 (98.88% → 99.29%), achieving higher accuracy with ~3% of VGG16 parameters.',
    table_headers: { model: 'Model', params: 'Params/M', flops: 'FLOPs/G', mfed: 'MFED Acc.', ffe: 'FFE Acc.' },
    compare_rows: [
      { model: 'VGG16', params: '134.27', flops: '15.47', mfed: '98.08%', ffe: '77.40%', highlight: false },
      { model: 'ResNet18', params: '11.18', flops: '1.82', mfed: '98.67%', ffe: '79.36%', highlight: false },
      { model: 'MobileNetV2', params: '2.23', flops: '0.33', mfed: '98.54%', ffe: '79.59%', highlight: false },
      { model: 'EfficientNet-B0', params: '4.01', flops: '0.41', mfed: '98.96%', ffe: '81.64%', highlight: false },
      { model: 'FishFreshNetV1 (Baseline)', params: '4.22', flops: '0.41', mfed: '98.88%', ffe: '81.78%', highlight: true },
      { model: 'FishFreshNetV2 (Ours)', params: '4.10', flops: '0.41', mfed: '99.29%', ffe: '81.18%', highlight: true }
    ]
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
