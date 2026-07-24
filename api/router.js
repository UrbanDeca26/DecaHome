const crypto = require('crypto');
const nodemailer = require('nodemailer');
let getSupabase = null;
try {
  ({ getSupabase } = require('../lib/supabase'));
} catch (_) {
  getSupabase = null;
}

const BUCKET = 'luxury-stay-media';
const ADMIN_COOKIE = 'luxury_owner_session';
const ADMIN_SECRET_DEFAULT = 'luxury-stay-secret';

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

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
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
  const adminSecret = String(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ADMIN_SECRET_DEFAULT).trim();
  const cookies = parseCookies(req);
  const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
  return !!expected && cookies[ADMIN_COOKIE] === expected;
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
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  return `RV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function getBaseUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!host) return '';
  return `${proto}://${host}`;
}

function extFromType(type, fallback = 'bin') {
  const t = String(type || '').toLowerCase();
  if (t.includes('png')) return 'png';
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  if (t.includes('gif')) return 'gif';
  if (t.includes('webp')) return 'webp';
  if (t.includes('mp4')) return 'mp4';
  if (t.includes('mov') || t.includes('quicktime')) return 'mov';
  if (t.includes('webm')) return 'webm';
  return fallback;
}

function sanitizeName(name, fallback = 'media') {
  return String(name || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || fallback;
}

function parseTextList(value, fallback = []) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return Array.isArray(fallback) ? fallback.slice() : [];
}

const DEFAULT_PROPERTY = {
  name: 'Luxury Stay',
  area: 'Urban Deca Homes Ortigas Extension, Pasig City',
  building: 'BLDG Q - Area 4/3',
  capacity: 'Up to 9 guests',
  checkIn: '1:00 PM onwards',
  checkOut: '11:00 AM next day',
  securityDeposit: 'PHP 1,000 refundable deposit / reservation fee',
  weekdayRate: 1999,
  weekendRate: 2199,
  includedGuests: 2,
  extraGuestFee: 400,
  petFee: 200,
  maxGuests: 9,
  maxPets: 3,
  parking: 'No parking included; please advise early if parking is needed.',
  parkingRates: { car: 'PHP 400.00 per 24 hrs', motorcycle: 'PHP 250.00 per 24 hrs' },
  pricing: [
    'Weekdays (4 pax): PHP 2,289 - 22 hrs',
    'Weekends (4 pax): PHP 2,489 - 22 hrs (Fri-Sun)',
    'Daycation (2 pax): PHP 1,450 - 10 hrs',
    'Daycation (2 pax): PHP 1,699 - 12 hrs',
    'Daycation (2 pax): PHP 2,289 - 22 hrs',
    'Additional 2 hrs: PHP 350.00',
    'Additional 3 hrs: PHP 480.00',
    'Additional 5 hrs: PHP 760.00',
  ],
  nearby: ['SM East Ortigas', 'Bridgetowne', 'SM Megamall', 'Robinsons Galleria', 'Medical City', 'Tiendesitas', 'Libis, Eastwood', 'Junction, Cainta', 'Arcovia, Pasig'],
  houseRules: [
    'Clean as you go',
    'No smoking or vaping inside the unit',
    'No pool access',
    'No parking unless arranged in advance',
    'No unannounced visitors',
    'Quiet hours: Sunday to Thursday 10:00 PM - 8:00 AM; Friday to Saturday 12:00 AM - 9:00 AM',
  ],
  bookingRequirements: [
    'Valid government-issued ID for all guests',
    'One email address and contact number',
    'PHP 1,000 security deposit / reservation fee',
    'Parking request, if needed, must be advised early',
  ],
  selfCheckIn: [
    'Pick up the tap card from Locker 706 in the Building Q mailbox area using passcode 796.',
    'Take Elevator Area 4 and tap the card to reach the 7th floor.',
    'Open unit 706 using the lockbox code 7226 and lock it again after use.',
    'Turn on the breaker by switching up all the red levers.',
  ],
  checkout: [
    'Switch all breaker levers down.',
    'Return the tap card to Locker 706.',
    'Return the main door key to the lockbox using code 7226.',
    'Collect your belongings and switch off appliances.',
    'Dispose of trash in the designated area at the back.',
  ],
  logoUrl: '',
  heroImage: '',
  heroImage2: '',
  themeStartDay: '06:00',
  themeStartNight: '18:00',
  socials: { facebook: '', instagram: '', tiktok: '', website: '' },
  lunaDescription: 'Luxury Stay is a polished condo hideaway for families and friends, with fast self check-in and a practical location near Ortigas.',
  lunaFaqs: [
    { q: 'What time is check-in?', a: 'Check-in starts at 1:00 PM.' },
    { q: 'Do you allow parking?', a: 'Parking is by request and subject to availability.' },
  ],
  lunaHouseRules: ['Quiet hours are enforced.', 'No smoking or vaping inside the unit.'],
  lunaParking: 'Parking is not included by default; please advise early if you need a slot.',
  lunaContact: 'Use the inquiry form for special requests or questions that need host confirmation.',
  lunaRecommendations: ['SM East Ortigas', 'Bridgetowne', 'Eastwood', 'Tiendesitas'],
};

