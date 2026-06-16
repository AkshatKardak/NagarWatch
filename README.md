# 🏙️ NagarWatch — Civic Issue Reporting & Tracking Platform

> A full-stack civic tech platform that enables citizens to report, track, and upvote local infrastructure issues — while giving municipal authorities a real-time dashboard to manage, prioritize, and resolve them with SLA enforcement.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Role System](#-role-system)
- [Route Architecture & Fixes](#-route-architecture--fixes)
- [Key Features](#-key-features)
- [Data Models](#-data-models)
- [Color Design System](#-color-design-system)
- [Issues Encountered & Solutions](#-issues-encountered--solutions)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)

---

## 🌐 Overview

NagarWatch is a civic issue management system built for Indian municipalities. Citizens can photograph and report problems like potholes, garbage, broken streetlights, and drainage failures. Each complaint is automatically scored by priority, assigned an SLA deadline, and routed to the relevant ward authority. Authorities receive a real-time queue to triage, act on, and resolve issues — with proof-of-resolution photo uploads required before closing a ticket.

---

## 🛠 Tech Stack

### Frontend (`/client`)
| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.7 (App Router + Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Clerk (JWT-based, role metadata) |
| State | Zustand |
| Real-time | Socket.IO client |
| Maps | Leaflet (via react-leaflet, dynamic import) |
| HTTP Client | Axios |

### Backend (`/server`)
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Language | TypeScript |
| Database | MongoDB (Mongoose ODM) |
| Auth | Clerk Express SDK |
| Real-time | Socket.IO |
| Job Queue | BullMQ (Redis-backed) |
| Cache | ioredis |
| File Upload | Multer + Cloudinary |
| Email | Nodemailer |
| Security | Helmet, CORS |

---

## 🏛 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / CLIENT                         │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │  Public UI   │   │ Citizen UI   │   │  Authority/Admin  │   │
│  │  /complaints │   │ /citizen/... │   │  /authority/...   │   │
│  │  /map        │   │ /dashboard   │   │  /admin-dashboard │   │
│  └─────────────┘   └──────────────┘   └───────────────────┘   │
│         │                  │                    │               │
│         └──────────────────┼────────────────────┘               │
│                            │                                     │
│              Next.js App Router (Route Groups)                   │
│              ClerkProvider → AppProviders → Zustand             │
└────────────────────────────┼────────────────────────────────────┘
                             │ REST API + Socket.IO
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Routes  │  │ Middleware│  │ Services │  │    Socket    │  │
│  │/complaints│  │Clerk Auth│  │ Priority │  │  Real-time   │  │
│  │/users    │  │ Helmet   │  │ SLA Calc │  │  Notifications│  │
│  │/admin    │  │ CORS     │  │ Cloudinary│  └──────────────┘  │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                 │
│  ┌───────────────┐        ┌──────────────────────────────┐    │
│  │  BullMQ Jobs  │        │         MongoDB               │    │
│  │  SLA Check    │        │  Complaints, Users,           │    │
│  │  Escalation   │        │  Wards, Notifications         │    │
│  │  Email Queue  │        └──────────────────────────────┘    │
│  └───────────────┘                                             │
│          │                ┌──────────────────────────────┐    │
│          └──────────────► │   Redis (BullMQ + ioredis)   │    │
│                           └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         Cloudinary       Clerk         Nodemailer
        (Images)       (Auth/Roles)     (Emails)
```

---

## 📁 Project Structure

```
NagarWatch/
├── client/                          # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── (admin)/             # Route group — admin only
│       │   │   └── admin/
│       │   │       └── admin-dashboard/page.tsx
│       │   ├── (authority)/         # Route group — authority role
│       │   │   └── authority/
│       │   │       ├── authority-dashboard/page.tsx
│       │   │       └── complaints/
│       │   │           ├── page.tsx          # /authority/complaints
│       │   │           └── [id]/page.tsx     # /authority/complaints/:id
│       │   ├── (citizen)/           # Route group — citizen role
│       │   │   ├── dashboard/page.tsx        # /dashboard
│       │   │   ├── submit/page.tsx           # /submit
│       │   │   └── citizen/
│       │   │       └── complaints/page.tsx   # /citizen/complaints
│       │   ├── (public)/            # Route group — no auth required
│       │   │   ├── complaints/
│       │   │   │   ├── page.tsx              # /complaints (public feed)
│       │   │   │   └── [id]/page.tsx         # /complaints/:id
│       │   │   └── map/page.tsx             # /map
│       │   ├── sign-in/             # Clerk sign-in
│       │   ├── sign-up/             # Clerk sign-up
│       │   ├── unauthorized/        # 403 page
│       │   ├── layout.tsx           # Root layout
│       │   ├── page.tsx             # Landing page
│       │   └── globals.css          # Brand token CSS variables
│       ├── components/
│       │   ├── complaints/          # StatusTimeline, SLATimer
│       │   ├── map/                 # CivicMap (Leaflet)
│       │   ├── providers/           # AppProviders.tsx
│       │   └── ui/                  # shadcn components
│       ├── hooks/
│       │   ├── useAuthToken.ts      # Syncs Clerk JWT → Axios headers
│       │   └── useSocket.ts         # Socket.IO connection
│       ├── lib/
│       │   ├── api.ts               # Axios instance + API methods
│       │   └── utils.ts             # Formatters, color helpers
│       ├── store/
│       │   ├── complaintStore.ts    # Zustand complaint state
│       │   └── userStore.ts         # Zustand user state
│       └── types/
│           └── complaint.ts         # TypeScript interfaces
│
└── server/                          # Express backend
    └── src/
        ├── config/                  # DB, Redis, Cloudinary config
        ├── jobs/                    # BullMQ: SLA checker, escalation
        ├── middleware/              # Clerk auth, role guards
        ├── models/
        │   ├── Complaint.ts         # Core complaint schema
        │   ├── User.ts              # User profile schema
        │   ├── Ward.ts              # Ward/district schema
        │   └── Notification.ts     # Notification schema
        ├── routes/                  # Express route handlers
        ├── services/                # Business logic (priority, SLA)
        ├── socket/                  # Socket.IO event handlers
        └── index.ts                 # Server entry point
```

---

## 👥 Role System

NagarWatch uses **Clerk's `publicMetadata.role`** to gate routes and UI. Three roles exist:

| Role | Access | Dashboard Route |
|---|---|---|
| `citizen` | Submit & track own complaints | `/dashboard` |
| `authority` | View all complaints, update status, resolve | `/authority/authority-dashboard` |
| `admin` | Full system management | `/admin/admin-dashboard` |

Each route group has its own `layout.tsx` that reads the Clerk role and redirects unauthorized users to `/unauthorized`.

---

## 🗺 Route Architecture & Fixes

### The Problem — Parallel Page Path Collisions

Next.js App Router **route groups** (folders wrapped in parentheses like `(citizen)`) are **invisible to the URL**. This means:

```
(authority)/complaints/page.tsx  →  URL: /complaints
(citizen)/complaints/page.tsx    →  URL: /complaints   ← COLLISION!
(public)/complaints/page.tsx     →  URL: /complaints   ← COLLISION!
```

This caused a fatal build error:
```
You cannot have two parallel pages that resolve to the same path.
Please check /(authority)/complaints and /(citizen).
```

### The Solution — Role-Prefixed URL Segments

Route groups are just for layout/middleware grouping — they don't affect URLs. The fix was to nest each role-specific page under a real URL-visible folder inside the group:

| Before (Colliding) | After (Fixed) | Final URL |
|---|---|---|
| `(authority)/complaints/page.tsx` | `(authority)/authority/complaints/page.tsx` | `/authority/complaints` |
| `(authority)/complaints/[id]/page.tsx` | `(authority)/authority/complaints/[id]/page.tsx` | `/authority/complaints/:id` |
| `(citizen)/complaints/page.tsx` | `(citizen)/citizen/complaints/page.tsx` | `/citizen/complaints` |
| `(public)/complaints/page.tsx` | ✅ unchanged | `/complaints` (public feed) |
| `(public)/complaints/[id]/page.tsx` | ✅ unchanged | `/complaints/:id` |
| `(admin)/dashboard/page.tsx` | `(admin)/admin/admin-dashboard/page.tsx` | `/admin/admin-dashboard` |
| `(authority)/dashboard/page.tsx` | `(authority)/authority/authority-dashboard/page.tsx` | `/authority/authority-dashboard` |

**Rule of thumb:** Route groups `(name)` are for sharing layouts, not for creating URLs. Any page that needs a unique URL must live inside a real folder.

---

## ✨ Key Features

### For Citizens
- 📸 **Report issues** with photo proof, GPS location, and category
- 📊 **Track complaint history** with real-time status updates
- 👍 **Upvote** other citizens' issues to boost priority
- ⏱️ **SLA countdown** showing time left before deadline breach
- 🔔 **Real-time notifications** via Socket.IO

### For Authorities
- 📋 **Complaint Queue** with filters by status, category, priority, and sort by SLA deadline
- ⚡ **Priority scoring** — auto-calculated based on category severity, upvote count, SLA age
- 🔄 **Status management** — mark as In Progress with action notes
- ✅ **Resolve with proof** — upload after-photo before closing a ticket
- 🚨 **Escalation alerts** — overdue tickets flagged with escalation level

### System
- 🗺️ **Public map** showing all active civic issues with clustering
- 🔐 **Role-based access control** via Clerk metadata
- 📧 **Email notifications** via Nodemailer for status changes
- ⚙️ **BullMQ background jobs** for SLA checking and automatic escalation
- ☁️ **Cloudinary** for before/after image storage

---

## 🗄 Data Models

### Complaint
```typescript
{
  title: string
  description: string
  category: 'pothole' | 'garbage' | 'water' | 'streetlight' | 'road' | 'drainage' | 'other'
  status: 'pending' | 'in_progress' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'critical'
  priorityScore: number          // Auto-calculated
  upvoteCount: number
  location: { address, coordinates: [lng, lat] }
  images: { before: string, after?: string }
  submittedBy: User ref
  assignedTo: User ref
  ward: Ward ref
  sla: {
    deadline: Date
    breached: boolean
    escalationLevel: number
    escalationLog: [{ reason, escalatedAt }]
  }
  statusHistory: [{ status, note, changedAt, changedBy }]
  resolutionNote: string
  resolvedAt: Date
}
```

### User
```typescript
{
  clerkId: string      // Links to Clerk auth
  email: string
  name: string
  role: 'citizen' | 'authority' | 'admin'
}
```

### Ward
```typescript
{
  name: string
  city: string
  boundaries: GeoJSON
  assignedAuthority: User ref
}
```

---

## 🎨 Color Design System

All colors are defined as CSS custom properties in `client/src/app/globals.css` using the `oklch` color space (required by Tailwind CSS v4 + shadcn).

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| Background | `--background` | `#F8F6F1` | Page background (warm off-white) |
| Card | `--card` | `#FFFFFF` | Card surfaces |
| Primary | `--primary` | `#D95D0F` | Buttons, links, active states |
| Primary Hover | `--primary-hover` | `#B94E0C` | Button hover |
| Accent Green | `--accent-green` | `#2E6A42` | Success, resolved states |
| Primary Text | `--foreground` | `#1F2937` | Body copy |
| Secondary Text | `--muted-foreground` | `#4B5563` | Subtitles, hints |
| Border | `--border` | `#ECE7DE` | Dividers, input borders |
| Pending | `--status-pending` | `#DC2626` | Red status badge |
| In Progress | `--status-in-progress` | `#F59E0B` | Amber status badge |
| Resolved | `--status-resolved` | `#16A34A` | Green status badge |
| Water | `--status-water` | `#2563EB` | Blue category badge |

Utility classes are also available: `.status-pending`, `.status-in-progress`, `.status-resolved`, `.status-water`

---

## 🐛 Issues Encountered & Solutions

### 1. Next.js Parallel Page Path Collisions
**Error:**
```
You cannot have two parallel pages that resolve to the same path.
Check /(authority)/complaints and /(citizen).
```
**Root Cause:** Multiple route groups (`(authority)`, `(citizen)`, `(public)`) all had a `complaints/page.tsx` — route groups are URL-transparent so all resolved to `/complaints`.

**Fix:** Moved role-specific pages inside real URL-visible subdirectories:
- `(authority)/authority/complaints/page.tsx` → `/authority/complaints`
- `(citizen)/citizen/complaints/page.tsx` → `/citizen/complaints`
- `(public)/complaints/page.tsx` left as-is → `/complaints`

---

### 2. `AppProviders` Undefined at Runtime
**Error:**
```
Element type is invalid: expected a string or class/function but got: undefined.
Check the render method of RootLayout.
```
**Root Cause:** `AppProviders.tsx` uses `export default function AppProviders` (default export), but `layout.tsx` was importing it as a named import `{ AppProviders }`.

**Fix:** Changed the import in `layout.tsx`:
```diff
- import { AppProviders } from "@/components/providers/AppProviders"
+ import AppProviders from "@/components/providers/AppProviders"
```

**Rule:** Named imports `{ X }` only work with `export const X` or `export function X`. For `export default`, always import without curly braces.

---

### 3. Duplicate `dashboard/page.tsx` in Admin & Authority Groups
**Problem:** Both `(admin)/dashboard/page.tsx` and `(authority)/dashboard/page.tsx` existed alongside new dedicated dashboard pages, causing redundant files and confusion.

**Fix:** Deleted the old generic dashboard files. Role-specific dashboards now live at:
- `/admin/admin-dashboard` — Admin panel
- `/authority/authority-dashboard` — Authority panel

---

### 4. Multiple `package-lock.json` Files
**Warning:**
```
Next.js inferred your workspace root, but it may not be correct.
Detected multiple lockfiles.
```
**Root Cause:** Both the repo root and `client/` had `package-lock.json` files.

**Fix:** Set `turbopack.root` in `next.config.ts` or remove the root-level lockfile if it's not needed by a workspace manager.

---

### 5. Deprecated `middleware.ts` Convention
**Warning:**
```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```
**Fix:** Rename `middleware.ts` → `proxy.ts` in the `client/src/app/` directory per Next.js 16 changes.

---

## 🔐 Environment Variables

### Client (`client/.env.local`)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nagarwatch
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Clerk account
- Cloudinary account

### 1. Clone the repo
```bash
git clone https://github.com/AkshatKardak/NagarWatch.git
cd NagarWatch
```

### 2. Start the backend
```bash
cd server
npm install
cp .env.example .env     # fill in your values
npm run dev
# Server runs on http://localhost:5000
```

### 3. Start the frontend
```bash
cd client
npm install
cp .env.example .env.local    # fill in your values
npm run dev
# App runs on http://localhost:3000
```

### 4. Seed ward data (optional)
```bash
cd server
npm run seed:wards
```

---

## 📄 License

MIT © [AkshatKardak](https://github.com/AkshatKardak)
