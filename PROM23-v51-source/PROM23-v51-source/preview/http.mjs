import { createServer, request as httpRequest } from 'node:http';
import { createReadStream, existsSync, statSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
const headers = { 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' };
export function createPreview({ root, apiPort, hosts }) {
  root = resolve(root);
  const counters = new Map();
  let brandRoutes = null;
  try { brandRoutes = JSON.parse(readFileSync(resolve(root, 'brands/routes.json'), 'utf8')); } catch {}
  const server = createServer((req, res) => {
    for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
    const end = (status, message) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ error: { code: `HTTP_${status}`, message } })); };
    if (!hosts.includes(req.headers.host)) return end(403, 'Адрес предпросмотра не разрешён');
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); if (pathname.includes('\0')) throw new Error(); }
    catch { return end(400, 'Некорректный адрес'); }
    if (pathname === '/api' || pathname.startsWith('/api/') || pathname === '/health') {
      const now = Date.now();
      const peer = req.socket.remoteAddress;
      // The private SSH tunnel reaches this loopback listener; one shared budget is deliberate.
      if (counters.size > 200) for (const [ip, value] of counters) if (value.until < now) counters.delete(ip);
      const entry = counters.get(peer) ?? { count: 0, until: now + 60000 };
      if (entry.until < now) { entry.count = 0; entry.until = now + 60000; }
      counters.set(peer, entry);
      if (++entry.count > 600) { res.setHeader('Retry-After', '60'); return end(429, 'Слишком много действий. Подождите минуту'); }
      const upstream = httpRequest({ hostname: '127.0.0.1', port: apiPort, path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${apiPort}`, connection: 'close' }, timeout: 15000 }, response => {
        res.writeHead(response.statusCode, { ...response.headers, ...headers }); response.pipe(res);
      });
      upstream.on('timeout', () => upstream.destroy());
      upstream.on('error', () => { if (!res.headersSent) end(502, 'Тестовый сервер временно недоступен'); else res.destroy(); });
      req.on('aborted', () => upstream.destroy());
      return req.pipe(upstream);
    }
    if (!['GET', 'HEAD'].includes(req.method)) return end(405, 'Метод не поддерживается');
    if (pathname === '/robots.txt') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('User-agent: *\nDisallow: /\n'); }
    const brandPath = pathname.match(/^\/brands(?:\/([^/]+))?\/?$/);
    if (brandRoutes && brandPath) {
      const slug = brandPath[1], canonical = slug ? brandRoutes.aliases[slug] ?? brandRoutes.aliases[slug.toLocaleLowerCase('ru')] ?? slug.toLocaleLowerCase('ru') : null;
      if (canonical && !brandRoutes.slugs.includes(canonical)) return end(404, 'Бренд не найден');
      const canonicalPath = canonical ? `/brands/${canonical}/` : '/brands/';
      if (pathname !== canonicalPath) { res.writeHead(308, { Location: canonicalPath + new URL(req.url, 'http://localhost').search, 'Cache-Control': 'no-store' }); return res.end(); }
    }
    let file = resolve(root, `.${pathname}`);
    if (brandRoutes && brandPath && existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
    if (file !== root && !file.startsWith(root + sep)) return end(403, 'Адрес не разрешён');
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (extname(pathname)) return end(404, 'Файл не найден');
      file = resolve(root, 'index.html');
    }
    if (!existsSync(file)) return end(503, 'Предпросмотр ещё собирается');
    if (extname(file) === '.docx') res.setHeader('Content-Disposition', 'attachment; filename="prom23-requisites.docx"');
    const type = types[extname(file)] || 'application/octet-stream';
    const zipped = /(?:^|[,\s])gzip(?:[,;\s]|$)/.test(req.headers['accept-encoding'] ?? '') && existsSync(file + '.gz');
    const storedFile = zipped ? file + '.gz' : file;
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://prom.myfast.space; font-src 'self' data:; connect-src 'self'; media-src 'self' https://prom.myfast.space https://prom23.ru https://www.prom23.ru https://prom-krd.ru; frame-src https://rutube.ru https://www.youtube-nocookie.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': statSync(storedFile).size, 'Vary': 'Accept-Encoding', ...(zipped ? { 'Content-Encoding': 'gzip' } : {}), 'Cache-Control': type.startsWith('text/html') ? 'no-store' : 'public, max-age=3600' });
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(storedFile); stream.on('error', () => res.destroy()); stream.pipe(res);
  });
  server.requestTimeout = 20000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000; server.maxConnections = 48;
  return server;
}
