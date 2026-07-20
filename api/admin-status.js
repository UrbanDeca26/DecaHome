const crypto = require('crypto');

function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  raw.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  });
  return out;
}

function makeToken(password, secret) {
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

module.exports = async function handler(req, res) {
  try {
    const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
    const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'luxury-stay-secret').trim();
    const cookies = parseCookies(req);
    const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
    return res.status(200).json({ loggedIn: !!expected && cookies.luxury_owner_session === expected });
  } catch (_) {
    return res.status(200).json({ loggedIn: false });
  }
};
