// 鲜眸 FreshEye · English language pack
const en = {
  nav: {
    home: 'Home', guide: 'Guide', fish: 'Species', about: 'About', source: 'GitHub',
    aria: 'Primary navigation', mobile_aria: 'Mobile navigation', brand_aria: 'Return to FreshEye home',
    menu_open: 'Open navigation menu', menu_close: 'Close navigation menu',
    switch_to_en: 'Switch to English', switch_to_zh: 'Switch to Chinese', brand_subtitle: 'Visual freshness reference'
  },
  meta: {
    home: { title: 'FreshEye · Visual Freshness Assessment', description: 'Upload a fish-eye image for a visual freshness reference with evidence and a Grad-CAM heatmap.' },
    guide: { title: 'User Guide · FreshEye', description: 'Learn how to capture, upload, and interpret FreshEye visual freshness assessment results.' },
    fish: { title: 'Species Guide · FreshEye', description: 'Explore fish-eye cues, freshness changes, and practical buying guidance for common aquatic products.' },
    about: { title: 'About FreshEye', description: 'Explore FreshEye model architecture, Grad-CAM explanations, data scope, and limitations.' },
    notfound: { title: 'Page Not Found · FreshEye', description: 'The page does not exist. Return to FreshEye home to continue.' }
  },
  home: {
    hero: {
      title: 'See the eye. Understand freshness.',
      subtitle: 'Use cornea clarity, pupil contours, and surface luster as visual cues for a freshness level, confidence score, and explainable heatmap. Results are for reference and do not replace statutory food inspection.',
      chip: 'FreshEye · Visual reference',
      tagline: 'Upload a photo for an AI-assisted assessment',
      badge1: '99.29% MFED test',
      badge2: '3 visual classes',
      badge3: 'Grad-CAM explainable',
      start: 'Start assessment', view_sample: 'View a sample', quick_start: 'Quick start',
      evidence_label: 'Validation & capability snapshot', evidence_mfed: 'MFED test', evidence_classes: 'visual classes', evidence_explainable: 'explainable',
      evidence_mfed_value: '99.29%', evidence_classes_value: '3', evidence_explainable_value: 'Grad-CAM', evidence_link: 'View validation scope & limitations',
      scroll_hint: 'Scroll to detect'
    },
    upload: {
      title: 'Upload Fish-Eye Image',
      section_hint: 'Click · drag · paste supported',
      hint: 'Click, drag or paste image',
      formats: 'JPG / PNG / WebP',
      camera: 'Camera',
      samples: 'Sample Images',
      choose_photo: 'Choose photo',
      privacy: 'The photo is sent only to FreshEye AI for immediate analysis; history stays on this device.',
      onboarding: 'Click or drag a fish-eye image here 📸',
      preview_alt: 'Fish-eye image preview',
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      retry: 'Retry',
      paste: 'Paste',
      clear: 'Clear'
    },
    camera: {
      title: 'Camera viewfinder', starting: 'Opening camera…', error: 'Camera access failed. Check browser permissions.',
      fallback_help: 'You can also choose an image from this device.', fallback: 'Choose image',
      flip: 'Flip camera', capture: 'Capture', close: 'Close viewfinder', not_ready: 'Camera is not ready', capture_failed: 'Capture failed. Please retry'
    },
    model: { v2: 'High-Precision (recommended)', v1: 'Classic', label: 'Model version', advanced: 'Advanced settings', advanced_hint: 'High-Precision is the default', note: 'V2 is the recommended default; V1 is retained for comparison and reproducibility.' },
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
      compare_desc: 'Highlighted areas are the model’s visual evidence; deeper color indicates greater contribution to the freshness assessment.',
      vision_explain: 'The model mainly attends to the pupil and corneal edge. Their clarity and luster are visual references for freshness.',
      compare_aria: 'Drag to compare the original image and heatmap',
      no_heatmap: 'No heatmap available',
      empty: 'Upload a fish-eye image to see the visual freshness result here',
      empty_sub: 'After analysis, this area will show the level, confidence, heatmap, and recommended actions.',
      result_hint_empty: 'Your result will appear here', result_hint_ready: 'AI visual feature analysis complete',
      result_kicker: 'Visual freshness', result_action_label: 'What to do next',
      result_action: 'Combine this visual reference with the fish gills, odor, and flesh. Do not use it alone to decide food safety.',
      show_details: 'View visual evidence', show_advice: 'View actions', confidence_model_score: 'Model score', metrics_summary: 'View evidence & full metrics',
      warning_mid: 'Confidence is moderate. Retake the image in good light, or combine this result with the gills, odor, and flesh.',
      warning_low: 'The model is uncertain about this image. Make sure the eye is clear, frontal, and well lit; low confidence does not mean it is not a fish eye.',
      close_warning: 'Dismiss warning'
    },
    prediction: {
      high: {
        appearance: 'The fish eye is clear and bright, with a transparent cornea, distinct pupil, and natural surface gloss.',
        action: 'Confirm with gills, smell, and texture, then handle promptly; actual storage time depends on storage conditions.',
        trend: 'The visual features are close to a highly fresh sample. Actual storage time depends strongly on temperature, species, and handling; this result is not a shelf-life or food-safety certificate.',
        knowledge: '✅ Reference features: transparent cornea, clear pupil, and natural surface gloss. This sample is close to a highly fresh reference.'
      },
      mid: {
        appearance: 'The fish eye is mostly clear; the cornea is slightly cloudy, the pupil remains recognizable, and surface gloss is reduced.',
        action: 'Confirm with gills, smell, and texture and handle promptly; this result is not a shelf-life or food-safety guarantee.',
        trend: 'The visual features are within a moderate freshness range. Handle promptly; actual storage time depends strongly on temperature, species, and handling.',
        knowledge: '✅ Reference features: slightly cloudy cornea while the pupil remains recognizable. This sample matches a moderate-freshness reference.'
      },
      low: {
        appearance: 'The fish eye is cloudy, the cornea is opaque, the pupil is blurred, and surface gloss is clearly reduced.',
        action: 'The visual features suggest the sample is not fresh. Do not judge food safety from this result alone; avoid eating if there is an off smell or abnormal tissue.',
        trend: 'The visual features indicate clear signs of low freshness. Avoid eating based on this result; it cannot replace testing for microbes, toxins, or contaminants.',
        knowledge: '✅ Reference features: cloudy cornea, blurred pupil, and reduced surface gloss. This sample matches a low-freshness reference.'
      },
      unknown: {
        appearance: 'No fish-eye appearance description is available.',
        action: 'Retake a clear close-up of the fish eye. If uncertainty remains, combine the result with gills, smell, and texture.',
        trend: 'A visual freshness trend is not available. Retake a clear fish-eye close-up.',
        knowledge: 'No reference-feature comparison is available.'
      }
    },
    recommendation: {
      base: {
        storage: ['Refrigerate at 0–4°C', 'Avoid repeated thawing', 'Actual storage time depends on species and handling'],
        consumption: ['Eat promptly for the best texture', 'Steaming or sashimi is preferred only when appropriate', 'Use lemon to reduce odor and add freshness'],
        handling: ['Handle promptly after removing from the refrigerator', 'Use a sharp knife to remove scales', 'Keep the eye intact while removing the organs'],
        safety: ['Clear eyes indicate visual appearance only', 'Check whether the gills are bright red', 'Confirm there is no off smell before eating'],
        best: ['Process within two hours of purchase when possible', 'Wash hands before and after handling', 'Use a dedicated cutting board to avoid cross-contamination']
      },
      mid: {
        storage: ['Refrigerate at 0–4°C', 'Freeze for longer storage', 'Aim to eat within 12 hours'],
        consumption: ['Handle promptly and cook thoroughly', 'Braising or frying is recommended', 'Serving decisions depend on storage conditions'],
        handling: ['Rinse under cold water after thawing', 'Remove the gills and organs', 'Cut into pieces for more even cooking'],
        safety: ['Average visual features cannot prove safety alone', 'Watch for off smells', 'Allow an appropriate cooking time'],
        best: ['Handle promptly rather than storing for long', 'Wrap before freezing', 'Do not refreeze after thawing']
      },
      low: {
        storage: ['Continued storage is not recommended', 'If storage is unavoidable, deep-freeze', 'Process promptly or discard'],
        consumption: ['Do not decide to eat from this result alone', 'Avoid eating if there is an off smell or abnormal tissue', 'Consult a qualified inspector when needed'],
        handling: ['Wear gloves while handling', 'Keep the fish away from other ingredients', 'Disinfect tools thoroughly'],
        safety: ['⚠ Cloudy fish eye; treat with caution', 'Avoid eating if there is an off smell or abnormal tissue', 'This result does not replace food-safety testing'],
        best: ['Check freshness carefully when buying', 'Choose a reputable seller', 'Keep the purchase record for traceability']
      }
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
      unavailable: 'Model service temporarily unavailable',
      rate_limit: 'Too many requests. Please try again later.',
      format: 'Unsupported format',
      size: 'Image too large'
    },
    export: 'Export PDF report',
    lang_switch: '中',
    guide_modal: {
      title: 'Welcome to FreshEye',
      text: 'Upload a fish eye photo, AI will analyze freshness and generate an explainable heatmap. Drag, paste or camera supported.',
      button: 'Get Started'
    },
    low_conf_modal: {
      title: 'The model is uncertain about this image',
      text: 'The current model score is {{confidence}}%. Low scores can result from blur, glare, boundary samples, uncovered species, or difficult cases; they do not mean the image is not a fish eye.',
      advice: 'Retake a clear close-up of the fish eye. If the score remains low, combine it with gills, smell, and texture.',
      retry: '📸 Retake photo', view_anyway: 'View result anyway',
      button: 'OK'
    },
    scan: { connecting: 'Connecting to AI service', starting: 'Service ready · preparing analysis', analyzing: 'Analyzing fish-eye features', heatmap: 'Generating Grad-CAM heatmap', done: 'Analysis complete' },
    status: { checking: 'Checking AI service', online: 'AI service online', offline: 'AI service temporarily offline' },
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
      trend_note: 'Actual storage time depends on storage conditions; this result is not a shelf-life or food-safety certificate.',
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
      evidence: 'Visual Evidence',
      trend: 'Visual Trend',
      advice: 'Recommended Actions',
      probability_note: 'Probabilities show the model’s relative judgment for this image; they are not food-safety probabilities.',
      limitation: 'Scope & Limitations',
      limitation_text: 'This report provides a visual freshness reference based on a fish-eye image. It does not replace statutory food inspection, quality certificates, shelf-life prediction, or a food-safety decision.',
      footer: 'AI-generated, for reference only',
      print: 'Print / Save as PDF',
      download: 'Download HTML',
      close: 'Close',
      no_image: 'No image available',
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
    correct_intro: 'The eye is centered, sharp, and evenly lit, so the cornea and pupil provide usable visual features.',
    incorrect_title: 'Incorrect Example',
    incorrect_intro: 'Side angles, underexposure, missed focus, or glare can hide key regions and reduce the reliability of this visual reference.',
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
    levels_intro: 'Based on the sensory requirements for aquatic products in GB 2733-2015 and the project’s visual features and experiments. This page explains visual cues only; it does not replace complete food-safety inspection.',
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
      { icon: '🐟', title: 'Highly Fresh', text: 'The cornea is almost clear, the pupil is bright and distinct, and the lens is transparent. The eye is full and prominent, close to a highly fresh visual reference.', color: 'high' },
      { icon: '🐠', title: 'Fresh', text: 'The cornea is slightly cloudy, the pupil remains visible but less sharp, and the lens begins to whiten. This class describes visual features only and does not prove safe consumption.', color: 'mid' },
      { icon: '🐡', title: 'Not Fresh', text: 'The cornea is heavily cloudy, the pupil is distorted or absent, and the lens is opaque. The visual features suggest low freshness; do not decide to eat from this result alone.', color: 'low' }
    ],
    species: [
      { icon: '🐟', name: 'Crucian Carp', tag: 'Freshwater', tag_en: 'freshwater', desc: 'Large protruding eyes, high cornea transparency, freshness changes are obvious.', angle: 'Side', cook: 'Steam, Soup' },
      { icon: '🐠', name: 'Rice Flower Fish', tag: 'Freshwater', tag_en: 'freshwater', desc: 'Medium eyes, deep black pupil, clouding changes slowly.', angle: 'Side', cook: 'Braised, Deep-fry' },
      { icon: '🐟', name: 'Grass Carp', tag: 'Freshwater', tag_en: 'freshwater', desc: 'Large eyes, thick cornea, plump and protruding when fresh.', angle: '45° Side', cook: 'Boiled, Spicy' },
      { icon: '🐠', name: 'Common Carp', tag: 'Freshwater', tag_en: 'freshwater', desc: 'Round protruding eyes, clear pupil, color lightens when cloudy.', angle: 'Side', cook: 'Braised, Sweet & Sour' },
      { icon: '🐟', name: 'Sea Bass', tag: 'Seawater', tag_en: 'seawater', desc: 'Bright alert eyes, clear cornea, freshness holds well.', angle: 'Front-side', cook: 'Steam' },
      { icon: '🐠', name: 'Hairtail', tag: 'Seawater', tag_en: 'seawater', desc: 'Small but prominent eyes; the cornea is transparent with a silvery sheen when fresh.', angle: 'Front', cook: 'Fry, Braise' },
      { icon: '🐟', name: 'Yellow Croaker', tag: 'Seawater', tag_en: 'seawater', desc: 'Large round eyes; the cornea is golden and bright when fresh.', angle: 'Front-side', cook: 'Steam, Braise' },
      { icon: '🐠', name: 'Cod', tag: 'Seawater', tag_en: 'seawater', desc: 'Medium-to-large eyes; the lens is transparent and spherical when fresh.', angle: 'Front-side', cook: 'Pan-sear, Bake' }
    ],
    timeline: [
      { icon: '0', color: 'aqua', title: 'Initial · Just caught/dead', text: 'The cornea is fully transparent, the pupil deep black, and the lens clear. The eye is plump and protruding.' },
      { icon: '1', color: 'aqua', title: 'Early stage', text: 'The cornea begins to change slightly while the pupil and lens remain clear; it still meets the fresh standard.' },
      { icon: '2', color: 'green', title: 'Highly fresh stage', text: 'The cornea is slightly cloudy, the pupil lighter, and the lens begins to change. The visual cues remain close to a highly fresh class; combine them with gills, smell, texture, and storage conditions.' },
      { icon: '3', color: 'gold', title: 'Fresh stage', text: 'The cornea is visibly cloudy, the pupil lighter, and the lens whitening. This enters the Fresh class; handle promptly.' },
      { icon: '4', color: 'gold', title: 'Freshness threshold', text: 'Clouding increases, the pupil blurs, and the lens deepens in white. The visual features are closer to a low-freshness sample; use other sensory cues.' },
      { icon: '!', color: 'red', title: 'Not fresh · Clearly abnormal visual cues', text: 'The cornea is severely cloudy, the pupil is deformed or absent, and the lens is opaque. Combine odor, tissue condition, and source information; avoid eating when appropriate.' }
    ],
    standards: [
      { icon: '📜', title: 'Standard name', text: 'GB 2733-2015, the Food Safety National Standard for Fresh and Frozen Animal Aquatic Products. It covers sensory, physicochemical, and contaminant requirements; FreshEye references only visual sensory dimensions.' },
      { icon: '🧪', title: 'Judgment scope', text: 'A complete national-standard judgment is not the same as a visual classification from one fish-eye photo. FreshEye focuses on eye features for non-destructive purchase and review reference.' },
      { icon: '👁', title: 'Sensory signs', text: 'The standard covers condition, color, tissue, and odor. FreshEye focuses on fish-eye visual cues and cannot detect pathogens, histamine, toxins, contaminants, or residues.' },
      { icon: '🗂', title: 'Training data', text: 'MFED contains about 4,800 photos across two freshwater fish and four controlled environments; the three labels combine storage time, visual cues, and project experiments.' }
    ],
    buying_tips: [
      { icon: '👀', title: 'Check the eyes', items: ['Prefer plump protruding eyes with clear corneas', 'Avoid flat sunken eyes and cloudy corneas'] },
      { icon: '🐟', title: 'Check the gills', items: ['Bright red is preferred', 'Dark red or gray-white usually indicates poor quality; avoid buying'] },
      { icon: '👆', title: 'Press the flesh', items: ['Fresh flesh springs back quickly', 'Lasting dents or softness indicate low freshness'] },
      { icon: '👃', title: 'Smell it', items: ['Fresh fish have a natural seawater or freshwater smell', 'Sour, rotten, or strong off odors indicate spoilage'] },
      { icon: '✨', title: 'Check the surface', items: ['Intact shiny scales and clear slime suggest freshness', 'Loose scales or dull, dry skin suggest low freshness'] },
      { icon: '📸', title: 'Use FreshEye', items: ['Shoot the eye front-side and avoid glare', 'Combine the AI result with sensory judgment'] }
    ]
  },
  about: {
    eyebrow: 'About FreshEye',
    title: 'Tech Details & Journey',
    subtitle: 'FishFreshNetV1/V2 architecture, Grad-CAM interpretability, journey and social value.',
    toc_title: 'On this page',
    toc_items: [
      { id: 'evidence-card', label: '01 Project snapshot' },
      { id: 'project-architecture', label: '02 Architecture' },
      { id: 'pain-points', label: '03 Pain points & solution' },
      { id: 'why-fish-eye', label: '04 Why the fish eye' },
      { id: 'users', label: '05 Users' },
      { id: 'comparison', label: '06 Model performance' },
      { id: 'model-card', label: '07 Model Card' },
      { id: 'workflow', label: '08 Inference flow' },
      { id: 'journey', label: '09 Project journey' },
      { id: 'social-value', label: '10 Social value' }
    ],
    evidence_title: 'Start with verifiable facts',
    evidence_heading: 'A runnable, explainable visual-assessment tool with clear boundaries',
    evidence_link: 'View Model Card',
    capabilities: 'Implemented capabilities',
    capability_items: ['✓ Real CNN inference', '✓ Grad-CAM', '✓ Mobile camera', '✓ PWA', '✓ Public dataset'],
    evidence_stats: [
      { value: '≈4,800', label: 'MFED samples' },
      { value: '2', label: 'validated freshwater fish' },
      { value: '4', label: 'controlled environments' },
      { value: '4.095M', label: 'V2 parameters' },
      { value: '0.414G', label: 'V2 FLOPs' },
      { value: '99.29%', label: 'MFED test set', accent: true },
      { value: '81.18%', label: 'FFE public set', accent: true }
    ],
    evidence_note: '99.29% and 81.18% are validation results on their respective datasets, not real-world food-safety accuracy. Other species, blurry or reflective images, and non-visual safety risks require additional judgment.',
    why_eye_title: 'Why use the fish eye as the entry point?',
    why_eye_intro: 'The fish eye is the project’s visual entry point, not a complete food-safety assessment.',
    why_eye: [
      { icon: '◌', title: 'Non-destructive', text: 'Collect a fish-eye image for visual reference without cutting or consuming the sample.' },
      { icon: '◉', title: 'Observable cues', text: 'Gloss, cornea, and pupil regions provide visible cues suited to visual-model analysis.' },
      { icon: '⌁', title: 'Phone-friendly', text: 'No dedicated sensor is required; a phone camera is enough for an initial visual reference.' }
    ],
    model_card_title: 'Model Card · Scope & Limitations',
    model_card: [
      { icon: '◈', title: 'What the model does', text: 'Three-class visual fish-eye freshness classification: Highly fresh / Fresh / Not fresh.' },
      { icon: '✓', title: 'Validation results', text: 'FishFreshNetV2: 99.29% on MFED; 81.18% on FFE.' },
      { icon: '⌁', title: 'Training scope', text: 'About 4,800 MFED images, two freshwater fish, and four controlled environments; clear, large fish-eye images in good light are the best fit.' },
      { icon: '!', title: 'Known limits', text: 'Other species, extreme lighting, blurry or reflective images, pathogens, contaminants, toxins, and veterinary-drug residues are outside the evidence covered by this visual result.' },
      { icon: '⚠', title: 'Food-safety boundary', text: 'This is an AI-assisted assessment, not a statutory food-inspection report, quality certificate, or guarantee of safe consumption.' },
      { icon: '▦', title: 'Confusion matrix', text: 'The repository publishes aggregate accuracy but not per-sample predictions, so no confusion matrix is inferred from summary metrics.' }
    ],
    model_card_disclaimer: 'The three-class visual freshness scheme references the sensory requirements for aquatic products in GB 2733-2015 and project experiments; it is not a replacement for the complete national food-safety standard.',
    v1Intro: 'FishFreshNetV1 is a lightweight, explainable deep-learning framework designed for fish-eye freshness classification. It uses only 4.22M parameters and 0.41G FLOPs, reaching 98.88% on the MFED test set.',
    v1_feature_scaling_title: 'Compound scaling',
    v1FeatureScaling: 'EfficientNet uses one compound coefficient φ to scale network depth, width, and input resolution together. The coordinated scaling strategy improves accuracy while keeping the parameter budget compact.',
    v1_feature_mbconv_title: 'MBConv block',
    v1FeatureMbconv: 'MBConv (Mobile Inverted Bottleneck Convolution) is the basic EfficientNet-B0 building block. It combines depthwise separable convolution with an inverted-residual path—expand, convolve by depthwise kernels, then project—to reduce computation while preserving representation capacity.',
    v1_feature_head_title: 'Custom classifier head',
    v1FeatureHead: 'The original EfficientNet-B0 classifier is replaced by adaptive average pooling, dropout, and a linear layer that maps features to Highly fresh, Fresh, and Not fresh.',
    v1CbamIntro: 'Real capture scenes include foam boxes, changing illumination, scales, and other irrelevant signals. FishFreshNetV1 inserts CBAM (Convolutional Block Attention Module) after the final EfficientNet-B0 feature layer and generates attention maps along channel and spatial dimensions.',
    v1ChannelTitle: 'Channel attention',
    v1ChannelText: 'Max-pooling and average-pooling are applied to the feature map, then passed through a shared multilayer perceptron. The bottleneck learns channel dependencies and returns channel weights.',
    v1SpatialTitle: 'Spatial attention',
    v1SpatialText: 'Max-pooling and average-pooling across channels produce an aggregated map; a convolution then builds spatial attention that guides the network toward the pupil and cornea while suppressing background noise.',
    v1RefineTitle: 'Adaptive feature refinement',
    v1RefineText: 'Channel and spatial attention maps are multiplied with the input feature map, refining the representation in two complementary dimensions while balancing model size and recognition quality.',
    v1GradcamTitle: 'Grad-CAM interpretability',
    v1GradcamIntro: 'To make the deep network less of a black box, FishFreshNetV1 uses Grad-CAM (Gradient-weighted Class Activation Mapping) to visualize the regions that contribute to a prediction.',
    v1Gradcam1: 'Backpropagate the target-class gradient into the final convolutional layer to obtain a coarse localization map.',
    v1Gradcam2: 'Apply global average pooling to the gradients to estimate the importance weight of each feature channel.',
    v1Gradcam3: 'Generate a heatmap that highlights the image regions with the greatest influence on the prediction.',
    v1GradcamResult: 'In observed correctly classified cases, high activation usually concentrates around the pupil and cornea. In mistakes, activation may shift to bright scales near the eye or specular highlights; the heatmap explains where the model looked, not a causal proof.',
    v2Intro: 'FishFreshNetV2 is the academic upgrade built on V1. It targets higher accuracy and interpretability without giving up a lightweight profile: ECA replaces CBAM channel attention and Light CRA (Light Circular Region Attention) adds a fish-eye-specific regional prior. The model has about 4.095M parameters and 0.414G FLOPs, reaching 99.29% on MFED and 81.18% on the public FFE set.',
    v2EcaTitle: 'ECA channel attention (CBAM replacement)',
    v2EcaIntro: 'V1 CBAM combines a shared-MLP channel module with a spatial convolution. V2 uses the efficient channel attention proposed by ECA-Net: a one-dimensional convolution replaces the fully connected MLP so neighboring channels interact directly without the information loss of dimensionality reduction. The overhead is low, but it should not be described as parameter-free.',
    v2_eca_feature_title: 'Very low overhead',
    v2EcaFeature1: 'ECA uses one one-dimensional convolution kernel and avoids channel-reduction parameters; kernel size k is selected adaptively from the channel count C.',
    v2_eca_interaction_title: 'Local cross-channel interaction',
    v2EcaFeature2: 'Unlike CBAM’s shared MLP, ECA uses one-dimensional convolution for local neighborhood interaction between channels, capturing dependencies with less overhead.',
    v2CraTitle: 'Light CRA circular-region attention',
    v2CraIntro: 'Light CRA is a fish-eye-specific regional attention module introduced in this project. Using the approximately circular geometry as a prior, it divides the feature map into N=3 concentric rings—pupil, cornea, and orbit—and applies regional attention. Shared depthwise kernels and masked partitions keep the module around 0.083M parameters; MFED accuracy rises from 98.88% to 99.29%.',
    v2_cra_semantics_title: 'Three-ring semantics',
    v2CraFeature1: 'N=3 represents three semantic zones of the fish eye: the inner ring is the pupil, the middle ring the cornea, and the outer ring the orbit. Each ring learns freshness cues at a different radius.',
    v2_cra_lightweight_title: 'Lightweight design',
    v2CraFeature2: 'Pre-generated circular masks partition the feature map, while shared depthwise kernels process each ring to reduce regional-attention parameters and computation.',
    v2_cra_ablation_title: 'Ring-count ablation',
    v2CraFeature3: 'The current project uses N=3 as its regional partition. N=1 removes the regional prior, while too many rings may fragment the semantics; future releases should validate this choice with a controlled ablation study.',
    v2CompareTitle: 'V1 vs V2 performance',
    v2CompareText: 'On the MFED test set, V2 improves accuracy by 0.41 percentage points over V1 (98.88% → 99.29%). Parameters fall from 4.216M to 4.095M and model size from 16.08MB to 15.62MB. The FFE result is shown in the validation-scope section above.',
    v2_table_model: 'Model',
    v2_table_accuracy: 'Accuracy (%)',
    v2_table_params: 'Params (M)',
    v2_table_size: 'Model size (MB)',
    v2_compare_rows: [
      { model: 'FishFreshNetV1 (Baseline)', accuracy: '98.88', f1: '98.88', params: '4.216', flops: '0.414', size: '16.08', highlight: false },
      { model: 'FishFreshNetV2 (This project)', accuracy: '99.29', f1: '99.29', params: '4.095', flops: '0.414', size: '15.62', highlight: true }
    ],
    v1_detail_title: 'FishFreshNetV1 in detail',
    v2_detail_title: 'FishFreshNetV2 in detail',
    v1_details: [
      { icon: '🧠', title: 'EfficientNet-B0 backbone', text: 'MBConv and compound scaling provide efficient feature extraction at about 4.22M parameters and 0.41G FLOPs for lightweight deployment.' },
      { icon: '🎯', title: 'CBAM attention', text: 'Channel and spatial attention suppress background noise and help the model focus on the pupil and corneal regions.' },
      { icon: '📊', title: 'Classifier and explanation', text: 'A custom head returns three class probabilities, while Grad-CAM produces the visual evidence map.' }
    ],
    v2_details: [
      { icon: '⚡', title: 'ECA channel attention', text: 'A lightweight one-dimensional convolution replaces the shared MLP, reducing overhead while preserving local channel interaction.' },
      { icon: '🎯', title: 'Light CRA', text: 'A circular fish-eye prior divides pupil, cornea, and orbital rings to strengthen regional feature representation.' },
      { icon: '📈', title: 'Validation result', text: 'MFED accuracy improves from 98.88% in V1 to 99.29% while maintaining a lightweight deployment profile.' }
    ],
    workflow_table_title: 'Workflow node notes',
    workflow_table_node: 'Node', workflow_table_type: 'Layer', workflow_table_duty: 'Responsibility',
    workflow_rows: [
      { id: '1', node: 'image_upload', type: 'Frontend', duty: 'Receive an image by click, drag, paste, or camera' },
      { id: '2', node: 'quality_check', type: 'Frontend', duty: 'Validate JPG / PNG / WebP and the ≤25 MB limit' },
      { id: '3', node: 'quality_reject', type: 'Frontend', duty: 'Explain invalid input and suggest a retake' },
      { id: '4', node: 'image_preprocess', type: 'Frontend', duty: 'Compress large images to 1280 px at quality 0.9' },
      { id: '5', node: 'api_request', type: 'Frontend', duty: 'POST FormData to /predict_with_gradcam' },
      { id: '6', node: 'model_inference', type: 'Backend', duty: 'Run FishFreshNet V1 / V2 CNN inference and return probabilities' },
      { id: '7b', node: 'mid_conf_hint', type: 'Frontend', duty: 'Show the moderate-confidence banner and sensory-check reminder' },
      { id: '7c', node: 'low_conf_prompt', type: 'Frontend', duty: 'Show the low-confidence retake prompt' },
      { id: '8', node: 'gradcam', type: 'Backend', duty: 'Generate the Grad-CAM heatmap' },
      { id: '9', node: 'prob_output', type: 'Backend', duty: 'Return probabilities, level, confidence, and description' },
      { id: '10', node: 'desc_render', type: 'Frontend', duty: 'Render structured copy for the predicted level' },
      { id: '11', node: 'rec_match', type: 'Frontend', duty: 'Match five categories of handling guidance' },
      { id: '12', node: 'visualization', type: 'Frontend', duty: 'Render gauge, probability bars, heatmap, and report tabs' },
      { id: '13', node: 'export_log', type: 'Frontend', duty: 'Export the PDF report and save local history' }
    ],
    trae_title: 'How TRAE helped build FreshEye',
    trae_intro: 'TRAE bridges the research demo and the runnable product: it decomposes requirements, moves implementation forward, locates issues, and tightens the experience from feedback.',
    trae_workflow: [
      { icon: '01', title: 'Requirement breakdown', text: 'Turn model capability into user-facing modules: upload, inference, results, history, PDF reports, and mobile behavior.' },
      { icon: '02', title: 'Collaborative development', text: 'Support the multi-page frontend, FastAPI integration, Grad-CAM presentation, and PWA behavior.' },
      { icon: '03', title: 'Debug', text: 'Investigate real issues around network failures, Service Worker cache, responsive layout, image formats, and PDF printing.' },
      { icon: '04', title: 'Product iteration', text: 'Use testing and review feedback to align result hierarchy, confidence boundaries, Model Card copy, and product claims.' }
    ],
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
    users_title: 'Three Use Cases',
    users: [
      { icon: '🛒', title: 'Consumers', text: 'Scan fish while shopping and avoid relying on guesswork or touch alone.' },
      { icon: '🐟', title: 'Vendors & Buyers', text: 'Check incoming batches, keep local history, and reduce return disputes.' },
      { icon: '📋', title: 'Record & Review', text: 'Create reports with the result, confidence, advice, and timestamp for later review and filing.' }
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
      { icon: '🛡️', title: 'Lower the experience barrier', text: 'Give people without specialist experience an additional visual reference instead of relying on intuition alone.' },
      { icon: '📋', title: 'Support purchase screening', text: 'Vendors and buyers can use the result as an additional review signal during intake and keep local history.' },
      { icon: '🔄', title: 'A research direction', text: 'Visual features, lightweight models, and explainability may extend to other fresh-food scenarios, subject to new data and validation.' }
    ],
    iteration_title: 'Roadmap',
    iteration: [
      { title: 'Short term (1–3 months)', items: ['Quantify inference confidence', 'Controlled confounder training', 'Expand dataset to 10k+ images', 'Batch analysis'] },
      { title: 'Mid term (3–12 months)', items: ['Species + freshness + cooking advice', 'Market inspection integration', 'ONNX offline SDK', 'WeChat mini program'] },
      { title: 'Long term (1+ year)', items: ['Real-world validation', 'B2B SaaS', 'Government inspection platform', 'Image + odor + texture + temperature fusion'] }
    ],
    iteration_focus_label: 'Release focus',
    iteration_focus: [
      { title: 'Current release', items: ['Provide consumers with a visual freshness reference from one fish-eye photo', 'Explain the result through confidence, Grad-CAM, advice, and a PDF report', 'Publish dataset scope and food-safety boundaries through the Model Card'] },
      { title: 'Next stage', items: ['Explore batch screening and record keeping for vendors and buyers', 'Keep improving mobile capture, result review, and history workflows', 'Add real validation data before exposing each new capability'] }
    ],
    workflowDuty13: 'Export the PDF report and save the local history record.',
    journeyResearchText: 'Designed EfficientNet-B0 + CBAM, built and documented the MFED dataset, and connected the labels to the sensory scope of GB 2733-2015.',
    socialResearchText: 'Visual features, lightweight models, and explainability may extend to other fresh-food scenarios, but every new scenario needs its own data and validation.',
    refFfeNote: 'The FFE paper and dataset are linked separately so readers can distinguish a publication from the data record.',
    refGb: 'National Health and Family Planning Commission (2015). GB 2733-2015, Food Safety National Standard for Fresh and Frozen Animal Aquatic Products.',
    references_title: 'References',
    references: [
      { citation: 'Prasetyo, E., Purbaningtyas, R., Adityo, R. D., Suciati, N., & Fatichah, C. (2022). Combining MobileNetV1 and Depthwise Separable Convolution Bottleneck with Expansion for Classifying the Freshness of Fish Eyes. Information Processing in Agriculture, 9(4), 485–496.', url: 'https://doi.org/10.1016/j.inpa.2022.01.002', note: 'Paper associated with the public FFE dataset; the dataset record is linked separately.' },
      { citation: 'Prasetyo, E., Adityo, R. D., Suciati, N., & Fatichah, C. (2022). The Freshness of the Fish Eyes Dataset (FFE), Version 1.', url: 'https://data.mendeley.com/datasets/xzyx7pbr3w/1', note: 'Mendeley Data record, DOI: 10.17632/xzyx7pbr3w.1.' },
      { citation: 'Yildiz, M. B., Yasin, E. T., & Koklu, M. (2024). Fisheye freshness detection using common deep learning algorithms and machine learning methods with a developed mobile application. European Food Research and Technology, 250(7), 1919–1932.', url: 'https://doi.org/10.1007/s00217-024-04493-0' },
      { citation: 'Simonyan, K., & Zisserman, A. (2015). Very Deep Convolutional Networks for Large-Scale Image Recognition. ICLR 2015.', url: 'https://doi.org/10.48550/arXiv.1409.1556' },
      { citation: 'He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep Residual Learning for Image Recognition. CVPR, 770–778.', url: 'https://doi.org/10.1109/CVPR.2016.90' },
      { citation: 'Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L.-C. (2018). MobileNetV2: Inverted Residuals and Linear Bottlenecks. CVPR, 4510–4520.', url: 'https://doi.org/10.1109/CVPR.2018.00474' },
      { citation: 'Tan, M., & Le, Q. V. (2019). EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks. ICML, PMLR 97, 6105–6114.', url: 'https://proceedings.mlr.press/v97/tan19a.html' },
      { citation: 'Woo, S., Park, J., Lee, J.-Y., & Kweon, I. S. (2018). CBAM: Convolutional Block Attention Module. ECCV, 3–19.', url: 'https://openaccess.thecvf.com/content_ECCV_2018/html/Sanghyun_Woo_Convolutional_Block_Attention_ECCV_2018_paper.html' },
      { citation: 'Selvaraju, R. R., et al. (2017). Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization. ICCV, 618–626.', url: 'https://openaccess.thecvf.com/content_iccv_2017/html/Selvaraju_Grad-CAM_Visual_Explanations_ICCV_2017_paper.html' },
      { citation: 'Wang, Q., et al. (2020). ECA-Net: Efficient Channel Attention for Deep Convolutional Neural Networks. CVPR, 11534–11542.', url: 'https://openaccess.thecvf.com/content_CVPR_2020/html/Wang_ECA-Net_Efficient_Channel_Attention_for_Deep_Convolutional_Neural_Networks_CVPR_2020_paper.html' },
      { citation: 'Lalabadi, H. M., Sadeghi, M., & Mireei, S. A. (2020). Fish freshness categorization from eyes and gills color features using multi-class artificial neural network and support vector machines. Aquacultural Engineering, 90, 102076.', url: 'https://doi.org/10.1016/j.aquaeng.2020.102076' },
      { citation: 'National Health and Family Planning Commission (2015). GB 2733-2015, Food Safety National Standard for Fresh and Frozen Animal Aquatic Products.', url: 'https://openstd.samr.gov.cn/' },
      { citation: 'Madhubhashini, M. N., Liyanage, C. P., Alahakoon, A. U., et al. (2024). Current applications and future trends of artificial senses in fish freshness determination: A review. Journal of Food Science, 89(1), 33–50.', url: 'https://doi.org/10.1111/1750-3841.16865' }
    ]
  },
  notfound: {
    code: '404',
    title: 'Page Dived into the Deep',
    desc: 'The page you visited does not exist, or has been carried away by the currents.',
    home: 'Back to Home'
  },
  footer: {
    inference: 'Inference pipeline',
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
  common: { back_top: 'Back to top', skip: 'Skip to main content', language_changed: 'Language switched to English' }
}

export default en
