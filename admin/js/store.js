export const STORAGE_KEYS = {
  settings: 'luxury_stay_settings_v4',
  media: 'luxury_stay_media_v4',
  amenities: 'luxury_stay_amenities_v4',
  comments: 'luxury_stay_reviews_v4',
  bookings: 'luxury_stay_bookings_v1',
  inquiries: 'luxury_stay_inquiries_v1',
  blockedDates: 'luxury_stay_blocked_dates_v1',
  pricing: 'luxury_stay_pricing_v1',
  siteSettings: 'luxury_stay_site_settings_v1',
  luna: 'luxury_stay_luna_v1',
  theme: 'luxury_stay_theme_v1',
};

export const DEFAULT_PROPERTY = {
  name: 'Luxury Stay',
  area: 'Comfort • Convenience • Home Away From Home',
  building: 'Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3',
  capacity: 'Up to 9 guests',
  checkIn: '1:00 PM onwards',
  checkOut: '11:00 AM next day',
  securityDeposit: 'PHP 1,000 refundable deposit / reservation fee',
  parking: 'No parking included; please advise early if parking is needed.',
  parkingRates: {
    car: 'PHP 400.00 per 24 hrs',
    motorcycle: 'PHP 250.00 per 24 hrs',
  },
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
  heroEyebrow: 'Urban Deca Homes Ortigas Extension • Pasig City • Up to 9 guests',
  heroTitle: 'A calm, polished stay for families, friends, and city breaks.',
  heroSubtitle: 'A guest-ready condo with hotel-style essentials, self check-in, fast Wi‑Fi, and a location that keeps the whole group close to Ortigas.',
  hostName: 'Donnie',
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Urban+Deca+Homes+Ortigas+Extension,+Pasig+City',
  wazeUrl: 'https://waze.com/ul?q=Urban%20Deca%20Homes%20Ortigas%20Extension%2C%20Pasig%20City&navigate=yes',
  logoUrl: './assets/logo.png',
};

export const DEFAULT_MEDIA = [
  { id: 'img-9', type: 'image', src: './assets/9.jpg', alt: 'Living room wide shot', label: 'Living room', featured: true, hidden: false },
  { id: 'img-3', type: 'image', src: './assets/3.jpg', alt: 'Living room media wall', label: 'Media wall', featured: false, hidden: false },
  { id: 'img-2', type: 'image', src: './assets/2.jpg', alt: 'Kitchen and dining area', label: 'Kitchen', featured: false, hidden: false },
  { id: 'img-4', type: 'image', src: './assets/4.jpg', alt: 'Kitchen island and laundry area', label: 'Kitchen island', featured: false, hidden: false },
  { id: 'img-5', type: 'image', src: './assets/5.jpg', alt: 'Bedroom with workspace', label: 'Bedroom workspace', featured: false, hidden: false },
  { id: 'img-6', type: 'image', src: './assets/6.jpg', alt: 'Living area and seating', label: 'Living area', featured: false, hidden: false },
  { id: 'img-7', type: 'image', src: './assets/7.jpg', alt: 'Loft sleeping area', label: 'Loft bed', featured: false, hidden: false },
  { id: 'img-8', type: 'image', src: './assets/8.jpg', alt: 'Bedroom wide shot', label: 'Bedroom', featured: false, hidden: false },
  { id: 'img-10', type: 'image', src: './assets/10.jpg', alt: 'Dining area', label: 'Dining area', featured: false, hidden: false },
  { id: 'img-1', type: 'image', src: './assets/1.jpg', alt: 'Kitchen shelf', label: 'Kitchen shelf', featured: false, hidden: false },
  { id: 'img-11', type: 'image', src: './assets/11.jpg', alt: 'Bathroom overview', label: 'Bathroom', featured: false, hidden: false },
  { id: 'img-12', type: 'image', src: './assets/12.jpg', alt: 'Bathroom close-up', label: 'Bathroom close-up', featured: false, hidden: false },
  { id: 'vid-1', type: 'video', src: './assets/tour-01.mp4', poster: './assets/9.jpg', alt: 'Primary tour', label: 'Primary tour', featured: false, hidden: false },
  { id: 'vid-2', type: 'video', src: './assets/tour-02.mp4', poster: './assets/5.jpg', alt: 'Second tour', label: 'Second tour', featured: false, hidden: false },
];

