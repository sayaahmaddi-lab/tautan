'use strict';
const { createNeonStore } = require('./neonStore');
const { createFileStore } = require('./fileStore');

/**
 * Pilih penyimpanan:
 * 1. Neon Postgres, bila NEON_DATABASE_URL / DATABASE_URL tersedia dan bisa dihubungi.
 * 2. File lokal data/links.json sebagai fallback (agar aplikasi tetap jalan).
 */
async function createStore() {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (url) {
    try {
      const store = await createNeonStore(url);
      console.log('Terhubung ke database Neon.');
      return store;
    } catch (err) {
      console.warn('Gagal terhubung ke Neon:', err.message);
      console.warn('Beralih ke penyimpanan file lokal. Isi NEON_DATABASE_URL yang benar lalu restart server.');
    }
  } else {
    console.warn('NEON_DATABASE_URL belum diisi — memakai penyimpanan file lokal (data/links.json).');
  }
  return createFileStore();
}

module.exports = { createStore };
