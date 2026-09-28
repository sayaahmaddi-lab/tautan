// Uji koneksi database Neon: npm run test:db
// Memastikan koneksi, skema tabel, dan operasi CRUD dasar berfungsi.
// Aman untuk database produksi: baris uji selalu dihapus di akhir.

import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log('DATABASE_URL tidak diisi — uji database dilewati.');
  process.exit(0);
}

const SCHEMA = `create table if not exists links (
  id text primary key,
  title text not null,
  url text not null,
  description text not null default '',
  category text not null default 'Lainnya',
  favorite boolean not null default false,
  icon text default '',
  bg text default '',
  color text default '',
  created timestamptz not null default now()
)`;

const ssl = /neon\.tech|sslmode=(require|verify-ca|verify-full)/.test(url)
  ? { rejectUnauthorized: false }
  : undefined;
const client = new pg.Client({ connectionString: url, ssl });
const id = 'ci-smoke-' + Date.now();

try {
  await client.connect();
  console.log('1. Koneksi ke database ✓');

  await client.query(SCHEMA);
  console.log('2. Tabel links siap ✓');

  await client.query(
    `insert into links (id,title,url,description,category,favorite,icon,bg,color,created)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id, 'Uji CI', 'https://example.com', 'Baris uji otomatis', 'Lainnya', false, 'T', '', '', new Date()]
  );
  const { rows } = await client.query('select * from links where id=$1', [id]);
  if (rows.length !== 1 || rows[0].title !== 'Uji CI') throw new Error('Baris uji tidak ditemukan setelah insert');
  console.log('3. Insert + select ✓');

  await client.query('delete from links where id=$1', [id]);
  const after = await client.query('select count(*)::int as n from links where id=$1', [id]);
  if (after.rows[0].n !== 0) throw new Error('Baris uji tidak terhapus');
  console.log('4. Delete ✓');

  console.log('Database Neon siap dipakai — semua uji lulus.');
} finally {
  await client.end().catch(() => {});
}
