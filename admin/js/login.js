async function getStatus() {
  try {
    const res = await fetch('/api/admin-status', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return !!data.loggedIn;
  } catch {
    return false;
  }
}

async function goIfLoggedIn() {
  if (await getStatus()) {
    window.location.replace('./index.html');
  }
}

async function submitLogin(event) {
  event.preventDefault();
  const btn = document.getElementById('loginBtn');
  const password = String(document.getElementById('password')?.value || '').trim();
  if (!password) return;

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Signing in...';
  }

  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
    window.location.replace('./index.html');
  } catch (err) {
    alert(err.message || 'Login failed');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign in';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await goIfLoggedIn();
  document.getElementById('loginForm')?.addEventListener('submit', submitLogin);
});
