# 🌴 Travel The World - Bali & Global Luxury Tours

An advanced, responsive, and production-ready travel booking platform featuring an interactive customer frontend and a secured 11-tab administrative control console.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Key Highlights

- **8+ Traveler-Facing Pages:**
  - `index.html` - Cinematic Hero Video, Carousel, Featured Experiences, Interactive Route Explorer, 360° Virtual Tour, Live Budget Estimator.
  - `holidays.html` - Full tour catalog with dynamic filters (Category, Duration, Price in ₹ INR, Rating).
  - `offers.html` - Seasonal discount deals, countdown timer, coupon code vault (`BALI20`, `FIRSTTRIP`, `DIWALI500`).
  - `booking.html` - Multi-step booking engine, traveler details, real-time discount computation, instant print-ready booking confirmation voucher.
  - `about.html` - Brand heritage story, traveler metrics, certified leadership team.
  - `reviews.html` - Verified traveler testimonials with interactive rating submission form.
  - `blog.html` - Travel editorial, insider guides, dynamic tag filtering.
  - `contact.html` - Concierge inquiry desk with dynamic accordion FAQ.

- **🛡️ Secure Admin Console (`/admin`):**
  - **Isolated URL-Only Access:** Zero public links on traveler pages; accessible strictly via `/admin`.
  - **Authentication Gate:** Protected with admin credentials (`admin` / `admin123`) and session locking.
  - **11 Management Tabs:**
    1. 📊 **Dashboard:** Real-time revenue (₹), bookings, inquiries, and customer metrics.
    2. 🗺️ **Tours & Packages:** Full CRUD with image, duration, price, category, and highlight tags.
    3. 📋 **Bookings & Orders:** Status toggles (Confirmed, Pending, Cancelled), customer vouchers.
    4. 🎟️ **Coupons & Offers:** Create and expire percentage or flat rupee discounts.
    5. ✉️ **Inquiries:** Concierge message manager with direct WhatsApp/Email actions.
    6. ⭐ **Reviews Moderation:** Approve, edit, or remove customer reviews.
    7. 📖 **Blog & Editorial:** Publish, update, and categorize travel guides.
    8. 👥 **About Us & Team:** Modify company bio, traveler statistics, and team members.
    9. 📞 **Contact & FAQs:** Real-time accordion question/answer manager.
    10. 🎨 **Festival & Media Customizer:** 1-click switch between **Normal Mode**, Diwali, Holi, Bali Galungan, live Hero Video URL/upload, carousel slides, and scenery backdrops.
    11. ⚙️ **System Settings:** Currency symbol, tax rates, support hotline, and Ketut AI Concierge toggles.

- **🤖 Ketut 24/7 AI Concierge:**
  - Instant travel recommendations, pure vegetarian/Jain food guide in Bali, 4-day sample itinerary, currency exchange math, and honeymoon packages.

- **🇮🇳 100% Indian Rupee (₹ INR) Compliant:**
  - Strict Indian number formatting (`₹30,000`) and live INR-to-IDR foreign exchange calculator.

---

## 🚀 Quick Start (Local Run)

You can serve this project with any static HTTP server:

```bash
# Python 3
python3 -m http.server 8080

# Or with Node
npx serve .
```

- Open Website: `http://localhost:8080/`
- Open Admin Panel: `http://localhost:8080/admin/`

---

## 🔐 Admin Default Credentials

| Field | Value |
| :--- | :--- |
| **Email / Username** | `maheshkumarsaini8769@gmail.com` (or `admin` / `mahesh`) |
| **Password** | `mahesh99830` (or `admin123`) |
| **Credentials Manager** | Change email, password, and manage staff logins directly inside Admin Console -> System Settings |

---

## 🛠️ Tech Stack

- **Markup & Layout:** Semantic HTML5, CSS Grid, Flexbox, CSS Custom Properties (Variables)
- **State Management:** Reactive `TravelStore` with `localStorage` and `sessionStorage` synchronization
- **Design:** Modern glassmorphism, responsive mobile drawers, particle engines
