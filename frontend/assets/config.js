/* ============ 鲜眸（FreshEye）前端运行配置 ============ */
/* 修改 API 地址或请求超时只需改这里；
   注意：各页面 CSP 的 connect-src 需与 API_BASE_URL 同步更新。 */
(function () {
  "use strict";
  window.FreshEyeConfig = {
    API_BASE_URL: "https://andreas777-fresheye.hf.space",
    API_TIMEOUT: 60000
  };
})();
