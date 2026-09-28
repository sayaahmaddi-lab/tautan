'use strict';
const { createNeonStore } = require('./neonStore');

/**
 * Penyimpanan aplikasi: HANYA database Neon (Postgres).
 * Tidak ada fallback ke file lokal atau browser. Bila NEON_DATABASE_URL belum
 * diatur (atau koneksi gagal), server berhenti dengan pesan yang jelas agar
 * tidak ada data yang diam-diam tersimpan di tempat lain.
 */
async function createStore() {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'NEON_DATABASE_URL belum diatur. Aplikasi ini hanya memakai database Neon — ' +
        'salin .env.example menjadi .env lalu isi connection string dari dashboard Neon.'
    );
  }
  const store = await createNeonStore(url);
  console.log('Terhubung ke database Neon (satu-satunya penyimpanan).');
  return store;
}

module.exports = { createStore };
