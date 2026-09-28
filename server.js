// server.js — Tautan: server statis + API penyimpanan.
// Database utama: Neon Postgres (via DATABASE_URL). Tanpa DATABASE_URL,
// data disimpan di data/links.json sebagai cadangan agar tetap bisa dipakai.

import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- muat berkas .env sederhana (tanpa dependensi tambahan) ----
try {
  const envText = await readFile(new URL('./.env', import.meta.url), 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { /* .env bersifat opsional */ }

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(ROOT, 'data', 'links.json');

const SCHEMA = `create table if not exists links (
  id text primary key,
  title text not null,
  url text not null,
  description text not null default '',
  category text not null default 'Lainnya',
  favorite boolean not null default false,
  icon text default '',
  bg text default '',
  color text default '',
  created timestamptz not null default now()
)`;

let pool = null;

async function initDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('[t] DATABASE_URL tidak diisi — memakai penyimpanan file data/links.json.');
    return false;
  }
  try {
    const { default: pg } = await import('pg');
    const ssl = /neon\.tech|sslmode=(require|verify-ca|verify-full)/.test(url)
      ? { rejectUnauthorized: false }
      : undefined;
    pool = new pg.Pool({ connectionString: url, ssl, max: 4 });
    await pool.query(SCHEMA);
    console.log('[t] Terhubung ke database Neon. Tabel links siap.');
    return true;
  } catch (err) {
    console.error('[t] Gagal terhubung ke database, memakai penyimpanan file:', err.message);
    pool = null;
    return false;
  }
}

function fromRow(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description ?? '',
    category: row.category,
    favorite: !!row.favorite,
    icon: row.icon ?? '',
    bg: row.bg ?? '',
    color: row.color ?? '',
    created: new Date(row.created).getTime(),
  };
}

async function readAll() {
  if (pool) {
    const { rows } = await pool.query('select * from links order by created desc');
    return rows.map(fromRow);
  }
  try {
    const data = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    return (Array.isArray(data) ? data : []).sort((a, b) => (b.created || 0) - (a.created || 0));
  } catch {
    return [];
  }
}

async function writeAll(items) {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(items, null, 1));
}

function normalize(item) {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    description: typeof item.description === 'string' ? item.description : '',
    category: typeof item.category === 'string' && item.category ? item.category : 'Lainnya',
    favorite: !!item.favorite,
    icon: typeof item.icon === 'string' ? item.icon : '',
    bg: typeof item.bg === 'string' ? item.bg : '',
    color: typeof item.color === 'string' ? item.color : '',
    created: Number(item.created) || Date.now(),
  };
}

async function upsert(item) {
  const record = normalize(item);
  if (pool) {
    await pool.query(
      `insert into links (id,title,url,description,category,favorite,icon,bg,color,created)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do update set
         title=excluded.title, url=excluded.url, description=excluded.description,
         category=excluded.category, favorite=excluded.favorite, icon=excluded.icon,
         bg=excluded.bg, color=excluded.color, created=excluded.created`,
      [record.id, record.title, record.url, record.description, record.category,
        record.favorite, record.icon, record.bg, record.color, new Date(record.created)]
    );
    return record;
  }
  const items = (await readAll()).filter((x) => x.id !== record.id);
  items.unshift(record);
  await writeAll(items);
  return record;
}

async function remove(id) {
  if (pool) {
    await pool.query('delete from links where id=$1', [id]);
    return;
  }
  await writeAll((await readAll()).filter((x) => x.id !== id));
}

// ---- HTTP: API + berkas statis ----
function sendJSON(res, code, data) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data ?? null));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 512 * 1024) req.destroy();
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('JSON tidak valid')); }
    });
    req.on('error', reject);
  });
}

function validItem(x) {
  if (!x || typeof x.id !== 'string' || !x.id.trim()) return false;
  if (typeof x.title !== 'string' || !x.title.trim()) return false;
  if (typeof x.url !== 'string' || !x.url.trim()) return false;
  if (x.url === 'dashboard.html') return true;
  try { return ['http:', 'https:'].includes(new URL(x.url).protocol); } catch { return false; }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function serveStatic(res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.normalize(path.join(ROOT, rel));
  const inside = file === path.join(ROOT, 'index.html') || file.startsWith(ROOT + path.sep);
  const blocked = /(^|[\\/])(\.git|node_modules|data)([\\/]|$)|(^|[\\/])\./.test(file.slice(ROOT.length));
  if (!inside || blocked) return sendJSON(res, 404, { error: 'Tidak ditemukan' });
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch {
    sendJSON(res, 404, { error: 'Tidak ditemukan' });
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/api/status' && req.method === 'GET') {
      return sendJSON(res, 200, { database: !!pool, engine: pool ? 'neon' : 'file' });
    }
    if (pathname === '/api/links' && req.method === 'GET') {
      return sendJSON(res, 200, await readAll());
    }
    if (pathname === '/api/links' && req.method === 'POST') {
      const item = await readBody(req);
      if (!validItem(item)) return sendJSON(res, 400, { error: 'Data tautan tidak valid.' });
      return sendJSON(res, 201, await upsert(item));
    }
    if (pathname.startsWith('/api/links/') && req.method === 'DELETE') {
      await remove(decodeURIComponent(pathname.slice('/api/links/'.length)));
      return sendJSON(res, 200, { ok: true });
    }
    if (pathname.startsWith('/api/')) {
      return sendJSON(res, 404, { error: 'Endpoint tidak ditemukan.' });
    }
    return await serveStatic(res, pathname);
  } catch (err) {
    return sendJSON(res, 500, { error: err.message || 'Kesalahan server.' });
  }
});

await initDatabase();
server.listen(PORT, HOST, () => {
  console.log(`[t] Tautan berjalan di http://${HOST}:${PORT}`);
});
