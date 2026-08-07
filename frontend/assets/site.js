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
      navigator.serviceWorker.register("./assets/sw.js")
        .catch(function (error) {
          console.warn("📦 PWA: Service Worker 注册失败", error);
        });
    }, { once: true });
  }
})();
