import {
  STORAGE_KEYS,
  DEFAULT_BOOKINGS,
  DEFAULT_INQUIRIES,
  DEFAULT_PRICING,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_LUNA,
  DEFAULT_PROPERTY,
  clone,
  ensureSeededDefaults,
  escapeHtml,
  formatDate,
  formatDateTime,
  formatMoney,
  getAmenities,
  getBookings,
  getBlockedDates,
  getComments,
  getInquiries,
  getLunaConfig,
  getMedia,
  getPricingConfig,
  getSettings,
  getSiteSettings,
  nightsBetween,
  parseMoney,
  setAmenities,
  setBookings,
  setBlockedDates,
  setComments,
  setInquiries,
  setLunaConfig,
  setMedia,
  setPricingConfig,
  setSettings,
  setSiteSettings,
  storageSnapshot,
  estimateBookingTotal,
  generateReference,
  autoThemeForTime,
  asList,
  writeJSON,
  readJSON,
} from './store.js';

const ICONS = [
  'wifi', 'tv', 'key', 'ac', 'washer', 'karaoke', 'projector', 'kitchen', 'dining', 'games',
  'basketball', 'park', 'store', 'coffee', 'security', 'closet', 'iron', 'dryer', 'shower', 'default',
];

const state = {
  selectedBooking: null,
  selectedInquiry: null,
  selectedAmenity: null,
  selectedMedia: null,
  editingGuide: false,
  monthOffset: 0,
  bookingFilter: 'all',
  bookingSearch: '',
  inquiryFilter: 'all',
  mediaFilter: 'all',
  ready: false,
};

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function el(id) { return document.getElementById(id); }
function setText(id, text) { const node = el(id); if (node) node.textContent = text; }
function safeList(value) { return asList(value || '').filter(Boolean); }
function cloneDeep(v) { return clone(v); }

function storageChangeHint() {
  // Cross-tab updates are handled by the browser's storage event.
}

function normalizedSettings() {
  const settings = getSettings();
  return {
    ...DEFAULT_PROPERTY,
    ...settings,
    capacity: settings.capacity || `Up to ${settings.guestCapacity || 9} guests`,
  };
}

function normalizedPricing() {
  return { ...DEFAULT_PRICING, ...getPricingConfig() };
}

function normalizedSiteSettings() {
  return { ...DEFAULT_SITE_SETTINGS, ...getSiteSettings() };
}

function normalizedLuna() {
  return { ...DEFAULT_LUNA, ...getLunaConfig() };
}

function normalizeBookings() {
  return (getBookings() || []).map((b) => ({
    reference: b.reference || generateReference('BK'),
    guestName: b.guestName || b.name || 'Guest',
    guestEmail: b.guestEmail || '',
    guestPhone: b.guestPhone || '',
    checkin: b.checkin || '',
    checkout: b.checkout || '',
    guests: b.guests || '',
    pets: b.pets || '—',
    totalAmount: b.totalAmount ?? null,
    status: b.status || 'Pending',
    note: b.note || '',
    createdAt: b.createdAt || Date.now(),
    source: b.source || 'web',
  }));
}

function normalizeInquiries() {
  return (getInquiries() || []).map((i) => ({
    id: i.id || generateReference('INQ'),
    name: i.name || 'Guest',
    email: i.email || '',
    phone: i.phone || '',
    message: i.message || '',
    page: i.page || 'chat',
    topic: i.topic || 'General inquiry',
    status: i.status || 'Pending',
    createdAt: i.createdAt || Date.now(),
  }));
}

function persistSnapshot() {
  setSettings(normalizedSettings());
  setPricingConfig(normalizedPricing());
  setSiteSettings(normalizedSiteSettings());
  setLunaConfig(normalizedLuna());
  renderAll();
}

