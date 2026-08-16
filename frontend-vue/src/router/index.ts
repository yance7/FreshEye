// 鲜眸 FreshEye · 路由配置
// 使用 createWebHashHistory 以兼容 GitHub Pages 静态部署
import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { titleKey: 'home', metaKey: 'home' }
  },
  {
    path: '/guide',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
    meta: { titleKey: 'guide', metaKey: 'guide' }
  },
  {
    path: '/fish',
    name: 'fish',
    component: () => import('@/views/FishView.vue'),
    meta: { titleKey: 'fish', metaKey: 'fish' }
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { titleKey: 'about', metaKey: 'about' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titleKey: 'notfound', metaKey: 'notfound' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

/** GitHub Pages 保留五个旧静态入口；首次加载时把入口文件映射到同一套 Vue 视图。 */
export function getEntryRoute(pathname = typeof window === 'undefined' ? '/' : window.location.pathname): string {
  const file = pathname.split('/').pop()?.toLowerCase() ?? ''
  if (file === 'guide.html') return '/guide'
  if (file === 'fish.html') return '/fish'
  if (file === 'about.html') return '/about'
  if (file === '404.html') return '/404'
  return '/'
}

export default router
