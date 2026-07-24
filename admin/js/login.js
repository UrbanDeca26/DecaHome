(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);

  async function checkExistingSession() {
    try {
      const data = await window.LuxuryAdminStore.apiFetch('/api/admin-status', { method: 'GET' });
      if (data.loggedIn) window.location.replace('./');
    } catch (_) {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    const password = String($('#adminPassword')?.value || '').trim();
    if (!password) return;
    const btn = $('#adminLoginForm button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in...';
    }
    try {
      await window.LuxuryAdminStore.apiFetch('/api/admin-login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      window.location.replace('./');
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    $('#adminLoginForm')?.addEventListener('submit', handleLogin);
  });
})();
