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
