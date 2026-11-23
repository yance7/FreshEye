import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { gzipSync } from 'node:zlib'
import { setTimeout as delay } from 'node:timers/promises'

const routes = ['/', '/guide.html', '/fish.html', '/about.html']
const port = Number(process.env.MEASURE_PORT || 4176)
const origin = `http://127.0.0.1:${port}`
const repeatArgument = process.argv.find((argument) => argument.startsWith('--repeat='))
const repetitions = Math.max(1, Number(repeatArgument?.slice('--repeat='.length) || 3))
const buildDirectoryArgument = process.argv.find((argument) => argument.startsWith('--build-dir='))
const buildDirectory = resolve(buildDirectoryArgument?.slice('--build-dir='.length) || process.env.FRONTEND_DIST_DIR || '../frontend-dist')
const server = spawn(process.execPath, ['tests/fixtures/production-server.mjs'], {
  cwd: process.cwd(),
  env: { ...process.env, FRONTEND_DIST_DIR: buildDirectory, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
})
let serverOutput = ''
server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })
server.stderr.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk })

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const response = await fetch(`${origin}/`)
      if (response.ok) return
    } catch {
      if (server.exitCode !== null) break
      await delay(100)
    }
  }
  throw new Error(`Production fixture did not start. ${serverOutput}`)
}

function toBuildFile(resourceUrl) {
  const pathname = decodeURIComponent(new URL(resourceUrl).pathname)
  const target = resolve(buildDirectory, `.${pathname}`)
  if (target !== buildDirectory && !target.startsWith(`${buildDirectory}${sep}`)) return null
  return target
}

async function measureRoute(browser, route) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block'
  })
  const page = await context.newPage()
  const failedExternalRequests = []
  page.on('requestfailed', (request) => {
    if (new URL(request.url()).origin !== origin) failedExternalRequests.push(request.url())
  })
  await page.addInitScript(() => {
    window.__fresheyePerf = { lcp: 0, cls: 0 }
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__fresheyePerf.lcp = entry.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__fresheyePerf.cls += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

  const session = await context.newCDPSession(page)
  await session.send('Network.enable')
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 200 * 1024,
    uploadThroughput: 75 * 1024
  })

  const response = await page.goto(`${origin}${route}`, { waitUntil: 'load', timeout: 120_000 })
  await page.waitForTimeout(500)
  const measured = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')
      .filter((entry) => new URL(entry.name).origin === location.origin)
    const resourceBytes = (entries) => entries.reduce((sum, entry) => sum + entry.encodedBodySize, 0)
    const timing = performance.getEntriesByType('paint')
    return {
      dclMs: Math.round(navigation.domContentLoadedEventEnd - navigation.startTime),
      loadMs: Math.round(navigation.loadEventEnd - navigation.startTime),
      fcpMs: Math.round(timing.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0),
      lcpMs: Math.round(window.__fresheyePerf.lcp),
      cls: Number(window.__fresheyePerf.cls.toFixed(4)),
      resources: resources.map((entry) => ({ name: entry.name, transferSize: entry.transferSize, bodySize: entry.encodedBodySize })),
      navigationTransferSize: navigation.transferSize,
      navigationBodySize: navigation.encodedBodySize,
      resourceTransferBytes: resources.reduce((sum, entry) => sum + entry.transferSize, 0),
      resourceBodyBytes: resourceBytes(resources)
    }
  })

  let jsGzipBytes = 0
  let cssGzipBytes = 0
  for (const resource of measured.resources) {
    const path = toBuildFile(resource.name)
    if (!path) continue
    try {
      const compressedSize = gzipSync(await readFile(path)).byteLength
      if (path.endsWith('.js')) jsGzipBytes += compressedSize
      if (path.endsWith('.css')) cssGzipBytes += compressedSize
    } catch {
      // Browser-only URLs such as data and external resources have no build file.
    }
  }

  await context.close()
  return {
    route,
    status: response?.status() ?? null,
    dclMs: measured.dclMs,
    loadMs: measured.loadMs,
    fcpMs: measured.fcpMs,
    lcpMs: measured.lcpMs,
    cls: measured.cls,
    sameOriginTransferBytes: measured.navigationTransferSize + measured.resourceTransferBytes,
    sameOriginBodyBytes: measured.navigationBodySize + measured.resourceBodyBytes,
    jsBodyBytes: measured.resources.filter((resource) => resource.name.endsWith('.js')).reduce((sum, resource) => sum + resource.bodySize, 0),
    jsGzipEstimateBytes: jsGzipBytes,
    cssBodyBytes: measured.resources.filter((resource) => resource.name.endsWith('.css')).reduce((sum, resource) => sum + resource.bodySize, 0),
    cssGzipEstimateBytes: cssGzipBytes,
    resourceCount: measured.resources.length + 1,
    failedExternalRequests
  }
}

let browser
try {
  await waitForServer()
  browser = await chromium.launch()
  const results = []
  for (const route of routes) {
    const runs = []
    for (let run = 0; run < repetitions; run++) runs.push(await measureRoute(browser, route))
    const metricNames = [
      'dclMs', 'loadMs', 'fcpMs', 'lcpMs', 'cls', 'sameOriginTransferBytes', 'sameOriginBodyBytes',
      'jsBodyBytes', 'jsGzipEstimateBytes', 'cssBodyBytes', 'cssGzipEstimateBytes', 'resourceCount'
    ]
    const median = Object.fromEntries(metricNames.map((name) => {
      const values = runs.map((result) => result[name]).sort((a, b) => a - b)
      const middle = Math.floor(values.length / 2)
      const value = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2
      return [name, Number(value.toFixed(4))]
    }))
    results.push({ route, status: runs.every((result) => result.status === 200) ? 200 : runs[0].status, median, runs })
  }
  process.stdout.write(`${JSON.stringify({ repetitions, buildDirectory, viewport: '390x844, DPR 2, touch', network: '150ms RTT, 200KiB/s down, 75KiB/s up', results }, null, 2)}\n`)
} finally {
  await browser?.close()
  server.kill()
}