function normalizeProperty(source) {
  const src = source && typeof source === 'object' ? source : {};
  const out = { ...DEFAULT_PROPERTY, ...src };
  out.capacity = String(src.capacity || out.capacity || 'Up to 9 guests');
  out.area = String(src.area || out.area || '').trim();
  out.building = String(src.building || out.building || '').trim();
  out.checkIn = String(src.checkIn || out.checkIn || '').trim();
  out.checkOut = String(src.checkOut || out.checkOut || '').trim();
  out.securityDeposit = String(src.securityDeposit || out.securityDeposit || '').trim();
  out.weekdayRate = Number(src.weekdayRate ?? out.weekdayRate ?? 0) || 0;
  out.weekendRate = Number(src.weekendRate ?? out.weekendRate ?? 0) || 0;
  out.includedGuests = Number(src.includedGuests ?? out.includedGuests ?? 1) || 1;
  out.extraGuestFee = Number(src.extraGuestFee ?? out.extraGuestFee ?? 0) || 0;
  out.petFee = Number(src.petFee ?? out.petFee ?? 0) || 0;
  out.maxGuests = Number(src.maxGuests ?? out.maxGuests ?? out.includedGuests ?? 1) || 1;
  out.maxPets = Number(src.maxPets ?? out.maxPets ?? 0) || 0;
  out.parking = String(src.parking || out.parking || '').trim();
  out.parkingRates = {
    car: String((src.parkingRates && src.parkingRates.car) || out.parkingRates.car || '').trim(),
    motorcycle: String((src.parkingRates && src.parkingRates.motorcycle) || out.parkingRates.motorcycle || '').trim(),
  };
  out.pricing = parseTextList(src.pricing, out.pricing);
  out.nearby = parseTextList(src.nearby, out.nearby);
  out.houseRules = parseTextList(src.houseRules, out.houseRules);
  out.bookingRequirements = parseTextList(src.bookingRequirements, out.bookingRequirements);
  out.selfCheckIn = parseTextList(src.selfCheckIn, out.selfCheckIn);
  out.checkout = parseTextList(src.checkout, out.checkout);
  out.logoUrl = String(src.logoUrl || out.logoUrl || '').trim();
  out.heroImage = String(src.heroImage || out.heroImage || '').trim();
  out.heroImage2 = String(src.heroImage2 || out.heroImage2 || '').trim();
  out.themeStartDay = String(src.themeStartDay || out.themeStartDay || '06:00').trim() || '06:00';
  out.themeStartNight = String(src.themeStartNight || out.themeStartNight || '18:00').trim() || '18:00';
  out.socials = {
    facebook: String(src.socials?.facebook || src.facebook || out.socials?.facebook || '').trim(),
    instagram: String(src.socials?.instagram || src.instagram || out.socials?.instagram || '').trim(),
    tiktok: String(src.socials?.tiktok || src.tiktok || out.socials?.tiktok || '').trim(),
    website: String(src.socials?.website || src.website || out.socials?.website || '').trim(),
  };
  out.lunaDescription = String(src.lunaDescription || out.lunaDescription || '').trim();
  out.lunaFaqs = Array.isArray(src.lunaFaqs)
    ? src.lunaFaqs.map((item) => ({ q: String(item?.q || item?.question || '').trim(), a: String(item?.a || item?.answer || '').trim() })).filter((item) => item.q || item.a)
    : Array.isArray(out.lunaFaqs) ? out.lunaFaqs.slice() : [];
  out.lunaHouseRules = parseTextList(src.lunaHouseRules, out.lunaHouseRules);
  out.lunaParking = String(src.lunaParking || out.lunaParking || '').trim();
  out.lunaContact = String(src.lunaContact || out.lunaContact || '').trim();
  out.lunaRecommendations = parseTextList(src.lunaRecommendations, out.lunaRecommendations);
  return out;
}

function normalizeText(value, fallback = '') {
  return String(value || fallback || '').trim();
}

function parseReviewContent(rawValue) {
  const fallback = { title: 'Verified guest review', message: '' };
  const raw = String(rawValue || '').trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        title: normalizeText(parsed.title || parsed.reviewTitle || parsed.heading || fallback.title, fallback.title),
        message: normalizeText(parsed.message || parsed.review || parsed.body || parsed.text || ''),
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

function bookingRecord(row) {
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
    review_submitted_at: row.review_submitted_at,
    created_at: row.created_at,
  };
}

