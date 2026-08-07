    "use strict";

    // ============ 全局状态 ============
    /**
     * @type {File|null} 当前选中的图片文件对象，后续 API 调用会用到
     */
    let selectedFile = null;
    /**
     * @type {string|null} 当前图片的 base64 Data URL，预览用
     */
    let selectedFileDataURL = null;

    // ============ 常量 ============
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

    // ---- API 配置与全局状态 ----
    const API_BASE_URL = (window.FreshEyeConfig && window.FreshEyeConfig.API_BASE_URL) || "https://andreas777-fresheye.hf.space";
    const API_TIMEOUT = (window.FreshEyeConfig && window.FreshEyeConfig.API_TIMEOUT) || 60000; // 60 秒超时（HF Spaces 冷启动预留）
    let analysisInProgress = false;    // 是否正在分析中
    let lastAnalysisResult = null;     // 最近一次分析结果（JSON）
    let currentAbortController = null; // 当前请求的 AbortController（用于切换图片时取消）
    let currentModelVersion = "v2";    // 当前选中的模型版本，默认 V2
    let analysisRunId = 0;
    let previewRequestId = 0;

    const HISTORY_KEY = "fresheye-history";
    const FAVORITES_KEY = "fresheye-favorites";
    const ONBOARDING_KEY = "fresheye-onboarded";

    // ============ 无障碍辅助 ============
    /**
     * 平滑滚动到目标元素；用户开启「减少动态效果」时降级为直接跳转。
     * @param {Element} el 目标元素
     * @param {ScrollIntoViewOptions} [opts]
     */
    function scrollToTarget(el, opts) {
      if (!el || typeof el.scrollIntoView !== "function") return;
      const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const behavior = prefersReduced ? "auto" : "smooth";
      el.scrollIntoView({ behavior, ...opts });
    }
    const MODEL_PREF_KEY = "fresheye-model";
    const LEGACY_KEYS = {
      "fish-agent-history": HISTORY_KEY,
      "fish-agent-favorites": FAVORITES_KEY,
      "fish-agent-onboarded": ONBOARDING_KEY,
    };

    const storage = {
      get(key) { try { return localStorage.getItem(key); } catch { return null; } },
      set(key, val) { try { localStorage.setItem(key, val); } catch {} },
      del(key) { try { localStorage.removeItem(key); } catch {} }
    };

    let memoryStore = { history: null, favorites: null, onboarding: null, model: null };
    function memGet(key) {
      const map = { [HISTORY_KEY]: "history", [FAVORITES_KEY]: "favorites", [ONBOARDING_KEY]: "onboarding", [MODEL_PREF_KEY]: "model" };
      return memoryStore[map[key]] ?? null;
    }
    function memSet(key, val) {
      const map = { [HISTORY_KEY]: "history", [FAVORITES_KEY]: "favorites", [ONBOARDING_KEY]: "onboarding", [MODEL_PREF_KEY]: "model" };
      if (map[key]) memoryStore[map[key]] = val;
    }
    function lsGet(key) {
      const v = storage.get(key);
      return v !== null ? v : memGet(key);
    }
    function lsSet(key, val) {
      storage.set(key, val);
      memSet(key, val);
    }

    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      try {
        const old = storage.get(oldKey);
        if (old !== null && storage.get(newKey) === null) {
          storage.set(newKey, old);
        }
        storage.del(oldKey);
      } catch (_) {}
    }

    const savedModel = storage.get(MODEL_PREF_KEY);
    if (savedModel === "v1" || savedModel === "v2") {
      currentModelVersion = savedModel;
    }

    /** 获取识别模式显示名称 */
    function getModelDisplayName(modelVersion = currentModelVersion) {
      return modelVersion === "v2" ? "高精度版" : "经典版";
    }

    /** 更新所有静态识别模式文本 */
    function updateModelVersionText(modelVersion = currentModelVersion) {
      const subEl = document.getElementById("resultSubText");
      if (subEl) subEl.textContent = "AI 已完成鱼眼特征分析，热力图展示判断依据";
      const gaugeEl = document.getElementById("gaugeLabel");
      if (gaugeEl) gaugeEl.textContent = "模型分数";
    }

    // ============ DOM 引用 ============
    const uploadZone = document.getElementById("uploadZone");
    const uploadText = document.getElementById("uploadText");
    const fileInput = document.getElementById("fileInput");
    const previewCard = document.getElementById("previewCard");
    const previewImage = document.getElementById("previewImage");
    const previewLoading = document.getElementById("previewLoading");
    const previewImageBox = document.getElementById("previewImageBox");
    const infoName = document.getElementById("infoName");
    const infoSize = document.getElementById("infoSize");
    const infoDim = document.getElementById("infoDim");
    const clearBtn = document.getElementById("clearBtn");
    const reuploadBtn = document.getElementById("reuploadBtn");
    const toastContainer = document.getElementById("toastContainer");
    const bubblesEl = document.getElementById("bubbles");
    const resultsEmpty = document.getElementById("resultsEmpty");
    const skeletonWrap = document.getElementById("skeletonWrap");
    const resultsPanel = document.getElementById("resultsPanel");
    const compareOriginal = document.getElementById("compareOriginal");

    // ---- 结果面板 DOM 引用 ----
    const analyzeBtn = document.getElementById("analyzeBtn");
    const analyzeBtnText = document.getElementById("analyzeBtnText");
    const freshnessCard = document.getElementById("freshnessCard");
    const freshnessLabel = document.getElementById("freshnessLabel");
    const freshnessMeta = document.getElementById("freshnessMeta");
    const resultAction = document.getElementById("resultAction");
    const resultDetails = document.getElementById("resultDetails");
    const showResultDetailsBtn = document.getElementById("showResultDetailsBtn");
    const showAdviceBtn = document.getElementById("showAdviceBtn");
    const gaugeWrap = document.getElementById("gaugeWrap");
    const gaugeProgress = document.getElementById("gaugeProgress");
    const gaugeNum = document.getElementById("gaugeNum");
    const probBarHigh = document.getElementById("probBarHigh");
    const probBarMid = document.getElementById("probBarMid");
    const probBarLow = document.getElementById("probBarLow");
    const probValHigh = document.getElementById("probValHigh");
    const probValMid = document.getElementById("probValMid");
    const probValLow = document.getElementById("probValLow");
    const adviceGrid = document.getElementById("adviceGrid");
    const descQuote = document.getElementById("descQuote");
    const resultHint = document.getElementById("resultHint");
    const resultsSection = document.querySelector('section[aria-labelledby="result-title"]');

    // ---- 新增 DOM 引用 ----
    const compareHeatmap = document.getElementById("compareHeatmap");
    const compOverlay = document.getElementById("compOverlay");
    const compHandle = document.getElementById("compHandle");
    const compareSlider = document.getElementById("compareSlider");
    const visionExplain = document.getElementById("visionExplain");
    const metricAppearance = document.getElementById("metricAppearance");
    const metricConfidence = document.getElementById("metricConfidence");
    const metricDuration = document.getElementById("metricDuration");
    const metricTime = document.getElementById("metricTime");
    const trendBody = document.getElementById("trendBody");
    const scanStatus = document.getElementById("scanStatus");
    const knowledgeText = document.getElementById("knowledgeText");
    const historyList = document.getElementById("historyList");
    const historyEmpty = document.getElementById("historyEmpty");
    const onboardingTip = document.getElementById("onboardingTip");

    // ============ 工具函数 ============

    /**
     * HTML 转义，防止 XSS
     * @param {any} str
     * @returns {string}
     */
    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = String(str ?? "");
      return div.innerHTML;
    }

    // 统一收紧后端/历史记录中可能过强的食品安全措辞，避免把视觉分类误解为安全证明。
    function softenSafetyLanguage(text) {
      return String(text ?? "")
        .replace(/可放心食用/g, "视觉特征较好，请结合其他感官指标确认")
        .replace(/可正常食用/g, "视觉特征一般，请结合其他感官指标确认")
        .replace(/保障口感与安全/g, "作为视觉参考")
        .replace(/食品安全风险/g, "需要进一步确认的风险")
        .replace(/已超出国标限值/g, "视觉特征明显异常")
        .replace(/符合国标食用安全要求/g, "与较新鲜视觉特征相符");
    }

    /**
     * 格式化文件大小为人类可读字符串
     * @param {number} bytes
     * @returns {string}
     */
    function formatFileSize(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const units = ["B", "KB", "MB", "GB"];
      const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
      const val = bytes / Math.pow(k, i);
      return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
    }

    /**
     * 简易 debounce：延迟 wait ms 后调用 fn，期间再次触发则重置计时
     * @param {Function} fn
     * @param {number} wait
     * @returns {Function}
     */
    function debounce(fn, wait) {
      let timer = null;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    /**
     * 显示 toast 通知
     * @param {string} message 消息内容
     * @param {"error"|"success"|"info"} [type="error"] 类型
     * @param {number} [duration=3000] 自动消失时长（ms）
     */
    function showToast(message, type = "error", duration = 3000) {
      const toast = document.createElement("div");
      toast.className = `toast is-${type}`;
      toast.setAttribute("role", "alert");
      const dot = document.createElement("span");
      dot.className = "toast-dot";
      const msg = document.createElement("span");
      msg.textContent = message;
      toast.appendChild(dot);
      toast.appendChild(msg);
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.classList.add("is-leaving");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
      }, duration);
    }

    /**
     * 校验文件类型与大小
     * @param {File} file
     * @returns {{ok: boolean, reason?: string}}
     */
    function validateFile(file) {
      if (!file) return { ok: false, reason: "未选择文件" };
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { ok: false, reason: `不支持的文件类型：${file.type || "未知"}，仅支持 JPG / PNG / WebP` };
      }
      if (file.size > MAX_FILE_SIZE) {
        return { ok: false, reason: `文件过大（${formatFileSize(file.size)}），最大支持 25MB` };
      }
      if (file.size === 0) {
        return { ok: false, reason: "文件为空，请重新选择" };
      }
      return { ok: true };
    }

    /**
     * 处理文件选择（核心入口）
     * @param {File} file
     */
    function handleFileSelect(file) {
      const check = validateFile(file);
      if (!check.ok) {
        showToast(check.reason, "error", 3500);
        return;
      }
      selectedFile = file;
      showPreview(file);
    }

    function downsizeFileForPreview(file, maxDim, quality) {
      return new Promise((resolve) => {
        if (file.size < 1024 * 1024) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataURL = e.target.result;
          const img = new Image();
          img.onload = () => {
            const w = img.naturalWidth, h = img.naturalHeight;
            if (w <= maxDim && h <= maxDim) { resolve(null); return; }
            const scale = Math.min(1, maxDim / Math.max(w, h));
            const tw = Math.round(w * scale), th = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = tw; canvas.height = th;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, tw, th);
            try {
              const compressed = canvas.toDataURL('image/jpeg', quality);
              resolve({ dataURL: compressed, width: tw, height: th });
            } catch(err) { resolve(null); }
          };
          img.onerror = () => resolve(null);
          img.src = dataURL;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    /**
     * 压缩大图用于上传（>500KB 时压缩到 maxDim 内，JPEG q=0.85）
     */
    function compressImageForUpload(file, maxDim, quality) {
      return new Promise((resolve) => {
        if (file.size < 500 * 1024) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const img = new Image();
          img.onload = () => {
            // 现代浏览器（Chrome 81+/Firefox 77+/Safari 13.1+）默认按
            // image-orientation: from-image 解码，naturalWidth/Height 与 drawImage
            // 均已自动应用 EXIF 方向。此处直接按解码后尺寸绘制即可，
            // 不再手动旋转——否则 orientation 5-8 的照片会被二次旋转。
            const w = img.naturalWidth, h = img.naturalHeight;
            if (w <= maxDim && h <= maxDim) { resolve(null); return; }
            const scale = Math.min(1, maxDim / Math.max(w, h));
            const tw = Math.round(w * scale), th = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = tw; canvas.height = th;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, tw, th);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name || 'image.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
              } else {
                resolve(null);
              }
            }, 'image/jpeg', quality);
          };
          img.onerror = () => resolve(null);
          img.src = dataUrl;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }

    /**
     * 读取并预览图片
     * @param {File} file
     */
    async function showPreview(file) {
      const requestId = ++previewRequestId;
      uploadZone.style.display = "none";
      const sc = document.getElementById("sampleCard");
      if (sc) sc.classList.add("is-hidden");
      previewCard.classList.add("is-active");

      previewImage.hidden = true;
      previewLoading.hidden = false;
      const loadingText = document.createElement('div');
      loadingText.className = 'preview-loading-text';
      loadingText.textContent = '正在处理图片…';
      loadingText.style.cssText = 'color:var(--aqua,#27d0c4);font-size:13px;margin-top:8px;text-align:center;';
      const existingText = previewImageBox.querySelector('.preview-loading-text');
      if (existingText) existingText.remove();
      previewImageBox.appendChild(previewLoading);
      previewImageBox.appendChild(loadingText);

      infoName.textContent = file.name;
      infoSize.textContent = formatFileSize(file.size);
      infoDim.textContent = "处理中…";

      let dataURL;
      let displayW, displayH;
      try {
        const downsized = await downsizeFileForPreview(file, 1600, 0.85);
        if (requestId !== previewRequestId) return;
        if (downsized) {
          dataURL = downsized.dataURL;
          displayW = downsized.width;
          displayH = downsized.height;
        } else {
          dataURL = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
        }
      } catch(e) {
        dataURL = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => resolve("");
          r.readAsDataURL(file);
        });
      }

      if (requestId !== previewRequestId) return;

      selectedFileDataURL = dataURL;
      previewImage.onload = () => {
        if (requestId !== previewRequestId) return;
        loadingText.remove();
        previewLoading.hidden = true;
        previewImage.hidden = false;
        if (displayW && displayH) {
          infoDim.textContent = `${displayW} × ${displayH}`;
        } else {
          infoDim.textContent = `${previewImage.naturalWidth} × ${previewImage.naturalHeight}`;
        }
        if (compareOriginal) compareOriginal.src = dataURL;
        startScanning();
        enableAnalyzeButton();
      };
      previewImage.onerror = () => {
        if (requestId !== previewRequestId) return;
        loadingText.remove();
        previewLoading.hidden = true;
        showToast("图片加载失败，请尝试其他文件", "error");
        clearImage();
      };
      previewImage.src = dataURL;
    }

    /**
     * 清除当前图片，回到上传区
     */
    function clearImage() {
      selectedFile = null;
      selectedFileDataURL = null;
      previewRequestId++;
      previewImage.onload = null;
      previewImage.onerror = null;
      previewImage.removeAttribute("src");
      previewImage.hidden = true;
      previewLoading.hidden = true;
      previewCard.classList.remove("is-active");
      uploadZone.style.display = "flex";
      const sc = document.getElementById("sampleCard");
      if (sc) sc.classList.remove("is-hidden");
      fileInput.value = "";
      uploadText.textContent = "点击或拖拽上传鱼眼照片";
      uploadText.classList.remove("upload-text-drag");
      stopScanning();
      if (compareOriginal) compareOriginal.removeAttribute("src");
      if (compareHeatmap) compareHeatmap.removeAttribute("src");
      if (compOverlay) compOverlay.style.display = "none";
      if (compHandle) compHandle.style.display = "none";
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
      analysisInProgress = false;
      resetAnalyzeButton();
    }

    /**
     * 触发文件选择器（用于点击 / 键盘 / "换一张"）
     */
    function openFileDialog() {
      fileInput.click();
    }

    // ============ 事件绑定 ============

    // —— 点击上传 ——
    uploadZone.addEventListener("click", openFileDialog);

    // —— 键盘可访问性（Enter / Space）——
    uploadZone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFileDialog();
      }
    });

    // —— 文件选择 change ——
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    });

    // —— 拍照检测：优先应用内取景框，失败时回退系统相机 ——
    const cameraInput = document.getElementById("cameraInput");
    const cameraBtn = document.getElementById("cameraBtn");
    const cameraModal = document.getElementById("cameraModal");
    const cameraVideo = document.getElementById("cameraVideo");
    const cameraCaptureBtn = document.getElementById("cameraCaptureBtn");
    const cameraCloseBtn = document.getElementById("cameraModalClose");
    const cameraFlipBtn = document.getElementById("cameraFlipBtn");
    const cameraError = document.getElementById("cameraError");
    const cameraFallbackBtn = document.getElementById("cameraFallbackBtn");
    let cameraStream = null;
    let cameraFacing = "environment";
    let cameraStreamRequestId = 0;

    function stopCameraStream() {
      cameraStreamRequestId++;
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
        cameraStream = null;
      }
      if (cameraVideo) cameraVideo.srcObject = null;
    }

    function closeCameraModal() {
      stopCameraStream();
      if (cameraModal) cameraModal.hidden = true;
      if (cameraError) cameraError.hidden = true;
      if (cameraFallbackBtn) cameraFallbackBtn.hidden = true;
      document.body.style.overflow = "";
    }

    async function startCameraStream(facing) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia unavailable");
      }
      if (cameraError) cameraError.hidden = true;
      if (cameraFallbackBtn) cameraFallbackBtn.hidden = true;
      const requestId = ++cameraStreamRequestId;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (requestId !== cameraStreamRequestId || cameraModal?.hidden) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      cameraStream = stream;
      if (cameraVideo) {
        cameraVideo.srcObject = stream;
        await cameraVideo.play().catch(() => {});
      }
    }

    async function openCameraViewfinder() {
      if (!cameraModal || !cameraVideo) {
        cameraInput?.click();
        return;
      }
      cameraModal.hidden = false;
      document.body.style.overflow = "hidden";
      if (cameraError) cameraError.hidden = true;
      if (cameraFallbackBtn) cameraFallbackBtn.hidden = true;
      if (cameraCloseBtn) cameraCloseBtn.focus();
      try {
        await startCameraStream(cameraFacing);
      } catch (err) {
        console.warn("⚠️ 应用内相机不可用，请使用系统相机:", err);
        if (cameraError) cameraError.hidden = false;
        if (cameraFallbackBtn) cameraFallbackBtn.hidden = false;
        try { cameraInput?.click(); } catch (_) { /* 自动打开失败时用户可点击按钮 */ }
      }
    }

    function captureFromCamera() {
      if (!cameraVideo || !cameraVideo.videoWidth) {
        showToast("相机尚未就绪，请稍候再试", "error");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = cameraVideo.videoWidth;
      canvas.height = cameraVideo.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast("拍照失败，请重试", "error");
          return;
        }
        const file = new File([blob], "camera_" + Date.now() + ".jpg", {
          type: "image/jpeg",
          lastModified: Date.now()
        });
        closeCameraModal();
        handleFileSelect(file);
      }, "image/jpeg", 0.92);
    }

    async function flipCamera() {
      const next = cameraFacing === "environment" ? "user" : "environment";
      stopCameraStream();
      try {
        await startCameraStream(next);
        cameraFacing = next;
      } catch (err) {
        try {
          await startCameraStream(cameraFacing);
        } catch (_) {
          if (cameraError) cameraError.hidden = false;
          if (cameraFallbackBtn) cameraFallbackBtn.hidden = false;
        }
        showToast("无法切换镜头，请使用系统相机", "error");
      }
    }

    if (cameraBtn) {
      cameraBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCameraViewfinder();
      });
      cameraBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          openCameraViewfinder();
        }
      });
    }
    if (cameraCaptureBtn) {
      cameraCaptureBtn.addEventListener("click", captureFromCamera);
    }
    if (cameraCloseBtn) {
      cameraCloseBtn.addEventListener("click", closeCameraModal);
    }
    if (cameraFallbackBtn) {
      cameraFallbackBtn.addEventListener("click", () => cameraInput?.click());
    }
    if (cameraFlipBtn) {
      cameraFlipBtn.addEventListener("click", flipCamera);
    }
    if (cameraModal) {
      cameraModal.addEventListener("click", (e) => {
        if (e.target === cameraModal) closeCameraModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !cameraModal.hidden) closeCameraModal();
      });
    }
    if (cameraInput) {
      cameraInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          closeCameraModal();
          handleFileSelect(file);
        }
      });
    }

    // —— 内置示例图片选择（预加载 + 即时响应 + 错误恢复） ——
    const sampleCard = document.getElementById("sampleCard");
    let sampleLoading = false;
    const sampleBlobCache = {};
    const samplePreloadStatus = {};

    function preloadSample(name) {
      samplePreloadStatus[name] = "loading";
      return fetch(`assets/samples/${name}.webp`)
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((blob) => {
          if (blob.size === 0) throw new Error("空文件");
          sampleBlobCache[name] = blob;
          samplePreloadStatus[name] = "ready";
        })
        .catch(() => {
          samplePreloadStatus[name] = "error";
        });
    }
    function initSamplePreload() {
      // WebP 格式体积小（总 ~69KB），并行预加载无需延迟
      ["highly-fresh", "fresh", "not-fresh"].forEach((name) => preloadSample(name));
    }
    if ("requestIdleCallback" in window) {
      requestIdleCallback(initSamplePreload, { timeout: 2000 });
    } else {
      setTimeout(initSamplePreload, 300);
    }

    document.querySelectorAll(".sample-tag").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (sampleLoading) return;
        sampleLoading = true;
        btn.classList.add("is-loading");
        document.querySelectorAll(".sample-tag").forEach((b) => (b.disabled = true));
        const sampleName = btn.dataset.sample;

        try {
          let blob = sampleBlobCache[sampleName];
          // 缓存未命中或预加载失败时重新获取
          if (!blob) {
            if (samplePreloadStatus[sampleName] === "error") {
              await preloadSample(sampleName);
              blob = sampleBlobCache[sampleName];
            }
            if (!blob) {
              const resp = await fetch(`assets/samples/${sampleName}.webp`);
              if (!resp.ok) throw new Error("HTTP " + resp.status);
              blob = await resp.blob();
            }
          }
          if (!blob || blob.size === 0) throw new Error("图片数据无效");

          // Blob 确认后才隐藏卡片，避免加载失败时卡片闪烁
          sampleCard.classList.add("is-hidden");

          const file = new File([blob], sampleName + ".webp", { type: "image/webp" });
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (err) {
          sampleCard.classList.remove("is-hidden");
          showToast("示例图片加载失败，请检查网络后重试", "error");
        } finally {
          sampleLoading = false;
          btn.classList.remove("is-loading");
          document.querySelectorAll(".sample-tag").forEach((b) => (b.disabled = false));
        }
      });
    });

    // —— 拖拽上传 ——
    let dragCounter = 0;
    uploadZone.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      uploadZone.classList.add("is-dragover");
      uploadText.textContent = "释放以添加照片";
      uploadText.classList.add("upload-text-drag");
    });
    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadZone.classList.add("is-dragover");
    });
    uploadZone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        uploadZone.classList.remove("is-dragover");
        uploadText.textContent = "点击或拖拽上传鱼眼照片";
        uploadText.classList.remove("upload-text-drag");
      }
    });
    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      uploadZone.classList.remove("is-dragover");
      uploadText.textContent = "点击或拖拽上传鱼眼照片";
      uploadText.classList.remove("upload-text-drag");
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileSelect(file);
      } else {
        showToast("未检测到文件，请重试", "error");
      }
    });

    // 阻止整页拖放默认行为（避免浏览器直接打开图片）
    ["dragover", "drop"].forEach((evt) => {
      window.addEventListener(evt, (e) => {
        if (!e.target.closest?.("#uploadZone")) e.preventDefault();
      });
    });

    // —— 粘贴上传 ——
    document.addEventListener("paste", (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // 粘贴的截图通常无文件名，给个默认名
            if (!file.name || file.name === "image.png") {
              const ext = file.type.split("/")[1] || "png";
              const renamed = new File([file], `paste_${Date.now()}.${ext}`, { type: file.type });
              handleFileSelect(renamed);
            } else {
              handleFileSelect(file);
            }
          }
          return;
        }
      }
    });

    // —— 预览区按钮 ——
    clearBtn.addEventListener("click", clearImage);
    reuploadBtn.addEventListener("click", () => {
      clearImage();
      openFileDialog();
    });

    // ============ 深海气泡生成 ============
    /**
     * 动态生成 N 个气泡元素，随机大小 / 位置 / 速度 / 漂移
     * 移动端减少气泡数 + 尊重 prefers-reduced-motion
     */
    function initBubbles() {
      if (!bubblesEl) return;
      // 尊重"减少动画"系统偏好 → 不生成气泡
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      const isMobile = window.matchMedia?.("(max-width: 640px)").matches;
      const COUNT = isMobile ? 6 : 12;  // 移动端 6 个，桌面 12 个
      const frag = document.createDocumentFragment();
      const segment = 100 / COUNT;  // 等分区间宽度，确保均匀分布
      for (let i = 0; i < COUNT; i++) {
        const b = document.createElement("span");
        b.className = "bubble";
        const size = 8 + Math.random() * 32;       // 8-40px
        // 在第 i 个等分区间内随机，确保左右均匀覆盖
        const left = i * segment + Math.random() * segment;
        const duration = 8 + Math.random() * 10;    // 8-18s
        const delay = -Math.random() * duration;    // 负延迟 → 立即分散在时间轴上
        const sway = (Math.random() * 60 - 30);     // ±30px
        b.style.width = `${size}px`;
        b.style.height = `${size}px`;
        b.style.left = `${left}%`;
        b.style.animationDuration = `${duration}s`;
        b.style.animationDelay = `${delay}s`;
        b.style.setProperty("--sway", `${sway}px`);
        frag.appendChild(b);
      }
      bubblesEl.appendChild(frag);
    }

    // ============ 视差滚动 ============
    /**
     * 监听滚动，更新背景层 transform（rAF 节流）
     */
    function initParallax() {
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY || window.pageYOffset;
            // 背景气泡以 0.3 倍速反向移动（视差感）
            if (bubblesEl) bubblesEl.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // ============ 入场动画 ============
    /**
     * 监听 .reveal 元素进入视口时加 .revealed
     */
    function initReveal() {
      const els = document.querySelectorAll(".reveal");
      if (!("IntersectionObserver" in window)) {
        els.forEach((el) => el.classList.add("revealed"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("revealed");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      els.forEach((el) => io.observe(el));
    }

    // ============================================================
    //  API 调用 + 结果渲染 + 错误处理
    // ============================================================

    // ---- 分析按钮状态管理 ----

    /**
     * 启用分析按钮（图片加载完成后调用）
     */
    function enableAnalyzeButton() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-disabled", "is-loading", "is-retry");
      analyzeBtn.classList.add("is-ready");
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "开始分析";
      // 不自动聚焦：避免每次上传都抢占焦点/触发非预期滚动，读屏用户可自行 Tab 定位
    }

    /**
     * Hero 区瞳孔交互：跟随鼠标 + 置信度变色
     */
    (function setupPupilTracking() {
      const pupil = document.getElementById('heroPupil');
      const eyeWrap = document.querySelector('.hero-eye-wrap');
      if (!pupil || !eyeWrap) return;

      pupil.style.transition = 'transform 0.12s ease-out';

      // 降级：用户偏好减少动画时不启用鼠标跟随
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const MAX_OFFSET = 10;
      let rafId = null;
      let pendingTx = 0, pendingTy = 0;

      document.addEventListener('mousemove', (e) => {
        const rect = eyeWrap.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = (e.clientX - centerX) / (rect.width / 2);
        const dy = (e.clientY - centerY) / (rect.height / 2);
        const mag = Math.min(1, Math.hypot(dx, dy));
        const len = Math.hypot(dx, dy) || 1;
        const nx = (dx / len) * mag;
        const ny = (dy / len) * mag;
        pendingTx = nx * MAX_OFFSET;
        pendingTy = ny * MAX_OFFSET;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          pupil.style.transition = 'transform 0.12s ease-out';
          pupil.style.transform = `translate(${pendingTx}px, ${pendingTy}px)`;
        });
      });
    })();

    // 瞳孔空闲随机漂移（鼠标静止或触摸设备时触发）
    (function() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let lastMouseMove = Date.now();
      let driftTimeout = null;
      let returnTimeout = null;
      let isDrifting = false;
      const pupil = document.getElementById('heroPupil');
      const eyeWrap = document.querySelector('.hero-eye-wrap');
      if (!pupil || !eyeWrap) return;

      const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

      function clearDriftTimers() {
        if (driftTimeout) { clearTimeout(driftTimeout); driftTimeout = null; }
        if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
      }

      function driftPupil() {
        if (isDrifting) return;
        if (!isTouchDevice && Date.now() - lastMouseMove < 3000) return;
        isDrifting = true;
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 3;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        pupil.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        pupil.style.transform = `translate(${tx}px, ${ty}px)`;
        driftTimeout = setTimeout(() => {
          pupil.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
          pupil.style.transform = 'translate(0px, 0px)';
          returnTimeout = setTimeout(() => {
            isDrifting = false;
            pupil.style.transition = 'transform 0.12s ease-out';
          }, 1200);
        }, 1500);
      }

      document.addEventListener('mousemove', () => {
        lastMouseMove = Date.now();
        if (isDrifting) {
          isDrifting = false;
          clearDriftTimers();
          pupil.style.transition = 'transform 0.12s ease-out';
        }
      });

      function scheduleDrift() {
        if (document.hidden) return;
        const delay = 3000 + Math.random() * 2000;
        driftTimeout = setTimeout(() => {
          driftPupil();
          scheduleDrift();
        }, delay);
      }
      scheduleDrift();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearDriftTimers();
        } else if (!isDrifting) {
          scheduleDrift();
        }
      });
    })();

    /**
     * 根据置信度更新 Hero 瞳孔渐变颜色
     * @param {number} confidence - 0~1 浮点数
     */
    function updatePupilColorByConfidence(confidence) {
      const stop0 = document.getElementById('pupilStop0');
      const stop1 = document.getElementById('pupilStop1');
      if (!stop0 || !stop1) return;
      const pct = (confidence || 0) * 100;
      let color0, color1;
      if (pct >= 80) {
        // 绿色系（高置信度，新鲜）
        color0 = '#1a6b5a';
        color1 = '#0a3d2e';
      } else if (pct >= 60) {
        // 黄色系（中置信度）
        color0 = '#7a5a1a';
        color1 = '#3d2e0a';
      } else {
        // 红色系（低置信度，不新鲜）
        color0 = '#7a1a1a';
        color1 = '#3d0a0a';
      }
      stop0.setAttribute('stop-color', color0);
      stop1.setAttribute('stop-color', color1);
    }

    /**
     * 设置按钮为加载态（分析中）
     */
    function setAnalyzeLoading() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-disabled", "is-retry", "is-ready");
      analyzeBtn.classList.add("is-loading");
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = "分析中…";
      // 检测开始：瞳孔初始红色系（未确定）
      updatePupilColorByConfidence(0);
    }

    /**
     * 设置按钮为重试态（分析失败后）
     */
    function setAnalyzeRetry() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-disabled", "is-loading");
      analyzeBtn.classList.add("is-retry");
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "重试分析";
    }

    /**
     * 设置按钮为完成态（分析成功后）
     */
    function setAnalyzeDone() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-disabled", "is-loading", "is-retry", "is-ready");
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = "重新分析";
    }

    /**
     * 重置按钮到禁用态
     */
    function resetAnalyzeButton() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-loading", "is-retry");
      analyzeBtn.classList.add("is-disabled");
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = "请先上传鱼眼照片";
    }

    // ---- 扫描动画 ----

    /**
     * 启动扫描动画：为预览图容器添加 .scanning class
     */
    let scanStatusTimer = null;
    function startScanning() {
      previewImageBox.classList.remove("scan-complete");
      previewImageBox.classList.add("scanning");
      const stages = [
        "正在连接 AI 服务",
        "AI 服务正在启动（首次使用可能稍久）",
        "正在分析鱼眼",
        "正在生成可解释热力图"
      ];
      let stage = 0;
      if (scanStatus) scanStatus.innerHTML = `<span class="scan-dot"></span> ${stages[stage]}`;
      clearInterval(scanStatusTimer);
      scanStatusTimer = setInterval(() => {
        stage = Math.min(stage + 1, stages.length - 1);
        if (scanStatus) scanStatus.innerHTML = `<span class="scan-dot"></span> ${stages[stage]}`;
      }, 4500);
    }

    /**
     * 停止扫描动画：移除 .scanning，添加 .scan-complete
     */
    function stopScanning() {
      previewImageBox.classList.remove("scanning");
      previewImageBox.classList.add("scan-complete");
      clearInterval(scanStatusTimer);
      scanStatusTimer = null;
      if (scanStatus) scanStatus.innerHTML = '<span class="scan-dot"></span> AI 分析完成';
    }

    // ---- 骨架屏 ----
    // 4 个 Tab 各自专属骨架容器（概览沿用 #skeletonWrap，其余 3 个独立）
    const skelWraps = [
      document.getElementById("skeletonWrap"),
      document.getElementById("skelVision"),
      document.getElementById("skelDetail"),
      document.getElementById("skelAdvice"),
    ].filter(Boolean);

    function showLoading() {
      skelWraps.forEach(el => {
        el.classList.add("loading");
        el.setAttribute("aria-hidden", "false");
      });
    }

    function hideLoading() {
      skelWraps.forEach(el => {
        el.classList.remove("loading");
        el.setAttribute("aria-hidden", "true");
      });
    }

    // ---- 模型版本选择器 ----

    /**
     * 初始化模型版本下拉框：切换时更新全局变量与按钮旁 Badge
     */
    function initModelSelector() {
      const select = document.getElementById("modelVersionSelect");
      if (!select) return;
      if (currentModelVersion === "v1" || currentModelVersion === "v2") {
        select.value = currentModelVersion;
      }
      select.addEventListener("change", (e) => {
        currentModelVersion = e.target.value;
        storage.set(MODEL_PREF_KEY, currentModelVersion);
        memSet(MODEL_PREF_KEY, currentModelVersion);
        updateModelVersionBadge();
        showToast(`已切换到${getModelDisplayName(currentModelVersion)}`, "info", 1800);
      });
      updateModelVersionBadge();
      updateModelVersionText();
    }

    /**
     * 在分析按钮旁显示当前模型版本 Badge
     * V2 用主强调色（青绿），V1 用降饱和色（蓝灰）以示备选
     */
    function updateModelVersionBadge() {
      const actions = document.querySelector(".analyze-actions");
      if (!actions) return;
      let badge = document.getElementById("modelVersionBadge");
      if (!badge) {
        badge = document.createElement("span");
        badge.id = "modelVersionBadge";
        badge.className = "model-version-badge";
        // 插入到 #analyzeBtn 之后（同行）
        const btn = document.getElementById("analyzeBtn");
        if (btn && btn.nextSibling) {
          actions.insertBefore(badge, btn.nextSibling);
        } else {
          actions.appendChild(badge);
        }
      }
      badge.textContent = currentModelVersion === "v2" ? "高精度" : "经典";
      badge.classList.toggle("is-v2", currentModelVersion === "v2");
      badge.classList.toggle("is-v1", currentModelVersion === "v1");
    }

    // ---- 健康检查预热 ----

    /**
     * 页面加载时静默发起健康检查，预热 HF Spaces 冷启动
     * 不影响分析流程：服务不可用时在分析阶段明确报错
     */
    async function checkApiHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn(`⚠️ API 健康检查返回 HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn("⚠️ API 健康检查失败（服务可能未启动）", err);
      }
    }

    // ---- 核心分析流程 ----

    /**
     * 开始分析：发起真实 API 请求
     * 流程：校验 → 启动扫描+骨架屏 → 滚动 → fetch → 渲染结果 / 错误处理
     */
    async function startAnalysis() {
      if (!selectedFile) {
        showToast("请先上传鱼眼照片", "error");
        return;
      }
      if (analysisInProgress) {
        // 取消上一个请求，重新开始
        if (currentAbortController) currentAbortController.abort();
      }
      const runId = ++analysisRunId;

      analysisInProgress = true;
      setAnalyzeLoading();
      startScanning();
      // 记录分析开始时间（用于耗时统计）
      analysisStartTime = performance.now();
      // 隐藏空态、隐藏旧结果 → 显示骨架屏
      resultsEmpty.style.display = "none";
      resultsPanel.classList.remove("results-visible");
      resultsPanel.classList.add("results-hidden");
      showLoading();
      // 滚动到结果区
      if (resultsSection) {
        scrollToTarget(resultsSection, { block: "start" });
      }

      try {
        const data = await callPredictApi(selectedFile);
        if (runId !== analysisRunId) return;
        // 统一用前端当前时间作为分析时间戳，避免后端时区格式不一致导致显示偏差
        data.timestamp = new Date().toISOString();
        lastAnalysisResult = data;
        const durationSec = (performance.now() - analysisStartTime) / 1000;
        lastAnalysisResult.__processingTime = durationSec;
        stopScanning();
        hideLoading();
        updateResults(data, durationSec);
        // 保存到历史记录
        addHistoryRecord(data, durationSec);
        setAnalyzeDone();
        if (resultHint) resultHint.textContent = "分析完成";
      } catch (err) {
        if (runId !== analysisRunId || err.name === "AbortError") return;
        stopScanning();
        hideLoading();
        handleAnalysisError(err);
        setAnalyzeRetry();
      } finally {
        if (runId !== analysisRunId) return;
        analysisInProgress = false;
        currentAbortController = null;
      }
    }

    /**
     * 调用 /predict_with_gradcam 端点
     * @param {File} file
     * @returns {Promise<object>}
     */
    async function callPredictApi(file) {
      let uploadFile = file;
      if (file.size > 2 * 1024 * 1024) {
        try {
          const compressed = await compressImageForUpload(file, 1280, 0.9);
          if (compressed) {
            uploadFile = compressed;
          }
        } catch(e) { console.warn("图片压缩失败，使用原图:", e); }
      }
      const formData = new FormData();
      formData.append("file", uploadFile, uploadFile.name || file.name);

      const controller = new AbortController();
      currentAbortController = controller;
      let isTimeout = false;
      const timeoutId = setTimeout(() => { isTimeout = true; controller.abort(); }, API_TIMEOUT);

      try {
        const res = await fetch(`${API_BASE_URL}/predict_with_gradcam?model_version=${encodeURIComponent(currentModelVersion)}`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          let detail = "";
          try { detail = (await res.json()).detail || ""; } catch (_) {}
          const httpErr = new HttpError(detail || `服务器错误`, res.status);
          throw httpErr;
        }
        return await res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof HttpError) throw err;
        if (err.name === "AbortError") {
          if (isTimeout) {
            const e = new Error("请求超时");
            e.name = "TimeoutError";
            throw e;
          }
          const e = new Error("ABORT");
          e.name = "AbortError";
          throw e;
        }
        const netErr = new Error("网络连接失败");
        netErr.name = "NetworkError";
        netErr.cause = err;
        throw netErr;
      }
    }

    /**
     * 自定义 HTTP 错误类型，携带状态码
     */
    class HttpError extends Error {
      constructor(message, status) {
        super(message);
        this.name = "HttpError";
        this.status = status;
      }
    }

    /**
     * 统一错误处理：根据错误类型生成友好文案
     * AI 服务不可用时明确告知用户，不降级为模拟数据
     */
    function handleAnalysisError(err) {
      let msg = "";
      if (err.name === "TimeoutError") {
      msg = "AI 服务未运行 ⏳\n分析请求超时。AI 服务可能正在启动或已停止运行，请稍后重试。";
      } else if (err.name === "NetworkError") {
      msg = "AI 服务未运行 🔌\n无法连接到 AI 分析服务。服务可能未启动或网络不可达，请稍后重试。";
      } else if (err instanceof HttpError) {
        switch (err.status) {
          case 413: msg = "图片文件过大，请上传小于 25MB 的图片"; break;
          case 400: msg = "图片格式不支持，请上传 JPG/PNG/WebP 格式的鱼眼照片"; break;
      case 422: msg = "识别模式参数无效，请刷新页面后重试"; break;
      case 503: msg = "AI 服务未运行 ⏳\n服务正在启动中，请等待约 30 秒后重试。"; break;
          default: msg = `AI 服务返回错误（状态码 ${err.status}），请稍后重试`;
        }
      } else {
        msg = `分析失败：${err.message || "未知错误"}`;
      }
      showError(msg);
    }

    /**
     * 显示错误信息（结果区恢复空态 + toast）
     */
    function showError(message) {
      showToast(message, "error", 5000);
      hideLoading();
      resultsPanel.classList.remove("results-visible");
      resultsPanel.classList.add("results-hidden");
      resultsEmpty.style.display = "block";
      if (resultHint) resultHint.textContent = "分析失败，请重试";
    }

    // ---- 结果渲染 ----

    /**
     * 用 API 返回数据填充结果面板各子区域
     * 数值边界校验（NaN/undefined/越界统一为 0 或 "--"）
     * @param {object} data API 返回 JSON
     * @param {number} [durationSec] 分析耗时（秒）
     */
    function updateResults(data, durationSec, opts) {
      const fromHistory = !!(opts && opts.fromHistory);
      const pred = data?.prediction || {};
      const resultModelVersion = pred.model_version || data?.model_version || currentModelVersion;
      const heatmapBase64 = data?.heatmap_image || "";
      const level = pred.freshness_level || "未知";
      // 数值安全化：非有限数 → -1 / 0
      const safeNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
      let label = typeof pred.freshness_label === "number" ? pred.freshness_label : -1;
      if (![0, 1, 2].includes(label)) label = -1;
      let confidence = safeNum(pred.confidence_score);
      confidence = Math.max(0, Math.min(1, confidence)); // 强制 0-1 范围
      const probs = pred.all_probabilities || {};
      const description = softenSafetyLanguage(pred.description || "暂无描述");

      lastAnalysisResult = data;
      updateModelVersionText(resultModelVersion);
      updateFreshnessCard(level, label, confidence, resultModelVersion);
      updateConfidenceGauge(confidence);
      // 检测完成：瞳孔颜色随最终置信度变化
      updatePupilColorByConfidence(confidence);
      updateProbabilityBars(probs, label);
      updateComparisonView(heatmapBase64);
      updateDescription(description, confidence);
      updateRecommendations(label, confidence);
      updateResultAction(level, confidence, label);
      updateMetrics(pred, durationSec);

      // 置信度自适应前端机制（历史记录加载只显示横幅，不弹窗打断用户）
      handleConfidenceAdaptive(confidence, fromHistory);

      resultsPanel.classList.remove("results-hidden");
      resultsPanel.classList.add("results-visible");
      stopScanning();
    }

    // ============ 置信度自适应前端机制 ============

    /**
     * 置信度自适应主逻辑：仪表盘颜色 + 工作流徽标 + 警告横幅 + 弹窗
     * @param {number} confidence 置信度（0-1）
     * @param {boolean} [fromHistory] 是否从历史记录加载（不弹窗，仅横幅）
     */
    function handleConfidenceAdaptive(confidence, fromHistory) {
      const pctStr = (confidence * 100).toFixed(1);

      // 1. 更新仪表盘数字颜色
      if (gaugeNum) {
        gaugeNum.style.color = "";
        if (confidence >= 0.8) gaugeNum.style.color = "var(--fresh-high, #10b981)";
        else if (confidence >= 0.6) gaugeNum.style.color = "var(--fresh-mid, #d97706)";
        else gaugeNum.style.color = "var(--fresh-low, #ef4444)";
      }

      // 2. 更新工作流徽标
      updateWorkflowBadge(confidence);

      // 3. 隐藏所有警告
      const warnMid = document.getElementById("confidenceWarningMid");
      const warnLow = document.getElementById("confidenceWarningLow");
      if (warnMid) warnMid.hidden = true;
      if (warnLow) warnLow.hidden = true;

      // 4. 根据置信度区间显示对应警告
      if (confidence < 0.6) {
        // < 60%：红色横幅 + 弹窗（历史记录加载时不弹窗，避免打断查看）
        const lowConfSpan = document.getElementById("warningLowConf");
        if (lowConfSpan) lowConfSpan.textContent = pctStr;
        if (warnLow) warnLow.hidden = false;
        if (!fromHistory) showConfidenceModal(confidence);
      } else if (confidence < 0.75) {
        // 60% - 75%：黄色横幅
        const midConfSpan = document.getElementById("warningMidConf");
        if (midConfSpan) midConfSpan.textContent = pctStr;
        if (warnMid) warnMid.hidden = false;
      }
      // ≥ 75%：不显示任何警告

      // 5. 概览 Tab 的置信度数字也同步变色
      if (metricConfidence) {
        metricConfidence.style.color = "";
        if (confidence >= 0.8) metricConfidence.style.color = "var(--fresh-high, #10b981)";
        else if (confidence >= 0.6) metricConfidence.style.color = "var(--fresh-mid, #d97706)";
        else metricConfidence.style.color = "var(--fresh-low, #ef4444)";
      }
    }

    function updateResultAction(level, confidence, label) {
      if (!resultAction) return;
      if (confidence < 0.6) {
        resultAction.textContent = "先重新拍摄清晰鱼眼特写；如果仍不确定，请结合鱼鳃、气味与肉质判断。";
      } else if (label === 2) {
        resultAction.textContent = "视觉特征显示明显不新鲜，不要仅凭本结果判断食用安全；如有异味或组织异常，避免食用。";
      } else if (label === 1) {
        resultAction.textContent = "建议结合鱼鳃、气味与肉质确认，并尽快处理；实际可保存时间取决于储存条件。";
      } else {
        resultAction.textContent = "结合鱼鳃、气味与肉质确认后尽快处理；本结果不构成保质期或食品安全保证。";
      }
    }

    /**
     * 更新工作流路径徽标
     */
    function updateWorkflowBadge(confidence) {
      const badge = document.getElementById("workflowBadge");
      const badgeLabel = document.getElementById("workflowBadgeLabel");
      if (!badge || !badgeLabel) return;

      badge.classList.remove("badge-high", "badge-mid", "badge-low");
      badge.hidden = false;

      if (confidence >= 0.8) {
        badge.classList.add("badge-high");
        const resultModelVersion = lastAnalysisResult?.prediction?.model_version || lastAnalysisResult?.model_version || currentModelVersion;
      badgeLabel.textContent = "高置信度 · 鱼眼特征明确，AI 直接给出结果";
      } else if (confidence >= 0.6) {
        badge.classList.add("badge-mid");
      badgeLabel.textContent = "中置信度 · 建议结合感官指标（鳃色、气味、弹性）综合判断";
      } else {
        badge.classList.add("badge-low");
      badgeLabel.textContent = "低置信度 · 建议重新拍摄清晰鱼眼照片以获得准确结果";
      }
    }

    /**
     * 低置信度弹窗
     */
    let confidenceModalCleanup = null;
    let confidenceModalOpener = null;
    function showConfidenceModal(confidence) {
      const modal = document.getElementById("confidenceModal");
      const confSpan = document.getElementById("modalConf");
      if (!modal) return;
      if (confSpan) confSpan.textContent = (confidence * 100).toFixed(1);
      if (confidenceModalCleanup) confidenceModalCleanup();
      confidenceModalOpener = document.activeElement;
      modal.hidden = false;

      const retryBtn = document.getElementById("modalRetry");
      const viewBtn = document.getElementById("modalView");

      // 统一关闭：隐藏弹窗并移除 keydown 监听器，避免重复绑定导致内存泄漏
      const escHandler = (e) => {
        if (e.key === "Escape") closeModal();
      };
      function closeModal() {
        modal.hidden = true;
        document.removeEventListener("keydown", escHandler);
        confidenceModalCleanup = null;
        if (confidenceModalOpener instanceof HTMLElement && document.contains(confidenceModalOpener)) {
          confidenceModalOpener.focus();
        }
      }

      if (retryBtn) {
        retryBtn.onclick = () => {
          closeModal();
          clearImage();
          const uploadZoneEl = document.getElementById("uploadZone");
          if (uploadZoneEl) scrollToTarget(uploadZoneEl);
        };
      }
      if (viewBtn) {
        viewBtn.onclick = () => { closeModal(); };
      }
      document.addEventListener("keydown", escHandler);
      confidenceModalCleanup = () => {
        modal.hidden = true;
        document.removeEventListener("keydown", escHandler);
      };
      requestAnimationFrame(() => retryBtn?.focus());
    }

    /**
     * 更新鲜度等级卡片（文字 + 颜色）
     */
    function updateFreshnessCard(level, label, confidence, modelVersion) {
      const cls = label === 0 ? "freshness-high" : label === 1 ? "freshness-mid" : label === 2 ? "freshness-low" : "freshness-mid";
      freshnessCard.classList.remove("freshness-high", "freshness-mid", "freshness-low");
      freshnessCard.classList.add(cls);
      freshnessLabel.textContent = level;
      const pct = (confidence * 100).toFixed(1);
      freshnessMeta.textContent = `置信度 ${pct}% · ${getModelDisplayName(modelVersion)}`;
    }

    /**
     * 更新置信度环形仪表盘（SVG stroke-dashoffset + countUp）
     */
    function updateConfidenceGauge(score) {
      const CIRC = 2 * Math.PI * 52; // 周长 ≈ 326.7
      const clamped = Math.max(0, Math.min(1, score));
      const offset = CIRC * (1 - clamped);
      gaugeProgress.setAttribute("stroke-dashoffset", offset.toFixed(2));
      gaugeWrap.setAttribute("data-confidence", String(clamped));

      // 根据分数切换渐变
      let gradId = "gaugeGrad";
      if (clamped >= 0.8) gradId = "gaugeGradHigh";
      else if (clamped >= 0.5) gradId = "gaugeGradMid";
      else gradId = "gaugeGradLow";
      gaugeProgress.setAttribute("stroke", `url(#${gradId})`);

      // 数字 countUp 动画
      if (clamped === 0) {
        gaugeNum.textContent = "0.0%";
      } else {
        animateNumber(gaugeNum, 0, clamped * 100, 1000, (v) => `${v.toFixed(1)}%`);
      }
    }

    /**
     * 通用数字滚动动画
     */
    function animateNumber(el, from, to, duration, formatter) {
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = from + (to - from) * eased;
        el.textContent = formatter(val);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = formatter(to);
      }
      requestAnimationFrame(tick);
    }

    /**
     * 更新三类概率分布条
     * 最高概率条添加 is-dominant 发光效果
     */
    function updateProbabilityBars(probs, dominantLabel) {
      const map = { "高度新鲜": { bar: probBarHigh, val: probValHigh, row: document.querySelector(".prob-row.high") }, "新鲜": { bar: probBarMid, val: probValMid, row: document.querySelector(".prob-row.mid") }, "不新鲜": { bar: probBarLow, val: probValLow, row: document.querySelector(".prob-row.low") } };
      // 先清除所有 dominant
      document.querySelectorAll(".prob-row").forEach((r) => r.classList.remove("is-dominant"));
      // 找到最高概率项
      let maxName = "", maxVal = -1;
      for (const [name, els] of Object.entries(map)) {
        const p = typeof probs[name] === "number" ? probs[name] : 0;
        if (p > maxVal) { maxVal = p; maxName = name; }
        const pct = (p * 100).toFixed(1);
        els.bar.style.transform = `scaleX(${p})`;
        els.val.textContent = `${pct}%`;
      }
      // 给最高概率行加发光
      if (map[maxName] && map[maxName].row) {
        map[maxName].row.classList.add("is-dominant");
      }
    }

    /**
     * 更新原图 vs 热力图对比区（滑块结构）
     */
    function updateComparisonView(heatmapBase64) {
      if (compareOriginal && selectedFileDataURL) compareOriginal.src = selectedFileDataURL;
      if (heatmapBase64 && compareHeatmap) {
        compareHeatmap.src = `data:image/jpeg;base64,${heatmapBase64}`;
        compareHeatmap.style.display = "block";
        if (compOverlay) compOverlay.style.display = "block";
        if (compHandle) compHandle.style.display = "block";
        setSliderPos(50);
      } else {
        if (compareHeatmap) compareHeatmap.style.display = "none";
        if (compOverlay) compOverlay.style.display = "none";
        if (compHandle) compHandle.style.display = "none";
      }
    }

    /**
     * 设置对比滑块位置（百分比 0-100）
     */
    function setSliderPos(pct) {
      const p = Math.max(0, Math.min(100, pct));
      if (compOverlay) compOverlay.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      if (compHandle) {
        compHandle.style.left = `${p}%`;
        // 同步 aria-valuenow（整数百分比，供屏幕阅读器播报）
        compHandle.setAttribute("aria-valuenow", String(Math.round(p)));
      }
    }

    /**
     * 初始化对比滑块拖动（pointer events 统一桌面/移动端）
     */
    function initCompareSlider() {
      if (!compareSlider || !compHandle) return;
      let dragging = false;
      const onMove = (e) => {
        if (!dragging) return;
        const rect = compareSlider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSliderPos(pct);
      };
      const stopDrag = () => {
        if (!dragging) return;
        dragging = false;
        compHandle.classList.remove("is-active");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", stopDrag);
        window.removeEventListener("pointercancel", stopDrag);
      };
      const startDrag = (e) => {
        if (dragging) return;
        dragging = true;
        compHandle.classList.add("is-active");
        const rect = compareSlider.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSliderPos(pct);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", stopDrag);
        window.addEventListener("pointercancel", stopDrag);
        e.preventDefault();
      };
      compHandle.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        startDrag(e);
      });
      compareSlider.addEventListener("pointerdown", startDrag);
    }

    /**
     * 更新结构化描述（带置信度前缀）
     */
    function updateDescription(desc, confidence) {
      let prefix = "";
      if (confidence >= 0.8) prefix = "✅ 高置信度分析结果：";
      else if (confidence >= 0.5) prefix = "⚠️ 中置信度分析结果：";
      else prefix = "❌ 低置信度分析结果，建议重新拍摄：";
      descQuote.textContent = prefix + desc;
    }

    /**
     * 根据新鲜度等级动态生成建议
     */
    function updateRecommendations(label, confidence) {
      // 5 大类建议（对齐后端 recommendation_generation 节点）
      const defaultRecs = {
        0: {
          storage: ["0–4°C 冷藏保存", "避免反复解冻", "实际可保存时间取决于鱼种与处理方式"],
          consumption: ["尽快食用获得最佳口感", "清蒸或刺身为优选", "搭配柠檬汁去腥提鲜"],
          handling: ["从冰箱取出后直接处理", "用利刀去除鱼鳞", "清理内脏时保持鱼眼完整"],
          safety: ["鱼眼清澈，仅代表视觉特征较好", "注意检查鳃部是否鲜红", "食用前确认无异味"],
          best: ["购买后 2 小时内处理最佳", "处理前后勤洗手", "使用专用砧板避免交叉污染"]
        },
        1: {
          storage: ["0–4°C 冷藏", "如需长期保存请冷冻", "建议 12 小时内食用"],
          consumption: ["建议尽快处理并充分加热", "推荐红烧或煎炸", "实际食用安排取决于储存条件"],
          handling: ["解冻后在冷水中冲洗", "去除鱼鳃和内脏", "切块烹饪更易入味"],
          safety: ["鱼眼视觉特征一般，不能单独证明安全", "注意观察是否有异味", "烹饪时间适当延长"],
          best: ["尽快处理不宜久放", "冷冻保存前用保鲜膜包裹", "解冻后不要再次冷冻"]
        },
        2: {
          storage: ["不建议继续储存", "如必须保存请深度冷冻", "尽快处理或丢弃"],
          consumption: ["不建议仅凭本结果决定食用", "如有异味或组织异常应避免食用", "必要时咨询专业检验人员"],
          handling: ["佩戴手套处理", "避免接触其他食材", "处理工具需彻底消毒"],
          safety: ["⚠ 鱼眼浑浊，请谨慎对待", "如有异味或异常组织状态应避免食用", "本结果不替代食品安全检测"],
          best: ["购买时注意辨别新鲜度", "选择信誉良好的商家", "保留购买凭证以便追溯"]
        }
      };
      const recs = defaultRecs[label] || defaultRecs[1];
      const fillList = (ulId, items) => {
        const ul = document.getElementById(ulId);
        if (ul) ul.innerHTML = items.map(t => `<li>${escapeHtml(t)}</li>`).join("");
      };
      fillList("adviceStorage", recs.storage);
      fillList("adviceConsumption", recs.consumption);
      fillList("adviceHandling", recs.handling);
      fillList("adviceSafety", recs.safety);
      fillList("adviceBest", recs.best);
    }

    // ============================================================
    //  Tab 切换 / 手风琴 / 历史记录 / 收藏 / 导出 / 引导
    // ============================================================

    const MAX_HISTORY = 50;
    let analysisStartTime = 0;

    // ---- 结果快捷操作 ----
    function initResultShortcuts() {
      showResultDetailsBtn?.addEventListener("click", () => {
        if (!resultDetails) return;
        resultDetails.open = true;
        requestAnimationFrame(() => resultDetails.scrollIntoView({ behavior: "smooth", block: "start" }));
      });
      showAdviceBtn?.addEventListener("click", () => {
        document.querySelector('.report-tab[data-tab="advice"]')?.click();
      });
    }

    // ---- Tab 切换 ----
    function initTabs() {
      const tabs = document.querySelectorAll(".report-tab");
      const panes = document.querySelectorAll(".report-tabpane");

      function updateCompareSliderForTab() {
        requestAnimationFrame(() => {
          if (compareSlider && compOverlay && compHandle) {
            const visionPane = document.querySelector('.report-tabpane[data-pane="vision"]');
            if (visionPane && visionPane.classList.contains("is-active")) {
              const pct = parseInt(compHandle.getAttribute("aria-valuenow") || "50", 10);
              setSliderPos(pct);
            }
          }
        });
      }

      function activateTab(tab) {
        const target = tab.dataset.tab;
        tabs.forEach((t) => {
          const isActive = t === tab;
          t.classList.toggle("is-active", isActive);
          t.setAttribute("aria-selected", isActive ? "true" : "false");
          t.setAttribute("tabindex", isActive ? "0" : "-1");
        });
        panes.forEach((p) => {
          const isActive = p.dataset.pane === target;
          p.classList.toggle("is-active", isActive);
          p.hidden = !isActive;
          p.setAttribute("aria-hidden", isActive ? "false" : "true");
        });
        tab.focus();
        updateCompareSliderForTab();
      }

      tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => activateTab(tab));
        tab.addEventListener("keydown", (e) => {
          let newIndex = null;
          if (e.key === "ArrowRight") {
            newIndex = (index + 1) % tabs.length;
          } else if (e.key === "ArrowLeft") {
            newIndex = (index - 1 + tabs.length) % tabs.length;
          } else if (e.key === "Home") {
            newIndex = 0;
          } else if (e.key === "End") {
            newIndex = tabs.length - 1;
          }
          if (newIndex !== null) {
            e.preventDefault();
            activateTab(tabs[newIndex]);
          }
        });
      });

      tabs.forEach((t) => {
        const isActive = t.classList.contains("is-active");
        t.setAttribute("aria-selected", isActive ? "true" : "false");
        t.setAttribute("tabindex", isActive ? "0" : "-1");
      });
      panes.forEach((p) => {
        const isActive = p.classList.contains("is-active");
        p.hidden = !isActive;
        p.setAttribute("aria-hidden", isActive ? "false" : "true");
      });
    }

    // ---- 手风琴折叠 ----
    function initAccordion() {
      document.querySelectorAll(".accordion-head").forEach((head) => {
        head.addEventListener("click", () => {
          const acc = head.parentElement;
          acc.classList.toggle("is-open");
          head.setAttribute("aria-expanded", acc.classList.contains("is-open") ? "true" : "false");
        });
        head.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            head.click();
          }
        });
      });
    }

    // ---- 历史记录存储 ----
    function loadHistory() {
      try { return JSON.parse(lsGet(HISTORY_KEY) || "[]"); }
      catch (_) { return []; }
    }
    function saveHistory(arr) {
      const retained = arr.slice();
      try {
        while (true) {
          try {
            storage.set(HISTORY_KEY, JSON.stringify(retained));
            memSet(HISTORY_KEY, JSON.stringify(retained));
            return retained;
          } catch (err) {
            if (!retained.length) throw err;
            retained.pop();
          }
        }
      } catch (_) {
        memSet(HISTORY_KEY, JSON.stringify(retained));
        return retained;
      }
    }
    function loadFavorites() {
      try { return JSON.parse(lsGet(FAVORITES_KEY) || "[]"); }
      catch (_) { return []; }
    }
    function saveFavorites(arr) {
      lsSet(FAVORITES_KEY, JSON.stringify(arr));
    }

    /**
     * 生成 UUID v4
     */
    function uuid() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    /**
     * 将图片缩略图压缩为 base64（Canvas 150×150, JPEG q=0.5, <50KB）
     */
    function compressThumbnail(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // 同 compressImageForUpload：现代浏览器已自动应用 EXIF 方向，
          // 直接按解码后尺寸居中裁剪，避免 orientation 5-8 二次旋转。
          const nw = img.naturalWidth, nh = img.naturalHeight;
          const canvas = document.createElement("canvas");
          canvas.width = 150;
          canvas.height = 150;
          const ctx = canvas.getContext("2d");
          const minSide = Math.min(nw, nh);
          const sx = (nw - minSide) / 2;
          const sy = (nh - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 150, 150);
          resolve(canvas.toDataURL("image/jpeg", 0.5));
        };
        img.onerror = () => resolve("");
        img.src = dataUrl;
      });
    }

    /**
     * 添加一条历史记录（自动裁剪到 MAX_HISTORY）
     */
    async function addHistoryRecord(data, durationSec) {
      const pred = data?.prediction || {};
      const thumb = await compressThumbnail(selectedFileDataURL || "");
      // 压缩 Grad-CAM 热力图缩略图，避免 base64 占满 localStorage 配额
      const heatRaw = data?.heatmap_image || "";
      const heatDataUrl = heatRaw ? `data:image/jpeg;base64,${heatRaw}` : "";
      const heatThumb = heatDataUrl ? await compressThumbnail(heatDataUrl) : "";
      const record = {
        id: uuid(),
        timestamp: pred.timestamp || new Date().toISOString(),
        freshnessLevel: pred.freshness_level || "未知",
        freshnessLabel: typeof pred.freshness_label === "number" ? pred.freshness_label : -1,
        confidenceScore: typeof pred.confidence_score === "number" ? pred.confidence_score : 0,
        probabilities: pred.all_probabilities || {},
        description: pred.description || "",
        thumbnail: thumb,
        heatmapThumbnail: heatThumb,
        processingTime: durationSec,
        modelVersion: pred.model_version || data?.model_version || currentModelVersion,
        recommendations: data?.recommendations || null,
      };
      const hist = loadHistory();
      hist.unshift(record);
      // 裁剪到最新 MAX_HISTORY 条
      if (hist.length > MAX_HISTORY) hist.length = MAX_HISTORY;
      const savedHistory = saveHistory(hist);
      const savedRecord = savedHistory.find((item) => item.id === record.id);
      if (!savedRecord) {
        showToast("本地存储空间不足，历史记录未保存", "error", 3000);
        return record;
      }
      // 增量渲染（不重渲染整个列表）
      const item = createHistoryItemElement(savedRecord, loadFavorites().includes(savedRecord.id));
      if (historyList.querySelector(".history-empty")) {
        historyList.innerHTML = "";
      }
      historyList.insertBefore(item, historyList.firstChild);
      while (historyList.children.length > MAX_HISTORY) {
        historyList.removeChild(historyList.lastChild);
      }
      return savedRecord;
    }

    /**
     * 删除一条历史记录
     */
    function deleteHistory(id) {
      const hist = loadHistory().filter((r) => r.id !== id);
      saveHistory(hist);
      const favs = loadFavorites().filter((fid) => fid !== id);
      saveFavorites(favs);
      renderHistory();
    }

    /**
     * 清空全部历史记录（含收藏），带二次确认
     */
    function clearAllHistory() {
      if (loadHistory().length === 0) return;
      if (!confirm("确定清空全部历史记录？此操作不可撤销。")) return;
      saveHistory([]);
      saveFavorites([]);
      renderHistory();
      showToast("已清空全部历史记录", "success", 3000);
    }

    /**
     * 切换收藏
     */
    function toggleFavorite(id) {
      let favs = loadFavorites();
      if (favs.includes(id)) {
        favs = favs.filter((fid) => fid !== id);
      } else {
        favs.push(id);
      }
      saveFavorites(favs);
      renderHistory();
    }

    /**
     * 格式化时间为相对时间（北京时间 UTC+8）
     * <60s 刚刚 / <60min X分钟前 / <24h X小时前 / <48h 昨天 / <7d X天前 / ≥7d MM-DD HH:mm
     */
    const historyTimeFmt = new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
      timeZone: "Asia/Shanghai"
    });
    function parseHistoryDate(iso) {
      if (!iso) return null;
      let str = String(iso);
      // 若无时区标记（Z 或 +/-HH:MM），视为 UTC 时间补 Z 后缀，防止本地时区错误解析
      if (!/[zZ]$/.test(str) && !/[+-]\d{2}:?\d{2}$/.test(str)) {
        str = str.replace(" ", "T") + "Z";
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    }
    function formatHistoryTime(iso) {
      try {
        const d = parseHistoryDate(iso);
        if (!d) return "—";
        const now = Date.now();
        const diffMs = now - d.getTime();
        if (diffMs < 0) return "刚刚"; // 未来时间兜底
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
        if (sec < 60) return "刚刚";
        if (min < 60) return `${min}分钟前`;
        if (hr < 24) return `${hr}小时前`;
        if (day < 2) return "昨天";
        if (day < 7) return `${day}天前`;
        return historyTimeFmt.format(d);
      } catch (_) { return "—"; }
    }
    /**
     * 刷新所有历史记录项的相对时间显示
     */
    function refreshHistoryTimes() {
      document.querySelectorAll(".history-time[data-timestamp]").forEach(el => {
        el.textContent = formatHistoryTime(el.dataset.timestamp);
      });
    }

    /**
     * 创建单条历史记录 DOM 元素（增量渲染用）
     * 移动端左滑露出收藏/删除按钮，桌面端按钮始终可见
     */
    let _swipeOpenItem = null; // 当前左滑展开的项引用
    function createHistoryItemElement(r, isFav) {
      const item = document.createElement("div");
      item.className = "history-item";
      item.dataset.id = r.id;
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.setAttribute("aria-label", `${r.freshnessLevel}，置信度 ${((r.confidenceScore || 0) * 100).toFixed(1)}%，${formatHistoryTime(r.timestamp)}`);
      const cls = r.freshnessLabel === 0 ? "high" : r.freshnessLabel === 1 ? "mid" : r.freshnessLabel === 2 ? "low" : "mid";
      const conf = ((r.confidenceScore || 0) * 100).toFixed(1);
      const thumbSrc = r.thumbnail || "";
      const levelText = escapeHtml(r.freshnessLevel);
      const confText = escapeHtml(conf);
      const timestamp = r.timestamp || "";
      const timeText = escapeHtml(formatHistoryTime(r.timestamp));
      const favClass = isFav ? "is-fav" : "";
      const favText = isFav ? "★" : "☆";
      const favAriaLabel = isFav ? "取消收藏" : "收藏";
      item.innerHTML = `
        <div class="history-content">
          <img class="history-thumb" alt="历史记录鱼眼照片缩略图" src="${escapeHtml(thumbSrc)}" width="56" height="56" loading="lazy" decoding="async" />
          <div class="history-info">
            <div class="history-row1">
              <span class="history-badge ${cls}">
                <span class="history-badge-dot" aria-hidden="true"></span>
                <span class="history-badge-icon" aria-hidden="true">🐟</span>
                <span class="history-badge-text">${levelText}</span>
              </span>
              <span class="history-conf">${confText}%</span>
            </div>
            <div class="history-time" data-timestamp="${escapeHtml(timestamp)}">${timeText}</div>
          </div>
        </div>
        <div class="history-actions">
          <button class="history-btn fav ${favClass}" aria-label="${favAriaLabel}" data-act="fav">${favText}</button>
          <button class="history-btn del" aria-label="删除此记录" data-act="del">🗑</button>
        </div>
      `;
      return item;
    }

    /**
     * 收起当前左滑展开的项
     */
    function _collapseSwipeItem() {
      if (_swipeOpenItem) {
        const content = _swipeOpenItem.querySelector(".history-content");
        if (content) content.style.transform = "";
        _swipeOpenItem = null;
      }
    }

    /**
     * 渲染历史记录列表
     */
    function renderHistory() {
      if (!historyList) return;
      const hist = loadHistory();
      const favs = loadFavorites();
      const favSet = new Set(favs);

      // 搜索 + 过滤
      const searchTerm = (document.getElementById("historySearch")?.value || "").toLowerCase().trim();
      const filterVal = document.getElementById("historyFilter")?.value || "all";

      let filtered = hist;
      if (filterVal === "favorite") {
        filtered = filtered.filter(r => favSet.has(r.id));
      } else if (filterVal !== "all") {
        const labelMap = { high: 0, mid: 1, low: 2 };
        filtered = filtered.filter(r => r.freshnessLabel === labelMap[filterVal]);
      }
      if (searchTerm) {
        filtered = filtered.filter(r =>
          (r.freshnessLevel || "").toLowerCase().includes(searchTerm) ||
          (r.description || "").toLowerCase().includes(searchTerm) ||
          formatHistoryTime(r.timestamp).toLowerCase().includes(searchTerm)
        );
      }

      if (filtered.length === 0) {
        historyList.innerHTML = `<div class="history-empty">${searchTerm || filterVal !== "all" ? "未找到匹配的记录" : "暂无历史记录，上传第一张鱼眼照片开始分析吧！"}</div>`;
        return;
      }
      historyList.innerHTML = "";
      const frag = document.createDocumentFragment();
      filtered.forEach(r => {
        frag.appendChild(createHistoryItemElement(r, favSet.has(r.id)));
      });
      historyList.appendChild(frag);
    }

    /**
     * 从历史记录加载到结果面板
     */
    function loadHistoryToResults(id) {
      const r = loadHistory().find((x) => x.id === id);
      if (!r) return;
      // 构造兼容 updateResults 的数据结构
      const data = {
        heatmap_image: r.heatmapThumbnail || "",
        recommendations: r.recommendations || null,
        prediction: {
          freshness_level: r.freshnessLevel,
          freshness_label: r.freshnessLabel,
          confidence_score: r.confidenceScore,
          all_probabilities: r.probabilities,
          description: r.description,
          timestamp: r.timestamp,
          model_version: r.modelVersion || "v2",
        },
      };
      // 历史记录没有原图 File，使用缩略图作为预览
      selectedFileDataURL = r.thumbnail || "";
      resultsEmpty.style.display = "none";
      resultsPanel.classList.remove("results-hidden");
      resultsPanel.classList.add("results-visible");
      hideLoading();
      lastAnalysisResult = data;
      lastAnalysisResult.__processingTime = r.processingTime;
      updateResults(data, null, { fromHistory: true });
      setAnalyzeDone();
      if (resultHint) resultHint.textContent = "历史记录 · " + formatHistoryTime(r.timestamp);
      metricDuration.textContent = r.processingTime ? `${r.processingTime.toFixed(1)}s` : "—";
      scrollToTarget(resultsSection, { block: "start" });
    }

    // ---- 历史记录事件委托 ----
    function initHistoryEvents() {
      if (!historyList) return;
      historyList.addEventListener("click", (e) => {
        const btn = e.target.closest(".history-btn");
        const item = e.target.closest(".history-item");
        if (!item) return;
        const id = item.dataset.id;
        if (btn) {
          e.stopPropagation();
          const act = btn.dataset.act;
          if (act === "fav") toggleFavorite(id);
          else if (act === "del") deleteHistory(id);
        } else {
          if (_swipeOpenItem && _swipeOpenItem !== item) _collapseSwipeItem();
          loadHistoryToResults(id);
        }
      });
      historyList.addEventListener("keydown", (e) => {
        const item = e.target.closest(".history-item");
        if (!item) return;
        const id = item.dataset.id;
        const btn = e.target.closest(".history-btn");
        if (btn) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            btn.click();
          }
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (_swipeOpenItem && _swipeOpenItem !== item) _collapseSwipeItem();
          loadHistoryToResults(id);
        }
      });
      document.getElementById("historySearch")?.addEventListener("input", debounce(renderHistory, 200));
      document.getElementById("historyFilter")?.addEventListener("change", renderHistory);
      document.getElementById("historyClearBtn")?.addEventListener("click", clearAllHistory);
    }

    // 5 大类建议可折叠
    function initAdviceExpandable() {
      document.querySelectorAll(".advice-card-expandable .advice-head").forEach(head => {
        head.addEventListener("click", () => {
          const card = head.parentElement;
          card.classList.toggle("is-expanded");
          head.setAttribute("aria-expanded", card.classList.contains("is-expanded") ? "true" : "false");
        });
        head.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            head.click();
          }
        });
      });
    }

    // ---- 导出 PDF 报告（专业排版） ----
    // 将 File 转为 base64 DataURL（保证在新窗口中可用，避免 blob URL 失效）
    function fileToDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function compressDataURL(dataURL, maxDim, quality) {
      return new Promise((resolve) => {
        if (!dataURL) { resolve(""); return; }
        const img = new Image();
        img.onload = () => {
          let { naturalWidth: w, naturalHeight: h } = img;
          if (w <= maxDim && h <= maxDim && dataURL.startsWith('data:image/jpeg')) { resolve(dataURL); return; }
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const tw = Math.round(w * scale);
          const th = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = tw; canvas.height = th;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, tw, th);
          try { resolve(canvas.toDataURL('image/jpeg', quality)); }
          catch(e) { resolve(''); }
        };
        img.onerror = () => resolve("");
        img.src = dataURL;
      });
    }
    function compressImgElement(imgEl, maxDim, quality) {
      return new Promise((resolve) => {
        const rawSrc = imgEl?.getAttribute("src");
        if (!imgEl || !rawSrc || rawSrc === '' || rawSrc === '#') { resolve(''); return; }
        // 安全白名单：仅允许 data:image/(jpeg|png|webp) 或 http(s) 资源进入导出文档，
        // 防止后端返回的异常 payload 被原样透传进导出 HTML 的属性上下文。
        const isSafeScheme = /^data:image\/(jpeg|png|webp);base64,/i.test(rawSrc)
          || /^https?:\/\//i.test(rawSrc);
        if (!isSafeScheme) { resolve(''); return; }
        if (rawSrc.startsWith('data:')) { resolve(compressDataURL(rawSrc, maxDim, quality)); return; }
        try {
          const w = imgEl.naturalWidth || 400;
          const h = imgEl.naturalHeight || 400;
          if (!w || !h) { resolve(rawSrc); return; }
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const tw = Math.round(w * scale);
          const th = Math.round(h * scale);
          const canvas = document.createElement('canvas');
          canvas.width = tw; canvas.height = th;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgEl, 0, 0, tw, th);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch(e) { resolve(''); }
      });
    }

    async function exportPDF() {
      if (!lastAnalysisResult) {
        showToast("暂无可导出的分析结果", "error");
        return;
      }
      // 同步打开窗口（必须在用户手势同步调用中，否则浏览器弹窗拦截器会拦截 async/await 后的 window.open）
      const win = window.open("", "_blank");
      const popupBlocked = !win;
      if (win) {
        win.opener = null;
        // 写入加载占位（同步，避免 about:blank 空白）
        win.document.write('<!doctype html><meta charset="utf-8"><title>生成 PDF 报告</title><div style="font-family:-apple-system,sans-serif;text-align:center;padding:60px;color:#4a5e6e;"><p style="font-size:16px;">正在生成 PDF 报告…</p></div>');
        win.document.close();
      }
      const originalHtml = exportPdfBtn.innerHTML;
      exportPdfBtn.disabled = true;
      exportPdfBtn.classList.add("is-loading");
      exportPdfBtn.innerHTML = '<span class="btn-export-spinner" aria-hidden="true"></span> 生成中…';
      let blobUrl = null;
      try {
      const pred = lastAnalysisResult.prediction || lastAnalysisResult;
      const level = pred.freshness_level || "—";
      const conf = typeof pred.confidence_score === "number" ? (pred.confidence_score * 100).toFixed(1) : "—";
      const probs = pred.all_probabilities || {};
      const desc = softenSafetyLanguage(pred.description || "—");
      const modelVersion = pred.model_version || lastAnalysisResult.model_version || currentModelVersion;
      const model = modelVersion === "v2" ? "FishFreshNetV2（高精度版）" : "FishFreshNetV1（经典版）";
      const softwareVersion = "FreshEye Web 2026.08";
      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const duration = lastAnalysisResult.__processingTime ? `${lastAnalysisResult.__processingTime.toFixed(1)}s` : "—";

      exportPdfBtn.innerHTML = '<span class="btn-export-spinner" aria-hidden="true"></span> 压缩图片…';
      let rawImgSrc = "";
      if (selectedFileDataURL) {
        rawImgSrc = selectedFileDataURL;
      } else if (selectedFile) {
        try { rawImgSrc = await fileToDataURL(selectedFile); } catch (e) { rawImgSrc = ""; }
      }
      const [imgSrc, heatmapSrc] = await Promise.all([
        compressDataURL(rawImgSrc, 600, 0.82),
        compressImgElement(compareHeatmap, 600, 0.82)
      ]);
      exportPdfBtn.innerHTML = '<span class="btn-export-spinner" aria-hidden="true"></span> 生成报告…';

      const pdfDefaultRecs = {
        0: {
          storage: ["0–4°C 冷藏保存", "避免反复解冻", "实际可保存时间取决于鱼种与处理方式"],
          consumption: ["尽快食用获得最佳口感", "清蒸或刺身为优选", "搭配柠檬汁去腥提鲜"],
          handling: ["从冰箱取出后直接处理", "用利刀去除鱼鳞", "清理内脏时保持鱼眼完整"],
          safety: ["鱼眼清澈，仅代表视觉特征较好", "注意检查鳃部是否鲜红", "食用前确认无异味"],
          best: ["购买后 2 小时内处理最佳", "处理前后勤洗手", "使用专用砧板避免交叉污染"]
        },
        1: {
          storage: ["0–4°C 冷藏", "如需长期保存请冷冻", "建议 12 小时内食用"],
          consumption: ["建议尽快处理并充分加热", "推荐红烧或煎炸", "实际食用安排取决于储存条件"],
          handling: ["解冻后在冷水中冲洗", "去除鱼鳃和内脏", "切块烹饪更易入味"],
          safety: ["鱼眼视觉特征一般，不能单独证明安全", "注意观察是否有异味", "烹饪时间适当延长"],
          best: ["尽快处理不宜久放", "冷冻保存前用保鲜膜包裹", "解冻后不要再次冷冻"]
        },
        2: {
          storage: ["不建议继续储存", "如必须保存请深度冷冻", "尽快处理或丢弃"],
          consumption: ["不建议仅凭本结果决定食用", "如有异味或组织异常应避免食用", "必要时咨询专业检验人员"],
          handling: ["佩戴手套处理", "避免接触其他食材", "处理工具需彻底消毒"],
          safety: ["⚠ 鱼眼浑浊，请谨慎对待", "如有异味或异常组织状态应避免食用", "本结果不替代食品安全检测"],
          best: ["购买时注意辨别新鲜度", "选择信誉良好的商家", "保留购买凭证以便追溯"]
        }
      };
      const rawRecs = lastAnalysisResult.recommendations || pdfDefaultRecs[pred.freshness_label ?? 0] || {};
      const recs = Object.fromEntries(Object.entries(rawRecs).map(([key, values]) => [
        key,
        Array.isArray(values) ? values.map(softenSafetyLanguage) : values
      ]));
      const bestPractices = recs.best_practices || recs.best || [];
      const buildRecList = (items) => (items || []).map(i => `<li>${escapeHtml(i)}</li>`).join("");

      const stateLabel = pred.freshness_label ?? 0;
      const stateColors = {
        0: { primary: '#10b981', bg: '#ecfdf5', deep: '#065f46', badgeBg: '#d1fae5', name: '高度新鲜', icon: '✓' },
        1: { primary: '#d97706', bg: '#fffbeb', deep: '#92400e', badgeBg: '#fef3c7', name: '新鲜', icon: '!' },
        2: { primary: '#ef4444', bg: '#fef2f2', deep: '#991b1b', badgeBg: '#fee2e2', name: '不新鲜', icon: '⚠' }
      };
      const sc = stateColors[stateLabel] || stateColors[0];

      function tagKeywords(text) {
        let safe = escapeHtml(text);
        const kwList = [
          ["食品安全风险", "pdf-tag-danger"],
          ["不建议储存", "pdf-tag-danger"],
          ["不建议食用", "pdf-tag-danger"],
          ["禁止食用", "pdf-tag-danger"],
          ["失去光泽", "pdf-tag-danger"],
          ["自然光泽", "pdf-tag-safe"],
          ["匹配度高", "pdf-tag-safe"],
          ["放心食用", "pdf-tag-safe"],
          ["尚可辨认", "pdf-tag-warn"],
          ["立即丢弃", "pdf-tag-warn"],
          ["略浑浊", "pdf-tag-warn"],
          ["无光泽", "pdf-tag-danger"],
          ["不透明", "pdf-tag-danger"],
          ["浑浊", "pdf-tag-danger"],
          ["模糊", "pdf-tag-danger"],
          ["异味", "pdf-tag-warn"],
          ["清澈", "pdf-tag-safe"],
          ["透明", "pdf-tag-safe"],
          ["清晰", "pdf-tag-safe"]
        ];
        for (const [kw, cls] of kwList) {
          safe = safe.split(kw).join(`<span class="pdf-tag ${cls}">${kw}</span>`);
        }
        return safe;
      }

      const taggedDesc = tagKeywords(desc);
      const kgMatch = pred.freshness_label === 0
        ? "视觉特征对照：角膜透明、瞳孔清晰、表面有自然光泽。当前样本接近高度新鲜样本。"
        : pred.freshness_label === 1
        ? "视觉特征对照：角膜略浑浊、瞳孔尚可辨认。当前样本与中等新鲜度特征匹配。"
        : "视觉特征对照：角膜浑浊、瞳孔模糊、表面失去光泽。当前样本与不新鲜特征匹配。";
      const taggedKgMatch = tagKeywords(kgMatch);

      let trendHtml;
      if (stateLabel === 2) {
        trendHtml = '<span class="pdf-tag pdf-tag-danger">视觉特征明显不新鲜</span>，建议避免食用；本结果不能替代食品安全检验。';
      } else if (stateLabel === 0) {
        trendHtml = '当前视觉状态接近高度新鲜样本。实际可保存时间取决于鱼种、储存温度与处理方式，本结果不作为保质期或食品安全证明。';
      } else {
        trendHtml = '当前视觉状态处于中等新鲜度范围。建议尽快处理，实际可保存时间取决于储存温度、鱼种与处理方式。';
      }

      const pHigh = (probs["高度新鲜"] ?? 0) * 100;
      const pMid = (probs["新鲜"] ?? 0) * 100;
      const pLow = (probs["不新鲜"] ?? 0) * 100;
      const highPct = pHigh.toFixed(1);
      const midPct = pMid.toFixed(1);
      const lowPct = pLow.toFixed(1);
      const highPctNum = parseFloat(highPct);
      const midPctNum = parseFloat(midPct);
      const lowPctNum = parseFloat(lowPct);

      function buildSeg(pct, pctNum, label, color) {
        const showText = pctNum >= 10;
        const minW = pctNum > 0 ? '24px' : '0';
        return `<div class="pdf-bar-seg" style="flex:${pctNum};min-width:${minW};background:${color};">${showText ? `<span class="pdf-seg-text">${label} ${pct}%</span>` : ''}</div>`;
      }
      const probsHtml = buildSeg(highPct, highPctNum, '高度新鲜', stateColors[0].primary) + buildSeg(midPct, midPctNum, '新鲜', stateColors[1].primary) + buildSeg(lowPct, lowPctNum, '不新鲜', stateColors[2].primary);

      const safetyClean = (recs.safety || []).map(item => {
        const cleaned = item.replace(/^[⚠️🍽❄🔪✨⭐\s!！]+/u, '').trim();
        return cleaned;
      });
      const safetyItems = safetyClean.map(item => {
        const isDanger = /禁止|立即丢弃/.test(item);
        if (isDanger) {
          return `<li style="color:${sc.deep};font-weight:600;">${escapeHtml(item)}</li>`;
        }
        return `<li>${escapeHtml(item)}</li>`;
      }).join('');

      const imgBlock = imgSrc
        ? `<div class="pdf-img-block"><div class="pdf-img-wrap"><img src="${escapeHtml(imgSrc)}" alt="鱼眼照片" width="200" height="200"></div><div class="pdf-caption">原始视觉捕获</div></div>`
        : `<div class="pdf-img-block"><div class="pdf-img-empty">无图片</div></div>`;
      const heatBlock = heatmapSrc
        ? `<div class="pdf-img-block"><div class="pdf-img-wrap"><img src="${escapeHtml(heatmapSrc)}" alt="AI 关注区域热力图" width="200" height="200"></div><div class="pdf-caption">AI 判断依据区域</div></div>`
        : '';

      // 报告内常驻工具栏：显式打印 / 下载 / 关闭，覆盖自动打印被拦截的场景（移动端常见）
      const PDF_TOOLBAR = `<div class="pdf-toolbar" id="pdfToolbar">
  <span class="pdf-toolbar-title">鲜眸 · FreshEye · AI 辅助评估报告</span>
  <span class="pdf-toolbar-actions">
    <button type="button" class="pdf-tb-btn pdf-tb-print" id="pdfPrintBtn">打印 / 存为 PDF</button>
    <button type="button" class="pdf-tb-btn" id="pdfDownloadBtn">下载报告 HTML</button>
    <button type="button" class="pdf-tb-btn pdf-tb-close" id="pdfCloseBtn">关闭</button>
  </span>
</div>`;

      let fullHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">
  <title>鲜眸 · FreshEye AI 辅助评估报告</title>
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; min-width: 0; background: #e8f0f4; }
  body { margin: 0; padding: 0; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif; color: #1e293b; font-size: 10.5px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-variant-numeric: tabular-nums; }
  .pdf-page { position: relative; display: flex; flex-direction: column; width: 210mm; min-height: 297mm; margin: 16px auto; padding: 15mm 12mm 10mm; overflow: hidden; background: #fff; border: 1px solid #d9e4ea; box-shadow: 0 12px 34px rgba(15, 23, 42, 0.12); page-break-inside: avoid; break-inside: avoid; }
  .pdf-page::before { content: ""; position: absolute; inset: 0 0 auto; height: 5px; background: linear-gradient(90deg, ${sc.deep}, ${sc.primary}, #34d3c2 72%, #d8fbf5); }
  .pdf-section { margin-bottom: 14px; }
  .pdf-section-title { font-size: 12.5px; font-weight: 750; color: #1e293b; margin-bottom: 8px; letter-spacing: 0.3px; display: flex; align-items: center; gap: 7px; }
  .pdf-section-title::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, #e2e8f0, transparent); }
  .pdf-section-mark { display: inline-grid; place-items: center; width: 24px; height: 19px; border-radius: 5px; background: ${sc.primary}; color: #fff; font-size: 8px; letter-spacing: 0.4px; box-shadow: 0 2px 5px ${sc.primary}35; }
  .pdf-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 11px; }
  .pdf-header-brand { flex: 1; color: #0f172a; letter-spacing: -0.3px; }
  .pdf-brand-main { font-size: 16px; font-weight: 800; line-height: 1.25; }
  .pdf-brand-sub { margin-top: 3px; font-size: 8.5px; color: ${sc.deep}; font-weight: 650; letter-spacing: 0.35px; }
  .pdf-header-title { flex: 1.4; padding-top: 1px; text-align: center; color: #0f172a; letter-spacing: 0.5px; }
  .pdf-title-kicker { display: block; margin-bottom: 3px; color: #94a3b8; font-size: 7.5px; font-weight: 700; letter-spacing: 1.4px; }
  .pdf-title-main { display: block; font-size: 15px; font-weight: 700; line-height: 1.25; }
  .pdf-header-meta { font-size: 8px; color: #64748b; text-align: right; line-height: 1.6; flex: 1.2; display: flex; gap: 6px; justify-content: flex-end; flex-wrap: wrap; }
  .pdf-meta-tag { background: #f5f9fb; border: 1px solid #e5eef2; padding: 3px 7px; border-radius: 5px; white-space: nowrap; font-size: 8px; }
  .pdf-meta-tag strong { color: #475569; font-weight: 600; }
  .pdf-header-divider { height: 1px; background: linear-gradient(90deg, ${sc.primary}, #dbeafe, transparent); border: none; margin: 0 0 15px 0; }
  .pdf-overview { display: flex; gap: 10px; margin-bottom: 0; align-items: stretch; }
  .pdf-images { flex: 0 0 56%; display: flex; gap: 8px; }
  .pdf-img-block { flex: 1; display: flex; flex-direction: column; }
  .pdf-img-wrap { aspect-ratio: 1; padding: 3px; border-radius: 10px; overflow: hidden; background: #fff; box-shadow: 0 5px 14px rgba(15, 23, 42, 0.09); border: 1px solid #dce9ee; }
  .pdf-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pdf-img-empty { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; color: #94a3b8; font-size: 10px; border-radius: 8px; border: 1px dashed #e2e8f0; }
  .pdf-caption { font-size: 8px; color: #7c93a1; text-align: center; margin-top: 5px; font-weight: 600; }
  .pdf-conclusion { position: relative; flex: 1; border-radius: 12px; padding: 13px 15px 12px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08); border: 1px solid ${sc.primary}35; overflow: hidden; }
  .pdf-conclusion::after { content: ""; position: absolute; right: -26px; top: -32px; width: 92px; height: 92px; border: 1px solid ${sc.primary}35; border-radius: 50%; box-shadow: 0 0 0 12px ${sc.primary}10, 0 0 0 24px ${sc.primary}08; }
  .pdf-conclusion-kicker { position: relative; z-index: 1; margin-bottom: 8px; color: #64748b; font-size: 8.5px; font-weight: 700; letter-spacing: 0.55px; }
  .pdf-level-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-bottom: 6px; align-self: flex-start; letter-spacing: 0.3px; }
  .pdf-badge-icon { margin-right: 3px; }
  .pdf-conf-label { position: relative; z-index: 1; margin: 1px 0 1px; color: #64748b; font-size: 8.5px; }
  .pdf-conf-num { position: relative; z-index: 1; font-size: 36pt; font-weight: 750; line-height: 1.05; margin-bottom: 8px; font-variant-numeric: tabular-nums; letter-spacing: -1px; }
  .pdf-conf-bar-wrap { margin-bottom: 5px; }
  .pdf-conf-bar { height: 7px; background: #e1e9ed; border-radius: 999px; overflow: hidden; }
  .pdf-conf-bar-fill { height: 100%; border-radius: 999px; }
  .pdf-conf-meta { font-size: 8.5px; color: #94a3b8; line-height: 1.4; }
  .pdf-conclusion-foot { position: relative; z-index: 1; margin-top: 8px; padding-top: 7px; border-top: 1px solid ${sc.primary}25; color: ${sc.deep}; font-size: 8px; font-weight: 650; }
  .pdf-stacked-bar { display: flex; height: 27px; border-radius: 999px; overflow: hidden; margin-bottom: 7px; box-shadow: 0 3px 8px rgba(15, 23, 42, 0.08); }
  .pdf-bar-seg { display: flex; align-items: center; justify-content: center; }
  .pdf-seg-text { font-size: 9px; font-weight: 700; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.25); white-space: nowrap; padding: 0 8px; font-variant-numeric: tabular-nums; letter-spacing: 0.2px; }
  .pdf-bar-legend { display: flex; gap: 14px; justify-content: center; font-size: 9px; color: #64748b; flex-wrap: wrap; }
  .pdf-legend-item { display: flex; align-items: center; gap: 4px; }
  .pdf-legend-dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; flex-shrink: 0; }
  .pdf-section-note { margin-top: 7px; text-align: center; color: #94a3b8; font-size: 8.5px; }
  .pdf-detail { background: #f8fafc; border: 1px solid #e7eff3; border-left: 3px solid ${sc.primary}; padding: 8px 11px; margin-bottom: 6px; border-radius: 0 8px 8px 0; font-size: 10px; line-height: 1.65; color: #475569; }
  .pdf-detail strong { color: #1e293b; font-weight: 600; }
  .pdf-tag { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 600; margin: 0 1px; line-height: 1.5; }
  .pdf-tag-danger { background: #fee2e2; color: #991b1b; }
  .pdf-tag-warn { background: #fef3c7; color: #92400e; }
  .pdf-tag-safe { background: #d1fae5; color: #065f46; }
  .pdf-safety-banner { grid-column: 1 / -1; border-radius: 10px; padding: 11px 13px; box-shadow: 0 5px 14px rgba(15, 23, 42, 0.07); border: 1px solid rgba(0,0,0,0.04); }
  .pdf-safety-banner.is-danger { border-left: 4px solid #ef4444; background-color: #fef2f2; }
  .pdf-safety-banner.is-warn { border-left: 4px solid #f59e0b; }
  .pdf-safety-banner.is-safe { border-left: 4px solid #10b981; }
  .pdf-safety-title { font-size: 11px; font-weight: 600; margin-bottom: 5px; display: flex; align-items: center; color: #334155; }
  .pdf-svg-icon { width: 14px; height: 14px; vertical-align: middle; margin-right: 4px; flex-shrink: 0; }
  .pdf-safety-list { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 2px 16px; }
  .pdf-safety-list li { font-size: 9.5px; color: #475569; line-height: 1.55; padding-left: 10px; position: relative; }
  .pdf-safety-list li::before { content: "•"; position: absolute; left: 1px; color: ${sc.primary}; font-weight: 700; }
  .pdf-advice-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 11px; align-items: stretch; }
  .pdf-advice-card { position: relative; background: linear-gradient(145deg, #fbfdfe, #f5f9fb); border-radius: 10px; padding: 12px 12px 10px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); border: 1px solid #e3edf1; display: flex; flex-direction: column; overflow: hidden; }
  .pdf-advice-card::before { content: ""; position: absolute; left: 0; top: 0; width: 100%; height: 3px; background: linear-gradient(90deg, ${sc.primary}, ${sc.primary}15); }
  .pdf-advice-title { font-size: 10.5px; font-weight: 600; color: #334155; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .pdf-advice-card ul { list-style: none; padding: 0; margin: 0; }
  .pdf-advice-card li { font-size: 9px; color: #64748b; line-height: 1.55; padding-left: 9px; position: relative; margin-bottom: 1px; }
  .pdf-advice-card li::before { content: "•"; position: absolute; left: 1px; color: ${sc.primary}; font-weight: 700; font-size: 10px; }
  .pdf-continuation { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; padding-bottom: 10px; border-bottom: 1px solid #dbe7ec; color: #0f172a; font-size: 13px; font-weight: 700; }
  .pdf-continuation .pdf-section-mark { width: 26px; height: 21px; }
  .pdf-scope-note { margin-top: 14px; padding: 11px 13px; border: 1px solid #cbdde3; border-left: 4px solid #0f766e; border-radius: 9px; background: linear-gradient(135deg, #f7fbfc, #f1f7f8); color: #475569; font-size: 9px; line-height: 1.65; }
  .pdf-scope-note strong { display: block; margin-bottom: 3px; color: #0f172a; font-size: 10px; }
  .pdf-page-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #dfe9ed; text-align: center; color: #94a3b8; font-size: 8.5px; letter-spacing: 0.3px; }
  .pdf-footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #dfe9ed; text-align: center; }
  .pdf-footer-main { font-size: 8.5px; color: #94a3b8; letter-spacing: 0.3px; }
  .pdf-footer-sub { font-size: 7.5px; color: #cbd5e1; margin-top: 1px; }
  .pdf-single-page .pdf-section { margin-bottom: 10px; }
  .pdf-single-page .pdf-header-divider { margin-bottom: 11px; }
  .pdf-single-page .pdf-detail { padding-block: 6px; margin-bottom: 4px; }
  .pdf-single-page .pdf-continuation { margin-top: 1px; margin-bottom: 10px; padding-bottom: 7px; }
  .pdf-single-page .pdf-scope-note { margin-top: 9px; padding-block: 8px; }
  .pdf-single-page .pdf-footer { padding-top: 7px; }
  .pdf-toolbar { position: sticky; top: 0; z-index: 999; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: linear-gradient(90deg, #0f766e, #0e7490); color: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.18); }
  .pdf-toolbar-title { font-size: 13px; font-weight: 700; }
  .pdf-toolbar-actions { display: flex; gap: 8px; }
  .pdf-tb-btn { border: none; cursor: pointer; font-size: 12px; font-weight: 600; padding: 8px 12px; min-height: 36px; border-radius: 7px; color: #0f172a; background: #fff; transition: transform .15s ease, box-shadow .15s ease; }
  .pdf-tb-btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.2); }
  .pdf-tb-print { background: #fde68a; }
  .pdf-tb-close { background: rgba(255,255,255,0.85); }
  @media (max-width: 640px) {
    .pdf-toolbar { flex-direction: column; align-items: stretch; gap: 8px; padding: 10px 12px; }
    .pdf-toolbar-title { text-align: center; }
    .pdf-toolbar-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
    .pdf-tb-btn { min-height: 44px; padding-inline: 8px; }
    .pdf-page { width: calc(100vw - 20px); min-height: auto; margin: 10px auto; padding: 20px 16px 16px; box-shadow: 0 5px 18px rgba(15, 23, 42, 0.12); }
    .pdf-header { display: grid; grid-template-columns: 1fr; gap: 6px; align-items: start; }
    .pdf-header-title { text-align: left; order: -1; font-size: 16px; }
    .pdf-brand-main { font-size: 14px; }
    .pdf-header-meta { justify-content: flex-start; text-align: left; }
    .pdf-overview { flex-direction: column; }
    .pdf-images { flex: initial; }
    .pdf-advice-grid { grid-template-columns: 1fr; }
    .pdf-conf-num { font-size: 32pt; }
  }
  @media print {
    html, body { width: auto; background: #fff; }
    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pdf-page { width: 210mm; max-width: none; min-height: 297mm; margin: 0; padding: 15mm 12mm 10mm; border: 0; box-shadow: none; page-break-inside: avoid; }
    .pdf-toolbar { display: none !important; }
  }
  .pdf-section, .pdf-safety-banner, .pdf-advice-card, .pdf-conclusion, .pdf-overview, .pdf-scope-note { page-break-inside: avoid; break-inside: avoid; }
</style></head><body>
<div class="pdf-page pdf-single-page">
  <div class="pdf-header">
    <div class="pdf-header-brand">
      <div class="pdf-brand-main">鲜眸 · FreshEye</div>
      <div class="pdf-brand-sub">AI 视觉新鲜度辅助评估</div>
    </div>
    <div class="pdf-header-title">
      <span class="pdf-title-kicker">VISION FRESHNESS REPORT</span>
      <strong class="pdf-title-main">水产品新鲜度分析报告</strong>
    </div>
    <div class="pdf-header-meta">
  <span class="pdf-meta-tag"><strong>模型版本</strong> ${escapeHtml(model)}</span>
      <span class="pdf-meta-tag"><strong>耗时</strong> ${escapeHtml(duration)}</span>
      <span class="pdf-meta-tag"><strong>时间</strong> ${escapeHtml(ts)}</span>
    </div>
  </div>
  <hr class="pdf-header-divider">

  <div class="pdf-section">
    <h3 class="pdf-section-title"><span class="pdf-section-mark">01</span>分析结果概览</h3>
    <div class="pdf-overview">
      <div class="pdf-images">
        ${imgBlock}
        ${heatBlock}
      </div>
      <div class="pdf-conclusion" style="background:${sc.bg};">
        <div class="pdf-conclusion-kicker">本次分析结论</div>
        <div class="pdf-level-badge" style="background:${sc.badgeBg};color:${sc.deep};">
          <span class="pdf-badge-icon">${sc.icon}</span> ${escapeHtml(level)}
        </div>
        <div class="pdf-conf-label">视觉新鲜度置信度</div>
        <div class="pdf-conf-num" style="color:${sc.primary};">${escapeHtml(conf)}<span style="font-size:18pt;font-weight:600;vertical-align:super;">%</span></div>
        <div class="pdf-conf-bar-wrap">
          <div class="pdf-conf-bar"><div class="pdf-conf-bar-fill" style="width:${escapeHtml(conf)}%;background:${sc.primary};"></div></div>
        </div>
        <div class="pdf-conf-meta">模型分数 · ${escapeHtml(model)} · AI 可解释性分析</div>
        <div class="pdf-conclusion-foot">基于单张鱼眼图像的视觉辅助判断</div>
      </div>
    </div>
  </div>

  <div class="pdf-section">
  <h3 class="pdf-section-title"><span class="pdf-section-mark">02</span>三种视觉分类概率</h3>
    <div class="pdf-stacked-bar">
      ${probsHtml}
    </div>
    <div class="pdf-bar-legend">
      <span class="pdf-legend-item"><span class="pdf-legend-dot" style="background:${stateColors[0].primary};"></span>高度新鲜 ${highPct}%</span>
      <span class="pdf-legend-item"><span class="pdf-legend-dot" style="background:${stateColors[1].primary};"></span>新鲜 ${midPct}%</span>
      <span class="pdf-legend-item"><span class="pdf-legend-dot" style="background:${stateColors[2].primary};"></span>不新鲜 ${lowPct}%</span>
    </div>
    <div class="pdf-section-note">概率表示模型对本次图像的相对判断，不等同于食品安全概率</div>
  </div>

  <div class="pdf-section">
    <h3 class="pdf-section-title"><span class="pdf-section-mark">03</span>视觉特征与 AI 依据</h3>
    <div class="pdf-detail" style="border-left-color:${sc.primary};">
      <strong>鱼眼外观评估：</strong>${taggedDesc}
    </div>
    <div class="pdf-detail">
      <strong>趋势预测：</strong>${trendHtml}
    </div>
    <div class="pdf-detail">
      <strong>视觉特征对照：</strong>${taggedKgMatch}
    </div>
  </div>
  <div class="pdf-continuation"><span class="pdf-section-mark">04</span>处理建议与使用边界</div>
  <div class="pdf-section">
    <h3 class="pdf-section-title"><span class="pdf-section-mark">04</span>延伸处置与消费指引</h3>
    <p class="pdf-section-note" style="margin: -2px 0 9px; text-align: left;">以下内容用于辅助记录与后续复核，请结合实际气味、组织状态和储存条件判断。</p>
    <div class="pdf-advice-grid">
      <div class="pdf-safety-banner ${stateLabel === 2 ? 'is-danger' : stateLabel === 1 ? 'is-warn' : 'is-safe'}" style="background:${sc.bg};">
        <div class="pdf-safety-title" style="color:${sc.deep};">
          <svg class="pdf-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ${stateLabel === 2 ? '谨慎提示' : stateLabel === 1 ? '进一步确认' : '视觉特征较好'}
        </div>
        <ul class="pdf-safety-list">${safetyItems}</ul>
      </div>
      <div class="pdf-advice-card">
        <h4 class="pdf-advice-title">
          <svg class="pdf-svg-icon" viewBox="0 0 24 24" fill="none" stroke="${sc.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M8 6h8a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"/><line x1="2" y1="10" x2="6" y2="10"/><line x1="18" y1="10" x2="22" y2="10"/></svg>
          ❄ 储存建议
        </h4>
        <ul>${buildRecList(recs.storage)}</ul>
      </div>
      <div class="pdf-advice-card">
        <h4 class="pdf-advice-title">
          <svg class="pdf-svg-icon" viewBox="0 0 24 24" fill="none" stroke="${sc.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
          🍽 食用建议
        </h4>
        <ul>${buildRecList(recs.consumption)}</ul>
      </div>
      <div class="pdf-advice-card">
        <h4 class="pdf-advice-title">
          <svg class="pdf-svg-icon" viewBox="0 0 24 24" fill="none" stroke="${sc.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          🔪 加工建议
        </h4>
        <ul>${buildRecList(recs.handling)}</ul>
      </div>
      <div class="pdf-advice-card">
        <h4 class="pdf-advice-title">
          <svg class="pdf-svg-icon" viewBox="0 0 24 24" fill="none" stroke="${sc.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ✓ 最佳实践
        </h4>
        <ul>${buildRecList(bestPractices)}</ul>
      </div>
    </div>
  </div>

  <div class="pdf-scope-note"><strong>使用边界</strong>　本报告基于单张鱼眼图像，描述的是视觉新鲜度特征。参考 GB 2733-2015 中动物性水产品感官要求，但不构成法定食品检验、质量合格证明或食用安全保证；如有异味、组织异常或储存条件不明，请结合其他感官指标与专业意见判断。</div>

  <div class="pdf-footer">
    <div class="pdf-footer-main">鲜眸 · FreshEye · AI 视觉新鲜度辅助评估 · 第 1 页 / 共 1 页</div>
    <div class="pdf-footer-sub">参考 GB 2733-2015 中动物性水产品感官要求；验证范围：MFED 4800 张 / 2 种淡水鱼 / 4 种环境，FFE 81.18% · ${escapeHtml(model)} · ${escapeHtml(softwareVersion)} · ${escapeHtml(ts)}</div>
    <div class="pdf-footer-sub">本报告仅基于上传图像生成，不构成法定食品检验、质量合格证明或食用安全保证。</div>
  </div>
</div>
</body></html>`;

      // 将工具栏注入报告（仅在 <body> 后插入，报告样式与内容不变）
      fullHtml = fullHtml.replace("<body>", "<body>" + PDF_TOOLBAR);

      exportPdfBtn.innerHTML = '<span class="btn-export-spinner" aria-hidden="true"></span> 打开预览…';
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      blobUrl = URL.createObjectURL(blob);

      // 弹出窗口被拦截（常见于移动端 Safari / 严格隐私设置）→ 退化为本页下载报告
      if (popupBlocked) {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "FreshEye_新鲜度报告_" + ts.replace(/[\s:]/g, "_") + ".html";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => { if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; } }, 60000);
        showToast("浏览器拦截了预览窗口，已为你下载报告文件，用浏览器打开后可「打印 → 另存为 PDF」", "info", 5000);
        return;
      }

      win.location.href = blobUrl;
      win.document.title = "FreshEye_新鲜度报告_" + ts.replace(/[\s:]/g, "_");

      // 报告页不内嵌 inline script，避免被严格 CSP 或移动浏览器拦截；由主窗口在 Blob 页面加载后绑定工具栏。
      const bindReportToolbar = () => {
        if (!win || win.closed) return;
        try {
          const printBtn = win.document.getElementById("pdfPrintBtn");
          const downloadBtn = win.document.getElementById("pdfDownloadBtn");
          const closeBtn = win.document.getElementById("pdfCloseBtn");
          if (!printBtn || !downloadBtn || !closeBtn) {
            setTimeout(bindReportToolbar, 120);
            return;
          }
          if (printBtn.dataset.bound === "true") return;
          printBtn.dataset.bound = "true";
          printBtn.addEventListener("click", () => {
            win.focus();
            win.print();
          });
          downloadBtn.addEventListener("click", () => {
            const reportBlob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
            const reportUrl = URL.createObjectURL(reportBlob);
            const link = document.createElement("a");
            link.href = reportUrl;
            link.download = "FreshEye_新鲜度报告_" + ts.replace(/[\s:]/g, "_") + ".html";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(reportUrl), 4000);
          });
          closeBtn.addEventListener("click", () => win.close());
        } catch (_) {
          setTimeout(bindReportToolbar, 120);
        }
      };
      bindReportToolbar();

      // 桌面端保留自动打印；触屏设备先展示报告页，避免 Safari / 移动浏览器直接弹出不可控打印面板。
      const shouldAutoPrint = !window.matchMedia || !window.matchMedia("(pointer: coarse)").matches;
      let printed = false;
      const doPrint = () => {
        if (printed || !win || win.closed) return;
        printed = true;
        try {
          win.focus();
          win.print();
        } catch (e) { console.warn("print 调用异常:", e); }
      };
      // 等待报告内图片（原图 / 热力图）加载完成再打印，避免空白或半截图片
      const imagesReady = (w) => new Promise((resolve) => {
        try {
          const imgs = w.document ? w.document.images : [];
          let pending = imgs.length;
          if (pending === 0) { resolve(); return; }
          let settled = false;
          const finish = () => { if (!settled) { settled = true; resolve(); } };
          Array.prototype.forEach.call(imgs, (im) => {
            if (im.complete) { if (--pending <= 0) finish(); }
            else {
              im.addEventListener("load", () => { if (--pending <= 0) finish(); }, { once: true });
              im.addEventListener("error", () => { if (--pending <= 0) finish(); }, { once: true });
            }
          });
          setTimeout(finish, 4000); // 超时兜底
        } catch (_) { resolve(); }
      });
      const checkReady = () => {
        if (printed || !win || win.closed) return;
        try {
          if (win.document && win.document.readyState === "complete") {
            imagesReady(win).then(() => setTimeout(doPrint, 300));
          } else {
            setTimeout(checkReady, 150);
          }
        } catch (e) { setTimeout(doPrint, 400); }
      };
      if (shouldAutoPrint) {
        setTimeout(checkReady, 250);
        setTimeout(doPrint, 6000); // 最终兜底：超时也尝试打印
      }
      setTimeout(() => { if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; } }, 60000);

      showToast(shouldAutoPrint ? "PDF 报告已生成，可在弹出的报告中「打印 / 存为 PDF」" : "报告已打开，请在报告页点击「打印 / 存为 PDF」", "success", 4000);
      } catch (e) {
        console.warn("PDF export error:", e);
        if (win) win.close();
        if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
        showToast("PDF 导出失败，请重试", "error", 4000);
      } finally {
        exportPdfBtn.innerHTML = originalHtml;
        exportPdfBtn.disabled = false;
        exportPdfBtn.classList.remove("is-loading");
      }
    }

    // ---- 新手引导 ----
    function initOnboarding() {
      // 复用 lsGet/lsSet，兼容隐私模式下 localStorage 不可用的情况
      if (lsGet(ONBOARDING_KEY)) return;
      // 检查是否有历史记录
      if (loadHistory().length > 0) {
        lsSet(ONBOARDING_KEY, "1");
        return;
      }
      if (onboardingTip) {
        onboardingTip.hidden = false;
        const dismiss = () => {
          onboardingTip.hidden = true;
          lsSet(ONBOARDING_KEY, "1");
          document.removeEventListener("click", dismiss);
          clearTimeout(timer);
        };
        const timer = setTimeout(dismiss, 5000);
        document.addEventListener("click", dismiss, { once: true });
      }
    }

    // ---- 更新结果面板的指标摘要 ----
    function updateMetrics(pred, durationSec) {
      const conf = typeof pred.confidence_score === "number" ? pred.confidence_score : 0;
      metricConfidence.textContent = (conf * 100).toFixed(1) + "%";
      metricDuration.textContent = durationSec ? `${durationSec.toFixed(1)}s${durationSec > 30 ? "（冷启动）" : ""}` : "—";
      metricTime.textContent = formatHistoryTime(pred.timestamp || new Date().toISOString());
      // 鱼眼外观摘要：从描述中截取前 12 字
      const desc = pred.description || "";
      metricAppearance.textContent = desc.slice(0, 10) || "—";
      // 趋势预测 / 知识图谱
      const label = typeof pred.freshness_label === "number" ? pred.freshness_label : -1;
      const trend = label === 0
        ? "视觉特征接近高度新鲜样本。实际可保存时间高度依赖储存温度、鱼种与处理方式，本结果不作为保质期或食品安全证明。"
        : label === 1
        ? "视觉特征处于中等新鲜度范围。建议尽快处理；实际可保存时间高度依赖储存温度、鱼种与处理方式。"
        : label === 2
        ? "视觉特征显示明显不新鲜，建议避免食用；本结果仍不能替代对微生物、毒素、污染物等项目的检验。"
        : "暂无法形成视觉新鲜度趋势，请重新拍摄清晰鱼眼特写。";
      if (trendBody) trendBody.innerHTML = `<blockquote class="desc-quote">✅ 视觉新鲜度趋势：${escapeHtml(trend)}</blockquote>`;
      const knowledge = label === 0
        ? "✅ 视觉特征对照：角膜透明、瞳孔清晰、表面有自然光泽。当前样本接近高度新鲜样本。"
        : label === 1
        ? "✅ 视觉特征对照：角膜略浑浊、瞳孔尚可辨认。当前样本与中等新鲜度特征匹配。"
        : label === 2
        ? "✅ 视觉特征对照：角膜浑浊、瞳孔模糊、表面失去光泽。当前样本与不新鲜特征匹配。"
        : "暂无标准特征对照数据。";
      if (knowledgeText) knowledgeText.textContent = knowledge;
    }

    // ============================================================
    //  汉堡菜单 / 键盘导航 / PWA / 文案
    // ============================================================

    // ---- 汉堡菜单（焦点陷阱 + Escape 关闭）----
    function initHamburgerMenu() {
      const toggle = document.getElementById("navToggle");
      const overlay = document.getElementById("navOverlay");
      if (!toggle || !overlay) return;
      let lastFocused = null;

      const openMenu = () => {
        lastFocused = document.activeElement;
        overlay.hidden = false;
        toggle.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "关闭导航菜单");
        const firstLink = overlay.querySelector("a");
        firstLink?.focus();
        document.body.style.overflow = "hidden";
      };
      const closeMenu = () => {
        overlay.hidden = true;
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "打开导航菜单");
        document.body.style.overflow = "";
        lastFocused?.focus();
      };

      toggle.addEventListener("click", () => {
        overlay.hidden ? openMenu() : closeMenu();
      });
      // 点击链接后关闭
      overlay.querySelectorAll("[data-close]").forEach((a) => {
        a.addEventListener("click", closeMenu);
      });
      // Escape 关闭
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !overlay.hidden) closeMenu();
      });
      // 焦点陷阱：Tab 在菜单内循环
      overlay.addEventListener("keydown", (e) => {
        if (e.key !== "Tab" || overlay.hidden) return;
        const focusable = [...overlay.querySelectorAll("a, button")];
        const idx = focusable.indexOf(document.activeElement);
        if (e.shiftKey && idx === 0) {
          e.preventDefault();
          focusable[focusable.length - 1]?.focus();
        } else if (!e.shiftKey && idx === focusable.length - 1) {
          e.preventDefault();
          focusable[0]?.focus();
        }
      });
    }

    // ---- 键盘导航：滑块箭头控制 ----
    function initKeyboardNav() {
      // 滑块：左右箭头微调位置（普通 ±1%，Shift ±10%）
      if (compHandle) {
        compHandle.setAttribute("tabindex", "0");
        compHandle.setAttribute("role", "slider");
        compHandle.setAttribute("aria-label", "拖动对比原图与热力图");
        compHandle.setAttribute("aria-valuemin", "0");
        compHandle.setAttribute("aria-valuemax", "100");
        compHandle.setAttribute("aria-valuenow", "50");
        compHandle.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          const cur = parseInt(compHandle.getAttribute("aria-valuenow") || "50", 10);
          const step = e.shiftKey ? 10 : 1;
          setSliderPos(e.key === "ArrowLeft" ? cur - step : cur + step);
        });
      }
    }

    // ============ 全局事件监听器 ============
    window.addEventListener("beforeunload", (e) => {
      if (analysisInProgress) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    });

    window.addEventListener("error", (e) => {
      console.warn("[FreshEye] Global error:", e.error || e.message);
    });

    window.addEventListener("unhandledrejection", (e) => {
      console.warn("[FreshEye] Unhandled promise rejection:", e.reason);
      if (typeof showToast === "function") {
        showToast("发生意外错误，请刷新页面重试", "error");
      }
    });

    // ============ 初始化 ============
    document.addEventListener("DOMContentLoaded", () => {
      initResultShortcuts();
      initBubbles();
      initParallax();
      initReveal();
      initModelSelector();
      if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => {
          if (!analyzeBtn.disabled) startAnalysis();
        });
      }
      initTabs();
      initAccordion();
      initCompareSlider();
      initHistoryEvents();
      initAdviceExpandable();
      exportPdfBtn?.addEventListener("click", exportPDF);
      initHamburgerMenu();
      initKeyboardNav();
      document.getElementById("warningMidDismiss")?.addEventListener("click", () => {
        document.getElementById("confidenceWarningMid").hidden = true;
      });
      document.getElementById("warningLowDismiss")?.addEventListener("click", () => {
        document.getElementById("confidenceWarningLow").hidden = true;
      });

      const deferredInit = () => {
        checkApiHealth();
        renderHistory();
        initOnboarding();
        let historyTimerId = null;
        const startHistoryTimer = () => {
          if (historyTimerId) return;
          historyTimerId = setInterval(refreshHistoryTimes, 60000);
        };
        const stopHistoryTimer = () => {
          if (historyTimerId) { clearInterval(historyTimerId); historyTimerId = null; }
        };
        startHistoryTimer();
        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            stopHistoryTimer();
          } else {
            refreshHistoryTimes();
            startHistoryTimer();
          }
        });
      };
      if ("requestIdleCallback" in window) {
        requestIdleCallback(deferredInit, { timeout: 2000 });
      } else {
        setTimeout(deferredInit, 300);
      }
    });