async function fetchAdminStatus() {
  try {
    const res = await fetch('/api/admin-status', { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return !!data.loggedIn;
  } catch {
    return false;
  }
}

async function requireAuth() {
  const loggedIn = await fetchAdminStatus();
  if (!loggedIn) {
    window.location.replace('./login.html');
    return false;
  }
  return true;
}

async function logout() {
  await fetch('/api/admin-logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  window.location.replace('./login.html');
}

function applyTheme() {
  const site = normalizedSiteSettings();
  const theme = site.themeMode === 'auto' ? autoThemeForTime(new Date(), site) : site.themeMode || 'day';
  document.body.dataset.theme = theme;
  setText('themeStatus', `${theme === 'night' ? 'Night' : 'Day'} mode`);
}

function authPill(loggedIn) {
  const node = el('authStatus');
  if (!node) return;
  node.textContent = loggedIn ? 'Authenticated' : 'Signed out';
  node.className = loggedIn ? 'status-pill green' : 'status-pill red';
}

function renderDashboard() {
  const bookings = normalizeBookings();
  const inquiries = normalizeInquiries();
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const upcomingArrivals = bookings.filter((b) => b.checkin && b.checkin >= todayISO && b.status !== 'Canceled').sort((a, b) => String(a.checkin).localeCompare(String(b.checkin))).slice(0, 5);
  const upcomingDepartures = bookings.filter((b) => b.checkout && b.checkout >= todayISO && b.status !== 'Canceled').sort((a, b) => String(a.checkout).localeCompare(String(b.checkout))).slice(0, 5);
  const pendingInquiries = inquiries.filter((i) => i.status !== 'Resolved');

  const cards = [
    { label: 'Total bookings', value: bookings.length, sub: 'Stored booking requests and status updates.' },
    { label: 'Upcoming arrivals', value: upcomingArrivals.length, sub: upcomingArrivals[0] ? `${upcomingArrivals[0].guestName} on ${formatDate(upcomingArrivals[0].checkin)}` : 'No arrivals in view.' },
    { label: 'Upcoming departures', value: upcomingDepartures.length, sub: upcomingDepartures[0] ? `${upcomingDepartures[0].guestName} on ${formatDate(upcomingDepartures[0].checkout)}` : 'No departures in view.' },
    { label: 'Pending inquiries', value: pendingInquiries.length, sub: pendingInquiries[0] ? `${pendingInquiries[0].name} asked about ${pendingInquiries[0].topic}` : 'All inquiries resolved.' },
  ];

  const dashboardCards = el('dashboardCards');
  if (dashboardCards) {
    dashboardCards.innerHTML = cards.map((card) => `
      <article class="card">
        <div class="label">${escapeHtml(card.label)}</div>
        <strong>${escapeHtml(String(card.value))}</strong>
        <span class="sub">${escapeHtml(card.sub)}</span>
      </article>
    `).join('');
  }

  const dashboardActions = el('dashboardActions');
  if (dashboardActions) {
    dashboardActions.innerHTML = `
      <a class="btn btn-primary" href="#bookings">Bookings</a>
      <a class="btn btn-secondary" href="#availability">Calendar</a>
      <a class="btn btn-secondary" href="#gallery">Gallery</a>
      <a class="btn btn-secondary" href="#pricing">Pricing</a>
    `;
  }
}

function bookingStatusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value.includes('cancel')) return 'pill red';
  if (value.includes('confirmed') || value.includes('approved') || value.includes('paid')) return 'pill green';
  if (value.includes('pending')) return 'pill blue';
  return 'pill gray';
}

function bookingEstimate(booking) {
  if (booking.totalAmount) return Number(booking.totalAmount);
  return estimateBookingTotal(booking, normalizedPricing());
}

function renderBookings() {
  const bookings = normalizeBookings();
  const search = state.bookingSearch.trim().toLowerCase();
  const filtered = bookings.filter((b) => {
    const hay = [b.reference, b.guestName, b.guestEmail, b.guestPhone, b.checkin, b.checkout, b.status].join(' ').toLowerCase();
    const statusMatch = state.bookingFilter === 'all' || String(b.status || '').toLowerCase() === state.bookingFilter;
    return (!search || hay.includes(search)) && statusMatch;
  });

  const toolbar = el('bookingsToolbar');
  if (toolbar) {
    toolbar.innerHTML = `
      <div class="toolbar">
        <label>Search
          <input id="bookingSearch" type="search" placeholder="Search reference, name, email, or date" value="${escapeHtml(state.bookingSearch)}" />
        </label>
        <label>Status
          <select id="bookingFilter">
            <option value="all" ${state.bookingFilter === 'all' ? 'selected' : ''}>All statuses</option>
            <option value="pending" ${state.bookingFilter === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${state.bookingFilter === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="checked-in" ${state.bookingFilter === 'checked-in' ? 'selected' : ''}>Checked-in</option>
            <option value="checked-out" ${state.bookingFilter === 'checked-out' ? 'selected' : ''}>Checked-out</option>
            <option value="canceled" ${state.bookingFilter === 'canceled' ? 'selected' : ''}>Canceled</option>
          </select>
        </label>
        <label>Quick status update
          <select id="bookingBulkStatus">
            <option value="">Select...</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-in</option>
            <option value="Checked-out">Checked-out</option>
            <option value="Canceled">Canceled</option>
          </select>
        </label>
        <button class="btn btn-secondary" id="refreshBookings" type="button">Refresh</button>
      </div>
    `;
  }

  const table = el('bookingsTable');
  if (table) {
    table.innerHTML = `
      <div class="table-shell">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Guest</th>
              <th>Contact</th>
              <th>Stay</th>
              <th>Guests</th>
              <th>Pets</th>
              <th>Total amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((booking) => `
              <tr data-booking-reference="${escapeHtml(booking.reference)}">
                <td><strong>${escapeHtml(booking.reference)}</strong><div class="meta">${formatDateTime(booking.createdAt)}</div></td>
                <td><strong>${escapeHtml(booking.guestName)}</strong><div class="meta">${escapeHtml(booking.guestEmail || '—')}</div></td>
                <td>${escapeHtml(booking.guestPhone || '—')}</td>
                <td>${escapeHtml(formatDate(booking.checkin))} → ${escapeHtml(formatDate(booking.checkout))}</td>
                <td>${escapeHtml(String(booking.guests || '—'))}</td>
                <td>${escapeHtml(String(booking.pets || '—'))}</td>
                <td><strong>${escapeHtml(formatMoney(bookingEstimate(booking)))}</strong></td>
                <td><span class="${bookingStatusClass(booking.status)}">${escapeHtml(booking.status || 'Pending')}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="btn btn-secondary owner-sm" data-act="view-booking" data-id="${escapeHtml(booking.reference)}">View details</button>
                    <button class="btn btn-secondary owner-sm" data-act="status-booking" data-id="${escapeHtml(booking.reference)}">Update status</button>
                    <button class="btn btn-secondary owner-sm danger" data-act="cancel-booking" data-id="${escapeHtml(booking.reference)}">Cancel</button>
                  </div>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="9"><div class="owner-empty">No booking requests stored yet.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  const detail = el('bookingDetails');
  const selected = bookings.find((booking) => booking.reference === state.selectedBooking) || filtered[0] || bookings[0] || null;
  state.selectedBooking = selected ? selected.reference : null;
  if (detail) {
    detail.innerHTML = selected ? `
      <div class="side-panel">
        <div class="card-top">
          <div>
            <span class="pill blue">Booking detail</span>
            <h3>${escapeHtml(selected.reference)}</h3>
          </div>
          <span class="${bookingStatusClass(selected.status)}">${escapeHtml(selected.status || 'Pending')}</span>
        </div>
        <p><strong>${escapeHtml(selected.guestName)}</strong><br>${escapeHtml(selected.guestEmail || '—')}<br>${escapeHtml(selected.guestPhone || '—')}</p>
        <p><strong>Stay</strong><br>${escapeHtml(formatDate(selected.checkin))} to ${escapeHtml(formatDate(selected.checkout))}</p>
        <p><strong>Guests / Pets</strong><br>${escapeHtml(String(selected.guests || '—'))} guests · ${escapeHtml(String(selected.pets || '—'))}</p>
        <p><strong>Total amount</strong><br>${escapeHtml(formatMoney(bookingEstimate(selected)))}</p>
        <p><strong>Notes</strong><br>${escapeHtml(selected.note || '—')}</p>
        <div class="action-row">
          <button class="btn btn-primary" data-act="status-booking" data-id="${escapeHtml(selected.reference)}">Update status</button>
          <button class="btn btn-secondary" data-act="cancel-booking" data-id="${escapeHtml(selected.reference)}">Cancel booking</button>
        </div>
      </div>
    ` : '<div class="owner-empty">Select a booking to view details.</div>';
  }
}

function updateBooking(reference, updater) {
  const bookings = normalizeBookings();
  const next = bookings.map((booking) => booking.reference === reference ? updater({ ...booking }) : booking);
  setBookings(next);
  renderAll();
}

function renderAvailability() {
  const settings = normalizedSettings();
  const bookings = normalizeBookings();
  const blocked = getBlockedDates();
  const panel = el('availabilityPanel');
  const list = el('availabilityList');
  const monthDate = new Date();
  monthDate.setMonth(monthDate.getMonth() + state.monthOffset);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const inMonth = d.getMonth() === month;
    const blockedHere = blocked.includes(iso);
    const bookedHere = bookings.some((b) => b.checkin && b.checkout && iso >= b.checkin && iso <= b.checkout && b.status !== 'Canceled');
    const notes = [];
    if (blockedHere) notes.push('Blocked');
    if (bookedHere) notes.push('Reserved');
    cells.push(`
      <div class="calendar-cell ${inMonth ? '' : 'is-muted'} ${blockedHere ? 'is-blocked' : ''} ${bookedHere ? 'is-booked' : ''}">
        <div class="calendar-day">${d.getDate()}</div>
        <div class="calendar-note">${notes.join(' • ') || 'Open'}</div>
      </div>
    `);
  }

  if (panel) {
    panel.innerHTML = `
      <div class="calendar-shell">
        <div class="card-top">
          <div>
            <span class="pill blue">Current month view</span>
            <h3>${monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
          </div>
          <div class="action-row">
            <button class="btn btn-secondary" id="prevMonth" type="button">Previous</button>
            <button class="btn btn-secondary" id="nextMonth" type="button">Next</button>
          </div>
        </div>
        <div class="calendar-grid">
          ${dayNames.map((d) => `<div class="calendar-head">${d}</div>`).join('')}
          ${cells.join('')}
        </div>
        <div class="inline-form two-up">
          <label>Block date
            <input id="blockDateInput" type="date" min="${new Date().toISOString().slice(0, 10)}" />
          </label>
          <label>Quick note
            <input id="blockDateNote" type="text" placeholder="Owner block / maintenance" />
          </label>
        </div>
        <div class="action-row">
          <button class="btn btn-primary" id="blockDateBtn" type="button">Block date</button>
          <button class="btn btn-secondary" id="unblockDateBtn" type="button">Unblock selected date</button>
        </div>
      </div>
    `;
  }

  if (list) {
    list.innerHTML = `
      <div class="side-panel">
        <span class="pill green">Reserved dates</span>
        <ul class="clean-list">
          ${bookings.filter((b) => b.checkin && b.checkout && b.status !== 'Canceled').map((b) => `<li>${escapeHtml(b.reference)} · ${escapeHtml(formatDate(b.checkin))} to ${escapeHtml(formatDate(b.checkout))}</li>`).join('') || '<li>No reserved dates stored yet.</li>'}
        </ul>
        <div style="height:12px"></div>
        <span class="pill red">Blocked dates</span>
        <ul class="clean-list">
          ${blocked.map((date) => `<li>${escapeHtml(date)}</li>`).join('') || '<li>No blocked dates.</li>'}
        </ul>
      </div>
    `;
  }
}

function saveBlockedDate(date) {
  if (!date) return;
  const blocked = getBlockedDates();
  if (!blocked.includes(date)) blocked.push(date);
  blocked.sort();
  setBlockedDates(blocked);
}

function unblockBlockedDate(date) {
  if (!date) return;
  setBlockedDates(getBlockedDates().filter((item) => item !== date));
}

function renderPricing() {
  const pricing = normalizedPricing();
  const settings = normalizedSettings();
  const wrap = el('pricingFormWrap');
  const preview = el('pricingPreview');
  if (wrap) {
    wrap.innerHTML = `
      <div class="form-shell">
        <form id="pricingForm" class="rich-body">
          <div class="two-col">
            <label>Weekday rate
              <input id="weekdayRate" type="number" min="0" step="1" value="${escapeHtml(String(pricing.weekdayRate))}" />
            </label>
            <label>Weekend rate
              <input id="weekendRate" type="number" min="0" step="1" value="${escapeHtml(String(pricing.weekendRate))}" />
            </label>
          </div>
          <div class="two-col">
            <label>Extra guest fee
              <input id="extraGuestFee" type="number" min="0" step="1" value="${escapeHtml(String(pricing.extraGuestFee))}" />
            </label>
            <label>Pet fee
              <input id="petFee" type="number" min="0" step="1" value="${escapeHtml(String(pricing.petFee))}" />
            </label>
          </div>
          <label>Pricing guide notes
            <textarea id="pricingNotes" placeholder="Optional notes for the listing">${escapeHtml(settings.pricing.join('\n'))}</textarea>
          </label>
          <div class="action-row">
            <button class="btn btn-primary" type="submit">Save pricing</button>
            <button class="btn btn-secondary" type="button" id="pricingReset">Reset to defaults</button>
          </div>
        </form>
      </div>
    `;
  }

  if (preview) {
    const sample = { checkin: new Date().toISOString().slice(0, 10), checkout: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), guests: 5, pets: 1 };
    preview.innerHTML = `
      <div class="side-panel">
        <span class="pill blue">Live estimator</span>
        <h3>${formatMoney(estimateBookingTotal(sample, pricing))}</h3>
        <p>Example: 2 nights, 5 guests, 1 pet. Update the fields to see pricing change immediately.</p>
        <div class="card-grid" style="grid-template-columns:1fr 1fr; gap:10px;">
          <div class="card"><div class="label">Weekday rate</div><strong>${formatMoney(pricing.weekdayRate)}</strong></div>
          <div class="card"><div class="label">Weekend rate</div><strong>${formatMoney(pricing.weekendRate)}</strong></div>
          <div class="card"><div class="label">Extra guest fee</div><strong>${formatMoney(pricing.extraGuestFee)}</strong></div>
          <div class="card"><div class="label">Pet fee</div><strong>${formatMoney(pricing.petFee)}</strong></div>
        </div>
      </div>
    `;
  }
}

