/**
 * Travel The World - Advanced Next-Gen Experience Suite
 * Features:
 * 1. Ketut AI Concierge - Balinese Smart Travel Assistant with domain knowledge in ₹ INR
 * 2. Theme-Adaptive Festive Particle Engine (Diwali embers, Holi gulal, Xmas snow, Monsoon mist)
 * 3. 3D Card Perspective Tilt & Dynamic Specular Light Glare
 * 4. Interactive 360° Landmark Panoramic Tour Experience
 * 5. Interactive Bali Island Region Route & Travel Time Explorer
 * 6. Live Currency & Trip Budget Calculator (₹ INR <-> IDR)
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. KETUT AI CONCIERGE - BALINESE SMART TRAVEL ASSISTANT
     ========================================================================== */

  const KETUT_KNOWLEDGE_BASE = {
    greetings: [
      "Om Swastiastu!  I am Ketut, your Balinese local concierge. How can I craft your dream holiday in Indian Rupees today?",
      "Welcome to Travel The World! Ketut here, ready to share secret Balinese waterfalls, cliff temples, and pure vegetarian dining spots."
    ],
    faqs: [
      {
        triggers: ['veg', 'vegetarian', 'jain', 'food', 'khana', 'indian restaurant'],
        answer: `<strong> Pure Vegetarian & Jain Dining in Bali:</strong><br>
        Bali is very hospitable for Indian travelers! You will find excellent vegetarian and Jain food across the island:<br>
        • <strong>Seminyak / Kuta:</strong> <em>Queen's Tandoor</em> and <em>Spice Mantraa</em> (Full North/South Indian menu with pure Jain options, ~₹650–₹900/meal).<br>
        • <strong>Ubud:</strong> <em>Ganesha Ek Sanskriti</em> & <em>Sitara Indian</em> (Authentic dal makhani, paneer, and Jain thali options with rice field views).<br>
        • <strong>Nusa Dua:</strong> <em>Bumbu Delhi</em> at Grand Mirage Resort.<br>
        • <strong>Local Balinese Veg:</strong> Try <em>Gado-Gado</em> (steamed organic greens with peanut sauce) and <em>Tempeh Goreng</em>!`
      },
      {
        triggers: ['budget', 'cost', 'how much', 'rupees', 'price', 'kharcha', '25000', '30000', '50000'],
        answer: `<strong> Bali Trip Budget Guide (in Indian Rupees ₹):</strong><br>
        For a comfortable couple or family holiday:<br>
        • <strong>Tours & Sightseeing:</strong> ₹850 – ₹3,400 per person per day (Uluwatu, Tanah Lot, Mount Batur).<br>
        • <strong>Private AC Chauffeur:</strong> Approx ₹1,800 – ₹2,200 per day for a private 7-seater MPV.<br>
        • <strong>Indian Meals:</strong> Approx ₹1,200 – ₹1,800/day for two people.<br>
        • <strong>Luxury 4-Star Resort / Villa:</strong> ₹3,500 – ₹7,000 per night with private plunge pool.<br>
         <em>Total estimated budget for a 5-Day memorable trip: ₹25,000 – ₹38,000 per person (excluding flights).</em>`
      },
      {
        triggers: ['family', '4 day', 'itinerary', 'plan', 'days', 'schedule'],
        answer: `<strong> Recommended 4-Day Curated Bali Itinerary:</strong><br>
        • <strong>Day 1: South Bali Sunset</strong> – Land at DPS Airport, check in to Nusa Dua/Seminyak resort, visit Uluwatu Cliff Temple & witness the sunset Kecak Fire Dance (₹850).<br>
        • <strong>Day 2: Emerald Cultural Heart</strong> – Head to Ubud, walk Tegallalang Rice Terraces, ride the giant Jungle Swing, visit Sacred Monkey Forest (₹950).<br>
        • <strong>Day 3: Sacred Sea Shrine & Waterpark</strong> – Morning at Waterbom Tropical Park (₹2,800), evening sunset at Tanah Lot offshore shrine (₹1,200).<br>
        • <strong>Day 4: Island Ocean Cruise</strong> – Speedboat to Nusa Penida, see Kelingking T-Rex cliff and snorkel with Manta Rays (₹3,600).`
      },
      {
        triggers: ['sunset', 'photo', 'instagram', 'photography', 'pictures', 'spots'],
        answer: `<strong> Top Sunset & Photography Spots in Bali:</strong><br>
        1. <strong>Uluwatu Temple Cliff:</strong> 70-meter vertical cliff into crashing Indian Ocean waves (Sunset ~18:14 WITA).<br>
        2. <strong>Tanah Lot:</strong> Offshore rock temple with tide reflections.<br>
        3. <strong>Lempuyang Gates of Heaven:</strong> Mount Agung framed through sacred dragon gates with mirror reflection.<br>
        4. <strong>Campuhan Ridge Walk:</strong> Lush green rolling valley path in Ubud in golden morning light.`
      },
      {
        triggers: ['honeymoon', 'couple', 'romantic'],
        answer: `<strong> Bali Honeymoon & Romance Special:</strong><br>
        • Stay in a private rainforest pool villa in Ubud or ocean-view cliff villa in Uluwatu.<br>
        • Candlelight seafood or paneer tikka dinner right on the sands of Jimbaran Bay with ocean waves at your feet.<br>
        • Traditional 2-hour Balinese herbal flower bath & couple massage.<br>
        • Private speedboat charter to Nusa Penida’s secluded Crystal Bay.<br>
        Use promo code <strong>BALI20</strong> for a flat 20% discount on all our couple packages!`
      },
      {
        triggers: ['visa', 'currency', 'money', 'forex', 'sim', 'flight', 'airport'],
        answer: `<strong><svg class="ui-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Essential Bali Travel Practicalities:</strong><br>
        • <strong>Visa on Arrival (VoA):</strong> 30 days VoA available on arrival at DPS airport for 500,000 IDR (~₹2,650), payable via UPI card or cash.<br>
        • <strong>Forex Rate:</strong> ₹1 INR ≈ 190.5 IDR. All our tour prices are strictly in Indian Rupees with zero conversion fee!<br>
        • <strong>SIM Card:</strong> Tourist eSIM or physical Telkomsel 25GB data SIM available at airport (~₹450).<br>
        • <strong>Language & Chauffeur:</strong> All our private tour chauffeurs speak fluent English and understand Indian dietary needs.`
      }
    ]
  };

  function initKetutAi() {
    const settings = window.TravelStore ? window.TravelStore.getSettings() : {};
    if (settings.aiConciergeEnabled === false) return;

    if (document.getElementById('ketutAiWidget')) return;

    // 1. Floating Toggle Button
    const widget = document.createElement('div');
    widget.id = 'ketutAiWidget';
    widget.className = 'ketut-ai-widget';
    widget.innerHTML = `
      <button class="ketut-trigger-btn" id="ketutTriggerBtn" aria-label="Open Ketut AI Travel Concierge" title="Ask Ketut - Your Balinese AI Trip Planner">
        <span class="ketut-avatar-wrap">
          <span class="ketut-emoji"></span>
          <span class="ketut-pulse-dot"></span>
        </span>
        <span class="ketut-btn-text">Ask Ketut AI</span>
        <span class="ketut-badge-ping">1</span>
      </button>
    `;
    document.body.appendChild(widget);

    // 2. Chat Drawer / Modal
    const drawer = document.createElement('div');
    drawer.id = 'ketutAiDrawer';
    drawer.className = 'ketut-ai-drawer';
    drawer.innerHTML = `
      <div class="ketut-drawer-header">
        <div class="ketut-header-profile">
          <div class="ketut-header-avatar"></div>
          <div>
            <div class="ketut-header-name">Ketut • AI Travel Concierge</div>
            <div class="ketut-header-status">
              <span class="status-dot"></span> Online • Local Balinese Guide
            </div>
          </div>
        </div>
        <div class="ketut-header-actions">
          <button class="ketut-btn-clear" id="ketutClearChatBtn" title="Clear conversation"></button>
          <button class="ketut-btn-close" id="ketutCloseBtn" aria-label="Close chat">&times;</button>
        </div>
      </div>

      <div class="ketut-drawer-body" id="ketutMessagesContainer">
        <div class="ketut-message bot">
          <div class="ketut-msg-bubble">
            Om Swastiastu!  I am <strong>Ketut</strong>, your Balinese local concierge. How can I help plan your Bali holiday in Indian Rupees (₹)?
          </div>
          <span class="ketut-msg-time">Just now</span>
        </div>
      </div>

      <div class="ketut-quick-prompts" id="ketutQuickPrompts">
        <button class="quick-prompt-chip" data-query="4 day family itinerary"> 4-Day Plan</button>
        <button class="quick-prompt-chip" data-query="pure veg and jain food"> Veg & Jain Food</button>
        <button class="quick-prompt-chip" data-query="best sunset spots"> Sunset Spots</button>
        <button class="quick-prompt-chip" data-query="budget trip cost in rupees"> Trip Budget in ₹</button>
        <button class="quick-prompt-chip" data-query="honeymoon special villa"> Honeymoon</button>
      </div>

      <form class="ketut-drawer-footer" id="ketutChatForm">
        <input 
          type="text" 
          id="ketutChatInput" 
          placeholder="Ask Ketut about packages, veg food, budget..." 
          autocomplete="off">
        <button type="submit" class="ketut-send-btn" id="ketutSendBtn" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;
    document.body.appendChild(drawer);

    // Event Handlers
    const triggerBtn = document.getElementById('ketutTriggerBtn');
    const closeBtn = document.getElementById('ketutCloseBtn');
    const clearBtn = document.getElementById('ketutClearChatBtn');
    const chatForm = document.getElementById('ketutChatForm');
    const chatInput = document.getElementById('ketutChatInput');
    const messagesContainer = document.getElementById('ketutMessagesContainer');
    const quickPrompts = document.getElementById('ketutQuickPrompts');

    function toggleDrawer(open) {
      if (open === undefined) {
        drawer.classList.toggle('open');
      } else if (open) {
        drawer.classList.add('open');
      } else {
        drawer.classList.remove('open');
      }
      if (drawer.classList.contains('open')) {
        const ping = widget.querySelector('.ketut-badge-ping');
        if (ping) ping.style.display = 'none';
        chatInput.focus();
      }
    }

    triggerBtn.addEventListener('click', () => toggleDrawer());
    closeBtn.addEventListener('click', () => toggleDrawer(false));

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        messagesContainer.innerHTML = `
          <div class="ketut-message bot">
            <div class="ketut-msg-bubble">
              Chat reset. Ask me anything about Bali sightseeing, hotels, or Indian Rupees costs!
            </div>
            <span class="ketut-msg-time">Just now</span>
          </div>
        `;
      });
    }

    function appendUserMessage(text) {
      const msg = document.createElement('div');
      msg.className = 'ketut-message user';
      msg.innerHTML = `
        <div class="ketut-msg-bubble">${escapeHtml(text)}</div>
        <span class="ketut-msg-time">${getCurrentTimeStr()}</span>
      `;
      messagesContainer.appendChild(msg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function appendBotTypingIndicator() {
      const typing = document.createElement('div');
      typing.className = 'ketut-message bot typing';
      typing.id = 'ketutTypingIndicator';
      typing.innerHTML = `
        <div class="ketut-msg-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      `;
      messagesContainer.appendChild(typing);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return typing;
    }

    function appendBotResponse(htmlContent, withAction = true) {
      const typing = document.getElementById('ketutTypingIndicator');
      if (typing) typing.remove();

      const msg = document.createElement('div');
      msg.className = 'ketut-message bot';
      
      let actionButtonsHtml = '';
      if (withAction) {
        actionButtonsHtml = `
          <div class="ketut-actions-row">
            <a href="holidays.html" class="ketut-action-btn"> Browse Packages in ₹</a>
            <a href="https://wa.me/919820012345?text=Hello%20Travel%20The%20World%2C%20I%20am%20interested%20in%20a%20Bali%20tour" target="_blank" class="ketut-action-btn whatsapp"> WhatsApp Concierge</a>
          </div>
        `;
      }

      msg.innerHTML = `
        <div class="ketut-msg-bubble">${htmlContent}</div>
        ${actionButtonsHtml}
        <span class="ketut-msg-time">${getCurrentTimeStr()}</span>
      `;
      messagesContainer.appendChild(msg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function findBestAnswer(query) {
      const clean = query.toLowerCase();
      for (const faq of KETUT_KNOWLEDGE_BASE.faqs) {
        if (faq.triggers.some(t => clean.includes(t))) {
          return faq.answer;
        }
      }

      // Check for specific destinations
      if (clean.includes('uluwatu')) {
        return `<strong>Uluwatu Temple & Sunset Coast (₹850):</strong><br>
        Perched atop a dramatic 70-meter sea cliff overlooking the roaring Indian Ocean. Witness sacred macaques and the world-renowned sunset Kecak Fire Dance! Includes private AC transfer and guide.`;
      }
      if (clean.includes('tanah lot')) {
        return `<strong>Tanah Lot Ocean Shrine (₹1,200):</strong><br>
        An ancient 16th-century offshore sanctuary resting on black volcanic coral. At low tide you can walk right up to the sacred holy water cave blessing! Best photographed at 17:30 WITA sunset.`;
      }
      if (clean.includes('waterbom')) {
        return `<strong>Waterbom Bali Tropical Waterpark (₹2,800):</strong><br>
        Voted Asia's #1 Waterpark! 22 world-class thrilling slides, lazy rivers, and shady family cabanas set within 3.8 hectares of lush tropical botanical gardens in Kuta.`;
      }
      if (clean.includes('batur') || clean.includes('volcano') || clean.includes('trek')) {
        return `<strong>Mount Batur Sunrise Trek & Natural Hot Springs (₹3,400):</strong><br>
        A bucket-list experience! Hike 1,717 meters above the clouds in the cool predawn, witness an ethereal golden sunrise with hot volcanic steam breakfast, then soak in lakeside mineral hot spring pools.`;
      }

      // Default smart fallback
      return `That is a wonderful question about Bali! Our local tour concierge team can tailor this specifically to your travel dates and traveler count.<br><br>
      • All tour packages are priced transparently in <strong>Indian Rupees (₹)</strong>.<br>
      • Includes private AC transport, English-speaking driver, entrance tickets & taxes.<br>
      • Use coupon code <strong>BALI20</strong> to get 20% flat discount today!`;
    }

    function handleSendQuery(text) {
      if (!text.trim()) return;
      appendUserMessage(text);
      chatInput.value = '';

      appendBotTypingIndicator();
      setTimeout(() => {
        const answer = findBestAnswer(text);
        appendBotResponse(answer);
      }, 650);
    }

    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSendQuery(chatInput.value);
    });

    quickPrompts.querySelectorAll('.quick-prompt-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-query');
        handleSendQuery(query);
      });
    });
  }

  /* ==========================================================================
     2. THEME-ADAPTIVE FESTIVE PARTICLE CANVAS ENGINE
     ========================================================================== */

  function initFestiveParticles() {
    const settings = window.TravelStore ? window.TravelStore.getSettings() : {};
    if (settings.festiveParticlesEnabled === false) return;

    let canvas = document.getElementById('festiveParticleCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'festiveParticleCanvas';
      canvas.className = 'festive-particle-canvas';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles = [];
    const MAX_PARTICLES = window.innerWidth < 768 ? 28 : 55;

    function getParticleThemeConfig() {
      const activeTheme = document.body.getAttribute('data-active-theme') || (settings.activeTheme || 'diwali');

      if (activeTheme === 'diwali') {
        return {
          type: 'ember',
          colors: ['rgba(251, 191, 36, ', 'rgba(245, 158, 11, ', 'rgba(254, 240, 138, '],
          speedY: -0.6,
          sway: 0.5,
          glow: true,
          radiusMin: 1.5,
          radiusMax: 3.5
        };
      } else if (activeTheme === 'holi') {
        return {
          type: 'powder',
          colors: ['rgba(236, 72, 153, ', 'rgba(6, 182, 212, ', 'rgba(251, 191, 36, ', 'rgba(168, 85, 247, '],
          speedY: 0.4,
          sway: 0.8,
          glow: false,
          radiusMin: 2,
          radiusMax: 4.5
        };
      } else if (activeTheme === 'newyear') {
        return {
          type: 'snow',
          colors: ['rgba(255, 255, 255, ', 'rgba(224, 242, 254, ', 'rgba(254, 240, 138, '],
          speedY: 0.8,
          sway: 0.4,
          glow: true,
          radiusMin: 1.5,
          radiusMax: 3.2
        };
      } else if (activeTheme === 'monsoon') {
        return {
          type: 'rain',
          colors: ['rgba(56, 189, 248, ', 'rgba(45, 212, 191, '],
          speedY: 2.2,
          sway: 0.2,
          glow: false,
          radiusMin: 1,
          radiusMax: 2.2
        };
      } else {
        // Classic Bali
        return {
          type: 'ocean',
          colors: ['rgba(56, 189, 248, ', 'rgba(255, 255, 255, '],
          speedY: -0.3,
          sway: 0.3,
          glow: false,
          radiusMin: 1,
          radiusMax: 2.5
        };
      }
    }

    let config = getParticleThemeConfig();

    function createParticle() {
      const colorBase = config.colors[Math.floor(Math.random() * config.colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: config.radiusMin + Math.random() * (config.radiusMax - config.radiusMin),
        color: colorBase,
        alpha: 0.2 + Math.random() * 0.6,
        alphaSpeed: (Math.random() - 0.5) * 0.015,
        vx: (Math.random() - 0.5) * config.sway,
        vy: config.speedY * (0.6 + Math.random() * 0.8),
        angle: Math.random() * Math.PI * 2
      };
    }

    function initParticles() {
      particles = [];
      config = getParticleThemeConfig();
      for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push(createParticle());
      }
    }

    initParticles();

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    });

    window.addEventListener('ttw:store-updated', () => {
      config = getParticleThemeConfig();
    });

    let animFrame = null;
    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx + Math.sin(p.angle) * 0.3;
        p.y += p.vy;
        p.angle += 0.02;
        p.alpha += p.alphaSpeed;

        if (p.alpha <= 0.1 || p.alpha >= 0.85) {
          p.alphaSpeed = -p.alphaSpeed;
        }

        // Screen boundary wraparound
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        if (config.type === 'rain') {
          ctx.strokeStyle = p.color + p.alpha + ')';
          ctx.lineWidth = p.r * 0.8;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + 10);
          ctx.stroke();
        } else {
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.alpha + ')';
          if (config.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color + '0.6)';
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  /* ==========================================================================
     3. 3D CARD PERSPECTIVE TILT & DYNAMIC SPECULAR LIGHT SHEEN
     ========================================================================== */

  function init3DCardTilt() {
    const settings = window.TravelStore ? window.TravelStore.getSettings() : {};
    if (settings.cardTiltPhysicsEnabled === false) return;

    // Apply to location cards and package cards
    const cards = document.querySelectorAll('.location-card, .package-card, .hero-quick-finder-card');

    cards.forEach(card => {
      if (card.getAttribute('data-tilt-ready')) return;
      card.setAttribute('data-tilt-ready', 'true');

      let bounds = null;

      card.addEventListener('mouseenter', () => {
        bounds = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = card.getBoundingClientRect();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;

        const rotateX = ((mouseY - centerY) / centerY) * -7;
        const rotateY = ((mouseX - centerX) / centerX) * 7;

        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.015, 1.015, 1.015)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        bounds = null;
      });
    });
  }

  /* ==========================================================================
     4. INTERACTIVE 360° LANDMARK PANORAMIC PREVIEWER MODAL
     ========================================================================== */

  const PANORAMA_DATA = {
    uluwatu: {
      title: 'Uluwatu Cliff & Temple Ocean Panorama',
      img: 'assets/images/featured-uluwatu.jpg',
      tag: 'Cliff Sanctuary • 70m Altitude',
      price: '₹850',
      desc: 'Pan 360° across the dramatic cliff edge where the Indian Ocean crashes on ancient limestone sanctuaries.'
    },
    tanahLot: {
      title: 'Tanah Lot Offshore Sacred Sea Shrine',
      img: 'assets/images/featured-tanah-lot.jpg',
      tag: 'Offshore Coral Islet • Sunset Vista',
      price: '₹1,200',
      desc: 'Witness the iconic sea temple surrounded by crashing ocean tide and sacred snake blessings.'
    },
    mountBatur: {
      title: 'Mount Batur Sunrise Caldera Panorama',
      img: 'assets/images/mount-batur.jpg',
      tag: 'Volcanic Peak • 1,717m Altitude',
      price: '₹3,400',
      desc: 'Stand above sea-of-clouds as dawn breaks over Mount Agung and Lake Batur.'
    },
    tegallalang: {
      title: 'Tegallalang Terraces & Jungle Canopy',
      img: 'assets/images/tegallalang.jpg',
      tag: 'UNESCO Subak • Emerald Ridges',
      price: '₹950',
      desc: 'Step into ancient stepped emerald paddies and giant jungle swing panorama.'
    }
  };

  function initVirtual360Modal() {
    if (document.getElementById('virtual360Modal')) return;

    const modal = document.createElement('div');
    modal.id = 'virtual360Modal';
    modal.className = 'virtual-360-modal-backdrop';
    modal.innerHTML = `
      <div class="virtual-360-box">
        <div class="virtual-360-header">
          <div>
            <span class="v360-badge"> 360° VIRTUAL PANORAMA</span>
            <h3 id="v360Title" style="color: #ffffff; font-size: 1.35rem; margin-top: 0.2rem;">Uluwatu Cliff & Ocean Panorama</h3>
          </div>
          <button class="v360-close-btn" id="v360CloseBtn" aria-label="Close virtual tour">&times;</button>
        </div>

        <!-- Panorama Stage (Drag to Pan 360) -->
        <div class="virtual-360-viewport" id="v360Viewport">
          <img id="v360Image" src="assets/images/featured-uluwatu.jpg" alt="360 Landmark Panorama" class="v360-img">
          
          <div class="v360-hud-overlay">
            <div class="v360-compass">
              <span class="compass-pointer"></span>
              <span id="v360CompassHeading">240° SW</span>
            </div>
            <div class="v360-drag-hint">
              <span><svg class="ui-icon" viewBox="0 0 24 24"><path d="m18 8 4 4-4 4M6 8l-4 4 4 4M2 12h20"/></svg> Drag mouse or swipe to pan 360° panorama</span>
            </div>
          </div>
        </div>

        <!-- Tabs & Controls Bar -->
        <div class="virtual-360-footer">
          <div class="v360-tabs">
            <button class="v360-tab-btn active" data-landmark="uluwatu"> Uluwatu Cliff</button>
            <button class="v360-tab-btn" data-landmark="tanahLot"> Tanah Lot</button>
            <button class="v360-tab-btn" data-landmark="mountBatur"> Mount Batur</button>
            <button class="v360-tab-btn" data-landmark="tegallalang"> Tegallalang</button>
          </div>

          <div class="v360-footer-cta">
            <span id="v360PriceTag" class="v360-price">₹850 / person</span>
            <button class="btn btn-dark-pill" id="v360BookBtn" style="background: #ffffff; color: #0f172a; padding: 0.6rem 1.4rem;">
              <span>Book This Tour in ₹ &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Panorama Dragging Physics
    const viewport = document.getElementById('v360Viewport');
    const img = document.getElementById('v360Image');
    const compassHeading = document.getElementById('v360CompassHeading');
    const closeBtn = document.getElementById('v360CloseBtn');
    const titleEl = document.getElementById('v360Title');
    const priceEl = document.getElementById('v360PriceTag');
    const bookBtn = document.getElementById('v360BookBtn');
    const tabBtns = modal.querySelectorAll('.v360-tab-btn');

    let isPanning = false;
    let startX = 0;
    let currentOffset = -15; // percentage pan

    viewport.addEventListener('mousedown', (e) => {
      isPanning = true;
      startX = e.clientX;
      viewport.classList.add('grabbing');
    });

    window.addEventListener('mouseup', () => {
      if (isPanning) {
        isPanning = false;
        viewport.classList.remove('grabbing');
      }
    });

    viewport.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      const deltaX = (e.clientX - startX) * 0.08;
      startX = e.clientX;
      currentOffset = Math.max(-50, Math.min(20, currentOffset + deltaX));
      img.style.transform = `scale(1.25) translateX(${currentOffset}%)`;

      const degrees = Math.round(180 + (currentOffset * 3));
      if (compassHeading) compassHeading.textContent = `${degrees}° Bearing`;
    });

    // Touch support
    viewport.addEventListener('touchstart', (e) => {
      isPanning = true;
      startX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (!isPanning) return;
      const deltaX = (e.touches[0].clientX - startX) * 0.12;
      startX = e.touches[0].clientX;
      currentOffset = Math.max(-50, Math.min(20, currentOffset + deltaX));
      img.style.transform = `scale(1.25) translateX(${currentOffset}%)`;
    }, { passive: true });

    viewport.addEventListener('touchend', () => {
      isPanning = false;
    });

    // Switch Landmark
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const key = btn.getAttribute('data-landmark');
        const data = PANORAMA_DATA[key];
        if (data) {
          img.style.opacity = '0.3';
          setTimeout(() => {
            img.src = data.img;
            titleEl.textContent = data.title;
            priceEl.textContent = `${data.price} / person`;
            img.style.opacity = '1';
          }, 180);
        }
      });
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });

    if (bookBtn) {
      bookBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        const activeTab = modal.querySelector('.v360-tab-btn.active');
        const key = activeTab ? activeTab.getAttribute('data-landmark') : 'uluwatu';
        const tourIdMap = {
          uluwatu: 'uluwatu',
          tanahLot: 'tanah-lot',
          mountBatur: 'mount-batur',
          tegallalang: 'tegallalang'
        };
        const targetId = tourIdMap[key] || 'uluwatu';

        // Trigger existing booking modal
        const bookingModal = document.getElementById('bookingModalBackdrop');
        if (bookingModal) {
          bookingModal.classList.add('active');
          const title = document.getElementById('modalTitle');
          if (title) title.textContent = `Reserve ${PANORAMA_DATA[key].title}`;
        }
      });
    }

    // Expose open helper
    window.openVirtual360Modal = function (landmarkKey = 'uluwatu') {
      modal.classList.add('active');
      const targetBtn = modal.querySelector(`.v360-tab-btn[data-landmark="${landmarkKey}"]`);
      if (targetBtn) targetBtn.click();
    };

    // Attach to Explore Section trigger button if present
    const exploreBtn = document.getElementById('btnOpenVirtualTour');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => window.openVirtual360Modal('uluwatu'));
    }
  }

  /* ==========================================================================
     5. INTERACTIVE LIVE CURRENCY & BUDGET ESTIMATOR
     ========================================================================== */

  function initLiveBudgetEstimator() {
    const calcWrapper = document.getElementById('liveTripBudgetEstimator');
    if (!calcWrapper) return;

    const inrInput = document.getElementById('calcBudgetInr');
    const idrOutput = document.getElementById('calcBudgetIdr');
    const daysSlider = document.getElementById('calcTripDays');
    const daysLabel = document.getElementById('calcDaysLabel');
    const planBreakdown = document.getElementById('calcPlanBreakdown');

    function updateCalculations() {
      if (!inrInput) return;
      const budgetInr = Number(inrInput.value) || 25000;
      const days = daysSlider ? Number(daysSlider.value) : 4;

      if (daysLabel) daysLabel.textContent = `${days} Days`;

      // Forex Benchmark: 1 INR ≈ 190.5 IDR
      const idrTotal = Math.round(budgetInr * 190.5);
      if (idrOutput) {
        idrOutput.textContent = `≈ Rp ${idrTotal.toLocaleString('id-ID')} IDR`;
      }

      if (planBreakdown) {
        let tier = 'Comfort Backpacker & Boutique Villas';
        let packageRec = 'Uluwatu Temple (₹850) + Tanah Lot (₹1,200)';
        if (budgetInr >= 50000) {
          tier = 'Royal VIP & 5-Star Oceanfront Private Villa';
          packageRec = 'Mount Batur Sunrise VIP + Nusa Penida Yacht + Waterbom VIP';
        } else if (budgetInr >= 30000) {
          tier = 'Luxury Honeymoon & Deluxe Plunge Pool Resort';
          packageRec = 'Uluwatu Kecak + Mount Batur Sunrise + Tegallalang Swings';
        }

        planBreakdown.innerHTML = `
          <div style="font-size: 0.82rem; color: #0284c7; font-weight: 800; text-transform: uppercase;">● ${tier}</div>
          <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-top: 0.2rem;">Recommended Tour Combo: ${packageRec}</div>
          <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem;">Includes private AC transport, English-speaking driver, and all entry passes.</div>
        `;
      }
    }

    if (inrInput) inrInput.addEventListener('input', updateCalculations);
    if (daysSlider) daysSlider.addEventListener('input', updateCalculations);
    updateCalculations();
  }

  // Helpers
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getCurrentTimeStr() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Initialize all features once DOM is ready
  function bootAdvancedFeatures() {
    initKetutAi();
    initFestiveParticles();
    init3DCardTilt();
    initVirtual360Modal();
    initLiveBudgetEstimator();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdvancedFeatures);
  } else {
    bootAdvancedFeatures();
  }

  // Re-check card tilt on dynamic updates
  window.addEventListener('ttw:store-updated', () => {
    setTimeout(init3DCardTilt, 200);
  });

})();
