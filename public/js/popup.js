// Always-on-top reminder popup (opened by the Electron main process)
import * as Api from './api.js';
import * as Sound from './sound.js';
import * as Birds from './birds.js';
import { CHARS, ATTITUDES, lineFor } from './characters.js';

const $ = s => document.querySelector(s);
const id = new URLSearchParams(location.search).get('id');
let task = null;

function render(t) {
  const ch = CHARS[t.character] || CHARS.cat, at = ATTITUDES[t.attitude] || ATTITUDES.cheerful, ask = t.run.ask;
  const human = t.character === 'human';
  $('#mChar').textContent = human ? at.humanEmoji : ch.emoji;
  $('#mChar').className = 'char ' + (human ? 'h-' + t.attitude : ch.anim);
  $('#mSay').textContent = lineFor(t.character, t.attitude, ask, t.title);
  $('#mTitle').textContent = t.title;
  $('#mNote').textContent = ask === 'check' ? 'Time is up. Did you finish?' : (t.note || 'It is time!');
  $('#mProg').textContent = ask === 'check' ? '🔁 Still working' : '🚧 Start progress';
  $('#mWorkMin').value = t.durationMin; $('#mLaterMin').value = t.snoozeMin;
  document.title = '🔔 ' + t.title;
  const go = () => { Birds.flock(8); Sound.play(ch.sound); };
  Sound.unlock(); go();
  setInterval(go, 7000);                              // repeat sound + birds until you answer
}

async function answer(action, minutes) {
  try { await Api.act(id, action, minutes); } catch {}
  if (action === 'complete') { Sound.chime(); Birds.flock(10); setTimeout(() => window.close(), 1400); }
  else window.close();
}
$('#mDone').onclick = () => answer('complete');
$('#mLater').onclick = () => answer('later', +$('#mLaterMin').value);
$('#mProg').onclick = () => answer('progress', +$('#mWorkMin').value);

async function poll() {                                // close if answered elsewhere (main window / tray)
  try {
    const t = (await Api.list()).tasks.find(x => x.id === id);
    if (!t || t.run.status !== 'ringing') return window.close();
    if (!task) { task = t; render(t); }
  } catch {}
}
poll(); setInterval(poll, 3000);
