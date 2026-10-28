// Flying birds: ambient birds drift across the sky; a flock bursts out on every reminder.
const SVG = `<svg viewBox="0 0 64 40" width="64" height="40">
  <g class="wing back"><path d="M28 21 Q16 2 4 4 Q16 14 30 24Z"/></g>
  <path d="M18 23 L2 18 L4 27Z"/>
  <ellipse cx="32" cy="24" rx="16" ry="8"/>
  <circle cx="48" cy="19" r="6"/>
  <polygon points="53,18 62,21 53,23" fill="#f6a623"/>
  <circle cx="50" cy="17" r="1.3" fill="#111"/>
  <g class="wing front"><path d="M30 21 Q20 -2 8 2 Q20 14 34 24Z"/></g>
</svg>`;
const COLORS = ['#2d4a6b', '#c0392b', '#2e8b57', '#8e44ad', '#e67e22', '#34495e'];

export function fly({ y = 5 + Math.random() * 55, dur = 8 + Math.random() * 6, scale = 0.6 + Math.random() * 0.7, delay = 0 } = {}) {
  const el = document.createElement('div');
  el.className = 'bird';
  el.style.setProperty('--y', y + 'vh');
  el.style.setProperty('--dur', dur + 's');
  el.style.setProperty('--s', scale);
  el.style.setProperty('--delay', delay + 's');
  el.style.setProperty('--bc', COLORS[Math.floor(Math.random() * COLORS.length)]);
  el.innerHTML = SVG;
  document.getElementById('birds').appendChild(el);
  el.addEventListener('animationend', e => { if (e.animationName === 'fly') el.remove(); });
}
export function flock(n = 7) {
  for (let i = 0; i < n; i++) fly({ delay: i * 0.25, dur: 4 + Math.random() * 2, y: 8 + Math.random() * 55 });
}
export function ambient() {
  if (!document.hidden) fly();
  setTimeout(ambient, 6000 + Math.random() * 8000);
}
