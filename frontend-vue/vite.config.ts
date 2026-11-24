import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

async function listOutputFiles(directory: string, parent = ''): Promise<string[]> {
  const entries = await readdir(resolve(directory, parent), { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const relative = parent ? `${parent}/${entry.name}` : entry.name
    return entry.isDirectory() ? listOutputFiles(directory, relative) : [relative]
  }))
  return nested.flat().sort()
}

function versionedServiceWorkerPlugin() {
  return {
    name: 'fresheye-versioned-service-worker',
    apply: 'build' as const,
    async closeBundle() {
      const outputDirectory = resolve(projectRoot, '../frontend-dist')
      const template = await readFile(resolve(projectRoot, 'public/sw.js'), 'utf8')
      const files = (await listOutputFiles(outputDirectory)).filter((file) => file !== 'sw.js')
      const fingerprint = createHash('sha256').update(template)
      for (const file of files) {
        const contentHash = createHash('sha256').update(await readFile(resolve(outputDirectory, file))).digest('hex')
        fingerprint.update(`\0${file}\0${contentHash}`)
      }
      const buildId = fingerprint.digest('hex').slice(0, 16)
      const precacheUrls = ['./', ...files.map((file) => `./${file}`)]
      const serviceWorker = template
        .replace("'__BUILD_ID__'", JSON.stringify(buildId))
        .replace('__PRECACHE_URLS__', JSON.stringify(precacheUrls))
      await writeFile(resolve(outputDirectory, 'sw.js'), serviceWorker)
    }
  }
}

// 鲜眸 FreshEye · Vite 构建配置
// 静态资源位于 public/assets，构建产物输出到 ../frontend-dist/。
export default defineConfig({
  base: './',
  plugins: [vue(), versionedServiceWorkerPlugin()],
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