function reviewRecord(row, bookingMap = new Map()) {
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

function inquiryRecord(item) {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    message: item.message,
    page: item.page || 'chat',
    topic: item.topic || 'General inquiry',
    status: item.status || 'pending',
    created_at: item.created_at || new Date().toISOString(),
  };
}

function createMailer() {
  const hostEmail = process.env.BOOKING_TO || process.env.ALERT_TO || process.env.SMTP_TO;
  const hostFrom = process.env.BOOKING_FROM || process.env.ALERT_FROM || process.env.SMTP_USER || 'luxury-stay@vercel.app';
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!host || !hostEmail) return null;

  return {
    hostEmail,
    hostFrom,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
    }),
  };
}

async function ensureBucket(supabase) {
  try {
    await supabase.storage.createBucket(BUCKET, { public: true });
  } catch (_) {}
}

async function handleAdminLogin(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);
  const password = normalizeText(body.password);
  const adminPassword = normalizeText(process.env.ADMIN_PASSWORD);
  const adminSecret = normalizeText(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ADMIN_SECRET_DEFAULT);
  if (!adminPassword) return sendJson(res, 500, { error: 'ADMIN_PASSWORD is not configured' });
  if (!password || password !== adminPassword) return sendJson(res, 401, { error: 'Invalid password' });
  const token = makeToken(adminPassword, adminSecret);
  const cookie = [
    `${ADMIN_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=604800',
    req.headers?.host?.includes('localhost') ? '' : 'Secure',
  ].filter(Boolean).join('; ');
  res.setHeader('Set-Cookie', cookie);
  return sendJson(res, 200, { ok: true });
}

async function handleAdminLogout(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return sendJson(res, 200, { ok: true });
}

async function handleAdminStatus(req, res) {
  const adminPassword = normalizeText(process.env.ADMIN_PASSWORD);
  const adminSecret = normalizeText(process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ADMIN_SECRET_DEFAULT);
  const cookies = parseCookies(req);
  const expected = adminPassword ? makeToken(adminPassword, adminSecret) : '';
  return sendJson(res, 200, { loggedIn: !!expected && cookies[ADMIN_COOKIE] === expected });
}

async function handleBookingCreate(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);

  const guestName = normalizeText(body.guestName);
  const guestEmail = normalizeText(body.guestEmail);
  const guestPhone = normalizeText(body.guestPhone);
  const checkin = normalizeText(body.checkin);
  const checkout = normalizeText(body.checkout);
  const guests = normalizeText(body.guests);
  const pets = normalizeText(body.pets || '0');
  const note = normalizeText(body.note);
  const pricing = body.pricing && typeof body.pricing === 'object' ? body.pricing : null;

  if (!guestName || !guestEmail || !checkin || !checkout || !guests) {
    return sendJson(res, 400, { error: 'Missing booking details' });
  }

  const bookingRef = generateBookingRef();
  const reviewToken = generateReviewToken();
  const baseUrl = getBaseUrl(req);
  const reviewLink = baseUrl ? `${baseUrl}/?reviewRef=${encodeURIComponent(bookingRef)}&reviewToken=${encodeURIComponent(reviewToken)}#reviews` : '';

  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (supabase) {
    try {
      const bookingRow = {
        booking_ref: bookingRef,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        checkin,
        checkout,
        guests: Number(guests),
        pets: Number(pets || 0),
        note: note || null,
        pricing,
        total: pricing ? Number(pricing.total ?? pricing.summary?.total ?? 0) : null,
        status: 'pending',
        review_token: reviewToken,
        review_submitted: false,
        review_invitation_sent: false,
        created_at: new Date().toISOString(),
      };
      await supabase.from('bookings').insert([bookingRow]);
    } catch (_) {}
  }

  const mailer = createMailer();
  if (!mailer) return sendJson(res, 500, { error: 'Missing SMTP_HOST or BOOKING_TO' });

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
    '',
    'Price Breakdown',
    `Base rate: ${formatCurrency(baseRate)}`,
    `Extra guests: ${formatCurrency(extraGuestCharge)}`,
    `Pets: ${formatCurrency(petCharge)}`,
    `Total: ${formatCurrency(total)}`,
    '',
    `Review token: ${reviewToken}`,
    reviewLink ? `Review link: ${reviewLink}` : '',
  ].filter(Boolean).join('\n');

  const guestHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">Luxury Stay booking confirmation</h2>
      <p><strong>Booking Reference:</strong> ${bookingRef}</p>
      <p><strong>Property:</strong> Luxury Stay</p>
      <p><strong>Location:</strong> Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3</p>
      <p><strong>Check-in:</strong> ${formatDateLabel(checkin)}</p>
      <p><strong>Check-out:</strong> ${formatDateLabel(checkout)}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Pets:</strong> ${pets || 0}</p>
      <p><strong>Phone:</strong> ${guestPhone || '—'}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <p><strong>Base rate:</strong> ${formatCurrency(baseRate)}</p>
      <p><strong>Extra guests:</strong> ${formatCurrency(extraGuestCharge)}</p>
      <p><strong>Pets:</strong> ${formatCurrency(petCharge)}</p>
      <p><strong>Total:</strong> ${formatCurrency(total)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <p><strong>Review token:</strong> ${reviewToken}</p>
      ${reviewLink ? `<p><a href="${reviewLink}" target="_blank" rel="noopener noreferrer">Open the verified review form</a></p>` : ''}
    </div>`;

  const ownerText = [
    'New booking inquiry',
    `Booking Reference: ${bookingRef}`,
    `Guest: ${guestName}`,
    `Email: ${guestEmail}`,
    `Phone: ${guestPhone || '—'}`,
    `Check-in: ${formatDateLabel(checkin)}`,
    `Check-out: ${formatDateLabel(checkout)}`,
    `Guests: ${guests}`,
    `Pets: ${pets || 0}`,
    `Total: ${formatCurrency(total)}`,
    `Review token: ${reviewToken}`,
    `Note: ${note || '—'}`,
  ].join('\n');

  const ownerHtml = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">New booking inquiry</h2>
      <p><strong>Booking Reference:</strong> ${bookingRef}</p>
      <p><strong>Guest:</strong> ${guestName}</p>
      <p><strong>Email:</strong> ${guestEmail}</p>
      <p><strong>Phone:</strong> ${guestPhone || '—'}</p>
      <p><strong>Check-in:</strong> ${formatDateLabel(checkin)}</p>
      <p><strong>Check-out:</strong> ${formatDateLabel(checkout)}</p>
      <p><strong>Guests:</strong> ${guests}</p>
      <p><strong>Pets:</strong> ${pets || 0}</p>
      <p><strong>Total:</strong> ${formatCurrency(total)}</p>
      <p><strong>Review token:</strong> ${reviewToken}</p>
      <p><strong>Note:</strong><br>${String(note || '—').replace(/\n/g, '<br>')}</p>
    </div>`;

  await mailer.transporter.sendMail({
    from: mailer.hostFrom,
    to: guestEmail,
    subject: guestSubject,
    text: guestText,
    html: guestHtml,
    replyTo: mailer.hostEmail,
  });

  await mailer.transporter.sendMail({
    from: mailer.hostFrom,
    to: mailer.hostEmail,
    subject: ownerSubject,
    text: ownerText,
    html: ownerHtml,
    replyTo: guestEmail,
  });

  return sendJson(res, 200, {
    ok: true,
    bookingRef,
    reviewToken,
    reviewLink,
    total,
  });
}

