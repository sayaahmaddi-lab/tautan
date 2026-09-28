# tautan

Koleksi tautan pribadi — aplikasi web statis (HTML/CSS/JS) dengan backend kecil
yang menyimpan **semua perubahan** (tambah, edit, favorit, hapus) ke database
**Neon** (Serverless Postgres). Jika database belum dikonfigurasi, server
otomatis memakai penyimpanan file lokal, dan bila dibuka tanpa server
(klik dua kali `index.html`), data tetap disimpan di `localStorage` browser
seperti versi lama.

## Menjalankan dengan database Neon

1. Buat proyek gratis di [neon.tech](https://neon.tech), lalu salin
   **Connection string** (menu *Connection string* → *pooled*).
2. Siapkan file environment:

   ```bash
   cp .env.example .env
   ```

3. Buka file `.env`, lalu tempel connection string:

   ```
   NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require
   ```

4. Install dependensi dan jalankan server:

   ```bash
   npm install
   npm start
   ```

5. Buka <http://localhost:3000>. Status di sidebar akan berubah menjadi
   **“Tersimpan di database Neon”**.

> File `.env` sudah masuk `.gitignore` — connection string tidak pernah
> di-commit ke git.

Pada kunjungan pertama server membuat tabel `links` dan mengisi 8 tautan
bawaan. Perubahan berikutnya (tambah/edit/favorit/hapus) langsung ditulis ke
Neon, jadi koleksi tetap sama di semua perangkat dan browser.

## Tanpa Neon (fallback)

Jika `NEON_DATABASE_URL` kosong atau tidak bisa dihubungi, server tetap jalan
dengan penyimpanan file `data/links.json` (status sidebar: *“Tersimpan di
server lokal”*). Cukup isi `.env` lalu restart `npm start` — data di file
otomatis ter-dorong ke Neon pada kunjungan berikutnya oleh halaman web
(link yang belum ada di server diunggah saat halaman dibuka).

## Mode tanpa server (versi lama)

`index.html` masih bisa dibuka langsung tanpa server. Dalam mode ini semua
perubahan disimpan di `localStorage` browser seperti sebelumnya — hanya
berlaku di browser tersebut. Saat halaman dibuka lewat server nanti, koleksi
lokal otomatis disinkronkan ke database.

## API

| Method   | Endpoint         | Keterangan                       |
| -------- | ---------------- | -------------------------------- |
| `GET`    | `/api/health`    | Cek server + jenis penyimpanan   |
| `GET`    | `/api/links`     | Daftar semua tautan              |
| `GET`    | `/api/links/:id` | Satu tautan                      |
| `POST`   | `/api/links`     | Tambah tautan                    |
| `PUT`    | `/api/links/:id` | Perbarui tautan (partial aman)   |
| `DELETE` | `/api/links/:id` | Hapus tautan                     |

Semua input divalidasi di server (nama wajib, URL `http(s)`, kategori,
panjang maksimum).

## Skema tabel `links`

```sql
CREATE TABLE links (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'Lainnya',
  favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  icon        TEXT,
  bg          TEXT,
  color       TEXT,
  created     BIGINT NOT NULL          -- epoch milidetik
);
```

Migrasi berjalan otomatis saat server start (`CREATE TABLE IF NOT EXISTS`),
tanpa tool migrasi tambahan.

## Struktur

```
index.html      — halaman aplikasi
links.css       — gaya
links.js        — logika frontend + sinkronisasi API
server.js       — server Express (API + file statis)
lib/            — store Neon (pg), store file fallback, validasi, seed
data/           — penyimpanan fallback (di-gitignore)
.env            — NEON_DATABASE_URL (di-gitignore)
```

## Perintah

```bash
npm start   # jalankan server
npm run dev # jalankan dengan auto-reload (node --watch)
```
