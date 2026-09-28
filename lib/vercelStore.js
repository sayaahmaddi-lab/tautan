'use strict';
/**
 * Store Neon untuk Vercel Serverless Functions (driver HTTP, tanpa koneksi
* persistent — cara yang didukung resmi Neon + Vercel). Interface sama dengan
 * lib/neonStore.js yang dipakai server lokal.
 */
const { neon } = require('@neondatabase/serverless');
const { seedLinks } = require('./seed');

let sqlFn = null;
let ensured = false;

function getSql() {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) return null;
  if (!sqlFn) sqlFn = neon(url);
  return sqlFn;
}

const rowToLink = (r) =>
  r
    ? { id: r.id, title: r.title, url: r.url, description: r.description, category: r.category, favorite: r.favorite, icon: r.icon, bg: r.bg, color: r.color, created: Number(r.created) }
    : null;

async function ensure(sql) {
  if (ensured) return;
  const before = await sql`SELECT to_regclass('public.links') AS t`;
  await sql`CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'Lainnya',
    favorite BOOLEAN NOT NULL DEFAULT FALSE, icon TEXT, bg TEXT, color TEXT, created BIGINT NOT NULL
  )`;
  if (!before[0].t) {
    for (const s of seedLinks()) {
      await sql`INSERT INTO links (id,title,url,description,category,favorite,icon,bg,color,created)
        VALUES (${s.id},${s.title},${s.url},${s.description},${s.category},${s.favorite},${s.icon},${s.bg},${s.color},${s.created})
        ON CONFLICT (id) DO NOTHING`;
    }
  }
  ensured = true;
}

/** @returns {Promise<null|object>} null bila NEON_DATABASE_URL belum diatur. */
async function store() {
  const sql = getSql();
  if (!sql) return null;
  await ensure(sql);
  return {
    kind: 'neon',
    async list() {
      const rows = await sql`SELECT * FROM links ORDER BY created DESC`;
      return rows.map(rowToLink);
    },
    async get(id) {
      const rows = await sql`SELECT * FROM links WHERE id = ${id}`;
      return rowToLink(rows[0]);
    },
    async create(l) {
      const rows = await sql`INSERT INTO links (id,title,url,description,category,favorite,icon,bg,color,created)
        VALUES (${l.id},${l.title},${l.url},${l.description},${l.category},${l.favorite},${l.icon},${l.bg},${l.color},${l.created}) RETURNING *`;
      return rowToLink(rows[0]);
    },
    async update(id, l) {
      const rows = await sql`UPDATE links SET title=${l.title}, url=${l.url}, description=${l.description},
        category=${l.category}, favorite=${l.favorite}, icon=${l.icon}, bg=${l.bg}, color=${l.color}, created=${l.created}
        WHERE id = ${id} RETURNING *`;
      return rowToLink(rows[0]);
    },
    async remove(id) {
      const rows = await sql`DELETE FROM links WHERE id = ${id} RETURNING id`;
      return rows.length > 0;
    }
  };
}

module.exports = { store };
