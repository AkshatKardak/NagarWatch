# 🏙️ NagarWatch — Real-Time Civic Issue Reporting & Governance Platform

> NagarWatch is a full-stack civic governance platform bridging the gap between citizens and local authorities. Citizens report issues, track progress, and experience transparent public service management through real-time updates, interactive maps, proof-based resolution, SLA enforcement, and AI-powered assistance.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-orange?logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

---

## Problem Statement

Urban cities frequently face unresolved civic issues — potholes, garbage accumulation, water leakages, broken streetlights. Current complaint systems suffer from:

- Complaints scattered across helplines, WhatsApp groups, and broken portals
- Zero visibility for citizens after submission
- Frequent duplicate complaints for the same issue
- No efficient prioritization for authorities
- No accountability, transparency, or SLA enforcement

## Proposed Solution

NagarWatch provides a centralized platform where:

- Citizens report, upvote, and track issues in real time
- Authorities manage, resolve, and upload proof of resolution
- Administrators monitor city-wide performance and configure the system
- **Gemini AI** auto-categorizes complaints, generates RTI letters, and emails weekly civic digests
- Socket.io keeps every stakeholder updated instantly

---

## User Roles

Role is stored in **Clerk `publicMetadata.role`** and gates all routes and UI.

### Citizen
- Report civic issues with image, GPS, and description
- View nearby complaints before submitting (duplicate prevention)
- Upvote existing complaints to boost their priority
- Track complaint status in real time
- Generate RTI Act 2005 letters for complaints unresolved 30+ days
- View full notification history at `/notifications`
- **Dashboard:** `/dashboard` • **Submit:** `/submit` • **RTI:** `/rti`

### Authority
- Manage complaints assigned to their ward
- Update status: Pending → In Progress → Resolved
- Upload mandatory Before/After resolution proof photos
- Monitor SLA timers before escalation triggers
- **Dashboard:** `/authority-dashboard` • **Analytics:** `/analytics`

### Administrator
- Manage authority accounts and user roles at `/users`
- Configure wards at `/wards`
- View city-wide analytics and department performance
- Receive AI-powered weekly civic summary email every Monday
- **Dashboard:** `/admin-dashboard` • **Weekly Summary:** `/admin/weekly-summary`

---

## Key Features

### Interactive Civic Map
City-wide public map displaying all reported issues. No login required.
- Real-time complaint markers via Socket.io
- Status color coding: 🔴 Pending → 🟠 In Progress → 🟢 Resolved
- Area and category filters

### Complaint Submission
Citizens submit with title, description, category, image, and GPS location. **Gemini AI auto-categorize** button suggests category, priority, keywords, and estimated SLA instantly.

### Geospatial Duplicate Prevention
Checks for existing complaints within a **50-metre radius** using MongoDB `$geoNear` before creating a new one. Citizen can join/upvote the existing complaint or create a new one.

### Community Upvoting
Each upvote increases the complaint's priority score. High-upvote complaints surface to the top of the authority queue.

### Real-Time Updates (Socket.io)

| Event | Trigger | Recipient |
|---|---|---|
| `new_complaint` | Citizen submits | All map viewers |
| `status_updated` | Authority acts | Complaint owner |
| `complaint_escalated` | SLA breached | Citizen + senior authority |
| `upvote_received` | Citizen upvotes | Authority dashboard |

### SLA Enforcement & Auto-Escalation
BullMQ background jobs enforce deadlines per category:

| Category | SLA |
|---|---|
| Water Leak | 24 hours |
| Pothole | 72 hours |
| Garbage | 48 hours |
| Streetlight | 48 hours |

Escalation chain: Ward Officer → Zonal Head → Commissioner. Warning at 80%, auto-escalation at deadline breach.

### Proof-Based Resolution
Authorities must upload an **After photo** before marking resolved. Before/after images displayed side-by-side to the public.

### Notifications Page (`/notifications`)
Full-page notification history for citizens with:
- Type-coloured badges: Status Update, Resolved, Escalated, Upvote Milestone, SLA Warning
- Filter tabs: All / Unread
- **Mark as read** per item or **Mark all read** in one click
- Linked from navbar bell dropdown — "View all notifications →"

---

## AI Features (Gemini 1.5 Flash)

All AI features powered by Gemini via `POST /api/v1/ai/*`. Requires `GEMINI_API_KEY` in `server/.env`.

### AI Auto-Categorization
`POST /api/v1/ai/categorize` — Drop-in `<AICategorizeBadge />` component on the submit form.

```tsx
<AICategorizeBadge
  title={formTitle}
  description={formDescription}
  onApply={(result) => {
    setCategory(result.category)
    setPriority(result.priority)
  }}
/>
```

Returns: `{ category, priority, keywords[], suggestedAction, estimatedSLAHours, confidence }`

### RTI Letter Generator
`POST /api/v1/ai/rti` — Page: `/rti` (citizen, auth required)

- Loads only eligible complaints (unresolved + 30+ days old)
- Generates a full formal RTI Act 2005 letter citing Section 7 and Section 19
- Output: Copy button + Download .txt

### Weekly Civic Summary
`POST /api/v1/ai/weekly-summary` — Page: `/admin/weekly-summary` (admin only)

