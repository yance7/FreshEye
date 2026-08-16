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
    const FEI18n = window.FreshEyeI18n || null;
    const tr = (key, params) => FEI18n ? FEI18n.t(key, params) : key;
    const predictionCopy = (prediction) => FEI18n
      ? FEI18n.getPredictionCopy(prediction || {})
      : { label: prediction?.freshness_level || "未知", description: prediction?.description || "", action: "", trend: "", knowledge: "", labelCode: prediction?.freshness_label ?? -1 };

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

    /** 在窄屏上将目标稳定定位到固定导航栏下方，避免多次平滑滚动互相覆盖。 */
    function scrollBelowNavbar(el) {
      if (!el) return;
      const navbarHeight = document.querySelector(".navbar")?.getBoundingClientRect().height || 64;
      const targetTop = el.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top: Math.max(0, targetTop) });
      requestAnimationFrame(() => { root.style.scrollBehavior = previousScrollBehavior; });
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
      return modelVersion === "v2" ? tr("model.high") : tr("model.classic");
    }

    /** 更新所有静态识别模式文本 */
    function updateModelVersionText(modelVersion = currentModelVersion) {
      const subEl = document.getElementById("resultSubText");
      if (subEl) subEl.textContent = tr("page.index.resultSub");
      const gaugeEl = document.getElementById("gaugeLabel");
      if (gaugeEl) gaugeEl.textContent = tr("page.index.modelScore");
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
      if (!file) return { ok: false, reason: tr("app.file.noFile") };
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { ok: false, reason: tr("app.file.invalidType", { type: file.type || tr("common.unknown") }) };
      }
      if (file.size > MAX_FILE_SIZE) {
        return { ok: false, reason: tr("app.file.tooLarge", { size: formatFileSize(file.size) }) };
      }
      if (file.size === 0) {
        return { ok: false, reason: tr("app.file.empty") };
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
     * 压缩/转换图片用于上传（JPEG q=0.85）。
     * 生产 API 对部分 WebP 文件的魔数校验较严格，前端允许 WebP 时强制转为 JPEG，
     * 让示例图片、拖拽上传和手机相册上传走同一条稳定链路。
     */
    function compressImageForUpload(file, maxDim, quality, forceTranscode = false) {
      return new Promise((resolve) => {
        if (!forceTranscode && file.size < 500 * 1024) { resolve(null); return; }
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
            if (!forceTranscode && w <= maxDim && h <= maxDim) { resolve(null); return; }
            const scale = Math.min(1, maxDim / Math.max(w, h));
            const tw = Math.round(w * scale), th = Math.round(h * scale);
            const canvas = document.createElement('canvas');
            canvas.width = tw; canvas.height = th;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, tw, th);
            canvas.toBlob((blob) => {
              if (blob) {
                const sourceName = file.name || 'image';
                const baseName = sourceName.replace(/\.[^.]+$/, '') || 'image';
                const outputName = forceTranscode ? `${baseName}.jpg` : sourceName;
                resolve(new File([blob], outputName, { type: 'image/jpeg', lastModified: Date.now() }));
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
      loadingText.textContent = tr("app.file.processing");
      loadingText.style.cssText = 'color:var(--aqua,#27d0c4);font-size:13px;margin-top:8px;text-align:center;';
      const existingText = previewImageBox.querySelector('.preview-loading-text');
      if (existingText) existingText.remove();
      previewImageBox.appendChild(previewLoading);
      previewImageBox.appendChild(loadingText);

      infoName.textContent = file.name;
      infoSize.textContent = formatFileSize(file.size);
      infoDim.textContent = tr("app.file.processingShort");

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
        showToast(tr("app.file.loadFailed"), "error");
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
      uploadText.textContent = tr("page.index.uploadText");
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
        showToast(tr("app.camera.notReady"), "error");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = cameraVideo.videoWidth;
      canvas.height = cameraVideo.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast(tr("app.camera.captureFailed"), "error");
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
        showToast(tr("app.camera.flipFailed"), "error");
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
          showToast(tr("app.sample.loadFailed"), "error");
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
      uploadText.textContent = tr("app.file.dragRelease");
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
        uploadText.textContent = tr("page.index.uploadText");
        uploadText.classList.remove("upload-text-drag");
      }
    });
    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      uploadZone.classList.remove("is-dragover");
      uploadText.textContent = tr("page.index.uploadText");
      uploadText.classList.remove("upload-text-drag");
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        handleFileSelect(file);
      } else {
        showToast(tr("app.file.noDrop"), "error");
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
      if (bubblesEl.dataset.initialized === "true") return;
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
      bubblesEl.dataset.initialized = "true";
    }

    // ============ 视差滚动 ============
    /**
     * 监听滚动，更新背景层 transform（rAF 节流）
     */
    function initParallax() {
      const canParallax = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!bubblesEl || !canParallax || reducedMotion) return;
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY || window.pageYOffset;
            // 背景气泡以 0.3 倍速反向移动（视差感）
            bubblesEl.style.transform = `translate3d(0, ${y * -0.15}px, 0)`;
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
      analyzeBtnText.textContent = tr("page.index.start");
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
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      let lastMouseMove = Date.now();
      let driftTimeout = null;
      let returnTimeout = null;
      let isDrifting = false;
      const pupil = document.getElementById('heroPupil');
      const eyeWrap = document.querySelector('.hero-eye-wrap');
      if (!pupil || !eyeWrap) return;

      function clearDriftTimers() {
        if (driftTimeout) { clearTimeout(driftTimeout); driftTimeout = null; }
        if (returnTimeout) { clearTimeout(returnTimeout); returnTimeout = null; }
      }

      function driftPupil() {
        if (isDrifting) return;
        if (Date.now() - lastMouseMove < 3000) return;
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
      analyzeBtnText.textContent = tr("app.file.processing");
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
      analyzeBtnText.textContent = tr("app.file.retry");
    }

    /**
     * 设置按钮为完成态（分析成功后）
     */
    function setAnalyzeDone() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-disabled", "is-loading", "is-retry", "is-ready");
      analyzeBtn.disabled = false;
      analyzeBtnText.textContent = tr("app.file.restart");
    }

    /**
     * 重置按钮到禁用态
     */
    function resetAnalyzeButton() {
      if (!analyzeBtn) return;
      analyzeBtn.classList.remove("is-loading", "is-retry");
      analyzeBtn.classList.add("is-disabled");
      analyzeBtn.disabled = true;
      analyzeBtnText.textContent = tr("app.file.chooseFirst");
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
        tr("app.scan.connecting"),
        tr("app.scan.starting"),
        tr("app.scan.analyzing"),
        tr("app.scan.gradcam")
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
      if (scanStatus) scanStatus.innerHTML = `<span class="scan-dot"></span> ${tr("app.scan.complete")}`;
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
        showToast(tr("model.changed", { model: getModelDisplayName(currentModelVersion) }), "info", 1800);
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
      badge.textContent = currentModelVersion === "v2" ? tr("model.v2Short") : tr("model.v1Short");
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
        showToast(tr("app.file.chooseFirst"), "error");
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
        if (window.matchMedia("(max-width: 720px)").matches) scrollBelowNavbar(resultsSection);
        else scrollToTarget(resultsSection, { block: "start" });
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
        if (resultHint) resultHint.textContent = tr("app.analysis.completed");
        // 移动端骨架屏切换为结果面板后高度会变化；待布局稳定后重新对齐，
        // 确保结果标题、导出按钮和第一个 Tab 不被固定导航栏遮挡。
        if (resultsSection && window.matchMedia("(max-width: 720px)").matches) {
          const realignResults = () => {
            if (runId === analysisRunId) scrollBelowNavbar(resultsSection);
          };
          const finishRevealAlignment = (event) => {
            if (event.target !== resultsSection || event.propertyName !== "transform") return;
            resultsSection.removeEventListener("transitionend", finishRevealAlignment);
            clearTimeout(revealAlignmentFallback);
            realignResults();
          };
          requestAnimationFrame(() => {
            requestAnimationFrame(realignResults);
          });
          // 结果区带有 reveal 位移动画。必须在 transform 动画真正结束后再对齐，
          // 否则标题会在动画收尾时重新上移到固定导航栏下方。
          resultsSection.addEventListener("transitionend", finishRevealAlignment);
          const revealAlignmentFallback = setTimeout(() => {
            resultsSection.removeEventListener("transitionend", finishRevealAlignment);
            realignResults();
          }, 900);
        }
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
      const isWebp = /^image\/webp$/i.test(file.type || "") || /\.webp$/i.test(file.name || "");
      if (isWebp || file.size > 2 * 1024 * 1024) {
        try {
          const compressed = await compressImageForUpload(file, 1280, 0.9, isWebp);
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
          const httpErr = new HttpError(detail || tr("common.unknown"), res.status);
          throw httpErr;
        }
        return await res.json();
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof HttpError) throw err;
        if (err.name === "AbortError") {
          if (isTimeout) {
            const e = new Error(tr("app.error.timeout"));
            e.name = "TimeoutError";
            throw e;
          }
          const e = new Error("ABORT");
          e.name = "AbortError";
          throw e;
        }
        const netErr = new Error(tr("app.error.network"));
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
      msg = tr("app.error.timeout");
      } else if (err.name === "NetworkError") {
      msg = tr("app.error.network");
      } else if (err instanceof HttpError) {
        switch (err.status) {
          case 413: msg = tr("app.error.413"); break;
          case 400: msg = tr("app.error.400"); break;
          case 422: msg = tr("app.error.422"); break;
          case 503: msg = tr("app.error.503"); break;
          default: msg = tr("app.error.http", { status: err.status });
        }
      } else {
        msg = tr("app.error.generic", { message: err.message || tr("common.unknown") });
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
      if (resultHint) resultHint.textContent = tr("app.analysis.failed");
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
      const copy = predictionCopy(pred);
      const level = copy.label;
      // 数值安全化：非有限数 → -1 / 0
      const safeNum = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
      let label = typeof pred.freshness_label === "number" ? pred.freshness_label : -1;
      if (![0, 1, 2].includes(label)) label = -1;
      let confidence = safeNum(pred.confidence_score);
      confidence = Math.max(0, Math.min(1, confidence)); // 强制 0-1 范围
      const probs = pred.all_probabilities || {};
      const description = copy.description || softenSafetyLanguage(pred.description || tr("common.unknown"));

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
        resultAction.textContent = tr("prediction.unknown.action");
      } else {
        resultAction.textContent = predictionCopy({ freshness_label: label }).action;
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
        badgeLabel.textContent = tr("confidence.highBadge");
      } else if (confidence >= 0.6) {
        badge.classList.add("badge-mid");
        badgeLabel.textContent = tr("confidence.midBadge");
      } else {
        badge.classList.add("badge-low");
        badgeLabel.textContent = tr("confidence.lowBadge");
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
      const confidenceText = (confidence * 100).toFixed(1);
      if (confSpan) confSpan.textContent = confidenceText;
      const modalDesc = document.getElementById("modalDesc");
      if (modalDesc) {
        modalDesc.innerHTML = `${escapeHtml(tr("page.index.lowConfidenceBody", { confidence: confidenceText }))}<br/><span>${escapeHtml(tr("page.index.lowConfidenceAdvice"))}</span>`;
      }
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

    function refreshOpenConfidenceModal() {
      const modal = document.getElementById("confidenceModal");
      if (!modal || modal.hidden || !lastAnalysisResult) return;
      const pred = lastAnalysisResult.prediction || lastAnalysisResult;
      const confidence = Number(pred.confidence_score);
      if (!Number.isFinite(confidence)) return;
      showConfidenceModal(Math.max(0, Math.min(1, confidence)));
    }

    /**
     * 更新鲜度等级卡片（文字 + 颜色）
     */
    function updateFreshnessCard(level, label, confidence, modelVersion) {
      const cls = label === 0 ? "freshness-high" : label === 1 ? "freshness-mid" : label === 2 ? "freshness-low" : "freshness-mid";
      freshnessCard.classList.remove("freshness-high", "freshness-mid", "freshness-low");
      freshnessCard.classList.add(cls);
      freshnessLabel.textContent = predictionCopy({ freshness_label: label }).label;
      const pct = (confidence * 100).toFixed(1);
      freshnessMeta.textContent = tr("confidence.meta", { confidence: pct, model: getModelDisplayName(modelVersion) });
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
      const map = [
        { bar: probBarHigh, val: probValHigh, row: document.querySelector(".prob-row.high") },
        { bar: probBarMid, val: probValMid, row: document.querySelector(".prob-row.mid") },
        { bar: probBarLow, val: probValLow, row: document.querySelector(".prob-row.low") }
      ];
      const values = FEI18n ? FEI18n.getProbabilityValues(probs) : [
        Number(probs["高度新鲜"] || 0), Number(probs["新鲜"] || 0), Number(probs["不新鲜"] || 0)
      ];
      // 先清除所有 dominant
      document.querySelectorAll(".prob-row").forEach((r) => r.classList.remove("is-dominant"));
      // 找到最高概率项
      let maxRow = null, maxVal = -1;
      map.forEach((els, index) => {
        const p = Number.isFinite(Number(values[index])) ? Number(values[index]) : 0;
        if (p > maxVal) { maxVal = p; maxRow = els.row; }
        const pct = (p * 100).toFixed(1);
        els.bar.style.transform = `scaleX(${p})`;
        els.val.textContent = `${pct}%`;
      });
      // 给最高概率行加发光
      if (maxRow) {
        maxRow.classList.add("is-dominant");
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
      let activePointerId = null;
      const getClientX = (e) => {
        const touch = e.touches?.[0] || e.changedTouches?.[0];
        return touch ? touch.clientX : e.clientX;
      };
      const onMove = (e) => {
        const isPointerEvent = typeof e.pointerId === "number";
        if (!dragging || (activePointerId !== null && isPointerEvent && e.pointerId !== activePointerId)) return;
        const clientX = getClientX(e);
        if (!Number.isFinite(clientX)) return;
        const rect = compareSlider.getBoundingClientRect();
        const x = clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSliderPos(pct);
        if (e.cancelable) e.preventDefault();
      };
      const stopDrag = (e) => {
        if (!dragging) return;
        if (activePointerId !== null && typeof e?.pointerId === "number" && e.pointerId !== activePointerId) return;
        dragging = false;
        if (activePointerId !== null && compareSlider.releasePointerCapture) {
          try { compareSlider.releasePointerCapture(activePointerId); } catch (_) { /* pointer 已结束 */ }
        }
        activePointerId = null;
        compHandle.classList.remove("is-active");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", stopDrag);
        window.removeEventListener("pointercancel", stopDrag);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", stopDrag);
        window.removeEventListener("touchcancel", stopDrag);
      };
      const startDrag = (e) => {
        if (dragging) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const clientX = getClientX(e);
        if (!Number.isFinite(clientX)) return;
        dragging = true;
        activePointerId = e.type === "touchstart" ? null : (typeof e.pointerId === "number" ? e.pointerId : null);
        compHandle.classList.add("is-active");
        compareSlider.classList.add("is-interacted");
        if (activePointerId !== null && compareSlider.setPointerCapture) {
          try { compareSlider.setPointerCapture(activePointerId); } catch (_) { /* 浏览器不支持时由 window 监听兜底 */ }
        }
        const rect = compareSlider.getBoundingClientRect();
        const x = clientX - rect.left;
        const pct = (x / rect.width) * 100;
        setSliderPos(pct);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", stopDrag);
        window.addEventListener("pointercancel", stopDrag);
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", stopDrag);
        window.addEventListener("touchcancel", stopDrag);
        e.preventDefault();
      };
      compHandle.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        startDrag(e);
      });
      compareSlider.addEventListener("pointerdown", startDrag);
      // 部分移动浏览器的 Pointer Events 兼容性不完整，保留 touch 事件兜底。
      compareSlider.addEventListener("touchstart", startDrag, { passive: false });
    }

    /**
     * 更新结构化描述（带置信度前缀）
     */
    function updateDescription(desc, confidence) {
      let prefix = "";
      if (confidence >= 0.8) prefix = tr("confidence.highPrefix");
      else if (confidence >= 0.5) prefix = tr("confidence.midPrefix");
      else prefix = tr("confidence.lowPrefix");
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
      const localizedRecs = FEI18n ? FEI18n.getRecommendations(label) : null;
      const recs = localizedRecs && Object.values(localizedRecs).some((items) => items.length)
        ? localizedRecs
        : (defaultRecs[label] || defaultRecs[1]);
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
        requestAnimationFrame(() => {
          if (window.matchMedia("(max-width: 720px)").matches) {
            scrollBelowNavbar(resultDetails);
          } else {
            resultDetails.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
      showAdviceBtn?.addEventListener("click", () => {
        const adviceTab = document.querySelector('.report-tab[data-tab="advice"]');
        adviceTab?.click();
        requestAnimationFrame(() => {
          const tabs = document.querySelector(".report-tabs");
          if (!tabs) return;
          if (window.matchMedia("(max-width: 720px)").matches) {
            scrollBelowNavbar(tabs);
          } else {
            tabs.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
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
        const targetPane = Array.from(panes).find((pane) => pane.dataset.pane === tab.dataset.tab);
        if (targetPane) {
          if (!targetPane.id) targetPane.id = `report-pane-${tab.dataset.tab}`;
          tab.setAttribute("aria-controls", targetPane.id);
        }
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
        p.setAttribute("tabindex", "0");
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
        showToast(tr("app.history.noSpace"), "error", 3000);
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
    function findHistoryItemElement(id) {
      if (!historyList) return null;
      return Array.from(historyList.querySelectorAll(".history-item"))
        .find((item) => item.dataset.id === id) || null;
    }

    function showHistoryEmptyState() {
      if (!historyList || historyList.querySelector(".history-item")) return;
      const searchTerm = (document.getElementById("historySearch")?.value || "").trim();
      const filterVal = document.getElementById("historyFilter")?.value || "all";
       historyList.innerHTML = `<div class="history-empty">${searchTerm || filterVal !== "all" ? escapeHtml(tr("app.history.noMatch")) : escapeHtml(tr("page.index.historyEmpty"))}</div>`;
    }

    function deleteHistory(id) {
      const hist = loadHistory().filter((r) => r.id !== id);
      saveHistory(hist);
      const favs = loadFavorites().filter((fid) => fid !== id);
      saveFavorites(favs);
      // 只移除当前 DOM 节点，保留列表、滚动位置和其余图片，避免整列表闪烁/刷新。
      const item = findHistoryItemElement(id);
      if (item) {
        if (_swipeOpenItem === item) _collapseSwipeItem();
        item.remove();
      }
      showHistoryEmptyState();
    }

    /**
     * 清空全部历史记录（含收藏），带二次确认
     */
    function clearAllHistory() {
      if (loadHistory().length === 0) return;
       if (!confirm(tr("app.history.confirmClear"))) return;
      saveHistory([]);
      saveFavorites([]);
      renderHistory();
       showToast(tr("app.history.cleared"), "success", 3000);
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
      const item = findHistoryItemElement(id);
      if (!item) return;
      const isFav = favs.includes(id);
      const btn = item.querySelector('[data-act="fav"]');
      if (btn) {
        btn.classList.toggle("is-fav", isFav);
        btn.textContent = isFav ? "★" : "☆";
         btn.setAttribute("aria-label", isFav ? tr("app.history.unfavorite") : tr("app.history.favorite"));
         btn.setAttribute("aria-pressed", String(isFav));
         btn.title = isFav ? tr("app.history.unfavorite") : tr("app.history.favorite");
      }
      // 收藏筛选下取消收藏时，仅将这一项移出当前视图。
      if (!isFav && document.getElementById("historyFilter")?.value === "favorite") {
        if (_swipeOpenItem === item) _collapseSwipeItem();
        item.remove();
        showHistoryEmptyState();
      }
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
         if (!d) return tr("common.none");
        const now = Date.now();
        const diffMs = now - d.getTime();
         if (diffMs < 0) return tr("app.time.justNow"); // 未来时间兜底
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);
         if (sec < 60) return tr("app.time.justNow");
         if (min < 60) return tr("app.time.minutes", { value: min });
         if (hr < 24) return tr("app.time.hours", { value: hr });
         if (day < 2) return tr("app.time.yesterday");
         if (day < 7) return tr("app.time.days", { value: day });
         const locale = FEI18n?.getLocale?.() === "en" ? "en-US" : "zh-CN";
         return new Intl.DateTimeFormat(locale, {
           month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
           timeZone: "Asia/Shanghai"
         }).format(d);
      } catch (_) { return tr("common.none"); }
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
       const copy = predictionCopy({ freshness_label: r.freshnessLabel });
       const relativeTime = formatHistoryTime(r.timestamp);
       item.setAttribute("aria-label", tr("app.history.aria", {
         label: copy.label,
         confidence: ((r.confidenceScore || 0) * 100).toFixed(1),
         time: relativeTime
       }));
      const cls = r.freshnessLabel === 0 ? "high" : r.freshnessLabel === 1 ? "mid" : r.freshnessLabel === 2 ? "low" : "mid";
      const conf = ((r.confidenceScore || 0) * 100).toFixed(1);
      const thumbSrc = r.thumbnail || "";
       const levelText = escapeHtml(copy.label);
      const confText = escapeHtml(conf);
      const timestamp = r.timestamp || "";
      const timeText = escapeHtml(formatHistoryTime(r.timestamp));
      const favClass = isFav ? "is-fav" : "";
      const favText = isFav ? "★" : "☆";
       const favAriaLabel = isFav ? tr("app.history.unfavorite") : tr("app.history.favorite");
       item.innerHTML = `
        <div class="history-content">
           <img class="history-thumb" alt="${escapeHtml(tr("app.history.thumbnailAlt"))}" src="${escapeHtml(thumbSrc)}" width="56" height="56" loading="lazy" decoding="async" />
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
           <button class="history-btn fav ${favClass}" aria-label="${escapeHtml(favAriaLabel)}" aria-pressed="${isFav}" title="${escapeHtml(favAriaLabel)}" data-act="fav">${favText}</button>
           <button class="history-btn del" aria-label="${escapeHtml(tr("app.history.delete"))}" title="${escapeHtml(tr("app.history.deleteTitle"))}" data-act="del">🗑</button>
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
        filtered = filtered.filter(r => {
          const searchValues = FEI18n?.getHistorySearchValues?.(r) || [r.freshnessLevel, r.description];
          return searchValues.some((value) => String(value || "").toLowerCase().includes(searchTerm))
            || formatHistoryTime(r.timestamp).toLowerCase().includes(searchTerm);
        });
      }

      if (filtered.length === 0) {
         historyList.innerHTML = `<div class="history-empty">${searchTerm || filterVal !== "all" ? escapeHtml(tr("app.history.noMatch")) : escapeHtml(tr("page.index.historyEmpty"))}</div>`;
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
       updateResults(data, r.processingTime, { fromHistory: true });
       setAnalyzeDone();
       if (resultHint) resultHint.textContent = tr("app.history.prefix", { time: formatHistoryTime(r.timestamp) });
      if (window.matchMedia("(max-width: 720px)").matches) scrollBelowNavbar(resultsSection);
      else scrollToTarget(resultsSection, { block: "start" });
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

    // ---- 双语 PDF 报告导出：结构化数据交给独立构建器，避免页面文案与报告文案分叉 ----
    async function exportBilingualPDF() {
      if (!lastAnalysisResult) {
        showToast(tr("app.pdf.none"), "error");
        return;
      }

      const win = window.open("", "_blank");
      const popupBlocked = !win;
      if (win) {
        try {
          win.opener = null;
          win.document.write(`<!doctype html><meta charset="utf-8"><title>${escapeHtml(tr("pdf.loading"))}</title><div style="font-family:-apple-system,sans-serif;text-align:center;padding:60px;color:#4a5e6e"><p style="font-size:16px">${escapeHtml(tr("pdf.loading"))}</p></div>`);
          win.document.close();
        } catch (_) {}
      }

      const originalHtml = exportPdfBtn ? exportPdfBtn.innerHTML : "";
      if (exportPdfBtn) {
        exportPdfBtn.disabled = true;
        exportPdfBtn.classList.add("is-loading");
        exportPdfBtn.innerHTML = `<span class="btn-export-spinner" aria-hidden="true"></span> ${escapeHtml(tr("pdf.loading"))}`;
      }

      const downloadReport = (report) => {
        const blob = new Blob([report.html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = report.htmlFilename || "FreshEye-report.html";
        anchor.hidden = true;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };

      const bindReportActions = (reportWindow, report) => {
        if (!reportWindow || reportWindow.closed) return;
        const printBtn = reportWindow.document.getElementById("pdfPrintBtn");
        const downloadBtn = reportWindow.document.getElementById("pdfDownloadBtn");
        const closeBtn = reportWindow.document.getElementById("pdfCloseBtn");
        if (printBtn && !printBtn.dataset.ready) {
          printBtn.dataset.ready = "true";
          printBtn.addEventListener("click", () => reportWindow.print());
        }
        if (downloadBtn && !downloadBtn.dataset.ready) {
          downloadBtn.dataset.ready = "true";
          downloadBtn.addEventListener("click", () => downloadReport(report));
        }
        if (closeBtn && !closeBtn.dataset.ready) {
          closeBtn.dataset.ready = "true";
          closeBtn.addEventListener("click", () => reportWindow.close());
        }
      };

      try {
        const pred = lastAnalysisResult.prediction || lastAnalysisResult;
        const label = Number(pred.freshness_label);
        let rawImgSrc = selectedFileDataURL || "";
        if (!rawImgSrc && selectedFile) {
          try { rawImgSrc = await fileToDataURL(selectedFile); } catch (_) { rawImgSrc = ""; }
        }
        const [originalImage, heatmapImage] = await Promise.all([
          compressDataURL(rawImgSrc, 600, 0.82),
          compressImgElement(compareHeatmap, 600, 0.82)
        ]);
        const report = window.FreshEyePdf?.buildReportHtml({
          locale: FEI18n?.getLocale?.() || "zh",
          prediction: pred,
          probabilities: pred.all_probabilities || {},
          recommendations: FEI18n?.getRecommendations?.(label) || lastAnalysisResult.recommendations,
          originalImage,
          heatmapImage,
          durationSec: lastAnalysisResult.__processingTime,
          timestamp: new Date().toISOString(),
          modelVersion: getModelDisplayName(pred.model_version || currentModelVersion),
          softwareVersion: "FreshEye Web 2026.08"
        });
        if (!report || !report.html) throw new Error("PDF builder unavailable");

        if (popupBlocked) {
          downloadReport(report);
          showToast(tr("app.pdf.fallback"), "success", 5000);
        } else {
          win.document.open();
          win.document.write(report.html);
          win.document.close();
          const bind = () => bindReportActions(win, report);
          if (win.addEventListener) win.addEventListener("load", bind, { once: true });
          setTimeout(bind, 250);
          showToast(tr("app.pdf.opened"), "success", 4000);
        }
      } catch (error) {
        console.warn("PDF export error:", error);
        if (win && !win.closed) win.close();
        showToast(tr("app.pdf.failed"), "error", 4000);
      } finally {
        if (exportPdfBtn) {
          exportPdfBtn.innerHTML = originalHtml;
          exportPdfBtn.disabled = false;
          exportPdfBtn.classList.remove("is-loading");
        }
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
      const copy = predictionCopy(pred);
      metricConfidence.textContent = (conf * 100).toFixed(1) + "%";
      metricDuration.textContent = durationSec
        ? `${durationSec.toFixed(1)}s${durationSec > 30 ? ` · ${tr("app.metrics.coldStart")}` : ""}`
        : tr("common.none");
      metricTime.textContent = formatHistoryTime(pred.timestamp || new Date().toISOString());
      metricAppearance.textContent = copy.knowledge ? copy.knowledge.slice(0, 48) : tr("common.none");
      if (trendBody) trendBody.innerHTML = `<blockquote class="desc-quote">✅ ${escapeHtml(tr("app.metrics.trendPrefix"))}: ${escapeHtml(copy.trend)}</blockquote>`;
      if (knowledgeText) knowledgeText.textContent = copy.knowledge;
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
        previousBodyOverflow = document.body.style.overflow;
        overlay.hidden = false;
        overlay.setAttribute("aria-hidden", "false");
        toggle.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", tr("nav.close"));
        const firstLink = overlay.querySelector("a");
        firstLink?.focus();
        document.body.style.overflow = "hidden";
      };
      const closeMenu = (restoreFocus = true) => {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", tr("nav.open"));
        document.body.style.overflow = previousBodyOverflow;
        if (restoreFocus && lastFocused?.focus && lastFocused.offsetParent !== null) lastFocused.focus();
      };

      let previousBodyOverflow = "";
      overlay.setAttribute("aria-hidden", overlay.hidden ? "true" : "false");

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
      const closeMenuOnViewportChange = () => {
        if (!overlay.hidden && !window.matchMedia("(max-width: 640px)").matches) closeMenu(false);
      };
      window.addEventListener("resize", closeMenuOnViewportChange, { passive: true });
      window.addEventListener("orientationchange", closeMenuOnViewportChange, { passive: true });
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
        compHandle.setAttribute("aria-label", tr("page.index.compareAria"));
        compHandle.setAttribute("aria-valuemin", "0");
        compHandle.setAttribute("aria-valuemax", "100");
        compHandle.setAttribute("aria-valuenow", "50");
        compHandle.addEventListener("keydown", (e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          compareSlider?.classList.add("is-interacted");
          const cur = parseInt(compHandle.getAttribute("aria-valuenow") || "50", 10);
          const step = e.shiftKey ? 10 : 1;
          setSliderPos(e.key === "ArrowLeft" ? cur - step : cur + step);
        });
      }
    }

    // ============ 全局事件监听器 ============
    window.addEventListener("fresheye:languagechange", () => {
      if (compHandle) compHandle.setAttribute("aria-label", tr("page.index.compareAria"));
      updateModelVersionText(currentModelVersion);
      updateModelVersionBadge();
      if (lastAnalysisResult) {
        updateResults(lastAnalysisResult, lastAnalysisResult.__processingTime, { fromHistory: true });
        const historyTimestamp = lastAnalysisResult.prediction?.timestamp;
        if (resultHint) {
          resultHint.textContent = selectedFile
            ? tr("app.analysis.completed")
            : tr("app.history.prefix", { time: formatHistoryTime(historyTimestamp) });
        }
      }
      refreshOpenConfidenceModal();
      renderHistory();
      refreshHistoryTimes();
    });

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
        showToast(tr("app.analysis.unexpected"), "error");
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
       exportPdfBtn?.addEventListener("click", exportBilingualPDF);
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

