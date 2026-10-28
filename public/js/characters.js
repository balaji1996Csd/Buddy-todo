// Characters (animals / robot / human) and their attitude messages.
export const CHARS = {
  cat:   { emoji: '🐱', name: 'Cat',   sound: 'meow',  say: 'Meow!',      anim: 'bounce'  },
  dog:   { emoji: '🐶', name: 'Dog',   sound: 'bark',  say: 'Woof woof!', anim: 'jump'    },
  bird:  { emoji: '🐦', name: 'Bird',  sound: 'chirp', say: 'Tweet tweet!', anim: 'flutter' },
  robot: { emoji: '🤖', name: 'Robot', sound: 'robot', say: 'BEEP-BOOP!', anim: 'glitch'  },
  human: { emoji: '🧑', name: 'Human (no sound)', sound: null, say: '', anim: 'sway' }
};

// Human has no sound, so attitude is shown with face, gesture and animation.
export const ATTITUDES = {
  cheerful: { label: 'Cheerful', humanEmoji: '🙋', gesture: '*waves and grins*',
    start: ['You can do this! Let’s start "{t}"!', 'Yay, it’s time for "{t}"! Go go go!', 'Fresh start! "{t}" is waiting for you!'],
    check: ['Time’s up! Did you finish "{t}"? 🎉', 'How did it go with "{t}"? All done?', 'Ding! Is "{t}" complete?'] },
  strict:   { label: 'Strict',   humanEmoji: '😠', gesture: '*arms crossed, tapping foot*',
    start: ['"{t}". Now. No excuses.', 'It is time for "{t}". Get to it.', 'Stop stalling. "{t}" needs doing.'],
    check: ['Time is up. Is "{t}" finished? Be honest.', 'Report: is "{t}" done or not?', 'Deadline reached for "{t}". Status?'] },
  sassy:    { label: 'Sassy',    humanEmoji: '💁', gesture: '*flips hair, raises eyebrow*',
    start: ['Oh, you forgot "{t}"? Shocking. 💅', '"{t}" won’t do itself, darling.', 'Still scrolling? "{t}" is calling.'],
    check: ['So… did you actually finish "{t}"? 👀', 'Time’s up! "{t}" done, or just vibes?', 'I’m waiting. Is "{t}" complete?'] },
  chill:    { label: 'Chill',    humanEmoji: '😎', gesture: '*leans back, thumbs up*',
    start: ['Hey, whenever you’re ready: "{t}".', 'No rush, but "{t}" is up next.', 'Easy does it. Time for "{t}".'],
    check: ['Time’s up. How’s "{t}" going?', 'All good? Is "{t}" done yet?', 'Just checking in on "{t}".'] }
};

const pick = a => a[Math.floor(Math.random() * a.length)];

export function lineFor(character, attitude, ask, title) {
  const c = CHARS[character] || CHARS.cat, a = ATTITUDES[attitude] || ATTITUDES.cheerful;
  const text = pick(ask === 'check' ? a.check : a.start).replace('{t}', title);
  return character === 'human' ? `${a.gesture}  ${text}` : `${c.say}  ${text}`;
}
