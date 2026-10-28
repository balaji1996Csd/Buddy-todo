// Task model + state machine + background scheduler
//
// run.status:
//   waiting    -> next reminder at run.dueAt
//   ringing    -> reminder shown, waiting for your answer (run.ask = 'start' | 'check')
//   snoozed    -> "Later" pressed, rings again at run.snoozeUntil (same question)
//   inprogress -> started at run.startedAt, asks "completed?" at run.endsAt
//   done       -> finished (one-time tasks only; daily/weekly go back to waiting)
//
// "check" loop: when the progress time ends we ask "completed?".
//   Completed     -> stop (recurring tasks schedule their next occurrence)
//   Still working -> new progress block starts, we ask again later (recursive until completed)
const { EventEmitter } = require('events');
const store = require('./store');
const cfg = require('./config');
const push = require('./push');
const { nextDue } = require('./schedule');

const MIN = 60000;
const events = new EventEmitter();   // emits 'ring' (task) -> desktop app shows the always-on-top popup
let tasks = store.read('tasks.json', []);
const save = () => store.write('tasks.json', tasks);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const find = id => tasks.find(t => t.id === id);
const num = (v, def, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && v !== '' && v !== null ? Math.min(max, Math.max(min, Math.round(n))) : def;
};
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const EMOJI = { cat: '🐱', dog: '🐶', bird: '🐦', robot: '🤖', human: '🧑' };

function clean(input) {
  const d = cfg.defaults, s = input.schedule || {};
  const type = ['once', 'daily', 'weekly'].includes(s.type) ? s.type : 'daily';
  const schedule = { type, time: /^\d{2}:\d{2}$/.test(s.time) ? s.time : '09:00' };
  if (type === 'weekly') schedule.days = (s.days || []).map(Number).filter(n => n >= 0 && n <= 6);
  if (type === 'once') schedule.date = /^\d{4}-\d{2}-\d{2}$/.test(s.date) ? s.date : localDate();
  return {
    title: String(input.title || '').trim().slice(0, 120),
    note: String(input.note || '').trim().slice(0, 500),
    character: EMOJI[input.character] ? input.character : d.character,
    attitude: ['cheerful', 'strict', 'sassy', 'chill'].includes(input.attitude) ? input.attitude : d.attitude,
    schedule,
    durationMin: num(input.durationMin, d.durationMin, 1, 1440),
    snoozeMin: num(input.snoozeMin, d.snoozeMin, 1, 1440),
    nagMin: num(input.nagMin, d.nagMin, 0, 240),
    enabled: input.enabled !== false
  };
}

const fresh = schedule => ({ status: 'waiting', dueAt: nextDue(schedule), ask: 'start', cycles: 0 });
const addLog = (t, e) => { t.log.push({ at: Date.now(), ...e }); if (t.log.length > 60) t.log.splice(0, t.log.length - 60); };

function list() { return tasks; }

function create(input) {
  const c = clean(input);
  if (!c.title) return null;
  const t = { id: uid(), ...c, run: fresh(c.schedule), log: [], createdAt: Date.now() };
  tasks.push(t); save();
  return t;
}

function update(id, input) {
  const t = find(id); if (!t) return null;
  const c = clean({ ...t, ...input });
  if (!c.title) c.title = t.title;
  const changed = JSON.stringify(c.schedule) !== JSON.stringify(t.schedule);
  Object.assign(t, c);
  if (changed) t.run = fresh(t.schedule);
  save();
  return t;
}

function remove(id) {
  const n = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  save();
  return tasks.length !== n;
}

// ---------- notifications ----------
function notify(t) {
  const ask = t.run.ask;
  events.emit('ring', t);
  push.broadcast({
    taskId: t.id,
    title: `${EMOJI[t.character]} ${t.title}`,
    body: ask === 'check' ? 'Time is up. Is it completed?' : (t.note || 'It is time!'),
    actions: [
      { action: 'complete', title: '✅ Completed' },
      { action: 'progress', title: ask === 'check' ? '🔁 Still working' : '🚧 Progress' },
      { action: 'later', title: '⏰ Later' }
    ]
  });
}

function ring(t, ask) {
  t.run.status = 'ringing';
  t.run.ask = ask;
  t.run.lastNotifiedAt = Date.now();
  addLog(t, { type: ask === 'check' ? 'check_asked' : 'reminded' });
  notify(t);
}

// ---------- finishing / user actions ----------
function finish(t) {
  if (t.schedule.type === 'once') { t.run = { status: 'done', cycles: 0 }; return; }
  const from = Math.max(Date.now(), t.run.dueAt || 0);
  t.run = { status: 'waiting', dueAt: nextDue(t.schedule, from), ask: 'start', cycles: 0 };
}

function act(id, action, minutes) {
  const t = find(id); if (!t) return null;
  const r = t.run, now = Date.now();

  switch (action) {
    case 'later': {                       // remind again later
      if (r.status !== 'ringing') return t;
      const m = num(minutes, t.snoozeMin, 1, 1440);
      r.status = 'snoozed'; r.snoozeUntil = now + m * MIN;
      addLog(t, { type: 'later', minutes: m });
      break;
    }
    case 'progress': {                    // start (or continue) working
      if (r.status === 'done') return t;
      const m = num(minutes, t.durationMin, 1, 1440);
      const continuing = !!r.startedAt;
      if (continuing) r.cycles = (r.cycles || 0) + 1; else r.startedAt = now;
      r.endsAt = now + m * MIN; r.status = 'inprogress';
      addLog(t, { type: continuing ? 'still_working' : 'started', startedAt: r.startedAt, endsAt: r.endsAt, minutes: m });
      break;
    }
    case 'complete': {                    // finished: stop (or schedule next occurrence)
      if (r.status === 'done') return t;
      const startedAt = r.startedAt || now;
      addLog(t, { type: 'completed', startedAt, completedAt: now, durationMs: now - startedAt, cycles: r.cycles || 0 });
      finish(t);
      break;
    }
    case 'test': ring(t, 'start'); break; // "Ring now" button for testing
    default: return t;
  }
  save();
  return t;
}

// ---------- background scheduler ----------
function tick() {
  const now = Date.now();
  let changed = false;
  for (const t of tasks) {
    if (!t.enabled) continue;
    const r = t.run;
    if (r.status === 'waiting' && r.dueAt && now >= r.dueAt) { ring(t, 'start'); changed = true; }
    else if (r.status === 'snoozed' && now >= r.snoozeUntil) { ring(t, r.ask || 'start'); changed = true; }
    else if (r.status === 'inprogress' && now >= r.endsAt) { ring(t, 'check'); changed = true; }
    else if (r.status === 'ringing' && t.nagMin > 0 && now - r.lastNotifiedAt >= t.nagMin * MIN) {
      r.lastNotifiedAt = now; addLog(t, { type: 'nag' }); notify(t); changed = true;
    }
  }
  if (changed) save();
}
function start() { setInterval(tick, cfg.tickMs); tick(); }

module.exports = { list, create, update, remove, act, start, events };