function savePricingFromForm() {
  const pricing = normalizedPricing();
  const next = {
    weekdayRate: parseMoney(el('weekdayRate')?.value || pricing.weekdayRate, pricing.weekdayRate),
    weekendRate: parseMoney(el('weekendRate')?.value || pricing.weekendRate, pricing.weekendRate),
    extraGuestFee: parseMoney(el('extraGuestFee')?.value || pricing.extraGuestFee, pricing.extraGuestFee),
    petFee: parseMoney(el('petFee')?.value || pricing.petFee, pricing.petFee),
  };
  setPricingConfig(next);

  const settings = normalizedSettings();
  const notes = asList(el('pricingNotes')?.value || settings.pricing.join('\n'));
  const merged = [
    `Weekdays (4 pax): ${formatMoney(next.weekdayRate).replace('₱', 'PHP ')} - 22 hrs`,
    `Weekends (4 pax): ${formatMoney(next.weekendRate).replace('₱', 'PHP ')} - 22 hrs (Fri-Sun)`,
    `Extra guest fee: ${formatMoney(next.extraGuestFee)} per guest`,
    `Pet fee: ${formatMoney(next.petFee)} per pet`,
    ...settings.pricing.slice(4),
  ];
  settings.pricing = merged;
  setSettings(settings);
  renderAll();
}

function resetPricingDefaults() {
  setPricingConfig(cloneDeep(DEFAULT_PRICING));
  const settings = normalizedSettings();
  settings.pricing = cloneDeep(DEFAULT_PROPERTY.pricing);
  setSettings(settings);
  renderAll();
}

