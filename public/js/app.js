import * as Api from './api.js';
import * as Sound from './sound.js';
import * as Birds from './birds.js';
import { CHARS, ATTITUDES, lineFor } from './characters.js';

const $ = (s, r = document) => r.querySelector(s);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let tasks = [], offset = 0, lastSig = '', editingId = null;
let modalTask = null, soundTimer = null, pushActive = false;
const shown = {};                       // taskId -> lastNotifiedAt already popped up

const now = () => Date.now() + offset;
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDT = ts => new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function fmtDur(ms) {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : m ? `${m}m ${String(x).padStart(2, '0')}s` : `${x}s`;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 4000);
}

/* ---------------- form ---------------- */
const f = $('#taskForm');
const E = f.elements;
for (const [k, c] of Object.entries(CHARS)) E.character.add(new Option(`${c.emoji} ${c.name}`, k));
for (const [k, a] of Object.entries(ATTITUDES)) E.attitude.add(new Option(a.label, k));

function syncForm() {
  const type = E.stype.value;
  $('#dateRow').classList.toggle('hidden', type !== 'once');
  $('#daysRow').classList.toggle('hidden', type !== 'weekly');
}
E.stype.addEventListener('change', syncForm);

function resetForm() {
  editingId = null; f.reset(); E.date.value = today();
  $('#formTitle').textContent = 'New task'; $('#cancelEdit').hidden = true; syncForm();
}
$('#cancelEdit').onclick = resetForm;

f.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    title: E.title.value, note: E.note.value, character: E.character.value, attitude: E.attitude.value,
    schedule: {
      type: E.stype.value, time: E.time.value, date: E.date.value,
      days: [...f.querySelectorAll('input[name=day]:checked')].map(x => +x.value)
    },
    durationMin: +E.durationMin.value, snoozeMin: +E.snoozeMin.value, nagMin: +E.nagMin.value,
    enabled: E.enabled.checked
  };
  try {
    editingId ? await Api.update(editingId, data) : await Api.create(data);
    resetForm(); refresh(true);
  } catch (err) { toast('Could not save: ' + err.message); }
});