export const DEFAULT_AMENITIES = [
  { id: 'am-1', title: 'Fast Wi-Fi', description: '100 Mbps connection for work, streaming, and everyday use.', category: 'In unit', icon: 'wifi', hidden: false, featured: false },
  { id: 'am-2', title: '40-inch SMART Google TV', description: 'Ready for Netflix, YouTube, and Disney Plus.', category: 'In unit', icon: 'tv', hidden: false, featured: false },
  { id: 'am-3', title: 'Self check-in', description: 'Tap-card access with a simple arrival flow.', category: 'Access', icon: 'key', hidden: false, featured: false },
  { id: 'am-4', title: 'Fully air-conditioned rooms', description: 'Keeps the unit comfortable throughout the day.', category: 'In unit', icon: 'ac', hidden: false, featured: false },
  { id: 'am-5', title: 'Washing machine', description: 'Wash & dry convenience for longer stays.', category: 'In unit', icon: 'washer', hidden: false, featured: false },
  { id: 'am-6', title: 'Portable karaoke', description: 'Fun evenings for groups and family get-togethers.', category: 'In unit', icon: 'karaoke', hidden: false, featured: false },
  { id: 'am-7', title: 'Projector', description: 'Big-screen movie nights inside the unit.', category: 'In unit', icon: 'projector', hidden: false, featured: false },
  { id: 'am-8', title: 'Complete kitchenware', description: 'Kitchen tools, rice cooker, microwave, induction cooker, kettle, and refrigerator.', category: 'In unit', icon: 'kitchen', hidden: false, featured: false },
  { id: 'am-9', title: 'Dining set', description: 'Four-seater dining area for meals and board games.', category: 'In unit', icon: 'dining', hidden: false, featured: false },
  { id: 'am-10', title: 'Board games and cards', description: 'Built-in entertainment for downtime inside the unit.', category: 'In unit', icon: 'games', hidden: false, featured: false },
  { id: 'am-11', title: 'Basketball court', description: 'Community amenity available inside the property.', category: 'Building', icon: 'basketball', hidden: false, featured: false },
  { id: 'am-12', title: 'Playground', description: 'Family-friendly community space near the unit.', category: 'Building', icon: 'park', hidden: false, featured: false },
  { id: 'am-13', title: 'Clubhouse', description: 'Shared space inside the property community.', category: 'Building', icon: 'park', hidden: false, featured: false },
  { id: 'am-14', title: 'Pocket park', description: 'Quiet outdoor corner for a quick break.', category: 'Building', icon: 'park', hidden: false, featured: false },
  { id: 'am-15', title: 'Alfamart convenience store', description: 'Easy access to essentials and snacks.', category: 'Building', icon: 'store', hidden: false, featured: false },
  { id: 'am-16', title: 'Coffee shop', description: 'Convenient coffee stop inside the property area.', category: 'Building', icon: 'coffee', hidden: false, featured: false },
  { id: 'am-17', title: 'ATM machine', description: 'Nearby cash access for convenience.', category: 'Building', icon: 'store', hidden: false, featured: false },
  { id: 'am-18', title: '24/7 security', description: 'Property security is available around the clock.', category: 'Building', icon: 'security', hidden: false, featured: false },
  { id: 'am-19', title: 'Food bazaar (Fri-Sun)', description: 'Weekend food choices near the property.', category: 'Building', icon: 'coffee', hidden: false, featured: false },
];