async function handleBookings(req, res) {
  if (!isAdminRequest(req)) return sendJson(res, 403, { error: 'Admin access required' });
  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return sendJson(res, 500, { error: error.message || 'Failed to load bookings' });
    return sendJson(res, 200, { bookings: Array.isArray(data) ? data.map(bookingRecord) : [] });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);
    const action = normalizeText(body.action).toLowerCase();
    const id = normalizeText(body.id || body.bookingRef || body.booking_ref);
    if (!id) return sendJson(res, 400, { error: 'Missing booking reference or id' });

    const { data: existing, error: findError } = await supabase.from('bookings').select('*').or(`id.eq.${id},booking_ref.eq.${id}`).maybeSingle();
    if (findError || !existing) return sendJson(res, 404, { error: 'Booking not found' });

    if (action === 'cancel') {
      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', existing.id);
      if (error) return sendJson(res, 500, { error: error.message || 'Failed to cancel booking' });
      return sendJson(res, 200, { ok: true });
    }

    if (action === 'update') {
      const status = normalizeText(body.status || 'pending').toLowerCase();
      const { error } = await supabase.from('bookings').update({ status }).eq('id', existing.id);
      if (error) return sendJson(res, 500, { error: error.message || 'Failed to update booking' });
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 400, { error: 'Unknown action' });
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

