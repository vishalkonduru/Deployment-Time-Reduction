// Shared browser helpers for authenticated portal pages.
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/';
    throw new Error(data.error || 'Please log in');
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
function h(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function formatDate(iso) { return new Date(iso).toLocaleString(); }
async function logout() {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/';
}
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('logout-btn');
  if (button) button.addEventListener('click', logout);
});
