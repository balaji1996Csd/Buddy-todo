const j = async (url, opt) => {
  const r = await fetch(url, opt);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const body = (method, data) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const list = () => j('/api/tasks');
export const create = d => j('/api/tasks', body('POST', d));
export const update = (id, d) => j('/api/tasks/' + id, body('PUT', d));
export const remove = id => j('/api/tasks/' + id, { method: 'DELETE' });
export const act = (id, action, minutes) => j(`/api/tasks/${id}/action`, body('POST', { action, minutes }));
export const pushKey = () => j('/api/push/key');
export const subscribe = s => j('/api/push/subscribe', body('POST', s));
