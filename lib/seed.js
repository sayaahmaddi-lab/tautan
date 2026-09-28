'use strict';

/** Kategori yang didukung (harus sama dengan links.js di frontend). */
const CATEGORIES = ['Produktivitas', 'Pekerjaan', 'Belajar', 'Inspirasi', 'Lainnya'];

/** Tautan bawaan (data awal koleksi) — dipakai saat tabel/file penyimpanan baru dibuat. */
const seedLinks = () => [
  ['panel aceh tengah', 'https://panel.acehcms.id/manage/domain/pengguna/daftar/d5297d74-b00c-560c-8b70-06ec15f5013f', 'halaman panel aceh cms', 'Pekerjaan', false],
  ['mail go id', 'https://surel.mail.go.id/mailgoid/', 'mail pemerintahan', 'Pekerjaan', false],
  ['domain go id', 'https://domain.go.id/', 'domain go id', 'Pekerjaan', false],
  ['catatan pekerjaan', 'https://catatan-pekerjaan-27yy.vercel.app/', 'catatan pekerjaan', 'Produktivitas', false],
  ['catatan tugas', 'https://catatan-pekerjaan-27yy.vercel.app/tugas', 'catatan tugas', 'Produktivitas', false],
  ['sikonkep', 'https://sikonkep.vercel.app/', 'aplikasi sikonkep', 'Pekerjaan', false],
  ['download twit video', 'https://x2twitter.com/id3', 'download video twit', 'Lainnya', false]
].map((x, i) => ({
  id: 'default-' + i,
  title: x[0],
  url: x[1],
  description: x[2],
  category: x[3],
  favorite: x[4],
  icon: null,
  bg: null,
  color: null,
  created: Date.now() - i * 1000
}));

module.exports = { CATEGORIES, seedLinks };
