const { getSupabase } = require('../lib/supabase');

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
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

function isAdminRequest(req) {
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'luxury-stay-secret').trim();
  const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
  const cookies = parseCookies(req);
  return !!expected && cookies.luxury_owner_session === expected;
}

function normalizeAvailability(row) {
  return {
    bookingRef: String(row.booking_reference || row.bookingRef || row.id || '').trim(),
    checkin: String(row.checkin || '').trim(),
    checkout: String(row.checkout || '').trim(),
    status: String(row.status || '').trim().toLowerCase(),
    note: String(row.note || '').trim(),
    createdAt: row.created_at || row.createdAt || null,
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_reference, checkin, checkout, status, note, created_at, updated_at, guest_name, guest_email')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to load availability' });
    }

    const rows = Array.isArray(data) ? data.map(normalizeAvailability).filter((row) => row.bookingRef) : [];

    if (isAdminRequest(req)) {
      return res.status(200).json({ availability: rows });
    }

    const publicRows = rows.filter((row) => row.status !== 'cancelled' && row.status !== 'rejected');
    return res.status(200).json({ availability: publicRows });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load availability' });
  }
};
