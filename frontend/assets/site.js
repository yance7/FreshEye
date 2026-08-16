/* 鲜眸（FreshEye）全站初始化：共享 UI、FAQ 与 PWA 注册。 */
(function () {
  "use strict";

  function initAccordion() {
    document.querySelectorAll("[data-accordion]").forEach(function (acc) {
      var head = acc.querySelector(".accordion-head");
      if (!head || head.dataset.initialized === "true") return;
      head.dataset.initialized = "true";
      var toggle = function () {
        var isOpen = acc.classList.toggle("is-open");
        head.setAttribute("aria-expanded", String(isOpen));
      };
      head.addEventListener("click", toggle);
      head.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
  }

  function initPage() {
    // i18n.js is loaded before this shared script. Re-apply once here so pages
    // added through a static host still receive the persisted language and
    // the header switcher is ready before shared interactions start.
    if (window.FreshEyeI18n) window.FreshEyeI18n.init();
    // 首页有自己的结果页交互初始化，避免与共享库重复绑定气泡、菜单和手风琴。
    var isAnalysisPage = Boolean(document.getElementById("analyzeBtn"));
    if (!isAnalysisPage && window.FreshUI) {
      window.FreshUI.initBubbles();
      window.FreshUI.initHamburgerMenu();
      window.FreshUI.initReveal();
    }
    if (!isAnalysisPage) initAccordion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage, { once: true });
  } else {
    initPage();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      // 旧版本把 SW 放在 /assets/，默认作用域无法控制首页，且相对缓存路径
      // 会错误解析成 /assets/assets/*。先清理旧注册，再注册根作用域 SW。
      navigator.serviceWorker.getRegistrations()
        .then(function (registrations) {
          return Promise.all(registrations
            .filter(function (registration) {
              return new URL(registration.scope).pathname.endsWith("/assets/");
            })
            .map(function (registration) { return registration.unregister(); }));
        })
        .then(function () { return navigator.serviceWorker.register("./sw.js"); })
        .catch(function (error) {
          console.warn("📦 PWA: Service Worker 注册失败", error);
        });
    }, { once: true });
  }
})();
