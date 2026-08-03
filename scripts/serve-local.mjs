import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, sep } from 'node:path'

const root = resolve(process.cwd(), 'dist')
const port = Number(process.env.VFX_FLOW_PORT ?? process.argv[2] ?? 4173)
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' }

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No built dist/index.html was found at ${root}. Run npm run local:build first.`)
  process.exit(1)
}

const server = createServer((request, response) => {
  if (!request.url || !['GET', 'HEAD'].includes(request.method ?? '')) {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Method not allowed')
    return
  }
  let pathname
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname) } catch { response.writeHead(400); response.end('Bad request'); return }
  const candidate = resolve(root, `.${normalize(pathname)}`)
  if (candidate !== root && !candidate.startsWith(root + sep)) { response.writeHead(403); response.end('Forbidden'); return }
  const file = existsSync(candidate) && statSync(candidate).isFile() ? candidate : join(root, 'index.html')
  const body = readFileSync(file)
  response.writeHead(200, { 'Content-Type': mimeTypes[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable' })
  if (request.method === 'HEAD') response.end()
  else response.end(body)
})

server.on('error', (error) => { console.error(`Local server could not start: ${error.message}`); process.exit(1) })
server.listen(port, '127.0.0.1', () => console.log(`VFX / FLOW local server: http://127.0.0.1:${port}/`))

process.on('SIGINT', () => server.close(() => process.exit(0)))
process.on('SIGTERM', () => server.close(() => process.exit(0)))
