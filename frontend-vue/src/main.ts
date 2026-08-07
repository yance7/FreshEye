// 鲜眸 FreshEye · Vue 应用入口
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { provideI18n } from './i18n'
import './styles/global.css'

const app = createApp(App)
app.use(router)
provideI18n(app)
app.mount('#app')

// 生产构建保留原版 PWA 能力；开发环境不注册，避免干扰 Vite HMR。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Service Worker 不影响在线分析，注册失败时静默退回普通网页模式。
    })
  }, { once: true })
}
