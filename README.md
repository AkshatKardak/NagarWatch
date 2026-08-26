# 🏙️ NagarWatch — Real-Time Civic Issue Reporting & Governance Platform

<p align="center">
  <img src="client/public/Navbar.png" alt="NagarWatch Platform" width="100%" />
</p>

> NagarWatch is a full-stack civic governance platform bridging the gap between citizens and local authorities across Indian municipalities.

[![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-blue?logo=react)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express)](https://expressjs.com)
[![Clerk](https://img.shields.io/badge/Clerk-purple?logo=clerk)](https://clerk.com)
[![Gemini](https://img.shields.io/badge/Gemini-orange?logo=google)](https://ai.google.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-red?logo=redis)](https://redis.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

---

## Problem Statement

Urban cities frequently face unresolved civic issues — potholes, garbage accumulation, water leakages, and broken streetlights. Current complaint systems suffer from:

- **Fragmented Channels:** Complaints scattered across helplines, WhatsApp groups, and broken portals with no centralized record.
- **Zero Visibility:** Lack of real-time progress updates or tracking for citizens after grievance submission.
- **Redundant Reports:** Frequent duplicate complaints for the exact same physical issue crowding municipal queues.
- **Inefficient Triage:** Lack of automated priority ranking and intelligent department routing for authorities.
- **No SLA Enforcement:** Absence of strict Citizens' Charter SLA accountability, resulting in indefinitely pending grievances.
- **Unverified Repairs:** Substandard repairs marked resolved without objective citizen-side verification.
- **Untracked Contractors:** Lack of performance benchmarks and blacklist enforcement for municipal contractors.

---

## Proposed Solution

NagarWatch provides a centralized, transparent civic operating system where:

- **Citizens** report, upvote, and track grievances in real time with multilingual (English, Hindi, Marathi) and voice input capabilities.
- **Authorities** manage workflows, dispatch work orders to enlisted contractors, and upload photographic proof of resolution.
- **Citizens Verify Resolutions** by reviewing Before vs After photo proofs to confirm resolution or reopen substandard work with recorded reasons.
- **Administrators** monitor city-wide performance, explainable Ward Health scores, and Central Public Works Department (CPWD) contractor verification queues.
- **Gemini AI** auto-categorizes complaints, assesses severity, drafts legally formatted RTI Act 2005 petitions, and compiles weekly executive summaries.
- **Socket.IO** delivers instant real-time synchronization across map viewers, field officers, and citizen dashboards.

---

## Tech Stack

- **Frontend:** Next.js, TypeScript, React, Tailwind CSS
- **Backend:** Node.js, Express.js, TypeScript
- **Authentication:** Clerk
- **AI Assistant:** Gemini
- **Database:** MongoDB, Redis

---

## User Roles & Access Guide

NagarWatch features role-based access control (RBAC).

### 1. Citizen (`citizen`)
- **How to Access:** Select **Citizen** during sign-up or sign-in.
- **Available Routes:**
  - `/citizen/dashboard`
  - `/citizen/submit`
  - `/citizen/complaints`
  - `/citizen/profile` (or `/profile`)
  - `/citizen/rti`
  - `/notifications`
  - `/map`

### 2. Authority / Municipal Officer (`authority`)
- **How to Access:** Select **Municipal Authority** during sign-up.
- **Available Routes:**
  - `/authority/dashboard`
  - `/authority/complaints`
  - `/authority/analytics`
  - `/authority/profile` (or `/profile`)

### 3. Contractor (`contractor`)
- **How to Access:** Select **Contractor** during sign-up or register with CPWD enlistment number.
- **Available Routes:**
  - `/contractor/dashboard`
  - `/contractor/tasks`
  - `/contractor/profile` (or `/profile`)

### 4. Admin (`admin`)
- **How to Access:**
  - Admin access is protected and not open for self-registration.
  - Option A (Development / Demo): Click **Demo Admin Access** on `/sign-in` or use the quick role switcher in `/profile`.
  - Option B (Production): In MongoDB, set `role: "admin"` for the user document in the `users` collection, or set `"role": "admin"` in Clerk Dashboard under user `publicMetadata`.
- **Available Routes:**
  - `/admin/dashboard`
  - `/admin/users`
  - `/admin/wards`
  - `/admin/contractors`
  - `/admin/weekly-summary`

---

## Unique Features

- **National India Map Boundary & Heatmap:** Interactive Leaflet map strictly bounded to the Republic of India with real-time geospatial points and density intensity heatmap view.
- **Official CPWD Government Contractor Integration:** Seeded and integrated with the official Central Public Works Department (CPWD) enlisted contractor dataset, blacklist checks, and verification workflow.
- **Explainable Ward Health Scoring:** Transparent composite health index (0–100) calculated deterministically from resolution rates, SLA compliance, resolution speed, and citizen reopening ratios.
- **Citizen Resolution Verification Lifecycle:** Before/After resolution photo proof verification where citizens confirm or reopen grievances with mandatory reason logging.
- **Deterministic Contractor Performance Engine:** Weighted reliability scorecards based on on-time completion rates, SLA breach counts, and citizen verification rates.
- **Multi-Language Grievance Submission:** Support for English, Hindi, and Marathi with automatic translation fallback.
- **Voice Complaint Recording:** In-browser microphone speech-to-text recording with editable live transcripts.
- **Gemini AI Complaint Assistant:** Automated categorization, severity estimation, department routing, and executive summary generation with deterministic keyword rule fallbacks.

---

## Key Features

- **Geospatial Duplicate Prevention:** Automatically checks for existing complaints within a 50-meter radius using MongoDB `$geoNear` to prevent redundant submissions.
- **Community Upvoting:** Citizens upvote local issues to increase grievance priority scores.
- **Real-Time WebSockets:** Real-time updates for complaint submissions, status changes, assignments, and verifications via Socket.IO.
- **Automated SLA Timers & Escalations:** SLA tracking per category with background jobs and email notifications.
- **Legal RTI 2005 Generator:** Generates formatted Section 6(1) Right to Information (RTI) petitions for delayed municipal grievances.
- **Notifications Center:** Centralized notification center with unread filtering and milestone alerts.

---

## Project Structure

```
NagarWatch/
├── client/                                 # Next.js Frontend
│   ├── public/                             # Static assets and icons
│   │   ├── Navbar.png                      # Brand header banner
│   │   └── favicon.png
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Landing page with hero stats bar
│       │   ├── (dashboard)/
│       │   │   ├── admin/                  # Admin dashboard, users, wards, contractors
│       │   │   │   └── contractors/        # CPWD verification queue & blacklist
│       │   │   ├── authority/              # Authority dashboard, complaints, analytics
│       │   │   ├── citizen/                # Citizen dashboard, complaints, submit, RTI
│       │   │   ├── contractor/             # Contractor dashboard, performance, tasks
│       │   │   ├── notifications/          # Canonical notifications center
│       │   │   └── profile/                # Universal profile & role manager
│       │   ├── (public)/
│       │   │   ├── complaints/[id]/        # Detail view & Citizen Verification Card
│       │   │   └── map/                    # Bounded India map & Heatmap view
│       │   ├── sign-in/                    # Sign-in page with Demo Admin access
│       │   └── sign-up/                    # Sign-up page with role selection
│       ├── components/
│       │   ├── analytics/
│       │   │   └── WardHealthOverview.tsx  # Explainable Ward Health scorecard
│       │   ├── complaints/
│       │   │   ├── CitizenVerificationCard.tsx  # Before vs After photo verification
│       │   │   └── ComplaintForm.tsx       # Multilingual + voice input form
│       │   ├── layout/                     # Navbar, Sidebar, Footer
│       │   └── map/
│       │       ├── CivicMap.tsx            # India-bounded map & Heatmap layer
│       │       ├── indiaBoundary.json      # Official India boundary GeoJSON
│       │       └── MapPicker.tsx           # Coordinate picker
│       ├── lib/
│       │   ├── api.ts                      # Axios API client methods
│       │   └── socket.ts                   # Socket.IO client
│       └── types/                          # TypeScript definitions
│
└── server/                                 # Node.js Express Backend
    └── src/
        ├── config/
        │   ├── cloudinary.ts               # Cloudinary media storage
        │   ├── db.ts                       # MongoDB connection
        │   ├── redis.ts                    # Redis cache & BullMQ TCP client
        │   └── socket.ts                   # Socket.IO server configuration
        ├── middleware/
        │   ├── auth.ts                     # Clerk auth & RBAC middleware
        │   ├── errorHandler.ts             # Centralized error handler
        │   └── upload.ts                   # Multer image/audio upload middleware
        ├── models/
        │   ├── BlacklistedContractor.ts    # Debarred contractor registry
        │   ├── Complaint.ts                # Complaint schema with verification fields
        │   ├── Contractor.ts               # CPWD contractor schema & performance
        │   ├── Notification.ts             # Notification schema
        │   ├── User.ts                     # User & role schema
        │   └── Ward.ts                     # Ward boundaries & health
        ├── routes/
        │   ├── ai.ts                       # AI assistant, translation, transcription
        │   ├── analytics.ts                # Heatmap, Ward Health, Contractor scores
        │   ├── complaints.ts               # Resolution proof, verify, reopen APIs
        │   ├── contractors.ts              # CPWD verification, blacklist, registration
        │   ├── users.ts                    # Profile, sync, role assignment
        │   └── wards.ts                    # Ward governance APIs
        ├── seeds/
        │   ├── cpwdContractors.seed.ts     # CPWD 30-contractor dataset seeder
        │   └── cpwdDebarredContractors.seed.ts # CPWD debarred contractor seeder
        └── services/
            ├── ai/
            │   └── gemini.service.ts       # Gemini AI assistant + rule fallback
            ├── analytics/
            │   ├── contractorPerformance.service.ts # Performance scoring
            │   ├── heatmap.service.ts      # Heatmap point aggregation
            │   └── wardHealth.service.ts   # Ward Health scoring formula
            ├── complaints/
            │   └── verification.service.ts # Citizen resolution lifecycle
            ├── priority/
            │   └── priority.service.ts     # Priority calculation engine
            ├── transcription/
            │   └── sarvamSpeech.service.ts # Speech-to-Text transcription
            ├── translation/
            │   └── sarvamTranslation.service.ts # Multilingual translation
            └── contractorVerification.service.ts # CPWD dataset verification
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB database
- Redis instance (Upstash or local)
- Clerk account
- Google AI Studio key (Gemini)
- Sarvam AI key (Optional, for Indian language translation and speech)
- Cloudinary account (Media storage)

### Installation

```bash
git clone https://github.com/AkshatKardak/NagarWatch.git
cd NagarWatch

# Install dependencies
cd server && npm install
cd ../client && npm install
```

### Environment Setup

1. Copy `.env.example` to `server/.env` and fill in credentials:
```bash
cp server/.env.example server/.env
```

2. Copy `.env.local.example` to `client/.env.local` and fill in credentials:
```bash
cp client/.env.local.example client/.env.local
```

### Running Locally

```bash
# Run server
cd server && npm run dev

# Run client
cd client && npm run dev
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License © 2026 [Akshat Kardak](https://github.com/AkshatKardak)
