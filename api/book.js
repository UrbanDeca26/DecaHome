const nodemailer = require('nodemailer');

let getSupabase = null;
try {
  ({ getSupabase } = require('../lib/supabase'));
} catch (_) {
  getSupabase = null;
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

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  const amount = Number(value);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateLabel(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function generateBookingRef() {
  const stamp = new Date();
  const y = stamp.getUTCFullYear();
  const m = String(stamp.getUTCMonth() + 1).padStart(2, '0');
  const d = String(stamp.getUTCDate()).padStart(2, '0');
  const time = `${String(stamp.getUTCHours()).padStart(2, '0')}${String(stamp.getUTCMinutes()).padStart(2, '0')}${String(stamp.getUTCSeconds()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `LS-${y}${m}${d}-${time}${rand}`;
}

function generateReviewToken() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RV-${stamp}-${rand}`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);

    const guestName = String(body.guestName || '').trim();
    const guestEmail = String(body.guestEmail || '').trim();
    const guestPhone = String(body.guestPhone || '').trim();
    const checkin = String(body.checkin || '').trim();
    const checkout = String(body.checkout || '').trim();
    const guests = String(body.guests || '').trim();
    const pets = String(body.pets || '0').trim();
    const note = String(body.note || '').trim();
    const pricing = body.pricing && typeof body.pricing === 'object' ? body.pricing : null;
    const bookingRef = generateBookingRef();
    const reviewToken = generateReviewToken();

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

    if (!host || !hostEmail) {
      return res.status(500).json({ error: 'Missing SMTP_HOST or BOOKING_TO' });
    }

    let persistedBooking = false;
    if (typeof getSupabase === 'function') {
      try {
        const supabase = getSupabase();
        const createdAt = new Date().toISOString();
        const confirmedAt = createdAt;
        const totalAmount = pricing ? Number(pricing.total ?? pricing.summary?.total ?? 0) : null;
        const attempts = [
          {
            booking_reference: bookingRef,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone || null,
            checkin,
            checkout,
            guests: Number(guests),
            pets: Number(pets || 0),
            note: note || null,
            pricing,
            total: totalAmount,
            status: 'confirmed',
            confirmed_at: confirmedAt,
            review_token: reviewToken,
            review_submitted: false,
            review_invitation_sent: false,
            created_at: createdAt,
          },
          {
            booking_reference: bookingRef,
            guest_name: guestName,
            guest_email: guestEmail,
            checkin,
            checkout,
            guests: Number(guests),
            status: 'confirmed',
            confirmed_at: confirmedAt,
            review_token: reviewToken,
            review_submitted: false,
            review_invitation_sent: false,
            created_at: createdAt,
          },
        ];

        for (const bookingRow of attempts) {
          const { error: bookingError } = await supabase.from('bookings').insert([bookingRow]);
          if (!bookingError) {
            persistedBooking = true;
            break;
          }
        }
      } catch (_) {
        persistedBooking = false;
      }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    });

    const baseRate = pricing?.baseRate ?? pricing?.summary?.baseRate ?? 0;
    const extraGuestCharge = pricing?.extraGuestCharge ?? pricing?.summary?.extraGuestCharge ?? 0;
    const petCharge = pricing?.petCharge ?? pricing?.summary?.petCharge ?? 0;
    const total = pricing?.total ?? pricing?.summary?.total ?? 0;

    const guestSubject = `[Luxury Stay] Booking Confirmation - ${bookingRef}`;
    const ownerSubject = `[Luxury Stay] New Booking - ${bookingRef}`;

    const guestText = [
      'Luxury Stay booking confirmation',
      `Booking Reference: ${bookingRef}`,
      `Property: Luxury Stay`,
      `Location: Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3`,
      `Check-in: ${formatDateLabel(checkin)}`,
      `Check-out: ${formatDateLabel(checkout)}`,
      `Guests: ${guests}`,
      `Pets: ${pets || 0}`,
      `Phone: ${guestPhone || '—'}`,
      `Review token: ${reviewToken}`,
      `Special request: ${note || '—'}`,
      '',
      'Price breakdown',
      `Base rate: ${formatCurrency(baseRate)}`,
      `Extra guests: ${formatCurrency(extraGuestCharge)}`,
      `Pets: ${formatCurrency(petCharge)}`,
      `Total: ${formatCurrency(total)}`,
      '',
      'Thank you for booking with Luxury Stay.',
    ].join('\n');

    const ownerText = [
      'New booking received',
      `Booking Reference: ${bookingRef}`,
      `Guest: ${guestName}`,
      `Email: ${guestEmail}`,
      `Phone: ${guestPhone || '—'}`,
      `Check-in: ${formatDateLabel(checkin)}`,
      `Check-out: ${formatDateLabel(checkout)}`,
      `Guests: ${guests}`,
      `Pets: ${pets || 0}`,
      `Review token: ${reviewToken}`,
      `Special request: ${note || '—'}`,
      '',
      'Price breakdown',
      `Base rate: ${formatCurrency(baseRate)}`,
      `Extra guests: ${formatCurrency(extraGuestCharge)}`,
      `Pets: ${formatCurrency(petCharge)}`,
      `Total: ${formatCurrency(total)}`,
      '',
      `Persisted in Supabase: ${persistedBooking ? 'yes' : 'no'}`,
    ].join('\n');

    const guestHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 12px">Luxury Stay booking confirmation</h2>
        <p><strong>Booking Reference:</strong> ${esc(bookingRef)}</p>
        <p><strong>Property:</strong> Luxury Stay</p>
        <p><strong>Location:</strong> Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3</p>
        <p><strong>Check-in:</strong> ${esc(formatDateLabel(checkin))}</p>
        <p><strong>Check-out:</strong> ${esc(formatDateLabel(checkout))}</p>
        <p><strong>Guests:</strong> ${esc(guests)}</p>
        <p><strong>Pets:</strong> ${esc(pets || 0)}</p>
        <p><strong>Phone:</strong> ${esc(guestPhone || '—')}</p>
        <p><strong>Review token:</strong> ${esc(reviewToken)}</p>
        <p><strong>Special request:</strong><br>${esc(note || '—').replace(/\n/g, '<br>')}</p>
        <h3 style="margin:18px 0 10px">Price breakdown</h3>
        <p><strong>Base rate:</strong> ${esc(formatCurrency(baseRate))}</p>
        <p><strong>Extra guests:</strong> ${esc(formatCurrency(extraGuestCharge))}</p>
        <p><strong>Pets:</strong> ${esc(formatCurrency(petCharge))}</p>
        <p><strong>Total:</strong> ${esc(formatCurrency(total))}</p>
        <p style="margin-top:18px">Thank you for booking with Luxury Stay.</p>
      </div>`;

    const ownerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="margin:0 0 12px">New booking received</h2>
        <p><strong>Booking Reference:</strong> ${esc(bookingRef)}</p>
        <p><strong>Guest:</strong> ${esc(guestName)}</p>
        <p><strong>Email:</strong> ${esc(guestEmail)}</p>
        <p><strong>Phone:</strong> ${esc(guestPhone || '—')}</p>
        <p><strong>Check-in:</strong> ${esc(formatDateLabel(checkin))}</p>
        <p><strong>Check-out:</strong> ${esc(formatDateLabel(checkout))}</p>
        <p><strong>Guests:</strong> ${esc(guests)}</p>
        <p><strong>Pets:</strong> ${esc(pets || 0)}</p>
        <p><strong>Review token:</strong> ${esc(reviewToken)}</p>
        <p><strong>Special request:</strong><br>${esc(note || '—').replace(/\n/g, '<br>')}</p>
        <h3 style="margin:18px 0 10px">Price breakdown</h3>
        <p><strong>Base rate:</strong> ${esc(formatCurrency(baseRate))}</p>
        <p><strong>Extra guests:</strong> ${esc(formatCurrency(extraGuestCharge))}</p>
        <p><strong>Pets:</strong> ${esc(formatCurrency(petCharge))}</p>
        <p><strong>Total:</strong> ${esc(formatCurrency(total))}</p>
      </div>`;

    await Promise.all([
      transporter.sendMail({
        from: hostFrom,
        to: guestEmail,
        subject: guestSubject,
        text: guestText,
        html: guestHtml,
        replyTo: hostEmail,
      }),
      transporter.sendMail({
        from: hostFrom,
        to: hostEmail,
        subject: ownerSubject,
        text: ownerText,
        html: ownerHtml,
        replyTo: guestEmail,
      }),
    ]);

    return res.status(200).json({ ok: true, bookingRef, reviewToken, persistedBooking });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to send booking inquiry' });
  }
};