function renderGallery() {
  const wrap = el('galleryManager');
  if (!wrap) return;
  const media = getMedia();
  const filter = state.mediaFilter;
  const visible = media.filter((item) => filter === 'all' ? true : item.type === filter);
  wrap.innerHTML = `
    <div class="split-layout">
      <div class="form-shell">
        <form id="mediaForm" class="rich-body">
          <div class="two-col">
            <label>Type
              <select id="mediaType">
                <option value="image">Photo</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label>Label
              <input id="mediaLabel" type="text" placeholder="Living room" />
            </label>
          </div>
          <label>File
            <input id="mediaFile" type="file" accept="image/*,video/*" />
          </label>
          <label>Poster (videos only)
            <input id="mediaPoster" type="text" placeholder="Optional poster URL" />
          </label>
          <div class="action-row">
            <button class="btn btn-primary" type="submit">Upload media</button>
            <button class="btn btn-secondary" type="button" id="mediaRefresh">Refresh</button>
          </div>
        </form>
      </div>
      <div class="list-shell">
        <div class="action-row" style="margin-bottom:12px;">
          <button class="btn btn-secondary" data-media-filter="all" type="button">All</button>
          <button class="btn btn-secondary" data-media-filter="image" type="button">Photos</button>
          <button class="btn btn-secondary" data-media-filter="video" type="button">Videos</button>
        </div>
        <div class="media-grid" id="mediaGrid">
          ${visible.map(renderMediaCard).join('') || '<div class="owner-empty">No media stored yet.</div>'}
        </div>
      </div>
    </div>
  `;
}

function renderMediaCard(item, index, list = getMedia()) {
  const order = list.findIndex((m) => m.id === item.id);
  return `
    <article class="media-card" data-media-id="${escapeHtml(item.id)}">
      <div class="card-top">
        <div>
          <span class="pill ${item.featured ? 'green' : 'gray'}">${item.featured ? 'Featured' : item.type === 'video' ? 'Video' : 'Photo'}</span>
          <h3>${escapeHtml(item.label || item.alt || 'Media')}</h3>
        </div>
        <span class="pill gray">#${order + 1}</span>
      </div>
      ${item.type === 'video' ? `
        <video controls playsinline preload="metadata" poster="${escapeHtml(item.poster || '../assets/9.jpg')}">
          <source src="${escapeHtml(item.src)}" type="video/mp4" />
        </video>` : `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.label || 'Media')}" loading="lazy" />`}
      <p class="meta">${escapeHtml(item.src)}</p>
      <div class="item-actions">
        <button class="btn btn-secondary" data-act="media-feature" data-id="${escapeHtml(item.id)}" type="button">Feature</button>
        <button class="btn btn-secondary" data-act="media-toggle" data-id="${escapeHtml(item.id)}" type="button">${item.hidden ? 'Show' : 'Hide'}</button>
        <button class="btn btn-secondary" data-act="media-up" data-id="${escapeHtml(item.id)}" type="button">Up</button>
        <button class="btn btn-secondary" data-act="media-down" data-id="${escapeHtml(item.id)}" type="button">Down</button>
        <button class="btn btn-secondary danger" data-act="media-delete" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
      </div>
    </article>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function moveItem(list, id, direction) {
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return list;
  const target = idx + direction;
  if (target < 0 || target >= list.length) return list;
  const copy = list.slice();
  const [item] = copy.splice(idx, 1);
  copy.splice(target, 0, item);
  return copy;
}

function persistMediaItemChange(itemId, updater) {
  const media = getMedia().map((item) => item.id === itemId ? updater({ ...item }) : item);
  setMedia(media);
  renderAll();
}

