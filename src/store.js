// Tiny JSON file store with atomic writes. Swap with PostgreSQL later if you want.
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

fs.mkdirSync(cfg.dataDir, { recursive: true });
const file = n => path.join(cfg.dataDir, n);

function read(name, fallback) {
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); }
  catch { return fallback; }
}
function write(name, data) {
  const tmp = file(name) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file(name));
}
module.exports = { read, write };