function localChatAnswer(property, message) {
  const q = String(message || '').toLowerCase();
  const nearby = Array.isArray(property?.nearby) ? property.nearby.slice(0, 6).join(', ') : 'nearby landmarks';
  const pricing = Array.isArray(property?.pricing) ? property.pricing.slice(0, 3).join(' · ') : 'pricing available';

  if (/\b(location|where|address|map|find|locate|exact location)\b/.test(q)) {
    return {
      reply: `We are at ${property?.building || 'the property address'}. Nearby places include ${nearby}.`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [
        { label: 'Parking', query: 'What are the parking details?' },
        { label: 'Pricing', query: 'What is the pricing?' },
        { label: 'Amenities', query: 'What amenities are included?' },
      ],
    };
  }

  if (/\bparking\b/.test(q)) {
    return {
      reply: `Parking is by request. Rates are Car: ${property?.parkingRates?.car || '—'} and Motorcycle: ${property?.parkingRates?.motorcycle || '—'}. Please advise early if you need parking.`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [
        { label: 'Location', query: 'Where is the exact location?' },
        { label: 'Pricing', query: 'What is the pricing?' },
      ],
    };
  }

  if (/\b(price|rate|cost|pricing)\b/.test(q)) {
    return {
      reply: `Here’s the pricing guide: ${pricing}${Array.isArray(property?.pricing) && property.pricing.length > 3 ? ' · ...' : ''}`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [
        { label: 'Booking', query: 'How do I book?' },
        { label: 'Amenities', query: 'What amenities are included?' },
      ],
    };
  }

  if (/\b(rule|smok|noise|visitor|pool|house)\b/.test(q)) {
    return {
      reply: `House rules include: ${(property?.houseRules || []).join(' · ')}.`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [{ label: 'Self check-in', query: 'How do I check in?' }],
    };
  }

  if (/\bcheck.?in|self check|arrival\b/.test(q)) {
    return {
      reply: `Self check-in starts at ${property?.checkIn || '1:00 PM'}. The steps are: ${(property?.selfCheckIn || []).join(' ')}`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [{ label: 'Checkout', query: 'What is the checkout process?' }],
    };
  }

  if (/\bcheckout|check.?out|leave|departure\b/.test(q)) {
    return {
      reply: `Checkout is at ${property?.checkOut || '11:00 AM next day'}. Reminder: ${(property?.checkout || []).join(' ')}`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [{ label: 'House rules', query: 'What are the house rules?' }],
    };
  }

  if (/\b(amenit|include|what is inside|included)\b/.test(q)) {
    return {
      reply: `The unit includes amenities like fast Wi‑Fi, smart TV, air conditioning, kitchenware, washing machine, karaoke, projector, dining set, and board games.`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [{ label: 'Gallery', query: 'Show me the gallery.' }],
    };
  }

  if (/\b(gallery|photo|video|tour|walkthrough)\b/.test(q)) {
    return {
      reply: `The gallery and video tours show the unit’s living room, kitchen, bedroom, bathroom, and walkthrough clips.`,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: [{ label: 'Amenities', query: 'What amenities are included?' }],
    };
  }

  if (/\b(review|comment|testimonial)\b/.test(q)) {
    return {
      reply: `Guest reviews are positive, with guests highlighting the clean space, polished layout, and easy check-in.`,
      intent: 'property_info',
      showInquiryForm: false,
    };
  }

  if (/\b(booking requirement|deposit|reservation fee|id|verify)\b/.test(q)) {
    return {
      reply: `Booking requirements include a valid ID for all guests, one email address and contact number, and the PHP 1,000 security deposit / reservation fee.`,
      intent: 'property_info',
      showInquiryForm: false,
    };
  }

  if (/\b(book|reserve|availability)\b/.test(q)) {
    return {
      reply: `You can check availability using the booking form above, then send the request to the host.`,
      intent: 'property_info',
      showInquiryForm: false,
    };
  }

  if (/\b(children|kids|birthday|decorate|pets|pet|late checkout|early check-in|midnight)\b/.test(q)) {
    return {
      reply: `I could not find that detail on the site yet. Please send a message to the host using the inquiry form below.`,
      intent: 'escalate',
      showInquiryForm: true,
      suggestions: [
        { label: 'Send inquiry', query: 'I need to ask the host something not shown on the site.' },
        { label: 'Pricing', query: 'What is the pricing?' },
      ],
    };
  }

  if (/\b(contact|host|email|message)\b/.test(q)) {
    return {
      reply: `Use the inquiry form below to send your message to the host.`,
      intent: 'escalate',
      showInquiryForm: true,
      suggestions: [
        { label: 'Location', query: 'Where is the exact location?' },
        { label: 'Amenities', query: 'What amenities are included?' },
      ],
    };
  }

  return {
    reply: `I can answer questions about the stay here. If I do not have the detail on the site, I can send an inquiry to the host.`,
    intent: 'help',
    showInquiryForm: false,
    suggestions: [
      { label: 'Location', query: 'Where is the exact location?' },
      { label: 'Parking', query: 'What are the parking details?' },
      { label: 'Pricing', query: 'What is the pricing?' },
      { label: 'Amenities', query: 'What amenities are included?' },
      { label: 'Contact Host', query: 'I need to ask the host something not shown on the site.' },
    ],
  };
}