function renderAmenities() {
  const wrap = el('amenityFormWrap');
  const listWrap = el('amenityListWrap');
  const amenities = getAmenities().slice().sort((a, b) => Number(b.featured) - Number(a.featured) || String(a.title || '').localeCompare(String(b.title || '')));
  const editing = state.selectedAmenity ? amenities.find((item) => item.id === state.selectedAmenity) : null;
  if (wrap) {
    wrap.innerHTML = `
      <div class="form-shell">
        <form id="amenityForm" class="rich-body">
          <div class="two-col">
            <label>Title
              <input id="amenityTitle" type="text" value="${escapeHtml(editing?.title || '')}" placeholder="Fast Wi-Fi" />
            </label>
            <label>Category
              <select id="amenityCategory">
                <option value="In unit" ${editing?.category === 'In unit' ? 'selected' : ''}>In unit</option>
                <option value="Building" ${editing?.category === 'Building' ? 'selected' : ''}>Building</option>
                <option value="Access" ${editing?.category === 'Access' ? 'selected' : ''}>Access</option>
                <option value="Other" ${editing?.category === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </label>
          </div>
          <label>Icon
            <select id="amenityIcon">
              ${ICONS.map((icon) => `<option value="${icon}" ${editing?.icon === icon ? 'selected' : ''}>${icon}</option>`).join('')}
            </select>
          </label>
          <label>Description
            <textarea id="amenityDescription" placeholder="Describe the amenity">${escapeHtml(editing?.description || '')}</textarea>
          </label>
          <div class="action-row">
            <button class="btn btn-primary" type="submit">${editing ? 'Update amenity' : 'Add amenity'}</button>
            <button class="btn btn-secondary" id="amenityClear" type="button">Clear</button>
          </div>
        </form>
      </div>
    `;
  }
  if (listWrap) {
    listWrap.innerHTML = `
      <div class="list-shell">
        <div class="amenity-grid">
          ${amenities.map((item, index) => `
            <article class="amenity-card" data-amenity-id="${escapeHtml(item.id)}">
              <div class="card-top">
                <div>
                  <span class="pill ${item.hidden ? 'gray' : item.featured ? 'green' : 'blue'}">${item.featured ? 'Featured' : item.hidden ? 'Hidden' : item.category || 'Amenity'}</span>
                  <h3>${escapeHtml(item.title)}</h3>
                </div>
                <span class="pill gray">${escapeHtml(item.icon || 'default')}</span>
              </div>
              <p class="meta">${escapeHtml(item.description || '')}</p>
              <div class="item-actions">
                <button class="btn btn-secondary" data-act="amenity-edit" data-id="${escapeHtml(item.id)}" type="button">Edit</button>
                <button class="btn btn-secondary" data-act="amenity-feature" data-id="${escapeHtml(item.id)}" type="button">Feature</button>
                <button class="btn btn-secondary" data-act="amenity-toggle" data-id="${escapeHtml(item.id)}" type="button">${item.hidden ? 'Show' : 'Hide'}</button>
                <button class="btn btn-secondary" data-act="amenity-up" data-id="${escapeHtml(item.id)}" type="button">Up</button>
                <button class="btn btn-secondary" data-act="amenity-down" data-id="${escapeHtml(item.id)}" type="button">Down</button>
                <button class="btn btn-secondary danger" data-act="amenity-delete" data-id="${escapeHtml(item.id)}" type="button">Delete</button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function saveAmenityFromForm() {
  const title = String(el('amenityTitle')?.value || '').trim();
  const category = String(el('amenityCategory')?.value || 'Other').trim();
  const icon = String(el('amenityIcon')?.value || 'default').trim();
  const description = String(el('amenityDescription')?.value || '').trim();
  if (!title || !description) {
    alert('Please enter an amenity title and description.');
    return;
  }
  const amenities = getAmenities();
  if (state.selectedAmenity) {
    const next = amenities.map((item) => item.id === state.selectedAmenity ? { ...item, title, category, icon, description } : item);
    setAmenities(next);
  } else {
    setAmenities([
      { id: generateReference('AM'), title, category, icon, description, hidden: false, featured: false },
      ...amenities,
    ]);
  }
  state.selectedAmenity = null;
  renderAll();
}

function renderGuide() {
  const wrap = el('guideEditor');
  const settings = normalizedSettings();
  const luna = normalizedLuna();
  const makeTextarea = (id, label, value, help = '') => `
    <div class="guide-card">
      <div class="card-head">
        <div>
          <h3>${escapeHtml(label)}</h3>
          <p class="meta">${escapeHtml(help || 'Use line breaks or markdown links such as [text](https://example.com).')}</p>
        </div>
      </div>
      <textarea id="${id}">${escapeHtml(value || '')}</textarea>
    </div>
  `;
  if (wrap) {
    wrap.innerHTML = `
      <div class="guide-grid">
        ${makeTextarea('guideWifi', 'Wi-Fi', settings.heroSubtitle, 'Guest-facing description and connectivity context.')}
        ${makeTextarea('guideParking', 'Parking', settings.parking, 'Parking instructions and policies.')}
        ${makeTextarea('guideCheckIn', 'Check-in', settings.checkIn, 'Arrival time and self check-in notes.')}
        ${makeTextarea('guideCheckOut', 'Check-out', settings.checkOut, 'Departure time and reminders.')}
        ${makeTextarea('guideRules', 'House rules', settings.houseRules.join('\n'), 'One rule per line.')}
        ${makeTextarea('guideNearby', 'Nearby places', settings.nearby.join('\n'), 'Landmarks and recommendations.')}
        ${makeTextarea('guideEmergency', 'Emergency contacts', luna.emergencyContacts || '', 'Phones, security desk, or urgent contacts.')}
      </div>
      <div class="action-row" style="margin-top:12px;">
        <button class="btn btn-primary" id="guideSave" type="button">Save stay guide</button>
        <button class="btn btn-secondary" id="guideReset" type="button">Reset guide</button>
      </div>
    `;
  }
}

function saveGuide() {
  const settings = normalizedSettings();
  const luna = normalizedLuna();
  settings.heroSubtitle = String(el('guideWifi')?.value || settings.heroSubtitle).trim();
  settings.parking = String(el('guideParking')?.value || settings.parking).trim();
  settings.checkIn = String(el('guideCheckIn')?.value || settings.checkIn).trim();
  settings.checkOut = String(el('guideCheckOut')?.value || settings.checkOut).trim();
  settings.houseRules = safeList(el('guideRules')?.value || settings.houseRules.join('\n'));
  settings.nearby = safeList(el('guideNearby')?.value || settings.nearby.join('\n'));
  luna.description = settings.heroSubtitle;
  luna.houseRules = settings.houseRules.slice();
  luna.parking = settings.parking;
  luna.localRecommendations = settings.nearby.slice();
  luna.emergencyContacts = String(el('guideEmergency')?.value || luna.emergencyContacts || '').trim();
  setSettings(settings);
  setLunaConfig(luna);
  renderAll();
}

function resetGuide() {
  const settings = normalizedSettings();
  const luna = normalizedLuna();
  settings.heroSubtitle = DEFAULT_PROPERTY.heroSubtitle;
  settings.parking = DEFAULT_PROPERTY.parking;
  settings.checkIn = DEFAULT_PROPERTY.checkIn;
  settings.checkOut = DEFAULT_PROPERTY.checkOut;
  settings.houseRules = cloneDeep(DEFAULT_PROPERTY.houseRules);
  settings.nearby = cloneDeep(DEFAULT_PROPERTY.nearby);
  luna.description = settings.heroSubtitle;
  luna.houseRules = settings.houseRules.slice();
  luna.parking = settings.parking;
  luna.localRecommendations = settings.nearby.slice();
  setSettings(settings);
  setLunaConfig(luna);
  renderAll();
}

function renderReviews() {
  const wrap = el('reviewsManager');
  const comments = getComments().slice().sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.ts || 0) - Number(a.ts || 0));
  if (wrap) {
    wrap.innerHTML = `
      <div class="review-grid">
        ${comments.map((comment) => `
          <article class="review-card ${comment.hidden ? 'is-hidden' : ''}">
            <div class="review-head">
              <div>
                <span class="pill ${comment.featured ? 'green' : comment.hidden ? 'gray' : 'blue'}">${comment.featured ? 'Featured' : comment.hidden ? 'Hidden' : comment.source === 'guest' ? 'Guest' : 'Seed'}</span>
                <h3>${escapeHtml(comment.name || 'Guest')}</h3>
                <p class="meta">${escapeHtml(comment.stayType || 'Guest')} · ${'★'.repeat(Number(comment.rating || 5))}</p>
              </div>
              <span class="pill gray">${formatDate(comment.ts)}</span>
            </div>
            <p>${escapeHtml(comment.text || '')}</p>
            <div class="item-actions">
              <button class="btn btn-secondary" data-act="review-feature" data-id="${escapeHtml(comment.id)}" type="button">Feature</button>
              <button class="btn btn-secondary" data-act="review-toggle" data-id="${escapeHtml(comment.id)}" type="button">${comment.hidden ? 'Show' : 'Hide'}</button>
              <button class="btn btn-secondary danger" data-act="review-delete" data-id="${escapeHtml(comment.id)}" type="button">Delete</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }
}

function mutateComments(updater) {
  const next = updater(getComments().map((item) => ({ ...item })));
  setComments(next);
  renderAll();
}

