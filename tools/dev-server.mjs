// Local preview of the whole site: static pages from public/ plus the API
// routes from api/, backed by a local Postgres (PGlite) stored in .dev-db/.
//
//   npm install
//   npm run dev                      -> http://localhost:5173
//
// Optional: PORT=4000, ADMIN_USER_IDS=alice,bob (default: admin),
// DEV_DB=memory for a throwaway database.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PGlite } from '@electric-sql/pglite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'public');
const port = Number(process.env.PORT || 5173);

process.env.SESSION_SECRET ||= 'local-development-secret-not-for-production';
process.env.ADMIN_USER_IDS ??= 'admin';

const pg = process.env.DEV_DB === 'memory' ? new PGlite() : new PGlite(path.join(root, '.dev-db'));
globalThis.__DAC_LOCAL_DB__ = { query: async (text, params) => (await pg.query(text, params)).rows };

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv',
                '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };

async function handleApi(req, res, pathname) {
  const file = path.join(root, `${pathname}.js`);
  if (!file.startsWith(path.join(root, 'api')) || !fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, message: 'Not found' }));
  }
  const mod = await import(pathToFileURL(file));
  const handler = mod[req.method];
  if (!handler) { res.writeHead(405); return res.end(); }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
  });
  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}

http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.startsWith('/api/')) return await handleApi(req, res, p);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(site, p);
    if (!file.startsWith(site)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Server error');
  }
}).listen(port, () => {
  console.log(`DAC Lab Portal running at http://localhost:${port}`);
  console.log(`Admin User IDs: ${process.env.ADMIN_USER_IDS || '(none)'}`);
});
