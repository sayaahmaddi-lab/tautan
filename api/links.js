'use strict';
const { store } = require('../lib/vercelStore');
const { sanitizeLink } = require('../lib/validate');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const s = await store();
      // Belum ada NEON_DATABASE_URL di Vercel → biarkan frontend memakai mode lokal.
      if (!s) return res.status(200).json({ storage: 'unavailable', links: null });
      return res.status(200).json({ storage: s.kind, links: await s.list() });
    }
    if (req.method === 'POST') {
      const s = await store();
      if (!s) return res.status(503).json({ error: 'NEON_DATABASE_URL belum diatur di Vercel.' });
      const check = sanitizeLink(req.body);
      if (!check.ok) return res.status(400).json({ error: check.error });
      return res.status(201).json(await s.create(check.value));
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method tidak diizinkan.' });
  } catch (err) {
    console.error('api/links:', err);
    return res.status(500).json({ error: 'Kesalahan server.' });
  }
};