function renderLuna() {
  const wrap = el('lunaEditor');
  const settings = normalizedSettings();
  const luna = normalizedLuna();
  if (wrap) {
    wrap.innerHTML = `
      <div class="split-layout">
        <div class="form-shell">
          <form id="lunaForm" class="rich-body">
            <label>Property description
              <textarea id="lunaDescription">${escapeHtml(luna.description || settings.heroSubtitle || '')}</textarea>
            </label>
            <label>FAQs (one per line: question|answer)
              <textarea id="lunaFaqs">${escapeHtml((luna.faqs || []).map((item) => `${item.question} | ${item.answer}`).join('\n'))}</textarea>
            </label>
            <label>House rules
              <textarea id="lunaHouseRules">${escapeHtml((luna.houseRules || settings.houseRules || []).join('\n'))}</textarea>
            </label>
            <label>Parking information
              <textarea id="lunaParking">${escapeHtml(luna.parking || settings.parking || '')}</textarea>
            </label>
            <label>Contact information
              <textarea id="lunaContact">${escapeHtml(luna.contact || settings.contactEmail || settings.contactPhone || '')}</textarea>
            </label>
            <label>Local recommendations
              <textarea id="lunaRecommendations">${escapeHtml((luna.localRecommendations || settings.nearby || []).join('\n'))}</textarea>
            </label>
            <div class="action-row">
              <button class="btn btn-primary" type="submit">Save Luna profile</button>
              <button class="btn btn-secondary" type="button" id="lunaReset">Reset Luna</button>
            </div>
          </form>
        </div>
        <div class="side-panel">
          <span class="pill blue">Assistant preview</span>
          <p>${escapeHtml(settings.heroSubtitle)}</p>
          <div class="rich-preview">
            <strong>FAQ count</strong>
            <p>${escapeHtml(String((luna.faqs || []).length))} entries</p>
          </div>
        </div>
      </div>
    `;
  }
}

function saveLuna() {
  const settings = normalizedSettings();
  const luna = normalizedLuna();
  luna.description = String(el('lunaDescription')?.value || luna.description || '').trim();
  luna.faqs = String(el('lunaFaqs')?.value || '').split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [question, ...rest] = line.split('|');
    return { question: question.trim(), answer: rest.join('|').trim() || question.trim() };
  });
  luna.houseRules = safeList(el('lunaHouseRules')?.value || '');
  luna.parking = String(el('lunaParking')?.value || '').trim();
  luna.contact = String(el('lunaContact')?.value || '').trim();
  luna.localRecommendations = safeList(el('lunaRecommendations')?.value || '');

  settings.heroSubtitle = luna.description || settings.heroSubtitle;
  settings.houseRules = luna.houseRules.slice();
  settings.parking = luna.parking || settings.parking;
  settings.nearby = luna.localRecommendations.slice();

  setSettings(settings);
  setLunaConfig(luna);
  renderAll();
}

function resetLuna() {
  const luna = cloneDeep(DEFAULT_LUNA);
  const settings = normalizedSettings();
  settings.heroSubtitle = luna.description;
  settings.houseRules = luna.houseRules.slice();
  settings.parking = luna.parking;
  settings.nearby = luna.localRecommendations.slice();
  setSettings(settings);
  setLunaConfig(luna);
  renderAll();
}

function renderInquiries() {
  const wrap = el('inquiryManager');
  const inquiries = normalizeInquiries().slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  if (wrap) {
    wrap.innerHTML = `
      <div class="chip-row" style="margin-bottom:12px;">
        <button class="btn btn-secondary" data-inquiry-filter="all" type="button">All</button>
        <button class="btn btn-secondary" data-inquiry-filter="pending" type="button">Pending</button>
        <button class="btn btn-secondary" data-inquiry-filter="resolved" type="button">Resolved</button>
      </div>
      <div class="inquiry-grid">
        ${inquiries.filter((item) => state.inquiryFilter === 'all' ? true : String(item.status || '').toLowerCase() === state.inquiryFilter).map((item) => `
          <article class="inquiry-card">
            <div class="inquiry-head">
              <div>
                <span class="pill ${String(item.status || '').toLowerCase() === 'resolved' ? 'green' : 'blue'}">${escapeHtml(item.status || 'Pending')}</span>
                <h3>${escapeHtml(item.name)}</h3>
                <p class="meta">${escapeHtml(item.email || '—')} · ${escapeHtml(item.phone || '—')}</p>
              </div>
              <span class="pill gray">${formatDateTime(item.createdAt)}</span>
            </div>
            <p><strong>Topic:</strong> ${escapeHtml(item.topic || 'General inquiry')}</p>
            <p>${escapeHtml(item.message || '')}</p>
            <div class="item-actions">
              <button class="btn btn-primary" data-act="inquiry-reply" data-id="${escapeHtml(item.id)}" type="button">Reply</button>
              <button class="btn btn-secondary" data-act="inquiry-resolve" data-id="${escapeHtml(item.id)}" type="button">Mark resolved</button>
            </div>
          </article>
        `).join('') || '<div class="owner-empty">No guest inquiries stored yet.</div>'}
      </div>
    `;
  }
}

function updateInquiry(id, updater) {
  const next = normalizeInquiries().map((item) => item.id === id ? updater({ ...item }) : item);
  setInquiries(next);
  renderAll();
}

function renderSettings() {
  const wrap = el('siteSettingsEditor');
  const settings = normalizedSettings();
  const site = normalizedSiteSettings();
  if (wrap) {
    wrap.innerHTML = `
      <div class="split-layout">
        <div class="form-shell">
          <form id="siteSettingsForm" class="rich-body">
            <div class="two-col">
              <label>Property name
                <input id="siteName" type="text" value="${escapeHtml(site.propertyName)}" />
              </label>
              <label>Logo
                <input id="siteLogo" type="text" value="${escapeHtml(site.logoUrl || '')}" />
              </label>
            </div>
            <label>Address
              <textarea id="siteAddress">${escapeHtml(site.address || settings.building || '')}</textarea>
            </label>
            <div class="two-col">
              <label>Contact email
                <input id="siteContactEmail" type="email" value="${escapeHtml(site.contactEmail || '')}" />
              </label>
              <label>Contact phone
                <input id="siteContactPhone" type="text" value="${escapeHtml(site.contactPhone || '')}" />
              </label>
            </div>
            <div class="two-col">
              <label>Facebook
                <input id="siteFacebook" type="text" value="${escapeHtml(site.socialLinks?.facebook || '')}" />
              </label>
              <label>Instagram
                <input id="siteInstagram" type="text" value="${escapeHtml(site.socialLinks?.instagram || '')}" />
              </label>
            </div>
            <div class="two-col">
              <label>TikTok
                <input id="siteTiktok" type="text" value="${escapeHtml(site.socialLinks?.tiktok || '')}" />
              </label>
              <label>Hero images (one URL per line)
                <textarea id="siteHeroImages">${escapeHtml((site.heroImages || []).join('\n'))}</textarea>
              </label>
            </div>
            <div class="two-col">
              <label>Theme mode
                <select id="siteThemeMode">
                  <option value="auto" ${site.themeMode === 'auto' ? 'selected' : ''}>Auto</option>
                  <option value="day" ${site.themeMode === 'day' ? 'selected' : ''}>Day</option>
                  <option value="night" ${site.themeMode === 'night' ? 'selected' : ''}>Night</option>
                </select>
              </label>
              <label>Day starts at
                <input id="siteDayStart" type="time" value="${escapeHtml(site.dayStart || '06:00')}" />
              </label>
            </div>
            <div class="two-col">
              <label>Night starts at
                <input id="siteNightStart" type="time" value="${escapeHtml(site.nightStart || '18:00')}" />
              </label>
              <label>Admin notes
                <input id="siteNotes" type="text" value="${escapeHtml(site.adminNotes || '')}" placeholder="Optional" />
              </label>
            </div>
            <div class="action-row">
              <button class="btn btn-primary" type="submit">Save settings</button>
              <button class="btn btn-secondary" type="button" id="siteReset">Reset settings</button>
            </div>
          </form>
        </div>
        <div class="side-panel">
          <span class="pill blue">Theme preview</span>
          <p>Day mode: 06:00 AM - 05:59 PM. Night mode: 06:00 PM - 05:59 AM.</p>
          <div class="rich-preview">
            <strong>Auto mode</strong>
            <p>Current mode: ${escapeHtml(document.body.dataset.theme || 'day')}</p>
          </div>
          <div style="height:12px"></div>
          <button class="btn btn-secondary full" id="developerToggle" type="button">Open developer tools</button>
        </div>
      </div>
    `;
  }
}

