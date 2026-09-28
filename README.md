# tautan

Koleksi tautan pribadi — halaman statis + server API dengan database **Neon Postgres**.

## Menjalankan dengan database Neon (disarankan)

1. Buat proyek gratis di [Neon](https://neon.tech), lalu salin *connection string*
   (disarankan endpoint `-pooler`) dari konsol Neon.
2. `cp .env.example .env` lalu isi `DATABASE_URL=...`
3. `npm install`
4. `npm start` → buka http://localhost:3000

Tabel `links` dibuat otomatis saat server mulai (lihat `schema.sql`).
Saat pertama tersambung, koleksi yang ada di browser otomatis disalin ke database.
Tanpa `DATABASE_URL`, data disimpan di `data/links.json` (cadangan).

## Menjalankan tanpa server

Buka `index.html` langsung di browser — memakai penyimpanan lokal browser
(localStorage) seperti versi sebelumnya.

## API

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/links` | Daftar semua tautan |
| POST | `/api/links` | Tambah/ubah satu tautan (upsert berdasarkan id) |
| DELETE | `/api/links/:id` | Hapus tautan |
| GET | `/api/status` | Status penyimpanan (`neon` / `file`) |
