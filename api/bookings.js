const nodemailer = require('nodemailer');
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

function formatCurrency(value) {
  const amount = Number(value);
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function parseBookingDate(value) {
  if (!value) return null;
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayUTCDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfUtcWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Monday-based week
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d;
}

function startOfUtcMonth(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfUtcYear(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function toIsoDate(date) {
  return date ? date.toISOString().slice(0, 10) : null;
}

function normalizeBooking(row) {
  const bookingRef = String(row.booking_ref || row.booking_reference || row.bookingId || row.id || '').trim();
  return {
    id: row.id || bookingRef,
    bookingRef,
    guestName: String(row.guest_name || row.guestName || '').trim(),
    guestEmail: String(row.guest_email || row.guestEmail || '').trim(),
    guestPhone: String(row.guest_phone || row.guestPhone || '').trim(),
    checkin: String(row.checkin || '').trim(),
    checkout: String(row.checkout || '').trim(),
    guests: Number(row.guests || 0),
    pets: Number(row.pets || 0),
    note: String(row.note || row.special_request || '').trim(),
    pricing: row.pricing || null,
    total: Number(row.total ?? row.total_amount ?? 0) || 0,
    status: String(row.status || 'confirmed').toLowerCase(),
    reviewToken: String(row.review_token || '').trim(),
    reviewSubmitted: !!row.review_submitted,
    reviewInvitationSent: !!row.review_invitation_sent,
    createdAt: row.created_at || row.createdAt || null,
    confirmedAt: row.confirmed_at || row.confirmedAt || null,
    cancelledAt: row.cancelled_at || row.cancelledAt || null,
    checkedInAt: row.checked_in_at || row.checkedInAt || null,
    checkedOutAt: row.checked_out_at || row.checkedOutAt || null,
    notes: String(row.admin_notes || '').trim(),
  };
}

function isRevenueStatus(status) {
  return ['confirmed', 'completed', 'checked_out'].includes(String(status || '').toLowerCase());
}

function summarizeBookings(bookings) {
  const now = new Date();
  const today = getTodayUTCDate();
  const weekStart = startOfUtcWeek(now);
  const nextWeek = addUtcDays(weekStart, 7);
  const monthStart = startOfUtcMonth(now);
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const yearStart = startOfUtcYear(now);
  const nextYear = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));

  const arrivalsWindowEnd = addUtcDays(today, 7);

  const summary = {
    totalBookings: bookings.length,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingBookings: 0,
    upcomingArrivals: 0,
    upcomingDepartures: 0,
    pendingReviews: 0,
    todaysArrivals: 0,
    todaysDepartures: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    lifetimeRevenue: 0,
  };

  for (const booking of bookings) {
    const status = String(booking.status || 'confirmed').toLowerCase();
    const total = Number(booking.total || 0) || 0;
    const checkin = parseBookingDate(booking.checkin);
    const checkout = parseBookingDate(booking.checkout);
    const confirmedAt = parseBookingDate((booking.confirmedAt || booking.createdAt || '').slice(0, 10)) || parseBookingDate(booking.createdAt?.slice?.(0, 10));

    if (status === 'pending') summary.pendingBookings += 1;
    if (status === 'confirmed') summary.confirmedBookings += 1;
    if (status === 'completed' || status === 'checked_out') summary.completedBookings += 1;
    if (status === 'cancelled') summary.cancelledBookings += 1;
    if ((status === 'confirmed' || status === 'completed' || status === 'checked_out') && !booking.reviewSubmitted) summary.pendingReviews += 1;

    if (checkin && checkout && checkin.getTime() === today.getTime()) summary.todaysArrivals += 1;
    if (checkout && checkout.getTime() === today.getTime() && status !== 'cancelled') summary.todaysDepartures += 1;
    if (checkin && checkin >= today && checkin < arrivalsWindowEnd && status !== 'cancelled') summary.upcomingArrivals += 1;
    if (checkout && checkout >= today && checkout < arrivalsWindowEnd && status !== 'cancelled') summary.upcomingDepartures += 1;

    if (!isRevenueStatus(status)) continue;
    summary.lifetimeRevenue += total;
    if (confirmedAt && confirmedAt >= weekStart && confirmedAt < nextWeek) summary.weeklyRevenue += total;
    if (confirmedAt && confirmedAt >= monthStart && confirmedAt < nextMonth) summary.monthlyRevenue += total;
    if (confirmedAt && confirmedAt >= yearStart && confirmedAt < nextYear) summary.yearlyRevenue += total;
  }

  return {
    ...summary,
    weeklyRevenueLabel: formatCurrency(summary.weeklyRevenue),
    monthlyRevenueLabel: formatCurrency(summary.monthlyRevenue),
    yearlyRevenueLabel: formatCurrency(summary.yearlyRevenue),
    lifetimeRevenueLabel: formatCurrency(summary.lifetimeRevenue),
  };
}

async function sendReviewInvitationEmail(booking) {
  const hostEmail = process.env.BOOKING_TO || process.env.ALERT_TO || process.env.SMTP_TO;
  const hostFrom = process.env.BOOKING_FROM || process.env.ALERT_FROM || process.env.SMTP_USER || 'luxury-stay@vercel.app';
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!host || !hostEmail) {
    throw new Error('Missing SMTP_HOST or BOOKING_TO');
  }

  if (!booking.guestEmail || !booking.reviewToken) {
    throw new Error('Guest email or review token is missing');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });

  const subject = `[Luxury Stay] Review invitation - ${booking.bookingRef}`;
  const reviewUrl = `${process.env.PUBLIC_SITE_URL || ''}#reviews`.trim() || '#reviews';
  const text = [
    'Thank you for staying with Luxury Stay.',
    '',
    `Booking Reference: ${booking.bookingRef}`,
    `Review Token: ${booking.reviewToken}`,
    `Review link: ${reviewUrl}`,
    '',
    'Please leave a verified review when you have a moment.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">Thank you for staying with Luxury Stay</h2>
      <p><strong>Booking Reference:</strong> ${booking.bookingRef}</p>
      <p><strong>Review Token:</strong> ${booking.reviewToken}</p>
      <p><strong>Review link:</strong> <a href="${reviewUrl}">${reviewUrl}</a></p>
      <p>Please leave a verified review when you have a moment.</p>
    </div>`;

  await transporter.sendMail({
    from: hostFrom,
    to: booking.guestEmail,
    subject,
    text,
    html,
    replyTo: hostEmail,
  });
}

module.exports = async function handler(req, res) {
  try {
    if (!isAdminRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        return res.status(500).json({ error: error.message || 'Failed to load bookings' });
      }

      const bookings = Array.isArray(data) ? data.map(normalizeBooking) : [];
      const summary = summarizeBookings(bookings);

      return res.status(200).json({ bookings, summary });
    }

    if (req.method === 'POST' || req.method === 'PATCH') {
      let body = req.body;
      if (!body || typeof body !== 'object') body = await readBody(req);

      const action = String(body.action || 'update_status').trim();
      const bookingRef = String(body.bookingRef || body.booking_ref || body.id || '').trim();
      const status = String(body.status || '').trim().toLowerCase();

      if (!bookingRef) {
        return res.status(400).json({ error: 'Missing booking reference' });
      }

      const { data: existingRows, error: selectError } = await supabase
        .from('bookings')
        .select('*')
        .or(`booking_ref.eq.${bookingRef},booking_reference.eq.${bookingRef},id.eq.${bookingRef}`)
        .limit(1);

      if (selectError) {
        return res.status(500).json({ error: selectError.message || 'Failed to load booking' });
      }

      const existing = normalizeBooking(Array.isArray(existingRows) && existingRows[0] ? existingRows[0] : {});
      if (!existing.bookingRef) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const nextPatch = { updated_at: new Date().toISOString() };
      let emailMessage = null;

      if (action === 'send_review_invitation') {
        nextPatch.review_invitation_sent = true;
        nextPatch.review_invitation_sent_at = new Date().toISOString();
        emailMessage = 'Review invitation sent';
      } else if (action === 'update_status') {
        if (!status) return res.status(400).json({ error: 'Missing status' });
        nextPatch.status = status;
        if (status === 'confirmed' || status === 'completed') nextPatch.confirmed_at = existing.confirmedAt || new Date().toISOString();
        if (status === 'cancelled') nextPatch.cancelled_at = new Date().toISOString();
        if (status === 'checked_in') nextPatch.checked_in_at = new Date().toISOString();
        if (status === 'checked_out' || status === 'completed') nextPatch.checked_out_at = new Date().toISOString();
      } else {
        return res.status(400).json({ error: 'Unsupported action' });
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(nextPatch)
        .or(`booking_ref.eq.${bookingRef},booking_reference.eq.${bookingRef},id.eq.${bookingRef}`);

      if (updateError) {
        return res.status(500).json({ error: updateError.message || 'Failed to update booking' });
      }

      if (action === 'send_review_invitation') {
        try {
          await sendReviewInvitationEmail(existing);
        } catch (err) {
          return res.status(500).json({ error: err.message || 'Failed to send review invitation' });
        }
      }

      return res.status(200).json({ ok: true, bookingRef, status: nextPatch.status || existing.status, message: emailMessage });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Booking ledger failed' });
  }
};
