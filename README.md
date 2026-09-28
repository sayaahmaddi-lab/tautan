# tautan

Koleksi tautan pribadi — aplikasi web (HTML/CSS/JS) dengan backend kecil yang
menyimpan **semua perubahan** (tambah, edit, favorit, hapus) ke database
**Neon** (Serverless Postgres).

**Database Neon adalah satu-satunya penyimpanan.** Tidak ada fallback ke
`localStorage`/`sessionStorage` browser, tidak ada data contoh bawaan di
frontend, dan tidak ada file penyimpanan lokal. Halaman selalu membaca koleksi
dari `GET /api/links`. Bila API/database tidak tersedia, aplikasi menampilkan
pesan kesalahan dan membiarkan koleksi kosong — bukan diam-diam menyimpan di
browser.

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

5. Buka <http://localhost:3000>. Status di sidebar akan berbunyi
   **“Tersimpan di database Neon”**.

> File `.env` sudah masuk `.gitignore` — connection string tidak pernah
> di-commit ke git.

Pada kunjungan pertama server membuat tabel `links` dan mengisi 7 tautan
data awal (lihat `lib/seed.js`). Perubahan berikutnya (tambah/edit/favorit/hapus)
langsung ditulis ke Neon, jadi koleksi tetap sama di semua perangkat dan browser.

## Hanya Neon — tanpa fallback

* `lib/store.js` (server lokal) **hanya** membuat store Neon. Bila
  `NEON_DATABASE_URL`/`DATABASE_URL` kosong atau koneksi gagal, `npm start`
  berhenti dengan pesan jelas (`Gagal memulai server: …`).
* `api/links.js` (Vercel serverless) memakai driver HTTP Neon. Bila
  `NEON_DATABASE_URL` belum diatur di Vercel, endpoint mengembalikan
  `{"storage":"unavailable","links":null}` dan halaman menampilkan pesan
  kesalahan — tanpa menulis apa pun di browser.
* `index.html` **wajib** dibuka lewat server/Vercel. Membuka file HTML langsung
  dari disk tidak lagi menyimpan atau menampilkan data.

## Deployment Vercel

1. Import repositori ini di Vercel (framework: *Other*, tanpa build command).
2. Tambahkan Environment Variable `NEON_DATABASE_URL` (connection string
   *pooled* dari Neon) untuk environment **Production** dan **Preview**.
3. Deploy. Verifikasi:

   ```bash
   curl -s https://<domain-anda>/api/links | head -c 200
   # → {"storage":"neon","links":[…]}
   ```

Selama `NEON_DATABASE_URL` belum diisi, `/api/links` mengembalikan
`storage: "unavailable"` dan antarmuka menampilkan kesalahan pemuatan.

## API

| Method   | Endpoint         | Keterangan                       |
| -------- | ---------------- | -------------------------------- |
| `GET`    | `/api/health`    | Cek server + jenis penyimpanan   |
| `GET`    | `/api/links`     | Daftar semua tautan dari Neon    |
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
links.js        — logika frontend; data hanya dari GET /api/links (tanpa localStorage)
server.js       — server Express (API + file statis)
api/            — serverless function Vercel (/api/links, /api/links/[id], /api/health)
lib/            — store Neon (pg & driver HTTP), validasi, seed, loader .env
.env            — NEON_DATABASE_URL (di-gitignore)
```

## Perintah

```bash
npm start     # jalankan server
npm run dev   # jalankan dengan auto-reload (node --watch)
npm run cek-db # uji koneksi ke database Neon
```
