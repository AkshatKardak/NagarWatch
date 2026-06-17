# 🏙️ NagarWatch — Real-Time Civic Issue Reporting & Governance Platform

> NagarWatch is a full-stack, web-based civic governance platform designed to bridge the communication gap between citizens and local authorities. Citizens report civic issues, track complaint progress, participate in community-driven prioritization, and experience transparent public service management through real-time updates, interactive maps, proof-based resolution workflows, and SLA-based escalation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-orange?logo=google)](https://aistudio.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Objectives](#4-objectives)
5. [User Roles](#5-user-roles)
6. [Key Features](#6-key-features)
7. [AI Features (Gemini)](#7-ai-features-gemini)
8. [Unique Features](#8-unique-features)
9. [System Architecture](#9-system-architecture)
10. [Workflow](#10-workflow)
11. [Technology Stack](#11-technology-stack)
12. [Project Structure](#12-project-structure)
13. [Getting Started](#13-getting-started)
14. [Known Issues & Fixes](#14-known-issues--fixes)
15. [Future Enhancements (Phase 2)](#15-future-enhancements-phase-2)
16. [Expected Impact](#16-expected-impact)
17. [Contributing](#17-contributing)
18. [License](#18-license)

---

## 1. Project Overview

NagarWatch is a centralized civic issue reporting and governance platform built for Indian municipalities. The platform enables:

- **Citizens** to photograph and report problems like potholes, garbage accumulation, broken streetlights, water leakages, and drainage failures
- **Authorities** to manage, prioritize, and resolve complaints with mandatory proof-of-resolution photo uploads
- **Administrators** to monitor city-wide performance, configure wards and SLA thresholds, generate AI-powered weekly summaries, and export analytics reports

Each complaint is automatically scored by priority, assigned an SLA deadline, and routed to the relevant ward authority. Real-time updates via Socket.io and public map visibility ensure full transparency.

---

## 2. Problem Statement

Urban cities frequently face civic issues:

- Potholes and road damage
- Garbage accumulation
- Water leakage and drainage problems
- Broken streetlights

Current complaint systems suffer from severe limitations:

- Complaints are scattered across helplines, WhatsApp groups, emails, and broken portals
- Citizens have limited or zero visibility into existing complaints
- Duplicate complaints are frequently created for the same issue
- Authorities lack efficient prioritization mechanisms
- Citizens cannot track complaint progress after submission
- Resolution status lacks transparency and accountability
- No centralized platform exists for analytics and civic insights

As a result, issues remain unresolved for long periods and public trust in local administration decreases.

---

## 3. Proposed Solution

NagarWatch provides a centralized civic issue reporting and governance platform where:

- Citizens can report, upvote, and track issues
- Authorities can manage, resolve, and provide proof of resolution
- Administrators can monitor city-wide performance and configure the system
- Communities can prioritize issues through voting
- Real-time updates ensure full transparency
- **Gemini AI** auto-categorizes complaints, generates RTI letters, and produces weekly civic digests

The platform combines **geospatial mapping**, **community participation**, **role-based management**, **SLA escalation**, **AI intelligence**, and **real-time communication** into a single unified ecosystem.

---

## 4. Objectives

- Centralize civic issue reporting across all wards
- Improve transparency in issue resolution
- Enable community-driven prioritization through upvoting
- Reduce duplicate complaints via geospatial detection (50m radius)
- Increase accountability through mandatory proof-based resolution
- Provide authorities with actionable insights via analytics
- Deliver real-time visibility into city infrastructure issues
- Enforce SLA timelines and auto-escalate unresolved complaints
- Leverage Gemini AI to assist citizens and administrators intelligently

---

## 5. User Roles

NagarWatch uses **Clerk's `publicMetadata.role`** to gate routes and UI.

### Citizen
- Report civic issues with image, GPS location, and description
- View nearby complaints before submitting (duplicate prevention)
- Upvote existing complaints to boost their priority score
- Track complaint status in real time
- Generate RTI Act 2005 letters for complaints unresolved 30+ days
- View personal complaint history and real-time notifications
- **Dashboard URL:** `/dashboard`
- **Submit URL:** `/submit`
- **RTI Generator URL:** `/rti`

### Authority
- View and manage complaints assigned to their ward
- Update complaint status: Pending → In Progress → Resolved
- Upload mandatory resolution proof (Before / After photos)
- Monitor SLA timers and act before escalation triggers
- View ward-level analytics
- **Dashboard URL:** `/authority-dashboard`
- **Complaints URL:** `/authority/complaints`
- **Analytics URL:** `/analytics`

### Administrator
- Manage authority accounts and user roles
- Configure wards, categories, and SLA thresholds
- Moderate complaints
- View city-wide analytics and department performance
- Generate AI-powered weekly civic summary for the Commissioner
- Monitor platform health and SLA breach rates
- **Dashboard URL:** `/admin-dashboard`
- **Users URL:** `/users`
- **Wards URL:** `/wards`
- **Weekly Summary URL:** `/admin/weekly-summary`

---

## 6. Key Features

### 6.1 Interactive Civic Map
A city-wide public map displaying all reported issues in real time.
- Real-time complaint markers via Socket.io
- Status-based color coding:
  - 🔴 **Red** → Pending
  - 🟠 **Amber** → In Progress
  - 🟢 **Green** → Resolved
- Area and category filtering
- **Fully public — no login required to view**

### 6.2 Complaint Submission
Citizens submit complaints with:
- Title and description
- Category (Pothole, Water, Garbage, Streetlight, Road, Drainage, Other)
- Image upload (stored on Cloudinary)
- GPS auto-detected location or manual pin on Leaflet map
- **Gemini AI auto-categorize button** to suggest category, priority, keywords, and estimated SLA

### 6.3 Nearby Complaint Detection (Geospatial Duplicate Prevention)
Before creating a new complaint, the system checks for existing complaints within a **50-metre radius** using MongoDB `$geoNear` queries.

- If a nearby complaint is found → citizen sees a comparison modal
- Citizen can **Join / Upvote** the existing complaint, or
- Citizen can **Create New** if the issue is different

### 6.4 Community Upvoting
- Each upvote increases the complaint's priority score
- High-upvote complaints surface to the top of the authority dashboard
- Drives community-based prioritization of high-impact issues

### 6.5 Real-Time Updates (Socket.io)

| Event | Trigger | Who Receives |
|---|---|---|
| `new_complaint` | Citizen submits | All map viewers |
| `status_updated` | Authority acts | Complaint owner |
| `complaint_escalated` | SLA breached | Citizen + senior authority |
| `upvote_received` | Citizen upvotes | Authority dashboard |

### 6.6 Complaint Lifecycle Tracking
Every complaint follows a transparent lifecycle:
```
Pending → In Progress → Resolved
```
Complete timeline history with timestamps is visible to all users.

### 6.7 SLA Enforcement & Auto-Escalation
SLA timers enforced per complaint category using BullMQ background jobs:

| Category | SLA Deadline |
|---|---|
| Water Leak | 24 hours |
| Pothole | 72 hours |
| Garbage | 48 hours |
| Streetlight | 48 hours |

**Escalation Chain:** Ward Officer → Zonal Head → Commissioner
- Warning notification sent at 80% of SLA time
- Auto-escalation triggered on deadline breach
- Full escalation log recorded with reason and timestamp

### 6.8 Proof-Based Resolution
Authorities **must upload a resolution proof image** before marking a complaint as Resolved.
- **Before image** — submitted by citizen at complaint time
- **After image** — uploaded by authority at resolution
- Side-by-side before/after visible to the public

### 6.9 Personal Citizen Dashboard (`/dashboard`)
- View all submitted complaints and their current status
- Track lifecycle progress with timeline
- Receive real-time notifications
- Access full complaint history
- Quick link to RTI generator for eligible complaints

### 6.10 Authority Dashboard (`/authority-dashboard`)
- View complaint queue sorted by priority score
- Filter by ward, category, and status
- Update complaint status with action notes
- Upload resolution proof photo
- Monitor SLA countdown timers
- View ward-level analytics at `/analytics`

### 6.11 Administrative Dashboard (`/admin-dashboard`)
- Manage authority accounts and role assignments at `/users`
- Configure wards and ward boundaries at `/wards`
- View city-wide analytics:
  - Resolution rate per department
  - SLA breach rate
  - Top reported categories
  - Ward-wise complaint density
  - Week-on-week trends
- Generate AI weekly summary at `/admin/weekly-summary`
- Export PDF performance reports (jsPDF)

---

## 7. AI Features (Gemini)

All AI features are powered by **Gemini 1.5 Flash** via the `POST /api/v1/ai/*` endpoints. Requires `GEMINI_API_KEY` in `server/.env`.

### 7.1 AI Auto-Categorization (`POST /api/v1/ai/categorize`)

Available as a drop-in `<AICategorizeBadge />` component on the complaint submission form.

**Input:** complaint title + description 
**Returns:**
```json
{
  "category": "pothole",
  "priority": "high",
  "keywords": ["road", "damage", "accident"],
  "suggestedAction": "Dispatch road repair crew within 24 hours.",
  "estimatedSLAHours": 48,
  "confidence": 0.94
}
```

**Usage:**
```tsx
import { AICategorizeBadge } from "@/components/complaints/AICategorizeBadge"

<AICategorizeBadge
  title={formTitle}
  description={formDescription}
  onApply={(result) => {
    setCategory(result.category)
    setPriority(result.priority)
  }}
/>
```

### 7.2 RTI Letter Generator (`POST /api/v1/ai/rti`)

Page: `/rti` (Citizen route, auth required)

- Automatically loads only eligible complaints (unresolved + 30+ days old)
- Pre-fills applicant name from Clerk user profile
- Generates a full formal RTI Act 2005 letter citing:
  - Section 7 (30-day response deadline)
  - Section 19 (appeal rights)
- Output supports **Copy** and **Download .txt**

**Request body:**
```json
{
  "complaintId": "...",
  "applicantName": "John Doe",
  "applicantAddress": "123 MG Road, Pune",
  "applicantPhone": "9876543210"
}
```

### 7.3 Weekly Civic Summary (`POST /api/v1/ai/weekly-summary`)

Page: `/admin/weekly-summary` (Admin only)

- Aggregates 7-day MongoDB stats: new complaints, resolved, in-progress, pending, SLA breaches, top 5 categories
- Gemini generates a professional markdown digest for the Municipal Commissioner
- Includes executive summary, highlights, areas of concern, action items
- Supports **Download .txt** for sharing

---

## 8. Unique Features

| Feature | Description |
|---|---|
| Public Complaint Visibility | All complaints visible on a public map — no login required |
| Geospatial Duplicate Detection | 50m radius check prevents repeated complaints for the same issue |
| Community Prioritization | Upvotes drive issue ranking in the authority queue |
| Proof-Based Resolution | Mandatory before/after photo upload before closing any complaint |
| SLA Auto-Escalation | BullMQ jobs enforce deadlines and escalate to senior officials automatically |
| Real-Time Civic Monitoring | All events broadcast instantly via Socket.io WebSocket |
| Dynamic Ward Assignment | MongoDB `$geoIntersects` auto-assigns complaints to correct ward by GPS polygon |
| Gemini AI Categorization | Auto-classify category, priority, keywords, and SLA estimate from complaint text |
| RTI Letter Generator | Gemini drafts a legally-cited RTI Act 2005 letter for unresolved complaints |
| Weekly AI Digest | Gemini generates a weekly governance summary for the Commissioner |
| Custom Navbar Logo & Favicon | Brand identity with `Navbar.png` and `favicon.png` from `client/public/` |

---

## 9. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Public UI     │  │   Citizen UI     │  │ Authority /   │  │
│  │  /complaints    │  │  /dashboard      │  │ Admin UI      │  │
│  │  /map           │  │  /submit         │  │ /authority-   │  │
│  │                 │  │  /rti            │  │ dashboard     │  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘  │
│                              │                                  │
│          Next.js 16 App Router (Route Groups)                   │
│          ClerkProvider → AppProviders (Zustand + Socket)        │
│          Navbar: Navbar.png logo  │  Favicon: favicon.png       │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ REST API + WebSocket
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS SERVER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Routes     │  │  Middleware  │  │       Services        │  │
│  │ /complaints  │  │ Clerk Auth   │  │  Priority Scoring     │  │
│  │ /users       │  │ Helmet/CORS  │  │  SLA Calculation      │  │
│  │ /wards       │  │ Morgan       │  │  Cloudinary Upload    │  │
│  │ /ai          │  └──────────────┘  └───────────────────────┘  │
│  └──────────────┘                                               │
│                                                                 │
│  ┌─────────────────────┐    ┌──────────────────────────────┐    │
│  │  BullMQ Jobs        │    │     Socket.IO                │    │
│  │  SLA Checker        │    │  Real-time Notifications     │    │
│  │  Escalation Engine  │    │  Map Updates                 │    │
│  │  Email Queue        │    └──────────────────────────────┘    │
│  └──────────┬──────────┘                                        │
└─────────────┼───────────────────────────────────────────────────┘
              │
      ┌───────▼────────┐   ┌──────────────┐   ┌────────────────┐
      │     Redis      │   │   MongoDB    │   │   Cloudinary   │
      │  (BullMQ +     │   │   Atlas      │   │   (Images)     │
      │   ioredis)     │   │  Complaints  │   └────────────────┘
      └────────────────┘   │  Users       │
                           │  Wards       │   ┌────────────────┐
                           │  Notifications│   │  Nodemailer    │
                           └──────────────┘   │  (Email alerts)│
                                              └────────────────┘
                                    │
                           ┌────────▼────────┐   ┌─────────────────┐
                           │   Clerk Auth    │   │  Gemini AI      │
                           │  (publicMeta   │   │  1.5 Flash      │
                           │   role-based)   │   │  /ai/* routes   │
                           └─────────────────┘   └─────────────────┘
```

---

## 10. Workflow

```
Step 1  → Citizen opens NagarWatch
Step 2  → Citizen views nearby complaints on public map (/map)
Step 3  → Citizen goes to /submit — optionally uses AI auto-categorize
Step 4  → Citizen submits complaint (title, description, category, image, GPS)
Step 5  → System checks 50m radius for existing nearby complaints ($geoNear)
Step 6  → If duplicate found → citizen upvotes existing complaint
Step 7  → If new complaint → stored in MongoDB with geospatial coordinates
Step 8  → Image uploaded to Cloudinary, URL stored in complaint record
Step 9  → MongoDB $geoIntersects assigns complaint to correct ward automatically
Step 10 → Socket.io broadcasts new complaint to all connected users instantly
Step 11 → Complaint appears on public map with 🔴 Pending marker
Step 12 → Other citizens upvote the complaint (priority score increases)
Step 13 → Authority reviews queue at /authority-dashboard sorted by priority
Step 14 → Authority updates status: Pending → In Progress
Step 15 → Citizen receives real-time status notification via Socket.io
Step 16 → SLA timer runs in background via BullMQ
Step 17 → If 80% SLA elapsed → warning email sent via Nodemailer
Step 18 → If SLA breached → auto-escalation triggered up the chain
Step 19 → Authority uploads After photo as resolution proof
Step 20 → Status updated to Resolved → map marker turns 🟢
Step 21 → Citizen receives resolution notification with before/after proof
Step 22 → If unresolved 30+ days → citizen uses /rti to generate RTI letter
Step 23 → Admin generates weekly summary at /admin/weekly-summary for Commissioner
```

---

## 11. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, routing, SSR |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui (Radix primitives) | Accessible UI component library |
| React Leaflet | Interactive civic map |
| Zustand | Lightweight global state management |
| Socket.io Client | Real-time WebSocket (`autoConnect: false`, lazy connect) |
| Recharts | Analytics charts and dashboards |
| jsPDF | PDF report generation |
| Lucide React | Icon library |
| next/image | Optimized image rendering (Navbar.png logo) |
| Clerk (`@clerk/nextjs`) | Authentication and session management |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express.js 5 | REST API server |
| TypeScript 6 | Type-safe backend development |
| Socket.io | WebSocket server for real-time events |
| BullMQ + ioredis | Background job queues for SLA timers |
| Nodemailer | SLA warning and escalation email alerts |
| Clerk (`@clerk/express`) | Server-side auth middleware |
| Multer | Multipart image upload handling |
| Mongoose | MongoDB ODM |
| Helmet + CORS + Morgan | Security and logging middleware |
| Gemini 1.5 Flash API | AI categorization, RTI letters, weekly summaries |

### Infrastructure

| Layer | Service |
|---|---|
| Database | MongoDB Atlas |
| Image Storage | Cloudinary |
| Frontend Deployment | Vercel |
| Backend Deployment | Railway (recommended — supports Socket.io) |
| Authentication | Clerk |
| Job Queue / Cache | Redis (Upstash or Railway Redis) |
| AI | Google Gemini 1.5 Flash (REST API) |

---

## 12. Project Structure

```
NagarWatch/
├── package.json              ← Root (concurrently runs both)
├── .gitignore
│
├── client/                   ← Next.js 16 frontend
│   ├── public/
│   │   ├── Navbar.png        ← Brand navbar logo
│   │   └── favicon.png       ← Browser tab favicon
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                          ← Root layout (favicon meta + Clerk)
│       │   ├── page.tsx                            ← Landing page (hero, stats, features)
│       │   ├── globals.css                         ← Brand token CSS variables
│       │   ├── not-found.tsx                       ← 404 page
│       │   ├── favicon.ico                         ← Default Next.js favicon (fallback)
│       │   │
│       │   ├── (admin)/                            ← Admin route group
│       │   │   ├── layout.tsx                      ← Admin auth guard
│       │   │   ├── admin-dashboard/page.tsx         ← /admin-dashboard
│       │   │   ├── admin/weekly-summary/page.tsx   ← /admin/weekly-summary (AI digest)
│       │   │   ├── users/page.tsx                  ← /users
│       │   │   └── wards/page.tsx                  ← /wards
│       │   │
│       │   ├── (authority)/                        ← Authority route group
│       │   │   ├── layout.tsx                      ← Authority auth guard
│       │   │   ├── authority-dashboard/page.tsx    ← /authority-dashboard
│       │   │   ├── authority/complaints/page.tsx   ← /authority/complaints
│       │   │   └── analytics/page.tsx              ← /analytics
│       │   │
│       │   ├── (citizen)/                          ← Citizen route group
│       │   │   ├── layout.tsx                      ← Citizen auth guard
│       │   │   ├── dashboard/page.tsx              ← /dashboard
│       │   │   ├── submit/page.tsx                 ← /submit
│       │   │   ├── rti/page.tsx                    ← /rti (RTI letter generator)
│       │   │   └── citizen/complaints/page.tsx     ← /citizen/complaints
│       │   │
│       │   ├── (public)/                           ← Public route group (no auth)
│       │   │   ├── complaints/page.tsx             ← /complaints
│       │   │   ├── complaints/[id]/page.tsx        ← /complaints/:id
│       │   │   └── map/page.tsx                    ← /map
│       │   │
│       │   ├── sign-in/                            ← Clerk sign-in
│       │   ├── sign-up/                            ← Clerk sign-up
│       │   └── unauthorized/                       ← 403 page
│       │
│       ├── components/
│       │   ├── complaints/
│       │   │   ├── AICategorizeBadge.tsx           ← Gemini AI category suggest
│       │   │   └── StatusTimeline.tsx
│       │   ├── layout/
│       │   │   └── Navbar.tsx                      ← Navbar with Navbar.png logo
│       │   ├── map/
│       │   │   └── CivicMap.tsx                    ← Leaflet map (dynamic import)
│       │   ├── providers/
│       │   │   └── AppProviders.tsx                ← Zustand + Socket init
│       │   └── ui/                                 ← shadcn components
│       │
│       ├── hooks/
│       │   ├── useAuthToken.ts                     ← Syncs Clerk JWT → Axios Bearer
│       │   └── useSocket.ts                        ← Lazy Socket.io connect (isLoaded guard)
│       │
│       ├── lib/
│       │   ├── api.ts                              ← Axios instance + all API methods incl. aiAPI
│       │   ├── socket.ts                           ← Socket.io client (autoConnect: false)
│       │   └── utils.ts                            ← Formatters, color helpers
│       │
│       ├── store/
│       │   ├── complaintStore.ts
│       │   ├── notificationStore.ts
│       │   └── userStore.ts
│       │
│       └── types/
│           └── complaint.ts
│
└── server/                   ← Express + TypeScript backend
    └── src/
        ├── index.ts          ← Entry point (registers /ai route)
        ├── config/           ← DB, Redis, Cloudinary config
        ├── jobs/             ← BullMQ: SLA checker, escalation engine
        ├── middleware/
        │   ├── auth.ts       ← requireAuth, requireRole (Clerk)
        │   └── errorHandler.ts
        ├── models/
        │   ├── Complaint.ts  ← Core complaint schema (GeoJSON, SLA, statusHistory)
        │   ├── User.ts
        │   ├── Ward.ts       ← GeoJSON polygon schema
        │   └── Notification.ts
        ├── routes/
        │   ├── complaints.ts
        │   ├── users.ts
        │   ├── wards.ts
        │   └── ai.ts         ← POST /ai/rti, /ai/categorize, /ai/weekly-summary
        ├── services/         ← Priority scoring, SLA calculation
        └── socket/           ← Socket.IO event handlers
```

---

## 13. Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Clerk account
- Redis (Upstash for cloud, or local for dev)
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))

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
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
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

### Installation

```bash
# Clone the repository
git clone https://github.com/AkshatKardak/NagarWatch.git
cd NagarWatch

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### Running Locally

```bash
# Run both server and client together (recommended)
npm run dev

# Or run separately
npm run dev:server   # Express server → http://localhost:5000
npm run dev:client   # Next.js app   → http://localhost:3000
```

---

## 14. Known Issues & Fixes

### Issue 1: Route Group Path Collisions
**Problem:** Next.js App Router route groups `(citizen)`, `(authority)`, and `(admin)` are URL-transparent. Having identically named folders inside different groups creates path conflicts.

**Fix:** Each role's routes use unique path prefixes:
- Citizen: `/dashboard`, `/submit`, `/rti`, `/citizen/complaints`
- Authority: `/authority-dashboard`, `/authority/complaints`, `/analytics`
- Admin: `/admin-dashboard`, `/admin/weekly-summary`, `/users`, `/wards`

### Issue 2: `AppProviders` Import Error
**Problem:** `AppProviders` was exported as a named export but imported as a default export.

**Fix:** Changed to `export default function AppProviders` and updated all import sites.

### Issue 3: Socket.io `xhr poll error`
**Problem:** `socket.io-client` was initialized with `autoConnect: true`, causing it to attempt connection on import — before the Express server was running.

**Fix applied in `client/src/lib/socket.ts`:**
- `autoConnect: false` — socket never connects on import
- Added explicit `connectSocket()` function called only from `useSocket()` hook
- `transports: ["websocket", "polling"]` — tries WebSocket first, avoids XHR polling errors
- Connection errors log as `console.debug` (grey) not `console.error` (red)
- `useSocket.ts` waits for `isLoaded` from Clerk before connecting

### Issue 4: Duplicate `package-lock.json`
**Problem:** Both `client/` and `server/` had their own `package-lock.json` which conflicted with the root monorepo setup.

**Fix:** Added `client/package-lock.json` and `server/package-lock.json` to `.gitignore`; only root `package-lock.json` is tracked.

### Issue 5: Navbar Logo Not Showing
**Problem:** Navbar used a `<MapPin />` icon + text instead of the brand logo image.

**Fix:** Replaced with `next/image` `<Image src="/Navbar.png" />` with `priority` flag, `h-14` height, and navbar expanded to `h-20` for breathing room.

---

## 15. Future Enhancements (Phase 2)

| Feature | Description |
|---|---|
| Sarvam AI Translation | Hindi and Marathi complaint input → English processing |
| Smart Duplicate Detection | Cohere NLP similarity matching in addition to geospatial check |
| Predictive Analytics | Trend forecasting by ward, category, and season |
| Mobile App | React Native citizen app with push notifications |
| Ward Boundary Drawing | Admin polygon drawing tool for ward configuration |
| PDF Report Export | Scheduled auto-email of PDF performance reports to Commissioner |

---

## 16. Expected Impact

NagarWatch aims to:

- **Improve civic engagement** by making complaint submission accessible and public
- **Increase transparency** through proof-based resolution and public map visibility
- **Reduce duplicate complaints** through geospatial detection (50m radius)
- **Enhance accountability** via SLA enforcement and escalation chains
- **Enable data-driven governance** through ward-level analytics and AI weekly summaries
- **Empower citizens legally** via Gemini-generated RTI Act 2005 letters
- **Improve public trust** in local administration

The platform transforms traditional complaint reporting into a transparent, community-driven, AI-assisted, and real-time civic governance ecosystem.

---

## 17. Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 18. License

MIT License © 2026 [Akshat Kardak](https://github.com/AkshatKardak)