function startEdit(t) {
  editingId = t.id;
  E.title.value = t.title; E.note.value = t.note; E.character.value = t.character; E.attitude.value = t.attitude;
  E.stype.value = t.schedule.type; E.time.value = t.schedule.time; E.date.value = t.schedule.date || today();
  f.querySelectorAll('input[name=day]').forEach(x => x.checked = (t.schedule.days || []).includes(+x.value));
  E.durationMin.value = t.durationMin; E.snoozeMin.value = t.snoozeMin; E.nagMin.value = t.nagMin;
  E.enabled.checked = t.enabled;
  $('#formTitle').textContent = 'Edit task'; $('#cancelEdit').hidden = false;
  syncForm(); window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- list ---------------- */
function scheduleText(s) {
  if (s.type === 'daily') return `Every day at ${s.time}`;
  if (s.type === 'weekly') return `${(s.days.length ? s.days : []).map(d => DAYS[d]).join(', ') || 'Weekly'} at ${s.time}`;
  return `Once on ${s.date} at ${s.time}`;
}
function statusHtml(t) {
  const r = t.run;
  switch (r.status) {
    case 'waiting': return `⏳ Next in <b data-cd="${r.dueAt}"></b> (${fmtDT(r.dueAt)})`;
    case 'ringing': return `🔔 <b>${r.ask === 'check' ? 'Is it finished?' : 'Time to start!'}</b>`;
    case 'snoozed': return `⏰ Reminding again in <b data-cd="${r.snoozeUntil}"></b>`;
    case 'inprogress': return `🚧 In progress · started ${fmtTime(r.startedAt)} · check at ${fmtTime(r.endsAt)} (<b data-cd="${r.endsAt}"></b>)${r.cycles ? ` · round ${r.cycles + 1}` : ''}`;
    case 'done': return '✅ Done';
  }
  return '';
}
function logLine(l) {
  const at = fmtDT(l.at);
  switch (l.type) {
    case 'reminded': return `${at} – reminder`;
    case 'nag': return `${at} – reminder repeated`;
    case 'check_asked': return `${at} – asked "completed?"`;
    case 'later': return `${at} – later (${l.minutes} min)`;
    case 'started': return `${at} – started, check at ${fmtTime(l.endsAt)}`;
    case 'still_working': return `${at} – still working, next check ${fmtTime(l.endsAt)}`;
    case 'completed': return `${at} – ✅ completed · started ${fmtTime(l.startedAt)} → finished ${fmtTime(l.completedAt)} (${fmtDur(l.durationMs)})`;
  }
  return at;
}
function render() {
  const el = $('#list');
  if (!tasks.length) { el.innerHTML = '<div class="card empty">No tasks yet. Create your first one 👈</div>'; return; }
  el.innerHTML = tasks.map(t => {
    const ch = CHARS[t.character] || CHARS.cat, st = t.run.status;
    const face = t.character === 'human' ? (ATTITUDES[t.attitude] || ATTITUDES.cheerful).humanEmoji : ch.emoji;
    const canWork = st !== 'done' && st !== 'inprogress';
    return `<article class="task ${t.enabled ? '' : 'off'}" data-id="${t.id}">
      <div class="face">${face}</div>
      <div>
        <h3>${esc(t.title)}</h3>
        <div class="meta">${scheduleText(t.schedule)} · ${esc((ATTITUDES[t.attitude] || {}).label || '')} ${esc(ch.name)}${t.enabled ? '' : ' · disabled'}</div>
        ${t.note ? `<div class="meta">${esc(t.note)}</div>` : ''}
        <div class="status">${statusHtml(t)}</div>
        <div class="btns">
          ${st !== 'done' ? '<button class="btn ok small" data-act="complete">✅ Complete</button>' : ''}
          ${canWork ? '<button class="btn warn small" data-act="progress">🚧 Start progress</button>' : ''}
          <button class="btn small" data-act="test">🔔 Ring now</button>
          <button class="btn small" data-act="edit">✏️ Edit</button>
          <button class="btn bad small" data-act="delete">🗑</button>
        </div>
        ${t.log.length ? `<details><summary>History (${t.log.length})</summary><ul>${t.log.slice(-15).reverse().map(l => `<li>${logLine(l)}</li>`).join('')}</ul></details>` : ''}
      </div></article>`;
  }).join('');
  tickCountdowns();
}
function tickCountdowns() {
  document.querySelectorAll('[data-cd]').forEach(n => n.textContent = fmtDur(+n.dataset.cd - now()));
}
setInterval(tickCountdowns, 1000);

$('#list').addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const id = b.closest('.task').dataset.id, t = tasks.find(x => x.id === id), a = b.dataset.act;
  try {
    if (a === 'edit') return startEdit(t);
    if (a === 'delete') { if (confirm(`Delete "${t.title}"?`)) await Api.remove(id); }
    else if (a === 'progress') {
      const m = prompt('Work for how many minutes before I ask if it is completed?', t.durationMin);
      if (m === null) return;
      await Api.act(id, 'progress', +m);
    } else {
      await Api.act(id, a);
      if (a === 'complete') { Sound.chime(); Birds.flock(8); }
    }
    refresh(true);
  } catch (err) { toast(err.message); }
});

