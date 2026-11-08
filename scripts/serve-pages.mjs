// Strict static server that behaves like GitHub Pages (story 018): serves <siteDir> only under
// <base>, a directory serves its index.html, everything else is 404 (no SPA fallback), no path escape.
// Usage: node scripts/serve-pages.mjs <siteDir> <base> <port>
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [siteArg, base, portArg] = process.argv.slice(2);
const port = Number(portArg);
if (!siteArg || !base?.startsWith('/') || !base.endsWith('/') || !Number.isInteger(port)) {
  console.error('usage: node scripts/serve-pages.mjs <siteDir> <base> <port>');
  process.exit(2);
}
const site = resolve(siteArg);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

async function resolveFile(urlPath) {
  if (!urlPath.startsWith(base)) return undefined;
  let rel;
  try {
    rel = decodeURIComponent(urlPath.slice(base.length));
  } catch {
    return undefined;
  }
  if (rel.includes('\0')) return undefined;
  let file = join(site, normalize(rel));
  if (file !== site && !file.startsWith(site + sep)) return undefined;
  const info = await stat(file).catch(() => undefined);
  if (info?.isDirectory()) {
    // Like Pages: a directory without trailing slash redirects to it.
    return urlPath.endsWith('/') ? join(file, 'index.html') : { redirect: `${urlPath}/` };
  }
  return file;
}

createServer(async (req, res) => {
  const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
  try {
    const file = await resolveFile(urlPath);
    if (typeof file === 'object') {
      res.writeHead(301, { location: file.redirect });
      res.end();
      return;
    }
    const body = file && (await readFile(file));
    if (!file || !body) throw new Error('not found');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}).listen(port, '127.0.0.1', () =>
  console.log(`serve-pages: ${site} on http://127.0.0.1:${port}${base}`),
);
