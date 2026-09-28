'use strict';
const fs = require('fs');
const path = require('path');

/** Muat file .env sederhana tanpa dependensi eksternal. Nilai yang sudah ada di environment tidak ditimpa. */
function loadEnv(dir = __dirname) {
  try {
    const raw = fs.readFileSync(path.join(dir, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  } catch {
    /* .env tidak ada — bukan masalah */
  }
}

module.exports = { loadEnv };
