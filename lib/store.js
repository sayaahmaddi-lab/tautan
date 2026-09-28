'use strict';
const { createNeonStore } = require('./neonStore');

/** Neon adalah satu-satunya penyimpanan; startup gagal jika database tidak tersedia. */
async function createStore() {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('NEON_DATABASE_URL belum diatur. Aplikasi membutuhkan database Neon.');

  try {
    const store = await createNeonStore(url);
    console.log('Terhubung ke database Neon.');
    return store;
  } catch (err) {
    console.error('Gagal terhubung ke Neon:', err.message);
    throw new Error('Tidak dapat terhubung ke database Neon; aplikasi tidak akan memakai penyimpanan lain.', { cause: err });
  }
}

module.exports = { createStore };
