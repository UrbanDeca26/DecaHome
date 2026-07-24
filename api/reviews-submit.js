const crypto = require('crypto');
const { getSupabase } = require('../lib/supabase');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
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

function currentDateUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function normalizeReviewPayload(reviewTitle, reviewMessage) {
  return JSON.stringify({
    title: String(reviewTitle || '').trim(),
    message: String(reviewMessage || '').trim(),
  });
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') {
      body = await readBody(req);
    }

    const bookingRef = String(body.bookingReference || body.bookingRef || '').trim();
    const reviewToken = String(body.reviewToken || '').trim();
    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim().toLowerCase();
    const rating = Number(body.rating || 0);
    const reviewTitle = String(body.reviewTitle || body.title || '').trim();
    const reviewMessage = String(body.reviewMessage || body.review || '').trim();

    if (!bookingRef || !reviewToken || !guestName || !guestEmail || !reviewTitle || !reviewMessage || !rating) {
      return res.status(400).json({ error: 'Missing review details' });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
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

    if (String(booking.guest_email || '').trim().toLowerCase() !== guestEmail) {
      return res.status(403).json({ error: 'Guest email does not match the booking record.' });
    }

    if (booking.review_submitted) {
      return res.status(409).json({ error: 'A review has already been submitted for this booking.' });
    }

    const checkout = parseBookingDate(booking.checkout);
    if (!checkout) {
      return res.status(400).json({ error: 'This booking does not have a valid checkout date.' });
    }

    if (currentDateUtc() <= checkout) {
      return res.status(403).json({ error: 'Reviews are available only after checkout is completed.' });
    }

    const reviewId = crypto.randomUUID();
    const reviewBody = normalizeReviewPayload(reviewTitle, reviewMessage);

    const { error: reviewError } = await supabase
      .from('reviews')
      .insert([
        {
          id: reviewId,
          booking_id: booking.id,
          guest_name: guestName,
          guest_email: guestEmail,
          rating,
          stay_type: 'Verified guest',
          review: reviewBody,
          featured: false,
          hidden: false,
        }
      ]);

    if (reviewError) {
      return res.status(500).json({ error: reviewError.message });
    }

    await supabase
      .from('bookings')
      .update({
        review_submitted: true,
        review_submitted_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    return res.status(200).json({
      ok: true,
      review: {
        id: reviewId,
        bookingRef,
        reviewTitle,
        reviewMessage,
        rating,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
};
