// 鲜眸 FreshEye · English language pack
const en = {
  nav: { home: 'Home', guide: 'Guide', fish: 'Species', about: 'About', source: 'GitHub' },
  home: {
    hero: {
      title: 'AI Fish Eye Freshness Detection',
      subtitle: 'Upload a fish eye photo, analyze freshness in seconds',
      chip: 'AI-powered · Non-destructive freshness detection',
      tagline: 'One shot to know freshness · Eat with confidence',
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
    tips_title: 'Best Practices',
    photo_intro: 'A good photo is essential for accurate detection. Compare the correct and incorrect examples below and follow the correct setup.',
    photo_hint: 'Center the fish eye in the circle',
    photo_text: 'A good photo is essential for accurate detection. Shoot the fish eye frontally with adequate lighting, moderate distance (10–30cm), and clear focus. Dry the eye surface before shooting to avoid glare. Avoid side angles, dim environments, extreme distances, blur, and glare obstruction.',
    correct_title: 'Correct Example',
    incorrect_title: 'Incorrect Example',
    correct_checks: [
      { title: 'Frontal angle', text: 'Point the camera at the eye and avoid side angles' },
      { title: 'Enough light', text: 'Use daylight or white light evenly across the eye' },
      { title: 'Moderate distance', text: '10–30cm, with the eye covering at least 30% of the image' },
      { title: 'Sharp focus', text: 'Tap to focus and keep pupil/cornea details visible' },
      { title: 'Dry surface', text: 'Dry the eye before shooting to prevent reflections' }
    ],
    incorrect_checks: [
      { title: 'Side angle', text: 'The eye is distorted and key features are missing' },
      { title: 'Insufficient light', text: 'Dim scenes create noise and lose detail' },
      { title: 'Extreme distance', text: 'The eye is too small or out of focus' },
      { title: 'Blurred focus', text: 'Camera shake or missed focus hides pupil edges' },
      { title: 'Glare obstruction', text: 'Direct light or droplets cover the cornea' }
    ],
    tips: [
      { icon: '💧', title: 'Dry the surface', text: 'Gently dry the eye before shooting so droplets do not hide cornea features.' },
      { icon: '☀️', title: 'Choose good light', text: 'Use daylight or white light and avoid yellow lighting that changes color perception.' },
      { icon: '🎯', title: 'Fill the frame', text: 'Make the eye at least 30% of the image so enough detail can be extracted.' },
      { icon: '🚫', title: 'Avoid glare', text: 'Avoid direct light and shadows; adjust the angle to remove reflections.' },
      { icon: '🧹', title: 'Maintain history', text: 'Clear old records periodically to free localStorage and keep the app smooth.' }
    ],
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
    timeline_title: 'Freshness Change Timeline',
    timeline_intro: 'Typical visual changes under room-temperature storage (for reference only; GB 2733-2015 remains the standard for freshness judgment).',
    standard_title: 'GB 2733-2015 Standard',
    standard_intro: 'The national standard referenced by FreshEye’s three-level classification.',
    buying_title: 'Buying Tips',
    buying_intro: 'Alongside a FreshEye scan, combine these sensory checks when choosing fish.',
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
    ],
    timeline: [
      { icon: '0', color: 'aqua', title: 'Initial · Just caught/dead', text: 'The cornea is fully transparent, the pupil deep black, and the lens clear. The eye is plump and protruding.' },
      { icon: '1', color: 'aqua', title: 'Early stage', text: 'The cornea begins to change slightly while the pupil and lens remain clear; it still meets the fresh standard.' },
      { icon: '2', color: 'green', title: 'Highly fresh stage', text: 'The cornea is slightly cloudy, the pupil lighter, and the lens beginning to change; still highly fresh.' },
      { icon: '3', color: 'gold', title: 'Fresh stage', text: 'The cornea is visibly cloudy, the pupil lighter, and the lens whitening; consume soon.' },
      { icon: '4', color: 'gold', title: 'Freshness threshold', text: 'Clouding increases, the pupil blurs, and the lens deepens in white; judgment requires caution.' },
      { icon: '!', color: 'red', title: 'Not fresh · Beyond the standard', text: 'The cornea is severely cloudy, the pupil deformed or gone, and the eye flat and sunken. Do not eat.' }
    ],
    standards: [
      { icon: '📜', title: 'Standard name', text: 'GB 2733-2015, the Food Safety National Standard for fresh and frozen animal aquatic products, is a key mandatory reference.' },
      { icon: '🧪', title: 'Judgment method', text: 'The standard uses laboratory physicochemical tests; FreshEye focuses on the most visible eye features for quick purchase-time reference.' },
      { icon: '👁', title: 'Sensory signs', text: 'Fresh fish have plump protruding eyes and clear corneas; spoiled fish have flat sunken eyes, cloudy corneas, and soft flesh.' },
      { icon: '🗂', title: 'Training data', text: 'FreshEye was trained on 4,800+ real fish-eye photos across four environments labeled against the national standard.' }
    ],
    buying_tips: [
      { icon: '👀', title: 'Check the eyes', text: 'Prefer plump protruding eyes with clear corneas; avoid flat sunken eyes and cloudiness.' },
      { icon: '🐟', title: 'Check the gills', text: 'Bright red is preferred; dark red or gray-white usually indicates poor quality.' },
      { icon: '👆', title: 'Press the flesh', text: 'Fresh flesh springs back quickly; lasting dents or softness indicate staleness.' },
      { icon: '👃', title: 'Smell it', text: 'Fresh fish smell naturally of water; sour or rotten odors indicate spoilage.' },
      { icon: '✨', title: 'Check the skin', text: 'Intact shiny scales and clear slime suggest freshness; dull, dry skin does not.' },
      { icon: '📸', title: 'Use FreshEye', text: 'Shoot the eye from the front/side without glare, then combine AI output with sensory judgment.' }
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
    ],
    users_title: 'Three User Groups',
    users: [
      { icon: '🛒', title: 'Consumers', text: 'Scan fish while shopping and avoid relying on guesswork or touch alone.' },
      { icon: '🐟', title: 'Vendors & Buyers', text: 'Check incoming batches, keep local history, and reduce return disputes.' },
      { icon: '📋', title: 'Inspectors', text: 'Create traceable reports with the result, confidence, advice, and timestamp.' }
    ],
    models_title: 'FishFreshNet Architecture',
    models_intro: 'A lightweight and explainable vision framework designed to extract key features from the circular structure of fish eyes.',
    flow_input: 'Fish-eye image',
    flow_backbone: 'Feature backbone',
    flow_attention: 'Attention',
    flow_attention_sub: 'Focus on key regions',
    flow_classifier: 'Classifier',
    flow_classes: 'freshness classes',
    flow_explain: 'Explainable heatmap',
    v1_title: 'FishFreshNetV1 · Baseline',
    v1_cards: [
      { icon: '🧠', title: 'EfficientNet-B0', text: 'MBConv and compound scaling provide efficient feature extraction at 4.22M parameters and 0.41G FLOPs.' },
      { icon: '🎯', title: 'CBAM Attention', text: 'Channel and spatial attention suppress background noise and focus the model on the pupil and cornea.' },
      { icon: '📊', title: 'Three-class output', text: 'A custom head returns probabilities for Highly Fresh, Fresh, and Not Fresh with a Grad-CAM heatmap.' }
    ],
    v2_title: 'FishFreshNetV2 · Upgrade',
    v2_cards: [
      { icon: '⚡', title: 'ECA channel attention', text: 'A lightweight 1D convolution replaces the shared MLP to reduce overhead while preserving local channel interaction.' },
      { icon: '🎯', title: 'Light CRA', text: 'A circular prior divides pupil, cornea, and orbit into three rings to strengthen regional features.' },
      { icon: '📈', title: 'Accuracy gain', text: 'MFED accuracy rises from 98.88% in V1 to 99.29% while keeping the model lightweight.' }
    ],
    workflow_title: 'Detection Workflow',
    workflow_intro: 'Frontend validation and compression → FastAPI/PyTorch inference → Grad-CAM visualization → confidence-aware guidance.',
    workflow_steps: ['Upload', 'Quality check', 'Preprocess', 'API request', 'Inference', 'Report & advice'],
    journey_title: 'Creation Journey',
    journey: [
      { icon: '💡', title: 'The idea', text: 'A real market experience led to the insight that fish eyes are an important visual signal of freshness.' },
      { icon: '🔬', title: 'Independent research', text: 'Designed EfficientNet-B0 + CBAM, built the MFED dataset, and labeled it against GB 2733-2015.' },
      { icon: '⚙️', title: 'Backend', text: 'Deployed FastAPI + PyTorch inference on Hugging Face Spaces with V1/V2 and Grad-CAM support.' },
      { icon: '🎨', title: 'Frontend iteration', text: 'Built the deep-sea visual theme, four-tab report, mobile adaptation, and PWA offline cache.' },
      { icon: '🚀', title: 'Product polish', text: 'Evolved from a working demo into a product with history, low-confidence guidance, and explainable reports.' }
    ],
    social_title: 'Social Value',
    social_value: [
      { icon: '👥', title: 'Accessible expertise', text: 'A phone and browser provide low-cost, non-destructive preliminary judgment.' },
      { icon: '🛡️', title: 'Lower the experience barrier', text: 'Consumers can reference the visual cues normally associated with expert fish buyers.' },
      { icon: '🏥', title: 'Reduce food-safety risk', text: 'Identify questionable products before purchase or consumption and reduce hidden hazards.' },
      { icon: '🔄', title: 'Transferable approach', text: 'CPU inference and standardized deployment can extend to meat, fruit, vegetables, and seafood.' }
    ],
    iteration_title: 'Roadmap',
    iteration: [
      { title: 'Short term (1–3 months)', items: ['Quantify inference confidence', 'Controlled confounder training', 'Expand dataset to 10k+ images', 'Batch analysis'] },
      { title: 'Mid term (3–12 months)', items: ['Species + freshness + cooking advice', 'Market inspection integration', 'ONNX offline SDK', 'WeChat mini program'] },
      { title: 'Long term (1+ year)', items: ['Real-world validation', 'B2B SaaS', 'Government inspection platform', 'Image + odor + texture + temperature fusion'] }
    ],
    references_title: 'References',
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
