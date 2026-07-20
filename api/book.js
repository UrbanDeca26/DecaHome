const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getSupabase } = require('../lib/supabase');

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim().toLowerCase();
    const guestPhone = String(body.guestPhone || '').trim();
    const checkin = String(body.checkin || '').trim();
    const checkout = String(body.checkout || '').trim();
    const guests = String(body.guests || '').trim();
    const note = String(body.note || '').trim();

    if (!guestName || !guestEmail || !checkin || !checkout || !guests) {
      return res.status(400).json({ error: 'Missing booking details' });
    }

    const hostEmail = process.env.BOOKING_TO || process.env.ALERT_TO || process.env.SMTP_TO;
    const hostFrom = process.env.BOOKING_FROM || process.env.ALERT_FROM || process.env.SMTP_USER || 'luxury-stay@vercel.app';
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';
    const publicSiteUrl = String(process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');

    if (!host || !hostEmail) {
      return res.status(500).json({ error: 'Missing SMTP_HOST or BOOKING_TO' });
    }

    const supabase = getSupabase();
    const bookingId = crypto.randomUUID();
    const reviewToken = crypto.randomBytes(24).toString('hex');

    const { error: insertError } = await supabase.from('bookings').insert([{
      id: bookingId,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone || null,
      checkin,
      checkout,
      guests,
      note: note || null,
      review_token: reviewToken,
      review_submitted: false,
    }]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message || 'Failed to store booking' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const reviewLink = publicSiteUrl
      ? `${publicSiteUrl}/?review_token=${encodeURIComponent(reviewToken)}&email=${encodeURIComponent(guestEmail)}`
      : '';

    const subject = `[Luxury Stay] Booking inquiry from ${guestName}`;
    const text = [
      'New booking inquiry',
      `Name: ${guestName}`,
      `Email: ${guestEmail}`,
      `Phone: ${guestPhone || '—'}`,
      `Check-in: ${checkin}`,
      `Check-out: ${checkout}`,
      `Guests: ${guests}`,
      `Note: ${note || '—'}`,
      '',
      `Review token: ${reviewToken}`,
      reviewLink ? `Review link: ${reviewLink}` : '',
    ].filter(Boolean).join('\n');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 12px">New booking inquiry</h2>
        <p><strong>Name:</strong> ${esc(guestName)}</p>
        <p><strong>Email:</strong> ${esc(guestEmail)}</p>
        <p><strong>Phone:</strong> ${esc(guestPhone || '—')}</p>
        <p><strong>Check-in:</strong> ${esc(checkin)}</p>
        <p><strong>Check-out:</strong> ${esc(checkout)}</p>
        <p><strong>Guests:</strong> ${esc(guests)}</p>
        <p><strong>Note:</strong><br>${esc(note || '—').replace(/\n/g, '<br>')}</p>
        <hr style="margin:16px 0;border:0;border-top:1px solid #e5e7eb" />
        <p><strong>Review token:</strong> ${esc(reviewToken)}</p>
        ${reviewLink ? `<p><strong>Review link:</strong> <a href="${esc(reviewLink)}">${esc(reviewLink)}</a></p>` : ''}
      </div>`;

    await transporter.sendMail({
      from: hostFrom,
      to: hostEmail,
      subject,
      text,
      html,
      replyTo: guestEmail,
    });

    if (reviewLink) {
      await transporter.sendMail({
        from: hostFrom,
        to: guestEmail,
        subject: '[Luxury Stay] Your review code',
        text: [
          `Thanks for your inquiry, ${guestName}.`,
          '',
          'Use this code to leave a verified review after your stay:',
          reviewToken,
          '',
          `Review link: ${reviewLink}`,
        ].join('\n'),
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
            <h2 style="margin:0 0 12px">Thanks for your inquiry</h2>
            <p>Use this code to leave a verified review after your stay:</p>
            <p style="font-size:1.2rem;font-weight:700;letter-spacing:.08em">${esc(reviewToken)}</p>
            <p>${esc(reviewLink)}</p>
          </div>`,
      });
    }

    return res.status(200).json({ ok: true, reviewToken });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send booking inquiry' });
  }
};
