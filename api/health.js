'use strict';
module.exports = async (req, res) => {
  const configured = !!(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
  res.status(200).json({ ok: true, storage: configured ? 'neon' : 'unavailable' });
};
