'use strict';
const express = require('express');
const { loadEnv } = require('./lib/env');

loadEnv(__dirname);
const { createStore } = require('./lib/store');
const { sanitizeLink } = require('./lib/validate');

(async () => {
  const store = await createStore();
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  // Jangan layani folder & file internal.
  app.use('/data', (req, res) => res.status(403).end());
  app.use('/.git', (req, res) => res.status(403).end());
  app.use('/lib', (req, res) => res.status(403).end());
  app.use((req, res, next) => {
    if (['/server.js', '/package.json', '/package-lock.json'].includes(req.path)) return res.status(403).end();
    next();
  });

  // ---------- API ----------
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, storage: store.kind });
  });

  app.get('/api/links', async (req, res, next) => {
    try {
      res.json({ storage: store.kind, links: await store.list() });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/links/:id', async (req, res, next) => {
    try {
      const link = await store.get(req.params.id);
      if (!link) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      res.json(link);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/links', async (req, res, next) => {
    try {
      const check = sanitizeLink(req.body);
      if (!check.ok) return res.status(400).json({ error: check.error });
      res.status(201).json(await store.create(check.value));
    } catch (err) {
      next(err);
    }
  });

  app.put('/api/links/:id', async (req, res, next) => {
    try {
      const existing = await store.get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      const check = sanitizeLink(req.body, { partial: true, existing });
      if (!check.ok) return res.status(400).json({ error: check.error });
      res.json(await store.update(req.params.id, check.value));
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/links/:id', async (req, res, next) => {
    try {
      const ok = await store.remove(req.params.id);
      if (!ok) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));

  // ---------- Aset statis ----------
  app.use(express.static(__dirname, { dotfiles: 'ignore', index: 'index.html' }));

  // ---------- Error handler ----------
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
      return res.status(400).json({ error: 'Body JSON tidak valid.' });
    }
    console.error('Kesalahan server:', err);
    res.status(500).json({ error: 'Kesalahan server. Perubahan tidak tersinkron.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tautan berjalan di http://0.0.0.0:${PORT} (penyimpanan: ${store.kind})`);
  });
})().catch((err) => {
  console.error('Gagal memulai server:', err);
  process.exit(1);
});
