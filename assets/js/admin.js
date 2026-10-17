/**
 * Travel The World - Admin Dashboard Controller
 * Full CRUD for Tours, Bookings, Inquiries, Reviews, Coupons, and Settings
 * Real-time reactive synchronization with TravelStore
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  if (!window.TravelStore) {
    console.error('TravelStore not loaded');
    return;
  }

  // 1. Toast Notification Helper for Admin
  function showAdminToast(msg, isError = false) {
    let container = document.getElementById('adminToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'adminToastContainer';
      document.body.appendChild(container);
    }
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '999999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    container.style.pointerEvents = 'none';
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${isError ? '#ef4444' : '#0f172a'};
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    `;
    toast.innerHTML = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  // 2. Real-time Clock in Header
  const headerDateEl = document.getElementById('headerLiveDate');
  if (headerDateEl) {
    function updateClock() {
      const now = new Date();
      headerDateEl.textContent = '🕒 ' + now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    setInterval(updateClock, 30000);
    updateClock();
  }

  // 3. Mobile Sidebar Toggle
  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('mobileSidebarToggle');
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    // Close on click outside on mobile / tablet
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  // 4. Tab Navigation Switching
  const navLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');
  const headerPageTitle = document.getElementById('headerPageTitle');

  function switchTab(tabId) {
    navLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
        if (headerPageTitle) headerPageTitle.textContent = link.textContent.trim();
      } else {
        link.classList.remove('active');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    if (sidebar) sidebar.classList.remove('open');

    // Render corresponding section data
    renderAll();
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // =========================================================================
  // DASHBOARD TAB RENDERING & TIMEFRAME FILTER ENGINE
  // =========================================================================
  let currentDashboardPeriod = 'all';

  // Attach timeframe filter button events
  const timeframeFilterButtons = document.querySelectorAll('.btn-time-filter');
  timeframeFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      timeframeFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDashboardPeriod = btn.getAttribute('data-period') || 'all';
      renderDashboard(currentDashboardPeriod);
    });
  });

  function renderDashboard(filterPeriod = currentDashboardPeriod) {
    const stats = window.TravelStore.getStats(filterPeriod);

    // Update active filter label
    const filterNameEl = document.getElementById('dashboardActiveFilterName');
    if (filterNameEl) {
      const periodLabels = {
        '1d': 'Showing: Last 24 Hours Performance (1 Day)',
        '7d': 'Showing: Past 7 Days Performance',
        'month': 'Showing: Current Month Performance (October 2026)',
        'all': 'Showing: All Time Performance'
      };
      filterNameEl.textContent = periodLabels[filterPeriod] || 'Showing: All Time Performance';
    }

    // KPI Cards
    const kpiRevenue = document.getElementById('kpiTotalRevenue');
    const kpiRevenueSub = document.getElementById('kpiRevenueSub');
    const kpiBookings = document.getElementById('kpiTotalBookings');
    const kpiBookingsSub = document.getElementById('kpiBookingsSub');
    const kpiActiveUsers = document.getElementById('kpiActiveUsers');
    const kpiTotalUsers = document.getElementById('kpiTotalUsers');
    const kpiInquiries = document.getElementById('kpiNewInquiries');
    const kpiInquiriesSub = document.getElementById('kpiInquiriesSub');
    const kpiRating = document.getElementById('kpiAvgRating');
    const kpiRatingSub = document.getElementById('kpiRatingSub');

    // Badges
    const badgeInquiries = document.getElementById('badgeInquiriesCount');
    const badgeActiveUsersLive = document.getElementById('badgeActiveUsersLive');
    const badgeLiveActiveCount = document.getElementById('badgeLiveActiveCount');
    const usersLiveCounterBadge = document.getElementById('usersLiveCounterBadge');

    if (kpiRevenue) kpiRevenue.textContent = `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`;
    if (kpiRevenueSub) {
      kpiRevenueSub.innerHTML = `<span>↑ Active</span> <span style="color: #64748b; font-weight: normal;">for ${filterPeriod.toUpperCase()}</span>`;
    }

    if (kpiBookings) kpiBookings.textContent = stats.totalBookings;
    if (kpiBookingsSub) {
      kpiBookingsSub.textContent = `● ${stats.confirmedBookings} Confirmed, ${stats.pendingBookings} Pending`;
    }

    if (kpiActiveUsers) kpiActiveUsers.textContent = stats.activeUsers;
    if (kpiTotalUsers) kpiTotalUsers.textContent = stats.totalUsers;
    if (kpiInquiries) kpiInquiries.textContent = stats.totalInquiries;
    if (kpiInquiriesSub) {
      kpiInquiriesSub.textContent = `● ${stats.newInquiries} pending response`;
    }

    if (kpiRating) kpiRating.textContent = `${stats.avgRating} ★`;
    if (kpiRatingSub) {
      kpiRatingSub.textContent = `Average Order: ₹${(stats.avgOrderValue || 0).toLocaleString('en-IN')}`;
    }

    if (badgeInquiries) {
      badgeInquiries.textContent = stats.newInquiries;
      badgeInquiries.style.display = stats.newInquiries > 0 ? 'inline-block' : 'none';
    }
    if (badgeActiveUsersLive) {
      badgeActiveUsersLive.textContent = `${stats.activeUsers} LIVE`;
    }
    if (badgeLiveActiveCount) {
      badgeLiveActiveCount.textContent = `${stats.activeUsers} Online`;
    }
    if (usersLiveCounterBadge) {
      usersLiveCounterBadge.innerHTML = `<span class="live-pulse-dot"></span> ${stats.activeUsers} Online Now`;
    }

    // Dynamic Chart Header & Bars
    const chartTimeframeLabel = document.getElementById('chartTimeframeLabel');
    if (chartTimeframeLabel) chartTimeframeLabel.textContent = stats.chartTitle;

    const chartContainer = document.getElementById('dashboardRevenueChart');
    if (chartContainer && Array.isArray(stats.chartData)) {
      chartContainer.innerHTML = stats.chartData.map(item => `
        <div class="chart-bar-col">
          <div class="chart-bar" style="height: ${item.height}px; ${item.isCurrent ? 'background: #2563eb;' : ''}" title="${item.label}: ₹${item.amount.toLocaleString('en-IN')}"></div>
          <span class="chart-month" style="${item.isCurrent ? 'font-weight: 800; color: #2563eb;' : ''}">${item.label}</span>
        </div>
      `).join('');
    }

    const topTourBadge = document.getElementById('dashboardTopTourBadge');
    if (topTourBadge) {
      topTourBadge.innerHTML = `🚀 Highest performing package: <strong>${stats.topPerformingTour}</strong>`;
    }

    const avgOrderBadge = document.getElementById('dashboardAvgOrderBadge');
    if (avgOrderBadge) {
      avgOrderBadge.innerHTML = `Average Order Value: <strong>₹${(stats.avgOrderValue || 0).toLocaleString('en-IN')}</strong>`;
    }

    // Render Live Active Travelers Feed
    const liveTravelersList = document.getElementById('liveTravelersList');
    if (liveTravelersList) {
      const allUsers = window.TravelStore.getUsers();
      const onlineUsers = allUsers.filter(u => u.isOnline).slice(0, 5);
      if (onlineUsers.length === 0) {
        liveTravelersList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">No online users right now.</p>';
      } else {
        liveTravelersList.innerHTML = onlineUsers.map(u => `
          <div class="live-traveler-item">
            <div class="live-traveler-left">
              <div class="user-avatar-badge">${(u.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
              <div>
                <div style="font-weight: 700; color: #0f172a; font-size: 0.85rem;">${u.name}</div>
                <div style="font-size: 0.72rem; color: #64748b;">📍 ${u.location} &bull; ${u.lastActive}</div>
              </div>
            </div>
            <div>
              <span class="status-online" title="${u.currentActivity}">
                <span class="live-pulse-dot"></span> ${u.currentActivity || 'Online'}
              </span>
            </div>
          </div>
        `).join('');
      }
    }

    // Recent Bookings Table (Filtered by timeframe)
    const recentBookingsTbody = document.getElementById('recentBookingsTableBody');
    if (recentBookingsTbody) {
      const bookingsToShow = (stats.filteredBookings || window.TravelStore.getBookings()).slice(0, 6);
      if (bookingsToShow.length === 0) {
        recentBookingsTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #94a3b8;">No customer reservations in this timeframe.</td></tr>';
      } else {
        recentBookingsTbody.innerHTML = bookingsToShow.map(b => `
          <tr>
            <td><strong style="font-family: monospace; color: #2563eb;">${b.id}</strong></td>
            <td>
              <div style="font-weight: 700;">${b.customerName}</div>
              <div style="font-size: 0.75rem; color: #64748b;">${b.email}</div>
            </td>
            <td>${b.tourTitle}</td>
            <td>📅 ${b.date}</td>
            <td><strong style="color: #0f172a;">₹${(b.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
            <td>
              <span class="status-pill status-${(b.status || '').toLowerCase()}">${b.status}</span>
            </td>
          </tr>
        `).join('');
      }
    }

    // Recent Inquiries List (Filtered by timeframe)
    const recentInquiriesList = document.getElementById('recentInquiriesList');
    if (recentInquiriesList) {
      const inqs = (stats.filteredInquiries || window.TravelStore.getInquiries()).slice(0, 3);
      if (inqs.length === 0) {
        recentInquiriesList.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">No inquiries in this timeframe.</p>';
      } else {
        recentInquiriesList.innerHTML = inqs.map(i => `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
              <strong style="font-size: 0.88rem;">${i.customerName}</strong>
              <span class="status-pill status-${(i.status || '').toLowerCase()}">${i.status}</span>
            </div>
            <div style="font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 0.2rem;">${i.subject}</div>
            <p style="font-size: 0.75rem; color: #64748b; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0;">
              ${i.message}
            </p>
          </div>
        `).join('');
      }
    }
  }

  // =========================================================================
  // TRAVELERS & REGISTERED USERS TAB
  // =========================================================================
  const usersTableBody = document.getElementById('adminUsersTableBody');
  const searchUsersInput = document.getElementById('searchUsersInput');
  const userFilterButtons = document.querySelectorAll('#userFilterButtons button');
  let currentUserFilter = 'all';

  if (userFilterButtons) {
    userFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        userFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentUserFilter = btn.getAttribute('data-user-filter') || 'all';
        renderUsersTable();
      });
    });
  }

  if (searchUsersInput) {
    searchUsersInput.addEventListener('input', () => {
      renderUsersTable();
    });
  }

  function renderUsersTable() {
    if (!usersTableBody) return;
    const q = (searchUsersInput ? searchUsersInput.value : '').toLowerCase().trim();
    let users = window.TravelStore.getUsers();

    if (currentUserFilter === 'online') {
      users = users.filter(u => u.isOnline);
    } else if (currentUserFilter === 'booked') {
      users = users.filter(u => (u.bookingsCount || 0) > 0);
    }

    if (q) {
      users = users.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.location && u.location.toLowerCase().includes(q))
      );
    }

    if (users.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No travelers found.</td></tr>';
      return;
    }

    usersTableBody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div class="user-avatar-badge">${(u.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
            <div>
              <strong style="font-size: 0.95rem; color: #0f172a; display: block;">${u.name}</strong>
              <span style="font-size: 0.75rem; color: #64748b;">ID: ${u.id}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: #334155;">✉️ ${u.email}</div>
          <div style="font-size: 0.78rem; color: #64748b;">📞 ${u.phone || 'N/A'}</div>
        </td>
        <td>📍 ${u.location || 'India'}</td>
        <td>
          <span style="font-size: 0.82rem; color: #475569; font-weight: 600;">
            ${u.currentActivity || 'Active'}
          </span>
          <div style="font-size: 0.72rem; color: #94a3b8;">${u.lastActive}</div>
        </td>
        <td><strong style="color: #059669; font-size: 0.95rem;">₹${(u.totalSpent || 0).toLocaleString('en-IN')}</strong></td>
        <td><span style="font-weight: 700; color: #2563eb;">${u.bookingsCount || 0} Tour(s)</span></td>
        <td>
          ${u.isOnline
            ? '<span class="status-online"><span class="live-pulse-dot"></span> Online</span>'
            : '<span class="status-offline">Offline</span>'}
        </td>
      </tr>
    `).join('');
  }

  // =========================================================================
  // TOURS MANAGEMENT TAB
  // =========================================================================
  const toursTableBody = document.getElementById('adminToursTableBody');
  const searchToursInput = document.getElementById('searchToursInput');
  const btnOpenAddTour = document.getElementById('btnOpenAddTourModal');
  const tourModal = document.getElementById('tourEditModal');
  const tourForm = document.getElementById('adminTourForm');

  function renderToursTable() {
    if (!toursTableBody) return;
    const q = (searchToursInput ? searchToursInput.value : '').toLowerCase().trim();
    let tours = window.TravelStore.getTours();

    if (q) {
      tours = tours.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    if (tours.length === 0) {
      toursTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No tours found.</td></tr>';
      return;
    }

    toursTableBody.innerHTML = tours.map(t => `
      <tr>
        <td>
          <img src="${t.thumb || t.img}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="${t.title}">
        </td>
        <td>
          <strong style="font-size: 0.95rem; color: #0f172a; display: block;">${t.title}</strong>
          <span style="font-size: 0.78rem; color: #64748b;">ID: ${t.id}</span>
        </td>
        <td><span class="status-pill status-in-progress">${t.category}</span></td>
        <td><strong style="font-size: 1rem; color: #0f172a;">₹${t.price.toLocaleString('en-IN')}</strong></td>
        <td>⏱ ${t.duration}</td>
        <td>⭐ ${t.rating}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-tour-btn" data-id="${t.id}" title="Edit Tour">✏️</button>
            <button class="btn-action-icon delete delete-tour-btn" data-id="${t.id}" title="Delete Tour">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Edit & Delete Listeners
    document.querySelectorAll('.edit-tour-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditTourModal(id);
      });
    });

    document.querySelectorAll('.delete-tour-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this tour package?')) {
          window.TravelStore.deleteTour(id);
          showAdminToast('Tour package removed.');
          renderToursTable();
          renderDashboard();
        }
      });
    });
  }

  if (searchToursInput) {
    searchToursInput.addEventListener('input', renderToursTable);
  }

  // Add / Edit Tour Modal Logic
  function openEditTourModal(tourId = null) {
    if (!tourModal) return;
    const modalTitle = document.getElementById('tourModalTitle');
    const inputId = document.getElementById('formTourId');
    const inputTitle = document.getElementById('formTourTitle');
    const inputCategory = document.getElementById('formTourCategory');
    const inputPrice = document.getElementById('formTourPrice');
    const inputOrigPrice = document.getElementById('formTourOrigPrice');
    const inputDuration = document.getElementById('formTourDuration');
    const inputRating = document.getElementById('formTourRating');
    const inputImg = document.getElementById('formTourImg');
    const inputDesc = document.getElementById('formTourDesc');

    if (tourId) {
      const tour = window.TravelStore.getTourById(tourId);
      if (!tour) return;
      if (modalTitle) modalTitle.textContent = 'Edit Tour Package';
      if (inputId) inputId.value = tour.id;
      if (inputTitle) inputTitle.value = tour.title;
      if (inputCategory) inputCategory.value = tour.category;
      if (inputPrice) inputPrice.value = tour.price;
      if (inputOrigPrice) inputOrigPrice.value = tour.originalPrice || '';
      if (inputDuration) inputDuration.value = tour.duration;
      if (inputRating) inputRating.value = tour.rating;
      if (inputImg) inputImg.value = tour.img;
      if (inputDesc) inputDesc.value = tour.description;
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Tour Package';
      tourForm.reset();
      if (inputId) inputId.value = '';
    }

    tourModal.classList.add('active');
  }

  if (btnOpenAddTour) {
    btnOpenAddTour.addEventListener('click', () => openEditTourModal(null));
  }

  if (tourForm) {
    tourForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('formTourId')?.value;
      const title = document.getElementById('formTourTitle')?.value;
      const category = document.getElementById('formTourCategory')?.value;
      const price = parseInt(document.getElementById('formTourPrice')?.value, 10) || 850;
      const originalPrice = parseInt(document.getElementById('formTourOrigPrice')?.value, 10) || price;
      const duration = document.getElementById('formTourDuration')?.value;
      const rating = parseFloat(document.getElementById('formTourRating')?.value) || 4.8;
      const img = document.getElementById('formTourImg')?.value || 'assets/images/featured-uluwatu.jpg';
      const description = document.getElementById('formTourDesc')?.value;

      window.TravelStore.saveTour({
        id: id || undefined,
        title,
        category,
        price,
        originalPrice,
        duration,
        rating,
        img,
        thumb: img,
        description
      });

      showAdminToast(id ? 'Tour package updated successfully!' : '🎉 New tour package published live!');
      tourModal.classList.remove('active');
      renderToursTable();
      renderDashboard();
    });
  }

  // =========================================================================
  // BOOKINGS MANAGEMENT TAB
  // =========================================================================
  const bookingsTableBody = document.getElementById('adminBookingsTableBody');
  const searchBookingsInput = document.getElementById('searchBookingsInput');
  const statusFilterSelect = document.getElementById('filterBookingStatus');

  function renderBookingsTable() {
    if (!bookingsTableBody) return;
    const q = (searchBookingsInput ? searchBookingsInput.value : '').toLowerCase().trim();
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'all';

    let bookings = window.TravelStore.getBookings();

    if (statusFilter !== 'all') {
      bookings = bookings.filter(b => (b.status || '').toLowerCase() === statusFilter.toLowerCase());
    }

    if (q) {
      bookings = bookings.filter(b =>
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.tourTitle.toLowerCase().includes(q)
      );
    }

    if (bookings.length === 0) {
      bookingsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">No bookings match the criteria.</td></tr>';
      return;
    }

    bookingsTableBody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong style="font-family: monospace; color: #2563eb;">${b.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${b.customerName}</div>
          <div style="font-size: 0.75rem; color: #64748b;">${b.email} &bull; ${b.phone || ''}</div>
          <div style="font-size: 0.72rem; color: #059669;">📍 ${b.hotel || 'Hotel pickup'}</div>
        </td>
        <td><strong>${b.tourTitle}</strong></td>
        <td>📅 ${b.date}</td>
        <td>👥 ${b.guests} Pax</td>
        <td><strong style="color: #0f172a; font-size: 1rem;">₹${(b.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
        <td>
          <select class="admin-form-control update-status-select" data-id="${b.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: 700;">
            <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon view-voucher-btn" data-id="${b.id}" title="View Full Invoice / Voucher">📄</button>
            <button class="btn-action-icon delete delete-booking-btn" data-id="${b.id}" title="Delete Booking">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Status Dropdown Listeners
    document.querySelectorAll('.update-status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        const newStatus = e.target.value;
        window.TravelStore.updateBookingStatus(id, newStatus);
        showAdminToast(`Booking ${id} status updated to <strong>${newStatus}</strong>`);
        renderDashboard();
      });
    });

    // Attach Voucher Modal Trigger
    document.querySelectorAll('.view-voucher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openAdminVoucherModal(id);
      });
    });

    // Attach Delete Listener
    document.querySelectorAll('.delete-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete booking record ${id}?`)) {
          window.TravelStore.deleteBooking(id);
          showAdminToast(`Booking ${id} removed.`);
          renderBookingsTable();
          renderDashboard();
        }
      });
    });
  }

  if (searchBookingsInput) searchBookingsInput.addEventListener('input', renderBookingsTable);
  if (statusFilterSelect) statusFilterSelect.addEventListener('change', renderBookingsTable);

  const btnExportBookingsCsv = document.getElementById('btnExportBookingsCsv');
  if (btnExportBookingsCsv) {
    btnExportBookingsCsv.addEventListener('click', () => {
      const bookings = window.TravelStore.getBookings();
      if (bookings.length === 0) {
        showAdminToast('No bookings to export.', true);
        return;
      }
      const headers = ['Booking ID', 'Customer Name', 'Email', 'Phone', 'Hotel', 'Tour Package', 'Tour Date', 'Guests', 'Amount (INR)', 'Payment Mode', 'Status', 'Booked At'];
      const rows = bookings.map(b => [
        `"${b.id}"`,
        `"${(b.customerName || '').replace(/"/g, '""')}"`,
        `"${(b.email || '').replace(/"/g, '""')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        `"${(b.hotel || '').replace(/"/g, '""')}"`,
        `"${(b.tourTitle || '').replace(/"/g, '""')}"`,
        `"${b.date || ''}"`,
        b.guests || 1,
        b.totalAmount || 0,
        `"${b.paymentMethod || 'UPI'}"`,
        `"${b.status || 'Confirmed'}"`,
        `"${b.createdAt || ''}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `travel-the-world-bookings-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showAdminToast('📊 Bookings spreadsheet exported to CSV!');
    });
  }

  // Admin View Voucher Modal
  function openAdminVoucherModal(bookingId) {
    const booking = window.TravelStore.getBookingById(bookingId);
    if (!booking) return;

    let modal = document.getElementById('adminVoucherModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adminVoucherModal';
      modal.className = 'admin-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="admin-modal-box" style="max-width: 650px;">
        <div class="admin-modal-header" style="background: #0f172a; color: #fff;">
          <div>
            <h3 style="color: #fff; margin-bottom: 0.2rem;">Official Tour Voucher & Invoice</h3>
            <span style="font-family: monospace; color: #38bdf8;">Booking ID: ${booking.id}</span>
          </div>
          <button class="admin-modal-close" style="color: #fff;" onclick="document.getElementById('adminVoucherModal').classList.remove('active')">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
            <div>
              <div style="font-size: 0.8rem; color: #64748b;">Operator</div>
              <strong>Travel The World (Bali Concierge Desk)</strong>
              <div style="font-size: 0.8rem; color: #64748b;">#7819/BALI Registered License</div>
            </div>
            <div style="text-align: right;">
              <span class="status-pill status-${(booking.status || '').toLowerCase()}">${booking.status}</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.3rem;">Payment: ${booking.paymentMethod || 'UPI'} (${booking.paymentStatus || 'Paid'})</div>
            </div>
          </div>

          <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.2rem;">${booking.tourTitle}</h4>
          <span style="font-size: 0.85rem; color: #64748b;">Bali, Indonesia &bull; Date: ${booking.date}</span>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin: 1.25rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.88rem;">
            <div><strong>Guest Name:</strong> ${booking.customerName}</div>
            <div><strong>Email:</strong> ${booking.email}</div>
            <div><strong>Contact:</strong> ${booking.phone || 'N/A'}</div>
            <div><strong>Party Size:</strong> ${booking.guests} Person(s)</div>
            <div style="grid-column: 1 / -1;"><strong>Hotel Pickup:</strong> 📍 ${booking.hotel}</div>
            ${booking.specialRequests ? `<div style="grid-column: 1 / -1; color: #2563eb;"><strong>Notes:</strong> ${booking.specialRequests}</div>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #cbd5e1; padding-top: 1rem;">
            <span style="font-weight: 700; font-size: 1.1rem;">Total Billed:</span>
            <span style="font-size: 1.4rem; font-weight: 800; color: #059669;">₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button onclick="window.print()" class="btn-admin-primary" style="flex: 1; justify-content: center;">🖨️ Print Voucher</button>
            <button onclick="document.getElementById('adminVoucherModal').classList.remove('active')" class="btn-action-icon" style="flex: 1; width: auto; height: auto; padding: 0.6rem; border-radius: 6px;">Close</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  // =========================================================================
  // INQUIRIES & LEADS TAB
  // =========================================================================
  const inquiriesTableBody = document.getElementById('adminInquiriesTableBody');

  function renderInquiriesTable() {
    if (!inquiriesTableBody) return;
    const inquiries = window.TravelStore.getInquiries();

    if (inquiries.length === 0) {
      inquiriesTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No customer inquiries received.</td></tr>';
      return;
    }

    inquiriesTableBody.innerHTML = inquiries.map(i => `
      <tr>
        <td><strong style="font-family: monospace; color: #2563eb;">${i.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${i.customerName}</div>
          <div style="font-size: 0.75rem; color: #64748b;">${i.email}</div>
          <div style="font-size: 0.75rem; color: #2563eb;">${i.phone || ''}</div>
        </td>
        <td><strong>${i.subject}</strong></td>
        <td style="max-width: 250px;">
          <p style="font-size: 0.8rem; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${i.message}
          </p>
        </td>
        <td>${new Date(i.date).toLocaleDateString('en-IN')}</td>
        <td>
          <select class="admin-form-control update-inquiry-select" data-id="${i.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: 700;">
            <option value="New" ${i.status === 'New' ? 'selected' : ''}>New</option>
            <option value="In Progress" ${i.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Replied" ${i.status === 'Replied' ? 'selected' : ''}>Replied</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon view-inq-btn" data-id="${i.id}" title="View & Reply">💬</button>
            <button class="btn-action-icon delete delete-inq-btn" data-id="${i.id}" title="Delete Message">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Status toggle
    document.querySelectorAll('.update-inquiry-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.getAttribute('data-id');
        window.TravelStore.updateInquiryStatus(id, e.target.value);
        showAdminToast(`Inquiry ${id} status updated to ${e.target.value}.`);
        renderDashboard();
      });
    });

    // View & Reply modal
    document.querySelectorAll('.view-inq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openReplyInquiryModal(id);
      });
    });

    // Delete
    document.querySelectorAll('.delete-inq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Delete inquiry message ${id}?`)) {
          window.TravelStore.deleteInquiry(id);
          showAdminToast(`Inquiry ${id} deleted.`);
          renderInquiriesTable();
          renderDashboard();
        }
      });
    });
  }

  function openReplyInquiryModal(inquiryId) {
    const inq = window.TravelStore.getInquiries().find(i => i.id === inquiryId);
    if (!inq) return;

    let modal = document.getElementById('adminReplyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adminReplyModal';
      modal.className = 'admin-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="admin-modal-box">
        <div class="admin-modal-header">
          <h3>Customer Inquiry: ${inq.id}</h3>
          <button class="admin-modal-close" onclick="document.getElementById('adminReplyModal').classList.remove('active')">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="font-weight: 700; margin-bottom: 0.2rem;">${inq.customerName} &lt;${inq.email}&gt;</div>
            <div style="font-size: 0.82rem; color: #2563eb; margin-bottom: 0.5rem;">Subject: ${inq.subject}</div>
            <p style="font-size: 0.9rem; color: #334155; line-height: 1.5;">${inq.message}</p>
          </div>

          <form id="replyInqForm">
            <div class="admin-form-group">
              <label for="adminReplyText">Send Chauffeur / Concierge Reply via Email/WhatsApp</label>
              <textarea id="adminReplyText" rows="4" class="admin-form-control" placeholder="Hello ${inq.customerName}, thank you for reaching out to Travel The World Bali..." required></textarea>
            </div>
            <button type="submit" class="btn-admin-primary" style="width: 100%; justify-content: center; padding: 0.75rem;">
              <span>✉️ Send Reply & Mark as Replied</span>
            </button>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('replyInqForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      window.TravelStore.updateInquiryStatus(inquiryId, 'Replied');
      showAdminToast(`Response dispatched to ${inq.customerName}! Status marked as Replied.`);
      modal.classList.remove('active');
      renderInquiriesTable();
      renderDashboard();
    });
  }

  // =========================================================================
  // REVIEWS MODERATION TAB
  // =========================================================================
  const reviewsTableBody = document.getElementById('adminReviewsTableBody');

  function renderReviewsTable() {
    if (!reviewsTableBody) return;
    const reviews = window.TravelStore.getReviews();

    if (reviews.length === 0) {
      reviewsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No customer reviews submitted yet.</td></tr>';
      return;
    }

    reviewsTableBody.innerHTML = reviews.map(r => `
      <tr>
        <td><strong>${r.reviewerName}</strong></td>
        <td>${r.origin}</td>
        <td><strong style="color: #f59e0b;">${'★'.repeat(r.rating || 5)}</strong></td>
        <td style="max-width: 280px;">
          <p style="font-size: 0.82rem; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            "${r.comment}"
          </p>
        </td>
        <td>${r.date || 'Recent'}</td>
        <td>
          <button class="status-pill ${r.approved ? 'status-confirmed' : 'status-pending'} toggle-approval-btn" data-id="${r.id}" style="border: none; cursor: pointer;">
            ${r.approved ? 'Approved ✅' : 'Pending Approval ⏳'}
          </button>
        </td>
        <td>
          <button class="btn-action-icon delete delete-rev-btn" data-id="${r.id}" title="Delete Review">🗑️</button>
        </td>
      </tr>
    `).join('');

    // Toggle approval
    document.querySelectorAll('.toggle-approval-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const res = window.TravelStore.toggleReviewApproval(id);
        showAdminToast(res.approved ? 'Review approved & visible on website.' : 'Review hidden from website.');
        renderReviewsTable();
        renderDashboard();
      });
    });

    // Delete
    document.querySelectorAll('.delete-rev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this customer review?')) {
          window.TravelStore.deleteReview(id);
          showAdminToast('Review removed.');
          renderReviewsTable();
          renderDashboard();
        }
      });
    });
  }

  // =========================================================================
  // COUPONS & PROMO OFFERS TAB (for offers.html)
  // =========================================================================
  const couponsTableBody = document.getElementById('adminCouponsTableBody');
  const btnOpenAddCoupon = document.getElementById('btnOpenAddCouponModal');
  const couponModal = document.getElementById('couponModal');
  const couponForm = document.getElementById('adminCouponForm');

  function renderCouponsTable() {
    if (!couponsTableBody) return;
    const coupons = window.TravelStore.getCoupons();

    if (coupons.length === 0) {
      couponsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #94a3b8;">No coupons created yet.</td></tr>';
      return;
    }

    couponsTableBody.innerHTML = coupons.map(c => `
      <tr>
        <td><strong style="font-family: monospace; font-size: 0.95rem; color: #2563eb; background: #eff6ff; padding: 0.25rem 0.5rem; border-radius: 4px;">${c.code}</strong></td>
        <td><strong style="color: #059669;">${c.discountPercent ? `${c.discountPercent}% OFF` : `₹${c.discountFlat} OFF`}</strong></td>
        <td>₹${(c.minSpend || 0).toLocaleString('en-IN')}</td>
        <td style="max-width: 250px;">${c.description}</td>
        <td><span class="status-pill status-confirmed">Active</span></td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-coupon-btn" data-code="${c.code}" title="Edit Coupon">✏️</button>
            <button class="btn-action-icon delete delete-coupon-btn" data-code="${c.code}" title="Delete Coupon">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Edit Coupon
    document.querySelectorAll('.edit-coupon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const c = coupons.find(item => item.code.toUpperCase() === code.toUpperCase());
        if (!c) return;

        document.getElementById('couponModalTitle').textContent = 'Edit Promo Coupon';
        document.getElementById('couponOriginalCode').value = c.code;
        document.getElementById('formCouponCode').value = c.code;
        document.getElementById('formCouponType').value = c.discountPercent ? 'percent' : 'fixed';
        document.getElementById('formCouponValue').value = c.discountPercent || c.discountFlat || 0;
        document.getElementById('formCouponMinSpend').value = c.minSpend || 0;
        document.getElementById('formCouponDesc').value = c.description || '';

        couponModal?.classList.add('active');
      });
    });

    // Delete Coupon
    document.querySelectorAll('.delete-coupon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        if (confirm(`Delete coupon code ${code}?`)) {
          window.TravelStore.deleteCoupon(code);
          showAdminToast(`Coupon ${code} removed.`);
          renderCouponsTable();
        }
      });
    });
  }

  if (btnOpenAddCoupon && couponModal) {
    btnOpenAddCoupon.addEventListener('click', () => {
      couponForm?.reset();
      document.getElementById('couponModalTitle').textContent = 'Create Promo Code';
      document.getElementById('couponOriginalCode').value = '';
      couponModal.classList.add('active');
    });
  }

  if (couponForm) {
    couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const origCode = document.getElementById('couponOriginalCode').value.trim();
      const code = document.getElementById('formCouponCode').value.trim().toUpperCase();
      const type = document.getElementById('formCouponType').value;
      const val = parseInt(document.getElementById('formCouponValue').value, 10) || 0;
      const minSpend = parseInt(document.getElementById('formCouponMinSpend').value, 10) || 0;
      const desc = document.getElementById('formCouponDesc').value.trim();

      if (origCode && origCode !== code) {
        window.TravelStore.deleteCoupon(origCode);
      }

      const couponObj = {
        code,
        minSpend,
        description: desc
      };
      if (type === 'percent') {
        couponObj.discountPercent = val;
      } else {
        couponObj.discountFlat = val;
      }

      window.TravelStore.saveCoupon(couponObj);
      showAdminToast(`🎟️ Coupon <strong>${code}</strong> saved successfully!`);
      couponModal?.classList.remove('active');
      renderCouponsTable();
    });
  }

  // =========================================================================
  // BLOG & TRAVEL ARTICLES TAB (for blog.html)
  // =========================================================================
  const blogsTableBody = document.getElementById('adminBlogsTableBody');
  const btnOpenAddBlog = document.getElementById('btnOpenAddBlogModal');
  const blogModal = document.getElementById('blogModal');
  const blogForm = document.getElementById('adminBlogForm');

  function renderBlogsTable() {
    if (!blogsTableBody) return;
    const blogs = window.TravelStore.getBlogs();

    if (blogs.length === 0) {
      blogsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #94a3b8;">No blog articles published.</td></tr>';
      return;
    }

    blogsTableBody.innerHTML = blogs.map(b => `
      <tr>
        <td>
          <img src="../${b.image || 'assets/images/featured-uluwatu.jpg'}" alt="${b.title}" style="width: 55px; height: 38px; object-fit: cover; border-radius: 4px;">
        </td>
        <td style="max-width: 320px;">
          <div style="font-weight: 700; color: #0f172a; line-height: 1.3;">${b.title}</div>
          <span style="font-size: 0.72rem; color: #2563eb; background: #eff6ff; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600;">${b.category}</span>
        </td>
        <td>${b.readTime || '5 min read'}</td>
        <td>${b.author || 'Editorial'}</td>
        <td>${b.date || 'Recent'}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-blog-btn" data-id="${b.id}" title="Edit Article">✏️</button>
            <button class="btn-action-icon delete delete-blog-btn" data-id="${b.id}" title="Delete Article">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Edit Blog
    document.querySelectorAll('.edit-blog-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const b = blogs.find(item => item.id === id);
        if (!b) return;

        document.getElementById('blogModalTitle').textContent = 'Edit Travel Article';
        document.getElementById('formBlogId').value = b.id;
        document.getElementById('formBlogTitle').value = b.title || '';
        document.getElementById('formBlogCategory').value = b.category || 'Travel Guide';
        document.getElementById('formBlogReadTime').value = b.readTime || '';
        document.getElementById('formBlogAuthor').value = b.author || '';
        document.getElementById('formBlogImage').value = b.image || 'assets/images/featured-uluwatu.jpg';
        document.getElementById('formBlogSummary').value = b.excerpt || b.summary || '';

        blogModal?.classList.add('active');
      });
    });

    // Delete Blog
    document.querySelectorAll('.delete-blog-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this blog article?')) {
          window.TravelStore.deleteBlog(id);
          showAdminToast('Article removed from blog.');
          renderBlogsTable();
        }
      });
    });
  }

  if (btnOpenAddBlog && blogModal) {
    btnOpenAddBlog.addEventListener('click', () => {
      blogForm?.reset();
      document.getElementById('blogModalTitle').textContent = 'Write Travel Article';
      document.getElementById('formBlogId').value = '';
      blogModal.classList.add('active');
    });
  }

  if (blogForm) {
    blogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('formBlogId').value;
      const blogObj = {
        id: id || undefined,
        title: document.getElementById('formBlogTitle').value.trim(),
        category: document.getElementById('formBlogCategory').value,
        readTime: document.getElementById('formBlogReadTime').value.trim(),
        author: document.getElementById('formBlogAuthor').value.trim(),
        image: document.getElementById('formBlogImage').value,
        excerpt: document.getElementById('formBlogSummary').value.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      window.TravelStore.saveBlog(blogObj);
      showAdminToast('📖 Travel guide article published live to blog.html!');
      blogModal?.classList.remove('active');
      renderBlogsTable();
    });
  }

  // =========================================================================
  // ABOUT US & TEAM TAB (for about.html)
  // =========================================================================
  const aboutForm = document.getElementById('adminAboutForm');

  function populateAboutForm() {
    if (!aboutForm) return;
    const settings = window.TravelStore.getSettings();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    setVal('aboutHeroStory', settings.aboutStory || 'Founded in 2012 by Balinese cultural explorers and Indian hospitality experts, Travel The World has guided over 42,000 travelers across the enchanting landscapes of Bali. We bridge authentic Balinese spirituality with high-touch Indian hospitality, offering pure vegetarian catering, bespoke private chauffeurs, and verified luxury experiences.');
    setVal('aboutHeroImgInput', settings.aboutHeroImg || 'assets/images/featured-uluwatu.jpg');
    setVal('aboutStatYears', settings.statYears || '14+');
    setVal('aboutStatTravelers', settings.statTravelers || '42,000+');
    setVal('aboutStatTours', settings.statTours || '18+');
    setVal('aboutStatRating', settings.statRating || '4.9 ★');

    const previewAbout = document.getElementById('previewAboutHero');
    if (previewAbout && settings.aboutHeroImg) {
      previewAbout.src = (settings.aboutHeroImg.startsWith('assets/') ? `../${settings.aboutHeroImg}` : settings.aboutHeroImg);
    }
  }

  if (aboutForm) {
    aboutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.TravelStore.saveSettings({
        aboutStory: document.getElementById('aboutHeroStory').value,
        aboutHeroImg: document.getElementById('aboutHeroImgInput')?.value || 'assets/images/featured-uluwatu.jpg',
        statYears: document.getElementById('aboutStatYears').value,
        statTravelers: document.getElementById('aboutStatTravelers').value,
        statTours: document.getElementById('aboutStatTours').value,
        statRating: document.getElementById('aboutStatRating').value
      });
      showAdminToast('👥 About Us story, showcase image, and live counters saved!');
    });
  }

  // =========================================================================
  // CONTACT & FAQS TAB (for contact.html)
  // =========================================================================
  const faqsTableBody = document.getElementById('adminFaqsTableBody');
  const btnOpenAddFaq = document.getElementById('btnOpenAddFaqModal');
  const faqModal = document.getElementById('faqModal');
  const faqForm = document.getElementById('adminFaqForm');

  function renderFaqsTable() {
    if (!faqsTableBody) return;
    const settings = window.TravelStore.getSettings();
    const faqs = settings.faqs || [];

    if (faqs.length === 0) {
      faqsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: #94a3b8;">No FAQ items created.</td></tr>';
      return;
    }

    faqsTableBody.innerHTML = faqs.map((f, idx) => `
      <tr>
        <td style="font-weight: 700; color: #0f172a; max-width: 250px;">${f.question}</td>
        <td style="font-size: 0.85rem; color: #475569; max-width: 320px;">
          <p style="margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${f.answer}</p>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-faq-btn" data-idx="${idx}" title="Edit FAQ">✏️</button>
            <button class="btn-action-icon delete delete-faq-btn" data-idx="${idx}" title="Delete FAQ">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Edit FAQ
    document.querySelectorAll('.edit-faq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const f = faqs[idx];
        if (!f) return;

        document.getElementById('faqModalTitle').textContent = 'Edit FAQ Item';
        document.getElementById('formFaqIndex').value = idx;
        document.getElementById('formFaqQuestion').value = f.question || '';
        document.getElementById('formFaqAnswer').value = f.answer || '';

        faqModal?.classList.add('active');
      });
    });

    // Delete FAQ
    document.querySelectorAll('.delete-faq-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        if (confirm('Delete this FAQ question?')) {
          faqs.splice(idx, 1);
          window.TravelStore.saveSettings({ faqs });
          showAdminToast('FAQ item deleted.');
          renderFaqsTable();
        }
      });
    });
  }

  if (btnOpenAddFaq && faqModal) {
    btnOpenAddFaq.addEventListener('click', () => {
      faqForm?.reset();
      document.getElementById('faqModalTitle').textContent = 'Add FAQ Item';
      document.getElementById('formFaqIndex').value = '';
      faqModal.classList.add('active');
    });
  }

  if (faqForm) {
    faqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idxVal = document.getElementById('formFaqIndex').value;
      const question = document.getElementById('formFaqQuestion').value.trim();
      const answer = document.getElementById('formFaqAnswer').value.trim();

      const settings = window.TravelStore.getSettings();
      const faqs = settings.faqs || [];

      if (idxVal !== '') {
        const idx = parseInt(idxVal, 10);
        faqs[idx] = { question, answer };
      } else {
        faqs.push({ question, answer });
      }

      window.TravelStore.saveSettings({ faqs });
      showAdminToast('📞 FAQ updated and live on contact.html!');
      faqModal?.classList.remove('active');
      renderFaqsTable();
    });
  }

  // =========================================================================
  // SETTINGS & RESET TAB
  // =========================================================================
  const settingsForm = document.getElementById('adminSettingsForm');
  const btnResetData = document.getElementById('btnResetAllDemoData');
  const btnExportData = document.getElementById('btnExportDatabaseJson');

  function populateSettings() {
    if (!settingsForm) return;
    const settings = window.TravelStore.getSettings();
    document.getElementById('setCompanyName').value = settings.companyName || '';
    document.getElementById('setTagline').value = settings.tagline || '';
    document.getElementById('setCurrencySymbol').value = settings.currencySymbol || '₹';
    document.getElementById('setContactEmail').value = settings.contactEmail || '';
    document.getElementById('setContactPhone').value = settings.contactPhone || '';
    document.getElementById('setAddress').value = settings.address || '';
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.TravelStore.saveSettings({
        companyName: document.getElementById('setCompanyName').value,
        tagline: document.getElementById('setTagline').value,
        currencySymbol: document.getElementById('setCurrencySymbol').value,
        contactEmail: document.getElementById('setContactEmail').value,
        contactPhone: document.getElementById('setContactPhone').value,
        address: document.getElementById('setAddress').value
      });
      showAdminToast('⚙️ System settings saved successfully!');
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('⚠️ WARNING: This will reset all Tours, Bookings, Inquiries, and Reviews back to default demo state. Continue?')) {
        window.TravelStore.resetToDefaults();
        showAdminToast('🔄 Database reset to clean defaults.');
        renderAll();
      }
    });
  }

  if (btnExportData) {
    btnExportData.addEventListener('click', () => {
      const dump = {
        exportedAt: new Date().toISOString(),
        tours: window.TravelStore.getTours(),
        bookings: window.TravelStore.getBookings(),
        inquiries: window.TravelStore.getInquiries(),
        reviews: window.TravelStore.getReviews(),
        settings: window.TravelStore.getSettings()
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-the-world-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAdminToast('💾 Database exported to JSON file.');
    });
  }

  // =========================================================================
  // FESTIVAL THEMES & LIVE SITE CUSTOMIZER TAB
  // =========================================================================
  const customizerForm = document.getElementById('adminCustomizerForm');
  const btnResetCustomizer = document.getElementById('btnResetCustomizer');

  function populateCustomizer() {
    const settings = window.TravelStore.getSettings();

    // 1. Theme Selector Cards Highlight
    const activeTheme = settings.activeTheme || 'diwali';
    document.querySelectorAll('.theme-card').forEach(card => {
      const theme = card.getAttribute('data-theme');
      if (theme === activeTheme) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 2. Populate Form Fields
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    const festiveActiveEl = document.getElementById('customFestiveActive');
    if (festiveActiveEl) festiveActiveEl.checked = !!settings.festivalBannerActive;

    const aiActiveEl = document.getElementById('customAiConciergeActive');
    if (aiActiveEl) aiActiveEl.checked = settings.aiConciergeEnabled !== false;

    const particlesActiveEl = document.getElementById('customParticlesActive');
    if (particlesActiveEl) particlesActiveEl.checked = settings.festiveParticlesEnabled !== false;

    const tiltActiveEl = document.getElementById('customTiltActive');
    if (tiltActiveEl) tiltActiveEl.checked = settings.cardTiltPhysicsEnabled !== false;

    const virtual360ActiveEl = document.getElementById('customVirtual360Active');
    if (virtual360ActiveEl) virtual360ActiveEl.checked = settings.virtual360TourEnabled !== false;

    setVal('customFestiveBadge', settings.festivalBannerBadge);
    setVal('customFestiveText', settings.festivalBannerText);
    setVal('customFestiveLink', settings.festivalBannerLink);
    setVal('customFestiveCta', settings.festivalBannerCta);

    setVal('customHeroTitle', settings.heroTitle);
    setVal('customHeroDesc', settings.heroDescription);
    setVal('customHeroVideo', settings.heroVideoUrl || 'assets/videos/hero-bali.mp4');
    setVal('customHeroPoster', settings.heroPosterUrl || 'assets/images/hero-ulun-danu.jpg');
    setVal('customHeroCtaText', settings.heroCtaText);
    setVal('customHeroCtaLink', settings.heroCtaLink);

    setVal('customHeroSlide1Img', settings.heroSlide1Img || 'assets/images/hero-ulun-danu.jpg');
    setVal('customHeroSlide1Title', settings.heroSlide1Title || settings.heroTitle || 'BALI');
    setVal('customHeroSlide1Desc', settings.heroSlide1Desc || settings.heroDescription || '');

    setVal('customHeroSlide2Img', settings.heroSlide2Img || 'assets/images/hero-gates.jpg');
    setVal('customHeroSlide2Title', settings.heroSlide2Title || 'LEMPUYANG');
    setVal('customHeroSlide2Desc', settings.heroSlide2Desc || '');

    setVal('customHeroSlide3Img', settings.heroSlide3Img || 'assets/images/hero-beach.jpg');
    setVal('customHeroSlide3Title', settings.heroSlide3Title || 'NUSA DUA');
    setVal('customHeroSlide3Desc', settings.heroSlide3Desc || '');

    setVal('customExploreTitle', settings.exploreTitle);
    setVal('customExploreSubtitle', settings.exploreSubtitle);
    setVal('customExploreBackdropImg', settings.exploreBackdropImg || 'assets/images/featured-uluwatu.jpg');
    setVal('customCloudHint', settings.cloudMistHint);

    setVal('customTickerWeather', settings.tickerWeather);
    setVal('customTickerGoldenHour', settings.tickerGoldenHour);
    setVal('customTickerForex', settings.tickerForex);

    setVal('customLogoScript', settings.logoScript);
    setVal('customLogoSub', settings.logoSub);
    setVal('customCompanyName', settings.companyName);
    setVal('customContactPhone', settings.contactPhone);
    setVal('customContactEmail', settings.contactEmail);
    setVal('customAddress', settings.address);
    setVal('customCopyright', settings.copyrightText);

    // Update Live Thumbnail Previews
    updateMediaPreview('previewHeroPoster', settings.heroPosterUrl || 'assets/images/hero-ulun-danu.jpg');
    updateMediaPreview('previewHeroSlide1', settings.heroSlide1Img || 'assets/images/hero-ulun-danu.jpg');
    updateMediaPreview('previewHeroSlide2', settings.heroSlide2Img || 'assets/images/hero-gates.jpg');
    updateMediaPreview('previewHeroSlide3', settings.heroSlide3Img || 'assets/images/hero-beach.jpg');
    updateMediaPreview('previewExploreBackdrop', settings.exploreBackdropImg || 'assets/images/featured-uluwatu.jpg');
  }

  // 1-Click Festival Theme Switcher Cards Event Listeners
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const theme = card.getAttribute('data-theme');
      if (!theme) return;
      if (theme === 'normal') {
        window.TravelStore.saveSettings({
          activeTheme: 'normal',
          festivalBannerActive: false,
          festiveParticlesEnabled: false
        });
        showAdminToast('🌿 Activated <strong>Normal Mode</strong> (Festival deactivated, clean luxury standard)');
      } else {
        window.TravelStore.saveSettings({
          activeTheme: theme,
          festivalBannerActive: true,
          festiveParticlesEnabled: true
        });
        const titles = {
          diwali: '🪔 Diwali Festive Gold',
          holi: '🎨 Holi Color Fiesta',
          newyear: '🎄 Christmas & New Year',
          monsoon: '🌧️ Monsoon Romance',
          classic: '🌊 Classic Bali Luxury'
        };
        showAdminToast(`🎨 Activated Theme: <strong>${titles[theme] || theme}</strong>`);
      }
      populateCustomizer();
    });
  });

  // Customizer Form Submit (Save Everything to Live Website)
  if (customizerForm) {
    customizerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
      };

      const festiveActive = !!document.getElementById('customFestiveActive')?.checked;
      const aiActive = !!document.getElementById('customAiConciergeActive')?.checked;
      const particlesActive = !!document.getElementById('customParticlesActive')?.checked;
      const tiltActive = !!document.getElementById('customTiltActive')?.checked;
      const virtual360Active = !!document.getElementById('customVirtual360Active')?.checked;

      const newSettings = {
        festivalBannerActive: festiveActive,
        aiConciergeEnabled: aiActive,
        festiveParticlesEnabled: particlesActive,
        cardTiltPhysicsEnabled: tiltActive,
        virtual360TourEnabled: virtual360Active,

        festivalBannerBadge: getVal('customFestiveBadge'),
        festivalBannerText: getVal('customFestiveText'),
        festivalBannerLink: getVal('customFestiveLink'),
        festivalBannerCta: getVal('customFestiveCta'),

        heroTitle: getVal('customHeroSlide1Title') || getVal('customHeroTitle'),
        heroDescription: getVal('customHeroSlide1Desc') || getVal('customHeroDesc'),
        heroVideoUrl: getVal('customHeroVideo'),
        heroPosterUrl: getVal('customHeroPoster'),
        heroCtaText: getVal('customHeroCtaText'),
        heroCtaLink: getVal('customHeroCtaLink'),

        heroSlide1Img: getVal('customHeroSlide1Img'),
        heroSlide1Title: getVal('customHeroSlide1Title'),
        heroSlide1Desc: getVal('customHeroSlide1Desc'),

        heroSlide2Img: getVal('customHeroSlide2Img'),
        heroSlide2Title: getVal('customHeroSlide2Title'),
        heroSlide2Desc: getVal('customHeroSlide2Desc'),

        heroSlide3Img: getVal('customHeroSlide3Img'),
        heroSlide3Title: getVal('customHeroSlide3Title'),
        heroSlide3Desc: getVal('customHeroSlide3Desc'),

        exploreTitle: getVal('customExploreTitle'),
        exploreSubtitle: getVal('customExploreSubtitle'),
        exploreBackdropImg: getVal('customExploreBackdropImg'),
        cloudMistHint: getVal('customCloudHint'),

        tickerWeather: getVal('customTickerWeather'),
        tickerGoldenHour: getVal('customTickerGoldenHour'),
        tickerForex: getVal('customTickerForex'),

        logoScript: getVal('customLogoScript'),
        logoSub: getVal('customLogoSub'),
        companyName: getVal('customCompanyName'),
        contactPhone: getVal('customContactPhone'),
        contactEmail: getVal('customContactEmail'),
        address: getVal('customAddress'),
        copyrightText: getVal('customCopyright')
      };

      window.TravelStore.saveSettings(newSettings);
      showAdminToast('✨ All live media & content changes published to website!');
    });
  }

  // Restore Default Customizer Settings
  if (btnResetCustomizer) {
    btnResetCustomizer.addEventListener('click', () => {
      if (confirm('Restore default festival theme and homepage texts?')) {
        window.TravelStore.saveSettings({
          activeTheme: 'diwali',
          festivalBannerActive: true,
          festivalBannerBadge: '🪔 DIWALI SPECIAL',
          festivalBannerText: 'Shubh Deepawali Celebration: Flat 20% OFF on All Bali Packages with Code BALI20 | Free Uluwatu Sunset Passes',
          festivalBannerLink: 'offers.html',
          festivalBannerCta: 'Claim Offer →',
          heroTitle: 'BALI',
          heroDescription: 'The famed Island of the Gods, with its varied landscape of hills and mountains, rugged coastlines and sandy beaches, lush rice terraces, and volcanic hillsides.',
          heroVideoUrl: 'assets/videos/hero-bali.mp4',
          heroCtaText: 'Discover Location',
          heroCtaLink: '#explore',
          exploreTitle: 'EXPLORE BALI\nWITH US',
          exploreSubtitle: 'We are an online based travel company allowing us to keep our prices competitive. We will take care of the booking process for you from start to finish.',
          cloudMistHint: '✨ Move mouse to part clouds in 150-200px radius around cursor • Real-time mist',
          tickerWeather: '☀️ Climate: 29°C Tropical Clear Skies',
          tickerGoldenHour: '🌅 Uluwatu Golden Hour: Sunset at 18:14 WITA',
          tickerForex: '🇮🇳 Forex Benchmark: ₹1 INR ≈ 190.5 IDR (Zero conversion fee on all tours)',
          logoScript: 'travel',
          logoSub: 'THE WORLD',
          companyName: 'Travel The World',
          contactPhone: '+91 98200 12345 / +62 361 720 892',
          contactEmail: 'concierge@traveltheworld.bali',
          address: 'Jl. Danau Tamblingan No. 42, Sanur, Bali & Connaught Place, New Delhi',
          copyrightText: '© 2026 Travel The World. Handcrafted luxury travel & bespoke tours in Indian Rupees.'
        });
        showAdminToast('🔄 Restored default theme and texts.');
        populateCustomizer();
      }
    });
  }

  // =========================================================================
  // TAB 6B: WORD MASTER & SITE COPY CMS (100% GRANULAR COPY CONTROL)
  // =========================================================================
  const wordFieldMap = {
    wordHeroVideoBadge: 'heroVideoBadge',
    wordQuickSearchBtnText: 'quickSearchBtnText',
    wordExploreTag: 'exploreTag',
    wordCloudMistHint: 'cloudMistHint',
    wordExploreTitle: 'exploreTitle',
    wordExploreSubtitle: 'exploreSubtitle',
    wordPackagesTag: 'packagesTag',
    wordPackagesHeading: 'packagesHeading',
    wordPackagesDesc: 'packagesDesc',
    wordRouteExplorerTag: 'routeExplorerTag',
    wordRouteExplorerTitle: 'routeExplorerTitle',
    wordRouteExplorerBtnText: 'routeExplorerBtnText',
    wordRouteExplorerSubtitle: 'routeExplorerSubtitle',
    wordBudgetCalcTag: 'budgetCalcTag',
    wordBudgetCalcTitle: 'budgetCalcTitle',
    wordBudgetCalcPlanHighlight: 'budgetCalcPlanHighlight',
    wordBudgetCalcPlanDesc: 'budgetCalcPlanDesc',
    wordReviewsTag: 'reviewsTag',
    wordReviewsHeading: 'reviewsHeading',
    wordReviewsSubtitle: 'reviewsSubtitle',
    wordHolidaysPageBadge: 'holidaysPageBadge',
    wordHolidaysPageTitle: 'holidaysPageTitle',
    wordHolidaysPageSubtitle: 'holidaysPageSubtitle',
    wordOffersPageBadge: 'offersPageBadge',
    wordOffersPageTitle: 'offersPageTitle',
    wordOffersPageSubtitle: 'offersPageSubtitle',
    wordAboutPageBadge: 'aboutPageBadge',
    wordAboutPageTitle: 'aboutPageTitle',
    wordAboutPageSubtitle: 'aboutPageSubtitle',
    wordAboutExperienceTag: 'aboutExperienceTag',
    wordAboutExperienceHeading: 'aboutExperienceHeading',
    wordAboutStoryLead: 'aboutStoryLead',
    wordAboutStoryPara2: 'aboutStoryPara2',
    wordAboutStatYearsVal: 'aboutStatYearsVal',
    wordAboutStatTravelersVal: 'aboutStatTravelersVal',
    wordAboutStatToursVal: 'aboutStatToursVal',
    wordAboutStatRatingVal: 'aboutStatRatingVal',
    wordContactPageBadge: 'contactPageBadge',
    wordContactPageTitle: 'contactPageTitle',
    wordContactPageSubtitle: 'contactPageSubtitle',
    wordContactFormTag: 'contactFormTag',
    wordContactFormHeading: 'contactFormHeading',
    wordContactFormSubtitle: 'contactFormSubtitle',
    wordContactFormSubmitBtn: 'contactFormSubmitBtn',
    wordContactFaqHeading: 'contactFaqHeading',
    wordContactFaqSubtitle: 'contactFaqSubtitle',
    wordReviewsPageBadge: 'reviewsPageBadge',
    wordReviewsPageTitle: 'reviewsPageTitle',
    wordReviewsPageSubtitle: 'reviewsPageSubtitle',
    wordBlogPageBadge: 'blogPageBadge',
    wordBlogPageTitle: 'blogPageTitle',
    wordBlogPageSubtitle: 'blogPageSubtitle',
    wordLogoScript: 'logoScript',
    wordLogoSub: 'logoSub',
    wordCompanyName: 'companyName',
    wordFooterTagline: 'footerTagline',
    wordFooterSecureBadge: 'footerSecureBadge',
    wordCopyright: 'copyrightText'
  };

  function populateWords() {
    const s = window.TravelStore.getSettings() || {};
    Object.keys(wordFieldMap).forEach(elemId => {
      const el = document.getElementById(elemId);
      const storeKey = wordFieldMap[elemId];
      if (el && s[storeKey] !== undefined) {
        el.value = s[storeKey];
      }
    });
  }

  function setupWordMaster() {
    // 1. Instant Live Search Filter across all 50+ word fields
    const searchInput = document.getElementById('wordMasterSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        const activeCatBtn = document.querySelector('#wordCategoryFilters .btn-time-filter.active');
        const selectedCat = activeCatBtn ? activeCatBtn.getAttribute('data-word-cat') : 'all';

        const cards = document.querySelectorAll('#tab-words .word-section-card');
        cards.forEach(card => {
          const cardCat = card.getAttribute('data-cat');
          const catMatches = (selectedCat === 'all' || cardCat === selectedCat);

          if (!catMatches) {
            card.style.display = 'none';
            return;
          }

          let visibleItemsInCard = 0;
          const items = card.querySelectorAll('.word-field-item');
          items.forEach(item => {
            const text = (item.textContent || '').toLowerCase();
            const input = item.querySelector('input, textarea');
            const val = input ? (input.value || '').toLowerCase() : '';
            const placeholder = input ? (input.placeholder || '').toLowerCase() : '';

            if (!q || text.includes(q) || val.includes(q) || placeholder.includes(q)) {
              item.style.display = '';
              visibleItemsInCard++;
            } else {
              item.style.display = 'none';
            }
          });

          card.style.display = (visibleItemsInCard > 0) ? '' : 'none';
        });
      });
    }

    // 2. Category Filter Pills Navigation
    const catButtons = document.querySelectorAll('#wordCategoryFilters .btn-time-filter');
    catButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        catButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (searchInput) {
          searchInput.dispatchEvent(new Event('input'));
        } else {
          const selectedCat = btn.getAttribute('data-word-cat');
          const cards = document.querySelectorAll('#tab-words .word-section-card');
          cards.forEach(card => {
            const cardCat = card.getAttribute('data-cat');
            if (selectedCat === 'all' || cardCat === selectedCat) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          });
        }
      });
    });

    // 3. Form Submit - Saves all copy directly to TravelStore
    const wordsForm = document.getElementById('adminWordsForm');
    if (wordsForm) {
      wordsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newWords = {};
        Object.keys(wordFieldMap).forEach(elemId => {
          const el = document.getElementById(elemId);
          if (el) {
            const storeKey = wordFieldMap[elemId];
            newWords[storeKey] = el.value;
          }
        });

        window.TravelStore.saveSettings(newWords);
        showAdminToast('✍️ All website words & copy updated live across all 8 pages!');
      });
    }

    // 4. Restore Defaults
    const btnResetWords = document.getElementById('btnResetWords');
    if (btnResetWords) {
      btnResetWords.addEventListener('click', () => {
        if (confirm('Restore all 50+ website words and headings to original default copy?')) {
          const defs = window.TravelStore.DEFAULT_SETTINGS || {};
          const resetObj = {};
          Object.keys(wordFieldMap).forEach(elemId => {
            const storeKey = wordFieldMap[elemId];
            if (defs[storeKey] !== undefined) {
              resetObj[storeKey] = defs[storeKey];
            }
          });
          window.TravelStore.saveSettings(resetObj);
          populateWords();
          showAdminToast('🔄 Factory default words restored across all pages!');
        }
      });
    }
  }

  // =========================================================================
  // MEDIA UPLOADS & LIVE PREVIEW HELPERS
  // =========================================================================
  function updateMediaPreview(imgId, url) {
    const el = document.getElementById(imgId);
    if (!el || !url) return;
    const fullSrc = (url.startsWith('assets/') || url.startsWith('assets\\')) ? `../${url}` : url;
    el.src = fullSrc;
  }

  function setupMediaHelpers() {
    // 1. Interactive File-to-Base64 Uploads for ANY image or video
    const uploadPairs = [
      { fileId: 'uploadHeroVideo', targetInputId: 'customHeroVideo' },
      { fileId: 'uploadHeroPoster', targetInputId: 'customHeroPoster', previewId: 'previewHeroPoster' },
      { fileId: 'uploadHeroSlide1', targetInputId: 'customHeroSlide1Img', previewId: 'previewHeroSlide1' },
      { fileId: 'uploadHeroSlide2', targetInputId: 'customHeroSlide2Img', previewId: 'previewHeroSlide2' },
      { fileId: 'uploadHeroSlide3', targetInputId: 'customHeroSlide3Img', previewId: 'previewHeroSlide3' },
      { fileId: 'uploadExploreBackdrop', targetInputId: 'customExploreBackdropImg', previewId: 'previewExploreBackdrop' },
      { fileId: 'uploadAboutHero', targetInputId: 'aboutHeroImgInput', previewId: 'previewAboutHero' }
    ];

    uploadPairs.forEach(pair => {
      const fileInput = document.getElementById(pair.fileId);
      const targetInput = document.getElementById(pair.targetInputId);
      if (fileInput && targetInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const dataUrl = loadEvt.target.result;
            targetInput.value = dataUrl;
            if (pair.previewId) {
              const prev = document.getElementById(pair.previewId);
              if (prev) prev.src = dataUrl;
            }
            showAdminToast(`📁 File <strong>${file.name}</strong> loaded! Click "Save & Publish" to activate on live site.`);
          };
          reader.readAsDataURL(file);
        });
      }
    });

    // 2. Typing or pasting custom URL updates image preview immediately
    const previewBindings = [
      { inputId: 'customHeroPoster', previewId: 'previewHeroPoster' },
      { inputId: 'customHeroSlide1Img', previewId: 'previewHeroSlide1' },
      { inputId: 'customHeroSlide2Img', previewId: 'previewHeroSlide2' },
      { inputId: 'customHeroSlide3Img', previewId: 'previewHeroSlide3' },
      { inputId: 'customExploreBackdropImg', previewId: 'previewExploreBackdrop' },
      { inputId: 'aboutHeroImgInput', previewId: 'previewAboutHero' }
    ];

    previewBindings.forEach(binding => {
      const inp = document.getElementById(binding.inputId);
      if (inp) {
        inp.addEventListener('input', (e) => {
          updateMediaPreview(binding.previewId, e.target.value);
        });
      }
    });

    // 3. Preset Quick-Select Buttons
    document.querySelectorAll('.btn-preset-media').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const val = btn.getAttribute('data-val');
        const inp = document.getElementById(targetId);
        if (inp && val) {
          inp.value = val;
          inp.dispatchEvent(new Event('input'));
          showAdminToast(`Selected preset: <strong>${val}</strong>`);
        }
      });
    });
  }

  // Master Render Function
  function renderAll() {
    renderDashboard();
    renderToursTable();
    renderBookingsTable();
    renderUsersTable();
    renderCouponsTable();
    renderInquiriesTable();
    renderReviewsTable();
    renderBlogsTable();
    populateAboutForm();
    renderFaqsTable();
    populateSettings();
    populateCustomizer();
    populateWords();
  }

  // Listen to cross-page updates
  window.addEventListener('ttw:store-updated', () => {
    renderAll();
  });

  // Modal backdrop click to close
  document.querySelectorAll('.admin-modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  document.querySelectorAll('.admin-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-modal-backdrop')?.classList.remove('active');
    });
  });

  // =========================================================================
  // ADMIN AUTHENTICATION SECURITY GATE & LOGOUT
  // =========================================================================
  const authOverlay = document.getElementById('adminAuthOverlay');
  const loginForm = document.getElementById('adminLoginForm');
  const authError = document.getElementById('adminAuthError');
  const btnLogout = document.getElementById('btnAdminLogout');
  const authUserInput = document.getElementById('adminAuthUsername');
  const authPassInput = document.getElementById('adminAuthPassword');

  function checkAdminAuth() {
    const session = sessionStorage.getItem('ttw_admin_session');
    if (session === 'active') {
      if (authOverlay) authOverlay.classList.remove('active');
      return true;
    } else {
      if (authOverlay) {
        authOverlay.classList.add('active');
        if (authUserInput) setTimeout(() => authUserInput.focus(), 100);
      }
      return false;
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = (authUserInput ? authUserInput.value.trim().toLowerCase() : '');
      const p = (authPassInput ? authPassInput.value.trim() : '');

      // Accepted administrative credentials
      const validUsers = ['admin', 'mahesh'];
      const validPass = ['admin123', 'mahesh2026', 'admin'];

      if (validUsers.includes(u) && validPass.includes(p)) {
        sessionStorage.setItem('ttw_admin_session', 'active');
        if (authError) authError.classList.remove('visible');
        if (authOverlay) authOverlay.classList.remove('active');
        showAdminToast('👋 Welcome to Admin Console, ' + (u === 'mahesh' ? 'Mahesh' : 'Administrator') + '!');
        renderAll();
      } else {
        if (authError) authError.classList.add('visible');
        if (authPassInput) {
          authPassInput.value = '';
          authPassInput.focus();
        }
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('ttw_admin_session');
      if (authError) authError.classList.remove('visible');
      if (authPassInput) authPassInput.value = '';
      if (authOverlay) authOverlay.classList.add('active');
      showAdminToast('🔒 You have securely logged out.');
      if (authUserInput) setTimeout(() => authUserInput.focus(), 100);
    });
  }

  // Initial Run
  setupMediaHelpers();
  setupWordMaster();
  if (checkAdminAuth()) {
    renderAll();
  }
});