export const DEFAULT_COMMENTS = [
  { id: 'seed-1', name: 'Guest favorite', rating: 5, stayType: 'Weekend stay', text: 'The place looks exactly like the photos. Very clean, organized, and easy to enjoy.', featured: true, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 8 },
  { id: 'seed-2', name: 'Top rated stay', rating: 5, stayType: 'Family trip', text: 'The lighting, layout, and finishes make the stay feel polished and comfortable.', featured: false, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 5 },
  { id: 'seed-3', name: 'Repeat guest', rating: 5, stayType: 'Work trip', text: 'Great for work trips and family weekends. Check-in was easy and everything was ready.', featured: false, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 2 },
];

export const DEFAULT_PRICING = {
  weekdayRate: 2289,
  weekendRate: 2489,
  extraGuestFee: 350,
  petFee: 300,
};

export const DEFAULT_SITE_SETTINGS = {
  propertyName: 'Luxury Stay',
  logoUrl: './assets/logo.png',
  address: 'Urban Deca Homes Ortigas Extension, Pasig City, BLDG Q - Area 4/3',
  contactEmail: '',
  contactPhone: '',
  socialLinks: { facebook: '', instagram: '', tiktok: '' },
  heroImages: ['./assets/9.jpg', './assets/3.jpg', './assets/5.jpg'],
  themeMode: 'auto',
  dayStart: '06:00',
  nightStart: '18:00',
};

export const DEFAULT_LUNA = {
  description: DEFAULT_PROPERTY.heroSubtitle,
  faqs: [
    { question: 'Where is the property?', answer: DEFAULT_PROPERTY.building },
    { question: 'What time is check-in?', answer: DEFAULT_PROPERTY.checkIn },
    { question: 'What time is checkout?', answer: DEFAULT_PROPERTY.checkOut },
  ],
  houseRules: DEFAULT_PROPERTY.houseRules.slice(),
  parking: DEFAULT_PROPERTY.parking,
  contact: DEFAULT_SITE_SETTINGS.contactEmail,
  localRecommendations: DEFAULT_PROPERTY.nearby.slice(),
};

