
(() => {
  'use strict';

  const CONFIG = {
    bookingEndpoint: '/api/book',
    adminLoginEndpoint: '/api/admin-login',
    adminLogoutEndpoint: '/api/admin-logout',
    adminStatusEndpoint: '/api/admin-status',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Urban+Deca+Homes+Ortigas+Extension,+Pasig+City',
    wazeUrl: 'https://waze.com/ul?q=Urban%20Deca%20Homes%20Ortigas%20Extension%2C%20Pasig%20City&navigate=yes',
  };

  const PROPERTY = {
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
    nearby: [
      'SM East Ortigas',
      'Bridgetowne',
      'SM Megamall',
      'Robinsons Galleria',
      'Medical City',
      'Tiendesitas',
      'Libis, Eastwood',
      'Junction, Cainta',
      'Arcovia, Pasig',
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
  };

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

  const ICON_OPTIONS = Object.keys(ICONS).filter((key) => key !== 'default');

  const DEFAULT_COMMENTS = [
    { id: 'seed-1', name: 'Guest favorite', rating: 5, stayType: 'Weekend stay', text: 'The place looks exactly like the photos. Very clean, organized, and easy to enjoy.', featured: true, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 8 },
    { id: 'seed-2', name: 'Top rated stay', rating: 5, stayType: 'Family trip', text: 'The lighting, layout, and finishes make the stay feel polished and comfortable.', featured: false, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 5 },
    { id: 'seed-3', name: 'Repeat guest', rating: 5, stayType: 'Work trip', text: 'Great for work trips and family weekends. Check-in was easy and everything was ready.', featured: false, hidden: false, source: 'seed', ts: Date.now() - 86400000 * 2 },
  ];

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

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const state = {
    galleryIndex: 0,
    settings: loadJson('luxury_stay_settings_v4', PROPERTY),
    comments: loadJson('luxury_stay_reviews_v4', DEFAULT_COMMENTS),
    media: loadJson('luxury_stay_media_v4', DEFAULT_MEDIA),
    amenities: loadJson('luxury_stay_amenities_v4', DEFAULT_AMENITIES),
    admin: false,
    editingAmenityId: null,
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return clone(fallback);
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : clone(fallback);
    } catch (_) {
      return clone(fallback);
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function persistComments() { saveJson('luxury_stay_reviews_v4', state.comments); }
  function persistMedia() { saveJson('luxury_stay_media_v4', state.media); }
  function persistAmenities() { saveJson('luxury_stay_amenities_v4', state.amenities); }
  function persistSettings() { saveJson('luxury_stay_settings_v4', state.settings); }

  function textareaToList(value) {
    return String(value || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function listToTextarea(list) {
    return Array.isArray(list) ? list.join('\n') : String(list || '');
  }

  function extractCapacity(value) {
    const match = String(value || '').match(/(\d+)/);
    return match ? Number(match[1]) : 9;
  }

  function normalizeSettings(input) {
    const src = input && typeof input === 'object' ? input : {};
    const next = clone(PROPERTY);
    next.propertyName = String(src.propertyName || src.name || next.name || 'Luxury Stay').trim() || 'Luxury Stay';
    next.name = next.propertyName;
    next.area = String(src.area || next.area || '').trim();
    next.building = String(src.building || next.building || '').trim();
    next.guestCapacity = Number(src.guestCapacity || extractCapacity(src.capacity || next.capacity) || 9);
    next.capacity = `Up to ${next.guestCapacity} guests`;
    next.heroEyebrow = String(src.heroEyebrow || `${next.area} • ${next.capacity}`).trim();
    next.heroTitle = String(src.heroTitle || 'Comfortable stays for families, friends, and quick city breaks.').trim();
    next.heroSubtitle = String(src.heroSubtitle || 'A clean, practical space with hotel-style essentials, self check-in, fast Wi‑Fi, and a location that keeps the whole group close to Ortigas.').trim();
    next.checkIn = String(src.checkIn || next.checkIn || '').trim();
    next.checkOut = String(src.checkOut || next.checkOut || '').trim();
    next.securityDeposit = String(src.securityDeposit || next.securityDeposit || '').trim();
    next.parking = String(src.parking || next.parking || '').trim();
    next.parkingRates = {
      car: String((src.parkingRates && src.parkingRates.car) || next.parkingRates.car || '').trim(),
      motorcycle: String((src.parkingRates && src.parkingRates.motorcycle) || next.parkingRates.motorcycle || '').trim(),
    };
    next.pricing = textareaToList(src.pricing ? listToTextarea(src.pricing) : listToTextarea(next.pricing));
    next.nearby = textareaToList(src.nearby ? listToTextarea(src.nearby) : listToTextarea(next.nearby));
    next.houseRules = textareaToList(src.houseRules ? listToTextarea(src.houseRules) : listToTextarea(next.houseRules));
    next.bookingRequirements = textareaToList(src.bookingRequirements ? listToTextarea(src.bookingRequirements) : listToTextarea(next.bookingRequirements));
    next.selfCheckIn = textareaToList(src.selfCheckIn ? listToTextarea(src.selfCheckIn) : listToTextarea(next.selfCheckIn));
    next.checkout = textareaToList(src.checkout ? listToTextarea(src.checkout) : listToTextarea(next.checkout));
    next.googleMapsUrl = String(src.googleMapsUrl || CONFIG.googleMapsUrl || '').trim();
    next.wazeUrl = String(src.wazeUrl || CONFIG.wazeUrl || '').trim();
    next.hostName = String(src.hostName || 'Donnie').trim() || 'Donnie';
    next.contactEmail = String(src.contactEmail || '').trim();
    next.contactPhone = String(src.contactPhone || '').trim();
    return next;
  }

  function getSettings() {
    return normalizeSettings(state.settings);
  }

  function getGuestCapacity() {
    const n = Number(getSettings().guestCapacity);
    return Number.isFinite(n) && n > 0 ? Math.min(20, Math.max(1, Math.round(n))) : 9;
  }

  function getPricingSummary() {
    const pricing = getSettings().pricing;
    return {
      top: pricing[0] || 'Pricing available in the guide',
      secondary: pricing[1] || pricing[0] || 'Pricing available in the guide',
      tertiary: pricing[2] || pricing[1] || pricing[0] || 'Pricing available in the guide',
    };
  }

  function currentPropertySnapshot() {
    const settings = getSettings();
    return {
      ...settings,
      amenities: getVisibleAmenities().map((item) => ({
        title: item.title,
        category: item.category,
        description: item.description,
      })),
    };
  }

  function applySettingsToPublicUI() {
    const settings = getSettings();
    const guestCapacity = getGuestCapacity();
    document.title = `${settings.name} | ${settings.area}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', `${settings.name} booking site for ${settings.area}.`);
    }

    const brandStrong = document.querySelector('.brand-copy strong');
    const brandSmall = document.querySelector('.brand-copy small');
    if (brandStrong) brandStrong.textContent = settings.name;
    if (brandSmall) brandSmall.textContent = settings.area;

    const eyebrow = document.querySelector('.hero-copy .eyebrow');
    if (eyebrow) eyebrow.textContent = settings.heroEyebrow;
    const heroTitle = document.querySelector('.hero-copy h1');
    if (heroTitle) heroTitle.textContent = settings.heroTitle;
    const heroSubtitle = document.querySelector('.hero-copy p');
    if (heroSubtitle) heroSubtitle.textContent = settings.heroSubtitle;

    const heroValues = document.querySelectorAll('.hero-values .value-card');
    if (heroValues[0]) heroValues[0].querySelector('strong').textContent = settings.capacity;
    if (heroValues[0]) heroValues[0].querySelector('span').textContent = 'Flexible for family or barkada stays.';
    if (heroValues[1]) heroValues[1].querySelector('strong').textContent = 'Self check-in';
    if (heroValues[1]) heroValues[1].querySelector('span').textContent = 'Tap-card entry with simple arrival steps.';
    if (heroValues[2]) heroValues[2].querySelector('strong').textContent = 'Fast Wi‑Fi';
    if (heroValues[2]) heroValues[2].querySelector('span').textContent = '100 Mbps connection for streaming and work.';
    if (heroValues[3]) heroValues[3].querySelector('strong').textContent = 'Ortigas location';
    if (heroValues[3]) heroValues[3].querySelector('span').textContent = 'Close to malls, food, and essentials.';

    const miniStats = document.querySelectorAll('.mini-stats article');
    if (miniStats[0]) {
      miniStats[0].querySelector('strong').textContent = settings.checkIn;
      miniStats[0].querySelector('span').textContent = 'Check-in onward';
    }
    if (miniStats[1]) {
      miniStats[1].querySelector('strong').textContent = settings.checkOut;
      miniStats[1].querySelector('span').textContent = 'Checkout next day';
    }
    if (miniStats[2]) {
      miniStats[2].querySelector('strong').textContent = settings.securityDeposit.replace(/^PHP\s*/i, '₱').replace(' refundable deposit / reservation fee', '');
      miniStats[2].querySelector('span').textContent = 'Refundable deposit';
    }

    const guestSelect = $('#guests');
    if (guestSelect) {
      guestSelect.innerHTML = Array.from({ length: guestCapacity }, (_, i) => `<option>${i + 1} guest${i === 0 ? '' : 's'}</option>`).join('');
    }

    const reserveBtn = $('#reserveBtn');
    if (reserveBtn) reserveBtn.textContent = 'Check availability';

    const footerStrong = document.querySelector('.footer strong');
    const footerP = document.querySelector('.footer p');
    if (footerStrong) footerStrong.textContent = settings.name;
    if (footerP) footerP.textContent = `${settings.area} • ${settings.building}`;

    const openPhotosBtn = $('#openAllPhotos');
    if (openPhotosBtn) openPhotosBtn.textContent = 'View gallery';
  }

  function renderGuide() {
    const grid = $('#guideGrid');
    if (!grid) return;
    const s = getSettings();
    const pricing = s.pricing.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const booking = s.bookingRequirements.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const selfCheckIn = s.selfCheckIn.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const checkout = s.checkout.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const rules = s.houseRules.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const nearby = s.nearby.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

    const section = (title, body, open = false) => `
      <details class="guide-card"${open ? ' open' : ''}>
        <summary class="guide-summary">
          <div class="guide-summary-copy">
            <h3>${escapeHtml(title)}</h3>
          </div>
          <span class="guide-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="guide-body">${body}</div>
      </details>
    `;

    grid.innerHTML = [
      section('Exact location', `
        <div class="guide-panel">
          <p class="guide-location">${escapeHtml(s.area)}</p>
          <p class="guide-location">${escapeHtml(s.building)}</p>
          <div class="map-actions compact">
            <a class="btn btn-primary" id="googleMapsBtn" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
            <a class="btn btn-secondary" id="wazeBtn" target="_blank" rel="noopener noreferrer">Open in Waze</a>
          </div>
        </div>
        <div class="guide-panel">
          <h4>Nearby places</h4>
          <ul class="clean-list">${nearby}</ul>
        </div>
      `, true),
      section('Parking', `
        <div class="guide-panel">
          <ul class="clean-list">
            <li>${escapeHtml(s.parking)}</li>
            <li>Car: ${escapeHtml(s.parkingRates.car)}</li>
            <li>Motorcycle: ${escapeHtml(s.parkingRates.motorcycle)}</li>
          </ul>
        </div>
      `),
      section('Pricing', `
        <div class="guide-panel">
          <ul class="clean-list">${pricing}</ul>
        </div>
      `),
      section('Booking requirements', `
        <div class="guide-panel">
          <ul class="clean-list">${booking}</ul>
        </div>
      `),
      section('Self check-in', `
        <div class="guide-panel">
          <ol class="clean-list ordered">${selfCheckIn}</ol>
        </div>
      `),
      section('Checkout reminder', `
        <div class="guide-panel">
          <ol class="clean-list ordered">${checkout}</ol>
        </div>
      `),
      section('House rules', `
        <div class="guide-panel">
          <ul class="clean-list">${rules}</ul>
        </div>
      `),
    ].join('');
  }

  function renderOwnerSettings() {
    const list = $('#ownerSettingsList');
    if (!list) return;
    if (!state.admin) {
      list.innerHTML = '<div class="owner-empty">Sign in to edit location, pricing, and policies.</div>';
      return;
    }
    const s = getSettings();
    list.innerHTML = `
      <form class="owner-form owner-settings-form" id="ownerSettingsForm">
        <h4>Property settings</h4>
        <div class="owner-row">
          <label>Property name <input id="settingsPropertyName" type="text" value="${escapeHtml(s.name)}" /></label>
          <label>Guest capacity <input id="settingsGuestCapacity" type="number" min="1" max="20" value="${escapeHtml(String(s.guestCapacity || 9))}" /></label>
        </div>
        <div class="owner-row">
          <label>Hero eyebrow <input id="settingsHeroEyebrow" type="text" value="${escapeHtml(s.heroEyebrow || '')}" /></label>
          <label>Host name <input id="settingsHostName" type="text" value="${escapeHtml(s.hostName || 'Donnie')}" /></label>
        </div>
        <label>Hero title <input id="settingsHeroTitle" type="text" value="${escapeHtml(s.heroTitle || '')}" /></label>
        <label>Hero subtitle <textarea id="settingsHeroSubtitle">${escapeHtml(s.heroSubtitle || '')}</textarea></label>
        <div class="owner-row">
          <label>Exact location <input id="settingsArea" type="text" value="${escapeHtml(s.area)}" /></label>
          <label>Building / unit detail <input id="settingsBuilding" type="text" value="${escapeHtml(s.building)}" /></label>
        </div>
        <div class="owner-row">
          <label>Check-in <input id="settingsCheckIn" type="text" value="${escapeHtml(s.checkIn)}" /></label>
          <label>Check-out <input id="settingsCheckOut" type="text" value="${escapeHtml(s.checkOut)}" /></label>
        </div>
        <label>Security deposit <input id="settingsSecurityDeposit" type="text" value="${escapeHtml(s.securityDeposit)}" /></label>
        <label>Parking note <textarea id="settingsParking">${escapeHtml(s.parking)}</textarea></label>
        <div class="owner-row">
          <label>Car parking rate <input id="settingsCarRate" type="text" value="${escapeHtml(s.parkingRates.car)}" /></label>
          <label>Motorcycle parking rate <input id="settingsMotorRate" type="text" value="${escapeHtml(s.parkingRates.motorcycle)}" /></label>
        </div>
        <label>Nearby places <textarea id="settingsNearby">${escapeHtml(listToTextarea(s.nearby))}</textarea></label>
        <label>Pricing guide <textarea id="settingsPricing">${escapeHtml(listToTextarea(s.pricing))}</textarea></label>
        <label>Booking requirements <textarea id="settingsBookingRequirements">${escapeHtml(listToTextarea(s.bookingRequirements))}</textarea></label>
        <label>Self check-in steps <textarea id="settingsSelfCheckIn">${escapeHtml(listToTextarea(s.selfCheckIn))}</textarea></label>
        <label>Checkout reminders <textarea id="settingsCheckout">${escapeHtml(listToTextarea(s.checkout))}</textarea></label>
        <label>House rules <textarea id="settingsHouseRules">${escapeHtml(listToTextarea(s.houseRules))}</textarea></label>
        <label>Google Maps URL <input id="settingsGoogleMapsUrl" type="text" value="${escapeHtml(s.googleMapsUrl || CONFIG.googleMapsUrl)}" /></label>
        <label>Waze URL <input id="settingsWazeUrl" type="text" value="${escapeHtml(s.wazeUrl || CONFIG.wazeUrl)}" /></label>
        <div class="owner-actions-row">
          <button class="btn btn-primary owner-sm" type="submit">Save settings</button>
          <button class="btn btn-secondary owner-sm" type="button" id="ownerSettingsReset">Reset defaults</button>
          <button class="btn btn-secondary owner-sm" type="button" id="ownerSettingsExport">Export JSON</button>
          <button class="btn btn-secondary owner-sm" type="button" id="ownerSettingsImportBtn">Import JSON</button>
          <input type="file" id="ownerSettingsImport" accept="application/json" hidden />
        </div>
        <p class="muted">Changes are saved in this browser and can be exported as JSON for backup or handover.</p>
      </form>
    `;

    $('#ownerSettingsForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const next = normalizeSettings({
        propertyName: $('#settingsPropertyName')?.value,
        guestCapacity: $('#settingsGuestCapacity')?.value,
        heroEyebrow: $('#settingsHeroEyebrow')?.value,
        hostName: $('#settingsHostName')?.value,
        heroTitle: $('#settingsHeroTitle')?.value,
        heroSubtitle: $('#settingsHeroSubtitle')?.value,
        area: $('#settingsArea')?.value,
        building: $('#settingsBuilding')?.value,
        checkIn: $('#settingsCheckIn')?.value,
        checkOut: $('#settingsCheckOut')?.value,
        securityDeposit: $('#settingsSecurityDeposit')?.value,
        parking: $('#settingsParking')?.value,
        parkingRates: { car: $('#settingsCarRate')?.value, motorcycle: $('#settingsMotorRate')?.value },
        nearby: $('#settingsNearby')?.value,
        pricing: $('#settingsPricing')?.value,
        bookingRequirements: $('#settingsBookingRequirements')?.value,
        selfCheckIn: $('#settingsSelfCheckIn')?.value,
        checkout: $('#settingsCheckout')?.value,
        houseRules: $('#settingsHouseRules')?.value,
        googleMapsUrl: $('#settingsGoogleMapsUrl')?.value,
        wazeUrl: $('#settingsWazeUrl')?.value,
      });
      state.settings = next;
      persistSettings();
      applySettingsToPublicUI();
      renderGuide();
      renderOwnerSettings();
      renderAmenities();
      renderOwnerAmenities();
      renderGallery();
      renderVideos();
    });

    $('#ownerSettingsReset')?.addEventListener('click', () => {
      if (!window.confirm('Reset all property settings to the default manual values?')) return;
      state.settings = clone(PROPERTY);
      persistSettings();
      applySettingsToPublicUI();
      renderGuide();
      renderOwnerSettings();
      renderAmenities();
      renderOwnerAmenities();
    });

    $('#ownerSettingsExport')?.addEventListener('click', () => {
      const payload = {
        settings: getSettings(),
        amenities: state.amenities,
        media: state.media,
        comments: state.comments,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'site-content.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    });

    $('#ownerSettingsImportBtn')?.addEventListener('click', () => $('#ownerSettingsImport')?.click());
    $('#ownerSettingsImport')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          if (parsed.settings) state.settings = normalizeSettings(parsed.settings);
          else state.settings = normalizeSettings(parsed);
          if (Array.isArray(parsed.amenities)) state.amenities = parsed.amenities;
          if (Array.isArray(parsed.media)) state.media = parsed.media;
          if (Array.isArray(parsed.comments)) state.comments = parsed.comments;
          persistSettings();
          persistAmenities();
          persistMedia();
          persistComments();
          applySettingsToPublicUI();
          renderGuide();
          renderOwnerSettings();
          renderAmenities();
          renderOwnerAmenities();
          renderGallery();
          renderVideos();
          renderComments();
          alert('Import complete.');
        }
      } catch (err) {
        alert('Could not import JSON file.');
      } finally {
        e.target.value = '';
      }
    });
  }

  function getVisiblePhotos() {
    return state.media.filter((item) => item.type === 'image' && !item.hidden);
  }

  function getVisibleVideos() {
    return state.media.filter((item) => item.type === 'video' && !item.hidden);
  }

  function getVisibleComments() {
    return state.comments
      .filter((item) => !item.hidden)
      .slice()
      .sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.ts || 0) - Number(a.ts || 0));
  }

  function getVisibleAmenities() {
    return state.amenities
      .filter((item) => !item.hidden)
      .slice()
      .sort((a, b) => Number(b.featured) - Number(a.featured) || String(a.category || '').localeCompare(String(b.category || '')) || String(a.title || '').localeCompare(String(b.title || '')));
  }

  function amenityIconMarkup(key) {
    return ICONS[key] || ICONS.default;
  }

  function featuredImageItems() {
    const visible = getVisiblePhotos();
    const featured = visible.find((item) => item.featured) || visible[0] || null;
    const rest = visible.filter((item) => !featured || item.id !== featured.id);
    return { featured, rest };
  }

  function renderGallery() {
    const grid = $('#galleryGrid');
    if (!grid) return;
    const { featured, rest } = featuredImageItems();
    const slots = [
      { item: featured || rest[0], cls: 'gallery-item gallery-feature' },
      { item: rest[0], cls: 'gallery-item gallery-top-left' },
      { item: rest[1], cls: 'gallery-item gallery-top-right' },
      { item: rest[2], cls: 'gallery-item gallery-bottom-left' },
      { item: rest[3], cls: 'gallery-item gallery-bottom-right' },
    ].filter((slot) => slot.item);

    if (!slots.length) {
      grid.innerHTML = '<div class="empty-state">No photos available yet.</div>';
      return;
    }

    grid.innerHTML = slots.map((slot) => {
      const item = slot.item;
      return `
        <button class="${slot.cls}" data-index="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(item.label || item.alt || 'gallery image')}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.label || 'Gallery image')}" loading="lazy" />
        </button>
      `;
    }).join('');
  }

  function renderVideos() {
    const grid = $('#videoGrid');
    if (!grid) return;
    const videos = getVisibleVideos();
    if (!videos.length) {
      grid.innerHTML = '<div class="empty-state">No videos available yet.</div>';
      return;
    }

    grid.innerHTML = videos.slice(0, 2).map((item) => `
      <figure class="video-card">
        <video controls playsinline preload="metadata" poster="${escapeHtml(item.poster || './assets/9.jpg')}">
          <source src="${escapeHtml(item.src)}" type="video/mp4" />
          Your browser does not support this video.
        </video>
        <figcaption>${escapeHtml(item.label || item.alt || 'Video tour')}</figcaption>
      </figure>
    `).join('');
  }

  function renderAmenities() {
    const preview = $('#amenityPreview');
    const modalList = $('#amenitiesModalList');
    if (!preview && !modalList) return;
    const amenities = getVisibleAmenities();
    if (!amenities.length) {
      if (preview) preview.innerHTML = '<div class="empty-state">No amenities are visible right now.</div>';
      if (modalList) modalList.innerHTML = '<div class="empty-state">No amenities are visible right now.</div>';
      return;
    }

    const preferred = amenities.filter((item) => !/wifi|wi-fi|self check|check-in/i.test(String(item.title || '')));
    const previewItems = (preferred.length >= 4 ? preferred : amenities).slice(0, 4);
    const cardMarkup = (item, cls = 'amenity-card') => `
      <article class="${cls}">
        <div class="amenity-icon" aria-hidden="true">${amenityIconMarkup(item.icon)}</div>
        <div class="amenity-copy">
          <span class="amenity-tag">${escapeHtml(item.category || 'Amenity')}</span>
          <h3>${escapeHtml(item.title || 'Amenity')}</h3>
          <p>${escapeHtml(item.description || '')}</p>
        </div>
      </article>
    `;

    if (preview) preview.innerHTML = previewItems.map((item) => cardMarkup(item, 'amenity-card amenity-preview-card')).join('');
    if (modalList) modalList.innerHTML = amenities.map((item) => cardMarkup(item, 'amenity-card amenity-modal-card')).join('');
  }

  function openAmenitiesModal() {
    const modal = $('#amenitiesModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeAmenitiesModal() {
    const modal = $('#amenitiesModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openLightbox(id) {
    const photos = getVisiblePhotos();
    const index = photos.findIndex((item) => item.id === id);
    if (index === -1) return;
    state.galleryIndex = index;
    const lb = $('#lightbox');
    const img = $('#lightboxImg');
    const item = photos[state.galleryIndex];
    if (!lb || !img || !item) return;
    img.src = item.src;
    img.alt = item.alt;
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    const lb = $('#lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }

  function stepLightbox(delta) {
    const photos = getVisiblePhotos();
    if (!photos.length) return;
    state.galleryIndex = (state.galleryIndex + delta + photos.length) % photos.length;
    const item = photos[state.galleryIndex];
    const img = $('#lightboxImg');
    if (!item || !img) return;
    img.src = item.src;
    img.alt = item.alt;
  }

  function renderComments() {
    const list = $('#commentList');
    if (!list) return;
    const comments = getVisibleComments();
    list.innerHTML = comments.map((c) => `
      <article class="comment-card">
        <div class="comment-top">
          <div>
            <strong>${escapeHtml(c.name || 'Guest')}</strong>
            <span>${escapeHtml(c.stayType || 'Guest')}</span>
          </div>
          <div class="comment-stars">${'★'.repeat(Number(c.rating || 5))}${'☆'.repeat(5 - Number(c.rating || 5))}</div>
        </div>
        <p style="margin:0; color: var(--muted); line-height:1.7;">${escapeHtml(c.text || '')}</p>
      </article>
    `).join('');
  }

  function pushChat(role, text) {
    const log = $('#chatLog');
    if (!log) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.textContent = text;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  function localConciergeAnswer(question) {
    const settings = getSettings();
    const amenities = getVisibleAmenities();
    const q = String(question || '').toLowerCase();
    if (/location|where|address|map|quezon|pasig|ortigas/.test(q)) return `${settings.area}. ${settings.building}. Nearby places include ${settings.nearby.join(', ')}.`;
    if (/parking/.test(q)) return `${settings.parking} Parking rates are Car ${settings.parkingRates.car} and Motorcycle ${settings.parkingRates.motorcycle}.`;
    if (/price|rate|cost|pricing/.test(q)) return `The listed prices are ${settings.pricing.join('; ')}.`;
    if (/guest|how many|capacity|sleep/.test(q)) return `The unit is set up for ${settings.capacity}.`;
    if (/check.?in|self check|arrival/.test(q)) return `Self check-in starts at ${settings.checkIn}. Tap card and lockbox steps are in the guide section.`;
    if (/checkout|check.?out|leave|departure/.test(q)) return `Checkout is at ${settings.checkOut}. Return the tap card and key, turn off appliances, and dispose of trash.`;
    if (/rule|smok|noise|visitor|pool/.test(q)) return `House rules include ${settings.houseRules.join(', ')}.`;
    if (/require|id|deposit|reservation/.test(q)) return `Booking requirements include ${settings.bookingRequirements.join(', ')}.`;
    if (/amenit|include|what is inside|included/.test(q)) return `Highlighted amenities include ${amenities.slice(0, 10).map((item) => item.title).join(', ')}.`;
    return `I can answer about the location, parking, booking requirements, pricing, check-in, checkout, house rules, or amenities using the property details on the page.`;
  }

  async function sendChat() {
    const input = $('#chatInput');
    const text = String(input?.value || '').trim();
    if (!text) return;
    if (input) input.value = '';
    pushChat('user', text);
    pushChat('bot', 'Thinking...');

    const log = $('#chatLog');
    const thinking = log ? log.lastElementChild : null;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, property: currentPropertySnapshot() }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = String(data.reply || '').trim() || localConciergeAnswer(text);
      if (thinking) thinking.textContent = reply;
      else pushChat('bot', reply);
    } catch (_) {
      if (thinking) thinking.textContent = localConciergeAnswer(text);
      else pushChat('bot', localConciergeAnswer(text));
    }
  }

  async function submitBooking(e) {
    e.preventDefault();
    const payload = {
      guestName: String($('#guestName')?.value || '').trim(),
      guestEmail: String($('#guestEmail')?.value || '').trim(),
      guestPhone: String($('#guestPhone')?.value || '').trim(),
      checkin: String($('#checkin')?.value || '').trim(),
      checkout: String($('#checkout')?.value || '').trim(),
      guests: String($('#guests')?.value || '').trim(),
      note: String($('#guestNote')?.value || '').trim(),
    };

    const btn = $('#reserveBtn');
    if (!payload.guestName || !payload.guestEmail || !payload.checkin || !payload.checkout || !payload.guests) {
      alert('Please complete name, email, dates, and guest count.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Checking...';
    }

    try {
      const res = await fetch(CONFIG.bookingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send booking inquiry');
      alert('Your request has been sent to the host.');
    } catch (err) {
      alert(`${err.message}

If you are testing locally, make sure the /api/book route is available and SMTP variables are set on deployment.`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Check availability';
      }
    }
  }

  function setupMap() {
    const settings = getSettings();
    const google = $('#googleMapsBtn');
    const waze = $('#wazeBtn');
    if (google) google.href = settings.googleMapsUrl || CONFIG.googleMapsUrl;
    if (waze) waze.href = settings.wazeUrl || CONFIG.wazeUrl;
  }

  function setupRevealObserver() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  function openOwnerLogin() {
    const modal = $('#ownerLoginModal');
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => $('#ownerPassword')?.focus(), 50);
  }

  function closeOwnerLogin() {
    const modal = $('#ownerLoginModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    const form = $('#ownerLoginForm');
    if (form) form.reset();
  }

  function ensureOwnerSectionVisible() {
    const panel = $('#ownerPanel');
    if (panel) panel.classList.toggle('hidden', !state.admin);
  }

  async function syncAdminStatus() {
    try {
      const res = await fetch(CONFIG.adminStatusEndpoint, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      state.admin = !!data.loggedIn;
    } catch (_) {
      state.admin = false;
    }
    ensureOwnerSectionVisible();
    renderOwnerSettings();
    renderOwnerComments();
    renderOwnerMedia();
    renderOwnerAmenities();
  }

  async function loginOwner(e) {
    e.preventDefault();
    const password = String($('#ownerPassword')?.value || '').trim();
    if (!password) return;
    const btn = $('#ownerLoginSubmit');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in...';
    }
    try {
      const res = await fetch(CONFIG.adminLoginEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed');
      state.admin = true;
      ensureOwnerSectionVisible();
      renderOwnerSettings();
      renderOwnerComments();
      renderOwnerMedia();
      renderOwnerAmenities();
      closeOwnerLogin();
    } catch (err) {
      alert(err.message || 'Owner login failed');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    }
  }

  async function logoutOwner() {
    try {
      await fetch(CONFIG.adminLogoutEndpoint, { method: 'POST', credentials: 'include' });
    } catch (_) {}
    state.admin = false;
    ensureOwnerSectionVisible();
    renderOwnerSettings();
    renderOwnerComments();
    renderOwnerMedia();
    renderOwnerAmenities();
  }

  function reviewEditorDefaults(comment) {
    return {
      name: comment?.name || '',
      rating: String(comment?.rating || 5),
      stayType: comment?.stayType || 'Guest',
      text: comment?.text || '',
    };
  }

  function addOrEditComment(commentId = null) {
    const comment = commentId ? state.comments.find((item) => item.id === commentId) : null;
    const existing = reviewEditorDefaults(comment);
    const name = String(window.prompt('Guest name:', existing.name) || '').trim();
    if (!name) return;
    const rating = Number(window.prompt('Rating from 1 to 5:', existing.rating) || existing.rating || 5);
    const stayType = String(window.prompt('Stay type (example: Family trip):', existing.stayType) || '').trim() || 'Guest';
    const text = String(window.prompt('Review comment:', existing.text) || '').trim();
    if (!text) return;

    if (comment) {
      comment.name = name;
      comment.rating = Math.max(1, Math.min(5, Number.isFinite(rating) ? rating : 5));
      comment.stayType = stayType;
      comment.text = text;
      comment.source = comment.source || 'admin';
    } else {
      state.comments.unshift({
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        rating: Math.max(1, Math.min(5, Number.isFinite(rating) ? rating : 5)),
        stayType,
        text,
        ts: Date.now(),
        featured: false,
        hidden: false,
        source: 'admin',
      });
    }
    persistComments();
    renderComments();
    renderOwnerComments();
  }

  function deleteComment(id) {
    const item = state.comments.find((comment) => comment.id === id);
    if (!item) return;
    if (!window.confirm(`Delete review from ${item.name}?`)) return;
    state.comments = state.comments.filter((comment) => comment.id !== id);
    persistComments();
    renderComments();
    renderOwnerComments();
  }

  function toggleCommentFeature(id) {
    state.comments = state.comments.map((comment) => ({ ...comment, featured: comment.id === id }));
    persistComments();
    renderComments();
    renderOwnerComments();
  }

  function toggleCommentHidden(id) {
    const item = state.comments.find((comment) => comment.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    persistComments();
    renderComments();
    renderOwnerComments();
  }

  function renderOwnerComments() {
    const list = $('#ownerReviewList');
    if (!list) return;
    if (!state.admin) {
      list.innerHTML = '<div class="owner-empty">Sign in to manage guest comments.</div>';
      return;
    }

    const comments = state.comments.slice().sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
    list.innerHTML = `
      <form class="owner-form" id="ownerReviewForm">
        <h4>Add a review</h4>
        <label>Guest name <input id="ownerCommentName" type="text" placeholder="Guest name" /></label>
        <div class="owner-row">
          <label>Rating
            <select id="ownerCommentRating">
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </label>
          <label>Stay type <input id="ownerCommentStayType" type="text" placeholder="Family trip" /></label>
        </div>
        <label>Comment <textarea id="ownerCommentText" placeholder="What should future guests see?"></textarea></label>
        <button class="btn btn-primary full" type="submit">Add review</button>
      </form>

      <div class="owner-list">
        ${comments.map((comment) => `
          <article class="owner-item ${comment.hidden ? 'is-hidden' : ''} ${comment.featured ? 'is-featured' : ''}">
            <div class="owner-item-head">
              <div>
                <strong>${escapeHtml(comment.name || 'Guest')}</strong>
                <span>${escapeHtml(comment.stayType || 'Guest')}</span>
              </div>
              <div class="comment-stars">${'★'.repeat(Number(comment.rating || 5))}${'☆'.repeat(5 - Number(comment.rating || 5))}</div>
            </div>
            <p>${escapeHtml(comment.text || '')}</p>
            <div class="owner-actions-row">
              <button class="btn btn-secondary owner-sm" data-act="edit-comment" data-id="${escapeHtml(comment.id)}">Edit</button>
              <button class="btn btn-secondary owner-sm" data-act="toggle-comment" data-id="${escapeHtml(comment.id)}">${comment.hidden ? 'Restore' : 'Hide'}</button>
              <button class="btn btn-secondary owner-sm" data-act="feature-comment" data-id="${escapeHtml(comment.id)}">Feature</button>
              <button class="btn btn-secondary owner-sm danger" data-act="delete-comment" data-id="${escapeHtml(comment.id)}">Delete</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    $('#ownerReviewForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String($('#ownerCommentName')?.value || '').trim();
      const rating = Number($('#ownerCommentRating')?.value || 5);
      const stayType = String($('#ownerCommentStayType')?.value || '').trim() || 'Guest';
      const text = String($('#ownerCommentText')?.value || '').trim();
      if (!name || !text) return;
      state.comments.unshift({
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        rating: Math.max(1, Math.min(5, Number.isFinite(rating) ? rating : 5)),
        stayType,
        text,
        ts: Date.now(),
        featured: false,
        hidden: false,
        source: 'admin',
      });
      persistComments();
      renderComments();
      renderOwnerComments();
    });

    $$('#ownerReviewList [data-act]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const act = button.dataset.act;
        if (act === 'edit-comment') addOrEditComment(id);
        if (act === 'toggle-comment') toggleCommentHidden(id);
        if (act === 'feature-comment') toggleCommentFeature(id);
        if (act === 'delete-comment') deleteComment(id);
      });
    });
  }

  function renderOwnerMedia() {
    const list = $('#ownerMediaList');
    if (!list) return;
    if (!state.admin) {
      list.innerHTML = '<div class="owner-empty">Sign in to upload or remove photos and videos.</div>';
      return;
    }

    const items = state.media.slice();
    list.innerHTML = `
      <form class="owner-form" id="ownerMediaForm">
        <h4>Add media</h4>
        <div class="owner-row">
          <label>Type
            <select id="ownerMediaType">
              <option value="image">Photo</option>
              <option value="video">Video</option>
            </select>
          </label>
          <label>Label <input id="ownerMediaLabel" type="text" placeholder="Living room" /></label>
        </div>
        <label>File <input id="ownerMediaFile" type="file" accept="image/*,video/*" /></label>
        <label>Poster image (for videos) <input id="ownerMediaPoster" type="text" placeholder="Optional poster URL or leave blank" /></label>
        <button class="btn btn-primary full" type="submit">Upload media</button>
        <p class="muted">Large videos should be compressed before uploading.</p>
      </form>

      <div class="owner-list media-list">
        ${items.map((item) => `
          <article class="owner-item ${item.hidden ? 'is-hidden' : ''} ${item.featured ? 'is-featured' : ''}">
            <div class="owner-item-head">
              <div>
                <strong>${escapeHtml(item.label || item.alt || 'Media')}</strong>
                <span>${escapeHtml(item.type === 'video' ? 'Video' : 'Photo')}</span>
              </div>
              <span class="owner-pill">${item.featured ? 'Featured' : 'Normal'}</span>
            </div>
            <p class="owner-meta">${escapeHtml(item.src)}</p>
            <div class="owner-actions-row">
              <button class="btn btn-secondary owner-sm" data-act="feature-media" data-id="${escapeHtml(item.id)}">Feature</button>
              <button class="btn btn-secondary owner-sm" data-act="toggle-media" data-id="${escapeHtml(item.id)}">${item.hidden ? 'Restore' : 'Hide'}</button>
              <button class="btn btn-secondary owner-sm danger" data-act="delete-media" data-id="${escapeHtml(item.id)}">Delete</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    $('#ownerMediaForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = String($('#ownerMediaType')?.value || 'image');
      const fileInput = $('#ownerMediaFile');
      const label = String($('#ownerMediaLabel')?.value || '').trim();
      const poster = String($('#ownerMediaPoster')?.value || '').trim();
      const file = fileInput?.files?.[0];
      if (!file) {
        alert('Choose a photo or video file first.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        const go = window.confirm('This file is larger than 10 MB. It may be slow in the browser. Continue?');
        if (!go) return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const item = {
        id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: type === 'video' ? 'video' : 'image',
        src: dataUrl,
        poster: type === 'video' ? (poster || './assets/9.jpg') : undefined,
        alt: label || file.name,
        label: label || file.name,
        featured: false,
        hidden: false,
      };
      if (item.type === 'image') delete item.poster;
      state.media.unshift(item);
      persistMedia();
      renderGallery();
      renderVideos();
      renderOwnerMedia();
      fileInput.value = '';
      $('#ownerMediaLabel').value = '';
      $('#ownerMediaPoster').value = '';
    });

    $$('#ownerMediaList [data-act]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const act = button.dataset.act;
        if (act === 'feature-media') featureMedia(id);
        if (act === 'toggle-media') toggleMediaHidden(id);
        if (act === 'delete-media') deleteMedia(id);
      });
    });
  }

  function renderOwnerAmenities() {
    const list = $('#ownerAmenityList');
    if (!list) return;
    if (!state.admin) {
      list.innerHTML = '<div class="owner-empty">Sign in to add or remove amenities.</div>';
      return;
    }

    const items = state.amenities.slice().sort((a, b) => Number(b.featured) - Number(a.featured) || String(a.title || '').localeCompare(String(b.title || '')));
    const editing = state.editingAmenityId ? state.amenities.find((item) => item.id === state.editingAmenityId) : null;

    list.innerHTML = `
      <form class="owner-form" id="ownerAmenityForm">
        <h4>${editing ? 'Edit amenity' : 'Add amenity'}</h4>
        <div class="owner-row">
          <label>Title <input id="ownerAmenityTitle" type="text" placeholder="Fast Wi-Fi" value="${escapeHtml(editing?.title || '')}" /></label>
          <label>Category
            <select id="ownerAmenityCategory">
              <option value="In unit" ${editing?.category === 'In unit' ? 'selected' : ''}>In unit</option>
              <option value="Building" ${editing?.category === 'Building' ? 'selected' : ''}>Building</option>
              <option value="Access" ${editing?.category === 'Access' ? 'selected' : ''}>Access</option>
              <option value="Other" ${editing?.category === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </label>
        </div>
        <label>Icon
          <select id="ownerAmenityIcon">
            ${ICON_OPTIONS.map((key) => `<option value="${key}" ${editing?.icon === key ? 'selected' : ''}>${key}</option>`).join('')}
          </select>
        </label>
        <label>Description <textarea id="ownerAmenityDescription" placeholder="Describe the amenity">${escapeHtml(editing?.description || '')}</textarea></label>
        <div class="owner-actions-row">
          <button class="btn btn-primary owner-sm" type="submit">${editing ? 'Update amenity' : 'Add amenity'}</button>
          <button class="btn btn-secondary owner-sm" type="button" id="ownerAmenityCancel">Clear</button>
        </div>
      </form>

      <div class="owner-list">
        ${items.map((item) => `
          <article class="owner-item ${item.hidden ? 'is-hidden' : ''} ${item.featured ? 'is-featured' : ''}">
            <div class="owner-item-head">
              <div>
                <strong>${escapeHtml(item.title || 'Amenity')}</strong>
                <span>${escapeHtml(item.category || 'Amenity')}</span>
              </div>
              <span class="owner-pill">${escapeHtml(item.icon || 'default')}</span>
            </div>
            <p>${escapeHtml(item.description || '')}</p>
            <div class="owner-actions-row">
              <button class="btn btn-secondary owner-sm" data-act="edit-amenity" data-id="${escapeHtml(item.id)}">Edit</button>
              <button class="btn btn-secondary owner-sm" data-act="toggle-amenity" data-id="${escapeHtml(item.id)}">${item.hidden ? 'Restore' : 'Hide'}</button>
              <button class="btn btn-secondary owner-sm danger" data-act="delete-amenity" data-id="${escapeHtml(item.id)}">Delete</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    $('#ownerAmenityCancel')?.addEventListener('click', () => {
      state.editingAmenityId = null;
      renderOwnerAmenities();
    });

    $('#ownerAmenityForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = String($('#ownerAmenityTitle')?.value || '').trim();
      const category = String($('#ownerAmenityCategory')?.value || '').trim();
      const icon = String($('#ownerAmenityIcon')?.value || 'default').trim();
      const description = String($('#ownerAmenityDescription')?.value || '').trim();
      if (!title || !description) {
        alert('Please enter an amenity title and description.');
        return;
      }

      if (state.editingAmenityId) {
        const item = state.amenities.find((a) => a.id === state.editingAmenityId);
        if (item) {
          item.title = title;
          item.category = category || 'Other';
          item.icon = icon || 'default';
          item.description = description;
        }
      } else {
        state.amenities.unshift({
          id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          category: category || 'Other',
          icon: icon || 'default',
          description,
          hidden: false,
          featured: false,
        });
      }
      state.editingAmenityId = null;
      persistAmenities();
      renderAmenities();
      renderOwnerAmenities();
    });

    $$('#ownerAmenityList [data-act]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const act = button.dataset.act;
        if (act === 'edit-amenity') {
          state.editingAmenityId = id;
          renderOwnerAmenities();
        }
        if (act === 'toggle-amenity') toggleAmenityHidden(id);
        if (act === 'delete-amenity') deleteAmenity(id);
      });
    });
  }

  function featureMedia(id) {
    state.media = state.media.map((item) => ({ ...item, featured: item.id === id }));
    persistMedia();
    renderGallery();
    renderVideos();
    renderOwnerMedia();
  }

  function toggleMediaHidden(id) {
    const item = state.media.find((media) => media.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    persistMedia();
    renderGallery();
    renderVideos();
    renderOwnerMedia();
  }

  function deleteMedia(id) {
    const item = state.media.find((media) => media.id === id);
    if (!item) return;
    if (!window.confirm(`Delete ${item.label || item.alt || 'this media item'}?`)) return;
    state.media = state.media.filter((media) => media.id !== id);
    persistMedia();
    renderGallery();
    renderVideos();
    renderOwnerMedia();
  }

  function toggleAmenityHidden(id) {
    const item = state.amenities.find((amenity) => amenity.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    persistAmenities();
    renderAmenities();
    renderOwnerAmenities();
  }

  function deleteAmenity(id) {
    const item = state.amenities.find((amenity) => amenity.id === id);
    if (!item) return;
    if (!window.confirm(`Delete amenity "${item.title || 'Amenity'}"?`)) return;
    state.amenities = state.amenities.filter((amenity) => amenity.id !== id);
    persistAmenities();
    renderAmenities();
    renderOwnerAmenities();
  }

  function bindPublicEvents() {
    $('#sendChat')?.addEventListener('click', sendChat);
    $('#chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });

    $('#reserveBtn')?.addEventListener('click', submitBooking);

    $('#commentForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = String($('#commentName')?.value || '').trim();
      const rating = Number($('#commentRating')?.value || 5);
      const stayType = String($('#commentStayType')?.value || '').trim();
      const text = String($('#commentText')?.value || '').trim();
      if (!name || !text) return;
      state.comments.unshift({
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        rating: Number.isFinite(rating) ? rating : 5,
        stayType: stayType || 'Guest',
        text,
        ts: Date.now(),
        featured: false,
        hidden: false,
        source: 'guest',
      });
      state.comments = state.comments.slice(0, 40);
      persistComments();
      renderComments();
      renderOwnerComments();
      e.target.reset();
    });

    $('#openAllPhotos')?.addEventListener('click', () => {
      const first = getVisiblePhotos()[0];
      if (first) openLightbox(first.id);
    });

    $('#openAmenities')?.addEventListener('click', openAmenitiesModal);
    $('#closeAmenities')?.addEventListener('click', closeAmenitiesModal);
    $('#amenitiesModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'amenitiesModal') closeAmenitiesModal();
    });

    $('#galleryGrid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.gallery-item');
      if (!btn) return;
      openLightbox(btn.dataset.index);
    });

    $('#closeLightbox')?.addEventListener('click', closeLightbox);
    $('#lightbox')?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
    $('#prevPhoto')?.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(-1); });
    $('#nextPhoto')?.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(1); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if ($('.lightbox.open')) closeLightbox();
        if ($('.site-modal.open')) closeAmenitiesModal();
      }
      if (!$('.lightbox.open')) return;
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });
  }

  function bindOwnerEvents() {
    let footerClicks = 0;
    $('#footerCopyright')?.addEventListener('click', () => {
      footerClicks += 1;
      if (footerClicks >= 5) {
        footerClicks = 0;
        openOwnerLogin();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        openOwnerLogin();
      }
    });

    $('#closeOwnerModal')?.addEventListener('click', closeOwnerLogin);
    $('#ownerLoginModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'ownerLoginModal') closeOwnerLogin();
    });
    $('#ownerLoginForm')?.addEventListener('submit', loginOwner);
    $('#ownerLogoutBtn')?.addEventListener('click', logoutOwner);
  }

  function renderInitialState() {
    state.settings = normalizeSettings(state.settings);
    applySettingsToPublicUI();
    renderGuide();
    renderGallery();
    renderVideos();
    renderAmenities();
    renderComments();
    setupMap();
    setupRevealObserver();
    bindPublicEvents();
    bindOwnerEvents();
    ensureOwnerSectionVisible();
    syncAdminStatus();
  }

  document.addEventListener('DOMContentLoaded', renderInitialState);
})();
