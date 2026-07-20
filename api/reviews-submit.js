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

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed'
      });
    }

    let body = req.body;

    if (!body || typeof body !== 'object') {
      body = await readBody(req);
    }

    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim().toLowerCase();
    const reviewToken = String(body.reviewToken || '').trim();
    const rating = Number(body.rating || 0);
    const stayType = String(body.stayType || '').trim();
    const review = String(body.review || '').trim();

    if (
      !guestName ||
      !guestEmail ||
      !reviewToken ||
      !review ||
      !rating
    ) {
      return res.status(400).json({
        error: 'Missing review details'
      });
    }

    const supabase = getSupabase();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_email', guestEmail)
      .eq('review_token', reviewToken)
      .single();

    if (error || !booking) {
      return res.status(403).json({
        error: 'Only verified guests can submit reviews.'
      });
    }

    if (booking.review_submitted) {
      return res.status(409).json({
        error: 'A review has already been submitted for this booking.'
      });
    }

    const reviewId = crypto.randomUUID();

    const { error: reviewError } =
      await supabase
        .from('reviews')
        .insert([
          {
            id: reviewId,
            booking_id: booking.id,
            guest_name: guestName,
            guest_email: guestEmail,
            rating,
            stay_type: stayType,
            review,
            featured: false,
            hidden: false
          }
        ]);

    if (reviewError) {
      return res.status(500).json({
        error: reviewError.message
      });
    }

    await supabase
      .from('bookings')
      .update({
        review_submitted: true
      })
      .eq('id', booking.id);

    return res.status(200).json({
      ok: true
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};