function saveSiteSettings() {
  const site = normalizedSiteSettings();
  const settings = normalizedSettings();
  const next = {
    ...site,
    propertyName: String(el('siteName')?.value || site.propertyName).trim() || site.propertyName,
    logoUrl: String(el('siteLogo')?.value || site.logoUrl || '').trim(),
    address: String(el('siteAddress')?.value || site.address || '').trim(),
    contactEmail: String(el('siteContactEmail')?.value || '').trim(),
    contactPhone: String(el('siteContactPhone')?.value || '').trim(),
    socialLinks: {
      facebook: String(el('siteFacebook')?.value || '').trim(),
      instagram: String(el('siteInstagram')?.value || '').trim(),
      tiktok: String(el('siteTiktok')?.value || '').trim(),
    },
    heroImages: safeList(el('siteHeroImages')?.value || '').filter(Boolean),
    themeMode: String(el('siteThemeMode')?.value || 'auto').trim(),
    dayStart: String(el('siteDayStart')?.value || '06:00'),
    nightStart: String(el('siteNightStart')?.value || '18:00'),
    adminNotes: String(el('siteNotes')?.value || '').trim(),
  };
  setSiteSettings(next);
  settings.name = next.propertyName;
  settings.area = next.address || settings.area;
  settings.building = next.address || settings.building;
  settings.hostName = settings.hostName || 'Donnie';
  setSettings(settings);
  renderAll();
}

function resetSiteSettings() {
  setSiteSettings(cloneDeep(DEFAULT_SITE_SETTINGS));
  const settings = normalizedSettings();
  settings.name = DEFAULT_PROPERTY.name;
  settings.area = DEFAULT_PROPERTY.area;
  settings.building = DEFAULT_PROPERTY.building;
  setSettings(settings);
  renderAll();
}

async function renderDeveloper() {
  const panel = el('developerPanel');
  const reviewsRes = await fetch('/api/reviews-list', { credentials: 'include' }).then((r) => r.ok).catch(() => false).catch(() => false);
  const statusRes = await fetch('/api/admin-status', { credentials: 'include' }).then((r) => r.ok).catch(() => false).catch(() => false);
  const snapshot = storageSnapshot();
  if (panel) {
    panel.innerHTML = `
      <div class="card-grid" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
        <article class="card"><div class="label">API status</div><strong>${statusRes ? 'Online' : 'Check failed'}</strong><span class="sub">Admin session endpoint responding.</span></article>
        <article class="card"><div class="label">Database</div><strong>${reviewsRes ? 'Connected' : 'Unavailable'}</strong><span class="sub">Review list API check.</span></article>
        <article class="card"><div class="label">Email</div><strong>Server-side</strong><span class="sub">SMTP settings remain on the server.</span></article>
        <article class="card"><div class="label">System version</div><strong>v1</strong><span class="sub">Standalone admin portal build.</span></article>
      </div>
      <div style="height:12px"></div>
      <div class="form-shell">
        <div class="rich-preview">
          <strong>Storage snapshot</strong>
          <p>Bookings: ${snapshot.bookings.length} · Inquiries: ${snapshot.inquiries.length} · Reviews: ${snapshot.comments.length} · Media: ${snapshot.media.length}</p>
        </div>
      </div>
    `;
  }
}

function revealDeveloperSection() {
  const section = el('developerSection');
  if (!section) return;
  section.hidden = false;
  section.classList.remove('hidden');
  section.setAttribute('aria-hidden', 'false');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderDeveloper();
}

function syncBookingStoreFromPublic() {
  const bookings = normalizeBookings();
  if (!bookings.length) return;
  setBookings(bookings);
}

function syncInquiryStoreFromPublic() {
  const inquiries = normalizeInquiries();
  if (!inquiries.length) return;
  setInquiries(inquiries);
}

