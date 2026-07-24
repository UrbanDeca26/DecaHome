const crypto = require('crypto');
const nodemailer = require('nodemailer');
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
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

function isAdminRequest(req) {
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || 'luxury-stay-secret').trim();
  const cookies = parseCookies(req);
  const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
  return !!expected && cookies.luxury_owner_session === expected;
}

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

function generateReviewToken() {
  return `RV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function getBaseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) return '';
  return `${proto}://${host}`;
}

function formatDateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!isAdminRequest(req)) return res.status(403).json({ error: 'Admin access required' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const bookingRef = String(body.bookingRef || body.bookingReference || '').trim();
    if (!bookingRef) return res.status(400).json({ error: 'Missing booking reference' });

    const supabase = getSupabase();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_ref', bookingRef)
      .maybeSingle();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (String(booking.status || '').toLowerCase() === 'cancelled') {
      return res.status(409).json({ error: 'Cancelled bookings cannot receive review invitations.' });
    }

    const checkout = parseBookingDate(booking.checkout);
    if (!checkout) {
      return res.status(400).json({ error: 'This booking does not have a valid checkout date.' });
    }

    if (todayUtc() <= checkout) {
      return res.status(403).json({ error: 'Review invitations can only be sent after checkout.' });
    }

    const reviewToken = String(booking.review_token || '').trim() || generateReviewToken();
    if (!String(booking.review_token || '').trim()) {
      await supabase.from('bookings').update({ review_token: reviewToken }).eq('id', booking.id);
    }

    const hostEmail = process.env.BOOKING_TO || process.env.ALERT_TO || process.env.SMTP_TO;
    const hostFrom = process.env.BOOKING_FROM || process.env.ALERT_FROM || process.env.SMTP_USER || 'luxury-stay@vercel.app';
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!host || !hostEmail) {
      return res.status(500).json({ error: 'Missing SMTP_HOST or recipient email' });
    }

    const baseUrl = getBaseUrl(req);
    const reviewLink = baseUrl ? `${baseUrl}/?reviewRef=${encodeURIComponent(booking.booking_ref)}&reviewToken=${encodeURIComponent(reviewToken)}#reviews` : '';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const subject = `[Luxury Stay] Your verified review invitation - ${booking.booking_ref}`;
    const text = [
      `Hello ${booking.guest_name || 'Guest'},`,
      '',
      'Thank you for staying with Luxury Stay.',
      `Booking Reference: ${booking.booking_ref}`,
      `Review Token: ${reviewToken}`,
      `Check-in: ${formatDateLabel(booking.checkin)}`,
      `Check-out: ${formatDateLabel(booking.checkout)}`,
      '',
      reviewLink ? `Review link: ${reviewLink}` : 'Review link: unavailable',
      '',
      'We would appreciate a verified review about your stay.',
    ].join('\n');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 12px">Your verified review invitation</h2>
        <p>Hello ${booking.guest_name ? ` ${String(booking.guest_name).trim()}` : 'Guest'},</p>
        <p>Thank you for staying with Luxury Stay.</p>
        <p><strong>Booking Reference:</strong> ${booking.booking_ref}</p>
        <p><strong>Review Token:</strong> ${reviewToken}</p>
        <p><strong>Check-in:</strong> ${formatDateLabel(booking.checkin)}</p>
        <p><strong>Check-out:</strong> ${formatDateLabel(booking.checkout)}</p>
        ${reviewLink ? `<p><a href="${reviewLink}" target="_blank" rel="noopener noreferrer">Open the verified review form</a></p>` : ''}
        <p>We would appreciate your feedback after a completed stay.</p>
      </div>`;

    await transporter.sendMail({
      from: hostFrom,
      to: booking.guest_email,
      subject,
      text,
      html,
      replyTo: hostEmail,
    });

    await supabase.from('bookings').update({ review_invitation_sent: true, review_invitation_sent_at: new Date().toISOString() }).eq('id', booking.id);

    return res.status(200).json({ ok: true, reviewToken, reviewLink });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send review invitation' });
  }
};
