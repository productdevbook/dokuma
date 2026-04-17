#!/usr/bin/env node
import { createReadStream, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize, resolve } from "node:path"

const ROOT = resolve(new URL("..", import.meta.url).pathname)
const PORT = Number(process.env.PORT ?? 5173)

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`)
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === "/") pathname = "/docs/app.html"
  if (pathname.endsWith("/")) pathname += "index.html"

  let abs = normalize(join(ROOT, pathname))
  if (!abs.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden")
    return
  }

  let stat
  try {
    stat = statSync(abs)
    if (stat.isDirectory()) {
      abs = join(abs, "index.html")
      stat = statSync(abs)
    }
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found")
    return
  }

  const type = TYPES[extname(abs).toLowerCase()] ?? "application/octet-stream"
  res.writeHead(200, {
    "content-type": type,
    "cache-control": "no-store",
  })
  createReadStream(abs).pipe(res)
})

server.listen(PORT, () => {
  console.log(`dokuma docs → http://localhost:${PORT}/`)
})
