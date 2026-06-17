# 🏙️ NagarWatch — Real-Time Civic Issue Reporting & Governance Platform

> NagarWatch is a full-stack, web-based civic governance platform designed to bridge the communication gap between citizens and local authorities. Citizens report civic issues, track complaint progress, participate in community-driven prioritization, and experience transparent public service management through real-time updates, interactive maps, proof-based resolution workflows, and SLA-based escalation.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Objectives](#4-objectives)
5. [User Roles](#5-user-roles)
6. [Key Features](#6-key-features)
7. [Unique Features](#7-unique-features)
8. [System Architecture](#8-system-architecture)
9. [Workflow](#9-workflow)
10. [Technology Stack](#10-technology-stack)
11. [Project Structure](#11-project-structure)
12. [Getting Started](#12-getting-started)
13. [Future Enhancements (Phase 2)](#13-future-enhancements-phase-2)
14. [Expected Impact](#14-expected-impact)
15. [Contributing](#15-contributing)
16. [License](#16-license)

---

## 1. Project Overview

NagarWatch is a centralized civic issue reporting and governance platform built for Indian municipalities. The platform enables:

- **Citizens** to photograph and report problems like potholes, garbage accumulation, broken streetlights, water leakages, and drainage failures
- **Authorities** to manage, prioritize, and resolve complaints with mandatory proof-of-resolution photo uploads
- **Administrators** to monitor city-wide performance, configure wards and SLA thresholds, and export analytics reports

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

The platform combines **geospatial mapping**, **community participation**, **role-based management**, **SLA escalation**, and **real-time communication** into a single unified ecosystem.

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

---

## 5. User Roles

NagarWatch uses **Clerk's `publicMetadata.role`** to gate routes and UI.

### Citizen
- Report civic issues with image, GPS location, and description
- View nearby complaints before submitting (duplicate prevention)
- Upvote existing complaints to boost their priority score
- Track complaint status in real time
- View personal complaint history and real-time notifications
- **Dashboard URL:** `/dashboard`

### Authority
- View and manage complaints assigned to their ward
- Update complaint status: Pending → In Progress → Resolved
- Upload mandatory resolution proof (Before / After photos)
- Monitor SLA timers and act before escalation triggers
- View ward-level analytics
- **Dashboard URL:** `/authority/authority-dashboard`

### Administrator
- Manage authority accounts and user roles
- Configure wards, categories, and SLA thresholds
- Moderate complaints
- View city-wide analytics and department performance
- Monitor platform health and SLA breach rates
- **Dashboard URL:** `/admin/admin-dashboard`

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

All complaints are instantly stored in MongoDB and broadcast to all users via Socket.io.

### 6.3 Nearby Complaint Detection (Geospatial Duplicate Prevention)
Before creating a new complaint, the system checks for existing complaints within a **50-metre radius** using MongoDB `$geoNear` queries.

- If a nearby complaint is found → citizen sees a comparison modal
- Citizen can **Join / Upvote** the existing complaint, or
- Citizen can **Create New** if the issue is different

**Benefit:** Reduces duplicate entries, concentrates upvotes, improves prioritization accuracy.

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
SLA timers are enforced per complaint category using BullMQ background jobs:

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

**Benefit:** Eliminates false closures and increases accountability.

### 6.9 Personal Citizen Dashboard (`/dashboard`)
- View all submitted complaints and their current status
- Track lifecycle progress
- Receive real-time notifications
- Access full complaint history

### 6.10 Authority Dashboard (`/authority/authority-dashboard`)
- View complaint queue sorted by priority score
- Filter by ward, category, and status
- Update complaint status with action notes
- Upload resolution proof photo
- Monitor SLA countdown timers
- View ward-level analytics

### 6.11 Administrative Dashboard (`/admin/admin-dashboard`)
- Manage authority accounts and role assignments
- Configure wards and ward boundaries
- Manage complaint categories and SLA thresholds
- View city-wide analytics:
  - Resolution rate per department
  - SLA breach rate
  - Top reported categories
  - Ward-wise complaint density
  - Week-on-week trends
- Export PDF performance reports (jsPDF)

---

## 7. Unique Features

| Feature | Description |
|---|---|
| Public Complaint Visibility | All complaints visible on a public map — no login required |
| Geospatial Duplicate Detection | 50m radius check prevents repeated complaints for the same issue |
| Community Prioritization | Upvotes drive issue ranking in the authority queue |
| Proof-Based Resolution | Mandatory before/after photo upload before closing any complaint |
| SLA Auto-Escalation | BullMQ jobs enforce deadlines and escalate to senior officials automatically |
| Real-Time Civic Monitoring | All events broadcast instantly via Socket.io WebSocket |
| Dynamic Ward Assignment | MongoDB `$geoIntersects` auto-assigns complaints to correct ward by GPS polygon |

---

## 8. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Public UI     │  │   Citizen UI     │  │ Authority/    │  │
│  │  /complaints    │  │  /citizen/...    │  │ Admin UI      │  │
│  │  /map           │  │  /dashboard      │  │ /authority/.. │  │
│  └─────────────────┘  └──────────────────┘  └───────────────┘  │
│                              │                                  │
│          Next.js 16 App Router (Route Groups)                   │
│          ClerkProvider → AppProviders (Zustand + Socket)        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST API + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXPRESS SERVER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Routes     │  │  Middleware  │  │       Services        │  │
│  │ /complaints  │  │ Clerk Auth   │  │  Priority Scoring     │  │
│  │ /users       │  │ Helmet/CORS  │  │  SLA Calculation      │  │
│  │ /admin       │  │ Morgan       │  │  Cloudinary Upload    │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
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
                           │  Notifications│  │  Nodemailer    │
                           └──────────────┘   │  (Email alerts)│
                                              └────────────────┘
                                    │
                           ┌────────▼────────┐
                           │   Clerk Auth    │
                           │  (Citizens /    │
                           │  Authorities /  │
                           │  Admins via     │
                           │  publicMetadata)│
                           └─────────────────┘
```

---

## 9. Workflow

```
Step 1  → Citizen opens NagarWatch
Step 2  → Citizen views nearby complaints on public map
Step 3  → Citizen submits complaint (title, description, category, image, GPS location)
Step 4  → System checks 50m radius for existing nearby complaints ($geoNear)
Step 5  → If duplicate found → citizen upvotes existing complaint (no new entry created)
Step 6  → If new complaint → stored in MongoDB with geospatial coordinates
Step 7  → Image uploaded to Cloudinary, URL stored in complaint record
Step 8  → MongoDB $geoIntersects assigns complaint to correct ward automatically
Step 9  → Socket.io broadcasts new complaint to all connected users instantly
Step 10 → Complaint appears on public map with 🔴 Pending marker
Step 11 → Other citizens upvote the complaint (priority score increases)
Step 12 → Authority reviews queue sorted by priority score
Step 13 → Authority updates status: Pending → In Progress
Step 14 → Citizen receives real-time status notification via Socket.io
Step 15 → SLA timer runs in background via BullMQ
Step 16 → If SLA breached → auto-escalation triggered up the chain
Step 17 → Authority uploads After photo as resolution proof
Step 18 → Status updated to Resolved → map marker turns 🟢
Step 19 → Citizen receives resolution notification with before/after proof
```

---

## 10. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework, routing, SSR |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui (Radix primitives) | Accessible UI component library |
| React Leaflet | Interactive civic map |
| Zustand | Lightweight global state management |
| Socket.io Client | Real-time WebSocket communication |
| Recharts | Analytics charts and dashboards |
| jsPDF | PDF report generation |
| Lucide React | Icon library |
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

### Infrastructure

| Layer | Service |
|---|---|
| Database | MongoDB Atlas |
| Image Storage | Cloudinary |
| Frontend Deployment | Vercel |
| Backend Deployment | Railway (recommended — supports Socket.io) |
| Authentication | Clerk |
| Job Queue / Cache | Redis (Upstash or Railway Redis) |

---

## 11. Project Structure

```
NagarWatch/
├── package.json              ← Root (concurrently runs both)
├── .gitignore
│
├── client/                   ← Next.js 16 frontend
│   └── src/
│       ├── app/
│       │   ├── (admin)/
│       │   │   └── admin/
│       │   │       └── admin-dashboard/page.tsx    # /admin/admin-dashboard
│       │   ├── (authority)/
│       │   │   └── authority/
│       │   │       ├── authority-dashboard/page.tsx # /authority/authority-dashboard
│       │   │       └── complaints/
│       │   │           ├── page.tsx                # /authority/complaints
│       │   │           └── [id]/page.tsx           # /authority/complaints/:id
│       │   ├── (citizen)/
│       │   │   ├── dashboard/page.tsx              # /dashboard
│       │   │   ├── submit/page.tsx                 # /submit
│       │   │   └── citizen/
│       │   │       └── complaints/page.tsx         # /citizen/complaints
│       │   ├── (public)/
│       │   │   ├── complaints/
│       │   │   │   ├── page.tsx                    # /complaints (public feed)
│       │   │   │   └── [id]/page.tsx               # /complaints/:id
│       │   │   └── map/page.tsx                    # /map
│       │   ├── sign-in/                            # Clerk sign-in
│       │   ├── sign-up/                            # Clerk sign-up
│       │   ├── unauthorized/                       # 403 page
│       │   ├── layout.tsx                          # Root layout
│       │   ├── page.tsx                            # Landing page
│       │   └── globals.css                         # Brand token CSS variables
│       ├── components/
│       │   ├── complaints/   # StatusTimeline, SLATimer, cards
│       │   ├── layout/       # Navbar
│       │   ├── map/          # CivicMap (Leaflet, dynamic import)
│       │   ├── providers/    # AppProviders.tsx (Zustand + Socket init)
│       │   └── ui/           # shadcn components
│       ├── hooks/
│       │   ├── useAuthToken.ts   # Syncs Clerk JWT → Axios Bearer header
│       │   └── useSocket.ts      # Socket.IO connection
│       ├── lib/
│       │   ├── api.ts            # Axios instance + all API methods
│       │   └── utils.ts          # Formatters, color helpers
│       ├── store/
│       │   ├── complaintStore.ts # Zustand complaint state
│       │   └── userStore.ts      # Zustand user state
│       └── types/
│           └── complaint.ts      # TypeScript interfaces
│
└── server/                   ← Express + TypeScript backend
    └── src/
        ├── config/           # DB, Redis, Cloudinary config
        ├── jobs/             # BullMQ: SLA checker, escalation engine
        ├── middleware/       # Clerk auth, role guards
        ├── models/
        │   ├── Complaint.ts  # Core complaint schema (GeoJSON, SLA, statusHistory)
        │   ├── User.ts       # User profile schema
        │   ├── Ward.ts       # Ward/district schema (GeoJSON polygon)
        │   └── Notification.ts
        ├── routes/           # Express route handlers
        ├── services/         # Business logic (priority scoring, SLA calc)
        ├── socket/           # Socket.IO event handlers
        └── index.ts          # Server entry point
```

---

## 12. Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Clerk account
- Redis (Upstash for cloud, or local for dev)

### Environment Variables

**`server/.env`**
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLERK_SECRET_KEY=your_clerk_secret_key
REDIS_URL=your_redis_url
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
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

## 13. Future Enhancements (Phase 2)

| Feature | Description |
|---|---|
| Gemini AI Categorization | Auto-categorize complaints, extract keywords, suggest actions |
| Sarvam AI Translation | Hindi and Marathi complaint input → English processing |
| Smart Duplicate Detection | Cohere NLP similarity matching in addition to geospatial check |
| RTI Letter Generator | Auto-generate RTI Act 2005 letters for complaints unresolved 30+ days |
| Weekly Civic Summary | Gemini generates weekly admin digest emailed to Commissioner |
| Predictive Analytics | Trend forecasting by ward, category, and season |
| Mobile App | React Native citizen app with push notifications |

---

## 14. Expected Impact

NagarWatch aims to:

- **Improve civic engagement** by making complaint submission accessible and public
- **Increase transparency** through proof-based resolution and public map visibility
- **Reduce duplicate complaints** through geospatial detection (50m radius)
- **Enhance accountability** via SLA enforcement and escalation chains
- **Enable data-driven governance** through ward-level analytics and PDF reports
- **Improve public trust** in local administration

The platform transforms traditional complaint reporting into a transparent, community-driven, and real-time civic governance ecosystem.

---

## 15. Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 16. License

MIT License © 2026 [Akshat Kardak](https://github.com/AkshatKardak)
