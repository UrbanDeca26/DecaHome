
const crypto = require('crypto');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function makeToken(password, secret) {
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = req.body && typeof req.body === 'object' ? req.body : await readBody(req);
    const password = String(body.password || '').trim();
    const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
    const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'luxury-stay-secret').trim();

    if (!adminPassword) {
      return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured' });
    }
    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = makeToken(adminPassword, adminSecret);
    const cookie = [
      `luxury_owner_session=${token}`,
      'HttpOnly',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=604800',
      req.headers?.host?.includes('localhost') ? '' : 'Secure',
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
};
