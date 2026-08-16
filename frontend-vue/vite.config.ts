import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// 鲜眸 FreshEye · Vite 构建配置
// 静态资源位于 public/assets，构建产物输出到 ../frontend-dist/。
export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: '../frontend-dist',
    emptyOutDir: true,
    target: 'es2019',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        index: resolve(projectRoot, 'index.html'),
        guide: resolve(projectRoot, 'guide.html'),
        fish: resolve(projectRoot, 'fish.html'),
        about: resolve(projectRoot, 'about.html'),
        notFound: resolve(projectRoot, '404.html')
      },
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
