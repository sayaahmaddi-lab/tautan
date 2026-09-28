'use strict';
/** Cek koneksi ke database Neon dari mesin lokal:  node lib/cek-db.js  (atau: npm run cek-db) */
const path = require('path');
const { loadEnv } = require('./env');

loadEnv(path.join(__dirname, '..'));

(async () => {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('✖ NEON_DATABASE_URL belum diisi. Salin .env.example menjadi .env lalu isi connection string Neon.');
    process.exit(1);
  }
  console.log('Menghubungi Neon…');
  const store = await require('./neonStore').createNeonStore(url);
  const links = await store.list();
  console.log('✔ Terhubung! Penyimpanan:', store.kind);
  console.log('✔ Jumlah tautan di tabel links:', links.length);
  console.log('5 terbaru:');
  for (const l of links.slice(0, 5)) console.log('  -', l.title, '|', l.url);
  await store.pool.end();
  process.exit(0);
})().catch((err) => {
  console.error('✖ Gagal terhubung ke Neon:', err.message);
  console.error('  - Periksa connection string di .env');
  console.error('  - Pastikan jaringan Anda mengizinkan koneksi ke port 5432 (Postgres)');
  process.exit(1);
});
