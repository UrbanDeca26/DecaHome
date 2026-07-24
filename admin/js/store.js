(() => {
  'use strict';

  const STORAGE_KEYS = {
    settings: 'luxury_stay_settings_v4',
    media: 'luxury_stay_media_v4',
    amenities: 'luxury_stay_amenities_v4',
    reviews: 'luxury_stay_reviews_v4',
    inquiries: 'luxury_stay_inquiries_v1',
    blockedDates: 'luxury_stay_blocked_dates_v1',
    theme: 'luxury_stay_theme_v1',
  };

  const DEFAULT_SETTINGS = {
    propertyName: 'Luxury Stay',
    name: 'Luxury Stay',
    area: 'Urban Deca Homes Ortigas Extension, Pasig City',
    building: 'BLDG Q - Area 4/3',
    capacity: 'Up to 9 guests',
    maxGuests: 9,
    maxPets: 3,
    weekdayRate: 1999,
    weekendRate: 2199,
    includedGuests: 2,
    extraGuestFee: 400,
    petFee: 200,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Urban+Deca+Homes+Ortigas+Extension,+Pasig+City',
    wazeUrl: 'https://waze.com/ul?q=Urban%20Deca%20Homes%20Ortigas%20Extension%2C%20Pasig%20City&navigate=yes',
    hostName: 'Donnie',
    checkIn: '1:00 PM onwards',
    checkOut: '11:00 AM next day',
    securityDeposit: 'PHP 1,000 refundable deposit / reservation fee',
    parking: 'No parking included; please advise early if parking is needed.',
    parkingRates: { car: 'PHP 400.00 per 24 hrs', motorcycle: 'PHP 250.00 per 24 hrs' },
    heroEyebrow: 'Urban Deca Homes Ortigas Extension • Pasig City • Up to 9 guests',
    heroTitle: 'A calm, polished stay for families, friends, and city breaks.',
    heroSubtitle: 'A guest-ready condo with hotel-style essentials, self check-in, fast Wi‑Fi, and a location that keeps the whole group close to Ortigas.',
    logoUrl: '',
    heroImage: '',
    heroImage2: '',
    themeStartDay: '06:00',
    themeStartNight: '18:00',
    socials: {
      facebook: '',
      instagram: '',
      tiktok: '',
      website: '',
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
    nearby: [
      'SM East Ortigas', 'Bridgetowne', 'SM Megamall', 'Robinsons Galleria', 'Medical City', 'Tiendesitas', 'Libis, Eastwood', 'Junction, Cainta', 'Arcovia, Pasig'
    ],
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
    lunaDescription: 'Luxury Stay is a polished condo hideaway for families and friends, with fast self check-in and a practical location near Ortigas.',
    lunaFaqs: [
      { q: 'What time is check-in?', a: 'Check-in starts at 1:00 PM.' },
      { q: 'Do you allow parking?', a: 'Parking is by request and subject to availability.' },
    ],
    lunaHouseRules: [
      'Quiet hours are enforced.',
      'No smoking or vaping inside the unit.',
    ],
    lunaParking: 'Parking is not included by default; please advise early if you need a slot.',
    lunaContact: 'Use the inquiry form for special requests or questions that need host confirmation.',
    lunaRecommendations: ['SM East Ortigas', 'Bridgetowne', 'Eastwood', 'Tiendesitas'],
  };

  const DEFAULT_MEDIA = [
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

  const DEFAULT_AMENITIES = [
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

  const ICONS = {
    wifi: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 8.5C8.8 4.5 15.2 4.5 20 8.5M7 12c3.2-2.8 6.8-2.8 10 0M10 15.5c1.2-1 2.8-1 4 0M12 19h0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    tv: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14v10H5zM8 19h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10h6M9 13h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none"><path d="M9.5 14.5a4.5 4.5 0 1 1 3.2-7.7l6.8 6.8-2.4 2.4-1.8-1.8-1.5 1.5-1.9-1.9-1.4 1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ac: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v18M5 8h14M6.5 10.5l11 0M7 13l10 0M8.5 15.5l7 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    kitchen: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 5h12v14H6zM9 9h6M9 13h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fridge: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v16H8zM8 10h8M10 7h4M10 13h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    microwave: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14v10H5zM8 10h4M8 13h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    washer: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16H6zM9 8h0M12 8h0M15 8h0M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shower: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h7v4H9l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10l2-2M18 8l1-1M14 12l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    workspace: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 7h12v7H6zM4 18h16M9 14v4M15 14v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    security: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-2.8 7.7-7 9-4.2-1.3-7-4.5-7-9V6l7-3z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.5 12l1.9 1.9L14.8 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    karaoke: '<svg viewBox="0 0 24 24" fill="none"><path d="M10 14a4 4 0 1 0 0-8h-1v8h1zm5-7v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16.5" cy="18.5" r="1.5" fill="currentColor"/></svg>',
    projector: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14v8H5zM9 19h6M12 15v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11h0M12 11h0M16 11h0" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    games: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 9h10l2 8H5l2-8z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 12h0M15.5 12h0M12 10.5v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    dining: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4v16M10 4v16M14 4v16M18 4v16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    store: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 10h14l-1 10H6L5 10zM7 10l1-5h8l1 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    basketball: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8"/><path d="M12 4a14 14 0 0 0 0 16M4 12h16M7 6a14 14 0 0 1 10 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    park: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4l4 8H8l4-8zM5 20h14M8 20V12h8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    coffee: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9h9v5a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V9zM15 10h2a2 2 0 0 1 0 4h-2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 5c0 1 .5 1 0 2M11 5c0 1 .5 1 0 2M14 5c0 1 .5 1 0 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    closet: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16H6zM12 4v16M9 8h0M15 8h0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    iron: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 14h10l2 4H8a2 2 0 0 1-2-2v-2zM9 10h5l2 4H9z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dryer: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v16H8zM10 8h4M10 12h4M10 16h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    default: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12h16M12 4v16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : clone(fallback);
    } catch (_) {
      return clone(fallback);
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function escapeHtml(str) {
    return String(str ?? '')
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

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  }

  function parseDateISO(value) {
    if (!value) return null;
    const parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  function addDays(date, days) {
    const next = new Date(date.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  function toISODate(date) {
    return date.toISOString().slice(0, 10);
  }

  function weekdayName(date) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(date);
  }

  function monthTitle(date) {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  }

  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function normalizeTextList(value, fallback = []) {
    if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
    if (typeof value === 'string') return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
    return Array.isArray(fallback) ? fallback.slice() : [];
  }

  function normalizeSettings(input) {
    const src = input && typeof input === 'object' ? input : {};
    const next = clone(DEFAULT_SETTINGS);

    next.propertyName = String(src.propertyName || src.name || next.propertyName).trim() || next.propertyName;
    next.name = next.propertyName;
    next.area = String(src.area || next.area).trim() || next.area;
    next.building = String(src.building || next.building).trim() || next.building;
    next.maxGuests = Math.max(1, Math.round(Number(src.maxGuests ?? src.guestCapacity ?? next.maxGuests) || next.maxGuests));
    next.guestCapacity = next.maxGuests;
    next.maxPets = Math.max(0, Math.round(Number(src.maxPets ?? next.maxPets) || next.maxPets));
    next.weekdayRate = Math.max(0, Number(src.weekdayRate ?? next.weekdayRate) || next.weekdayRate);
    next.weekendRate = Math.max(0, Number(src.weekendRate ?? next.weekendRate) || next.weekendRate);
    next.includedGuests = Math.min(next.maxGuests, Math.max(1, Math.round(Number(src.includedGuests ?? next.includedGuests) || next.includedGuests)));
    next.extraGuestFee = Math.max(0, Number(src.extraGuestFee ?? next.extraGuestFee) || next.extraGuestFee);
    next.petFee = Math.max(0, Number(src.petFee ?? next.petFee) || next.petFee);
    next.capacity = `Up to ${next.maxGuests} guests`;
    next.heroEyebrow = String(src.heroEyebrow || `${next.area} • ${next.capacity}`).trim();
    next.heroTitle = String(src.heroTitle || next.heroTitle).trim() || next.heroTitle;
    next.heroSubtitle = String(src.heroSubtitle || next.heroSubtitle).trim() || next.heroSubtitle;
    next.checkIn = String(src.checkIn || next.checkIn).trim() || next.checkIn;
    next.checkOut = String(src.checkOut || next.checkOut).trim() || next.checkOut;
    next.securityDeposit = String(src.securityDeposit || next.securityDeposit).trim() || next.securityDeposit;
    next.parking = String(src.parking || next.parking).trim() || next.parking;
    next.parkingRates = {
      car: String((src.parkingRates && src.parkingRates.car) || next.parkingRates.car).trim() || next.parkingRates.car,
      motorcycle: String((src.parkingRates && src.parkingRates.motorcycle) || next.parkingRates.motorcycle).trim() || next.parkingRates.motorcycle,
    };
    next.logoUrl = String(src.logoUrl || next.logoUrl || '').trim();
    next.heroImage = String(src.heroImage || next.heroImage || '').trim();
    next.heroImage2 = String(src.heroImage2 || next.heroImage2 || '').trim();
    next.themeStartDay = String(src.themeStartDay || next.themeStartDay || '06:00').trim() || '06:00';
    next.themeStartNight = String(src.themeStartNight || next.themeStartNight || '18:00').trim() || '18:00';
    next.googleMapsUrl = String(src.googleMapsUrl || next.googleMapsUrl || '').trim();
    next.wazeUrl = String(src.wazeUrl || next.wazeUrl || '').trim();
    next.hostName = String(src.hostName || next.hostName || 'Donnie').trim() || 'Donnie';
    next.socials = {
      facebook: String(src.socials?.facebook || src.facebook || next.socials.facebook || '').trim(),
      instagram: String(src.socials?.instagram || src.instagram || next.socials.instagram || '').trim(),
      tiktok: String(src.socials?.tiktok || src.tiktok || next.socials.tiktok || '').trim(),
      website: String(src.socials?.website || src.website || next.socials.website || '').trim(),
    };
    next.pricing = normalizeTextList(src.pricing, next.pricing);
    next.nearby = normalizeTextList(src.nearby, next.nearby);
    next.houseRules = normalizeTextList(src.houseRules, next.houseRules);
    next.bookingRequirements = normalizeTextList(src.bookingRequirements, next.bookingRequirements);
    next.selfCheckIn = normalizeTextList(src.selfCheckIn, next.selfCheckIn);
    next.checkout = normalizeTextList(src.checkout, next.checkout);
    next.lunaDescription = String(src.lunaDescription || next.lunaDescription || '').trim();
    next.lunaFaqs = Array.isArray(src.lunaFaqs) ? src.lunaFaqs.map((item) => ({ q: String(item?.q || item?.question || '').trim(), a: String(item?.a || item?.answer || '').trim() })).filter((item) => item.q || item.a) : clone(next.lunaFaqs);
    next.lunaHouseRules = normalizeTextList(src.lunaHouseRules, next.lunaHouseRules);
    next.lunaParking = String(src.lunaParking || next.lunaParking || '').trim();
    next.lunaContact = String(src.lunaContact || next.lunaContact || '').trim();
    next.lunaRecommendations = normalizeTextList(src.lunaRecommendations, next.lunaRecommendations);

    return next;
  }

  function loadSettings() {
    return normalizeSettings(loadJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  }

  function saveSettings(settings) {
    saveJson(STORAGE_KEYS.settings, normalizeSettings(settings));
  }

  function loadMedia() {
    return loadJson(STORAGE_KEYS.media, DEFAULT_MEDIA);
  }

  function saveMedia(media) {
    saveJson(STORAGE_KEYS.media, Array.isArray(media) ? media : []);
  }

  function loadAmenities() {
    return loadJson(STORAGE_KEYS.amenities, DEFAULT_AMENITIES);
  }

  function saveAmenities(items) {
    saveJson(STORAGE_KEYS.amenities, Array.isArray(items) ? items : []);
  }

  function loadBlockedDates() {
    const raw = loadJson(STORAGE_KEYS.blockedDates, []);
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => {
      if (typeof item === 'string') return { date: item, type: 'blocked', note: '' };
      if (item && typeof item === 'object') return {
        date: String(item.date || item.value || '').trim(),
        type: String(item.type || 'blocked').trim() || 'blocked',
        note: String(item.note || '').trim(),
      };
      return null;
    }).filter((item) => item && item.date);
  }

  function saveBlockedDates(items) {
    const normalized = Array.isArray(items)
      ? items.map((item) => ({
          date: String(item?.date || '').trim(),
          type: String(item?.type || 'blocked').trim() || 'blocked',
          note: String(item?.note || '').trim(),
        })).filter((item) => item.date)
      : [];
    saveJson(STORAGE_KEYS.blockedDates, normalized);
  }

  function loadInquiries() {
    return loadJson(STORAGE_KEYS.inquiries, []);
  }

  function saveInquiries(items) {
    saveJson(STORAGE_KEYS.inquiries, Array.isArray(items) ? items : []);
  }

  function loadTheme() {
    return loadJson(STORAGE_KEYS.theme, { mode: 'day', dayStart: '06:00', nightStart: '18:00' });
  }

  function saveTheme(theme) {
    saveJson(STORAGE_KEYS.theme, theme || {});
  }

  async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed: ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function getCookies() {
    const out = {};
    document.cookie.split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      out[key] = decodeURIComponent(value);
    });
    return out;
  }

  function iconMarkup(key) {
    return ICONS[key] || ICONS.default;
  }

  window.LuxuryAdminStore = {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    DEFAULT_MEDIA,
    DEFAULT_AMENITIES,
    loadSettings,
    saveSettings,
    loadMedia,
    saveMedia,
    loadAmenities,
    saveAmenities,
    loadInquiries,
    saveInquiries,
    loadBlockedDates,
    saveBlockedDates,
    loadTheme,
    saveTheme,
    apiFetch,
    formatCurrency,
    formatDate,
    formatDateTime,
    parseDateISO,
    addDays,
    toISODate,
    weekdayName,
    monthTitle,
    generateId,
    iconMarkup,
    escapeHtml,
    clone,
    getCookies,
    normalizeSettings,
    normalizeTextList,
  };
})();
