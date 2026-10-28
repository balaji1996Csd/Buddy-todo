// All sounds are synthesized with Web Audio (no audio files needed).
// cat = meow, dog = bark, bird = chirp, robot = beep-boop, human = silent (attitude only)
let ctx;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export const unlock = () => ac();

function env(g, t, attack, dur, peak) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function noise(t, dur, peak) {
  const c = ac();
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const a = buf.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 1500;
  env(g, t, 0.005, dur, peak);
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

function meow() {
  const c = ac(), t = c.currentTime;
  const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(450, t);
  o.frequency.linearRampToValueAtTime(850, t + 0.18);
  o.frequency.linearRampToValueAtTime(500, t + 0.7);
  f.type = 'bandpass'; f.Q.value = 3;
  f.frequency.setValueAtTime(900, t);
  f.frequency.linearRampToValueAtTime(2200, t + 0.3);
  f.frequency.linearRampToValueAtTime(1000, t + 0.7);
  env(g, t, 0.05, 0.75, 0.5);
  o.connect(f).connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.8);
}

function bark() {
  const c = ac();
  for (let i = 0; i < 2; i++) {
    const t = c.currentTime + i * 0.28;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(320, t);
    o.frequency.exponentialRampToValueAtTime(110, t + 0.14);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    env(g, t, 0.01, 0.16, 0.7);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.2);
    noise(t, 0.08, 0.3);
  }
}

function chirp() {
  const c = ac();
  [0, 0.18, 0.36, 0.7, 0.88].forEach(off => {
    const t = c.currentTime + off;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(2200, t);
    o.frequency.exponentialRampToValueAtTime(4200, t + 0.07);
    o.frequency.exponentialRampToValueAtTime(2800, t + 0.12);
    env(g, t, 0.01, 0.13, 0.25);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.15);
  });
}

function robot() {
  const c = ac();
  [523, 784, 392, 988, 659].forEach((fq, i) => {
    const t = c.currentTime + i * 0.11;
    const o = c.createOscillator(), m = c.createOscillator();
    const mg = c.createGain(), g = c.createGain();
    o.type = 'square'; o.frequency.value = fq;
    m.type = 'sine'; m.frequency.value = 60; mg.gain.value = fq * 0.5;   // metallic FM wobble
    m.connect(mg).connect(o.frequency);
    env(g, t, 0.005, 0.1, 0.18);
    o.connect(g).connect(c.destination);
    o.start(t); m.start(t); o.stop(t + 0.11); m.stop(t + 0.11);
  });
}

export function chime() {          // success sound
  try {
    const c = ac();
    [523, 659, 784, 1047].forEach((fq, i) => {
      const t = c.currentTime + i * 0.12;
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = fq;
      env(g, t, 0.01, 0.35, 0.25);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + 0.4);
    });
  } catch {}
}

export function play(sound) {      // 'meow' | 'bark' | 'chirp' | 'robot' | null (human = silent)
  try { ({ meow, bark, chirp, robot }[sound] || (() => {}))(); } catch {}
}
