'use strict';

/** Kategori yang didukung (harus sama dengan links.js di frontend). */
const CATEGORIES = ['Produktivitas', 'Pekerjaan', 'Belajar', 'Inspirasi', 'Lainnya'];

/** Tautan bawaan — dipakai saat tabel/file penyimpanan baru dibuat. */
const seedLinks = () => [
  ['Google Drive', 'https://drive.google.com', 'Simpan, kelola, dan bagikan semua dokumen penting Anda.', 'Produktivitas', true, '△', '#edf6f0', '#68a78b'],
  ['Notion', 'https://www.notion.so', 'Ruang untuk catatan, ide, dan rencana besar berikutnya.', 'Produktivitas', true, 'N', '#f1f1f3', '#33343b'],
  ['Gmail', 'https://mail.google.com', 'Semua percakapan dan email penting dalam satu kotak masuk.', 'Pekerjaan', true, 'M', '#fceeee', '#d27878'],
  ['Figma', 'https://www.figma.com', 'Dari ide menjadi desain. Tempat berkolaborasi dan berkreasi.', 'Pekerjaan', false, '◈', '#f1edfc', '#9b79d0'],
  ['YouTube', 'https://www.youtube.com', 'Tutorial, pengetahuan baru, dan sedikit hiburan.', 'Belajar', false, '▶', '#fff0ef', '#de7272'],
  ['Pinterest', 'https://www.pinterest.com', 'Kumpulkan inspirasi visual untuk proyek Anda berikutnya.', 'Inspirasi', true, 'P', '#fcedf0', '#c96e85'],
  ['ChatGPT', 'https://chatgpt.com', 'Teman bertukar ide, mencari jawaban, dan belajar hal baru.', 'Produktivitas', false, '✳', '#eaf5f0', '#69a68d'],
  ['SIPD Indonesia', 'https://sipd.go.id', 'Buka portal resmi Sistem Informasi Pemerintahan Daerah.', 'Pekerjaan', false, '▥', '#edf2fb', '#7897c9']
].map((x, i) => ({
  id: 'default-' + i,
  title: x[0],
  url: x[1],
  description: x[2],
  category: x[3],
  favorite: x[4],
  icon: x[5],
  bg: x[6],
  color: x[7],
  created: Date.now() - i * 1000
}));

module.exports = { CATEGORIES, seedLinks };
