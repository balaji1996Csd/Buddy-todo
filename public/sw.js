// Service worker: shows push notifications with action buttons, handles clicks in background
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Reminder' };
  const max = (self.Notification && Notification.maxActions) || 2;   // some OSes show only 2 buttons
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    tag: d.taskId,
    renotify: true,
    requireInteraction: true,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { taskId: d.taskId },
    actions: (d.actions || []).slice(0, max)
  }));
});

self.addEventListener('notificationclick', e => {
  const { taskId } = e.notification.data || {};
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (e.action && taskId) {                       // complete | progress | later pressed
      await fetch(`/api/tasks/${taskId}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: e.action })
      });
      wins.forEach(c => c.postMessage({ type: 'refresh' }));
      return;
    }
    if (wins.length) { await wins[0].focus(); wins[0].postMessage({ type: 'refresh' }); }
    else await clients.openWindow('/');             // body click opens the app + popup
  })());
});
