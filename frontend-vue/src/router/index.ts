// 鲜眸 FreshEye · 路由配置
// 使用 HTML5 history，与 Vite 的多页面静态入口配合，避免公开 URL 出现 #/
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { titleKey: 'home', metaKey: 'home' }
  },
  {
    path: '/guide.html',
    name: 'guide',
    component: () => import('@/views/GuideView.vue'),
    meta: { titleKey: 'guide', metaKey: 'guide' }
  },
  {
    path: '/fish.html',
    name: 'fish',
    component: () => import('@/views/FishView.vue'),
    meta: { titleKey: 'fish', metaKey: 'fish' }
  },
  {
    path: '/about.html',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { titleKey: 'about', metaKey: 'about' }
  },
  {
    path: '/404.html',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titleKey: 'notfound', metaKey: 'notfound' }
  },
  {
    path: '/guide',
    redirect: '/guide.html'
  },
  {
    path: '/fish',
    redirect: '/fish.html'
  },
  {
    path: '/about',
    redirect: '/about.html'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found-fallback',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titleKey: 'notfound', metaKey: 'notfound' }
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router