- Manual trigger on-page + **automatic email every Monday 08:00 AM**
- Aggregates 7-day MongoDB stats and sends to Gemini for narrative digest
- Emailed to `COMMISSIONER_EMAIL` via Nodemailer with branded HTML template
- Sections: Executive Summary, Key Highlights, Areas of Concern, Recommended Actions
- Page also supports Download .txt

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, routing, SSR |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui (Radix) | Accessible UI component library |
| React Leaflet | Interactive civic map |
| Zustand | Global state (complaints, notifications, user) |
| Socket.io Client | Real-time WebSocket (`autoConnect: false`) |
| Recharts | Analytics charts |
| jsPDF | PDF report export |
| next/image | Optimised image rendering (Navbar.png logo) |
| Clerk (`@clerk/nextjs`) | Auth + session management |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express.js 5 | REST API server |
| TypeScript 6 | Type-safe backend |
| Socket.io | WebSocket server for real-time events |
| BullMQ + ioredis | Background SLA timer jobs |
| Nodemailer | SLA warnings, escalation, resolution, weekly summary emails |
| Clerk (`@clerk/express`) | Server-side auth middleware |
| Multer | Multipart image upload |
| Mongoose | MongoDB ODM |
| Gemini 1.5 Flash | AI categorization, RTI letters, weekly digest |

### Infrastructure

| Layer | Service |
|---|---|
| Database | MongoDB Atlas |
| Images | Cloudinary |
| Frontend | Vercel |
| Backend | Railway |
| Auth | Clerk |
| Queue / Cache | Redis (Upstash or Railway Redis) |
| AI | Google Gemini 1.5 Flash |

---

## Project Structure

```
NagarWatch/
├── client/
│   ├── public/
│   │   ├── Navbar.png          ← Brand navbar logo
│   │   └── favicon.png         ← Browser tab favicon
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          ← Root layout (favicon + Clerk)
│       │   ├── page.tsx            ← Landing page
│       │   ├── (admin)/
│       │   │   ├── admin-dashboard/
│       │   │   ├── admin/weekly-summary/
│       │   │   ├── users/
│       │   │   └── wards/
│       │   ├── (authority)/
│       │   │   ├── authority-dashboard/
│       │   │   ├── authority/complaints/
│       │   │   └── analytics/
│       │   ├── (citizen)/
│       │   │   ├── dashboard/
│       │   │   ├── submit/
│       │   │   ├── rti/
│       │   │   ├── notifications/      ← /notifications (NEW)
│       │   │   └── citizen/complaints/
│       │   └── (public)/
│       │       ├── complaints/
│       │       └── map/
│       ├── components/
│       │   ├── complaints/AICategorizeBadge.tsx
│       │   ├── layout/Navbar.tsx   ← Navbar.png logo + /notifications link
│       │   ├── map/CivicMap.tsx
│       │   └── providers/AppProviders.tsx
│       ├── hooks/
│       │   ├── useAuthToken.ts
│       │   └── useSocket.ts        ← Lazy connect (waits for isLoaded)
│       ├── lib/
│       │   ├── api.ts
│       │   └── socket.ts           ← autoConnect: false
│       └── store/
│           ├── complaintStore.ts
│           ├── notificationStore.ts
│           └── userStore.ts
└── server/
    └── src/
        ├── index.ts            ← Bootstraps server + weekly scheduler
        ├── jobs/
        │   ├── slaQueue.ts
        │   ├── slaWorker.ts
        │   └── weeklyEmailScheduler.ts  ← Monday 08:00 AM auto-email (NEW)
        ├── middleware/
        │   ├── auth.ts             ← requireAuth, attachUser, requireRole
        │   └── errorHandler.ts
        ├── models/
        │   ├── Complaint.ts
        │   ├── User.ts
        │   ├── Ward.ts
        │   └── Notification.ts
        ├── routes/
        │   ├── complaints.ts
        │   ├── users.ts
        │   ├── wards.ts
        │   └── ai.ts               ← /ai/rti, /ai/categorize, /ai/weekly-summary
        ├── services/
        │   ├── emailService.ts     ← SLA + resolution + weekly summary emails
        │   ├── geoService.ts
        │   ├── priorityService.ts
        │   └── slaService.ts
        └── socket/
```

---

## Getting Started

### Prerequisites
- Node.js 20+, MongoDB Atlas, Cloudinary, Clerk, Redis, Gemini API key

### Environment Variables

**`server/.env`**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
REDIS_URL=your_redis_url
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
COMMISSIONER_EMAIL=commissioner@example.com
GEMINI_API_KEY=your_gemini_api_key
```

**`client/.env.local`**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Installation & Run

```bash
git clone https://github.com/AkshatKardak/NagarWatch.git
cd NagarWatch
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run both together
npm run dev

# Or separately
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:3000
```

---

## Known Issues & Fixes

**`TypeError: argument handler must be a function`** — `attachUser` was missing from `auth.ts`. Fixed by adding the async middleware that does `User.findOne({ clerkId })` and sets `req.user`.

**Socket.io `xhr poll error`** — `autoConnect: true` caused connection before the server started. Fixed with `autoConnect: false` + explicit `connectSocket()` called only after Clerk `isLoaded`.

**Favicon showing Vercel logo** — `client/src/app/favicon.ico` (default Next.js file) was overriding `favicon.png`. Fixed with explicit `<link rel="icon">` tags in `layout.tsx`. Delete `client/src/app/favicon.ico` for a permanent fix.

**AppProviders import error** — Was a named export, now `export default`.

---

## Future Enhancements

| Feature | Description |
|---|---|
| Sarvam AI Translation | Hindi/Marathi complaint input → English processing |
| Smart Duplicate Detection | NLP similarity matching in addition to geospatial check |
| Predictive Analytics | Trend forecasting by ward, category, and season |
| Mobile App | React Native citizen app with push notifications |
| Ward Boundary Drawing | Admin polygon drawing tool (Leaflet Draw) for ward configuration |

---

## Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License © 2026 [Akshat Kardak](https://github.com/AkshatKardak)
