'use strict';
const { store } = require('../../lib/vercelStore');
const { sanitizeLink } = require('../../lib/validate');

module.exports = async (req, res) => {
  try {
    const id = String(req.query.id || '');
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    const s = await store();
    if (!s) return res.status(503).json({ error: 'NEON_DATABASE_URL belum diatur di Vercel.' });

    if (req.method === 'GET') {
      const link = await s.get(id);
      if (!link) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      return res.status(200).json(link);
    }
    if (req.method === 'PUT') {
      const existing = await s.get(id);
      if (!existing) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      const check = sanitizeLink(req.body, { partial: true, existing });
      if (!check.ok) return res.status(400).json({ error: check.error });
      return res.status(200).json(await s.update(id, check.value));
    }
    if (req.method === 'DELETE') {
      const ok = await s.remove(id);
      if (!ok) return res.status(404).json({ error: 'Tautan tidak ditemukan.' });
      return res.status(204).end();
    }
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  } catch (err) {
    console.error('api/links/[id]:', err);
    return res.status(500).json({ error: 'Kesalahan server.' });
  }
};