async function handleChat(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);
  const message = normalizeText(body.message);
  if (!message) return sendJson(res, 400, { error: 'Missing message' });

  const property = normalizeProperty(body.property);
  const local = localChatAnswer(property, message);

  if (local.intent === 'escalate' || local.intent === 'navigate') {
    return sendJson(res, 200, local);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return sendJson(res, 200, local);
  }

  const systemPrompt = `
You are Luna, the Luxury Stay virtual concierge.
Your first job is to guide the guest to the correct section of the site when the answer is already visible there.
If the site has the exact answer, respond with a short helpful sentence that points to the section.
If the answer is not on the site, tell the guest to use the inquiry form.
Do not invent prices, policies, amenities, or location details.
Keep answers short, warm, and practical.

Property facts:
- Name: ${property.name}
- Area: ${property.area}
- Type: ${property.type || 'Entire private condo'}
- Capacity: ${property.capacity}
- Check-in: ${property.checkIn}
- Check-out: ${property.checkOut}
- Price guide: ${property.pricing.join(' | ')}
- Parking: ${property.parking}
- Nearby: ${property.nearby.join(', ')}
- Booking requirements: ${property.bookingRequirements.join(' | ')}
- House rules: ${property.houseRules.join(' | ')}
- Self check-in: ${property.selfCheckIn.join(' | ')}
- Checkout: ${property.checkout.join(' | ')}
`.trim();

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ],
    temperature: 0.2,
    max_completion_tokens: 180,
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return sendJson(res, 200, local);

    const replyText = String(data?.choices?.[0]?.message?.content || '').trim();
    const unknown = !replyText || /i (?:don['’]?t|do not|cannot|can't) have|not sure|not listed|use the inquiry form|send an inquiry|contact the host/i.test(replyText);
    if (unknown) return sendJson(res, 200, local);

    return sendJson(res, 200, {
      reply: replyText,
      intent: 'property_info',
      showInquiryForm: false,
      suggestions: local.suggestions || [],
    });
  } catch (_) {
    return sendJson(res, 200, local);
  }
}

async function handleChatInquiry(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);

  const name = normalizeText(body.name);
  const email = normalizeText(body.email).toLowerCase();
  const phone = normalizeText(body.phone);
  const message = normalizeText(body.message);
  const page = normalizeText(body.page || 'chat');
  const topic = normalizeText(body.topic || 'General inquiry');

  if (!name || !email || !message) {
    return sendJson(res, 400, { error: 'Name, email, and message are required' });
  }

  const mailer = createMailer();
  if (!mailer) return sendJson(res, 500, { error: 'Missing SMTP_HOST or recipient email' });

  const subject = `[Luxury Stay] Chat inquiry from ${name}`;
  const text = [
    `Topic: ${topic}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '—'}`,
    `Page: ${page}`,
    '',
    'Message:',
    message,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 12px">New chat inquiry</h2>
      <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || '—')}</p>
      <p><strong>Page:</strong> ${escapeHtml(page)}</p>
      <p><strong>Message:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    </div>`;

  await mailer.transporter.sendMail({
    from: mailer.hostFrom,
    to: mailer.hostEmail,
    subject,
    text,
    html,
    replyTo: email,
  });

  return sendJson(res, 200, { ok: true });
}

async function handleMediaUpload(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);
  const filename = sanitizeName(body.filename || body.name || 'media');
  const contentType = normalizeText(body.contentType || body.mimeType || 'application/octet-stream');
  const folder = sanitizeName(body.folder || 'gallery', 'gallery');

  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });
  await ensureBucket(supabase);

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}.${extFromType(contentType)}`;
  const signed = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (signed.error) return sendJson(res, 500, { error: signed.error.message || 'Could not create upload URL' });

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl || '';
  const data = signed.data || {};
  return sendJson(res, 200, {
    bucket: BUCKET,
    path,
    publicUrl,
    signedUrl: data.signedUrl || data.signedURL || data.url || '',
    token: data.token || '',
  });
}

async function handleMediaDelete(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);
  const path = normalizeText(body.path || body.storagePath);
  if (!path) return sendJson(res, 400, { error: 'Missing media path' });
  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });
  const result = await supabase.storage.from(BUCKET).remove([path]);
  if (result.error) return sendJson(res, 500, { error: result.error.message || 'Failed to delete media' });
  return sendJson(res, 200, { ok: true });
}

async function loadReviews(includeHidden = false) {
  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return [];

  const reviewQuery = supabase
    .from('reviews')
    .select('id, booking_id, guest_name, guest_email, rating, stay_type, review, featured, hidden, created_at')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } = includeHidden ? await reviewQuery : await reviewQuery.eq('hidden', false);
  if (error) throw error;

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

  return reviewRows.map((row) => reviewRecord(row, bookingMap));
}

