# 🏙️ NagarWatch — Real-Time Civic Issue Reporting & Governance Platform

> NagarWatch is a full-stack civic governance platform bridging the gap between citizens and local authorities. Citizens report issues, track progress, and experience transparent public service management through real-time updates, interactive maps, proof-based resolution, SLA enforcement, and AI-powered assistance.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-orange?logo=google)](https://aistudio.google.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple?logo=clerk)](https://clerk.com)
[![Redis](https://img.shields.io/badge/Queue-BullMQ%2FRedis-red?logo=redis)](https://bullmq.io)
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
- Socket.IO keeps every stakeholder updated instantly

---

## User Roles

Role is stored in **Clerk `publicMetadata.role`** and gates all routes and UI. Users select their intended role during sign-up (citizen or authority). Admin accounts are provisioned manually via MongoDB Atlas.

### 👤 Citizen
- Report civic issues with image, GPS, and description
- View nearby complaints before submitting (50m duplicate prevention)
- Upvote existing complaints to boost their priority
- Track complaint status in real time via Socket.IO
- Generate RTI Act 2005 letters for complaints unresolved 30+ days
- View full notification history
- **Routes:** `/citizen/dashboard` · `/citizen/submit` · `/citizen/complaints` · `/notifications` · `/rti` · `/map`

### 🛡️ Authority
- Manage complaints assigned to their ward
- Update status: `pending → in_progress → resolved`
- Upload mandatory Before/After resolution proof photos
- Monitor SLA timers before escalation triggers
- **Routes:** `/authority/dashboard` · `/authority/complaints` · `/authority/analytics`

### 👑 Admin
- Manage authority accounts and user roles at `/admin/users`
- Configure wards at `/admin/wards`
- View city-wide analytics and department performance
- Receive AI-powered weekly civic summary email every Monday 08:00 AM
- **Routes:** `/admin/dashboard` · `/admin/users` · `/admin/wards` · `/admin/weekly-summary`

> ⚠️ **Admin accounts are not self-registered.** Set `role: "admin"` manually in MongoDB Atlas → `users` collection, then update Clerk `publicMetadata.role` via Clerk Dashboard.

---

## Key Features

### 🗺️ Interactive Civic Map
City-wide public map displaying all reported issues. No login required.
- Real-time complaint markers via Socket.IO
- Status color coding: 🔴 Pending → 🟠 In Progress → 🟢 Resolved
- Area and category filters

### 📋 Complaint Submission
Citizens submit with title, description, category, image, and GPS location. **Gemini AI auto-categorize** button suggests category, priority, keywords, and estimated SLA instantly.

### 📍 Geospatial Duplicate Prevention
Checks for existing complaints within a **50-metre radius** using MongoDB `$geoNear` before creating a new one. Citizen can join/upvote the existing complaint or create a new one.

### 👍 Community Upvoting
Each upvote increases the complaint's priority score. High-upvote complaints surface to the top of the authority queue. One upvote per user enforced server-side.

### ⚡ Real-Time Updates (Socket.IO)

| Event | Trigger | Recipient |
|---|---|---|
| `new_complaint` | Citizen submits | All map viewers |
| `status_updated` | Authority acts | Complaint owner |
| `complaint_escalated` | SLA breached | Citizen + senior authority |
| `upvote_received` | Citizen upvotes | Authority dashboard |

### ⏱️ SLA Enforcement & Auto-Escalation
BullMQ background jobs (ioredis TCP) enforce deadlines per category:

| Category | SLA |
|---|---|
| Water Leak | 24 hours |
| Pothole | 72 hours |
| Garbage | 48 hours |
| Streetlight | 48 hours |

Escalation chain: Ward Officer → Zonal Head → Commissioner. Warning at 80%, auto-escalation at deadline breach.

### 📷 Proof-Based Resolution
Authorities must upload an **After photo** before marking resolved. Before/after images displayed side-by-side to the public.

### 🔔 Notifications (`/notifications`)
Full-page notification history for citizens with type-coloured badges, filter tabs (All / Unread), per-item mark-as-read, and mark-all-read.

---

## Unique Features

- **🌐 What3Words Micro-Pinpointing Integration**: Ultra-precise 3m × 3m geographic grid resolution mapping enabling field municipal workers to locate underground drainage leaks, damaged transformer boxes, and potholes without ambiguous street descriptions.
- **⚖️ Automated RTI Act 2005 Legal Escalation Engine**: Automatically generates statutory Right to Information notices (under Section 7 & 19 of the Indian RTI Act 2005) for unresolved civic grievances exceeding 30-day thresholds, complete with instant PDF generation and legal notice dispatch.
- **🤖 Multimodal Gemini AI Civic Vision & Auto-Triage**: Instant visual verification of damaged infrastructure from citizen photos with automatic severity grading, duplicate cluster detection, and estimated SLA computation.
- **👷 Public Contractor Performance & Transparency Audit**: Real-time contractor performance scorecards displaying on-time resolution percentages, SLA compliance metrics, and mandatory side-by-side Before/After photographic proof.
- **📡 Dynamic Heatmap & Ward Boundary Spatial Analytics**: Interactive civic heatmap visualizing grievance clusters across municipal zones, helping commissioners allocate maintenance budgets dynamically.
- **⚡ Real-Time Multi-Room Socket.IO Civic Hub**: Multi-tier real-time synchronisation across Citizen, Authority, Contractor, and Public interactive map rooms with sub-second event broadcasts.

---

## AI Features (Gemini 1.5 Flash)

All AI features powered by Gemini via `POST /api/v1/ai/*`. Requires `GEMINI_API_KEY` in `server/.env.local`.

### AI Auto-Categorization
`POST /api/v1/ai/categorize` — Drop-in `<AICategorizeBadge />` component on the submit form.
Returns: `{ category, priority, keywords[], suggestedAction, estimatedSLAHours, confidence }`

### RTI Letter Generator
`POST /api/v1/ai/rti` — Page: `/rti` (citizen, auth required)
- Loads only eligible complaints (unresolved + 30+ days old)
- Generates a full formal RTI Act 2005 letter citing Section 7 and Section 19
- Output: Copy button + Download .txt

### Weekly Civic Summary
`POST /api/v1/ai/weekly-summary` — Page: `/admin/weekly-summary` (admin only)
- Manual trigger on-page + **automatic email every Monday 08:00 AM IST**
- Aggregates 7-day MongoDB stats and sends to Gemini for narrative digest
- Emailed to `COMMISSIONER_EMAIL` via Resend with branded HTML template

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 15 | React framework, routing, SSR |
| React | 19 | UI library |
| TypeScript | 6 | Type safety |
| Tailwind CSS | v4 | Utility-first styling |
| shadcn/ui (Radix UI) | latest | Accessible component library |
| Clerk (`@clerk/nextjs`) | latest | Auth, session, publicMetadata roles |
| Zustand | 5 | Global state (user, complaints, notifications) |
| Socket.IO Client | 4 | Real-time WebSocket events |
| React Leaflet | 4 | Interactive civic map |
| Recharts | 2 | Analytics charts |
| Axios | 1 | HTTP client with auth interceptor |
| Lucide React | latest | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express.js | 5 | REST API server |
| TypeScript | 6 | Type-safe backend |
| Socket.IO | 4 | WebSocket server |
| Mongoose | 8 | MongoDB ODM |
| BullMQ | 5 | Background SLA timer jobs |
| ioredis | 5 | TCP Redis client for BullMQ |
| Clerk (`@clerk/express`) | latest | Server-side auth middleware |
| Multer | 1 | Multipart image upload |
| Cloudinary SDK | 2 | Image upload & CDN storage |
| Resend | 4 | Transactional email (SLA, resolution, weekly digest) |
| node-cron | 3 | Weekly email scheduler (Monday 08:00 AM) |
| Gemini 1.5 Flash (REST) | v1beta | AI categorization, RTI letters, weekly digest |
| ts-node-dev | 2 | Dev server with hot reload |

### Infrastructure

| Layer | Service | Notes |
|---|---|---|
| Database | MongoDB Atlas | Geospatial indexes (`2dsphere`) for duplicate detection |
| Image CDN | Cloudinary | Complaint before/after photos |
| Auth | Clerk | JWT + publicMetadata role gating |
| Queue / Cache | Redis (Upstash) | BullMQ jobs via ioredis TCP; Upstash REST for cache |
| Frontend Deploy | Vercel | Next.js 15 optimised |
| Backend Deploy | Render / Railway | Express + Socket.IO |
| AI | Google Gemini 1.5 Flash | Via REST API |

---

## Project Structure

```
NagarWatch/
├── client/                         # Next.js 15 frontend
│   ├── public/
│   │   ├── Navbar.png              # Brand navbar logo
│   │   └── favicon.png             # Browser tab favicon
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # Root layout (favicon + Clerk providers)
│       │   ├── page.tsx            # Public landing page
│       │   ├── sign-in/            # Clerk SignIn + role legend
│       │   ├── sign-up/            # Clerk SignUp + role selector (citizen/authority)
│       │   ├── (admin)/            # Admin route group (role-gated)
│       │   │   ├── admin-dashboard/
│       │   │   ├── admin/weekly-summary/
│       │   │   ├── users/
│       │   │   └── wards/
│       │   ├── (authority)/        # Authority route group (role-gated)
│       │   │   ├── authority/dashboard/
│       │   │   ├── authority/complaints/
│       │   │   └── authority/analytics/
│       │   ├── (citizen)/          # Citizen route group (role-gated)
│       │   │   ├── citizen/dashboard/
│       │   │   ├── citizen/submit/
│       │   │   ├── citizen/complaints/
│       │   │   ├── notifications/
│       │   │   └── rti/
│       │   └── (public)/           # No auth required
│       │       ├── complaints/
│       │       └── map/
│       ├── components/
│       │   ├── complaints/AICategorizeBadge.tsx
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   └── Sidebar.tsx     # Role-aware nav links
│       │   ├── map/CivicMap.tsx
│       │   └── providers/AppProviders.tsx
│       ├── hooks/
│       │   ├── useAuthToken.ts
│       │   └── useSocket.ts        # Lazy connect (waits for Clerk isLoaded)
│       ├── lib/
│       │   ├── api.ts              # Axios instance + all API helpers
│       │   └── socket.ts           # autoConnect: false singleton
│       ├── store/
│       │   ├── complaintStore.ts
│       │   ├── notificationStore.ts
│       │   └── userStore.ts
│       └── types/
│           ├── complaint.ts
│           └── user.ts
└── server/                         # Express 5 backend
    └── src/
        ├── index.ts                # Bootstrap: Express + Socket.IO + weekly scheduler
        ├── config/
        │   ├── cloudinary.ts       # Cloudinary init + typed upload helper
        │   └── redis.ts            # ioredis TCP (BullMQ) + Upstash REST (cache)
        ├── jobs/
        │   ├── slaQueue.ts         # BullMQ queue definition
        │   ├── slaWorker.ts        # SLA deadline processor
        │   └── weeklyEmailScheduler.ts  # node-cron Monday 08:00 AM
        ├── middleware/
        │   ├── auth.ts             # requireAuth, attachUser, requireRole
        │   ├── errorHandler.ts     # Typed error handler (Multer, Cloudinary, generic)
        │   └── upload.ts           # Multer config (5 MB, JPEG/PNG/WebP only)
        ├── models/
        │   ├── Complaint.ts        # Mongoose schema with 2dsphere index
        │   ├── User.ts
        │   ├── Ward.ts
        │   └── Notification.ts
        ├── routes/
        │   ├── complaints.ts
        │   ├── users.ts
        │   ├── wards.ts
        │   └── ai.ts               # /rti · /categorize · /weekly-summary
        ├── services/
        │   ├── emailService.ts     # Resend email templates
        │   ├── geoService.ts
        │   ├── priorityService.ts
        │   └── slaService.ts
        └── socket/
            └── index.ts            # Socket.IO event handlers
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Clerk account (set `publicMetadata.role` for auth gating)
- Redis (Upstash recommended for serverless)
- Gemini API key (Google AI Studio)
- Resend API key (for transactional emails)

### Environment Variables

**`server/.env.local`**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
MONGODB_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
REDIS_URL=your_upstash_redis_rest_url
REDIS_TOKEN=your_upstash_redis_rest_token
REDIS_TCP_URL=your_ioredis_tcp_url
RESEND_API_KEY=your_resend_api_key
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
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Installation & Run

```bash
git clone https://github.com/AkshatKardak/NagarWatch.git
cd NagarWatch

# Install all dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Run both concurrently from root
npm run dev

# Or run separately
npm run dev:server   # Express server → http://localhost:5000
npm run dev:client   # Next.js client → http://localhost:3000
```

### Setting Up Admin Access

Admin accounts cannot self-register. After any user signs up:

1. Open **MongoDB Atlas** → `nagarwatch` DB → `users` collection
2. Find the user document → set `role: "admin"`
3. Open **Clerk Dashboard** → Users → find the user → Edit `publicMetadata` → set `{ "role": "admin" }`
4. User signs out and back in — they are now redirected to `/admin/dashboard`

---

## Role Routing Matrix

| Role | After Sign-In | Dashboard | Blocked from |
|---|---|---|---|
| `citizen` | `/citizen/dashboard` | `/citizen/dashboard` | `/authority/*`, `/admin/*` |
| `authority` | `/authority/dashboard` | `/authority/dashboard` | `/citizen/*`, `/admin/*` |
| `admin` | `/admin/dashboard` | `/admin/dashboard` | `/citizen/*`, `/authority/*` |
| *(unauthenticated)* | `/sign-in` | — | All role-gated routes |

---

## Known Issues & Fixes Applied

| Issue | Fix |
|---|---|
| `TypeError: argument handler must be a function` | `attachUser` was missing from `auth.ts`; added async middleware that does `User.findOne({ clerkId })` |
| Socket.IO `xhr poll error` | `autoConnect: true` fired before server started; fixed with `autoConnect: false` + explicit `connectSocket()` after Clerk `isLoaded` |
| Cloudinary 500 on complaint submit | `CLOUDINARY_CLOUD_NAME` was placeholder; now validated at module load with actionable startup log |
| Multer MIME rejection returning 500 | `fileFilter` used plain `Error`; changed to `MulterError` so `errorHandler` returns proper 400 |
| RTI button missing from sidebar | `Scale` icon + `/rti` link was absent from `linksByRole.citizen` in `Sidebar.tsx`; added |
| Notifications sidebar link wrong | Pointed to `/citizen/dashboard`; corrected to `/notifications` |
| `findOneAndUpdate` Mongoose deprecation | `new: true` option deprecated; use `returnDocument: 'after'` |
| SLA skip silent in logs | Changed `console.log` mock to `console.warn` with structured complaint ID and reason |

---

## Future Enhancements

| Feature | Description |
|---|---|
| Sarvam AI Translation | Hindi/Marathi complaint input → English processing |
| Smart Duplicate Detection | NLP similarity matching in addition to geospatial check |
| Predictive Analytics | Trend forecasting by ward, category, and season |
| Mobile App | React Native citizen app with push notifications |
| Ward Boundary Drawing | Admin polygon drawing tool (Leaflet Draw) for ward configuration |
| Webhook Role Sync | Clerk webhook to auto-apply `requestedRole` from sign-up `unsafeMetadata` |

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
