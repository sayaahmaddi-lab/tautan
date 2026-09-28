# tautan

Koleksi tautan pribadi — aplikasi web (HTML/CSS/JS) dengan backend yang memuat
dan menyimpan **semua data dan perubahan** (tambah, edit, favorit, hapus) hanya
ke database **Neon** (Serverless Postgres). Aplikasi tidak menggunakan
`localStorage` atau penyimpanan file sebagai fallback. Database Neon harus
tersedia agar koleksi dapat digunakan.

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

Pada kunjungan pertama server membuat tabel `links` dan mengisi 7 tautan
data awal (lihat `lib/seed.js`). Perubahan berikutnya (tambah/edit/favorit/hapus) langsung ditulis ke
Neon, jadi koleksi tetap sama di semua perangkat dan browser.

## Database wajib

`NEON_DATABASE_URL` (atau `DATABASE_URL`) wajib tersedia pada server lokal dan
sebagai environment variable di Vercel. Jika database belum dikonfigurasi atau
tidak dapat dihubungi, aplikasi gagal memuat/menyimpan data dan tidak beralih
ke penyimpanan lain. Frontend harus diakses melalui server karena semua koleksi
dimuat dari endpoint `/api/links`.

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
lib/            — store Neon (pg), validasi, dan seed
api/            — endpoint serverless yang membaca/menulis Neon
.env            — NEON_DATABASE_URL (di-gitignore)
```

## Perintah

```bash
npm start   # jalankan server
npm run dev # jalankan dengan auto-reload (node --watch)
```
