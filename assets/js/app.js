/**
 * Travel The World - Bali Interactive Engine
 * Features:
 * 1. Hero 4-5s Video playback transitioning to silky-smooth photo slideshow
 * 2. Section 2: Seamless Background Scenery on Left (NO card border)
 * 3. REALISTIC CLOUD PARTING CANVAS:
 *    - Clouds cover the bottom & right-half of left scenery
 *    - Mouse cursor parts clouds ONLY within its radius with feather-soft smoothness
 *    - Living clouds gently regenerate when idle
 * 4. Hand-scrollable Cards Track: Clicking any card smoothly swaps the background image
 * 5. All currency in Indian Rupees (₹)
 * 6. Live Search dropdown & instant booking modal with auto ₹ total calculation
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     HERO SECTION: 4-5s VIDEO THEN SMOOTH PHOTO SLIDESHOW
     ========================================================================== */

  const heroVideoWrapper = document.getElementById('heroVideoWrapper');
  const heroVideo = document.getElementById('heroVideo');
  const heroSlidesWrapper = document.getElementById('heroSlidesWrapper');
  const heroSlides = Array.from(document.querySelectorAll('.hero-slide'));
  const heroTitle = document.getElementById('heroTitle');
  const heroDescription = document.getElementById('heroDescription');
  const mediaBadgeText = document.getElementById('mediaBadgeText');
  const heroMediaToggleBtn = document.getElementById('heroMediaToggleBtn');
  const playIcon = heroMediaToggleBtn ? heroMediaToggleBtn.querySelector('.play-icon') : null;
  const pauseIcon = heroMediaToggleBtn ? heroMediaToggleBtn.querySelector('.pause-icon') : null;

  const slideBtns = [
    document.getElementById('slideBtn0'),
    document.getElementById('slideBtn1'),
    document.getElementById('slideBtn2')
  ];
  const slideProgressFill = document.getElementById('slideProgressFill');
  const heroPrevBtn = document.getElementById('heroPrevBtn');
  const heroNextBtn = document.getElementById('heroNextBtn');

  let currentSlideIndex = 0;
  let slideInterval = null;
  const SLIDE_DURATION = 3800; // 3.8s per slide
  const VIDEO_PLAY_DURATION = 4500; // 4.5s for initial video
  let isVideoPlaying = true;
  let videoTimer = null;

  function goToSlide(index) {
    if (index === currentSlideIndex && !isVideoPlaying) return;

    heroSlides.forEach((slide, idx) => {
      if (idx === index) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    currentSlideIndex = index;

    slideBtns.forEach((btn, idx) => {
      if (btn) {
        if (idx === index) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (slideProgressFill) {
      const offset = (index / (heroSlides.length - 1)) * 66.6;
      slideProgressFill.style.left = `${offset}%`;
    }

    const targetSlide = heroSlides[index];
    if (targetSlide) {
      const newTitle = targetSlide.getAttribute('data-title') || 'BALI';
      const newDesc = targetSlide.getAttribute('data-desc') || '';

      if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(8px)';
        setTimeout(() => {
          heroTitle.textContent = newTitle;
          heroTitle.style.opacity = '1';
          heroTitle.style.transform = 'translateY(0)';
        }, 220);
      }

      if (heroDescription) {
        heroDescription.style.opacity = '0';
        heroDescription.style.transform = 'translateY(8px)';
        setTimeout(() => {
          heroDescription.textContent = newDesc;
          heroDescription.style.opacity = '1';
          heroDescription.style.transform = 'translateY(0)';
        }, 280);
      }
    }
  }

  function startSlideshow() {
    stopSlideshow();
    slideInterval = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % heroSlides.length;
      goToSlide(nextIndex);
    }, SLIDE_DURATION);
  }

  function stopSlideshow() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
  }

  function initHeroMedia() {
    if (heroVideo) {
      heroVideo.muted = true;
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          transitionToSlides();
        });
      }

      let timeLeft = 4;
      const countTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0 && isVideoPlaying) {
          if (mediaBadgeText) mediaBadgeText.textContent = `Cinematic Video (${timeLeft}s)`;
        } else {
          clearInterval(countTimer);
        }
      }, 1000);

      videoTimer = setTimeout(() => {
        transitionToSlides();
      }, VIDEO_PLAY_DURATION);
    } else {
      transitionToSlides();
    }
  }

  function transitionToSlides() {
    isVideoPlaying = false;
    if (heroVideoWrapper) {
      heroVideoWrapper.classList.add('hidden');
    }
    if (mediaBadgeText) {
      mediaBadgeText.textContent = 'Photo Gallery (Auto-Slide)';
    }
    if (playIcon && pauseIcon) {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }

    goToSlide(0);
    startSlideshow();
  }

  function replayVideo() {
    stopSlideshow();
    if (videoTimer) clearTimeout(videoTimer);
    isVideoPlaying = true;

    if (heroVideoWrapper) heroVideoWrapper.classList.remove('hidden');
    if (heroVideo) {
      heroVideo.currentTime = 0;
      heroVideo.play().catch(() => {});
    }
    if (mediaBadgeText) mediaBadgeText.textContent = 'Cinematic Video (4s)';

    videoTimer = setTimeout(() => {
      transitionToSlides();
    }, VIDEO_PLAY_DURATION);
  }

  if (heroMediaToggleBtn) {
    heroMediaToggleBtn.addEventListener('click', () => {
      if (isVideoPlaying) transitionToSlides();
      else replayVideo();
    });
  }

  slideBtns.forEach((btn, idx) => {
    if (btn) {
      btn.addEventListener('click', () => {
        if (isVideoPlaying) transitionToSlides();
        goToSlide(idx);
        startSlideshow();
      });
    }
  });

  if (heroPrevBtn) {
    heroPrevBtn.addEventListener('click', () => {
      if (isVideoPlaying) transitionToSlides();
      const prevIndex = (currentSlideIndex - 1 + heroSlides.length) % heroSlides.length;
      goToSlide(prevIndex);
      startSlideshow();
    });
  }

  if (heroNextBtn) {
    heroNextBtn.addEventListener('click', () => {
      if (isVideoPlaying) transitionToSlides();
      const nextIndex = (currentSlideIndex + 1) % heroSlides.length;
      goToSlide(nextIndex);
      startSlideshow();
    });
  }

  const heroContainer = document.querySelector('.hero-container');
  if (heroContainer) {
    heroContainer.addEventListener('mouseenter', () => {
      if (!isVideoPlaying) stopSlideshow();
    });
    heroContainer.addEventListener('mouseleave', () => {
      if (!isVideoPlaying) startSlideshow();
    });
  }

  initHeroMedia();


  /* ==========================================================================
     REALISTIC CLOUD DISSIPATION CANVAS ENGINE
     "cloude ko esa rakh half of left me rakho or jese me image me per arrow
      lekar jau to puri cloude ek sath gayab na ho jitna mouse radius ja reha h
      utna hi or itni smoothness ke sath ho like real clode ht rehe"
     ========================================================================== */

  const cloudCanvas = document.getElementById('cloudCanvas');
  const cloudControlBadge = document.getElementById('cloudControlBadge');
  const cloudStatusLabel = document.getElementById('cloudStatusLabel');
  const cloudInteractiveHint = document.getElementById('cloudInteractiveHint');

  let ctx = null;
  let offscreenCanvas = null;
  let offscreenCtx = null;
  let cachedBrushCanvas = null;
  let isPointerOverCanvas = false;
  let lastX = null;
  let lastY = null;
  let lastInteractionTime = Date.now();
  let regenAnimFrame = null;
  const ERASE_RADIUS = 180; // 150px to 200px area around cursor

  // Pre-render the feathered eraser brush ONCE for instant 0ms hardware blitting
  function initCachedBrush() {
    cachedBrushCanvas = document.createElement('canvas');
    const size = ERASE_RADIUS * 2;
    cachedBrushCanvas.width = size;
    cachedBrushCanvas.height = size;
    const bCtx = cachedBrushCanvas.getContext('2d');

    const grad = bCtx.createRadialGradient(
      ERASE_RADIUS, ERASE_RADIUS, 0,
      ERASE_RADIUS, ERASE_RADIUS, ERASE_RADIUS
    );
    // Instant 100% clear in center (65% radius), ultra-smooth feather to edges
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.96, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    bCtx.fillStyle = grad;
    bCtx.beginPath();
    bCtx.arc(ERASE_RADIUS, ERASE_RADIUS, ERASE_RADIUS, 0, Math.PI * 2);
    bCtx.fill();
  }

  if (cloudCanvas) {
    ctx = cloudCanvas.getContext('2d', { willReadFrequently: false });
    offscreenCanvas = document.createElement('canvas');
    offscreenCtx = offscreenCanvas.getContext('2d');
    initCachedBrush();

    function resizeCanvas() {
      const rect = cloudCanvas.getBoundingClientRect();
      const width = Math.round(rect.width || cloudCanvas.parentElement.clientWidth || 600);
      const height = Math.round(rect.height || cloudCanvas.parentElement.clientHeight || 580);

      if (cloudCanvas.width !== width || cloudCanvas.height !== height) {
        cloudCanvas.width = width;
        cloudCanvas.height = height;
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        paintOriginalClouds();
      }
    }

    // Paint realistic organic billowing clouds and fog mist across the ENTIRE image
    // Guarantees fog clearing works everywhere randomly (left, mid, top, bottom, right)
    function paintOriginalClouds() {
      const w = cloudCanvas.width;
      const h = cloudCanvas.height;
      if (!w || !h) return;

      offscreenCtx.clearRect(0, 0, w, h);

      // 1. Base Atmospheric Sea & Mountain Fog Blanket (Covers entire image with ethereal mist)
      const baseMistGrad = offscreenCtx.createLinearGradient(0, 0, w, 0);
      baseMistGrad.addColorStop(0, 'rgba(255, 255, 255, 0.50)');    // Tangible fog on left
      baseMistGrad.addColorStop(0.30, 'rgba(255, 255, 255, 0.65)'); // Billowing mist
      baseMistGrad.addColorStop(0.60, 'rgba(255, 255, 255, 0.85)'); // Thicker clouds
      baseMistGrad.addColorStop(0.85, 'rgba(255, 255, 255, 0.98)'); // Dense fog
      baseMistGrad.addColorStop(1.0, '#ffffff');                     // Pure seamless white blend

      offscreenCtx.fillStyle = baseMistGrad;
      offscreenCtx.fillRect(0, 0, w, h);

      // 2. Vertical mist gradient (Bottom sea fog dissolving towards floor)
      const verticalMistGrad = offscreenCtx.createLinearGradient(0, 0, 0, h);
      verticalMistGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      verticalMistGrad.addColorStop(0.40, 'rgba(255, 255, 255, 0.35)');
      verticalMistGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.75)');
      verticalMistGrad.addColorStop(1.0, '#ffffff');

      offscreenCtx.fillStyle = verticalMistGrad;
      offscreenCtx.fillRect(0, 0, w, h);

      // 3. Procedural Billowing Cloud Puffs (Clusters of soft organic cloud banks)
      function drawCloudPuff(targetCtx, cx, cy, rad, alpha = 0.85) {
        const puffGrad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        puffGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        puffGrad.addColorStop(0.45, `rgba(255, 255, 255, ${alpha * 0.8})`);
        puffGrad.addColorStop(0.75, `rgba(255, 255, 255, ${alpha * 0.35})`);
        puffGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        targetCtx.fillStyle = puffGrad;
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, rad, 0, Math.PI * 2);
        targetCtx.fill();
      }

      // Clouds distributed across ALL quadrants so anywhere user hovers randomly, fog parts!
      const puffCoordinates = [
        // Left & Upper scenery clouds
        { x: w * 0.12, y: h * 0.18, r: 160, a: 0.65 },
        { x: w * 0.28, y: h * 0.22, r: 190, a: 0.70 },
        { x: w * 0.15, y: h * 0.52, r: 180, a: 0.72 },
        { x: w * 0.32, y: h * 0.48, r: 210, a: 0.78 },
        { x: w * 0.16, y: h * 0.82, r: 210, a: 0.85 },
        { x: w * 0.35, y: h * 0.88, r: 230, a: 0.90 },

        // Center scenery clouds
        { x: w * 0.48, y: h * 0.28, r: 200, a: 0.75 },
        { x: w * 0.52, y: h * 0.58, r: 220, a: 0.85 },
        { x: w * 0.55, y: h * 0.86, r: 240, a: 0.94 },

        // Right & Bottom edge dense clouds (seamless blend into white explore background)
        { x: w * 0.72, y: h * 0.25, r: 180, a: 0.80 },
        { x: w * 0.78, y: h * 0.55, r: 220, a: 0.92 },
        { x: w * 0.74, y: h * 0.82, r: 250, a: 0.98 },
        { x: w * 0.90, y: h * 0.20, r: 180, a: 0.88 },
        { x: w * 0.92, y: h * 0.45, r: 220, a: 0.95 },
        { x: w * 0.88, y: h * 0.75, r: 260, a: 0.99 },
        { x: w * 0.92, y: h * 0.90, r: 250, a: 1.00 }
      ];

      puffCoordinates.forEach(p => {
        drawCloudPuff(offscreenCtx, p.x, p.y, p.r, p.a);
      });

      // Render onto visible canvas
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(offscreenCanvas, 0, 0);
    }

    // Ultra-fast zero-delay feathered eraser blit (takes < 0.02ms via cached canvas)
    function eraseCloudAt(x, y) {
      if (!ctx || !cachedBrushCanvas) return;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(cachedBrushCanvas, x - ERASE_RADIUS, y - ERASE_RADIUS);
    }

    // Interpolate points smoothly along movement path with zero lag
    function handleCursorMove(x, y) {
      lastInteractionTime = Date.now();

      if (lastX === null || lastY === null) {
        lastX = x;
        lastY = y;
        eraseCloudAt(x, y);
        return;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Blit points along the cursor trail so even rapid mouse flicks clear cleanly
      if (dist > 12) {
        const steps = Math.min(25, Math.ceil(dist / 14));
        for (let i = 1; i <= steps; i++) {
          const interpX = lastX + (dx * (i / steps));
          const interpY = lastY + (dy * (i / steps));
          eraseCloudAt(interpX, interpY);
        }
      } else {
        eraseCloudAt(x, y);
      }

      lastX = x;
      lastY = y;
    }

    // Pointer event handler mapping client coordinates to canvas space
    function onPointerMoveEvent(e) {
      const rect = cloudCanvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        isPointerOverCanvas = true;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        handleCursorMove(x, y);
        if (cloudInteractiveHint) cloudInteractiveHint.style.opacity = '0';
      } else {
        if (isPointerOverCanvas) {
          isPointerOverCanvas = false;
          lastInteractionTime = Date.now();
          lastX = null;
          lastY = null;
        }
      }
    }

    // Direct event listeners on canvas & backdrop
    const exploreBackdropWrapper = document.getElementById('exploreBackdropWrapper');
    const exploreSection = document.getElementById('explore');

    if (exploreBackdropWrapper) {
      exploreBackdropWrapper.addEventListener('mouseenter', (e) => {
        isPointerOverCanvas = true;
        lastInteractionTime = Date.now();
        const rect = cloudCanvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        eraseCloudAt(lastX, lastY);
        if (cloudInteractiveHint) cloudInteractiveHint.style.opacity = '0';
      });

      exploreBackdropWrapper.addEventListener('mouseleave', () => {
        isPointerOverCanvas = false;
        lastInteractionTime = Date.now();
        lastX = null;
        lastY = null;
      });
    }

    // High performance pointer tracking across the section & window
    window.addEventListener('pointermove', onPointerMoveEvent, { passive: true });

    // Touch support for mobile / tablets
    cloudCanvas.addEventListener('touchstart', (e) => {
      isPointerOverCanvas = true;
      lastInteractionTime = Date.now();
      const rect = cloudCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      lastX = touch.clientX - rect.left;
      lastY = touch.clientY - rect.top;
      eraseCloudAt(lastX, lastY);
      if (cloudInteractiveHint) cloudInteractiveHint.style.opacity = '0';
    }, { passive: true });

    cloudCanvas.addEventListener('touchmove', (e) => {
      const rect = cloudCanvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      handleCursorMove(x, y);
    }, { passive: true });

    cloudCanvas.addEventListener('touchend', () => {
      isPointerOverCanvas = false;
      lastInteractionTime = Date.now();
      lastX = null;
      lastY = null;
    });

    // SLOW, GENTLE & NATURAL RECOVERY (Zero interference while interacting)
    // Removal is instantaneous; recovery is slow, cinematic and majestic (~4-5 seconds)
    function animateCloudRegeneration() {
      const now = Date.now();
      const idleTime = now - lastInteractionTime;

      // Only begin gentle mist return after user has been idle for > 600ms
      if ((!isPointerOverCanvas && idleTime > 500) || idleTime > 800) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.006; // Ultra-slow, majestic mist drifting back
        ctx.drawImage(offscreenCanvas, 0, 0);
        ctx.restore();

        // If pointer is still resting inside canvas, keep the immediate cursor zone clear
        if (isPointerOverCanvas && lastX !== null && lastY !== null) {
          eraseCloudAt(lastX, lastY);
        }
      }

      regenAnimFrame = requestAnimationFrame(animateCloudRegeneration);
    }

    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);
    animateCloudRegeneration();

    // Toggle button on control bar
    let isClearedCompletely = false;
    if (cloudControlBadge) {
      cloudControlBadge.addEventListener('click', () => {
        isClearedCompletely = !isClearedCompletely;
        if (isClearedCompletely) {
          ctx.clearRect(0, 0, cloudCanvas.width, cloudCanvas.height);
          if (cloudStatusLabel) cloudStatusLabel.textContent = 'Cleared (Click to Restore)';
          showToast('Clouds parted: Full landscape revealed');
        } else {
          paintOriginalClouds();
          if (cloudStatusLabel) cloudStatusLabel.textContent = 'Radius Parting Active';
          showToast('Cloud mist restored over the coast');
        }
      });
    }
  }


  /* ==========================================================================
     EXPLORE SECTION: DRAGGABLE CARDS & DYNAMIC BACKGROUND SWAP
     - Clicking a card smoothly swaps the left background scenery
     ========================================================================== */

  const cardsTrackWrapper = document.getElementById('cardsTrackWrapper');
  const locationCards = Array.from(document.querySelectorAll('.location-card'));
  const featuredMainImg = document.getElementById('featuredMainImg');
  const cardsPrevBtn = document.getElementById('cardsPrevBtn');
  const cardsNextBtn = document.getElementById('cardsNextBtn');

  // Mouse Drag-to-Scroll ("Hath se scroll") with momentum
  let isDragging = false;
  let startX = 0;
  let scrollLeftPos = 0;
  let hasMoved = false;

  if (cardsTrackWrapper) {
    cardsTrackWrapper.addEventListener('mousedown', (e) => {
      isDragging = true;
      hasMoved = false;
      cardsTrackWrapper.classList.add('is-dragging');
      startX = e.pageX - cardsTrackWrapper.offsetLeft;
      scrollLeftPos = cardsTrackWrapper.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        cardsTrackWrapper.classList.remove('is-dragging');
      }
    });

    cardsTrackWrapper.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - cardsTrackWrapper.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) hasMoved = true;
      cardsTrackWrapper.scrollLeft = scrollLeftPos - walk;
    });

    // Touch support
    cardsTrackWrapper.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX - cardsTrackWrapper.offsetLeft;
      scrollLeftPos = cardsTrackWrapper.scrollLeft;
      hasMoved = false;
    }, { passive: true });

    cardsTrackWrapper.addEventListener('touchmove', (e) => {
      const x = e.touches[0].pageX - cardsTrackWrapper.offsetLeft;
      const walk = (x - startX);
      if (Math.abs(walk) > 5) hasMoved = true;
    }, { passive: true });
  }

  // Arrow buttons for cards
  if (cardsPrevBtn && cardsTrackWrapper) {
    cardsPrevBtn.addEventListener('click', () => {
      cardsTrackWrapper.scrollBy({ left: -240, behavior: 'smooth' });
    });
  }

  if (cardsNextBtn && cardsTrackWrapper) {
    cardsNextBtn.addEventListener('click', () => {
      cardsTrackWrapper.scrollBy({ left: 240, behavior: 'smooth' });
    });
  }

  // Card click -> Smoothly update Left Background Scenery
  function selectLocationCard(card) {
    if (!card) return;

    locationCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    const locId = card.getAttribute('data-id');
    const locName = card.getAttribute('data-name');
    const locPrice = card.getAttribute('data-price');
    const locImg = card.getAttribute('data-img');

    // Smooth crossfade swap for the background image
    if (featuredMainImg && locImg) {
      featuredMainImg.style.opacity = '0.3';
      featuredMainImg.style.transform = 'scale(0.98)';

      setTimeout(() => {
        featuredMainImg.src = locImg;
        featuredMainImg.alt = `${locName} in Bali`;
        featuredMainImg.style.opacity = '1';
        featuredMainImg.style.transform = 'scale(1)';
      }, 200);
    }

    // Highlight corresponding tour package in Section 3
    highlightPackageForLocation(locId);

    showToast(`Loaded ${locName} &bull; ${locPrice}`);
  }

  // Reactive Card Track Sync with TravelStore (Auto-updates when Admin edits/adds tours)
  function syncCardsTrackWithStore() {
    if (!window.TravelStore || !cardsTrackWrapper) return;
    const tours = window.TravelStore.getTours();
    if (!tours || !tours.length) return;

    const cardsTrack = document.getElementById('cardsTrack');
    if (!cardsTrack) return;

    const activeCard = cardsTrack.querySelector('.location-card.active');
    const activeId = activeCard ? activeCard.getAttribute('data-id') : tours[0].id;

    cardsTrack.innerHTML = tours.map(t => `
      <div class="location-card ${t.id === activeId ? 'active' : ''}" data-id="${t.id}" data-name="${t.title}" data-category="${t.category}" data-price="${window.TravelStore.formatRupees(t.price)}" data-num-price="${t.price}" data-rating="${t.rating}" data-img="${t.img || 'assets/images/featured-uluwatu.jpg'}">
        <div class="card-thumb-box">
          <img src="${t.thumb || t.img || 'assets/images/uluwatu.jpg'}" alt="${t.title}" class="card-thumb-img">
          <span class="card-active-indicator">Selected</span>
        </div>
        <div class="card-body">
          <h4 class="card-title">${t.title}</h4>
          <p class="card-meta">${t.category}</p>
          <div class="card-footer">
            <div class="card-rating">
              <span class="star-icon"><svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
              <span class="rating-val">${t.rating}</span>
            </div>
            <div class="card-price">${window.TravelStore.formatRupees(t.price)}</div>
          </div>
        </div>
      </div>
    `).join('');

    const freshCards = cardsTrack.querySelectorAll('.location-card');
    freshCards.forEach(card => {
      card.addEventListener('click', () => {
        if (hasMoved) return;
        selectLocationCard(card);
      });
    });
  }

  // Initial sync & event listener
  syncCardsTrackWithStore();
  window.addEventListener('ttw:store-updated', (e) => {
    if (e.detail?.type === 'tours' || e.detail?.type === 'reset') {
      syncCardsTrackWithStore();
    }
  });

  locationCards.forEach(card => {
    card.addEventListener('click', () => {
      if (hasMoved) return; // ignore if user was dragging
      selectLocationCard(card);
    });
  });

  function highlightPackageForLocation(locId) {
    const packages = document.querySelectorAll('.package-card');
    packages.forEach(pkg => {
      const pkgLoc = pkg.getAttribute('data-location');
      if (pkgLoc === locId) {
        pkg.style.borderColor = '#0f172a';
        pkg.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.18)';
      } else {
        pkg.style.borderColor = 'var(--color-border)';
        pkg.style.boxShadow = 'var(--shadow-sm)';
      }
    });
  }


  /* ==========================================================================
  /* ==========================================================================
     SECTION 3: TOUR PACKAGES & FILTER TABS (In ₹ Rupees)
     - Reactive dynamic sync with TravelStore.getTours()
     - Controlled 100% from Admin Panel
     ========================================================================== */

  const packagesGrid = document.getElementById('packagesGrid');
  let currentPackageFilter = 'all';

  function applyPackageFilter() {
    if (!packagesGrid) return;
    const cards = packagesGrid.querySelectorAll('.package-card');
    cards.forEach(card => {
      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      if (currentPackageFilter === 'all' || cat.includes(currentPackageFilter.toLowerCase())) {
        card.style.display = 'flex';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function syncPackagesGridWithStore() {
    if (!window.TravelStore || !packagesGrid) return;
    const tours = window.TravelStore.getTours();
    if (!tours || !tours.length) return;

    packagesGrid.innerHTML = tours.map(t => {
      let catSlug = 'temple';
      const c = (t.category || '').toLowerCase();
      if (c.includes('water') || c.includes('leisure') || c.includes('park') || c.includes('beach')) catSlug = 'water';
      else if (c.includes('volcano') || c.includes('trek') || c.includes('mountain') || c.includes('nature')) catSlug = 'volcano';
      else if (c.includes('island') || c.includes('boat')) catSlug = 'island';

      const highlightsList = (t.highlights || [
        'Private AC vehicle with chauffeur',
        'Priority entrance ticket included',
        'Authentic Indian vegetarian dining options',
        'Government-certified English guide'
      ]).slice(0, 4).map(h => `<li><svg class="ui-icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> ${h}</li>`).join('');

      return `
        <div class="package-card" data-category="${catSlug}" data-location="${t.id}">
          <div class="package-badge-top">${t.badge || 'Top Rated'}</div>
          <div class="package-img-wrap">
            <img src="${t.img || 'assets/images/uluwatu.jpg'}" alt="${t.title}" loading="lazy">
            <span class="package-duration"><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${t.duration || 'Full Day'}</span>
          </div>
          <div class="package-info">
            <div class="package-meta-row">
              <span class="package-category">${t.category}</span>
              <span class="package-rating"><svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${t.rating} (${t.reviewsCount || 428} reviews)</span>
            </div>
            <h3 class="package-title">${t.title}</h3>
            <p class="package-snippet">${t.description}</p>
            
            <ul class="package-highlights">
              ${highlightsList}
            </ul>

            <div class="package-card-footer">
              <div class="package-price-wrap">
                <span class="price-from">From</span>
                <span class="price-amount">${window.TravelStore.formatRupees(t.price)}</span>
                <span class="price-unit">/ person</span>
              </div>
              <button class="btn btn-dark-pill view-package-btn" data-id="${t.id}" data-rupees="${t.price}">
                <span>View Details & Reviews</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Reattach booking modal triggers
    packagesGrid.querySelectorAll('.view-package-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkgCard = btn.closest('.package-card');
        if (!pkgCard) return;

        const title = pkgCard.querySelector('.package-title')?.textContent || 'Bali Tour Package';
        const category = pkgCard.querySelector('.package-category')?.textContent || 'Tour';
        const desc = pkgCard.querySelector('.package-snippet')?.textContent || '';
        const imgSrc = pkgCard.querySelector('img')?.src || 'assets/images/uluwatu.jpg';
        const rupeeVal = parseInt(btn.getAttribute('data-rupees'), 10) || 3200;
        const reviews = pkgCard.querySelector('.package-rating')?.textContent || '';

        openBookingModal({
          title,
          category,
          desc,
          img: imgSrc,
          rupees: rupeeVal,
          reviews
        });
      });
    });

    applyPackageFilter();
  }

  // Filter Pills setup
  const filterPills = Array.from(document.querySelectorAll('.filter-pill'));
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentPackageFilter = pill.getAttribute('data-filter') || 'all';
      applyPackageFilter();
    });
  });

  // Dynamic reviews carousel sync
  function syncReviewsCarouselWithStore() {
    if (!window.TravelStore) return;
    const carousel = document.querySelector('.reviews-carousel');
    if (!carousel) return;
    const reviews = window.TravelStore.getReviews().filter(r => r.approved !== false);
    if (!reviews || !reviews.length) return;

    const starSvg = '<svg class="ui-icon ui-icon-fill" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

    carousel.innerHTML = reviews.slice(0, 8).map(r => `
      <div class="review-bubble">
        <div class="review-stars" style="color: #f59e0b;">${starSvg.repeat(r.rating || 5)}</div>
        <p class="review-quote">"${r.comment || r.text || ''}"</p>
        <div class="reviewer-meta">
          <div class="reviewer-avatar">${(r.author || r.name || 'Traveler').charAt(0)}</div>
          <div class="reviewer-info">
            <h5>${r.author || r.name || 'Traveler'}</h5>
            <span>${r.tour || 'Bali Experience'} &bull; ${r.date || 'Recent'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Initial sync & cross-tab / event listeners
  syncPackagesGridWithStore();
  syncReviewsCarouselWithStore();

  window.addEventListener('ttw:store-updated', (e) => {
    if (e.detail?.type === 'tours' || e.detail?.type === 'reset') {
      syncPackagesGridWithStore();
    }
    if (e.detail?.type === 'reviews' || e.detail?.type === 'reset') {
      syncReviewsCarouselWithStore();
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'ttw_tours' || e.key === 'ttw_settings') {
      syncPackagesGridWithStore();
      syncCardsTrackWithStore();
    }
    if (e.key === 'ttw_reviews') {
      syncReviewsCarouselWithStore();
    }
  });


  /* ==========================================================================
     BOOKING & DETAILS MODAL (All In Indian Rupees ₹)
     ========================================================================== */

  const bookingModalBackdrop = document.getElementById('bookingModalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalImg = document.getElementById('modalImg');
  const modalTag = document.getElementById('modalTag');
  const modalImgTitle = document.getElementById('modalImgTitle');
  const modalTitle = document.getElementById('modalTitle');
  const modalReviewsCount = document.getElementById('modalReviewsCount');
  const modalDesc = document.getElementById('modalDesc');

  const bookDate = document.getElementById('bookDate');
  const bookTravelers = document.getElementById('bookTravelers');
  const summaryBasePrice = document.getElementById('summaryBasePrice');
  const summaryGuests = document.getElementById('summaryGuests');
  const summaryTotal = document.getElementById('summaryTotal');
  const bookingForm = document.getElementById('bookingForm');

  let currentPackageRupees = 3200; // Base package price in ₹

  if (bookDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    bookDate.min = tomorrow.toISOString().split('T')[0];
    bookDate.value = tomorrow.toISOString().split('T')[0];
  }

  function openBookingModal(pkgData) {
    if (!bookingModalBackdrop) return;

    currentPackageRupees = pkgData.rupees || 3200;

    if (modalImg && pkgData.img) modalImg.src = pkgData.img;
    if (modalTag) modalTag.textContent = pkgData.category || 'Bali Experience';
    if (modalImgTitle) modalImgTitle.textContent = pkgData.title || 'Bali Tour';
    if (modalTitle) modalTitle.textContent = `Reserve: ${pkgData.title || 'Bali Tour'}`;
    if (modalReviewsCount) modalReviewsCount.textContent = pkgData.reviews || '(450+ verified reviews)';
    if (modalDesc && pkgData.desc) modalDesc.textContent = pkgData.desc;

    updateBookingSummary();

    bookingModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeBookingModal() {
    if (!bookingModalBackdrop) return;
    bookingModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateBookingSummary() {
    const travelersCount = bookTravelers ? parseInt(bookTravelers.value, 10) || 1 : 1;
    const total = currentPackageRupees * travelersCount;

    if (summaryBasePrice) summaryBasePrice.textContent = `₹${currentPackageRupees.toLocaleString('en-IN')}`;
    if (summaryGuests) summaryGuests.textContent = `${travelersCount} ${travelersCount > 1 ? 'Travelers' : 'Traveler'}`;
    if (summaryTotal) summaryTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  }

  if (bookTravelers) {
    bookTravelers.addEventListener('change', updateBookingSummary);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeBookingModal);
  }

  if (bookingModalBackdrop) {
    bookingModalBackdrop.addEventListener('click', (e) => {
      if (e.target === bookingModalBackdrop) closeBookingModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBookingModal();
  });

  // Package Card "View Details & Reviews" buttons
  const viewPackageBtns = document.querySelectorAll('.view-package-btn');
  viewPackageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pkgCard = btn.closest('.package-card');
      if (!pkgCard) return;

      const title = pkgCard.querySelector('.package-title')?.textContent || 'Bali Tour Package';
      const category = pkgCard.querySelector('.package-category')?.textContent || 'Tour';
      const desc = pkgCard.querySelector('.package-snippet')?.textContent || '';
      const imgSrc = pkgCard.querySelector('img')?.src || 'assets/images/uluwatu.jpg';
      const rupeeVal = parseInt(btn.getAttribute('data-rupees'), 10) || 3200;
      const reviews = pkgCard.querySelector('.package-rating')?.textContent || '';

      openBookingModal({
        title,
        category,
        desc,
        img: imgSrc,
        rupees: rupeeVal,
        reviews
      });
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const guestName = document.getElementById('bookName')?.value || 'Guest';
      const guestEmail = document.getElementById('bookEmail')?.value || '';
      const guestPhone = document.getElementById('bookPhone')?.value || '';
      const guestHotel = document.getElementById('bookHotel')?.value || '';
      const tourDate = document.getElementById('bookDate')?.value || 'Upcoming date';
      const travelersCount = bookTravelers ? parseInt(bookTravelers.value, 10) || 1 : 1;
      const totalCost = currentPackageRupees * travelersCount;

      if (window.TravelStore) {
        window.TravelStore.addBooking({
          tourTitle: modalImgTitle?.textContent || 'Bali Tour Experience',
          customerName: guestName,
          email: guestEmail,
          phone: guestPhone,
          hotel: guestHotel,
          date: tourDate,
          guests: travelersCount,
          basePrice: currentPackageRupees,
          totalAmount: totalCost,
          paymentMethod: 'UPI / Online'
        });
      }

      closeBookingModal();
      showToast(`Congratulations ${guestName}! Booking confirmed for ${tourDate}. Ticket reference saved to Admin.`);
      bookingForm.reset();
    });
  }


  /* ==========================================================================
     HEADER SEARCH & QUICK FILTER (In ₹ Rupees)
     ========================================================================== */

  const searchInput = document.getElementById('searchInput');
  const searchResultsDropdown = document.getElementById('searchResultsDropdown');
  const searchClearBtn = document.getElementById('searchClearBtn');

  const searchableDestinations = [
    { id: 'uluwatu', name: 'Uluwatu Temple', type: 'Hindu Temple & Ocean Cliff', price: '₹850', img: 'assets/images/uluwatu.jpg' },
    { id: 'tanah-lot', name: 'Tanah Lot', type: 'Offshore Sea Pagoda', price: '₹1,200', img: 'assets/images/tanah-lot.jpg' },
    { id: 'waterbom', name: 'Waterbom Bali', type: 'Tropical Water Park', price: '₹2,800', img: 'assets/images/waterbom.jpg' },
    { id: 'tegallalang', name: 'Tegallalang Terraces', type: 'Rice Terraces & Jungle Swing', price: '₹950', img: 'assets/images/tegallalang.jpg' },
    { id: 'mount-batur', name: 'Mount Batur', type: 'Sunrise Volcano Trekking', price: '₹2,400', img: 'assets/images/mount-batur.jpg' },
    { id: 'nusa-penida', name: 'Nusa Penida', type: 'Kelingking T-Rex Beach', price: '₹3,600', img: 'assets/images/nusa-penida.jpg' }
  ];

  const esc = (s) => (window.TravelStore && window.TravelStore.escapeHtml ? window.TravelStore.escapeHtml(s) : String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

  function getSearchableList() {
    if (window.TravelStore && typeof window.TravelStore.getTours === 'function') {
      const tours = window.TravelStore.getTours();
      if (tours && tours.length > 0) {
        return tours.map(t => ({
          id: t.id,
          name: t.title,
          type: t.category,
          price: `₹${Number(t.price || 0).toLocaleString('en-IN')}`,
          img: t.thumb || t.img || 'assets/images/uluwatu.jpg',
          isTour: true
        }));
      }
    }
    return searchableDestinations;
  }

  if (searchInput && searchResultsDropdown) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();

      if (searchClearBtn) {
        if (query.length > 0) searchClearBtn.classList.add('visible');
        else searchClearBtn.classList.remove('visible');
      }

      if (query.length < 2) {
        searchResultsDropdown.classList.remove('active');
        searchResultsDropdown.innerHTML = '';
        return;
      }

      const items = getSearchableList();
      const matches = items.filter(d => 
        (d.name && d.name.toLowerCase().includes(query)) ||
        (d.type && d.type.toLowerCase().includes(query))
      );

      if (matches.length > 0) {
        searchResultsDropdown.innerHTML = matches.map(m => `
          <div class="search-item" data-id="${esc(m.id)}" ${m.isTour ? `data-tour-id="${encodeURIComponent(m.id)}"` : ''}>
            <img src="${esc(m.img)}" alt="${esc(m.name)}" class="search-item-thumb">
            <div class="search-item-info">
              <h5>${esc(m.name)}</h5>
              <span>${esc(m.type)} &bull; ${esc(m.price)}</span>
            </div>
          </div>
        `).join('');
        searchResultsDropdown.classList.add('active');

        searchResultsDropdown.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('click', () => {
            const locId = item.getAttribute('data-id');
            const targetCard = document.querySelector(`.location-card[data-id="${locId}"]`);
            if (targetCard) {
              selectLocationCard(targetCard);
              targetCard.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            } else {
              window.location.href = `booking.html?tour=${encodeURIComponent(locId)}`;
            }
            searchResultsDropdown.classList.remove('active');
            searchInput.value = '';
            if (searchClearBtn) searchClearBtn.classList.remove('visible');
          });
        });
      } else {
        searchResultsDropdown.innerHTML = `<div style="padding: 0.8rem; font-size: 0.85rem; color: #94a3b8; text-align: center;">No destinations found matching "${esc(query)}"</div>`;
        searchResultsDropdown.classList.add('active');
      }
    });

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchClearBtn.classList.remove('visible');
        searchResultsDropdown.classList.remove('active');
      });
    }

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
        searchResultsDropdown.classList.remove('active');
      }
    });
  }


  /* ==========================================================================
     MOBILE NAVIGATION TOGGLE & HEADER SCROLL STATE
     ========================================================================== */

  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggleBtn && navMenu) {
    mobileToggleBtn.addEventListener('click', () => {
      mobileToggleBtn.classList.toggle('active');
      navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileToggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggleBtn.contains(e.target)) {
        mobileToggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      }
    });
  }

  const siteHeader = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) siteHeader?.classList.add('scrolled');
    else siteHeader?.classList.remove('scrolled');
  });


  /* ==========================================================================
     TOAST NOTIFICATION HELPER
     ========================================================================== */

  function showToast(message) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-leave');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3500);
  }

  /* ==========================================================================
     LIVE BALI TIME (WITA - UTC+8)
     ========================================================================== */
  const baliLiveClock = document.getElementById('baliLiveClock');
  if (baliLiveClock) {
    function updateBaliClock() {
      try {
        const now = new Date();
        const baliTime = now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Makassar',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        baliLiveClock.textContent = `${baliTime} WITA`;
      } catch (e) {
        baliLiveClock.textContent = '17:50 WITA';
      }
    }
    setInterval(updateBaliClock, 1000);
    updateBaliClock();
  }

  /* ==========================================================================
     HERO QUICK TRIP FINDER SUBMISSION
     ========================================================================== */
  const quickFinderSubmitBtn = document.getElementById('quickFinderSubmitBtn');
  const quickFinderDest = document.getElementById('quickFinderDest');
  const quickFinderDate = document.getElementById('quickFinderDate');

  if (quickFinderDate) {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    quickFinderDate.min = tmr.toISOString().split('T')[0];
    quickFinderDate.value = tmr.toISOString().split('T')[0];
  }

  if (quickFinderSubmitBtn) {
    quickFinderSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const dest = quickFinderDest ? quickFinderDest.value : 'all';
      if (dest !== 'all') {
        window.location.href = `booking.html?tour=${dest}`;
      } else {
        window.location.href = 'holidays.html';
      }
    });
  }

  /* ==========================================================================
     BALINESE AMBIENT SOUND GENERATOR (Web Audio API)
     Soothing coastal waves + meditative temple chimes with zero audio assets!
     ========================================================================== */
  const ambientBtn = document.getElementById('ambientSoundToggleBtn');
  const ambientLabel = document.getElementById('ambientSoundLabel');
  let audioCtx = null;
  let isAmbientPlaying = false;
  let waveGain = null;
  let chimeTimer = null;

  function initAmbientAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioCtx = new AudioCtx();

      // Synthesize deep pink-noise buffer for ocean surf
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter for soft ocean wash
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);

      // Low frequency oscillator for wave swell
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, audioCtx.currentTime); // ~8 sec wave period
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(140, audioCtx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      waveGain = audioCtx.createGain();
      waveGain.gain.setValueAtTime(0.15, audioCtx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(waveGain);
      waveGain.connect(audioCtx.destination);

      whiteNoise.start();
      lfo.start();

      // Pentatonic Balinese gamelan chime bells (Slendro frequencies: C5, D5, E5, G5, A5)
      const chimes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      function playChime() {
        if (!isAmbientPlaying || !audioCtx) return;
        const note = chimes[Math.floor(Math.random() * chimes.length)];
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, audioCtx.currentTime);

        g.gain.setValueAtTime(0.04, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.2);

        osc.connect(g);
        g.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 3.3);

        chimeTimer = setTimeout(playChime, 4000 + Math.random() * 5000);
      }
      playChime();
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  }

  if (ambientBtn) {
    ambientBtn.addEventListener('click', () => {
      if (!audioCtx) {
        initAmbientAudio();
        isAmbientPlaying = true;
      } else {
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
          isAmbientPlaying = true;
        } else if (isAmbientPlaying) {
          audioCtx.suspend();
          isAmbientPlaying = false;
          if (chimeTimer) clearTimeout(chimeTimer);
        } else {
          audioCtx.resume();
          isAmbientPlaying = true;
        }
      }

      if (isAmbientPlaying) {
        ambientBtn.classList.add('playing');
        if (ambientLabel) ambientLabel.innerHTML = 'Sound of Bali: <strong>Playing</strong>';
        showToast('Balinese ocean waves & soothing temple chimes active.');
      } else {
        ambientBtn.classList.remove('playing');
        if (ambientLabel) ambientLabel.innerHTML = 'Sound of Bali: <strong>Off</strong>';
        showToast('Ambient sound paused.');
      }
    });
  }

});
