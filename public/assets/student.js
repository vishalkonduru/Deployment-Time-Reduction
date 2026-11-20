const subjectSelect = document.getElementById('subject');
const requestForm = document.getElementById('request-form');
const formMessage = document.getElementById('form-message');

function fillTable(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.replaceChildren();
  rows.forEach((cells) => {
    const tr = document.createElement('tr');
    cells.forEach((cell) => tr.appendChild(h('td', cell.text, cell.className)));
    tbody.appendChild(tr);
  });
}
function renderProfile(profile) {
  document.getElementById('welcome').textContent = `Welcome, ${profile.name}`;
  fillTable('marks-body', profile.marks.map((m) => [
    { text: m.subject }, { text: String(m.marks) }, { text: String(m.maxMarks) },
  ]));
  fillTable('attendance-body', profile.attendance.map((a) => {
    const percent = Math.round((a.attended / a.total) * 100);
    return [
      { text: a.subject },
      { text: `${a.attended} / ${a.total}` },
      { text: `${percent}%`, className: percent < 75 ? 'low' : '' },
    ];
  }));
  subjectSelect.replaceChildren();
  profile.marks.forEach((m) => {
    const option = h('option', m.subject);
    option.value = m.subject;
    subjectSelect.appendChild(option);
  });
}
function renderRequests(requests) {
  const list = document.getElementById('request-list');
  list.replaceChildren();
  if (!requests.length) {
    list.appendChild(h('p', 'You have not raised any requests yet.', 'muted'));
    return;
  }
  requests.forEach((r) => {
    const item = h('div', undefined, 'request-item');
    item.appendChild(h('strong', `Review marks: ${r.subject} `));
    item.appendChild(h('span', r.status, `badge ${r.status}`));
    item.appendChild(h('p', r.reason));
    item.appendChild(h('p', `Raised on ${formatDate(r.createdAt)}`, 'muted'));
    if (r.status !== 'pending') item.appendChild(h('p', `Admin message: ${r.adminMessage || '(no message)'}`, 'reply'));
    list.appendChild(item);
  });
}
async function loadRequests() { renderRequests(await api('/api/student/requests')); }
requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  formMessage.className = '';
  try {
    await api('/api/student/requests', {
      method: 'POST',
      body: JSON.stringify({ subject: subjectSelect.value, reason: document.getElementById('reason').value }),
    });
    requestForm.reset();
    formMessage.textContent = 'Request sent to admin';
    formMessage.className = 'success';
    await loadRequests();
  } catch (err) {
    formMessage.textContent = err.message;
    formMessage.className = 'error';
  }
});
(async function init() {
  renderProfile(await api('/api/student/profile'));
  await loadRequests();
  setInterval(loadRequests, 10000);
})();
