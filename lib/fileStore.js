'use strict';
const fs = require('fs/promises');
const path = require('path');
const { seedLinks } = require('./seed');

/**
 * Penyimpanan fallback: satu file JSON di folder data/ (dipakai saat
 * NEON_DATABASE_URL belum diisi). Interface sama dengan neonStore.
 */
async function createFileStore(file = path.join(__dirname, '..', 'data', 'links.json')) {
  let links = null;

  async function load() {
    if (links) return links;
    try {
      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      links = Array.isArray(parsed) ? parsed : seedLinks();
    } catch {
      links = seedLinks(); // file baru → isi dengan tautan bawaan
    }
    return links;
  }

  async function persist() {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(links, null, 2), 'utf8');
    await fs.rename(tmp, file);
  }

  return {
    kind: 'file',
    async list() {
      return [...(await load())].sort((a, b) => b.created - a.created);
    },
    async get(id) {
      return (await load()).find((x) => x.id === id) || null;
    },
    async create(link) {
      const rows = await load();
      rows.push(link);
      await persist();
      return link;
    },
    async update(id, link) {
      const rows = await load();
      const i = rows.findIndex((x) => x.id === id);
      if (i === -1) return null;
      rows[i] = link;
      await persist();
      return link;
    },
    async remove(id) {
      const rows = await load();
      const i = rows.findIndex((x) => x.id === id);
      if (i === -1) return false;
      rows.splice(i, 1);
      await persist();
      return true;
    }
  };
}

module.exports = { createFileStore };
