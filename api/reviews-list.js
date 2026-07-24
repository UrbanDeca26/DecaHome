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

function parseReviewContent(rawValue) {
  const fallback = { title: 'Verified guest review', message: '' };
  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        title: String(parsed.title || parsed.reviewTitle || parsed.heading || fallback.title).trim() || fallback.title,
        message: String(parsed.message || parsed.review || parsed.body || parsed.text || '').trim(),
      };
    }
  } catch (_) {}

  return { title: fallback.title, message: raw };
}

function parseDateKey(value) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().slice(0, 10);
}

function mapReviewRow(row, bookingMap = new Map()) {
  const booking = bookingMap.get(row.booking_id) || {};
  const reviewParts = parseReviewContent(row.review);
  const stayDate = String(booking.checkout || booking.checkin || row.created_at || '').trim();

  return {
    id: row.id,
    booking_id: row.booking_id,
    booking_ref: booking.booking_ref || '',
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    rating: row.rating,
    review_title: reviewParts.title,
    review_message: reviewParts.message,
    review: reviewParts.message,
    stay_type: row.stay_type || 'Verified guest',
    featured: row.featured,
    hidden: row.hidden,
    created_at: row.created_at,
    stay_checkout: booking.checkout || '',
    stay_checkin: booking.checkin || '',
    stay_date_key: parseDateKey(stayDate),
    verified_guest: true,
  };
}

async function loadReviews(includeHidden = false) {
  const supabase = getSupabase();
  const reviewQuery = supabase
    .from('reviews')
    .select('id, booking_id, guest_name, guest_email, rating, stay_type, review, featured, hidden, created_at')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = includeHidden ? await reviewQuery : await reviewQuery.eq('hidden', false);
  if (error) {
    throw error;
  }

  const reviewRows = Array.isArray(data) ? data : [];
  const bookingIds = reviewRows.map((row) => row.booking_id).filter(Boolean);
  let bookingMap = new Map();

  if (bookingIds.length) {
    const { data: bookingRows } = await supabase
      .from('bookings')
      .select('id, booking_ref, checkin, checkout, status, review_submitted, review_token')
      .in('id', bookingIds);

    bookingMap = new Map((Array.isArray(bookingRows) ? bookingRows : []).map((row) => [row.id, row]));
  }

  return reviewRows.map((row) => mapReviewRow(row, bookingMap));
}

async function updateReview(req, res) {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const supabase = getSupabase();
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);
  const action = String(body.action || '').trim();
  const id = String(body.id || '').trim();

  if (action === 'list') {
    const reviews = await loadReviews(true);
    return res.status(200).json({ reviews });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing review id' });
  }

  if (action === 'delete') {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Failed to delete review' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'feature') {
    const { data: current, error: currentError } = await supabase.from('reviews').select('id').eq('id', id).maybeSingle();
    if (currentError || !current) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { error: clearError } = await supabase.from('reviews').update({ featured: false }).neq('id', id);
    if (clearError) return res.status(500).json({ error: clearError.message || 'Failed to update featured review' });
    const { error } = await supabase.from('reviews').update({ featured: true, hidden: false }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Failed to update featured review' });
    return res.status(200).json({ ok: true });
  }

  if (action === 'toggle-hidden') {
    const { data: current, error: currentError } = await supabase.from('reviews').select('hidden').eq('id', id).maybeSingle();
    if (currentError || !current) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const { error } = await supabase.from('reviews').update({ hidden: !current.hidden }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message || 'Failed to update review visibility' });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action' });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const reviews = await loadReviews(false);
      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      return updateReview(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load reviews' });
  }
};
