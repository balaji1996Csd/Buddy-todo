// Computes the next due time (ms) for a schedule: once | daily | weekly (local server time)
function nextDue(s, from = Date.now()) {
  const [h, m] = s.time.split(':').map(Number);

  if (s.type === 'once') {
    const [y, mo, d] = s.date.split('-').map(Number);
    return new Date(y, mo - 1, d, h, m, 0, 0).getTime();
  }

  const days = s.type === 'daily'
    ? [0, 1, 2, 3, 4, 5, 6]
    : (s.days && s.days.length ? s.days : [new Date(from).getDay()]);

  for (let i = 0; i <= 7; i++) {
    const t = new Date(from);
    t.setDate(t.getDate() + i);
    t.setHours(h, m, 0, 0);
    if (days.includes(t.getDay()) && t.getTime() > from) return t.getTime();
  }
  return null;
}
module.exports = { nextDue };
