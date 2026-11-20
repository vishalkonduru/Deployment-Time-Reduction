const form = document.getElementById('login-form');
const errorBox = document.getElementById('error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errorBox.textContent = data.error || 'Login failed';
    return;
  }
  window.location.href = data.redirect;
});