function bindEvents() {
  el('logoutBtn')?.addEventListener('click', logout);
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-act], [data-media-filter], [data-inquiry-filter]');
    if (!target) return;

    const act = target.dataset.act;
    if (target.dataset.mediaFilter) {
      state.mediaFilter = target.dataset.mediaFilter;
      renderGallery();
      return;
    }
    if (target.dataset.inquiryFilter) {
      state.inquiryFilter = target.dataset.inquiryFilter;
      renderInquiries();
      return;
    }

    const id = target.dataset.id;
    if (act === 'view-booking') {
      state.selectedBooking = id;
      renderBookings();
    }
    if (act === 'status-booking') {
      const next = window.prompt('New booking status (Pending, Confirmed, Checked-in, Checked-out, Canceled):', 'Confirmed');
      if (!next) return;
      updateBooking(id, (booking) => ({ ...booking, status: next.trim() || booking.status }));
    }
    if (act === 'cancel-booking') {
      if (!window.confirm('Cancel this booking?')) return;
      updateBooking(id, (booking) => ({ ...booking, status: 'Canceled' }));
    }

    if (act === 'media-feature') {
      setMedia(getMedia().map((item) => ({ ...item, featured: item.id === id })));
      renderAll();
    }
    if (act === 'media-toggle') {
      persistMediaItemChange(id, (item) => ({ ...item, hidden: !item.hidden }));
    }
    if (act === 'media-delete') {
      if (!window.confirm('Delete this media item?')) return;
      setMedia(getMedia().filter((item) => item.id !== id));
      renderAll();
    }
    if (act === 'media-up') {
      setMedia(moveItem(getMedia(), id, -1));
      renderAll();
    }
    if (act === 'media-down') {
      setMedia(moveItem(getMedia(), id, 1));
      renderAll();
    }

    if (act === 'amenity-edit') {
      state.selectedAmenity = id;
      renderAmenities();
    }
    if (act === 'amenity-feature') {
      setAmenities(getAmenities().map((item) => ({ ...item, featured: item.id === id })));
      renderAll();
    }
    if (act === 'amenity-toggle') {
      setAmenities(getAmenities().map((item) => item.id === id ? { ...item, hidden: !item.hidden } : item));
      renderAll();
    }
    if (act === 'amenity-up') {
      setAmenities(moveItem(getAmenities(), id, -1));
      renderAll();
    }
    if (act === 'amenity-down') {
      setAmenities(moveItem(getAmenities(), id, 1));
      renderAll();
    }
    if (act === 'amenity-delete') {
      if (!window.confirm('Delete this amenity?')) return;
      setAmenities(getAmenities().filter((item) => item.id !== id));
      renderAll();
    }

    if (act === 'review-feature') {
      setComments(getComments().map((item) => ({ ...item, featured: item.id === id })));
      renderAll();
    }
    if (act === 'review-toggle') {
      setComments(getComments().map((item) => item.id === id ? { ...item, hidden: !item.hidden } : item));
      renderAll();
    }
    if (act === 'review-delete') {
      if (!window.confirm('Delete this review?')) return;
      setComments(getComments().filter((item) => item.id !== id));
      renderAll();
    }

    if (act === 'inquiry-reply') {
      const inquiry = normalizeInquiries().find((item) => item.id === id);
      if (!inquiry) return;
      const subject = encodeURIComponent(`Luxury Stay follow-up: ${inquiry.topic || 'Your inquiry'}`);
      const body = encodeURIComponent(`Hi ${inquiry.name},\n\nThanks for reaching out about Luxury Stay.\n\nMessage:\n${inquiry.message}\n\nBest regards,\nLuxury Stay`);
      window.location.href = `mailto:${encodeURIComponent(inquiry.email)}?subject=${subject}&body=${body}`;
    }
    if (act === 'inquiry-resolve') {
      updateInquiry(id, (item) => ({ ...item, status: 'Resolved' }));
    }
  });

  document.addEventListener('submit', (event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    if (event.target.id === 'pricingForm') {
      event.preventDefault();
      savePricingFromForm();
    }
    if (event.target.id === 'mediaForm') {
      event.preventDefault();
      uploadMedia(event.target);
    }
    if (event.target.id === 'amenityForm') {
      event.preventDefault();
      saveAmenityFromForm();
    }
    if (event.target.id === 'lunaForm') {
      event.preventDefault();
      saveLuna();
    }
    if (event.target.id === 'siteSettingsForm') {
      event.preventDefault();
      saveSiteSettings();
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    if (target.id === 'bookingSearch') {
      state.bookingSearch = target.value;
      renderBookings();
    }
    if (target.id === 'bookingFilter') {
      state.bookingFilter = target.value;
      renderBookings();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.id === 'refreshBookings') renderBookings();
    if (target.id === 'prevMonth') {
      state.monthOffset -= 1;
      renderAvailability();
    }
    if (target.id === 'nextMonth') {
      state.monthOffset += 1;
      renderAvailability();
    }
    if (target.id === 'blockDateBtn') {
      const input = el('blockDateInput');
      saveBlockedDate(input?.value || '');
      renderAvailability();
    }
    if (target.id === 'unblockDateBtn') {
      const input = el('blockDateInput');
      unblockBlockedDate(input?.value || '');
      renderAvailability();
    }
    if (target.id === 'pricingReset') resetPricingDefaults();
    if (target.id === 'mediaRefresh') renderGallery();
    if (target.id === 'amenityClear') {
      state.selectedAmenity = null;
      renderAmenities();
    }
    if (target.id === 'guideSave') saveGuide();
    if (target.id === 'guideReset') resetGuide();
    if (target.id === 'lunaReset') resetLuna();
    if (target.id === 'siteReset') resetSiteSettings();
    if (target.id === 'developerToggle') revealDeveloperSection();
  });

  document.addEventListener('change', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target.id === 'mediaType') return;
    if (target.id === 'siteThemeMode' || target.id === 'siteDayStart' || target.id === 'siteNightStart') applyTheme();
  });

  el('bookingBulkStatus')?.addEventListener('change', (event) => {
    const value = event.target.value;
    if (!value) return;
    const bookings = normalizeBookings().map((item) => ({ ...item, status: value }));
    setBookings(bookings);
    renderAll();
  });
}

async function uploadMedia(form) {
  const type = String(el('mediaType')?.value || 'image');
  const label = String(el('mediaLabel')?.value || '').trim();
  const poster = String(el('mediaPoster')?.value || '').trim();
  const file = el('mediaFile')?.files?.[0];
  if (!file) {
    alert('Choose a file first.');
    return;
  }
  const dataUrl = await fileToDataUrl(file);
  const next = {
    id: generateReference(type === 'video' ? 'VID' : 'IMG'),
    type: type === 'video' ? 'video' : 'image',
    src: dataUrl,
    poster: type === 'video' ? (poster || '../assets/9.jpg') : undefined,
    alt: label || file.name,
    label: label || file.name,
    featured: false,
    hidden: false,
  };
  const media = [next, ...getMedia()];
  setMedia(media);
  form.reset();
  renderAll();
}

function renderAll() {
  applyTheme();
  renderDashboard();
  renderBookings();
  renderAvailability();
  renderPricing();
  renderGallery();
  renderAmenities();
  renderGuide();
  renderReviews();
  renderLuna();
  renderInquiries();
  renderSettings();
  if (state.editingGuide) renderDeveloper();
}

async function bootstrap() {
  ensureSeededDefaults();
  const loggedIn = await requireAuth();
  if (!loggedIn) return;

  syncBookingStoreFromPublic();
  syncInquiryStoreFromPublic();

  authPill(true);
  setText('adminClock', new Date().toLocaleString());
  applyTheme();
  bindEvents();
  renderAll();
  el('logoutBtn')?.classList.remove('hidden');
  setInterval(() => setText('adminClock', new Date().toLocaleString()), 1000 * 30);

  const developerButton = el('developerToggle');
  if (developerButton) developerButton.addEventListener('click', revealDeveloperSection);

  const developerSection = el('developerSection');
  if (developerSection) {
    developerSection.hidden = true;
    developerSection.classList.add('hidden-section');
  }

  window.addEventListener('storage', () => {
    renderAll();
  });
}

document.addEventListener('DOMContentLoaded', bootstrap);