/* ---------------- reminder popup ---------------- */
function openModal(t) {
  modalTask = t;
  const ch = CHARS[t.character] || CHARS.cat, at = ATTITUDES[t.attitude] || ATTITUDES.cheerful, ask = t.run.ask;
  const human = t.character === 'human';
  $('#mChar').textContent = human ? at.humanEmoji : ch.emoji;
  $('#mChar').className = 'char ' + (human ? 'h-' + t.attitude : ch.anim);
  $('#mSay').textContent = lineFor(t.character, t.attitude, ask, t.title);
  $('#mTitle').textContent = t.title;
  $('#mNote').textContent = ask === 'check' ? 'Time is up. Did you finish?' : (t.note || 'It is time!');
  $('#mProg').textContent = ask === 'check' ? '🔁 Still working' : '🚧 Start progress';
  $('#mWorkMin').value = t.durationMin; $('#mLaterMin').value = t.snoozeMin;
  $('#modal').classList.remove('hidden');
  document.title = '🔔 ' + t.title;
  Birds.flock(8);
  Sound.play(ch.sound);
  clearInterval(soundTimer);
  soundTimer = setInterval(() => Sound.play(ch.sound), 7000);   // repeat until you answer
}
function closeModal() {
  $('#modal').classList.add('hidden'); clearInterval(soundTimer);
  modalTask = null; document.title = 'Buddy Todo';
}
async function modalAct(a, m) {
  if (!modalTask) return;
  const id = modalTask.id; closeModal();
  try {
    await Api.act(id, a, m);
    if (a === 'complete') { Sound.chime(); Birds.flock(10); }
  } catch (err) { toast(err.message); }
  refresh(true);
}
$('#mDone').onclick = () => modalAct('complete');
$('#mLater').onclick = () => modalAct('later', +$('#mLaterMin').value);
$('#mProg').onclick = () => modalAct('progress', +$('#mWorkMin').value);

async function checkRinging() {
  if (window.buddyDesktop) return;                   // desktop app shows its own always-on-top popup
  if (modalTask) {                                   // close if answered elsewhere (e.g. notification button)
    const cur = tasks.find(t => t.id === modalTask.id);
    if (!cur || cur.run.status !== 'ringing') closeModal();
    return;
  }
  for (const t of tasks) {
    if (!t.enabled || t.run.status !== 'ringing' || shown[t.id] === t.run.lastNotifiedAt) continue;
    shown[t.id] = t.run.lastNotifiedAt;
    openModal(t);
    if (document.hidden && !pushActive && Notification.permission === 'granted') {   // fallback when push is unavailable
      const reg = await navigator.serviceWorker?.ready;
      reg?.showNotification(t.title, { body: t.run.ask === 'check' ? 'Is it completed?' : (t.note || 'It is time!'),
        tag: t.id, requireInteraction: true, icon: '/icon.svg', data: { taskId: t.id },
        actions: [{ action: 'complete', title: '✅ Completed' }, { action: 'progress', title: '🚧 Progress' }, { action: 'later', title: '⏰ Later' }] });
    }
    break;
  }
}

/* ---------------- polling ---------------- */
async function refresh(force) {
  try {
    const d = await Api.list();
    offset = d.now - Date.now();
    const sig = JSON.stringify(d.tasks);
    tasks = d.tasks;
    if (force || sig !== lastSig) { lastSig = sig; render(); }
    checkRinging();
  } catch (e) { console.warn(e); }
}
setInterval(refresh, 4000);

/* ---------------- notifications / push ---------------- */
const b64 = s => {
  const p = '='.repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};
async function enableNotifications() {
  Sound.unlock(); Sound.chime();
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return toast('Push is not supported here (needs HTTPS or localhost). In-app reminders still work.');
  }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return toast('Notifications are blocked in browser settings.');
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await Api.pushKey();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
    }
    await Api.subscribe(sub.toJSON());
    pushActive = true; $('#enableBtn').textContent = '✅ Notifications on';
    toast('Background notifications enabled 🎉');
  } catch (err) { toast('Push setup failed: ' + err.message); }
}
$('#enableBtn').onclick = enableNotifications;
if (window.buddyDesktop) $('#enableBtn').classList.add('hidden');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
  navigator.serviceWorker.addEventListener('message', e => { if (e.data?.type === 'refresh') refresh(true); });
  navigator.serviceWorker.ready.then(async reg => {      // already subscribed before?
    if (Notification.permission === 'granted' && await reg.pushManager.getSubscription()) {
      pushActive = true; $('#enableBtn').textContent = '✅ Notifications on';
    }
  });
}
document.addEventListener('click', () => Sound.unlock(), { once: true });   // browsers need a click before audio

/* ---------------- start ---------------- */
resetForm(); refresh(true); Birds.ambient();
