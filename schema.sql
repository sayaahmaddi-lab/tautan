-- Skema database Tautan untuk Neon Postgres.
-- Tabel ini juga dibuat otomatis oleh server.js saat pertama dijalankan.

create table if not exists links (
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
);

create index if not exists links_created_idx on links (created desc);
