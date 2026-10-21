/**
 * Travel The World - Multi-Page Interactivity Engine
 * Powers Holidays, Offers, Dedicated Booking, Contact, Reviews, and Blog
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. Toast Notification Helper
  window.showToast = function (msg, isError = false) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-msg' + (isError ? ' error' : '');
    toast.innerHTML = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 350);
    }, 3800);
  };

  // Helper: Safe HTML Escaping
  const esc = function (str) {
    if (window.TravelStore && typeof window.TravelStore.escapeHtml === 'function') {
      return window.TravelStore.escapeHtml(str);
    }
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 2. Mobile Menu Toggle
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      mobileToggleBtn.classList.toggle('active');
      navMenu.classList.toggle('open');
    });

    // Close when clicking any nav link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      });
    });

    // Close when clicking outside menu
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
        mobileToggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      }
    });
  }

  // 3. Global Search Input in Header
  const searchInput = document.getElementById('searchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  const searchClearBtn = document.getElementById('searchClearBtn');

  if (searchInput && searchDropdown) {
    function getSearchTours() {
      return window.TravelStore ? window.TravelStore.getTours() : [];
    }

    function renderSearchResults(term) {
      const q = term.trim().toLowerCase();
      if (!q) {
        searchDropdown.classList.remove('open');
        searchDropdown.innerHTML = '';
        if (searchClearBtn) searchClearBtn.classList.remove('visible');
        return;
      }

      if (searchClearBtn) searchClearBtn.classList.add('visible');
      const tours = getSearchTours();
      const matches = tours.filter(t =>
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );

      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div class="search-item no-match">No destinations matching "${esc(term)}"</div>`;
      } else {
        searchDropdown.innerHTML = matches.map(m => `
          <a href="booking.html?tour=${encodeURIComponent(m.id)}" class="search-item">
            <img src="${esc(m.thumb || m.img)}" alt="${esc(m.title)}" class="search-thumb">
            <div class="search-info">
              <span class="search-title">${esc(m.title)}</span>
              <span class="search-meta">${esc(m.category)} &bull; ${esc(m.duration)}</span>
            </div>
            <span class="search-price">₹${Number(m.price || 0).toLocaleString('en-IN')}</span>
          </a>
        `).join('');
      }
      searchDropdown.classList.add('open');
    }

    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchDropdown.classList.remove('open');
        searchDropdown.innerHTML = '';
        searchClearBtn.classList.remove('visible');
        searchInput.focus();
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#searchPill')) {
        searchDropdown.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // PAGE: HOLIDAYS.HTML (Tour Filter, Sort & Dynamic Render)
  // =========================================================================
  const holidaysGrid = document.getElementById('holidaysToursGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sortSelect');

  if (holidaysGrid && window.TravelStore) {
    let currentCategory = 'all';
    let currentSort = 'popular';

    function renderHolidays() {
      let tours = [...window.TravelStore.getTours()];

      // Filter by category
      if (currentCategory !== 'all') {
        tours = tours.filter(t => t.category.toLowerCase().includes(currentCategory.toLowerCase()));
      }

      // Sort
      if (currentSort === 'price-low') {
        tours.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'price-high') {
        tours.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'rating') {
        tours.sort((a, b) => b.rating - a.rating);
      }

      if (tours.length === 0) {
        holidaysGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
            <h3>No tour packages found in this category</h3>
            <p style="color: #64748b; margin-top: 0.5rem;">Try choosing another category or clearing filters.</p>
          </div>
        `;
        return;
      }

      holidaysGrid.innerHTML = tours.map(t => `
        <div class="tour-card" data-id="${t.id}">
          <div class="tour-card-media">
            <img src="${t.img}" alt="${t.title}" class="tour-card-img" loading="lazy">
            <span class="tour-card-tag">${t.category}</span>
            <span class="tour-duration-badge"><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${t.duration}</span>
          </div>
          <div class="tour-card-body">
            <div class="tour-card-rating">
              <span class="star"><svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
              <span>${t.rating}</span>
              <span style="color: #94a3b8; font-weight: 500;">(${t.reviewsCount} reviews)</span>
            </div>
            <h3 class="tour-card-title">${t.title}</h3>
            <p class="tour-card-desc">${t.description}</p>
            <div class="tour-card-footer">
              <div class="tour-price-box">
                <span class="price-label">Per Traveler</span>
                <div style="display: flex; align-items: baseline;">
                  <span class="price-figure">₹${t.price.toLocaleString('en-IN')}</span>
                  ${t.originalPrice ? `<span class="price-original">₹${t.originalPrice.toLocaleString('en-IN')}</span>` : ''}
                </div>
              </div>
              <div class="tour-actions-group">
                <button class="btn-sm-outline view-itinerary-btn" data-id="${t.id}">Itinerary</button>
                <a href="booking.html?tour=${t.id}" class="btn-sm-primary">Book Now</a>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Attach Itinerary Modal Triggers
      document.querySelectorAll('.view-itinerary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openItineraryModal(id);
        });
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-category') || 'all';
        renderHolidays();
      });
    });

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderHolidays();
      });
    }

    renderHolidays();

    // Custom Trip Planner Logic on holidays.html
    const tripOptionsList = document.getElementById('customTripOptionsList');
    const tripGuestsSelect = document.getElementById('customTripGuests');
    const tripTotalPriceEl = document.getElementById('customTripTotalPrice');
    const btnBookCustomTrip = document.getElementById('btnBookCustomTrip');

    if (tripOptionsList && window.TravelStore) {
      const allTours = window.TravelStore.getTours();
      tripOptionsList.innerHTML = allTours.slice(0, 6).map((t, idx) => `
        <label style="background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <input type="checkbox" class="trip-planner-cb" data-id="${t.id}" data-price="${t.price}" ${idx < 2 ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
            <div>
              <strong style="font-size: 0.95rem; display: block;">${t.title}</strong>
              <span style="font-size: 0.78rem; color: #94a3b8;">${t.duration}</span>
            </div>
          </div>
          <span style="font-family: var(--font-heading); font-weight: 800; color: #38bdf8;">₹${t.price.toLocaleString('en-IN')}</span>
        </label>
      `).join('');

      function calcCustomTrip() {
        const guests = tripGuestsSelect ? parseInt(tripGuestsSelect.value, 10) || 1 : 1;
        let totalPerPerson = 0;
        let selectedTours = [];

        document.querySelectorAll('.trip-planner-cb').forEach(cb => {
          if (cb.checked) {
            totalPerPerson += parseInt(cb.getAttribute('data-price'), 10) || 0;
            selectedTours.push(cb.getAttribute('data-id'));
            cb.closest('label').style.borderColor = '#38bdf8';
            cb.closest('label').style.background = 'rgba(56, 189, 248, 0.12)';
          } else {
            cb.closest('label').style.borderColor = 'rgba(255,255,255,0.15)';
            cb.closest('label').style.background = 'rgba(255,255,255,0.06)';
          }
        });

        const grandTotal = totalPerPerson * guests;
        if (tripTotalPriceEl) tripTotalPriceEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
        return { grandTotal, selectedTours, guests };
      }

      document.querySelectorAll('.trip-planner-cb').forEach(cb => cb.addEventListener('change', calcCustomTrip));
      if (tripGuestsSelect) tripGuestsSelect.addEventListener('change', calcCustomTrip);
      calcCustomTrip();

      if (btnBookCustomTrip) {
        btnBookCustomTrip.addEventListener('click', () => {
          const plan = calcCustomTrip();
          const primaryTour = plan.selectedTours[0] || 'uluwatu';
          window.location.href = `booking.html?tour=${primaryTour}`;
        });
      }
    }
  }

  // Itinerary Details Modal
  function openItineraryModal(tourId) {
    if (!window.TravelStore) return;
    const tour = window.TravelStore.getTourById(tourId);
    if (!tour) return;

    let modal = document.getElementById('itineraryModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'itineraryModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const highlightsList = (tour.highlights || []).map(h => `<li><svg class="ui-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> ${esc(h)}</li>`).join('');
    const itineraryList = (tour.itinerary || []).map(item => `
      <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
        <span style="font-family: monospace; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 0.2rem 0.5rem; border-radius: 4px; height: fit-content;">${esc(item.time)}</span>
        <div>
          <h5 style="font-weight: 700; margin-bottom: 0.2rem;">${esc(item.title)}</h5>
          <p style="font-size: 0.88rem; color: #64748b; line-height: 1.5;">${esc(item.desc)}</p>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 680px;">
        <button class="modal-close-btn" onclick="document.getElementById('itineraryModal').classList.remove('active')">&times;</button>
        <div style="padding: 2rem;">
          <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #2563eb;">${esc(tour.category)}</span>
          <h3 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin: 0.3rem 0 1rem;">${esc(tour.title)}</h3>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <h5 style="font-weight: 800; margin-bottom: 0.6rem;">Key Highlights:</h5>
            <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.88rem; color: #334155;">
              ${highlightsList}
            </ul>
          </div>

          <h5 style="font-weight: 800; margin-bottom: 1rem;">Detailed Day Schedule:</h5>
          <div style="border-left: 2px dashed #cbd5e1; padding-left: 1.25rem; margin-left: 0.5rem;">
            ${itineraryList}
          </div>

          <div style="margin-top: 2rem; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 1.25rem;">
            <div>
              <span style="font-size: 0.8rem; color: #64748b;">Total Price</span>
              <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 800; color: #0f172a;">₹${Number(tour.price || 0).toLocaleString('en-IN')} <span style="font-size: 0.8rem; font-weight: 500; color: #64748b;">/ person</span></div>
            </div>
            <a href="booking.html?tour=${encodeURIComponent(tour.id)}" class="btn btn-dark-pill" style="padding: 0.65rem 1.5rem;">Proceed to Book &rarr;</a>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  // =========================================================================
  // PAGE: OFFERS.HTML (Countdown Timer & Copy Promo Code)
  // =========================================================================
  const countDays = document.getElementById('countDays');
  const countHours = document.getElementById('countHours');
  const countMins = document.getElementById('countMins');
  const countSecs = document.getElementById('countSecs');

  if (countDays && countHours && countMins && countSecs) {
    // 3 days festive countdown
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(23, 59, 59);

    function updateTimer() {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff > 0) {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        countDays.textContent = String(d).padStart(2, '0');
        countHours.textContent = String(h).padStart(2, '0');
        countMins.textContent = String(m).padStart(2, '0');
        countSecs.textContent = String(s).padStart(2, '0');
      }
    }
    setInterval(updateTimer, 1000);
    updateTimer();
  }

  // 1-Click Promo Code Copy Buttons
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          showToast(`Promo code <strong>${code}</strong> copied to clipboard! Paste it at checkout.`);
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = 'Copy Code';
          }, 2000);
        }).catch(() => {
          showToast(`Coupon: ${code}`);
        });
      }
    });
  });

  // =========================================================================
  // PAGE: BOOKING.HTML (Dedicated Multi-Step Engine with Dynamic State)
  // =========================================================================
  const bookingPageForm = document.getElementById('dedicatedBookingForm');
  if (bookingPageForm && window.TravelStore) {
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedTourId = urlParams.get('tour') || 'uluwatu';

    const tourSelect = document.getElementById('bookTourSelect');
    const guestsSelect = document.getElementById('bookGuestsSelect');
    const dateInput = document.getElementById('bookDateInput');
    const promoInput = document.getElementById('checkoutPromoInput');
    const applyPromoBtn = document.getElementById('btnApplyPromo');

    const summaryTourImg = document.getElementById('summaryTourImg');
    const summaryTourName = document.getElementById('summaryTourName');
    const summaryTourMeta = document.getElementById('summaryTourMeta');
    const summaryBasePrice = document.getElementById('summaryBasePrice');
    const summaryAddonsPrice = document.getElementById('summaryAddonsPrice');
    const summaryDiscountRow = document.getElementById('summaryDiscountRow');
    const summaryDiscountVal = document.getElementById('summaryDiscountVal');
    const summaryTotalAmount = document.getElementById('summaryTotalAmount');

    // Add-on checkboxes
    const addonCheckboxes = document.querySelectorAll('.addon-checkbox');

    let currentDiscount = 0;
    let appliedCouponCode = '';

    // Populate Tour Dropdown
    const allTours = window.TravelStore.getTours();
    if (tourSelect) {
      tourSelect.innerHTML = allTours.map(t => `
        <option value="${t.id}" ${t.id === preselectedTourId ? 'selected' : ''}>
          ${t.title} (₹${t.price.toLocaleString('en-IN')} / person)
        </option>
      `).join('');
    }

    // Set minimum date to tomorrow
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    // Calculate & Update Live Pricing
    function calculateBookingTotal() {
      const selectedId = tourSelect ? tourSelect.value : preselectedTourId;
      const tour = window.TravelStore.getTourById(selectedId) || allTours[0];
      const guests = guestsSelect ? parseInt(guestsSelect.value, 10) || 1 : 1;

      // Update Tour Summary Header
      if (summaryTourImg && tour) summaryTourImg.src = tour.thumb || tour.img;
      if (summaryTourName && tour) summaryTourName.textContent = tour.title;
      if (summaryTourMeta && tour) summaryTourMeta.textContent = `${tour.category} • ${tour.duration}`;

      const baseSubtotal = tour ? tour.price * guests : 850 * guests;
      if (summaryBasePrice) summaryBasePrice.textContent = `₹${baseSubtotal.toLocaleString('en-IN')}`;

      // Addons
      let addonsSubtotal = 0;
      addonCheckboxes.forEach(cb => {
        if (cb.checked) {
          addonsSubtotal += parseInt(cb.getAttribute('data-price'), 10) || 0;
          cb.closest('.addon-item')?.classList.add('selected');
        } else {
          cb.closest('.addon-item')?.classList.remove('selected');
        }
      });
      if (summaryAddonsPrice) summaryAddonsPrice.textContent = `₹${addonsSubtotal.toLocaleString('en-IN')}`;

      const grossTotal = baseSubtotal + addonsSubtotal;

      // Re-validate coupon if applied
      if (appliedCouponCode) {
        const couponCheck = window.TravelStore.applyCoupon(appliedCouponCode, grossTotal);
        if (couponCheck.valid) {
          currentDiscount = couponCheck.discount;
          if (summaryDiscountRow) summaryDiscountRow.style.display = 'flex';
          if (summaryDiscountVal) summaryDiscountVal.textContent = `-₹${currentDiscount.toLocaleString('en-IN')}`;
        } else {
          currentDiscount = 0;
          appliedCouponCode = '';
          if (summaryDiscountRow) summaryDiscountRow.style.display = 'none';
        }
      } else {
        if (summaryDiscountRow) summaryDiscountRow.style.display = 'none';
      }

      const finalNet = Math.max(0, grossTotal - currentDiscount);
      if (summaryTotalAmount) summaryTotalAmount.textContent = `₹${finalNet.toLocaleString('en-IN')}`;

      return { tour, guests, grossTotal, currentDiscount, finalNet };
    }

    if (tourSelect) tourSelect.addEventListener('change', calculateBookingTotal);
    if (guestsSelect) guestsSelect.addEventListener('change', calculateBookingTotal);
    addonCheckboxes.forEach(cb => cb.addEventListener('change', calculateBookingTotal));

    // Coupon Application
    if (applyPromoBtn && promoInput) {
      applyPromoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = promoInput.value.trim().toUpperCase();
        if (!code) {
          showToast('Please enter a coupon code.', true);
          return;
        }

        const totals = calculateBookingTotal();
        const res = window.TravelStore.applyCoupon(code, totals.grossTotal);

        if (res.valid) {
          appliedCouponCode = res.code;
          currentDiscount = res.discount;
          showToast(`Coupon <strong>${res.code}</strong> applied! You saved ₹${res.discount.toLocaleString('en-IN')}.`);
          calculateBookingTotal();
        } else {
          showToast(`${res.message}`, true);
        }
      });
    }

    calculateBookingTotal();

    // Form Submission -> Save to TravelStore & Show Voucher Modal
    bookingPageForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const totals = calculateBookingTotal();
      const guestName = document.getElementById('bookFullName')?.value || 'Guest';
      const guestEmail = document.getElementById('bookEmailAddress')?.value || '';
      const guestPhone = document.getElementById('bookPhone')?.value || '';
      const guestHotel = document.getElementById('bookHotelPickup')?.value || '';
      const tourDate = dateInput ? dateInput.value : '';
      const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value || 'UPI / GPay';
      const specialNotes = document.getElementById('bookSpecialNotes')?.value || '';

      // Save Booking to LocalStorage Store
      const savedBooking = window.TravelStore.addBooking({
        tourId: totals.tour.id,
        tourTitle: totals.tour.title,
        customerName: guestName,
        email: guestEmail,
        phone: guestPhone,
        hotel: guestHotel,
        date: tourDate,
        guests: totals.guests,
        basePrice: totals.tour.price,
        totalAmount: totals.finalNet,
        paymentMethod: paymentMode,
        specialRequests: specialNotes
      });

      // Show Voucher Modal
      openVoucherConfirmationModal(savedBooking);
      bookingPageForm.reset();
      appliedCouponCode = '';
      currentDiscount = 0;
      calculateBookingTotal();
    });
  }

  // Confirmation Voucher Popup
  function openVoucherConfirmationModal(booking) {
    let modal = document.getElementById('voucherModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'voucherModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="voucher-modal-box">
        <div class="voucher-header">
          <div>
            <span style="font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; opacity: 0.8;">Verified Reservation</span>
            <h3 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; margin: 0.2rem 0;">Booking Confirmed!</h3>
            <span style="font-family: monospace; font-size: 0.95rem; color: #38bdf8;">Booking ID: ${esc(booking.id)}</span>
          </div>
          <button class="modal-close-btn" style="position: static; color: #fff;" onclick="document.getElementById('voucherModal').classList.remove('active')">&times;</button>
        </div>
        <div class="voucher-body">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.75rem 1rem; border-radius: 8px; color: #065f46;">
            <span><svg class="ui-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>
            <span style="font-size: 0.88rem; font-weight: 600;">E-Ticket generated & sent to <strong>${esc(booking.email)}</strong></span>
          </div>

          <h4 style="font-weight: 800; font-size: 1.2rem; margin-bottom: 0.25rem;">${esc(booking.tourTitle)}</h4>
          <span style="font-size: 0.85rem; color: #64748b;">Bali Island of the Gods, Indonesia</span>

          <div class="voucher-details-grid">
            <div>
              <span class="voucher-field-label">Lead Traveler</span>
              <div class="voucher-field-val">${esc(booking.customerName)}</div>
            </div>
            <div>
              <span class="voucher-field-label">Tour Date</span>
              <div class="voucher-field-val"><svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${esc(booking.date)}</div>
            </div>
            <div>
              <span class="voucher-field-label">Party Size</span>
              <div class="voucher-field-val"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${Number(booking.guests || 1)} Person(s)</div>
            </div>
            <div>
              <span class="voucher-field-label">Pickup Location</span>
              <div class="voucher-field-val"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${esc(booking.hotel)}</div>
            </div>
            <div>
              <span class="voucher-field-label">Payment Mode</span>
              <div class="voucher-field-val"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8"/></svg> ${esc(booking.paymentMethod)}</div>
            </div>
            <div>
              <span class="voucher-field-label">Total Amount Paid</span>
              <div class="voucher-field-val" style="color: #059669; font-size: 1.2rem;">₹${Number(booking.totalAmount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button onclick="window.print()" class="btn-sm-outline" style="flex: 1; padding: 0.75rem; text-align: center;"><svg class="ui-icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print Voucher</button>
            <a href="holidays.html" class="btn-sm-primary" style="flex: 1; padding: 0.75rem; text-align: center;">Explore More Tours &rarr;</a>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // =========================================================================
  // PAGE: CONTACT.HTML (Inquiry Form Submission & FAQ Accordion)
  // =========================================================================
  const contactForm = document.getElementById('conciergeInquiryForm');
  if (contactForm && window.TravelStore) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value || 'Guest';
      const email = document.getElementById('contactEmail')?.value || '';
      const phone = document.getElementById('contactPhone')?.value || '';
      const subject = document.getElementById('contactSubject')?.value || 'General Inquiry';
      const message = document.getElementById('contactMessage')?.value || '';

      window.TravelStore.addInquiry({
        customerName: name,
        email,
        phone,
        subject,
        message
      });

      showToast(`Thank you ${name}! Your inquiry has been dispatched to our Bali concierge. We will respond within 2 hours.`);
      contactForm.reset();
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.closest('.faq-item');
      if (parent) {
        parent.classList.toggle('active');
      }
    });
  });

  // =========================================================================
  // PAGE: REVIEWS.HTML (Reviews Filter & Submit Review Modal)
  // =========================================================================
  const reviewsContainer = document.getElementById('reviewsListContainer');
  const submitReviewForm = document.getElementById('submitReviewForm');

  if (reviewsContainer && window.TravelStore) {
    function renderReviews() {
      const reviews = window.TravelStore.getReviews().filter(r => r.approved !== false);
      reviewsContainer.innerHTML = reviews.map(r => `
        <div class="review-bubble" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.8rem; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
            <div style="color: #f59e0b; font-size: 1.1rem;">${/* star */ '&#9733;'.repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)))}</div>
            <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">${esc(r.date || 'Recent')}</span>
          </div>
          <p style="font-size: 0.95rem; line-height: 1.6; color: #334155; margin-bottom: 1.25rem;">"${esc(r.comment)}"</p>
          <div style="display: flex; align-items: center; gap: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">
              ${esc(r.avatar || 'TT')}
            </div>
            <div>
              <h5 style="font-weight: 700; margin-bottom: 0.15rem;">${esc(r.reviewerName || r.author || r.name)}</h5>
              <span style="font-size: 0.78rem; color: #64748b;">${esc(r.origin || 'India')} &bull; ${esc(r.travelType || 'Verified Traveler')}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    renderReviews();

    if (submitReviewForm) {
      submitReviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reviewerName = document.getElementById('revName')?.value || 'Guest';
        const origin = document.getElementById('revOrigin')?.value || 'India';
        const rating = parseInt(document.getElementById('revRating')?.value, 10) || 5;
        const comment = document.getElementById('revComment')?.value || '';
        const travelType = document.getElementById('revTravelType')?.value || 'Couple Holiday';

        window.TravelStore.addReview({
          reviewerName,
          origin,
          rating,
          comment,
          travelType
        });

        showToast('Thank you! Your review has been submitted and posted.');
        submitReviewForm.reset();
        document.getElementById('writeReviewModal')?.classList.remove('active');
        renderReviews();
      });
    }
  }

  // =========================================================================
  // PAGE: OFFERS.HTML (Dynamic Coupons Grid & Copy Code)
  // =========================================================================
  const offersGrid = document.getElementById('offersCouponsGrid');
  if (offersGrid && window.TravelStore) {
    function renderOffersCoupons() {
      const coupons = window.TravelStore.getCoupons();
      if (coupons.length === 0) {
        offersGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No active promo codes currently.</p>';
        return;
      }
      offersGrid.innerHTML = coupons.map(c => `
        <div class="coupon-card">
          <span class="coupon-badge">${c.discountPercent ? `FLAT ${c.discountPercent}% OFF` : `₹${c.discountFlat} INSTANT OFF`}</span>
          <h4 class="coupon-title">${c.code}</h4>
          <p class="coupon-desc">${c.description || 'Special promo discount on tour bookings.'}</p>
          <div class="coupon-action-row">
            <span class="coupon-code-text">${c.code}</span>
            <button class="btn-copy-code" data-code="${c.code}">Copy Code</button>
          </div>
        </div>
      `).join('');

      offersGrid.querySelectorAll('.btn-copy-code').forEach(btn => {
        btn.addEventListener('click', () => {
          const code = btn.getAttribute('data-code');
          if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
              btn.textContent = 'Copied!';
              window.showToast(`Promo code <strong>${code}</strong> copied to clipboard! Paste it at checkout.`);
              setTimeout(() => { btn.textContent = 'Copy Code'; }, 2000);
            }).catch(() => {
              window.showToast(`Promo code: <strong>${code}</strong>`);
            });
          } else {
            window.showToast(`Promo code: <strong>${code}</strong>`);
          }
        });
      });
    }
    renderOffersCoupons();
  }

  // =========================================================================
  // DYNAMIC FAQS ACCORDION (contact.html)
  // =========================================================================
  const faqsContainer = document.getElementById('faqsAccordionContainer');
  if (faqsContainer && window.TravelStore) {
    const settings = window.TravelStore.getSettings();
    const faqs = settings.faqs || [];
    if (faqs.length > 0) {
      faqsContainer.innerHTML = faqs.map((f, idx) => `
        <div class="faq-item ${idx === 0 ? 'active' : ''}">
          <div class="faq-question">
            <span>${f.question || f.q}</span>
            <span style="font-size: 1.2rem;">▾</span>
          </div>
          <div class="faq-answer">${f.answer || f.a}</div>
        </div>
      `).join('');

      faqsContainer.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
          const parent = q.closest('.faq-item');
          if (parent) parent.classList.toggle('active');
        });
      });
    }
  }

  // =========================================================================
  // DYNAMIC ABOUT PAGE (about.html)
  // =========================================================================
  if (window.TravelStore) {
    const settings = window.TravelStore.getSettings();
    const storyLead = document.getElementById('aboutStoryLead');
    if (storyLead && settings.aboutStory) {
      storyLead.textContent = settings.aboutStory;
    }
    const statTravelers = document.getElementById('aboutStatTravelersVal');
    if (statTravelers && settings.statTravelers) statTravelers.textContent = settings.statTravelers;
    const statTours = document.getElementById('aboutStatToursVal');
    if (statTours && settings.statTours) statTours.textContent = settings.statTours;
    const statRating = document.getElementById('aboutStatRatingVal');
    if (statRating && settings.statRating) statRating.textContent = settings.statRating;
  }

  // =========================================================================
  // PAGE: BLOG.HTML (Dynamic Articles & Reader Modal)
  // =========================================================================
  function openArticleReaderModal(title, excerpt, tag, img) {
    let modal = document.getElementById('blogModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'blogModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-box" style="max-width: 720px; max-height: 85vh; overflow-y: auto;">
        <button class="modal-close-btn" onclick="document.getElementById('blogModal').classList.remove('active')">&times;</button>
        <img src="${img}" style="width: 100%; height: 260px; object-fit: cover; border-radius: 16px 16px 0 0;" alt="${title}">
        <div style="padding: 2rem;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #2563eb; text-transform: uppercase;">${tag}</span>
          <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; margin: 0.4rem 0 1rem; line-height: 1.25;">${title}</h2>
          <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 1.5rem; display: flex; gap: 1rem;">
            <span><svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> October 2026</span>
            <span><svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg> Travel Concierge Desk</span>
            <span><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 5 Min Read</span>
          </div>
          <div style="font-size: 0.98rem; line-height: 1.8; color: #334155;">
            <p style="margin-bottom: 1rem; font-weight: 600;">${excerpt}</p>
            <p style="margin-bottom: 1rem;">Bali continues to captivate travelers with its dramatic volcanic peaks, terraced emerald hills, and spiritual ocean temples. When planning your visit from India or abroad, having a structured itinerary with certified local chauffeurs ensures zero stress with local taxi cartels or peak hour bottlenecks.</p>
            <h4 style="font-weight: 800; margin: 1.5rem 0 0.5rem;">Insider Tips from Our Local Concierge:</h4>
            <ul style="padding-left: 1.25rem; margin-bottom: 1.5rem;">
              <li style="margin-bottom: 0.5rem;"><strong>Best Sunrise Timing:</strong> Always book Mount Batur treks with pre-arranged hotel pickups at 02:00 AM to secure the prime viewing rim.</li>
              <li style="margin-bottom: 0.5rem;"><strong>Temple Dress Code:</strong> Modesty is respected at all nine Balinese directional temples. Sarongs and sashes are provided complimentary on all our guided tours.</li>
              <li style="margin-bottom: 0.5rem;"><strong>Indian Cuisine Options:</strong> High quality North and South Indian vegetarian meals are abundant in Seminyak, Nusa Dua, and Ubud.</li>
            </ul>
            <p>For bespoke reservations or tailored itineraries, feel free to contact our round-the-clock Bali assistance desk.</p>
          </div>
          <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
            <a href="holidays.html" class="btn btn-dark-pill">Explore Related Tour Packages &rarr;</a>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  const mainBlogGrid = document.getElementById('mainBlogGrid');
  if (mainBlogGrid && window.TravelStore) {
    function renderDynamicBlogs() {
      const blogs = window.TravelStore.getBlogs();
      if (blogs.length === 0) {
        mainBlogGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No articles published yet.</p>';
        return;
      }
      mainBlogGrid.innerHTML = blogs.map(b => `
        <article class="blog-card" data-id="${b.id}">
          <div class="blog-media">
            <img src="${b.image || 'assets/images/featured-uluwatu.jpg'}" alt="${b.title}" class="blog-img" loading="lazy">
            <span class="tour-card-tag">${b.category || 'Travel Guide'}</span>
          </div>
          <div class="blog-body">
            <div class="blog-meta-row">
              <span><svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${b.date || 'Recent'}</span>
              <span><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${b.readTime || '5 Min Read'}</span>
            </div>
            <h3 class="blog-title">${b.title}</h3>
            <p class="blog-excerpt">${b.excerpt || b.summary || ''}</p>
            <div style="margin-top: auto; border-top: 1px solid var(--color-border-light); padding-top: 1rem;">
              <button class="btn-sm-primary read-article-btn" data-id="${b.id}" style="width: 100%; text-align: center;">Read Full Guide &rarr;</button>
            </div>
          </div>
        </article>
      `).join('');

      mainBlogGrid.querySelectorAll('.read-article-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const card = btn.closest('.blog-card');
          const title = card.querySelector('.blog-title')?.textContent || 'Travel Guide';
          const excerpt = card.querySelector('.blog-excerpt')?.textContent || '';
          const tag = card.querySelector('.tour-card-tag')?.textContent || 'Guide';
          const img = card.querySelector('img')?.src || '';

          openArticleReaderModal(title, excerpt, tag, img);
        });
      });
    }
    renderDynamicBlogs();
  } else {
    // Static fallback triggers
    document.querySelectorAll('.read-article-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.blog-card');
        if (!card) return;
        const title = card.querySelector('.blog-title')?.textContent || 'Travel Guide';
        const excerpt = card.querySelector('.blog-excerpt')?.textContent || '';
        const tag = card.querySelector('.tour-card-tag')?.textContent || 'Guide';
        const img = card.querySelector('img')?.src || '';

        openArticleReaderModal(title, excerpt, tag, img);
      });
    });
  }
});
