<div align="center">

<br/>

# Luxeluru

**Bengaluru's Premier Luxury Salon Platform**

*Discover · Book · Style — powered by AI, smart navigation, and a complete salon management ecosystem*

<br/>

[![Live](https://img.shields.io/badge/Live%20Platform-luxeluru.onrender.com-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://luxeluru.onrender.com)
[![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20Express-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev)
[![AI](https://img.shields.io/badge/AI-MediaPipe%20%2B%20Gemini%202.0-orange?style=for-the-badge&logo=google)](https://ai.google.dev)
[![Languages](https://img.shields.io/badge/i18n-EN%20%7C%20HI%20%7C%20KN-blueviolet?style=for-the-badge)](#)
[![GitHub](https://img.shields.io/badge/GitHub-hariharln28%2FLuxeluru-181717?style=for-the-badge&logo=github)](https://github.com/hariharln28/Luxeluru)

<br/>

</div>

---

## Problem Statement

The luxury salon industry in Bengaluru is fragmented. Customers have no reliable, premium-grade digital platform to discover verified salons, get AI-personalised style advice, and book appointments seamlessly — all in one place. At the same time, salon owners lack the tools to manage bookings, staff, walk-ins, payments, and compliance with the platform from a single dashboard.

Existing general-purpose booking tools are not built for the luxury segment, offer no AI styling layer, and provide no intelligent navigation or localisation for Indian markets.

**Luxeluru solves this end-to-end** — for customers, salon partners, and platform administrators — in a single full-stack, mobile-first web application.

---

## What Makes Luxeluru Different

| Capability | Luxeluru |
|---|---|
| **AI Face Analysis** | MediaPipe FaceMesh (468 landmarks) + Monk Skin Tone Scale (CIE-LAB, 10 levels) |
| **Virtual Try-On** | Live Bézier-curve hair colour overlay on camera feed, real-time |
| **Smart Navigation** | KNN (Haversine distance) ranks nearest salons in real-time from user's GPS |
| **Style Emergency** | Finds the 5 nearest salons with the soonest available slot across the next 7 days |
| **End-to-End Encryption** | AES-GCM 256-bit messaging between admin and salon partners — server never sees plaintext |
| **Full Commission Engine** | Automatic 3% commission tracking, monthly billing cycle, 5-day grace, admin verification |
| **Multi-language** | English, Hindi, Kannada — switchable across the full platform UI |
| **Mobile-first** | Designed and tested for all screen sizes with PWA-ready meta tags |
| **Complete Ecosystem** | Three fully separate portals: User, Salon Partner, Admin — all interconnected |

---

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 18 + TypeScript + Vite                                    │
│  ┌──────────┐ ┌──────────────┐ ┌───────────────┐ ┌───────────┐ │
│  │  User    │ │ Salon Partner│ │     Admin      │ │ AI Stylr  │ │
│  │  Portal  │ │  Dashboard   │ │ Control Centre │ │ (MediaPipe│ │
│  │          │ │              │ │                │ │  + Gemini)│ │
│  └────┬─────┘ └──────┬───────┘ └───────┬────────┘ └─────┬─────┘ │
│       │              │                 │                 │        │
│  AppContext (global state, JWT, polling, Supabase auth)           │
└───────┼──────────────┼─────────────────┼─────────────────┼───────┘
        │   HTTPS/REST │                 │                 │
┌───────▼──────────────▼─────────────────▼─────────────────▼───────┐
│                    BACKEND (Node.js + Express)                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Auth · Bookings · Salons · Reviews · Messages · Commission  │ │
│  │  Notifications · Announcements · Admin · Platform Analytics  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│         │                              │                           │
│  ┌──────▼──────┐              ┌────────▼────────┐                 │
│  │   SQLite    │              │    MongoDB       │                 │
│  │  (primary)  │              │ (optional/cloud) │                 │
│  └─────────────┘              └─────────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
        │
┌───────▼───────────────────────────────┐
│          External Services            │
│  Supabase Auth · Gemini 2.0 Flash     │
│  Stripe (payments) · WhatsApp (wa.me) │
│  OpenStreetMap · Google Maps          │
└───────────────────────────────────────┘
```

---

## Platform Sections

### 👤 User Experience
- **Authentication** — Secure register & login via Supabase Auth with persistent JWT sessions
- **Dashboard** — Personalised home with upcoming appointments, nearest salons, quick actions, and Style Emergency button
- **Salon Discovery** — Browse 15+ curated luxury salons across Bengaluru; filter by category, rating, and distance
- **Smart Navigation** — KNN (Haversine) ranks salons by GPS proximity; OpenStreetMap embed + Google Maps deep-link turn-by-turn
- **Leaderboard** — Top 10 salons and top 10 stylists ranked by verified customer ratings
- **Booking History** — Full history with status, payment method, stylist, refund tracking, and re-booking
- **Multi-language** — Full UI available in English, Hindi, and Kannada — switchable at any time

### 🤖 AI Stylr
- **Face Shape Detection** — MediaPipe FaceMesh (468 landmarks) classifies face shape from live camera feed
- **Monk Skin Tone Scale** — Google's open 10-point MST standard; classified via **CIE-LAB colour distance** for perceptual accuracy across South Asian complexions; samples from 4 cheek landmarks
- **Virtual Try-On** — Live Bézier-curve hair colour mask drawn over camera feed using FaceMesh temple/forehead/brow landmarks; adjustable opacity slider (15–65%); updates in real-time with any selected colour
- **Gemini AI Consultation** — Calls **Gemini 2.0 Flash** to generate a personalised natural-language style report: headline, description, colour rationale, style rationale, and a care tip
- **Booking Integration** — Style recommendations carry forward directly into the booking flow; uploaded images visible to salon staff in the appointment dashboard

### 🚨 Style Emergency (Panic Button)
- One-tap emergency finder accessible from the user dashboard
- Ranks the 5 nearest salons by **soonest available slot** (not just proximity) across the next 7 days
- Auto-skips past slots, already-booked slots, and walk-in-blocked slots
- Full in-modal booking flow — services, date/time, stylist, payment, bill summary — without leaving the page

### 📅 Booking System
- Multi-service and package selection with live bill calculation
- Past-date prevention; time slot grid with past/booked/blocked indicators
- Stylist selection (optional)
- **Online (Card / UPI)** — Stripe checkout; appointment confirmed on payment success
- **Pay at Salon** — Instant confirmation with bill summary; commission tracked monthly
- After booking confirmation (all payment methods) — user is redirected directly to **Upcoming Appointments**
- Tiered cancellation refunds: 100% (3+ days) → 70% (2 days) → 50% (1 day) → 30% (same day)

### 🏪 Salon Partner Dashboard
- Rate-limited login with account lockout (5 failed attempts = 30-minute lock)
- **Appointments** — View, verify, complete, reschedule, and add notes to all bookings
- **Services** — Manage service catalogue and packages with pricing
- **Staff** — Add and edit staff profiles, specialties, and avatars
- **Walk-ins** — Block specific time slots to prevent online bookings during walk-in appointments
- **Closed Days** — Mark entire days as closed (public holidays, staff training, renovation, etc.); all slots become unavailable to customers and the reason is displayed to users and visible to admin
- **Notifications** — Real-time booking alerts and payment notifications
- **Messages** — End-to-end encrypted 1:1 messaging with admin + announcement feed
- **Commission Dues** — View full pay-at-salon billing breakdown, submit UTR payment references
- **Settings** — Update profile, location, payout bank/UPI details, and business information
- **Location Picker** — Interactive map (OpenStreetMap + Leaflet) in the Location tab; search by address or tap/drag a pin to set the exact salon location — no API key required
- **Exit Platform** — Submit, track, and dispute exit requests

### 🤝 Partner With Us (Salon Registration Flow)
- **Apply for Partnership** — Submit business name, owner details, address, PAN card, and Trade License document
- **Check Onboarding Status** — Salons enter their registered email to check application status at any time (live DB lookup — works for all salons, not just demo data)
- **Approved flow** — On approval, the salon receives their unique Salon ID (format: `LL` + letters + digits). They sign in using **Salon ID + registered email + password** (set during registration — no separate step required).
- **Rejected flow** — Rejected salons see an encrypted **Appeal / Message Admin** panel directly on the status page. They can send messages, and admin replies are visible on the next status check.
- **Cancellation & Refund Policy (Clause 5)** — Luxeluru enforces a tiered refund policy for online payments. Salons must honour customer cancellations per the following schedule — 100% refund (3+ days before appointment) · 70% refund (2 days before) · 50% refund (1 day before) · 30% refund (same day). No refunds are issued for Pay-at-Salon bookings. Refunds are processed by the platform and the balance amount after refund goes to the platform.

### 🛠️ Admin Control Centre
- **Pending Approvals** — Review full KYC, PAN card, and Trade License; approve or reject new salon applications
- **Trade License Viewer** — Opens uploaded license documents in a full-screen in-page modal (works on mobile — avoids browser popup blocking)
- **Rejection Appeals** — Rejected salons can message the admin directly from the Check Status page; admin receives appeal messages in a dedicated section of the Messages tab with unread badge counts
- **Salons** — Monitor all active salons, commission dues, payment status, payout details; force-deactivate or permanently delete
- **Users** — Search users, view booking activity, block with configurable duration
- **Platform Analytics** — Revenue, bookings, overdue commissions, blocked users, removed salons
- **Messages** — Encrypted 1:1 conversations per salon; broadcast announcements with read-receipt tracking
- **Exit Requests** — Approve or reject with mandatory rejection reason
- **Commission Verification** — Review UTR references submitted by salons; one-click verify and clear dues
- **Closed Days Visibility** — See each salon's upcoming closed days (date, reason, count) in the salon detail panel

### 🔒 Security & Encryption
- **AES-GCM 256-bit** end-to-end encryption for all admin ↔ salon messages
- Per-salon encryption keys derived via **PBKDF2** (10,000 iterations, SHA-256)
- Server stores only ciphertext — messages are never decrypted server-side
- JWT authentication on all protected API routes
- Bcrypt password hashing for all user and salon credentials
- IP-based rate limiting + account lockout on salon login

---

## Commission & Payment Flow

```
ONLINE PAYMENT (Card / UPI)
──────────────────────────────────────────────────────────────────
User books → Stripe checkout → Payment confirmed
  → Commission (3%) tracked in platform → Salon receives net amount automatically
  → On appointment completion → Commission removed from salon's due balance

PAY AT SALON (Cash)
──────────────────────────────────────────────────────────────────
User books → Booking confirmed → Customer pays cash at salon
  → Commission (3%) added to salon's monthly due ledger
  → At month-end → Salon views full breakdown in "Commission Dues" tab
  → Salon transfers commission via UPI or NEFT to platform
  → Salon submits UTR reference number in dashboard
  → Admin verifies reference → Dues cleared → Salon notified

BILLING CYCLE
──────────────────────────────────────────────────────────────────
Commission accumulates throughout the month
  → Due by last day of month
  → 5-day grace period (1st–5th of next month)
  → Overdue → Admin can force-deactivate salon
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS v4 |
| **UI / Design** | Custom design system — Cormorant Garamond + Outfit fonts, dark luxury theme |
| **Backend** | Node.js 18, Express 4 |
| **Database** | SQLite (production, Render disk) / MongoDB (optional) |
| **Auth** | Supabase Auth (JWT), bcrypt password hashing |
| **Payments** | Stripe (Card & UPI checkout) |
| **AI / ML** | MediaPipe FaceMesh (browser-side), Monk Skin Tone Scale (CIE-LAB), Gemini 2.0 Flash |
| **Maps** | OpenStreetMap embed, Google Maps deep-link navigation |
| **Encryption** | Web Crypto API — AES-GCM + PBKDF2 |
| **Notifications** | WhatsApp (wa.me deep-link) |
| **Deployment** | Render (monorepo — frontend + backend on same service) |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/users/register` | Register a new user |
| `POST` | `/api/users/login` | Backend user login — fallback for users without Supabase accounts (e.g. test user); checks SHA-256 hashed password against DB |
| `POST` | `/api/salons/login` | Salon partner login (rate-limited, blocks if no password set) |
| `POST` | `/api/salons/register` | New salon registration with KYC (no default password — salon must set one after approval) |
| `GET` | `/api/salons` | List all salons (strips tradeLicenseUrl to prevent mobile storage overflow) |
| `GET` | `/api/salons/:id` | Fetch a single salon |
| `GET` | `/api/salons/status?email=` | Public: check onboarding status by business email (live DB lookup) |
| `GET` | `/api/salons/:id/status-messages` | Public: fetch rejection-appeal messages for a salon |
| `POST` | `/api/salons/:id/rejection-appeal` | Public: rejected salon sends encrypted appeal message to admin |
| `GET` | `/api/admin/salons` | Admin: list all salons including tradeLicenseUrl |
| `GET` | `/api/admin/salons/:id/trade-license` | Admin: fetch a salon's trade license document on demand |
| `POST` | `/api/salons/:id/set-password` | Approved salon sets their own password (required before first login) |
| `POST` | `/api/bookings` | Create a booking |
| `POST` | `/api/bookings/:id/cancel` | Cancel with refund calculation |
| `POST` | `/api/bookings/:id/reschedule` | Reschedule with conflict check |
| `POST` | `/api/bookings/:id/update` | Mark appointment complete + trigger payout |
| `POST` | `/api/reviews` | Submit a verified review |
| `GET` | `/api/salons/:id/commission-summary` | Full commission breakdown for a salon |
| `POST` | `/api/salons/:id/submit-commission-payment` | Salon submits UTR reference |
| `POST` | `/api/salons/:id/verify-commission-payment` | Admin clears commission dues |
| `GET` | `/api/platform/payment-details` | Platform UPI/bank details for commission transfer |
| `GET` | `/api/notifications` | Fetch notifications for a target |
| `GET` | `/api/messages/:salonId` | Fetch encrypted messages |
| `POST` | `/api/messages/:salonId` | Send encrypted message |
| `GET` | `/api/salons/:id/blocked-slots` | Fetch walk-in blocked slots for a salon |
| `POST` | `/api/salons/:id/block-slot` | Block a specific time slot for a walk-in |
| `DELETE` | `/api/salons/:id/blocked-slots/:slotId` | Unblock a time slot |
| `GET` | `/api/salons/:id/closed-days` | Fetch all closed days for a salon |
| `POST` | `/api/salons/:id/closed-days` | Mark an entire day as closed |
| `DELETE` | `/api/salons/:id/closed-days/:date` | Reopen a closed day |
| `GET` | `/api/admin/closed-days` | Admin: view closed days across all salons |
| `GET` | `/api/announcements` | Fetch platform announcements |
| `GET` | `/api/health` | Server health check |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run Locally

```bash
git clone https://github.com/hariharln28/Luxeluru.git
cd Luxeluru
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Environment Variables

Create `.env` in the root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_MSG_KEY=your_messaging_encryption_secret
VITE_GEMINI_API_KEY=your_gemini_api_key   # Optional — enables AI natural-language style advice
```

Create `server/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONGODB_URI=your_mongodb_uri               # Optional
PORT=5001
NODE_ENV=production
FRONTEND_URL=https://luxeluru.onrender.com
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📋 Demo Credentials & Navigation

> **Live Platform:** [https://luxeluru.onrender.com](https://luxeluru.onrender.com)
>
> ⚠️ Render free tier may take 30–60 seconds to wake up on first visit. Please wait for the page to fully load before interacting.

---

### 🛡️ Admin Portal Access

The Admin Control Centre is **not linked from any public page** (by design). Use the direct URL:

**→ [https://luxeluru.onrender.com/admin](https://luxeluru.onrender.com/admin)**

| Field | Value |
|---|---|
| **Username** | `ADMINLLURU` |
| **Password** | `ADMIN@LUXE26` |

**Steps:**
1. Go to [https://luxeluru.onrender.com/admin](https://luxeluru.onrender.com/admin)
2. Complete the CAPTCHA challenge
3. Enter the credentials above → click **Authenticate**
4. You will land on the **Admin Control Centre**

**What to explore:**
- Pending salon approvals with full KYC / PAN / GST documents
- Active salons with commission status, payout details, and **upcoming closed days per salon**
- User management with block/unblock controls
- Encrypted messaging and platform announcements
- Commission verification panel

---

### 👤 Test User Account

> Protected — cannot be deleted or blocked.

| Field | Value |
|---|---|
| **Login URL** | [/login](https://luxeluru.onrender.com/login) → **User Login** tab |
| **Email** | `adminuser1@test.com` |
| **Password** | `user@admin-test789` |

**What to explore:** Dashboard · AI Stylr · Smart Navigator · Style Emergency · Salon booking flow · Booking history · Profile settings

---

### 💇 Test Salon Partner Account

> Protected — cannot be deleted or blocked.

| Field | Value |
|---|---|
| **Login URL** | [/login](https://luxeluru.onrender.com/login) → **Salon Partner Login** tab |
| **Salon ID** | `LLLUX456` |
| **Email** | `luxurysalonadmin@test.com` |
| **Password** | `salon@admin-test789` |

> **Salon login requires only: Salon ID + Email + Password** (Salon Name field has been removed from the login form).

**What to explore:** Appointments · Staff management · Services & pricing · Walk-in slot blocking · **Closed Days** (Manage Slots tab → Close Entire Day) · Commission Dues tab · Encrypted messages · Payout settings

---

## Project Structure

```
Luxeluru/
├── src/
│   ├── components/       # Reusable UI (Navbar, CheckoutModal, SalonCard, PanicModal, etc.)
│   ├── context/          # AppContext — global state, API, polling, auth
│   ├── data/             # Salon seed data
│   ├── hooks/            # Custom React hooks (useT for i18n, etc.)
│   ├── i18n/             # EN / HI / KN translation maps
│   ├── pages/            # All 17 page components
│   ├── services/         # API client (fetch + retry), Supabase client
│   ├── types/            # TypeScript interfaces
│   └── utils/            # KNN algo, face analysis, AES encryption, WhatsApp, Gemini
├── server/
│   ├── index.js          # Express server — all 30+ API routes
│   └── db.js             # SQLite + MongoDB dual-DB abstraction layer
├── render.yaml           # Render deployment configuration
└── public/
```

---

## Deployment

Luxeluru is deployed as a **monorepo on Render**:
- Frontend built with `npm run build` and served as static files by the Express server
- Backend runs as a Node.js web service on the same dyno
- SQLite database persisted on Render's attached disk
- Auto-deploys on every push to the `main` branch via GitHub integration

---

## Known Limitations

- **Payments are simulated** — Stripe integration is UI-complete but does not process real transactions (demo/hackathon scope)
- **Render free tier cold start** — first request after inactivity may take 30–60 seconds
- **In-memory rate limiting** — resets on server restart; production would use Redis-backed rate limiting
- **Trade license storage** — Uploaded as base64 `data:` URLs in SQLite; production would use cloud object storage (S3/GCS) for large files
- **SQLite on Render** — Test salon (`LLLUX456`) and test user (`adminuser1@test.com`) are auto-created on every server startup, so credentials always work even after a fresh deploy with an empty database
- **Approved partner salon persistence** — Add approved salons to the `SEED_SALONS` environment variable in the Render dashboard to make them survive redeploys. Format: `[{"id":"LLXXX123","name":"Salon","email":"e@mail.com","password":"pass","ownerName":"Owner"}]`

---

## Open Source

This repository is publicly available on [GitHub](https://github.com/hariharln28/Luxeluru). The source code is the intellectual property of the Luxeluru team. You are welcome to explore, fork, and learn from this codebase. Commercial use or redistribution without explicit permission from the team is not permitted.

---

<div align="center">

© 2026 Luxeluru · Built in Bengaluru 🇮🇳

*Made with precision for the Indian luxury market*

</div>