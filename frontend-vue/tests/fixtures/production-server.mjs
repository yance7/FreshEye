import { createReadStream, promises as fs } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const root = resolve(process.env.FRONTEND_DIST_DIR || resolve(process.cwd(), '../frontend-dist'))
const port = Number(process.env.PORT || 4175)
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8']
])

const server = createServer(async (request, response) => {
  const cookies = new Set((request.headers.cookie || '').split(';').map((cookie) => cookie.trim()))
  if (cookies.has('fresheye-offline-test=1')) {
    request.destroy()
    return
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', `http://${request.headers.host}`).pathname)
  } catch {
    response.writeHead(400).end()
    return
  }

  if (pathname === '/sw.js' && request.method === 'GET' && cookies.has('fresheye-previous-worker=1')) {
    const previousWorker = resolve(process.cwd(), 'tests/fixtures/previous-sw.js')
    try {
      const info = await fs.stat(previousWorker)
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Length': info.size,
        'Content-Type': 'text/javascript; charset=utf-8'
      })
      createReadStream(previousWorker).pipe(response)
    } catch {
      response.writeHead(404).end()
    }
    return
  }

  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const requestedFile = resolve(root, relativePath)
  if (requestedFile !== root && !requestedFile.startsWith(`${root}${sep}`)) {
    response.writeHead(404).end()
    return
  }

  let file = requestedFile
  let status = 200
  try {
    const info = await fs.stat(file)
    if (!info.isFile()) throw new Error('not a file')
  } catch {
    file = resolve(root, '404.html')
    status = 404
  }

  try {
    const info = await fs.stat(file)
    response.writeHead(status, {
      'Cache-Control': 'no-store',
      'Content-Length': info.size,
      'Content-Type': mimeTypes.get(extname(file).toLowerCase()) || 'application/octet-stream'
    })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
  } catch {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Production build not found. Run npm run build:only first.')
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Serving frontend-dist on http://127.0.0.1:${port}\n`)
})
