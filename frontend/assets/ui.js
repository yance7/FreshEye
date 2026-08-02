/* ============================================================
 * FreshEye UI 增强层（纯增量，不影响既有功能）
 *  1. 滚动进度条
 *  2. 导航栏滚动态（is-scrolled）
 *  3. 回到顶部按钮
 *  4. 桌面端卡片 tilt 微交互（事件委托，仅精确指针设备）
 *  5. FreshUI 共享函数库：initBubbles / initHamburgerMenu / initReveal
 *     （guide / fish / about / 404 页面统一调用，消除重复代码）
 * 全部尊重 prefers-reduced-motion。
 * ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- FreshUI 共享函数库 ---------- */
  var FreshUI = {
    /** 深海气泡生成：等分区间随机分布，移动端减量，尊重减少动画偏好 */
    initBubbles: function () {
      var bubblesEl = document.getElementById("bubbles");
      if (!bubblesEl) return;
      if (reduceMotion.matches) return;
      var isMobile = window.matchMedia("(max-width: 640px)").matches;
      var COUNT = isMobile ? 6 : 12;
      var frag = document.createDocumentFragment();
      var segment = 100 / COUNT;
      for (var i = 0; i < COUNT; i++) {
        var b = document.createElement("span");
        b.className = "bubble";
        var size = 8 + Math.random() * 32;
        var left = i * segment + Math.random() * segment;
        var duration = 8 + Math.random() * 10;
        var delay = -Math.random() * duration;
        var sway = Math.random() * 60 - 30;
        b.style.cssText =
          "width:" + size + "px;height:" + size + "px;left:" + left + "%;" +
          "animation-duration:" + duration + "s;animation-delay:" + delay + "s;";
        b.style.setProperty("--sway", sway + "px");
        frag.appendChild(b);
      }
      bubblesEl.appendChild(frag);
    },

    /** 汉堡菜单：焦点陷阱 + Escape 关闭 + 焦点还原 */
    initHamburgerMenu: function () {
      var toggle = document.getElementById("navToggle");
      var overlay = document.getElementById("navOverlay");
      if (!toggle || !overlay) return;
      var lastFocused = null;

      var openMenu = function () {
        lastFocused = document.activeElement;
        overlay.hidden = false;
        toggle.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        var firstLink = overlay.querySelector("a");
        if (firstLink) firstLink.focus();
        document.body.style.overflow = "hidden";
      };
      var closeMenu = function () {
        overlay.hidden = true;
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      };

      toggle.addEventListener("click", function () {
        overlay.hidden ? openMenu() : closeMenu();
      });
      overlay.querySelectorAll("[data-close]").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !overlay.hidden) closeMenu();
      });
      overlay.addEventListener("keydown", function (e) {
        if (e.key !== "Tab" || overlay.hidden) return;
        var focusable = Array.prototype.slice.call(overlay.querySelectorAll("a, button"));
        var idx = focusable.indexOf(document.activeElement);
        if (e.shiftKey && idx === 0) {
          e.preventDefault();
          focusable[focusable.length - 1].focus();
        } else if (!e.shiftKey && idx === focusable.length - 1) {
          e.preventDefault();
          focusable[0].focus();
        }
      });
    },

    /** 入场动画：.reveal 元素进入视口时加 .revealed */
    initReveal: function () {
      var els = document.querySelectorAll(".reveal");
      if (!("IntersectionObserver" in window)) {
        els.forEach(function (el) { el.classList.add("revealed"); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      els.forEach(function (el) { io.observe(el); });
    }
  };
  window.FreshUI = FreshUI;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    /* ---------- 1. 滚动进度条 + 导航栏滚动态 + 回到顶部 ---------- */
    var progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    var navbar = document.querySelector(".navbar");

    var topBtn = document.createElement("button");
    topBtn.className = "back-to-top";
    topBtn.type = "button";
    topBtn.setAttribute("aria-label", "回到顶部");
    topBtn.textContent = "↑";
    document.body.appendChild(topBtn);

    topBtn.addEventListener("click", function () {
      var behavior = reduceMotion.matches ? "auto" : "smooth";
      window.scrollTo({ top: 0, behavior: behavior });
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var y = window.scrollY || window.pageYOffset || 0;
        var ratio = max > 0 ? Math.min(1, y / max) : 0;
        progress.style.transform = "scaleX(" + ratio + ")";
        if (navbar) navbar.classList.toggle("is-scrolled", y > 8);
        topBtn.classList.toggle("is-visible", y > window.innerHeight * 0.6);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    /* ---------- 2. 主题切换 ---------- */
    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      function updateThemeIcon() {
        var isLight = document.documentElement.dataset.theme === "light";
        themeBtn.textContent = isLight ? "☀️" : "🌙";
      }
      updateThemeIcon();
      themeBtn.addEventListener("click", function () {
        var isLight = document.documentElement.dataset.theme === "light";
        if (isLight) {
          delete document.documentElement.dataset.theme;
          localStorage.removeItem("fresheye-theme");
        } else {
          document.documentElement.dataset.theme = "light";
          localStorage.setItem("fresheye-theme", "light");
        }
        updateThemeIcon();
      });
    }

    /* ---------- 3. 卡片 tilt 微交互（桌面端专属） ---------- */
    if (!finePointer.matches) return;

    var TILT_SELECTOR =
      ".user-card, .social-card, .pain-card, .metric-item, .model-stat-item, .iter-phase";
    var MAX_DEG = 4;
    var activeEl = null;
    var activeRaf = 0;

    function resetTilt(el) {
      if (!el) return;
      el.style.transition = "transform 0.45s cubic-bezier(0.2, 0.8, 0.3, 1)";
      el.style.transform = "";
      window.setTimeout(function () {
        if (el && el.style.transition) el.style.transition = "";
      }, 460);
    }

    document.addEventListener(
      "pointerover",
      function (e) {
        if (reduceMotion.matches) return;
        var el = e.target && e.target.closest ? e.target.closest(TILT_SELECTOR) : null;
        if (el === activeEl) return;
        if (activeEl) resetTilt(activeEl);
        activeEl = el;
      },
      { passive: true }
    );

    document.addEventListener(
      "pointermove",
      function (e) {
        if (!activeEl || reduceMotion.matches) return;
        if (activeRaf) return;
        var el = activeEl;
        var cx = e.clientX;
        var cy = e.clientY;
        activeRaf = window.requestAnimationFrame(function () {
          activeRaf = 0;
          if (!el.isConnected) return;
          var rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          var px = (cx - rect.left) / rect.width - 0.5;
          var py = (cy - rect.top) / rect.height - 0.5;
          el.style.transition = "transform 0.08s ease-out";
          el.style.transform =
            "perspective(700px) rotateX(" + (-py * MAX_DEG).toFixed(2) + "deg) rotateY(" + (px * MAX_DEG).toFixed(2) + "deg) translateY(-3px)";
        });
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerout",
      function (e) {
        if (!activeEl) return;
        var to = e.relatedTarget;
        if (to && activeEl.contains(to)) return;
        resetTilt(activeEl);
        activeEl = null;
      },
      { passive: true }
    );
  });
})();
