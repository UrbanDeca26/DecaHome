const crypto = require('crypto');
const { getSupabase } = require('../lib/supabase');

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

function isAdminRequest(req) {
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'luxury-stay-secret').trim();
  const cookies = parseCookies(req);
  const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
  return !!expected && cookies.luxury_owner_session === expected;
}

function normalizeBooking(row) {
  return {
    id: row.id,
    booking_ref: row.booking_ref,
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    checkin: row.checkin,
    checkout: row.checkout,
    guests: row.guests,
    pets: row.pets,
    note: row.note,
    pricing: row.pricing,
    total: row.total,
    status: row.status,
    review_token: row.review_token,
    review_submitted: row.review_submitted,
    review_invitation_sent: row.review_invitation_sent,
    review_invitation_sent_at: row.review_invitation_sent_at,
    created_at: row.created_at,
  };
}

module.exports = async function handler(req, res) {
  try {
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'Admin access required' });
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) return res.status(500).json({ error: error.message || 'Failed to load bookings' });
      return res.status(200).json({ bookings: Array.isArray(data) ? data.map(normalizeBooking) : [] });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (!body || typeof body !== 'object') body = await readBody(req);
      const action = String(body.action || '').trim();
      const id = String(body.id || body.bookingRef || body.booking_ref || '').trim();
      if (!id) return res.status(400).json({ error: 'Missing booking reference or id' });

      const { data: existing, error: findError } = await supabase
        .from('bookings')
        .select('*')
        .or(`id.eq.${id},booking_ref.eq.${id}`)
        .maybeSingle();
      if (findError || !existing) return res.status(404).json({ error: 'Booking not found' });

      if (action === 'cancel') {
        const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', existing.id);
        if (error) return res.status(500).json({ error: error.message || 'Failed to cancel booking' });
        return res.status(200).json({ ok: true });
      }

      if (action === 'update') {
        const status = String(body.status || 'pending').trim().toLowerCase();
        const { error } = await supabase.from('bookings').update({ status }).eq('id', existing.id);
        if (error) return res.status(500).json({ error: error.message || 'Failed to update booking' });
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process bookings request' });
  }
};
