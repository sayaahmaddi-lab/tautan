'use strict';
const { Pool, types } = require('pg');
const { seedLinks } = require('./seed');

// BIGINT (int8) dikembalikan sebagai number, bukan string, agar cocok dengan frontend.
types.setTypeParser(20, (v) => parseInt(v, 10));

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS links (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'Lainnya',
  favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  icon        TEXT,
  bg          TEXT,
  color       TEXT,
  created     BIGINT NOT NULL
)`;

const COLS = ['id', 'title', 'url', 'description', 'category', 'favorite', 'icon', 'bg', 'color', 'created'];
const rowToLink = (r) => (r ? { id: r.id, title: r.title, url: r.url, description: r.description, category: r.category, favorite: r.favorite, icon: r.icon, bg: r.bg, color: r.color, created: Number(r.created) } : null);

/** Buat store yang terhubung ke Neon (Postgres). Melempar error bila koneksi gagal. */
async function createNeonStore(connectionString) {
  const useSsl = !/[?&]sslmode=disable/.test(connectionString);
  const pool = new Pool({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

  // Verifikasi koneksi sebelum deklarasi sukses.
  await pool.query('SELECT 1');

  // Migrasi skema: bila tabel belum pernah ada, buat lalu isi tautan bawaan.
  const before = await pool.query(`SELECT to_regclass('public.links') AS t`);
  await pool.query(CREATE_TABLE);
  if (!before.rows[0].t) {
    for (const s of seedLinks()) {
      await pool.query(
        `INSERT INTO links (${COLS.join(',')}) VALUES (${COLS.map((_, i) => '$' + (i + 1)).join(',')})
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.title, s.url, s.description, s.category, s.favorite, s.icon, s.bg, s.color, s.created]
      );
    }
    console.log('Tabel links dibuat, tautan bawaan di-seed ke Neon.');
  }

  return {
    kind: 'neon',
    pool,
    async list() {
      const { rows } = await pool.query(`SELECT * FROM links ORDER BY created DESC`);
      return rows.map(rowToLink);
    },
    async get(id) {
      const { rows } = await pool.query(`SELECT * FROM links WHERE id = $1`, [id]);
      return rowToLink(rows[0]);
    },
    async create(link) {
      const { rows } = await pool.query(
        `INSERT INTO links (${COLS.join(',')}) VALUES (${COLS.map((_, i) => '$' + (i + 1)).join(',')}) RETURNING *`,
        [link.id, link.title, link.url, link.description, link.category, link.favorite, link.icon, link.bg, link.color, link.created]
      );
      return rowToLink(rows[0]);
    },
    async update(id, link) {
      const { rows } = await pool.query(
        `UPDATE links SET title=$2, url=$3, description=$4, category=$5, favorite=$6, icon=$7, bg=$8, color=$9, created=$10
         WHERE id = $1 RETURNING *`,
        [id, link.title, link.url, link.description, link.category, link.favorite, link.icon, link.bg, link.color, link.created]
      );
      return rowToLink(rows[0]);
    },
    async remove(id) {
      const { rowCount } = await pool.query(`DELETE FROM links WHERE id = $1`, [id]);
      return rowCount > 0;
    }
  };
}

module.exports = { createNeonStore };
