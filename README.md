<div align="center">

# Luxeluru

**Bengaluru's Premier Luxury Salon Platform**

*Discover · Book · Style — powered by AI and Smart Navigation*

[![Live](https://img.shields.io/badge/Live%20on-Render-46E3B7?style=flat-square&logo=render)](https://luxeluru.onrender.com)
[![Tech](https://img.shields.io/badge/Stack-React%20%2B%20Node.js-61DAFB?style=flat-square&logo=react)](https://vitejs.dev)
[![Language](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20KN-orange?style=flat-square)](#)
[![Private](https://img.shields.io/badge/Repo-Private-red?style=flat-square&logo=github)](#)

</div>

---

## Overview

Luxeluru is a full-stack luxury salon discovery and booking platform built for Bengaluru. It connects users with curated premium salons through an AI-powered styling experience, smart location-based navigation, seamless appointment booking, and a complete salon management ecosystem — all on a mobile-first web app.

---

## Platform Sections

### 👤 User Experience
- **Authentication** — Secure register & login with persistent JWT sessions; new users redirected to sign-in after registration
- **Dashboard** — Personalised home with upcoming appointments, nearest salons, quick actions, and the Style Emergency button
- **Salon Discovery** — Browse 15+ curated luxury salons across Bengaluru with filters by category, rating, and distance
- **Smart Navigation** — Location-based salon ranking using KNN (Haversine distance); OpenStreetMap integration with Google Maps deep-link navigation
- **Leaderboard** — Top-rated salons and stylists ranked by real customer reviews
- **Appointment History** — Full booking history with status, payment method, stylist, and refund tracking
- **Multi-language** — English (default), Hindi, and Kannada throughout the entire UI

### 🤖 AI Stylr
- Camera-based face analysis using **MediaPipe FaceMesh** (468 facial landmarks)
- **Monk Skin Tone Scale (MST-1 to MST-10)** — Google's open 10-point skin tone standard; classification via **CIE-LAB color distance** (perceptually accurate across all skin tones, especially South Asian complexions)
- Samples skin pixels from **4 cheek landmarks** for improved accuracy over single-point sampling
- Visual **MST scale bar** in results — 10 coloured dots, your level highlighted with a gold ring
- **Virtual Try-On** — live hair colour preview on the camera feed using a **Bézier-curve hair mask** drawn from FaceMesh temple + forehead + brow landmarks
  - Toggle between face mesh mode and full try-on mode
  - Adjustable intensity slider (15%–65%)
  - Any selected colour updates the live preview instantly
- **Gemini AI Style Advice** — after analysis, calls **Gemini 2.0 Flash** to generate a personalised natural-language consultation: headline, description, colour reason, style reason, and a care tip (requires `VITE_GEMINI_API_KEY`; gracefully hidden if not set)
- Hair colour recommendations keyed to all 10 MST levels separately (not just 6 generic tiers)
- Custom image upload (up to 20 MB) for tailored style advice
- Style recommendations carry forward directly into the booking flow
- Uploaded images visible to salon in appointment details on their dashboard

### 🚨 Style Emergency
- One-tap emergency salon finder accessible from the dashboard
- Ranks the 5 nearest salons by **soonest available time slot** (not just distance) across the next 7 days
- Skips past, booked, and walk-in-blocked slots automatically
- Full in-modal booking flow — service selection, date/time picker, stylist, payment method, bill summary
- Supports Card, UPI (with Stripe checkout), and Pay-at-Salon payment methods
- After booking, sends WhatsApp confirmation and redirects to dashboard

### 📅 Booking System
- Multi-service and package selection with live bill calculation
- Date picker with past-date prevention; time slot grid with past/booked/blocked slot indicators
- Stylist selection (optional)
- **Card / UPI** — Stripe checkout modal; appointment auto-confirmed on successful payment
- **Pay at Salon** — Instant booking confirmation with bill summary shown first
- WhatsApp confirmation sent after every booking
- Post-booking redirect to user dashboard showing upcoming appointments
- Cancellation policy with tiered refunds (20% → 50% → 70% → 100% based on notice period)

### 🏪 Salon Partner Dashboard
- Secure login with rate-limiting and account lockout (5 failed attempts = 10-minute lock)
- **Appointments tab** — View all bookings, verify attendance, mark payment status, add notes, reschedule
- **Services tab** — Manage services, packages, and pricing
- **Staff tab** — Add/edit staff profiles and specialties
- **Walk-ins tab** — Block specific time slots to prevent online bookings during walk-in hours
- **Notifications tab** — Platform alerts and booking updates
- **Messages tab** — End-to-end encrypted 1:1 direct messaging with admin; platform-wide announcement feed
- **Settings tab** — Update salon profile, location, and business details
- **Exit Platform** — Submit exit request; check approval status using registered business email; reply to admin rejections

### 🛠️ Admin Control Centre
- **Pending Approvals** — Review and approve/reject new salon registration applications
- **Salons tab** — Monitor all active salons, commission status, overdue payments; forceful removal and permanent deletion (test accounts protected)
- **Users tab** — View all registered users with search, registration date, and booking count; block/unblock accounts (test accounts protected)
- **Platform Analytics** — Revenue metrics, booking counts, blocked users, forcefully removed salons
- **Messages tab** — Encrypted 1:1 conversations with each salon; broadcast announcements to all active salons with read-receipt tracking
- **Exit Requests tab** — Approve or reject partner exit requests with mandatory rejection reason
- **Test Sign In tab** — Pre-configured test credentials for both user and salon perspectives

### 🔒 Messaging & Encryption
- AES-GCM 256-bit end-to-end encryption for all direct messages
- Per-salon encryption keys derived via PBKDF2 (10,000 iterations, SHA-256)
- Server stores only ciphertext — messages are never decrypted server-side
- Separate message context for exit disputes vs. general communication
- 15-second polling for new messages; 30-second polling for announcements

### 📤 Partner Exit System
- Salon submits exit request with reason from the dashboard
- Admin reviews in Control Centre; rejection requires a written reason
- Salon checks status in **PartnerWithUs → Check Status** using registered business email
- Rejected exit displays admin's reason; salon can reply directly in the status panel
- Exit dispute messages are encrypted and tracked separately from general chat

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS v4 |
| **UI / Styling** | Vanilla CSS custom design system, Cormorant Garamond + Outfit fonts |
| **Backend** | Node.js, Express |
| **Database** | SQLite (production via Render) / MongoDB (optional) |
| **Auth** | Supabase Auth (JWT), bcrypt password hashing |
| **Payments** | Stripe (Card & UPI checkout simulation) |
| **AI / ML** | MediaPipe FaceMesh (browser-side), Monk Skin Tone Scale (CIE-LAB), Gemini 2.0 Flash (style advice) |
| **Maps** | OpenStreetMap embed, Google Maps deep-link navigation |
| **Encryption** | Web Crypto API — AES-GCM + PBKDF2 |
| **Notifications** | WhatsApp (wa.me deep-link) |
| **Deployment** | Render (frontend + backend, monorepo) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run Locally

```bash
git clone <repo-url>
cd Luxeluru
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_MSG_KEY=your_messaging_encryption_secret
VITE_GEMINI_API_KEY=your_gemini_api_key   # Optional — enables AI Stylr natural-language advice
```

Create `server/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_db_url
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏆 For Hackathon Judges

> **Live Platform:** [https://luxeluru.onrender.com](https://luxeluru.onrender.com)

---

### 🛡️ Admin Portal Access

The Admin Control Centre is **not linked from any public page** (by design, for security). Use the direct URL below:

**Admin Portal URL:** [https://luxeluru.onrender.com/admin](https://luxeluru.onrender.com/admin)

| Field | Value |
|---|---|
| **Username** | `ADMINLLURU` |
| **Password** | `ADMIN@LUXE26` |

**Steps to access:**
1. Visit [https://luxeluru.onrender.com/admin](https://luxeluru.onrender.com/admin)
2. Complete the CAPTCHA challenge
3. Enter the credentials above and click **Authenticate**
4. You will be redirected to the **Admin Control Centre**

**What you can do in the Admin Dashboard:**
- View and approve/reject salon registrations (KYC, PAN, GST details)
- View all active salons, their payout details, and commission dues
- Verify commission payments submitted by salons
- Block/unblock users with duration control
- Send encrypted messages to salons
- Post platform-wide announcements
- View full booking activity across all salons
- Force-deactivate or approve salon exit requests

---

### 👤 Test User Account

> Pre-registered demo customer account — **cannot be deleted or blocked**.

| Field | Value |
|---|---|
| **Email** | `adminuser1@test.com` |
| **Password** | `user@admin-test789` |

**Steps to access:**
1. Visit [https://luxeluru.onrender.com/login](https://luxeluru.onrender.com/login)
2. Select **User Login** tab (default)
3. Enter credentials and click **Sign In**
4. You'll land on the **User Dashboard** with upcoming bookings, AI Stylist, Navigator, and Bookings

---

### 💇 Test Salon Partner Account

> Pre-registered demo salon — **cannot be deleted or blocked**.

| Field | Value |
|---|---|
| **Salon ID** | `LLLUX456` |
| **Email** | `luxurysalonadmin@test.com` |
| **Password** | `salon@admin-test789` |

**Steps to access:**
1. Visit [https://luxeluru.onrender.com/login](https://luxeluru.onrender.com/login)
2. Select **Salon Partner Login** tab
3. Enter Salon ID, Email, and Password
4. You'll land on the **Salon Dashboard** with tabs: Bookings, Staff, Services, Analytics, Messages, Commission Dues, and Settings

---

## Project Structure

```
Luxeluru/
├── src/
│   ├── components/       # Reusable UI components (Navbar, PanicModal, SalonCard, etc.)
│   ├── context/          # AppContext — global state, API calls, polling, auth
│   ├── data/             # Salon seed data
│   ├── hooks/            # Custom React hooks
│   ├── i18n/             # EN / HI / KN translations
│   ├── pages/            # All page components
│   ├── services/         # API client, Supabase client
│   ├── types/            # TypeScript interfaces
│   └── utils/            # KNN, face analysis, encryption, notifications, Gemini
├── server/
│   ├── index.js          # Express server, all API routes
│   └── db.js             # SQLite + MongoDB abstraction layer
└── public/
```

---

## Deployment

Luxeluru is deployed as a **monorepo on Render**:
- Frontend built with `npm run build` and served as static files
- Backend runs as a Node.js web service on the same dyno
- SQLite database persisted on Render's disk
- Auto-deploys on every push to the `main` branch on GitHub

---

## Notice

This is a **private repository**. The source code, design, and all associated assets are proprietary and confidential. Unauthorised copying, distribution, or use of any part of this codebase is strictly prohibited.

---

© 2026 Luxeluru · Built in Bengaluru 🇮🇳