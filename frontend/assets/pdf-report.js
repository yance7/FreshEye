(function () {
  "use strict";

  var fallback = {
    "zh": {
      "brand.name": "鲜眸 · FreshEye",
      "pdf.toolbarTitle": "鲜眸 · FreshEye · AI 辅助评估报告",
      "pdf.print": "打印 / 存为 PDF",
      "pdf.download": "下载报告 HTML",
      "pdf.close": "关闭",
      "pdf.brandSub": "AI 视觉新鲜度辅助评估",
      "pdf.title": "水产品新鲜度分析报告",
      "pdf.model": "模型版本",
      "pdf.duration": "耗时",
      "pdf.timestamp": "时间",
      "pdf.sectionOverview": "分析结果概览",
      "pdf.conclusion": "本次分析结论",
      "pdf.confidence": "视觉新鲜度置信度",
      "pdf.confMeta": "模型分数 · {{model}} · AI 可解释性分析",
      "pdf.confFoot": "基于单张鱼眼图像的视觉辅助判断",
      "pdf.sectionProbabilities": "三种视觉分类概率",
      "pdf.probabilityNote": "概率表示模型对本次图像的相对判断，不等同于食品安全概率",
      "pdf.sectionEvidence": "视觉特征与 AI 依据",
      "pdf.appearance": "鱼眼外观评估",
      "pdf.trend": "趋势预测",
      "pdf.knowledge": "视觉特征对照",
      "pdf.sectionAdvice": "延伸处置与消费指引",
      "pdf.adviceNote": "以下内容用于辅助记录与后续复核，请结合实际气味、组织状态和储存条件判断。",
      "pdf.caution": "谨慎提示",
      "pdf.furtherCheck": "进一步确认",
      "pdf.visualGood": "视觉特征较好",
      "pdf.storage": "❄ 储存建议",
      "pdf.consumption": "🍽 食用建议",
      "pdf.handling": "🔪 加工建议",
      "pdf.best": "✓ 最佳实践",
      "pdf.scopeTitle": "使用边界",
      "pdf.scope": "本报告基于单张鱼眼图像，描述的是视觉新鲜度特征。参考 GB 2733-2015 中动物性水产品感官要求，但不构成法定食品检验、质量合格证明或食用安全保证。",
      "pdf.footer": "鲜眸 · FreshEye · AI 视觉新鲜度辅助评估 · 第 1 页 / 共 1 页",
      "pdf.footerValidation": "参考 GB 2733-2015 感官要求 · {{model}} · {{software}} · {{timestamp}}",
      "pdf.footerDisclaimer": "本报告仅基于上传图像生成，不构成法定食品检验、质量合格证明或食用安全保证。",
      "pdf.originalAlt": "鱼眼照片",
      "pdf.originalCaption": "原始视觉捕获",
      "pdf.heatmapAlt": "AI 关注区域热力图",
      "pdf.heatmapCaption": "AI 判断依据区域",
      "pdf.noImage": "无图片",
      "common.unknown": "未知",
      "prediction.0.label": "高度新鲜",
      "prediction.1.label": "新鲜",
      "prediction.2.label": "不新鲜",
      "prediction.0.appearance": "鱼眼清澈明亮，角膜透明，瞳孔清晰，表面有自然光泽。",
      "prediction.1.appearance": "鱼眼基本清澈，角膜略有浑浊，瞳孔仍可辨认，表面光泽减弱。",
      "prediction.2.appearance": "鱼眼浑浊，角膜不透明，瞳孔模糊，表面光泽明显减弱。",
      "prediction.unknown.appearance": "暂无鱼眼外观描述。",
      "prediction.0.trend": "当前视觉状态接近高度新鲜样本。",
      "prediction.1.trend": "当前视觉状态处于中等新鲜度范围。",
      "prediction.2.trend": "当前视觉状态显示明显不新鲜特征。",
      "prediction.unknown.trend": "暂无法形成视觉新鲜度趋势。",
      "prediction.0.knowledge": "角膜透明、瞳孔清晰、表面有自然光泽。",
      "prediction.1.knowledge": "角膜略有浑浊，但瞳孔仍可辨认。",
      "prediction.2.knowledge": "角膜浑浊、瞳孔模糊，表面光泽减弱。",
      "prediction.unknown.knowledge": "暂无标准特征对照数据。"
    },
    "en": {
      "brand.name": "FreshEye",
      "pdf.toolbarTitle": "FreshEye · AI-assisted assessment report",
      "pdf.print": "Print / Save as PDF",
      "pdf.download": "Download report HTML",
      "pdf.close": "Close",
      "pdf.brandSub": "AI-assisted freshness assessment",
      "pdf.title": "Aquatic product freshness report",
      "pdf.model": "Model",
      "pdf.duration": "Duration",
      "pdf.timestamp": "Time",
      "pdf.sectionOverview": "Analysis overview",
      "pdf.conclusion": "This analysis concludes",
      "pdf.confidence": "Visual freshness confidence",
      "pdf.confMeta": "Model score · {{model}} · Explainable AI analysis",
      "pdf.confFoot": "Visual assistance based on a single fish-eye image",
      "pdf.sectionProbabilities": "Three visual-class probabilities",
      "pdf.probabilityNote": "Probabilities represent the model's relative judgment for this image, not food-safety probabilities",
      "pdf.sectionEvidence": "Visual features and AI evidence",
      "pdf.appearance": "Fish-eye appearance",
      "pdf.trend": "Trend",
      "pdf.knowledge": "Reference features",
      "pdf.sectionAdvice": "Recommendations",
      "pdf.adviceNote": "Use these points for records and follow-up review; combine them with actual smell, tissue condition, and storage conditions.",
      "pdf.caution": "Caution",
      "pdf.furtherCheck": "Further check",
      "pdf.visualGood": "Favorable visual features",
      "pdf.storage": "❄ Storage advice",
      "pdf.consumption": "🍽 Consumption advice",
      "pdf.handling": "🔪 Handling advice",
      "pdf.best": "✓ Best practice",
      "pdf.scopeTitle": "Scope of use",
      "pdf.scope": "This report describes visual freshness features from a single fish-eye image. It references the sensory requirements for aquatic products in GB 2733-2015, but is not a statutory food-safety inspection, quality certificate, or guarantee of safe consumption. If there is an off smell, abnormal tissue, or unclear storage history, combine other sensory checks with professional advice.",
      "pdf.footer": "FreshEye · AI-assisted visual freshness assessment · Page 1 / 1",
      "pdf.footerValidation": "Reference: GB 2733-2015 sensory requirements · {{model}} · {{software}} · {{timestamp}}",
      "pdf.footerDisclaimer": "Generated from the uploaded image only; not a statutory food-safety inspection, quality certificate, or guarantee of safe consumption.",
      "pdf.originalAlt": "Fish-eye photo",
      "pdf.originalCaption": "Original visual capture",
      "pdf.heatmapAlt": "AI focus-area heatmap",
      "pdf.heatmapCaption": "AI evidence area",
      "pdf.noImage": "No image",
      "common.unknown": "Unknown",
      "prediction.0.label": "Highly fresh",
      "prediction.1.label": "Fresh",
      "prediction.2.label": "Not fresh",
      "prediction.0.appearance": "The fish eye is clear and bright, with a transparent cornea, distinct pupil, and natural surface gloss.",
      "prediction.1.appearance": "The fish eye is mostly clear; the cornea is slightly cloudy, the pupil remains recognizable, and surface gloss is reduced.",
      "prediction.2.appearance": "The fish eye is cloudy, the cornea is opaque, the pupil is blurred, and surface gloss is clearly reduced.",
      "prediction.unknown.appearance": "No fish-eye appearance description is available.",
      "prediction.0.trend": "The visual features are close to a highly fresh sample.",
      "prediction.1.trend": "The visual features are within a moderate freshness range.",
      "prediction.2.trend": "The visual features indicate clear signs of low freshness.",
      "prediction.unknown.trend": "A visual freshness trend is not available.",
      "prediction.0.knowledge": "Transparent cornea, clear pupil, and natural surface gloss.",
      "prediction.1.knowledge": "A slightly cloudy cornea while the pupil remains recognizable.",
      "prediction.2.knowledge": "Cloudy cornea, blurred pupil, and reduced surface gloss.",
      "prediction.unknown.knowledge": "No reference-feature comparison is available."
    }
  };

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function replaceParams(value, params) {
    return String(value).replace(/{{\s*([\w.-]+)\s*}}/g, function (_, key) {
      return params && params[key] !== undefined && params[key] !== null ? String(params[key]) : "";
    });
  }

  function getDictionary(locale) {
    var dictionaries = window.FreshEyeLocales || {};
    return Object.assign({}, fallback.zh, dictionaries.zh || {}, fallback[locale] || {}, dictionaries[locale] || {});
  }

  function getTranslator(locale) {
    var dictionary = getDictionary(locale);
    return function (key, params) {
      var value = dictionary[key];
      if (value === undefined) value = key;
      return replaceParams(value, params);
    };
  }

  function isSafeImage(value) {
    return /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(String(value || ""))
      || /^https?:\/\//i.test(String(value || ""));
  }

  function imageBlock(src, alt, caption, empty, className) {
    if (!isSafeImage(src)) {
      return '<div class="pdf-img-block ' + (className || "") + '"><div class="pdf-img-empty">' + escapeHtml(empty) + '</div></div>';
    }
    return '<div class="pdf-img-block ' + (className || "") + '"><div class="pdf-img-wrap"><img src="'
      + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '" width="200" height="200"></div><div class="pdf-caption">'
      + escapeHtml(caption) + '</div></div>';
  }

  function getLabel(pred, translate) {
    var raw = Number(pred && (pred.freshness_label !== undefined ? pred.freshness_label : pred.freshnessLabel));
    return raw === 0 || raw === 1 || raw === 2 ? raw : null;
  }

  function getRecommendations(input, label, translate) {
    var categories = ["storage", "consumption", "handling", "safety", "best"];
    var source = input;
    if (Array.isArray(source)) source = { best: source };
    source = source && typeof source === "object" ? source : {};
    var group = label === 1 ? "mid" : label === 2 ? "low" : "";
    var result = {};
    categories.forEach(function (category) {
      var values = Array.isArray(source[category]) ? source[category].slice() : [];
      if (!values.length) {
        for (var index = 0; index < 3; index += 1) {
          var key = "recommendation." + (group ? group + "." : "") + category + "." + index;
          var value = translate(key);
          if (value !== key) values.push(value);
        }
      }
      result[category] = values.filter(function (value) { return value !== undefined && value !== null && String(value).trim(); });
    });
    return result;
  }

  function listHtml(values) {
    return (values || []).map(function (value) { return "<li>" + escapeHtml(value) + "</li>"; }).join("");
  }

  function sectionTitle(mark, title) {
    return '<h2 class="pdf-section-title"><span class="pdf-section-mark">' + escapeHtml(mark) + '</span>' + escapeHtml(title) + '</h2>';
  }

  function buildReportHtml(options) {
    var opts = options || {};
    var locale = opts.locale === "en" ? "en" : "zh";
    var lang = locale === "en" ? "en" : "zh-CN";
    var translate = getTranslator(locale);
    var prediction = opts.prediction || {};
    var label = getLabel(prediction, translate);
    var labelKey = label === null ? "unknown" : String(label);
    var labelText = label === null ? translate("common.unknown") : translate("prediction." + labelKey + ".label");
    var confidenceRaw = prediction.confidence_score !== undefined ? prediction.confidence_score : prediction.confidence;
    var confidence = Number(confidenceRaw);
    if (!Number.isFinite(confidence)) confidence = 0;
    if (confidence > 1) confidence /= 100;
    confidence = Math.max(0, Math.min(1, confidence));
    var confidencePct = (confidence * 100).toFixed(1);
    var probabilities = opts.probabilities || prediction.all_probabilities || {};
    var probabilityValues = Array.isArray(probabilities)
      ? probabilities.slice(0, 3).map(Number)
      : ["高度新鲜", "新鲜", "不新鲜"].map(function (key) { return Number(probabilities[key] || 0); });
    probabilityValues = probabilityValues.map(function (value) { return Number.isFinite(value) ? Math.max(0, value) : 0; });
    while (probabilityValues.length < 3) probabilityValues.push(0);
    var colors = [
      { primary: "#10b981", bg: "#ecfdf5", deep: "#065f46", badge: "#d1fae5", icon: "✓" },
      { primary: "#d97706", bg: "#fffbeb", deep: "#92400e", badge: "#fef3c7", icon: "!" },
      { primary: "#ef4444", bg: "#fef2f2", deep: "#991b1b", badge: "#fee2e2", icon: "⚠" }
    ];
    var color = colors[label === null ? 1 : label];
    var model = String(opts.modelVersion || prediction.model_version || translate("common.unknown"));
    var timestamp = String(opts.timestamp || new Date().toISOString()).replace(/T/, " ").replace(/\.\d+Z?$/, "");
    var dateMatch = timestamp.match(/(\d{4}-\d{2}-\d{2})/);
    var date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
    var duration = opts.durationSec === undefined || opts.durationSec === null || opts.durationSec === ""
      ? "—" : Number(opts.durationSec).toFixed(1) + "s";
    var software = String(opts.softwareVersion || "FreshEye Web 2026.08");
    var recommendations = getRecommendations(opts.recommendations, label, translate);
    var appearance = translate("prediction." + labelKey + ".appearance");
    var trend = translate("prediction." + labelKey + ".trend");
    var knowledge = translate("prediction." + labelKey + ".knowledge");
    var stylesheet = "assets/css/pdf-report.css";
    try {
      if (typeof document !== "undefined" && document.baseURI) stylesheet = new URL("assets/css/pdf-report.css", document.baseURI).href;
    } catch (_) {}
    var barLabels = [
      translate("prediction.0.label"),
      translate("prediction.1.label"),
      translate("prediction.2.label")
    ];
    var barColors = [colors[0].primary, colors[1].primary, colors[2].primary];
    var bars = probabilityValues.map(function (value, index) {
      var pct = (value * 100).toFixed(1);
      var show = Number(pct) >= 10;
      return '<div class="pdf-bar-seg" style="flex:' + value.toFixed(4) + ';min-width:' + (value > 0 ? "24px" : "0") + ';background:' + barColors[index] + '">' + (show ? '<span class="pdf-seg-text">' + escapeHtml(barLabels[index]) + ' ' + pct + '%</span>' : "") + "</div>";
    }).join("");
    var legend = barLabels.map(function (name, index) {
      return '<span class="pdf-legend-item"><i class="pdf-legend-dot" style="background:' + barColors[index] + '"></i>' + escapeHtml(name) + ' ' + (probabilityValues[index] * 100).toFixed(1) + '%</span>';
    }).join("");
    var adviceCards = [
      ["storage", "pdf.storage"],
      ["consumption", "pdf.consumption"],
      ["handling", "pdf.handling"],
      ["best", "pdf.best"]
    ].map(function (entry) {
      return '<article class="pdf-advice-card"><h3 class="pdf-advice-title">' + escapeHtml(translate(entry[1])) + '</h3><ul>' + listHtml(recommendations[entry[0]]) + '</ul></article>';
    }).join("");
    var safety = recommendations.safety && recommendations.safety.length
      ? '<div class="pdf-safety-banner ' + (label === 2 ? "is-danger" : label === 1 ? "is-warn" : "is-safe") + '"><h3 class="pdf-safety-title">' + escapeHtml(translate(label === 2 ? "pdf.caution" : "pdf.furtherCheck")) + '</h3><ul class="pdf-safety-list">' + listHtml(recommendations.safety) + "</ul></div>"
      : "";
    var images = imageBlock(opts.originalImage, translate("pdf.originalAlt"), translate("pdf.originalCaption"), translate("pdf.noImage"), "")
      + imageBlock(opts.heatmapImage, translate("pdf.heatmapAlt"), translate("pdf.heatmapCaption"), translate("pdf.noImage"), "");
    var html = '<!doctype html><html lang="' + lang + '"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>'
      + escapeHtml(translate("pdf.title")) + '</title><link rel="stylesheet" href="' + escapeHtml(stylesheet) + '"></head><body>'
      + '<div class="pdf-toolbar" id="pdfToolbar"><span class="pdf-toolbar-title">' + escapeHtml(translate("pdf.toolbarTitle")) + '</span><span class="pdf-toolbar-actions">'
      + '<button type="button" class="pdf-tb-btn pdf-tb-print" id="pdfPrintBtn">' + escapeHtml(translate("pdf.print")) + '</button>'
      + '<button type="button" class="pdf-tb-btn" id="pdfDownloadBtn">' + escapeHtml(translate("pdf.download")) + '</button>'
      + '<button type="button" class="pdf-tb-btn pdf-tb-close" id="pdfCloseBtn">' + escapeHtml(translate("pdf.close")) + '</button></span></div>'
      + '<main class="pdf-page pdf-single-page" style="--pdf-primary:' + color.primary + ';--pdf-deep:' + color.deep + ';--pdf-bg:' + color.bg + ';--pdf-badge-bg:' + color.badge + '">'
      + '<header class="pdf-header"><div class="pdf-header-brand"><div class="pdf-brand-main">' + escapeHtml(translate("brand.name")) + '</div><div class="pdf-brand-sub">' + escapeHtml(translate("pdf.brandSub")) + '</div></div>'
      + '<div class="pdf-header-title"><span class="pdf-title-kicker">FRESHEYE REPORT</span><span class="pdf-title-main">' + escapeHtml(translate("pdf.title")) + '</span></div>'
      + '<div class="pdf-header-meta"><span class="pdf-meta-tag"><strong>' + escapeHtml(translate("pdf.model")) + '</strong> ' + escapeHtml(model) + '</span><span class="pdf-meta-tag"><strong>' + escapeHtml(translate("pdf.duration")) + '</strong> ' + escapeHtml(duration) + '</span><span class="pdf-meta-tag"><strong>' + escapeHtml(translate("pdf.timestamp")) + '</strong> ' + escapeHtml(timestamp) + '</span></div></header><hr class="pdf-header-divider">'
      + '<section class="pdf-section">' + sectionTitle("01", translate("pdf.sectionOverview")) + '<div class="pdf-overview"><div class="pdf-images">' + images + '</div>'
      + '<div class="pdf-conclusion"><div class="pdf-conclusion-kicker">' + escapeHtml(translate("pdf.conclusion")) + '</div><div class="pdf-level-badge"><span class="pdf-badge-icon">' + color.icon + '</span>' + escapeHtml(labelText) + '</div><div class="pdf-conf-label">' + escapeHtml(translate("pdf.confidence")) + '</div><div class="pdf-conf-num">' + confidencePct + '%</div><div class="pdf-conf-bar-wrap"><div class="pdf-conf-bar"><div class="pdf-conf-bar-fill" style="width:' + confidencePct + '%"></div></div></div><div class="pdf-conf-meta">' + escapeHtml(translate("pdf.confMeta", { model: model })) + '</div><div class="pdf-conclusion-foot">' + escapeHtml(translate("pdf.confFoot")) + '</div></div></div></section>'
      + '<section class="pdf-section">' + sectionTitle("02", translate("pdf.sectionProbabilities")) + '<div class="pdf-stacked-bar">' + bars + '</div><div class="pdf-bar-legend">' + legend + '</div><p class="pdf-section-note">' + escapeHtml(translate("pdf.probabilityNote")) + '</p></section>'
      + '<section class="pdf-section">' + sectionTitle("03", translate("pdf.sectionEvidence")) + '<div class="pdf-detail"><strong>' + escapeHtml(translate("pdf.appearance")) + '</strong> ' + escapeHtml(appearance) + '</div><div class="pdf-detail"><strong>' + escapeHtml(translate("pdf.trend")) + '</strong> ' + escapeHtml(trend) + '</div><div class="pdf-detail"><strong>' + escapeHtml(translate("pdf.knowledge")) + '</strong> ' + escapeHtml(knowledge) + '</div></section>'
      + '<section class="pdf-section">' + sectionTitle("04", translate("pdf.sectionAdvice")) + '<p class="pdf-section-note" style="margin:0 0 8px;text-align:left">' + escapeHtml(translate("pdf.adviceNote")) + '</p><div class="pdf-advice-grid">' + adviceCards + safety + '</div></section>'
      + '<aside class="pdf-scope-note"><strong>' + escapeHtml(translate("pdf.scopeTitle")) + '</strong>' + escapeHtml(translate("pdf.scope")) + '</aside>'
      + '<footer class="pdf-footer"><div class="pdf-footer-main">' + escapeHtml(translate("pdf.footer")) + '</div><div class="pdf-footer-sub">' + escapeHtml(translate("pdf.footerValidation", { model: model, software: software, timestamp: timestamp })) + '</div><div class="pdf-footer-sub">' + escapeHtml(translate("pdf.footerDisclaimer")) + '</div></footer></main></body></html>';
    return {
      html: html,
      filename: replaceParams(locale === "en" ? "FreshEye-freshness-report-{{date}}.pdf" : "FreshEye-新鲜度报告-{{date}}.pdf", { date: date }),
      htmlFilename: replaceParams(locale === "en" ? "FreshEye-freshness-report-{{date}}.html" : "FreshEye-新鲜度报告-{{date}}.html", { date: date })
    };
  }

  window.FreshEyePdf = { buildReportHtml: buildReportHtml };
})();