async function handleReviews(req, res) {
  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });

  if (req.method === 'GET') {
    const reviews = await loadReviews(false);
    return sendJson(res, 200, { reviews });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);
    const action = normalizeText(body.action).toLowerCase();
    const id = normalizeText(body.id || '').trim();

    if (action === 'list') {
      if (!isAdminRequest(req)) return sendJson(res, 403, { error: 'Admin access required' });
      const reviews = await loadReviews(true);
      return sendJson(res, 200, { reviews });
    }

    if (!isAdminRequest(req)) return sendJson(res, 403, { error: 'Admin access required' });
    if (!id) return sendJson(res, 400, { error: 'Missing review id' });

    if (action === 'delete') {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) return sendJson(res, 500, { error: error.message || 'Failed to delete review' });
      return sendJson(res, 200, { ok: true });
    }

    if (action === 'feature') {
      const { data: current, error: currentError } = await supabase.from('reviews').select('id').eq('id', id).maybeSingle();
      if (currentError || !current) return sendJson(res, 404, { error: 'Review not found' });
      const { error: clearError } = await supabase.from('reviews').update({ featured: false }).neq('id', id);
      if (clearError) return sendJson(res, 500, { error: clearError.message || 'Failed to update featured review' });
      const { error } = await supabase.from('reviews').update({ featured: true, hidden: false }).eq('id', id);
      if (error) return sendJson(res, 500, { error: error.message || 'Failed to update featured review' });
      return sendJson(res, 200, { ok: true });
    }

    if (action === 'toggle-hidden') {
      const { data: current, error: currentError } = await supabase.from('reviews').select('hidden').eq('id', id).maybeSingle();
      if (currentError || !current) return sendJson(res, 404, { error: 'Review not found' });
      const { error } = await supabase.from('reviews').update({ hidden: !current.hidden }).eq('id', id);
      if (error) return sendJson(res, 500, { error: error.message || 'Failed to update review visibility' });
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 400, { error: 'Unknown action' });
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

async function handleReviewsVerify(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);

  const bookingRef = normalizeText(body.bookingRef || body.bookingReference);
  const reviewToken = normalizeText(body.reviewToken);
  if (!bookingRef || !reviewToken) return sendJson(res, 400, { error: 'Missing booking reference or review token' });

  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_ref', bookingRef)
    .eq('review_token', reviewToken)
    .maybeSingle();

  if (error || !booking) return sendJson(res, 403, { error: 'Only verified guests can submit reviews.' });
  if (booking.review_submitted) return sendJson(res, 409, { error: 'A review has already been submitted for this booking.' });
  if (String(booking.status || '').toLowerCase() === 'cancelled') return sendJson(res, 403, { error: 'Cancelled bookings cannot submit reviews.' });

  const checkout = parseBookingDate(booking.checkout);
  if (!checkout) return sendJson(res, 400, { error: 'This booking does not have a valid checkout date.' });
  if (todayUtc() <= checkout) return sendJson(res, 403, { error: 'Reviews are available only after checkout is completed.' });

  return sendJson(res, 200, {
    ok: true,
    bookingRef: booking.booking_ref,
    guestName: booking.guest_name,
    guestEmail: booking.guest_email,
    checkin: booking.checkin,
    checkout: booking.checkout,
    status: booking.status,
  });
}

