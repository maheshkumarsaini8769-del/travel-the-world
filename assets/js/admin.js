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

  // Helper: Format asset URLs relative to admin subdirectory
  function formatAdminAssetUrl(url) {
    if (!url) return '../assets/images/featured-uluwatu.jpg';
    const u = String(url).trim();
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:') || u.startsWith('/')) {
      return u;
    }
    if (u.startsWith('../')) {
      return u;
    }
    return '../' + u;
  }

  const sanitize = (window.TravelStore && window.TravelStore.escapeHtml)
    ? window.TravelStore.escapeHtml
    : (t) => (t === null || t === undefined ? '' : String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]));

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
    toast.className = 'toast-msg admin-toast';
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
      const formatted = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const textSpan = document.getElementById('headerLiveDateText');
      if (textSpan) {
        textSpan.textContent = formatted;
      } else {
        headerDateEl.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> <span id="headerLiveDateText">' + formatted + '</span>';
      }
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

    // Dynamically render tables/charts for the active section without wiping form inputs
    if (tabId === 'dashboard') renderDashboard(currentDashboardPeriod);
    else if (tabId === 'tours') renderToursTable();
    else if (tabId === 'bookings') renderBookingsTable();
    else if (tabId === 'users') renderUsersTable();
    else if (tabId === 'coupons') renderCouponsTable();
    else if (tabId === 'inquiries') renderInquiriesTable();
    else if (tabId === 'reviews') renderReviewsTable();
    else if (tabId === 'blogs') renderBlogsTable();
    else if (tabId === 'faqs') renderFaqsTable();
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

  // Attach timeframe filter button events (scoped strictly to dashboard)
  const timeframeFilterButtons = document.querySelectorAll('#dashboardTimeFilters .btn-time-filter');
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

    if (kpiRating) kpiRating.textContent = `${stats.avgRating} / 5`;
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
      topTourBadge.innerHTML = `Highest performing package: <strong>${stats.topPerformingTour}</strong>`;
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
                <div style="font-size: 0.72rem; color: #64748b;"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${u.location} &bull; ${u.lastActive}</div>
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
            <td><svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${b.date}</td>
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
          <div style="font-weight: 600; color: #334155;"><svg class="ui-icon" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> ${u.email}</div>
          <div style="font-size: 0.78rem; color: #64748b;"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${u.phone || 'N/A'}</div>
        </td>
        <td><svg class="ui-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${u.location || 'India'}</td>
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
          <img src="${formatAdminAssetUrl(t.thumb || t.img)}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="${sanitize(t.title)}">
        </td>
        <td>
          <strong style="font-size: 0.95rem; color: #0f172a; display: block;">${sanitize(t.title)}</strong>
          <span style="font-size: 0.78rem; color: #64748b;">ID: ${sanitize(t.id)}</span>
        </td>
        <td><span class="status-pill status-in-progress">${sanitize(t.category)}</span></td>
        <td><strong style="font-size: 1rem; color: #0f172a;">₹${t.price.toLocaleString('en-IN')}</strong></td>
        <td><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${sanitize(t.duration)}</td>
        <td><svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${t.rating}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-tour-btn" data-id="${t.id}" title="Edit Tour"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            <button class="btn-action-icon delete delete-tour-btn" data-id="${t.id}" title="Delete Tour"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
      if (inputImg) inputImg.value = tour.img || 'assets/images/featured-uluwatu.jpg';
      if (inputDesc) inputDesc.value = tour.description;
      updateMediaPreview('previewTourImg', tour.img || 'assets/images/featured-uluwatu.jpg');
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Tour Package';
      tourForm.reset();
      if (inputId) inputId.value = '';
      if (inputImg) inputImg.value = 'assets/images/featured-uluwatu.jpg';
      updateMediaPreview('previewTourImg', 'assets/images/featured-uluwatu.jpg');
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

      showAdminToast(id ? 'Tour package updated successfully!' : 'New tour package published live!');
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
        (b.id || '').toLowerCase().includes(q) ||
        (b.customerName || b.guestName || '').toLowerCase().includes(q) ||
        (b.email || '').toLowerCase().includes(q) ||
        (b.tourTitle || '').toLowerCase().includes(q)
      );
    }

    if (bookings.length === 0) {
      bookingsTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: #94a3b8;">No bookings match the criteria.</td></tr>';
      return;
    }

    bookingsTableBody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong style="font-family: monospace; color: #2563eb;">${sanitize(b.id)}</strong></td>
        <td>
          <div style="font-weight: 700;">${sanitize(b.customerName || b.guestName || 'Traveler')}</div>
          <div style="font-size: 0.75rem; color: #64748b;">${sanitize(b.email)} &bull; ${sanitize(b.phone || '')}</div>
          <div style="font-size: 0.72rem; color: #059669;"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${sanitize(b.hotel || 'Hotel pickup')}</div>
        </td>
        <td><strong>${sanitize(b.tourTitle)}</strong></td>
        <td><svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg> ${sanitize(b.date)}</td>
        <td><svg class="ui-icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${b.guests} Pax</td>
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
            <button class="btn-action-icon view-voucher-btn" data-id="${b.id}" title="View Full Invoice / Voucher"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></button>
            <button class="btn-action-icon delete delete-booking-btn" data-id="${b.id}" title="Delete Booking"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
      showAdminToast('Bookings spreadsheet exported to CSV!');
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
            <div style="grid-column: 1 / -1;"><strong>Hotel Pickup:</strong> <svg class="ui-icon" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${booking.hotel}</div>
            ${booking.specialRequests ? `<div style="grid-column: 1 / -1; color: #2563eb;"><strong>Notes:</strong> ${booking.specialRequests}</div>` : ''}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #cbd5e1; padding-top: 1rem;">
            <span style="font-weight: 700; font-size: 1.1rem;">Total Billed:</span>
            <span style="font-size: 1.4rem; font-weight: 800; color: #059669;">₹${(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button onclick="window.print()" class="btn-admin-primary" style="flex: 1; justify-content: center;"><svg class="ui-icon" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Print Voucher</button>
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
            <button class="btn-action-icon view-inq-btn" data-id="${i.id}" title="View & Reply"><svg class="ui-icon" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>
            <button class="btn-action-icon delete delete-inq-btn" data-id="${i.id}" title="Delete Message"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
              <span><svg class="ui-icon" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Send Reply & Mark as Replied</span>
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
        <td><strong style="color: #f59e0b;">${/* rating */ '&#9733;'.repeat(r.rating || 5)}</strong></td>
        <td style="max-width: 280px;">
          <p style="font-size: 0.82rem; color: #475569; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 0;">
            "${r.comment}"
          </p>
          ${r.reply ? `
            <div style="margin-top: 0.35rem; padding: 0.25rem 0.5rem; background: #eff6ff; border-left: 2px solid #2563eb; border-radius: 4px; font-size: 0.74rem; color: #1e40af; line-height: 1.3;">
              <span style="font-weight: 700; color: #2563eb;">Reply:</span> "${r.reply.length > 50 ? r.reply.slice(0, 50) + '...' : r.reply}"
            </div>
          ` : ''}
        </td>
        <td>${r.date || 'Recent'}</td>
        <td>
          <button class="status-pill ${r.approved ? 'status-confirmed' : 'status-pending'} toggle-approval-btn" data-id="${r.id}" style="border: none; cursor: pointer;">
            ${r.approved ? 'Approved' : 'Pending Approval'}
          </button>
        </td>
        <td style="white-space: nowrap;">
          <button class="btn-action-icon reply-rev-btn" data-id="${r.id}" title="${r.reply ? 'Edit Concierge Reply' : 'Reply to Review'}" style="color: #2563eb; border-color: #bfdbfe; margin-right: 4px;">
            <svg class="ui-icon" viewBox="0 0 24 24"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          </button>
          <button class="btn-action-icon delete delete-rev-btn" data-id="${r.id}" title="Delete Review">
            <svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
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

    // Reply to review
    document.querySelectorAll('.reply-rev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openReviewReplyModal(id);
      });
    });

    // Delete review
    document.querySelectorAll('.delete-rev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this customer review? It will be removed from the store and website.')) {
          window.TravelStore.deleteReview(id);
          showAdminToast('Review removed.');
          renderReviewsTable();
          renderDashboard();
        }
      });
    });
  }

  function openReviewReplyModal(reviewId) {
    const rev = window.TravelStore.getReviews().find(r => r.id === reviewId);
    if (!rev) return;

    let modal = document.getElementById('adminReviewReplyModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adminReviewReplyModal';
      modal.className = 'admin-modal-backdrop';
      document.body.appendChild(modal);
    }

    const esc = (s) => (window.TravelStore ? window.TravelStore.escapeHtml(s || '') : (s || ''));

    modal.innerHTML = `
      <div class="admin-modal-box">
        <div class="admin-modal-header">
          <h3>Official Reply to Review: ${esc(rev.reviewerName || rev.author || 'Traveler')}</h3>
          <button class="admin-modal-close" onclick="document.getElementById('adminReviewReplyModal').classList.remove('active')">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
              <span style="font-weight: 700; color: #0f172a;">${esc(rev.reviewerName || rev.author || 'Traveler')} (${esc(rev.origin || 'India')})</span>
              <span style="color: #f59e0b; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: #f59e0b;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${rev.rating || 5}/5</span>
            </div>
            <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin: 0; font-style: italic;">
              "${esc(rev.comment || '')}"
            </p>
          </div>

          <form id="replyRevForm">
            <div class="admin-form-group">
              <label for="adminRevReplyText">Official Concierge Response (Displayed live on reviews.html and homepage)</label>
              <textarea id="adminRevReplyText" rows="4" class="admin-form-control" placeholder="Thank you for traveling with us! We are thrilled that you had a memorable experience..." required>${esc(rev.reply || '')}</textarea>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1rem;">
              <button type="submit" class="btn-admin-primary" style="flex: 2; justify-content: center; padding: 0.75rem;">
                <svg class="ui-icon" viewBox="0 0 24 24"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg> <span>${rev.reply ? 'Update Response' : 'Publish Response'}</span>
              </button>
              ${rev.reply ? `
                <button type="button" id="btnRemoveRevReply" class="btn-action-icon delete" style="flex: 1; justify-content: center; border-radius: 8px; height: auto; padding: 0.75rem;" title="Delete current reply">
                  <span>Delete Reply</span>
                </button>
              ` : ''}
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    document.getElementById('replyRevForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const replyText = document.getElementById('adminRevReplyText').value;
      window.TravelStore.replyToReview(reviewId, replyText);
      showAdminToast(`Response published for ${rev.reviewerName}! Reflected across website.`);
      modal.classList.remove('active');
      renderReviewsTable();
    });

    document.getElementById('btnRemoveRevReply')?.addEventListener('click', () => {
      if (confirm('Delete official response from this review?')) {
        window.TravelStore.replyToReview(reviewId, '');
        showAdminToast('Official response removed.');
        modal.classList.remove('active');
        renderReviewsTable();
      }
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
            <button class="btn-action-icon edit-coupon-btn" data-code="${c.code}" title="Edit Coupon"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            <button class="btn-action-icon delete delete-coupon-btn" data-code="${c.code}" title="Delete Coupon"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
      showAdminToast(`Coupon <strong>${code}</strong> saved successfully!`);
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
          <img src="${formatAdminAssetUrl(b.image)}" alt="${sanitize(b.title)}" style="width: 55px; height: 38px; object-fit: cover; border-radius: 4px;">
        </td>
        <td style="max-width: 320px;">
          <div style="font-weight: 700; color: #0f172a; line-height: 1.3;">${sanitize(b.title)}</div>
          <span style="font-size: 0.72rem; color: #2563eb; background: #eff6ff; padding: 0.1rem 0.4rem; border-radius: 3px; font-weight: 600;">${sanitize(b.category)}</span>
        </td>
        <td>${sanitize(b.readTime || '5 min read')}</td>
        <td>${sanitize(b.author || 'Editorial')}</td>
        <td>${sanitize(b.date || 'Recent')}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-blog-btn" data-id="${b.id}" title="Edit Article"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            <button class="btn-action-icon delete delete-blog-btn" data-id="${b.id}" title="Delete Article"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
        const blogImgVal = b.image || b.img || 'assets/images/featured-uluwatu.jpg';
        document.getElementById('formBlogImage').value = blogImgVal;
        updateMediaPreview('previewBlogImg', blogImgVal);
        document.getElementById('formBlogSummary').value = b.excerpt || b.summary || '';
        const contentInput = document.getElementById('formBlogContent');
        if (contentInput) contentInput.value = b.content || '';

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
      const bImg = document.getElementById('formBlogImage');
      if (bImg) bImg.value = 'assets/images/featured-uluwatu.jpg';
      updateMediaPreview('previewBlogImg', 'assets/images/featured-uluwatu.jpg');
      const contentInput = document.getElementById('formBlogContent');
      if (contentInput) contentInput.value = '';
      blogModal.classList.add('active');
    });
  }

  if (blogForm) {
    blogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('formBlogId').value;
      const imgVal = document.getElementById('formBlogImage').value.trim() || 'assets/images/featured-uluwatu.jpg';
      const summaryVal = document.getElementById('formBlogSummary').value.trim();
      const contentVal = document.getElementById('formBlogContent')?.value.trim() || summaryVal;

      const blogObj = {
        id: id || undefined,
        title: document.getElementById('formBlogTitle').value.trim(),
        category: document.getElementById('formBlogCategory').value,
        readTime: document.getElementById('formBlogReadTime').value.trim(),
        author: document.getElementById('formBlogAuthor').value.trim(),
        image: imgVal,
        img: imgVal,
        excerpt: summaryVal,
        content: contentVal,
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };

      window.TravelStore.saveBlog(blogObj);
      showAdminToast('Travel guide article published live to blog.html!');
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

    setVal('aboutHeroStory', settings.aboutStory || settings.aboutStoryLead || 'Founded in 2012 by Balinese cultural explorers and Indian hospitality experts, Travel The World has guided over 42,000 travelers across the enchanting landscapes of Bali. We bridge authentic Balinese spirituality with high-touch Indian hospitality, offering pure vegetarian catering, bespoke private chauffeurs, and verified luxury experiences.');
    setVal('aboutHeroImgInput', settings.aboutHeroImg || 'assets/images/featured-uluwatu.jpg');
    setVal('aboutStatYears', settings.statYears || settings.aboutStatYearsVal || '14+');
    setVal('aboutStatTravelers', settings.statTravelers || settings.aboutStatTravelersVal || '42,000+');
    setVal('aboutStatTours', settings.statTours || settings.aboutStatToursVal || '18+');
    setVal('aboutStatRating', settings.statRating || settings.aboutStatRatingVal || '4.9 / 5');

    const previewAbout = document.getElementById('previewAboutHero');
    if (previewAbout && settings.aboutHeroImg) {
      previewAbout.src = (settings.aboutHeroImg.startsWith('assets/') ? `../${settings.aboutHeroImg}` : settings.aboutHeroImg);
    }

    const teamEditor = document.getElementById('aboutTeamEditor');
    if (teamEditor) {
      const teamList = settings.aboutTeam || [];
      teamEditor.value = teamList.map(t => `${t.name} | ${t.role} | ${t.origin || 'Bali Native'} | ${t.years || '8 Yrs Guiding'}`).join('\n');
    }
  }

  const btnSaveTeam = document.getElementById('btnSaveTeam');
  if (btnSaveTeam) {
    btnSaveTeam.addEventListener('click', () => {
      const teamEditor = document.getElementById('aboutTeamEditor');
      if (!teamEditor) return;
      const lines = teamEditor.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const parsedTeam = lines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        return {
          name: parts[0] || 'Guide Expert',
          role: parts[1] || 'Senior Guide',
          origin: parts[2] || 'Bali Native',
          years: parts[3] || '5+ Yrs Guiding'
        };
      });
      window.TravelStore.saveSettings({ aboutTeam: parsedTeam });
      showAdminToast(`Saved ${parsedTeam.length} Balinese team member(s)!`);
    });
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
      showAdminToast('About Us story, showcase image, and live counters saved!');
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
        <td style="font-weight: 700; color: #0f172a; max-width: 250px;">${f.question || f.q}</td>
        <td style="font-size: 0.85rem; color: #475569; max-width: 320px;">
          <p style="margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${f.answer || f.a}</p>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn-action-icon edit-faq-btn" data-idx="${idx}" title="Edit FAQ"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
            <button class="btn-action-icon delete delete-faq-btn" data-idx="${idx}" title="Delete FAQ"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
        document.getElementById('formFaqQuestion').value = f.question || f.q || '';
        document.getElementById('formFaqAnswer').value = f.answer || f.a || '';

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
      showAdminToast('FAQ updated and live on contact.html!');
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
    document.getElementById('setCompanyName').value = settings.companyName || settings.footerCompanyName || '';
    document.getElementById('setTagline').value = settings.tagline || settings.footerTagline || '';
    document.getElementById('setCurrencySymbol').value = settings.currencySymbol || '₹';
    document.getElementById('setContactEmail').value = settings.contactEmail || '';
    document.getElementById('setContactPhone').value = settings.contactPhone || '';
    document.getElementById('setAddress').value = settings.address || '';

    // Logo Studio Inputs
    const setLogoScript = document.getElementById('setLogoScript');
    const setLogoSub = document.getElementById('setLogoSub');
    const setLogoImage = document.getElementById('setLogoImage');
    const setLogoType = document.getElementById('setLogoType');
    const setLogoHeight = document.getElementById('setLogoHeight');

    if (setLogoScript) setLogoScript.value = settings.logoScript || 'orizon';
    if (setLogoSub) setLogoSub.value = settings.logoSub || 'TRAVEL & HOLIDAYS';
    if (setLogoImage) setLogoImage.value = settings.logoImage || 'assets/images/brand-logo.svg';
    if (setLogoType) setLogoType.value = settings.logoType || 'both';
    if (setLogoHeight) setLogoHeight.value = settings.logoHeight || 44;

    updateAdminLogoPreview();

    const airportEl = document.getElementById('setAddonAirport');
    const droneEl = document.getElementById('setAddonDrone');
    const foodEl = document.getElementById('setAddonFood');
    if (airportEl) airportEl.value = settings.addonAirportPrice !== undefined ? settings.addonAirportPrice : 2500;
    if (droneEl) droneEl.value = settings.addonDronePrice !== undefined ? settings.addonDronePrice : 4500;
    if (foodEl) foodEl.value = settings.addonFoodPrice !== undefined ? settings.addonFoodPrice : 6000;

    populateAdminSelfCreds();
    renderAdminAccountsTable();
  }

  function updateAdminLogoPreview() {
    const previewImg = document.getElementById('adminLogoPreviewImg');
    const previewScript = document.getElementById('adminLogoPreviewScript');
    const previewSub = document.getElementById('adminLogoPreviewSub');
    const previewTextWrap = document.getElementById('adminLogoPreviewText');

    const scriptVal = (document.getElementById('setLogoScript')?.value || 'orizon').trim();
    const subVal = (document.getElementById('setLogoSub')?.value || 'TRAVEL & HOLIDAYS').trim();
    const imgSrc = (document.getElementById('setLogoImage')?.value || 'assets/images/brand-logo.svg').trim();
    const mode = document.getElementById('setLogoType')?.value || 'both';
    const heightVal = parseInt(document.getElementById('setLogoHeight')?.value, 10) || 44;

    if (previewScript) previewScript.textContent = scriptVal;
    if (previewSub) previewSub.textContent = subVal;

    if (previewImg) {
      if (mode === 'text' || !imgSrc) {
        previewImg.style.display = 'none';
      } else {
        previewImg.style.display = 'inline-block';
        const finalSrc = (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('/'))
          ? '../' + imgSrc
          : imgSrc;
        previewImg.src = finalSrc;
        previewImg.style.height = heightVal + 'px';
      }
    }

    if (previewTextWrap) {
      previewTextWrap.style.display = (mode === 'image') ? 'none' : 'flex';
    }
  }

  // Live input listeners for Logo Studio
  ['setLogoScript', 'setLogoSub', 'setLogoImage', 'setLogoType', 'setLogoHeight'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateAdminLogoPreview);
      el.addEventListener('change', updateAdminLogoPreview);
    }
  });

  // Preset Buttons for Logo Studio
  const btnPresetSvg = document.getElementById('btnPresetLogoSvg');
  if (btnPresetSvg) {
    btnPresetSvg.addEventListener('click', () => {
      const imgInput = document.getElementById('setLogoImage');
      if (imgInput) imgInput.value = 'assets/images/brand-logo.svg';
      updateAdminLogoPreview();
      showAdminToast('Applied Vector SVG Logo preset!');
    });
  }

  const btnPresetJpg = document.getElementById('btnPresetLogoJpg');
  if (btnPresetJpg) {
    btnPresetJpg.addEventListener('click', () => {
      const imgInput = document.getElementById('setLogoImage');
      if (imgInput) imgInput.value = 'assets/images/brand-logo.jpg';
      updateAdminLogoPreview();
      showAdminToast('Applied Orizon Badge (HD) preset!');
    });
  }

  // File Upload Button & File Input for Custom Logo
  const btnUploadLogo = document.getElementById('btnUploadLogoFile');
  const uploadLogoInput = document.getElementById('uploadLogoFileInput');
  if (btnUploadLogo && uploadLogoInput) {
    btnUploadLogo.addEventListener('click', () => {
      uploadLogoInput.click();
    });
    uploadLogoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        const imgInput = document.getElementById('setLogoImage');
        if (imgInput) imgInput.value = dataUrl;
        updateAdminLogoPreview();
        showAdminToast(`Uploaded logo: ${file.name} (Ready to save)`);
      };
      reader.readAsDataURL(file);
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.TravelStore.saveSettings({
        companyName: document.getElementById('setCompanyName').value,
        logoScript: document.getElementById('setLogoScript')?.value || 'orizon',
        logoSub: document.getElementById('setLogoSub')?.value || 'TRAVEL & HOLIDAYS',
        logoImage: document.getElementById('setLogoImage')?.value || 'assets/images/brand-logo.svg',
        logoType: document.getElementById('setLogoType')?.value || 'both',
        logoHeight: parseInt(document.getElementById('setLogoHeight')?.value, 10) || 44,
        tagline: document.getElementById('setTagline').value,
        currencySymbol: document.getElementById('setCurrencySymbol').value,
        contactEmail: document.getElementById('setContactEmail').value,
        contactPhone: document.getElementById('setContactPhone').value,
        address: document.getElementById('setAddress').value,
        addonAirportPrice: parseInt(document.getElementById('setAddonAirport')?.value, 10) || 2500,
        addonDronePrice: parseInt(document.getElementById('setAddonDrone')?.value, 10) || 4500,
        addonFoodPrice: parseInt(document.getElementById('setAddonFood')?.value, 10) || 6000
      });
      showAdminToast('Website Name, Brand Logo & System Settings saved successfully!');
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('WARNING: This will reset all Tours, Bookings, Inquiries, and Reviews back to default demo state. Continue?')) {
        window.TravelStore.resetToDefaults();
        showAdminToast('Database reset to clean defaults.');
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
      showAdminToast('Database exported to JSON file.');
    });
  }

  // =========================================================================
  // ADMIN CREDENTIALS & SECURITY MANAGEMENT
  // (Change Email, Password, and Manage Staff Logins)
  // =========================================================================
  const selfCredsForm = document.getElementById('adminSelfCredsForm');
  const btnToggleMyPassword = document.getElementById('btnToggleMyPassword');
  const btnToggleLoginPassword = document.getElementById('btnToggleLoginPassword');
  const adminAccountsTableBody = document.getElementById('adminAccountsTableBody');
  const btnAddNewAdminUser = document.getElementById('btnAddNewAdminUser');
  const adminAccountModal = document.getElementById('adminAccountModal');
  const adminAccountForm = document.getElementById('adminAccountForm');
  const adminUserPill = document.getElementById('adminUserPill');

  function updateHeaderUserPill(user) {
    if (!user) return;
    const nameEl = document.getElementById('adminHeaderUserName');
    const roleEl = document.getElementById('adminHeaderUserRole');
    const avatarEl = document.getElementById('adminHeaderAvatar');
    if (nameEl) nameEl.textContent = user.name || 'Mahesh Saini';
    if (roleEl) roleEl.textContent = user.role || 'Super Admin';
    if (avatarEl && user.name) {
      avatarEl.textContent = user.name.trim().charAt(0).toUpperCase();
    }
  }

  function populateAdminSelfCreds() {
    if (!window.TravelStore) return;
    const primary = window.TravelStore.getPrimaryAdmin();
    if (primary) {
      const nameInput = document.getElementById('adminMyName');
      const emailInput = document.getElementById('adminMyEmail');
      const userInput = document.getElementById('adminMyUsername');
      const passInput = document.getElementById('adminMyPassword');
      if (nameInput) nameInput.value = primary.name || 'Mahesh Saini';
      if (emailInput) emailInput.value = primary.email || 'maheshkumarsaini8769@gmail.com';
      if (userInput) userInput.value = primary.username || 'mahesh';
      if (passInput) passInput.value = primary.password || 'mahesh99830';

      updateHeaderUserPill(primary);

      const hintEl = document.getElementById('adminAuthHint');
      if (hintEl) {
        hintEl.innerHTML = `<svg class="ui-icon" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> <strong>Admin Login:</strong> <code>${window.TravelStore.escapeHtml(primary.email)}</code> &bull; Password: <code>${window.TravelStore.escapeHtml(primary.password)}</code>`;
      }
    }
  }

  function renderAdminAccountsTable() {
    if (!adminAccountsTableBody || !window.TravelStore) return;
    const accounts = window.TravelStore.getAdminAccounts();
    adminAccountsTableBody.innerHTML = accounts.map((acc) => `
      <tr data-acc-id="${acc.id}">
        <td>
          <div style="font-weight: 700; color: #0f172a;">${window.TravelStore.escapeHtml(acc.name || 'Staff User')}</div>
          ${acc.isPrimary ? '<span style="display: inline-block; font-size: 0.7rem; font-weight: 800; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 10px; margin-top: 3px;">Primary Account</span>' : ''}
        </td>
        <td>
          <div style="font-size: 0.85rem; font-weight: 600; color: #1e293b;">${window.TravelStore.escapeHtml(acc.email || '')}</div>
          ${acc.username ? `<span style="font-size: 0.75rem; color: #64748b;">User: ${window.TravelStore.escapeHtml(acc.username)}</span>` : ''}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <code class="acc-pass-text" style="font-size: 0.82rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;" data-password="${window.TravelStore.escapeHtml(acc.password || '')}">••••••••</code>
            <button type="button" class="btn-toggle-row-pass" style="background: none; border: none; cursor: pointer; color: #64748b; padding: 2px;" title="Show/Hide Password" aria-label="Show password">
              <svg class="ui-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </td>
        <td>
          <span style="font-size: 0.78rem; font-weight: 700; padding: 3px 8px; border-radius: 12px; background: ${acc.role === 'Super Admin' ? '#e0e7ff; color: #3730a3;' : '#f3f4f6; color: #374151;'}">
            ${window.TravelStore.escapeHtml(acc.role || 'Manager')}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-action-icon edit-acc-btn" data-id="${acc.id}" title="Edit Credentials">
              <svg class="ui-icon" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            ${!acc.isPrimary && accounts.length > 1 ? `
              <button type="button" class="btn-action-icon delete delete-acc-btn" data-id="${acc.id}" title="Remove Login Account">
                <svg class="ui-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Attach row password eye toggles
    adminAccountsTableBody.querySelectorAll('.btn-toggle-row-pass').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('tr');
        const code = row ? row.querySelector('.acc-pass-text') : null;
        if (code) {
          const pass = code.getAttribute('data-password');
          if (code.textContent === '••••••••') {
            code.textContent = pass;
          } else {
            code.textContent = '••••••••';
          }
        }
      });
    });

    // Attach edit button listeners
    adminAccountsTableBody.querySelectorAll('.edit-acc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const acc = accounts.find(a => a.id === id);
        if (acc && adminAccountModal) {
          document.getElementById('adminAccountModalTitle').textContent = 'Edit Login Credentials';
          document.getElementById('formAccId').value = acc.id;
          document.getElementById('formAccName').value = acc.name || '';
          document.getElementById('formAccEmail').value = acc.email || '';
          document.getElementById('formAccUsername').value = acc.username || '';
          document.getElementById('formAccPassword').value = acc.password || '';
          document.getElementById('formAccRole').value = acc.role || 'Tour Manager';
          adminAccountModal.classList.add('active');
        }
      });
    });

    // Attach delete button listeners
    adminAccountsTableBody.querySelectorAll('.delete-acc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const acc = accounts.find(a => a.id === id);
        if (acc && confirm(`Are you sure you want to remove access for "${acc.name}" (${acc.email})?`)) {
          window.TravelStore.deleteAdminAccount(id);
          showAdminToast(`Login access removed for ${acc.name}.`);
          renderAdminAccountsTable();
        }
      });
    });
  }

  // Toggle my password visibility
  if (btnToggleMyPassword) {
    btnToggleMyPassword.addEventListener('click', () => {
      const passInput = document.getElementById('adminMyPassword');
      if (passInput) {
        passInput.type = passInput.type === 'password' ? 'text' : 'password';
      }
    });
  }

  // Toggle login password visibility
  if (btnToggleLoginPassword) {
    btnToggleLoginPassword.addEventListener('click', () => {
      if (authPassInput) {
        authPassInput.type = authPassInput.type === 'password' ? 'text' : 'password';
      }
    });
  }

  // My Self Credentials Form Submission
  if (selfCredsForm) {
    selfCredsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('adminMyName').value.trim();
      const email = document.getElementById('adminMyEmail').value.trim();
      const username = document.getElementById('adminMyUsername').value.trim();
      const password = document.getElementById('adminMyPassword').value.trim();

      if (!email || !password) {
        showAdminToast('Email and password are required!');
        return;
      }

      window.TravelStore.updatePrimaryAdmin({ name, email, username, password });
      updateHeaderUserPill({ name, role: 'Super Admin' });
      renderAdminAccountsTable();
      showAdminToast('Super Admin credentials updated successfully! New login details saved.');
    });
  }

  // Add New Admin User Modal Button
  if (btnAddNewAdminUser && adminAccountModal) {
    btnAddNewAdminUser.addEventListener('click', () => {
      document.getElementById('adminAccountModalTitle').textContent = 'Add Staff / Admin Login';
      document.getElementById('formAccId').value = '';
      if (adminAccountForm) adminAccountForm.reset();
      adminAccountModal.classList.add('active');
    });
  }

  // Staff Account Form Submission
  if (adminAccountForm) {
    adminAccountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('formAccId').value.trim();
      const name = document.getElementById('formAccName').value.trim();
      const email = document.getElementById('formAccEmail').value.trim();
      const username = document.getElementById('formAccUsername').value.trim();
      const password = document.getElementById('formAccPassword').value.trim();
      const role = document.getElementById('formAccRole').value;

      if (!email || !password) {
        showAdminToast('Email and password are required.');
        return;
      }

      window.TravelStore.saveAdminAccount({ id: id || undefined, name, email, username, password, role });
      adminAccountModal?.classList.remove('active');
      renderAdminAccountsTable();
      showAdminToast(`Login credentials saved for ${name}!`);
    });
  }

  // Header user pill click to jump to credentials
  if (adminUserPill) {
    adminUserPill.addEventListener('click', () => {
      const settingsTab = document.querySelector('.sidebar-link[data-tab="settings"]');
      if (settingsTab) {
        settingsTab.click();
        setTimeout(() => {
          const sec = document.getElementById('adminSecurityCard');
          if (sec) {
            sec.scrollIntoView({ behavior: 'smooth' });
            document.getElementById('adminMyPassword')?.focus();
          }
        }, 150);
      }
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

    // Live Video Player in Admin (Strictly Muted / Soundless)
    const previewVid = document.getElementById('previewHeroVideoPlayer');
    if (previewVid) {
      const vidSrc = settings.heroVideoUrl || 'assets/videos/hero-bali.mp4';
      previewVid.muted = true;
      previewVid.volume = 0;
      previewVid.defaultMuted = true;
      previewVid.src = (vidSrc.startsWith('http') || vidSrc.startsWith('data:')) ? vidSrc : '../' + vidSrc;
      previewVid.load();
      previewVid.play().catch(() => {});
    }
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
        showAdminToast('Activated <strong>Normal Mode</strong> (Festival deactivated, clean luxury standard)');
      } else {
        window.TravelStore.saveSettings({
          activeTheme: theme,
          festivalBannerActive: true,
          festiveParticlesEnabled: true
        });
        const titles = {
          diwali: 'Diwali Festive Gold',
          holi: 'Holi Color Fiesta',
          newyear: 'Christmas & New Year',
          monsoon: 'Monsoon Romance',
          classic: 'Classic Bali Luxury'
        };
        showAdminToast(`Activated Theme: <strong>${titles[theme] || theme}</strong>`);
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

      const setIfVal = (obj, key, val) => {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          obj[key] = val;
        }
      };

      const newSettings = {
        festivalBannerActive: festiveActive,
        aiConciergeEnabled: aiActive,
        festiveParticlesEnabled: particlesActive,
        cardTiltPhysicsEnabled: tiltActive,
        virtual360TourEnabled: virtual360Active
      };

      setIfVal(newSettings, 'festivalBannerBadge', getVal('customFestiveBadge'));
      setIfVal(newSettings, 'festivalBannerText', getVal('customFestiveText'));
      setIfVal(newSettings, 'festivalBannerLink', getVal('customFestiveLink'));
      setIfVal(newSettings, 'festivalBannerCta', getVal('customFestiveCta'));

      setIfVal(newSettings, 'heroTitle', getVal('customHeroSlide1Title') || getVal('customHeroTitle'));
      setIfVal(newSettings, 'heroDescription', getVal('customHeroSlide1Desc') || getVal('customHeroDesc'));
      setIfVal(newSettings, 'heroVideoUrl', getVal('customHeroVideo'));
      setIfVal(newSettings, 'heroPosterUrl', getVal('customHeroPoster'));
      setIfVal(newSettings, 'heroCtaText', getVal('customHeroCtaText'));
      setIfVal(newSettings, 'heroCtaLink', getVal('customHeroCtaLink'));

      setIfVal(newSettings, 'heroSlide1Img', getVal('customHeroSlide1Img'));
      setIfVal(newSettings, 'heroSlide1Title', getVal('customHeroSlide1Title'));
      setIfVal(newSettings, 'heroSlide1Desc', getVal('customHeroSlide1Desc'));

      setIfVal(newSettings, 'heroSlide2Img', getVal('customHeroSlide2Img'));
      setIfVal(newSettings, 'heroSlide2Title', getVal('customHeroSlide2Title'));
      setIfVal(newSettings, 'heroSlide2Desc', getVal('customHeroSlide2Desc'));

      setIfVal(newSettings, 'heroSlide3Img', getVal('customHeroSlide3Img'));
      setIfVal(newSettings, 'heroSlide3Title', getVal('customHeroSlide3Title'));
      setIfVal(newSettings, 'heroSlide3Desc', getVal('customHeroSlide3Desc'));

      setIfVal(newSettings, 'exploreTitle', getVal('customExploreTitle'));
      setIfVal(newSettings, 'exploreSubtitle', getVal('customExploreSubtitle'));
      setIfVal(newSettings, 'exploreBackdropImg', getVal('customExploreBackdropImg'));
      setIfVal(newSettings, 'cloudMistHint', getVal('customCloudHint'));

      setIfVal(newSettings, 'tickerWeather', getVal('customTickerWeather'));
      setIfVal(newSettings, 'tickerGoldenHour', getVal('customTickerGoldenHour'));
      setIfVal(newSettings, 'tickerForex', getVal('customTickerForex'));

      setIfVal(newSettings, 'logoScript', getVal('customLogoScript'));
      setIfVal(newSettings, 'logoSub', getVal('customLogoSub'));
      setIfVal(newSettings, 'companyName', getVal('customCompanyName'));
      setIfVal(newSettings, 'contactPhone', getVal('customContactPhone'));
      setIfVal(newSettings, 'contactEmail', getVal('customContactEmail'));
      setIfVal(newSettings, 'address', getVal('customAddress'));
      setIfVal(newSettings, 'copyrightText', getVal('customCopyright'));

      window.TravelStore.saveSettings(newSettings);
      showAdminToast('All live media & content changes published to website!');
    });
  }

  // Restore Default Customizer Settings
  if (btnResetCustomizer) {
    btnResetCustomizer.addEventListener('click', () => {
      if (confirm('Restore default festival theme and homepage texts?')) {
        window.TravelStore.saveSettings({
          activeTheme: 'diwali',
          festivalBannerActive: true,
          festivalBannerBadge: 'DIWALI SPECIAL',
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
          cloudMistHint: 'Move mouse to part clouds in 150-200px radius around cursor • Real-time mist',
          tickerWeather: 'Climate: 29°C Tropical Clear Skies',
          tickerGoldenHour: 'Uluwatu Golden Hour: Sunset at 18:14 WITA',
          tickerForex: 'Forex Benchmark: ₹1 INR ≈ 190.5 IDR (Zero conversion fee on all tours)',
          logoScript: 'travel',
          logoSub: 'THE WORLD',
          companyName: 'Travel The World',
          contactPhone: '+91 98200 12345 / +62 361 720 892',
          contactEmail: 'concierge@traveltheworld.bali',
          address: 'Jl. Danau Tamblingan No. 42, Sanur, Bali & Connaught Place, New Delhi',
          copyrightText: '© 2026 Travel The World. Handcrafted luxury travel & bespoke tours in Indian Rupees.'
        });
        showAdminToast('Restored default theme and texts.');
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
          if (el && el.value !== undefined) {
            const val = el.value.trim();
            if (val !== '') {
              const storeKey = wordFieldMap[elemId];
              newWords[storeKey] = val;
            }
          }
        });

        window.TravelStore.saveSettings(newWords);
        showAdminToast('All website words & copy updated live across all 8 pages!');
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
          showAdminToast('Factory default words restored across all pages!');
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

  // Automatic Canvas Compressor for Images (Reduces 10MB Camera/Gallery Photos to ~120KB Web-Ready Data URL)
  function compressImageFile(file, callback, maxWidth = 1280, maxHeight = 1280, quality = 0.82) {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => callback(loadEvt.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        callback(compressedDataUrl);
      };
      img.onerror = () => {
        callback(loadEvt.target.result);
      };
      img.src = loadEvt.target.result;
    };
    reader.readAsDataURL(file);
  }

  function setupMediaHelpers() {
    // 1. Interactive File-to-Base64 Uploads for Images with automatic compression
    const uploadPairs = [
      { fileId: 'uploadTourImg', targetInputId: 'formTourImg', previewId: 'previewTourImg' },
      { fileId: 'uploadBlogImg', targetInputId: 'formBlogImage', previewId: 'previewBlogImg' },
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
          showAdminToast(`Processing <strong>${file.name}</strong> from gallery...`);
          compressImageFile(file, (dataUrl) => {
            targetInput.value = dataUrl;
            targetInput.dispatchEvent(new Event('input'));
            if (pair.previewId) {
              const prev = document.getElementById(pair.previewId);
              if (prev) prev.src = dataUrl;
            }
            showAdminToast(`Image <strong>${file.name}</strong> ready & optimized! Remember to save.`);
          });
        });
      }
    });

    // Dedicated MP4 Hero Video File Upload (Handles video without canvas corruption)
    const uploadHeroVideo = document.getElementById('uploadHeroVideo');
    if (uploadHeroVideo) {
      uploadHeroVideo.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > 4.5 * 1024 * 1024) {
          showAdminToast(`Notice: <strong>${file.name}</strong> is larger than 4.5MB. Direct MP4 URLs or 4K Presets are recommended for top speed.`);
        }
        showAdminToast(`Loading video <strong>${file.name}</strong>...`);
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const videoData = loadEvt.target.result;
          const target = document.getElementById('customHeroVideo');
          if (target) {
            target.value = videoData;
            target.dispatchEvent(new Event('input'));
          }
          const prevVid = document.getElementById('previewHeroVideoPlayer');
          if (prevVid) {
            prevVid.muted = true;
            prevVid.volume = 0;
            prevVid.defaultMuted = true;
            prevVid.src = videoData;
            prevVid.load();
            prevVid.play().catch(() => {});
          }
          showAdminToast(`Video <strong>${file.name}</strong> ready (Silent/Muted)! Click 'Save & Publish' to apply.`);
        };
        reader.readAsDataURL(file);
      });
    }

    // 2. Typing or pasting custom URL updates image preview immediately
    const previewBindings = [
      { inputId: 'formTourImg', previewId: 'previewTourImg' },
      { inputId: 'formBlogImage', previewId: 'previewBlogImg' },
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

    // Custom Hero Video URL input listener
    const heroVidInput = document.getElementById('customHeroVideo');
    if (heroVidInput) {
      heroVidInput.addEventListener('input', (e) => {
        const prevVid = document.getElementById('previewHeroVideoPlayer');
        if (prevVid && e.target.value) {
          const val = e.target.value.trim();
          prevVid.muted = true;
          prevVid.volume = 0;
          prevVid.defaultMuted = true;
          prevVid.src = (val.startsWith('http') || val.startsWith('data:')) ? val : '../' + val;
          prevVid.load();
          prevVid.play().catch(() => {});
        }
      });
    }

    // 3. Preset Quick-Select Dropdowns for Tours & Blog
    const tourPreset = document.getElementById('selectTourPreset');
    if (tourPreset) {
      tourPreset.addEventListener('change', (e) => {
        if (e.target.value) {
          const inp = document.getElementById('formTourImg');
          if (inp) {
            inp.value = e.target.value;
            inp.dispatchEvent(new Event('input'));
            updateMediaPreview('previewTourImg', e.target.value);
            showAdminToast(`Selected preset: <strong>${e.target.value}</strong>`);
          }
        }
      });
    }

    const blogPreset = document.getElementById('selectBlogPreset');
    if (blogPreset) {
      blogPreset.addEventListener('change', (e) => {
        if (e.target.value) {
          const inp = document.getElementById('formBlogImage');
          if (inp) {
            inp.value = e.target.value;
            inp.dispatchEvent(new Event('input'));
            updateMediaPreview('previewBlogImg', e.target.value);
            showAdminToast(`Selected preset: <strong>${e.target.value}</strong>`);
          }
        }
      });
    }

    // 4. Preset Quick-Select Buttons (For Video and Slides)
    document.querySelectorAll('.btn-preset-media').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const val = btn.getAttribute('data-val');
        const previewId = btn.getAttribute('data-preview');
        const inp = document.getElementById(targetId);
        if (inp && val) {
          inp.value = val;
          inp.dispatchEvent(new Event('input'));
          if (previewId) {
            updateMediaPreview(previewId, val);
          }
          if (targetId === 'customHeroVideo') {
            const prevVid = document.getElementById('previewHeroVideoPlayer');
            if (prevVid) {
              prevVid.muted = true;
              prevVid.volume = 0;
              prevVid.defaultMuted = true;
              prevVid.src = (val.startsWith('http') || val.startsWith('data:')) ? val : '../' + val;
              prevVid.load();
              prevVid.play().catch(() => {});
            }
          }
          showAdminToast(`Selected preset: <strong>${btn.textContent.trim()}</strong>. Click 'Save & Publish'!`);
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
    populateAdminSelfCreds();
    renderAdminAccountsTable();
    populateCustomizer();
    populateWords();
  }

  // Listen to cross-page updates
  window.addEventListener('ttw:store-updated', () => {
    renderAll();
  });

  // Cloud Backend Sync Badge Controller
  const cloudBadge = document.getElementById('cloudSyncBadge');
  const cloudText = document.getElementById('cloudSyncText');

  function updateCloudBadge(detail) {
    if (!cloudBadge || !cloudText) return;
    const state = detail?.state || 'synced';
    const ver = detail?.version || 1;

    if (state === 'syncing') {
      cloudBadge.style.background = 'rgba(234, 179, 8, 0.15)';
      cloudBadge.style.color = '#ca8a04';
      cloudBadge.style.borderColor = 'rgba(234, 179, 8, 0.35)';
      cloudText.textContent = 'Cloud: Syncing...';
    } else if (state === 'checking') {
      cloudBadge.style.background = 'rgba(37, 99, 235, 0.12)';
      cloudBadge.style.color = '#2563eb';
      cloudBadge.style.borderColor = 'rgba(37, 99, 235, 0.3)';
      cloudText.textContent = 'Cloud: Checking...';
    } else if (state === 'synced') {
      cloudBadge.style.background = 'rgba(16, 185, 129, 0.12)';
      cloudBadge.style.color = '#059669';
      cloudBadge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      cloudText.textContent = `Cloud: Synced (v${ver})`;
    } else if (state === 'offline' || state === 'error') {
      cloudBadge.style.background = 'rgba(239, 68, 68, 0.12)';
      cloudBadge.style.color = '#dc2626';
      cloudBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      cloudText.textContent = 'Cloud: Offline (Local)';
    }
  }

  window.addEventListener('ttw:sync-status', (e) => {
    updateCloudBadge(e.detail);
  });

  if (cloudBadge) {
    cloudBadge.addEventListener('click', async () => {
      showToast('Connecting to Cloud Backend...', 'info');
      if (cloudText) cloudText.textContent = 'Cloud: Syncing...';
      try {
        const res = await window.TravelStore.syncWithBackend(true);
        if (res && res.success) {
          showToast(`Cloud Synchronized! Active Version: ${res.version}`, 'success');
          renderAll();
        } else {
          showToast('Using local cached store. Backend will auto-reconnect.', 'info');
        }
      } catch (err) {
        showToast('Local offline store active.', 'info');
      }
    });

    if (window.TravelStore && typeof window.TravelStore.getCloudSyncStatus === 'function') {
      updateCloudBadge(window.TravelStore.getCloudSyncStatus());
    }
  }

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
      try {
        const storedUser = sessionStorage.getItem('ttw_admin_user');
        if (storedUser) {
          updateHeaderUserPill(JSON.parse(storedUser));
        } else if (window.TravelStore) {
          updateHeaderUserPill(window.TravelStore.getPrimaryAdmin());
        }
      } catch (e) {}
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
      const u = (authUserInput ? authUserInput.value.trim() : '');
      const p = (authPassInput ? authPassInput.value.trim() : '');

      let verified = null;
      if (window.TravelStore && typeof window.TravelStore.verifyAdminLogin === 'function') {
        verified = window.TravelStore.verifyAdminLogin(u, p);
      } else {
        const q = u.toLowerCase();
        if ((q === 'sainidevendra416@gmail.com' || q === 'devendra' || q === 'sainidevendra416') &&
            (p === '27101993' || p === 'mahesh99830')) {
          verified = { success: true, user: { name: 'Devendra Saini', role: 'Super Admin', email: 'sainidevendra416@gmail.com' } };
        } else if ((q === 'maheshkumarsaini8769@gmail.com' || q === 'mahesh' || q === 'admin') &&
            (p === 'mahesh99830' || p === 'admin123' || p === '27101993')) {
          verified = { success: true, user: { name: 'Mahesh Saini', role: 'Super Admin', email: 'maheshkumarsaini8769@gmail.com' } };
        } else {
          verified = { success: false };
        }
      }

      if (verified && verified.success) {
        sessionStorage.setItem('ttw_admin_session', 'active');
        if (verified.user) {
          sessionStorage.setItem('ttw_admin_user', JSON.stringify(verified.user));
          updateHeaderUserPill(verified.user);
        }
        if (authError) authError.classList.remove('visible');
        if (authOverlay) authOverlay.classList.remove('active');
        showAdminToast('Welcome to Admin Console, ' + ((verified.user && verified.user.name) ? verified.user.name : 'Administrator') + '!');
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
      sessionStorage.removeItem('ttw_admin_user');
      if (authError) authError.classList.remove('visible');
      if (authPassInput) authPassInput.value = '';
      if (authOverlay) authOverlay.classList.add('active');
      showAdminToast('You have securely logged out.');
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