export const DEFAULT_BOOKINGS = [];
export const DEFAULT_INQUIRIES = [];
export const DEFAULT_BLOCKED_DATES = [];

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return clone(fallback);
    const parsed = JSON.parse(raw);
    return parsed ?? clone(fallback);
  } catch {
    return clone(fallback);
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function formatMoney(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  return String(value || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getPricingConfig() {
  return readJSON(STORAGE_KEYS.pricing, DEFAULT_PRICING);
}

export function setPricingConfig(next) {
  writeJSON(STORAGE_KEYS.pricing, next);
}

export function getSiteSettings() {
  return readJSON(STORAGE_KEYS.siteSettings, DEFAULT_SITE_SETTINGS);
}

export function setSiteSettings(next) {
  writeJSON(STORAGE_KEYS.siteSettings, next);
}

export function getLunaConfig() {
  return readJSON(STORAGE_KEYS.luna, DEFAULT_LUNA);
}

export function setLunaConfig(next) {
  writeJSON(STORAGE_KEYS.luna, next);
}

export function getBookings() {
  return readJSON(STORAGE_KEYS.bookings, DEFAULT_BOOKINGS);
}

export function setBookings(next) {
  writeJSON(STORAGE_KEYS.bookings, next);
}

export function getInquiries() {
  return readJSON(STORAGE_KEYS.inquiries, DEFAULT_INQUIRIES);
}

export function setInquiries(next) {
  writeJSON(STORAGE_KEYS.inquiries, next);
}

export function getBlockedDates() {
  return readJSON(STORAGE_KEYS.blockedDates, DEFAULT_BLOCKED_DATES);
}

export function setBlockedDates(next) {
  writeJSON(STORAGE_KEYS.blockedDates, next);
}

export function getSettings() {
  const base = readJSON(STORAGE_KEYS.settings, DEFAULT_PROPERTY);
  return { ...DEFAULT_PROPERTY, ...base };
}

export function setSettings(next) {
  writeJSON(STORAGE_KEYS.settings, next);
}

export function getMedia() {
  return readJSON(STORAGE_KEYS.media, DEFAULT_MEDIA);
}

export function setMedia(next) {
  writeJSON(STORAGE_KEYS.media, next);
}

export function getAmenities() {
  return readJSON(STORAGE_KEYS.amenities, DEFAULT_AMENITIES);
}

export function setAmenities(next) {
  writeJSON(STORAGE_KEYS.amenities, next);
}

export function getComments() {
  return readJSON(STORAGE_KEYS.comments, DEFAULT_COMMENTS);
}

export function setComments(next) {
  writeJSON(STORAGE_KEYS.comments, next);
}

export function storageSnapshot() {
  return {
    settings: getSettings(),
    media: getMedia(),
    amenities: getAmenities(),
    comments: getComments(),
    bookings: getBookings(),
    inquiries: getInquiries(),
    blockedDates: getBlockedDates(),
    pricing: getPricingConfig(),
    siteSettings: getSiteSettings(),
    luna: getLunaConfig(),
  };
}

export function parseMoney(value, fallback = 0) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function dateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkin, checkout) {
  const start = new Date(`${checkin}T00:00:00`);
  const end = new Date(`${checkout}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

export function estimateBookingTotal(booking, pricing = getPricingConfig()) {
  const nights = nightsBetween(booking.checkin, booking.checkout) || 1;
  const guestCount = Number(booking.guests || 1) || 1;
  const base = guestCount > 4 ? pricing.weekendRate : pricing.weekdayRate;
  const extraGuests = Math.max(0, guestCount - 4);
  const petCount = Number(booking.pets || 0) || 0;
  const total = (base * nights) + (extraGuests * pricing.extraGuestFee * nights) + (petCount * pricing.petFee);
  return total;
}

export function generateReference(prefix = 'LS') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function autoThemeForTime(now = new Date(), schedule = getSiteSettings()) {
  const [dH, dM] = String(schedule.dayStart || '06:00').split(':').map(Number);
  const [nH, nM] = String(schedule.nightStart || '18:00').split(':').map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const dayStart = (Number.isFinite(dH) ? dH : 6) * 60 + (Number.isFinite(dM) ? dM : 0);
  const nightStart = (Number.isFinite(nH) ? nH : 18) * 60 + (Number.isFinite(nM) ? nM : 0);
  return minutes >= dayStart && minutes < nightStart ? 'day' : 'night';
}

export function ensureSeededDefaults() {
  if (!localStorage.getItem(STORAGE_KEYS.settings)) setSettings(clone(DEFAULT_PROPERTY));
  if (!localStorage.getItem(STORAGE_KEYS.media)) setMedia(clone(DEFAULT_MEDIA));
  if (!localStorage.getItem(STORAGE_KEYS.amenities)) setAmenities(clone(DEFAULT_AMENITIES));
  if (!localStorage.getItem(STORAGE_KEYS.comments)) setComments(clone(DEFAULT_COMMENTS));
  if (!localStorage.getItem(STORAGE_KEYS.pricing)) setPricingConfig(clone(DEFAULT_PRICING));
  if (!localStorage.getItem(STORAGE_KEYS.siteSettings)) setSiteSettings(clone(DEFAULT_SITE_SETTINGS));
  if (!localStorage.getItem(STORAGE_KEYS.luna)) setLunaConfig(clone(DEFAULT_LUNA));
  if (!localStorage.getItem(STORAGE_KEYS.bookings)) setBookings(clone(DEFAULT_BOOKINGS));
  if (!localStorage.getItem(STORAGE_KEYS.inquiries)) setInquiries(clone(DEFAULT_INQUIRIES));
  if (!localStorage.getItem(STORAGE_KEYS.blockedDates)) setBlockedDates(clone(DEFAULT_BLOCKED_DATES));
}
