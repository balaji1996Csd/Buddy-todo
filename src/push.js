// Web Push (real background notifications, even when the tab is closed)
const webpush = require('web-push');
const store = require('./store');
const cfg = require('./config');

let keys = store.read('vapid.json', null);
if (!keys) { keys = webpush.generateVAPIDKeys(); store.write('vapid.json', keys); }
webpush.setVapidDetails(cfg.pushContact, keys.publicKey, keys.privateKey);

let subs = store.read('subs.json', []);

const publicKey = () => keys.publicKey;

function add(sub) {
  if (!sub || !sub.endpoint) return;
  if (!subs.find(s => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    store.write('subs.json', subs);
  }
}
function remove(endpoint) {
  subs = subs.filter(s => s.endpoint !== endpoint);
  store.write('subs.json', subs);
}
async function broadcast(payload) {
  const body = JSON.stringify(payload);
  await Promise.all(subs.map(async s => {
    try { await webpush.sendNotification(s, body); }
    catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) remove(s.endpoint);
      else console.error('push error:', e.statusCode || e.message);
    }
  }));
}
module.exports = { publicKey, add, remove, broadcast };
