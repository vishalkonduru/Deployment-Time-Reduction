const list = document.getElementById('request-list');
async function respond(id, status, message) {
  await api(`/api/admin/requests/${id}/respond`, {
    method: 'POST', body: JSON.stringify({ status, message }),
  });
  await loadRequests();
}
function buildItem(r) {
  const item = h('div', undefined, 'request-item');
  item.appendChild(h('strong', `${r.studentName}: ${r.subject} `));
  item.appendChild(h('span', r.status, `badge ${r.status}`));
  item.appendChild(h('p', r.reason));
  item.appendChild(h('p', `Raised on ${formatDate(r.createdAt)}`, 'muted'));
  if (r.status !== 'pending') {
    item.appendChild(h('p', `Your message: ${r.adminMessage || '(no message)'}`, 'reply'));
    return item;
  }
  const message = document.createElement('textarea');
  message.placeholder = 'Message to the student (optional)';
  const error = h('p', '', 'error');
  const send = (status) => async () => {
    try { await respond(r.id, status, message.value); }
    catch (err) { error.textContent = err.message; }
  };
  const accept = h('button', 'Accept', 'accept');
  accept.addEventListener('click', send('accepted'));
  const reject = h('button', 'Reject', 'reject');
  reject.addEventListener('click', send('rejected'));
  item.append(message, accept, reject, error);
  return item;
}
async function loadRequests() {
  const requests = await api('/api/admin/requests');
  list.replaceChildren();
  if (!requests.length) {
    list.appendChild(h('p', 'No requests yet.', 'muted'));
    return;
  }
  requests.forEach((r) => list.appendChild(buildItem(r)));
}
loadRequests();
