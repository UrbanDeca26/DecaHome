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

function parseBookingDate(value) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const bookingRef = String(body.bookingRef || body.bookingReference || '').trim();
    const reviewToken = String(body.reviewToken || '').trim();

    if (!bookingRef || !reviewToken) {
      return res.status(400).json({ error: 'Missing booking reference or review token' });
    }

    const supabase = getSupabase();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_ref', bookingRef)
      .eq('review_token', reviewToken)
      .maybeSingle();

    if (error || !booking) {
      return res.status(403).json({ error: 'Only verified guests can submit reviews.' });
    }

    if (booking.review_submitted) {
      return res.status(409).json({ error: 'A review has already been submitted for this booking.' });
    }

    if (String(booking.status || '').toLowerCase() === 'cancelled') {
      return res.status(403).json({ error: 'Cancelled bookings cannot submit reviews.' });
    }

    const checkout = parseBookingDate(booking.checkout);
    if (!checkout) {
      return res.status(400).json({ error: 'This booking does not have a valid checkout date.' });
    }

    if (todayUtc() <= checkout) {
      return res.status(403).json({ error: 'Reviews are available only after checkout is completed.' });
    }

    return res.status(200).json({
      ok: true,
      bookingRef: booking.booking_ref,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      checkin: booking.checkin,
      checkout: booking.checkout,
      status: booking.status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Verification failed' });
  }
};