async function handleReviewsSubmit(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);

  const bookingRef = normalizeText(body.bookingReference || body.bookingRef);
  const reviewToken = normalizeText(body.reviewToken);
  const guestName = normalizeText(body.guestName);
  const guestEmail = normalizeText(body.guestEmail).toLowerCase();
  const rating = Number(body.rating || 0);
  const reviewTitle = normalizeText(body.reviewTitle || body.title || 'Verified guest review');
  const reviewMessage = normalizeText(body.reviewMessage || body.review || '');

  if (!bookingRef || !reviewToken || !guestName || !guestEmail || !reviewTitle || !reviewMessage || !rating) {
    return sendJson(res, 400, { error: 'Missing review details' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return sendJson(res, 400, { error: 'Rating must be between 1 and 5' });
  }

  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('booking_ref', bookingRef)
    .eq('review_token', reviewToken)
    .maybeSingle();

  if (error || !booking) return sendJson(res, 403, { error: 'Only verified guests can submit reviews.' });
  if (String(booking.guest_email || '').trim().toLowerCase() !== guestEmail) return sendJson(res, 403, { error: 'Guest email does not match the booking record.' });
  if (booking.review_submitted) return sendJson(res, 409, { error: 'A review has already been submitted for this booking.' });
  if (String(booking.status || '').toLowerCase() === 'cancelled') return sendJson(res, 403, { error: 'Cancelled bookings cannot submit reviews.' });

  const checkout = parseBookingDate(booking.checkout);
  if (!checkout) return sendJson(res, 400, { error: 'This booking does not have a valid checkout date.' });
  if (todayUtc() <= checkout) return sendJson(res, 403, { error: 'Reviews are available only after checkout is completed.' });

  const reviewId = crypto.randomUUID();
  const reviewBody = JSON.stringify({ title: reviewTitle, message: reviewMessage });

  const { error: reviewError } = await supabase.from('reviews').insert([{
    id: reviewId,
    booking_id: booking.id,
    guest_name: guestName,
    guest_email: guestEmail,
    rating,
    stay_type: 'Verified guest',
    review: reviewBody,
    featured: false,
    hidden: false,
  }]);

  if (reviewError) return sendJson(res, 500, { error: reviewError.message || 'Failed to submit review' });

  await supabase.from('bookings').update({ review_submitted: true, review_submitted_at: new Date().toISOString() }).eq('id', booking.id);
  return sendJson(res, 200, {
    ok: true,
    review: { id: reviewId, bookingRef, reviewTitle, reviewMessage, rating },
  });
}

async function handleReviewsInvite(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
  if (!isAdminRequest(req)) return sendJson(res, 403, { error: 'Admin access required' });
  let body = req.body;
  if (!body || typeof body !== 'object') body = await readBody(req);

  const bookingRef = normalizeText(body.bookingRef || body.bookingReference);
  if (!bookingRef) return sendJson(res, 400, { error: 'Missing booking reference' });

  const supabase = typeof getSupabase === 'function' ? getSupabase() : null;
  if (!supabase) return sendJson(res, 500, { error: 'Supabase is not configured' });

  const { data: booking, error } = await supabase.from('bookings').select('*').eq('booking_ref', bookingRef).maybeSingle();
  if (error || !booking) return sendJson(res, 404, { error: 'Booking not found' });
  if (String(booking.status || '').toLowerCase() === 'cancelled') return sendJson(res, 409, { error: 'Cancelled bookings cannot receive review invitations.' });

  const checkout = parseBookingDate(booking.checkout);
  if (!checkout) return sendJson(res, 400, { error: 'This booking does not have a valid checkout date.' });
  if (todayUtc() <= checkout) return sendJson(res, 403, { error: 'Review invitations can only be sent after checkout.' });

  const reviewToken = String(booking.review_token || '').trim() || generateReviewToken();
  if (!String(booking.review_token || '').trim()) {
    await supabase.from('bookings').update({ review_token: reviewToken }).eq('id', booking.id);
  }

  const mailer = createMailer();
  if (!mailer) return sendJson(res, 500, { error: 'Missing SMTP_HOST or recipient email' });
  const baseUrl = getBaseUrl(req);
  const reviewLink = baseUrl ? `${baseUrl}/?reviewRef=${encodeURIComponent(booking.booking_ref)}&reviewToken=${encodeURIComponent(reviewToken)}#reviews` : '';

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

  await mailer.transporter.sendMail({
    from: mailer.hostFrom,
    to: booking.guest_email,
    subject,
    text,
    html,
    replyTo: mailer.hostEmail,
  });

  await supabase.from('bookings').update({ review_invitation_sent: true, review_invitation_sent_at: new Date().toISOString() }).eq('id', booking.id);
  return sendJson(res, 200, { ok: true, reviewToken, reviewLink });
}

async function dispatch(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const action = normalizeText(url.searchParams.get('action') || '').toLowerCase();
  const path = normalizeText(url.pathname.replace(/^\/api\/?/, '')).toLowerCase();
  const endpoint = action || path;

  switch (endpoint) {
    case 'admin-login': return handleAdminLogin(req, res);
    case 'admin-logout': return handleAdminLogout(req, res);
    case 'admin-status': return handleAdminStatus(req, res);
    case 'book': return handleBookingCreate(req, res);
    case 'bookings': return handleBookings(req, res);
    case 'chat': return handleChat(req, res);
    case 'chat-inquiry': return handleChatInquiry(req, res);
    case 'media-upload': return handleMediaUpload(req, res);
    case 'media-delete': return handleMediaDelete(req, res);
    case 'reviews-list': return handleReviews(req, res);
    case 'reviews-submit': return handleReviewsSubmit(req, res);
    case 'reviews-verify': return handleReviewsVerify(req, res);
    case 'reviews-invite': return handleReviewsInvite(req, res);
    case 'router':
    case '':
      return sendJson(res, 404, { error: 'Unknown API route' });
    default:
      return sendJson(res, 404, { error: 'Unknown API route' });
  }
}

module.exports = async function handler(req, res) {
  try {
    return await dispatch(req, res);
  } catch (err) {
    return sendJson(res, 500, { error: err.message || 'Request failed' });
  }
};
