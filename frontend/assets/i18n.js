(function () {
  "use strict";

  var STORAGE_KEY = "fresheye-language";
  var EVENT_NAME = "fresheye:languagechange";
  var supported = ["zh", "en"];
  var locale = "zh";

  function normalizeLocale(value) {
    return supported.indexOf(value) >= 0 ? value : "zh";
  }

  function readStoredLocale() {
    try {
      return normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      return "zh";
    }
  }

  function getDictionary(name) {
    var dictionaries = window.FreshEyeLocales || {};
    return dictionaries[name] || dictionaries.zh || {};
  }

  function replaceParams(value, params) {
    if (!params) return value;
    return String(value).replace(/{{\s*([\w.-]+)\s*}}/g, function (_, key) {
      return params[key] === undefined || params[key] === null ? "" : String(params[key]);
    });
  }

  function t(key, params) {
    var dictionary = getDictionary(locale);
    var fallback = getDictionary("zh");
    var value = dictionary[key];
    if (value === undefined) value = fallback[key];
    if (value === undefined) value = key;
    return replaceParams(value, params);
  }

  function setDocumentLanguage() {
    if (typeof document === "undefined" || !document.documentElement) return;
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.documentElement.dir = "ltr";
  }

  function setAttributeTranslations(root) {
    if (!root || !root.querySelectorAll) return;
    var attributeNames = ["aria-label", "title", "placeholder", "content", "alt"];
    attributeNames.forEach(function (attributeName) {
      var selector = "[data-i18n-" + attributeName + "]";
      root.querySelectorAll(selector).forEach(function (element) {
        var key = element.getAttribute("data-i18n-" + attributeName);
        element.setAttribute(attributeName, t(key));
      });
    });
    root.querySelectorAll("[data-i18n-tip]").forEach(function (element) {
      element.setAttribute("data-tip", t(element.getAttribute("data-i18n-tip")));
    });
  }

  function updateLanguageControl(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("#languageToggle").forEach(function (toggle) {
      toggle.innerHTML = '<span class="language-option language-option-zh">中</span><span class="language-separator" aria-hidden="true"> / </span><span class="language-option language-option-en">EN</span>';
      toggle.setAttribute("aria-label", t(locale === "zh" ? "language.switchToEnglish" : "language.switchToChinese"));
      toggle.setAttribute("title", t(locale === "zh" ? "language.switchToEnglish" : "language.switchToChinese"));
      toggle.setAttribute("aria-pressed", locale === "en" ? "true" : "false");
      toggle.dataset.locale = locale;
      toggle.classList.toggle("is-en", locale === "en");
    });
  }

  function apply(root) {
    var target = root || document;
    setDocumentLanguage();
    if (!target || !target.querySelectorAll) return;
    target.querySelectorAll("[data-i18n]").forEach(function (element) {
      var key = element.getAttribute("data-i18n");
      var value = t(key);
      if (element.getAttribute("data-i18n-html") === "true") {
        element.innerHTML = value;
      } else {
        element.textContent = value;
      }
    });
    setAttributeTranslations(target);
    updateLanguageControl(target);
  }

  function persistLocale() {
    try { window.localStorage.setItem(STORAGE_KEY, locale); } catch (_) {}
  }

  function emitChange() {
    if (!window.dispatchEvent) return;
    try {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { locale: locale } }));
    } catch (_) {
      // Older WebViews may not expose CustomEvent; rendering still completes.
    }
  }

  function setLocale(nextLocale) {
    var next = normalizeLocale(nextLocale);
    var changed = next !== locale;
    locale = next;
    persistLocale();
    apply(document);
    if (changed) emitChange();
    return locale;
  }

  function bindToggle() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    document.querySelectorAll("#languageToggle").forEach(function (toggle) {
      if (toggle.dataset.i18nReady === "true") return;
      toggle.dataset.i18nReady = "true";
      toggle.addEventListener("click", function () {
        setLocale(locale === "zh" ? "en" : "zh");
      });
      toggle.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setLocale(locale === "zh" ? "en" : "zh");
        }
      });
    });
  }

  function init() {
    locale = readStoredLocale();
    setDocumentLanguage();
    apply(document);
    bindToggle();
  }

  function getProbabilityValues(probabilities) {
    if (Array.isArray(probabilities)) {
      return probabilities.slice(0, 3).map(function (value) {
        var number = Number(value);
        return Number.isFinite(number) ? number : 0;
      });
    }
    var source = probabilities || {};
    var keys = ["高度新鲜", "新鲜", "不新鲜"];
    var aliases = [
      ["highly_fresh", "highlyFresh", "high"],
      ["fresh", "mid", "medium"],
      ["not_fresh", "notFresh", "low"]
    ];
    return keys.map(function (key, index) {
      var raw = source[key];
      if (raw === undefined) {
        aliases[index].some(function (alias) {
          if (source[alias] !== undefined) {
            raw = source[alias];
            return true;
          }
          return false;
        });
      }
      var number = Number(raw || 0);
      return Number.isFinite(number) ? number : 0;
    });
  }

  function getPredictionCopy(prediction) {
    var rawLabel = Number(prediction && (prediction.freshness_label ?? prediction.freshnessLabel));
    var label = rawLabel === 0 || rawLabel === 1 || rawLabel === 2 ? rawLabel : null;
    var key = label === null ? "unknown" : String(label);
    return {
      label: label === null ? t("common.unknown") : t("prediction." + key + ".label"),
      description: t("prediction." + key + ".knowledge"),
      action: t("prediction." + key + ".action"),
      trend: t("prediction." + key + ".trend"),
      knowledge: t("prediction." + key + ".knowledge"),
      labelCode: label
    };
  }

  function getRecommendations(label) {
    var group = Number(label) === 1 ? "mid" : Number(label) === 2 ? "low" : "base";
    var result = {};
    ["storage", "consumption", "handling", "safety", "best"].forEach(function (category) {
      var values = [];
      for (var index = 0; index < 3; index += 1) {
        var key = "recommendation." + (group === "base" ? category : group + "." + category) + "." + index;
        var value = t(key);
        if (value !== key) values.push(value);
      }
      result[category] = values;
    });
    return result;
  }

  function getHistorySearchValues(record) {
    var item = record || {};
    var copy = getPredictionCopy(item);
    var values = [
      copy.label,
      copy.description,
      copy.action,
      copy.trend,
      item.freshnessLevel,
      item.description
    ];
    return values
      .filter(function (value) { return value !== undefined && value !== null && String(value).trim(); })
      .map(function (value) { return String(value); });
  }

  window.FreshEyeI18n = {
    init: init,
    apply: apply,
    t: t,
    getLocale: function () { return locale; },
    setLocale: setLocale,
    getProbabilityValues: getProbabilityValues,
    getPredictionCopy: getPredictionCopy,
    getRecommendations: getRecommendations,
    getHistorySearchValues: getHistorySearchValues,
    storageKey: STORAGE_KEY,
    eventName: EVENT_NAME
  };

  if (typeof document !== "undefined") init();
})();
