'use strict';
const crypto = require('crypto');
const { CATEGORIES } = require('./seed');

function validUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) || (parsed.protocol === 'file:' && parsed.pathname.startsWith('/')) || url === 'dashboard.html';
  } catch {
    return false;
  }
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Validasi & sanitasi satu baris tautan.
 * @param {object} body - data dari klien
 * @param {{partial?: boolean, existing?: object}} opts
 *   partial=true  → hanya pakai field yang diberikan (untuk PUT), digabung dengan `existing`.
 * @returns {{ok: true, value: object} | {ok: false, error: string}}
 */
function sanitizeLink(body, opts = {}) {
  const { partial = false, existing = null } = opts;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Body JSON tidak valid.' };

  const src = partial && existing ? { ...existing, ...body } : body;
  const value = {};

  const title = str(src.title);
  if (!title || title.length > 80) return { ok: false, error: 'Nama tautan wajib diisi (maks 80 karakter).' };
  value.title = title;

  const url = str(src.url);
  if (!validUrl(url)) return { ok: false, error: 'Alamat harus berupa URL http(s) atau lokasi file lokal yang valid.' };
  value.url = url;

  value.description = str(src.description).slice(0, 160);

  const category = str(src.category);
  value.category = CATEGORIES.includes(category) ? category : CATEGORIES[CATEGORIES.length - 1];

  value.favorite = src.favorite === true || src.favorite === 'true';

  for (const f of ['icon', 'bg', 'color']) {
    const v = str(src[f]);
    value[f] = v ? v.slice(0, 40) : null;
  }

  const created = Number(src.created);
  value.created = Number.isFinite(created) && created > 0 && created < 1e15 ? Math.floor(created) : Date.now();

  if (partial && existing) {
    value.id = existing.id;
  } else {
    const id = str(src.id);
    value.id = /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : crypto.randomUUID();
  }

  return { ok: true, value };
}

module.exports = { validUrl, sanitizeLink };
