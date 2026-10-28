const express = require('express');
const path = require('path');
const cfg = require('./src/config');
const engine = require('./src/engine');
const push = require('./src/push');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- tasks API ----
app.get('/api/tasks', (req, res) => res.json({ now: Date.now(), tasks: engine.list() }));
app.post('/api/tasks', (req, res) => {
  const t = engine.create(req.body || {});
  t ? res.status(201).json(t) : res.status(400).send('title required');
});
app.put('/api/tasks/:id', (req, res) => {
  const t = engine.update(req.params.id, req.body || {});
  t ? res.json(t) : res.status(404).send('not found');
});
app.delete('/api/tasks/:id', (req, res) =>
  engine.remove(req.params.id) ? res.json({ ok: true }) : res.status(404).send('not found'));
app.post('/api/tasks/:id/action', (req, res) => {
  const { action, minutes } = req.body || {};
  const t = engine.act(req.params.id, action, minutes);
  t ? res.json(t) : res.status(404).send('not found');
});

// ---- push API (browser mode) ----
app.get('/api/push/key', (req, res) => res.json({ key: push.publicKey() }));
app.post('/api/push/subscribe', (req, res) => { push.add(req.body); res.json({ ok: true }); });

function start() {
  return new Promise((resolve, reject) => {
    const srv = app.listen(cfg.port, cfg.host, () => {
      console.log(`Buddy Todo running on http://localhost:${cfg.port}`);
      engine.start();
      resolve(srv);
    });
    srv.on('error', reject);
  });
}
if (require.main === module) start();       // `npm run web` (browser mode)
module.exports = { start };
