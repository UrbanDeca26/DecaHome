(() => {
  'use strict';

  const S = window.LuxuryAdminStore;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ICON_KEYS = ['wifi','tv','key','ac','kitchen','fridge','microwave','washer','shower','workspace','security','karaoke','projector','games','dining','store','basketball','park','coffee','closet','iron','dryer'];

  const state = {
    settings: S.loadSettings(),
    media: S.loadMedia(),
    amenities: S.loadAmenities(),
    inquiries: S.loadInquiries(),
    blockedDates: S.loadBlockedDates(),
    bookings: [],
    reviews: [],
    calendarMonth: (() => {
      const now = new Date();
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    })(),
    editingAmenityId: null,
    selectedBooking: null,
    developerHealth: {
      auth: 'Unknown',
      bookings: 'Unknown',
      reviews: 'Unknown',
      email: 'Configured in backend',
      database: 'Configured in Supabase',
    },
  };

  function blockedDateMap() {
    return new Map(state.blockedDates.map((item) => [item.date, item]));
  }

  function bookingRanges() {
    return state.bookings
      .filter((booking) => String(booking.status || '').toLowerCase() !== 'cancelled')
      .map((booking) => {
        const start = S.parseDateISO(booking.checkin);
        const end = S.parseDateISO(booking.checkout);
        if (!start || !end) return null;
        return { ...booking, start, end };
      })
      .filter(Boolean);
  }

  function dateStatus(dateStr) {
    const blocked = blockedDateMap().get(dateStr);
    if (blocked) return blocked.type || 'blocked';
    const date = S.parseDateISO(dateStr);
    if (!date) return 'available';
    for (const booking of bookingRanges()) {
      if (date >= booking.start && date < booking.end) return booking.status === 'confirmed' ? 'reserved' : 'reserved';
    }
    return 'available';
  }

  function bookingStatusBadge(status) {
    const value = String(status || 'pending').toLowerCase();
    const map = {
      confirmed: 'success',
      completed: 'success',
      pending: 'warning',
      cancelled: 'blocked',
      blocked: 'blocked',
      reserved: 'reserved',
    };
    return map[value] || 'info';
  }

  function ensureAuth() {
    return S.apiFetch('/api/admin-status', { method: 'GET' }).then((data) => {
      state.developerHealth.auth = data.loggedIn ? 'Authenticated' : 'Not logged in';
      if (!data.loggedIn) {
        window.location.replace('./login.html');
        return false;
      }
      return true;
    }).catch(() => {
      window.location.replace('./login.html');
      return false;
    });
  }

  function setNavActive() {
    const current = window.location.hash || '#dashboard';
    $$('.nav-link').forEach((link) => link.classList.toggle('active', link.getAttribute('href') === current));
  }

  function scrollToHash(hash) {
    const el = $(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function currentSummary() {
    const today = new Date();
    const sevenDays = 7 * 86400000;
    const upcoming = state.bookings.filter((booking) => {
      const start = new Date(`${booking.checkin}T00:00:00`);
      return !Number.isNaN(start.getTime()) && start.getTime() >= today.getTime() && start.getTime() <= today.getTime() + sevenDays;
    });
    const departures = state.bookings.filter((booking) => {
      const end = new Date(`${booking.checkout}T00:00:00`);
      return !Number.isNaN(end.getTime()) && end.getTime() >= today.getTime() && end.getTime() <= today.getTime() + sevenDays;
    });
    const pending = state.inquiries.filter((item) => String(item.status || 'pending').toLowerCase() !== 'resolved');
    return { upcoming, departures, pending };
  }

  function renderDashboard() {
    const kpis = $('#dashboardKpis');
    const snapshot = $('#dashboardSnapshot');
    if (!kpis || !snapshot) return;
    const summary = currentSummary();

    kpis.innerHTML = [
      { label: 'Total bookings', value: state.bookings.length, hint: 'From the booking database', icon: 'calendar-check' },
      { label: 'Upcoming arrivals', value: summary.upcoming.length, hint: 'Next 7 days', icon: 'plane-arrival' },
      { label: 'Upcoming departures', value: summary.departures.length, hint: 'Next 7 days', icon: 'plane-departure' },
      { label: 'Pending inquiries', value: summary.pending.length, hint: 'Needs owner attention', icon: 'inbox' },
    ].map((item) => `
      <article class="kpi-card">
        <div class="label"><i class="fa-solid fa-${item.icon}"></i>${S.escapeHtml(item.label)}</div>
        <strong>${S.escapeHtml(String(item.value))}</strong>
        <span>${S.escapeHtml(item.hint)}</span>
      </article>
    `).join('');

    const nextBooking = state.bookings.find((b) => String(b.status || '').toLowerCase() !== 'cancelled');
    snapshot.innerHTML = [
      nextBooking ? `
        <div class="card-item">
          <div class="card-item-head">
            <div>
              <strong>Next booking</strong>
              <span>${S.escapeHtml(nextBooking.booking_ref || '—')}</span>
            </div>
            <span class="badge ${bookingStatusBadge(nextBooking.status)}">${S.escapeHtml(nextBooking.status || 'pending')}</span>
          </div>
          <p>${S.escapeHtml(nextBooking.guest_name || 'Guest')} · ${S.escapeHtml(S.formatDate(nextBooking.checkin))} to ${S.escapeHtml(S.formatDate(nextBooking.checkout))}</p>
        </div>` : '<div class="admin-empty">No bookings yet.</div>',
      summary.pending[0] ? `
        <div class="card-item">
          <div class="card-item-head">
            <div><strong>Latest inquiry</strong><span>${S.escapeHtml(summary.pending[0].name || 'Guest')}</span></div>
            <span class="badge warning">Pending</span>
          </div>
          <p>${S.escapeHtml(summary.pending[0].message || '').slice(0, 140)}</p>
        </div>` : '<div class="admin-empty">No pending inquiries.</div>',
      `
        <div class="card-item">
          <div class="card-item-head">
            <div><strong>Live pricing source</strong><span>Shared settings key</span></div>
            <span class="badge success">Active</span>
          </div>
          <p>Hero card, booking modal, and emails all read from the same pricing values saved in the Pricing section.</p>
        </div>`,
    ].join('');
  }

  async function loadBookings() {
    try {
      const data = await S.apiFetch('/api/bookings', { method: 'GET' });
      state.bookings = Array.isArray(data.bookings) ? data.bookings : [];
      state.developerHealth.bookings = 'Online';
      renderBookings();
      renderDashboard();
      renderCalendar();
      renderDeveloper();
    } catch (err) {
      state.bookings = [];
      state.developerHealth.bookings = `Error: ${err.message}`;
      renderBookings();
      renderDashboard();
      renderCalendar();
      renderDeveloper();
    }
  }

  async function loadReviews() {
    try {
      const data = await S.apiFetch('/api/reviews-list', {
        method: 'POST',
        body: JSON.stringify({ action: 'list' }),
      });
      state.reviews = Array.isArray(data.reviews) ? data.reviews : [];
      state.developerHealth.reviews = 'Online';
      renderReviews();
      renderDeveloper();
    } catch (err) {
      state.reviews = [];
      state.developerHealth.reviews = `Error: ${err.message}`;
      renderReviews();
      renderDeveloper();
    }
  }

  function renderBookings() {
    const tbody = $('#bookingsTable');
    if (!tbody) return;
    if (!state.bookings.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No bookings have been recorded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = state.bookings.map((booking) => `
      <tr>
        <td><strong>${S.escapeHtml(booking.booking_ref || '—')}</strong><div class="muted">${S.escapeHtml(S.formatDateTime(booking.created_at || booking.createdAt))}</div></td>
        <td>${S.escapeHtml(booking.guest_name || '—')}</td>
        <td><div>${S.escapeHtml(booking.guest_email || '—')}</div><div class="muted">${S.escapeHtml(booking.guest_phone || '—')}</div></td>
        <td>${S.escapeHtml(S.formatDate(booking.checkin))}<br/><span class="muted">to ${S.escapeHtml(S.formatDate(booking.checkout))}</span></td>
        <td>${S.escapeHtml(String(booking.guests || 0))} / ${S.escapeHtml(String(booking.pets || 0))}</td>
        <td>${S.escapeHtml(S.formatCurrency(booking.total || booking.pricing?.total || 0))}</td>
        <td><span class="badge ${bookingStatusBadge(booking.status)}">${S.escapeHtml(booking.status || 'pending')}</span></td>
        <td><button class="btn btn-secondary small" data-booking-id="${S.escapeHtml(booking.id || booking.booking_ref || '')}">View</button></td>
      </tr>
    `).join('');

    $$('#bookingsTable [data-booking-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.bookingId;
        const booking = state.bookings.find((item) => String(item.id || item.booking_ref) === String(id));
        if (booking) openBookingModal(booking);
      });
    });
  }

  function openBookingModal(booking) {
    state.selectedBooking = booking;
    $('#bookingModalTitle').textContent = booking.booking_ref || 'Booking details';
    const body = $('#bookingModalBody');
    const statusSelect = $('#bookingModalStatus');
    if (!body || !statusSelect) return;

    statusSelect.innerHTML = ['pending', 'confirmed', 'completed', 'cancelled'].map((status) => `<option value="${status}" ${String(booking.status || 'pending') === status ? 'selected' : ''}>${status}</option>`).join('');

    body.innerHTML = `
      <div class="grid-2">
        <div class="card-item"><strong>Guest</strong><p>${S.escapeHtml(booking.guest_name || '—')}</p></div>
        <div class="card-item"><strong>Email</strong><p>${S.escapeHtml(booking.guest_email || '—')}</p></div>
        <div class="card-item"><strong>Phone</strong><p>${S.escapeHtml(booking.guest_phone || '—')}</p></div>
        <div class="card-item"><strong>Dates</strong><p>${S.escapeHtml(S.formatDate(booking.checkin))} to ${S.escapeHtml(S.formatDate(booking.checkout))}</p></div>
        <div class="card-item"><strong>Guests</strong><p>${S.escapeHtml(String(booking.guests || 0))}</p></div>
        <div class="card-item"><strong>Pets</strong><p>${S.escapeHtml(String(booking.pets || 0))}</p></div>
        <div class="card-item"><strong>Total</strong><p>${S.escapeHtml(S.formatCurrency(booking.total || booking.pricing?.total || 0))}</p></div>
        <div class="card-item"><strong>Review token</strong><p>${S.escapeHtml(booking.review_token || '—')}</p></div>
      </div>
      <div class="card-item" style="margin-top:12px;">
        <strong>Special request</strong>
        <p>${S.escapeHtml(booking.note || '—')}</p>
      </div>
    `;

    $('#bookingModalBackdrop')?.classList.add('open');
    $('#bookingModalBackdrop')?.setAttribute('aria-hidden', 'false');
  }

  function closeBookingModal() {
    $('#bookingModalBackdrop')?.classList.remove('open');
    $('#bookingModalBackdrop')?.setAttribute('aria-hidden', 'true');
    state.selectedBooking = null;
  }

  async function saveSelectedBookingStatus() {
    const booking = state.selectedBooking;
    if (!booking) return;
    const status = String($('#bookingModalStatus')?.value || booking.status || 'pending');
    await S.apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ action: 'update', id: booking.id || booking.booking_ref, status }),
    });
    await loadBookings();
    closeBookingModal();
  }

  async function cancelSelectedBooking() {
    const booking = state.selectedBooking;
    if (!booking) return;
    if (!window.confirm(`Cancel booking ${booking.booking_ref || ''}?`)) return;
    await S.apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ action: 'cancel', id: booking.id || booking.booking_ref }),
    });
    await loadBookings();
    closeBookingModal();
  }

  async function inviteSelectedBooking() {
    const booking = state.selectedBooking;
    if (!booking) return;
    try {
      await S.apiFetch('/api/reviews-invite', {
        method: 'POST',
        body: JSON.stringify({ bookingRef: booking.booking_ref }),
      });
      alert('Review invitation sent.');
    } catch (err) {
      alert(err.message || 'Could not send review invitation');
    }
  }

  function renderCalendar() {
    const grid = $('#calendarGrid');
    const title = $('#calendarTitle');
    const blockedList = $('#blockedDatesList');
    if (!grid || !title || !blockedList) return;

    const monthStart = state.calendarMonth;
    title.textContent = S.monthTitle(monthStart);
    const startWeekday = new Date(monthStart.getTime()).getUTCDay();
    const daysInMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate();
    const todayIso = S.toISODate(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())));
    const blocked = blockedDateMap();

    const cells = [
      'Sun','Mon','Tue','Wed','Thu','Fri','Sat'
    ].map((w) => `<div class="calendar-weekday">${w}</div>`);

    for (let i = 0; i < startWeekday; i += 1) {
      cells.push('<div class="calendar-day" style="opacity:.35; pointer-events:none;"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day));
      const iso = S.toISODate(date);
      const status = dateStatus(iso);
      const isToday = iso === todayIso;
      const data = blocked.get(iso);
      const label = status === 'available' ? 'Available' : status.charAt(0).toUpperCase() + status.slice(1);
      cells.push(`
        <button class="calendar-day ${isToday ? 'is-today' : ''} is-${status}" type="button" data-calendar-date="${iso}">
          <span class="day-num">${day}</span>
          <span class="day-meta">${label}${data?.note ? `<br>${S.escapeHtml(data.note)}` : ''}</span>
        </button>
      `);
    }

    grid.innerHTML = cells.join('');
    blockedList.innerHTML = state.blockedDates.length ? state.blockedDates.map((item) => `
      <div class="card-item">
        <div class="card-item-head">
          <div>
            <strong>${S.escapeHtml(item.date)}</strong>
            <span>${S.escapeHtml(item.type || 'blocked')}${item.note ? ` · ${S.escapeHtml(item.note)}` : ''}</span>
          </div>
          <button class="btn btn-secondary small" data-remove-block="${S.escapeHtml(item.date)}" type="button">Remove</button>
        </div>
      </div>
    `).join('') : '<div class="admin-empty">No blocked dates set.</div>';

    $$('#calendarGrid [data-calendar-date]').forEach((button) => {
      button.addEventListener('click', () => toggleBlockDate(button.dataset.calendarDate));
    });
    $$('#blockedDatesList [data-remove-block]').forEach((button) => {
      button.addEventListener('click', () => removeBlockDate(button.dataset.removeBlock));
    });
  }

  function toggleBlockDate(dateIso) {
    const existing = state.blockedDates.find((item) => item.date === dateIso);
    if (existing) {
      state.blockedDates = state.blockedDates.filter((item) => item.date !== dateIso);
    } else {
      state.blockedDates.unshift({ date: dateIso, type: $('#blockDateType')?.value || 'blocked', note: $('#blockDateNote')?.value || '' });
    }
    S.saveBlockedDates(state.blockedDates);
    renderCalendar();
  }

  function removeBlockDate(dateIso) {
    state.blockedDates = state.blockedDates.filter((item) => item.date !== dateIso);
    S.saveBlockedDates(state.blockedDates);
    renderCalendar();
  }

  function clearBlockedDates() {
    if (!window.confirm('Clear all blocked dates?')) return;
    state.blockedDates = [];
    S.saveBlockedDates(state.blockedDates);
    renderCalendar();
  }

  function renderPricing() {
    $('#weekdayRateInput').value = state.settings.weekdayRate;
    $('#weekendRateInput').value = state.settings.weekendRate;
    $('#includedGuestsInput').value = state.settings.includedGuests;
    $('#extraGuestFeeInput').value = state.settings.extraGuestFee;
    $('#petFeeInput').value = state.settings.petFee;
    $('#maxGuestsInput').value = state.settings.maxGuests;
    $('#maxPetsInput').value = state.settings.maxPets;

    const preview = $('#pricingPreview');
    preview.innerHTML = [
      `
        <div class="card-item"><div class="card-item-head"><strong>Weekday rate</strong><span>${S.escapeHtml(S.formatCurrency(state.settings.weekdayRate))}</span></div><p>Used for Monday to Thursday nights.</p></div>`,
      `
        <div class="card-item"><div class="card-item-head"><strong>Weekend rate</strong><span>${S.escapeHtml(S.formatCurrency(state.settings.weekendRate))}</span></div><p>Used for Friday, Saturday, and Sunday nights.</p></div>`,
      `
        <div class="card-item"><div class="card-item-head"><strong>Included guests</strong><span>${S.escapeHtml(String(state.settings.includedGuests))}</span></div><p>Guests included before extra guest fees apply.</p></div>`,
      `
        <div class="card-item"><div class="card-item-head"><strong>Extra guest fee</strong><span>${S.escapeHtml(S.formatCurrency(state.settings.extraGuestFee))}</span></div><p>Per night, per extra guest.</p></div>`,
      `
        <div class="card-item"><div class="card-item-head"><strong>Pet fee</strong><span>${S.escapeHtml(S.formatCurrency(state.settings.petFee))}</span></div><p>Per night, per pet.</p></div>`,
      `
        <div class="card-item"><div class="card-item-head"><strong>Maximum limits</strong><span>${state.settings.maxGuests} guests / ${state.settings.maxPets} pets</span></div><p>Hard limits used by the hero booking calculator.</p></div>`,
    ].join('');
  }

  function renderMedia() {
    const list = $('#mediaList');
    if (!list) return;
    if (!state.media.length) {
      list.innerHTML = '<div class="admin-empty">No media items yet.</div>';
      return;
    }
    list.innerHTML = state.media.map((item, index) => `
      <div class="card-item">
        <div class="media-thumb">${item.type === 'video' ? `<video muted playsinline preload="metadata" poster="${S.escapeHtml(item.poster || '')}"><source src="${S.escapeHtml(item.src)}" type="video/mp4"></video>` : `<img src="${S.escapeHtml(item.src)}" alt="${S.escapeHtml(item.alt || item.label || 'Media')}">`}</div>
        <div class="card-item-head" style="margin-top:10px;">
          <div>
            <strong>${S.escapeHtml(item.label || item.alt || 'Media')}</strong>
            <span>${item.type === 'video' ? 'Video' : 'Photo'}</span>
          </div>
          <span class="badge ${item.featured ? 'success' : 'info'}">${item.featured ? 'Featured' : 'Normal'}</span>
        </div>
        <p class="meta">${S.escapeHtml(item.src)}</p>
        <div class="card-actions">
          <button class="btn btn-secondary small" data-media-action="up" data-media-id="${S.escapeHtml(item.id)}">Up</button>
          <button class="btn btn-secondary small" data-media-action="down" data-media-id="${S.escapeHtml(item.id)}">Down</button>
          <button class="btn btn-secondary small" data-media-action="feature" data-media-id="${S.escapeHtml(item.id)}">Feature</button>
          <button class="btn btn-secondary small" data-media-action="toggle" data-media-id="${S.escapeHtml(item.id)}">${item.hidden ? 'Show' : 'Hide'}</button>
          <button class="btn btn-danger small" data-media-action="delete" data-media-id="${S.escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
    `).join('');

    $$('#mediaList [data-media-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.mediaId;
        const action = button.dataset.mediaAction;
        const idx = state.media.findIndex((item) => item.id === id);
        if (idx === -1) return;
        if (action === 'up' && idx > 0) {
          [state.media[idx - 1], state.media[idx]] = [state.media[idx], state.media[idx - 1]];
        } else if (action === 'down' && idx < state.media.length - 1) {
          [state.media[idx + 1], state.media[idx]] = [state.media[idx], state.media[idx + 1]];
        } else if (action === 'feature') {
          state.media = state.media.map((item) => ({ ...item, featured: item.id === id }));
        } else if (action === 'toggle') {
          state.media[idx].hidden = !state.media[idx].hidden;
        } else if (action === 'delete') {
          if (!window.confirm('Delete this media item?')) return;
          state.media = state.media.filter((item) => item.id !== id);
        }
        S.saveMedia(state.media);
        renderMedia();
      });
    });
  }

  function renderAmenities() {
    const list = $('#amenityList');
    const iconSelect = $('#amenityIconInput');
    if (!list || !iconSelect) return;
    iconSelect.innerHTML = ICON_KEYS.map((key) => `<option value="${key}">${key}</option>`).join('');
    if (!state.amenities.length) {
      list.innerHTML = '<div class="admin-empty">No amenities configured.</div>';
      return;
    }
    list.innerHTML = state.amenities.map((item) => `
      <div class="card-item">
        <div class="card-item-head">
          <div>
            <strong>${S.escapeHtml(item.title || 'Amenity')}</strong>
            <span>${S.escapeHtml(item.category || 'Amenity')}</span>
          </div>
          <span class="badge ${item.featured ? 'success' : 'info'}">${S.escapeHtml(item.icon || 'default')}</span>
        </div>
        <p>${S.escapeHtml(item.description || '')}</p>
        <div class="card-actions">
          <button class="btn btn-secondary small" data-amenity-action="up" data-amenity-id="${S.escapeHtml(item.id)}">Up</button>
          <button class="btn btn-secondary small" data-amenity-action="down" data-amenity-id="${S.escapeHtml(item.id)}">Down</button>
          <button class="btn btn-secondary small" data-amenity-action="edit" data-amenity-id="${S.escapeHtml(item.id)}">Edit</button>
          <button class="btn btn-secondary small" data-amenity-action="toggle" data-amenity-id="${S.escapeHtml(item.id)}">${item.hidden ? 'Show' : 'Hide'}</button>
          <button class="btn btn-danger small" data-amenity-action="delete" data-amenity-id="${S.escapeHtml(item.id)}">Delete</button>
        </div>
      </div>
    `).join('');

    $$('#amenityList [data-amenity-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.amenityId;
        const action = button.dataset.amenityAction;
        const idx = state.amenities.findIndex((item) => item.id === id);
        if (idx === -1) return;
        if (action === 'up' && idx > 0) {
          [state.amenities[idx - 1], state.amenities[idx]] = [state.amenities[idx], state.amenities[idx - 1]];
        } else if (action === 'down' && idx < state.amenities.length - 1) {
          [state.amenities[idx + 1], state.amenities[idx]] = [state.amenities[idx], state.amenities[idx + 1]];
        } else if (action === 'edit') {
          state.editingAmenityId = id;
          const amenity = state.amenities[idx];
          $('#amenityTitleInput').value = amenity.title || '';
          $('#amenityCategoryInput').value = amenity.category || 'Other';
          $('#amenityIconInput').value = amenity.icon || 'default';
          $('#amenityDescInput').value = amenity.description || '';
          window.location.hash = '#amenities';
        } else if (action === 'toggle') {
          state.amenities[idx].hidden = !state.amenities[idx].hidden;
        } else if (action === 'delete') {
          if (!window.confirm('Delete this amenity?')) return;
          state.amenities = state.amenities.filter((item) => item.id !== id);
        }
        S.saveAmenities(state.amenities);
        renderAmenities();
      });
    });
  }

  function renderGuide() {
    const preview = $('#guidePreview');
    if (!preview) return;
    const settings = state.settings;
    preview.innerHTML = [
      { label: 'Booking requirements', items: settings.bookingRequirements },
      { label: 'Self check-in', items: settings.selfCheckIn },
      { label: 'Checkout reminders', items: settings.checkout },
      { label: 'House rules', items: settings.houseRules },
      { label: 'Nearby places', items: settings.nearby },
    ].map((section) => `
      <div class="card-item">
        <div class="card-item-head"><strong>${S.escapeHtml(section.label)}</strong><span>${section.items.length} entries</span></div>
        <p>${S.escapeHtml(section.items[0] || '—')}</p>
      </div>
    `).join('');

    $('#bookingRequirementsInput').value = settings.bookingRequirements.join('\n');
    $('#selfCheckInInput').value = settings.selfCheckIn.join('\n');
    $('#checkoutInput').value = settings.checkout.join('\n');
    $('#houseRulesInput').value = settings.houseRules.join('\n');
    $('#nearbyInput').value = settings.nearby.join('\n');
  }

  function parseFaqLines(text) {
    return String(text || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split('|').map((piece) => piece.trim());
        return { q: parts[0] || '', a: parts.slice(1).join(' | ') || '' };
      })
      .filter((item) => item.q || item.a);
  }

  function renderLuna() {
    const settings = state.settings;
    $('#lunaDescriptionInput').value = settings.lunaDescription || '';
    $('#lunaFaqsInput').value = (settings.lunaFaqs || []).map((item) => `${item.q || ''} | ${item.a || ''}`.trim()).join('\n');
    $('#lunaHouseRulesInput').value = (settings.lunaHouseRules || []).join('\n');
    $('#lunaParkingInput').value = settings.lunaParking || '';
    $('#lunaContactInput').value = settings.lunaContact || '';
    $('#lunaRecommendationsInput').value = (settings.lunaRecommendations || []).join('\n');

    const preview = $('#lunaPreview');
    preview.innerHTML = [
      { label: 'Description', value: settings.lunaDescription },
      { label: 'Parking', value: settings.lunaParking },
      { label: 'Contact', value: settings.lunaContact },
      { label: 'Recommendations', value: (settings.lunaRecommendations || []).join(' · ') },
    ].map((item) => `
      <div class="card-item">
        <div class="card-item-head"><strong>${S.escapeHtml(item.label)}</strong></div>
        <p>${S.escapeHtml(item.value || '—')}</p>
      </div>
    `).join('');
  }

  function renderSettings() {
    const settings = state.settings;
    $('#propertyNameInput').value = settings.propertyName || settings.name || '';
    $('#logoUrlInput').value = settings.logoUrl || '';
    $('#addressInput').value = settings.area || '';
    $('#buildingInput').value = settings.building || '';
    $('#contactEmailInput').value = settings.contactEmail || '';
    $('#contactPhoneInput').value = settings.contactPhone || '';
    $('#facebookInput').value = settings.socials?.facebook || '';
    $('#instagramInput').value = settings.socials?.instagram || '';
    $('#tiktokInput').value = settings.socials?.tiktok || '';
    $('#websiteInput').value = settings.socials?.website || '';
    $('#heroImageInput').value = settings.heroImage || '';
    $('#heroImage2Input').value = settings.heroImage2 || '';
    $('#themeStartDayInput').value = settings.themeStartDay || '06:00';
    $('#themeStartNightInput').value = settings.themeStartNight || '18:00';

    $('#settingsPreview').innerHTML = [
      { label: 'Property name', value: settings.propertyName || settings.name },
      { label: 'Address', value: `${settings.area || ''} ${settings.building || ''}`.trim() },
      { label: 'Contact', value: `${settings.contactEmail || '—'} · ${settings.contactPhone || '—'}` },
      { label: 'Theme', value: `${settings.themeStartDay || '06:00'} / ${settings.themeStartNight || '18:00'}` },
      { label: 'Socials', value: [settings.socials?.facebook, settings.socials?.instagram, settings.socials?.tiktok].filter(Boolean).join(' · ') || '—' },
    ].map((item) => `
      <div class="card-item">
        <div class="card-item-head"><strong>${S.escapeHtml(item.label)}</strong></div>
        <p>${S.escapeHtml(item.value || '—')}</p>
      </div>
    `).join('');
  }

  function renderInquiries() {
    const list = $('#inquiryList');
    const summary = $('#inquirySummary');
    const items = state.inquiries.slice().sort((a, b) => (Number(b.ts || 0) - Number(a.ts || 0)));
    if (!list || !summary) return;

    list.innerHTML = items.length ? items.map((item) => `
      <div class="card-item">
        <div class="card-item-head">
          <div>
            <strong>${S.escapeHtml(item.name || 'Guest')}</strong>
            <span>${S.escapeHtml(item.email || '—')}</span>
          </div>
          <span class="badge ${String(item.status || 'pending').toLowerCase() === 'resolved' ? 'success' : 'warning'}">${S.escapeHtml(item.status || 'pending')}</span>
        </div>
        <p>${S.escapeHtml(item.message || '')}</p>
        <p class="meta">${S.escapeHtml(S.formatDateTime(item.ts || Date.now()))}</p>
        <div class="card-actions">
          <button class="btn btn-secondary small" data-inquiry-action="reply" data-inquiry-id="${S.escapeHtml(item.id)}">Reply</button>
          <button class="btn btn-secondary small" data-inquiry-action="resolve" data-inquiry-id="${S.escapeHtml(item.id)}">Mark resolved</button>
        </div>
      </div>
    `).join('') : '<div class="admin-empty">No inquiries captured yet.</div>';

    summary.innerHTML = [
      { label: 'Pending', value: items.filter((item) => String(item.status || 'pending') !== 'resolved').length },
      { label: 'Resolved', value: items.filter((item) => String(item.status || '') === 'resolved').length },
      { label: 'Total', value: items.length },
    ].map((item) => `
      <div class="card-item"><div class="card-item-head"><strong>${S.escapeHtml(item.label)}</strong></div><p>${item.value}</p></div>
    `).join('');

    $$('#inquiryList [data-inquiry-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.inquiryId;
        const action = button.dataset.inquiryAction;
        const idx = state.inquiries.findIndex((item) => item.id === id);
        if (idx === -1) return;
        if (action === 'reply') {
          const inquiry = state.inquiries[idx];
          const subject = encodeURIComponent(`Luxury Stay inquiry: ${inquiry.topic || 'General inquiry'}`);
          const body = encodeURIComponent(`Hello ${inquiry.name || 'Guest'},\n\nThank you for your message:\n\n${inquiry.message || ''}\n\n— Luxury Stay`);
          window.open(`mailto:${encodeURIComponent(inquiry.email || '')}?subject=${subject}&body=${body}`, '_blank');
          return;
        }
        if (action === 'resolve') {
          state.inquiries[idx].status = 'resolved';
          S.saveInquiries(state.inquiries);
          renderInquiries();
          renderDashboard();
        }
      });
    });
  }

  function renderReviews() {
    const list = $('#reviewList');
    if (!list) return;
    if (!state.reviews.length) {
      list.innerHTML = '<div class="admin-empty">No reviews found.</div>';
      return;
    }
    list.innerHTML = state.reviews.map((review) => `
      <div class="card-item review-card">
        <div class="card-item-head">
          <div>
            <strong>${S.escapeHtml(review.guest_name || 'Guest')}</strong>
            <span>${S.escapeHtml(review.booking_ref || 'Verified guest')}</span>
          </div>
          <div class="star-row">${'★'.repeat(Number(review.rating || 5))}${'☆'.repeat(Math.max(0, 5 - Number(review.rating || 5)))}</div>
        </div>
        <div class="review-title">${S.escapeHtml(review.review_title || 'Verified guest review')}</div>
        <div class="review-message">${S.escapeHtml(review.review_message || review.review || '')}</div>
        <div class="review-meta">
          <span class="badge ${review.featured ? 'success' : 'info'}">${review.featured ? 'Featured' : 'Visible'}</span>
          <span class="badge ${review.hidden ? 'blocked' : 'success'}">${review.hidden ? 'Hidden' : 'Public'}</span>
          <span class="badge info">${S.escapeHtml(S.formatDate(review.created_at))}</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-secondary small" data-review-action="feature" data-review-id="${S.escapeHtml(review.id)}">Feature</button>
          <button class="btn btn-secondary small" data-review-action="toggle-hidden" data-review-id="${S.escapeHtml(review.id)}">${review.hidden ? 'Show' : 'Hide'}</button>
          <button class="btn btn-danger small" data-review-action="delete" data-review-id="${S.escapeHtml(review.id)}">Delete</button>
        </div>
      </div>
    `).join('');

    $$('#reviewList [data-review-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.reviewAction;
        const id = button.dataset.reviewId;
        try {
          await S.apiFetch('/api/reviews-list', { method: 'POST', body: JSON.stringify({ action, id }) });
          await loadReviews();
        } catch (err) {
          alert(err.message || 'Review action failed');
        }
      });
    });
  }

  function renderDeveloper() {
    const cards = $('#developerCards');
    if (!cards) return;
    cards.innerHTML = [
      { label: 'API status', value: state.developerHealth.auth, note: 'Admin authentication endpoint' },
      { label: 'Booking database', value: state.developerHealth.bookings, note: 'Supabase bookings table' },
      { label: 'Email configuration', value: state.developerHealth.email, note: 'SMTP settings are set in Vercel' },
      { label: 'System version', value: 'Phase 8 / Admin portal', note: 'Static client + serverless API' },
    ].map((item) => `
      <div class="kpi-card">
        <div class="label"><i class="fa-solid fa-shield-halved"></i>${S.escapeHtml(item.label)}</div>
        <strong style="font-size:1.15rem;">${S.escapeHtml(item.value)}</strong>
        <span>${S.escapeHtml(item.note)}</span>
      </div>
    `).join('');
  }

  function renderAllSettingsFromStore() {
    state.settings = S.loadSettings();
    state.media = S.loadMedia();
    state.amenities = S.loadAmenities();
    state.blockedDates = S.loadBlockedDates();
    state.inquiries = S.loadInquiries();
  }

  function savePricingFromForm() {
    state.settings.weekdayRate = Number($('#weekdayRateInput').value || 0);
    state.settings.weekendRate = Number($('#weekendRateInput').value || 0);
    state.settings.includedGuests = Number($('#includedGuestsInput').value || 1);
    state.settings.extraGuestFee = Number($('#extraGuestFeeInput').value || 0);
    state.settings.petFee = Number($('#petFeeInput').value || 0);
    state.settings.maxGuests = Number($('#maxGuestsInput').value || 1);
    state.settings.guestCapacity = state.settings.maxGuests;
    state.settings.maxPets = Number($('#maxPetsInput').value || 0);
    S.saveSettings(state.settings);
    renderPricing();
    renderSettings();
    renderDashboard();
  }

  function saveGuideFromForm() {
    state.settings.bookingRequirements = S.normalizeTextList($('#bookingRequirementsInput').value);
    state.settings.selfCheckIn = S.normalizeTextList($('#selfCheckInInput').value);
    state.settings.checkout = S.normalizeTextList($('#checkoutInput').value);
    state.settings.houseRules = S.normalizeTextList($('#houseRulesInput').value);
    state.settings.nearby = S.normalizeTextList($('#nearbyInput').value);
    S.saveSettings(state.settings);
    renderGuide();
    renderDashboard();
  }

  function saveLunaFromForm() {
    state.settings.lunaDescription = String($('#lunaDescriptionInput').value || '').trim();
    state.settings.lunaFaqs = parseFaqLines($('#lunaFaqsInput').value);
    state.settings.lunaHouseRules = S.normalizeTextList($('#lunaHouseRulesInput').value);
    state.settings.lunaParking = String($('#lunaParkingInput').value || '').trim();
    state.settings.lunaContact = String($('#lunaContactInput').value || '').trim();
    state.settings.lunaRecommendations = S.normalizeTextList($('#lunaRecommendationsInput').value);
    S.saveSettings(state.settings);
    renderLuna();
    renderDashboard();
  }

  function saveSettingsFromForm() {
    state.settings.propertyName = String($('#propertyNameInput').value || '').trim() || 'Luxury Stay';
    state.settings.name = state.settings.propertyName;
    state.settings.logoUrl = String($('#logoUrlInput').value || '').trim();
    state.settings.area = String($('#addressInput').value || '').trim();
    state.settings.building = String($('#buildingInput').value || '').trim();
    state.settings.contactEmail = String($('#contactEmailInput').value || '').trim();
    state.settings.contactPhone = String($('#contactPhoneInput').value || '').trim();
    state.settings.socials = {
      facebook: String($('#facebookInput').value || '').trim(),
      instagram: String($('#instagramInput').value || '').trim(),
      tiktok: String($('#tiktokInput').value || '').trim(),
      website: String($('#websiteInput').value || '').trim(),
    };
    state.settings.heroImage = String($('#heroImageInput').value || '').trim();
    state.settings.heroImage2 = String($('#heroImage2Input').value || '').trim();
    state.settings.themeStartDay = String($('#themeStartDayInput').value || '06:00').trim() || '06:00';
    state.settings.themeStartNight = String($('#themeStartNightInput').value || '18:00').trim() || '18:00';
    S.saveSettings(state.settings);
    renderSettings();
    renderDashboard();
  }

  function saveMediaFromForm(e) {
    e.preventDefault();
    const type = String($('#mediaTypeInput').value || 'image');
    const src = String($('#mediaSrcInput').value || '').trim();
    const label = String($('#mediaLabelInput').value || '').trim();
    if (!src) {
      alert('Please provide a file path or URL.');
      return;
    }
    state.media.unshift({
      id: S.generateId('media'),
      type,
      src,
      alt: label || src,
      label: label || src,
      featured: false,
      hidden: false,
      poster: type === 'video' ? './assets/9.jpg' : undefined,
    });
    S.saveMedia(state.media);
    $('#mediaForm').reset();
    renderMedia();
  }

  function saveAmenityFromForm(e) {
    e.preventDefault();
    const title = String($('#amenityTitleInput').value || '').trim();
    const category = String($('#amenityCategoryInput').value || 'Other').trim();
    const icon = String($('#amenityIconInput').value || 'default').trim();
    const description = String($('#amenityDescInput').value || '').trim();
    if (!title || !description) {
      alert('Enter an amenity title and description.');
      return;
    }
    if (state.editingAmenityId) {
      const existing = state.amenities.find((item) => item.id === state.editingAmenityId);
      if (existing) {
        existing.title = title;
        existing.category = category;
        existing.icon = icon;
        existing.description = description;
      }
    } else {
      state.amenities.unshift({ id: S.generateId('amenity'), title, category, icon, description, hidden: false, featured: false });
    }
    state.editingAmenityId = null;
    S.saveAmenities(state.amenities);
    $('#amenityForm').reset();
    renderAmenities();
  }

  function saveInquiryToLocalStorage(item) {
    state.inquiries.unshift(item);
    S.saveInquiries(state.inquiries);
  }

  function exportJson() {
    const payload = {
      settings: state.settings,
      media: state.media,
      amenities: state.amenities,
      blockedDates: state.blockedDates,
      inquiries: state.inquiries,
      theme: S.loadTheme(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'luxury-stay-admin-export.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  async function importJson(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.settings) {
      state.settings = S.normalizeSettings(data.settings);
      S.saveSettings(state.settings);
    }
    if (Array.isArray(data.media)) {
      state.media = data.media;
      S.saveMedia(state.media);
    }
    if (Array.isArray(data.amenities)) {
      state.amenities = data.amenities;
      S.saveAmenities(state.amenities);
    }
    if (Array.isArray(data.blockedDates)) {
      state.blockedDates = data.blockedDates;
      S.saveBlockedDates(state.blockedDates);
    }
    if (Array.isArray(data.inquiries)) {
      state.inquiries = data.inquiries;
      S.saveInquiries(state.inquiries);
    }
    renderAll();
  }

  function renderAll() {
    renderDashboard();
    renderBookings();
    renderCalendar();
    renderPricing();
    renderMedia();
    renderAmenities();
    renderGuide();
    renderReviews();
    renderLuna();
    renderInquiries();
    renderSettings();
    renderDeveloper();
  }

  async function init() {
    const authed = await ensureAuth();
    if (!authed) return;
    renderAllSettingsFromStore();
    renderAll();
    await Promise.all([loadBookings(), loadReviews()]);

    $('#saveAllBtn')?.addEventListener('click', () => {
      savePricingFromForm();
      saveGuideFromForm();
      saveLunaFromForm();
      saveSettingsFromForm();
      S.saveMedia(state.media);
      S.saveAmenities(state.amenities);
      S.saveBlockedDates(state.blockedDates);
      S.saveInquiries(state.inquiries);
      alert('All changes saved.');
    });

    $('#exportJsonBtn')?.addEventListener('click', () => exportJson());
    $('#importJsonInput')?.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        await importJson(file);
        alert('Import complete.');
      } catch (err) {
        alert(err.message || 'Could not import JSON.');
      } finally {
        e.target.value = '';
      }
    });

    $('#logoutBtn')?.addEventListener('click', async () => {
      try { await S.apiFetch('/api/admin-logout', { method: 'POST' }); } catch (_) {}
      window.location.replace('./login.html');
    });

    $('#refreshBookingsBtn')?.addEventListener('click', loadBookings);
    $('#refreshReviewsBtn')?.addEventListener('click', loadReviews);
    $('#saveAllBtn')?.addEventListener('click', () => {
      savePricingFromForm();
      saveGuideFromForm();
      saveLunaFromForm();
      saveSettingsFromForm();
    });

    $('#pricingForm')?.addEventListener('submit', (e) => { e.preventDefault(); savePricingFromForm(); });
    $('#guideForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveGuideFromForm(); });
    $('#lunaForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveLunaFromForm(); });
    $('#settingsForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveSettingsFromForm(); });
    $('#mediaForm')?.addEventListener('submit', saveMediaFromForm);
    $('#amenityForm')?.addEventListener('submit', saveAmenityFromForm);
    $('#clearAmenityBtn')?.addEventListener('click', () => { state.editingAmenityId = null; $('#amenityForm').reset(); });

    $('#prevMonthBtn')?.addEventListener('click', () => {
      state.calendarMonth = new Date(Date.UTC(state.calendarMonth.getUTCFullYear(), state.calendarMonth.getUTCMonth() - 1, 1));
      renderCalendar();
    });
    $('#nextMonthBtn')?.addEventListener('click', () => {
      state.calendarMonth = new Date(Date.UTC(state.calendarMonth.getUTCFullYear(), state.calendarMonth.getUTCMonth() + 1, 1));
      renderCalendar();
    });
    $('#addBlockDateBtn')?.addEventListener('click', () => {
      const date = String($('#blockDateInput').value || '').trim();
      if (!date) return alert('Choose a date first.');
      const type = String($('#blockDateType').value || 'blocked');
      const note = String($('#blockDateNote').value || '').trim();
      if (!state.blockedDates.find((item) => item.date === date)) {
        state.blockedDates.unshift({ date, type, note });
      }
      S.saveBlockedDates(state.blockedDates);
      renderCalendar();
    });
    $('#clearBlocksBtn')?.addEventListener('click', clearBlockedDates);
    $('#bookingModalSave')?.addEventListener('click', saveSelectedBookingStatus);
    $('#bookingModalCancel')?.addEventListener('click', cancelSelectedBooking);
    $('#bookingModalInvite')?.addEventListener('click', inviteSelectedBooking);
    $('#closeBookingModal')?.addEventListener('click', closeBookingModal);
    $('#bookingModalBackdrop')?.addEventListener('click', (e) => { if (e.target.id === 'bookingModalBackdrop') closeBookingModal(); });

    $('#sendReviewInviteBtn')?.addEventListener('click', async () => {
      const bookingRef = String($('#reviewInviteRefInput').value || '').trim();
      if (!bookingRef) return alert('Enter a booking reference.');
      try {
        await S.apiFetch('/api/reviews-invite', { method: 'POST', body: JSON.stringify({ bookingRef }) });
        alert('Review invitation sent.');
      } catch (err) {
        alert(err.message || 'Could not send invitation');
      }
    });

    window.addEventListener('hashchange', setNavActive);
    setNavActive();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeBookingModal();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
