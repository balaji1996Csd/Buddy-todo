// ---- Global configuration (edit here) ----
const path = require('path');
module.exports = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  tickMs: 5000,                                  // how often the background scheduler checks tasks
  dataDir: process.env.BUDDY_DATA || path.join(__dirname, '..', 'data'),   // JSON storage folder
  pushContact: process.env.PUSH_CONTACT || 'mailto:admin@example.com',
  defaults: {                                    // used when a task does not specify a value
    durationMin: 25,   // progress block length: asks "completed?" after this
    snoozeMin: 10,     // "Later" = remind again after this
    nagMin: 5,         // re-notify every N min if you ignore a reminder (0 = off)
    character: 'cat',
    attitude: 'cheerful'
  }
};
