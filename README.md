

# Click Opticx ISP Management Platform
### v9.6.3-LIVE · Full-Stack ISP Operating System

[![Live](https://img.shields.io/badge/Live-isp--click--opticx.web.app-blue?style=for-the-badge)](https://isp-click-opticx.web.app/)
[![Backend](https://img.shields.io/badge/API-Render-green?style=for-the-badge)](https://click-opticx-isp-app-live.onrender.com)
[![DB](https://img.shields.io/badge/Database-Supabase-teal?style=for-the-badge)](https://supabase.com)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live URLs](#-live-urls)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Authentication & Security](#-authentication--security)
6. [Onboarding Flow](#-onboarding-flow)
7. [Admin Dashboard Portal](#-admin-dashboard-portal)
8. [Subscriber (User) Portal](#-subscriber-user-portal)
9. [PWA App](#-pwa-app)
10. [Database Schema](#-database-schema)
11. [Backend API Routes](#-backend-api-routes)
12. [Backend Services](#-backend-services)
13. [CI/CD & Deployment](#-cicd--deployment)
14. [Local Development](#-local-development)
15. [Environment Variables](#-environment-variables)

---

## 🌐 Project Overview

**Click Opticx** is a full-stack ISP (Internet Service Provider) operating system built to manage every aspect of a regional ISP — subscribers, billing, network hardware, communications, AI support, and more. It ships as two apps in one codebase:

- **Admin Portal** — Multi-role management dashboard for ISP staff
- **Subscriber Portal** — Mobile-first PWA for end customers

---

## 🔗 Live URLs

| Service | URL |
|---|---|
| **Frontend (Live)** | https://isp-click-opticx.web.app/ |
| **Firebase Hosting Alt** | https://click-opticx.firebaseapp.com/ |
| **Backend API** | https://click-opticx-isp-app-live.onrender.com |
| **Health Check** | https://click-opticx-isp-app-live.onrender.com/api/health |

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 6 |
| Language | TypeScript 5.8 |
| Routing | React Router v6 |
| State | Zustand + React Query v5 |
| UI/Icons | Lucide React + Recharts |
| Auth | Supabase JS SDK |
| Realtime | Socket.io Client |
| Styling | Vanilla CSS + Tailwind CDN |
| Font | Inter (Google Fonts) |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 |
| Language | TypeScript (tsx) |
| Database | Supabase PostgreSQL |
| Cloud Sync | Firebase Firestore |
| Cache | Upstash Redis + BullMQ |
| Network | mikronode (RouterOS), net-snmp, ssh2, telnet-client |
| Email | Resend + Nodemailer (Gmail SMTP fallback) |
| Storage | Cloudinary + Supabase Storage |
| Payments | Stripe |
| Push | web-push (VAPID) |
| AI | @google/genai (Gemini) |
| Logging | Winston |

### Infrastructure
| Layer | Technology |
|---|---|
| Frontend Hosting | Firebase Hosting (ap-click-opticx) |
| Backend Hosting | Render (Web Service) |
| Database | Supabase (PostgreSQL + Realtime) |
| Media CDN | Cloudinary |

---

## 📁 Project Structure

```
click-opticx-isp-app-live/
├── App.tsx                     # Root router, auth guard, layout selector
├── SubscriberApp.tsx           # Subscriber portal router
├── Sidebar.tsx                 # Admin sidebar navigation
├── db.ts                       # Client-side DB class (Firebase + Supabase sync)
├── types.ts                    # All TypeScript interfaces & enums
├── index.tsx                   # React entry point
├── index.html                  # PWA shell (manifest, SW registration)
│
├── pages/                      # All page-level components
│   ├── admin/                  # Admin sub-pages
│   │   ├── SystemDiagnostic.tsx
│   │   ├── NotificationControl.tsx
│   │   ├── NotificationAnalytics.tsx
│   │   └── AdminUserDevices.tsx
│   ├── comm/                   # Communication pages
│   │   └── EmailControlCenter.tsx
│   ├── gateways/               # Payment gateway config pages
│   │   ├── StripeSettings.tsx
│   │   ├── JazzCashSettings.tsx
│   │   ├── EasyPaisaSettings.tsx
│   │   └── ...others
│   ├── v2/                     # Next-gen UI pages (V2)
│   │   ├── DashboardV2.tsx
│   │   ├── UserManagementV2.tsx
│   │   ├── FiscalHubV2.tsx
│   │   ├── NetworkPlaneV2.tsx
│   │   ├── CommCenterV2.tsx
│   │   └── AIAutomationV2.tsx
│   └── [73 pages total]
│
├── components/
│   ├── PWAPrompt.tsx           # Install-to-homescreen prompt
│   ├── Header.tsx              # Admin top bar
│   ├── Sidebar.tsx             # Admin nav sidebar
│   ├── AIAgentWidget.tsx       # Floating AI assistant
│   ├── EmailComposer.tsx       # Unified email composer
│   ├── admin/                  # Admin-specific widgets
│   ├── subscriber/             # All subscriber UI components (51 files)
│   ├── shared/                 # Modal, Toast, etc.
│   └── ui/                     # Primitives
│
├── backend/
│   ├── server.ts               # Express app entry
│   ├── routes/                 # 31 route files
│   ├── controllers/            # Request handlers
│   ├── services/               # 25 business logic services
│   ├── middleware/             # Auth, rate-limit, etc.
│   ├── jobs/                   # BullMQ background jobs
│   ├── socket/                 # Socket.io handlers
│   ├── models/                 # DB model definitions
│   ├── migrations/             # DB migration scripts
│   ├── supabase_schema.sql     # Full Supabase schema
│   ├── supabase_rls_policies.sql # Row Level Security
│   └── Dockerfile
│
├── lib/
│   ├── supabase.ts             # Supabase client + redirect URL
│   ├── roleRouter.ts           # Role-based route access control
│   ├── db-adapter.ts           # Dual-write adapter (Firebase → Supabase)
│   └── integrityCheck.ts       # Crash detection & recovery
│
├── hooks/                      # Custom React hooks
├── store/ & stores/            # Zustand stores
├── layouts/                    # SubscriberLayout, V3Layout, AdminLayoutWrapper
├── public/                     # Static assets, manifest.json, sw.js
├── supabase/                   # Supabase edge function configs
├── firebase.json               # Firebase Hosting config
├── render.yaml                 # Render deployment config
└── vite.config.ts              # Vite build config
```

---

## 🔐 Authentication & Security

### Auth Flow
1. User navigates to `/auth/login` or `/auth/signup`
2. Credentials submitted to **Supabase Auth** (`signInWithPassword` / `signUp`)
3. On success, JWT session stored in `localStorage` + `sessionStorage`
4. Role fetched from `public.users` table → determines which portal to render
5. `BroadcastChannel` syncs logout across all open browser tabs

### Auth Methods Supported
- **Email + Password** (primary)
- **OTP Email Verification** (Resend API → Gmail SMTP fallback)
- **Magic Link** (Supabase native)
- **Password Reset** via `SUPABASE_REDIRECT_URL`

### Role-Based Access Control (RBAC)
| Role | Access Level |
|---|---|
| `Super Admin` | Full system access |
| `Admin` | Most admin pages |
| `Finance Admin` | Billing, invoices, gateways |
| `Network Admin` | NAS, OLT, RouterOS, live monitoring |
| `Support Admin` | Tickets, user management, KYC |
| `Support Executive` | Password requests, basic support |
| `Recovery Manager` | Recovery dashboard, ledger |
| `Business Admin` | Business settings, comms |
| `Accountant` | Accounting ledger, invoices |
| `Cashier` | Payment collection |
| `Field Agent` | Connection setup |
| `Manager` | Tasks, users (read) |
| `Dealer` | Reseller management |
| `Customer` / `Subscriber` | Subscriber portal only |

### Security Features
- Helmet.js HTTP headers on backend
- `express-rate-limit` on all public endpoints
- Row Level Security (RLS) on Supabase tables
- Supabase JWT validation on backend routes
- Audit logs for every admin action (`audit_logs` table)
- Security logs for sensitive operations (`security_logs` table)
- Session purge on logout (localStorage + caches + ServiceWorker)
- Multi-tab logout via BroadcastChannel

---

## 🚀 Onboarding Flow

### New Subscriber Registration
```
User fills Signup form (/auth/signup)
      ↓
POST /api/auth/signup (backend)
      ↓
Supabase Auth.signUp() → creates auth.users entry
      ↓
OTP verification email sent via Resend API
  (Gmail SMTP fallback if Resend fails)
      ↓
User verifies at /verify-email
      ↓
Record created in public.users table
      ↓
KYC prompt shown (SmartKYCPopup)
  → User uploads CNIC + selfie
  → Files stored to Cloudinary/Supabase Storage
  → kyc_requests + kyc_files records created
      ↓
Admin reviews KYC at /kyc-hub
      ↓
Admin approves → user.status = 'Active'
      ↓
Subscriber portal unlocked
```

### Admin-Created Subscriber
```
Admin navigates to /users → "Add User"
      ↓
User record created in Supabase public.users
      ↓
Welcome email sent automatically
      ↓
Admin assigns package at /connection-setup
      ↓
MikroTik/RouterOS provisioned via mikrotikService
```

---

## 🖥️ Admin Dashboard Portal

Full multi-role admin interface accessible at the root URL for authenticated staff.

### Core Admin Pages

| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | KPIs, revenue charts, user stats, activity feed |
| `/users` | User Management | Full CRUD for subscribers, bulk import, search |
| `/customer-360` | Customer 360 | Deep dive into individual subscriber profiles |
| `/packages` | Packages | Create/edit internet plans & pricing |
| `/approval-desk` | Approval Desk | Centralized pending requests hub |
| `/kyc-hub` | KYC Management | Review & approve identity documents |
| `/governance` | Governance Desk | Staff & permissions management |
| `/staff` | → redirects to Governance | — |
| `/admin-profile` | Admin Profile | Staff profile & settings |

### Billing & Finance

| Route | Page | Description |
|---|---|---|
| `/invoice-engine` | Invoice Generator | Create & send invoices with PDF export |
| `/invoice-management` | Invoice Management | View all invoices, mark paid |
| `/accounting` | Accounting Ledger | Full ledger with debit/credit entries |
| `/wallet` | Wallet Management | Subscriber wallet top-ups |
| `/emergency-load` | Emergency Credits | Manage emergency data requests |
| `/recovery` | Recovery | Collections, overdue accounts |
| `/recovery-dashboard` | Recovery Dashboard | Recovery analytics |
| `/fiscal-monitor` | Finance Dashboard | Revenue analytics |
| `/gateway-settings` | Payment Gateways | Configure payment methods |
| `/gateway-stripe` | Stripe Settings | — |
| `/gateway-jazzcash` | JazzCash Settings | — |
| `/gateway-easypaisa` | EasyPaisa Settings | — |
| `/gateway-paypal` | PayPal Settings | — |
| `/gateway-cash` | Cash Settings | — |
| `/gateway-bank` | Bank Transfer Settings | — |
| `/gateway-home` | Field Collection Settings | — |

### Network & Infrastructure

| Route | Page | Description |
|---|---|---|
| `/nas-management` | NAS Management | RADIUS NAS device management |
| `/olt-management` | OLT Management | Fiber OLT device & ONU management |
| `/noc-dashboard` | NOC Dashboard | Network Operations Center |
| `/admin-live-monitoring` | Live Monitoring | Real-time bandwidth & signal |
| `/connection-setup` | Connection Setup | Provision subscriber connections |
| `/admin-device-mapping` | Device Mapping | Link devices to subscribers |
| `/hotspot-tokens` | Hotspot Manager | WiFi hotspot token generation |
| `/speed-test` | Speed Test | Admin-side speed diagnostics |
| `/inventory-management` | Inventory | Hardware stock tracking |

### Communications

| Route | Page | Description |
|---|---|---|
| `/comm-center` | Unified Communication | Email campaigns, push, segments |
| `/comm/email` | Email Control Center | Email builder & delivery logs |
| `/admin-reminders` | Admin Reminders | Scheduled billing reminders |
| `/notification-control` | Notification Control | Push notification management |

### AI Control Plane

| Route | Page | Description |
|---|---|---|
| `/ai-control` | AI Control Plane | AI module config & kill switch |
| `/ai-central` | AI Central Dashboard | AI event monitoring |
| `/ai-calling` | AI Calling Admin | Voice agent configuration |
| `/ai-call-logs` | AI Call Logs | Voice call history |

### System & Settings

| Route | Page | Description |
|---|---|---|
| `/business-settings` | Business Settings | Branding, profile, legal, referrals |
| `/user-app` | User App Management | Configure subscriber app pages |
| `/auth-control` | Auth Control Center | Manage verification, OTP toggles |
| `/system-config` | System Config | Provider configurations |
| `/system-readiness` | System Readiness | Pre-flight health checks |
| `/system-flash` | System Flash | Broadcast critical alerts |
| `/system-diagnostic` | System Diagnostic | Live diagnostics panel |
| `/system-deployment` | Deployment Center | Deployment & release manager |
| `/monitor` | Database Monitor | DB health & sync status |
| `/cache` | Cache Management | Redis cache inspection |
| `/cloud-storage` | Multi-Cloud Sync | Firebase ↔ Supabase sync |
| `/migration-dashboard` | Migration Dashboard | Data migration tracker |
| `/import` | Data Import | Bulk CSV/JSON subscriber import |
| `/archive` | Archive | Soft-deleted record management |
| `/archive-records` | Past Records | Historical transaction archive |
| `/tasks` | Task Management | Internal staff task board |
| `/tickets` | Support Tickets | Customer support helpdesk |
| `/reseller-management` | Reseller Management | Dealer/reseller portal |
| `/dealers` | → Reseller Management | — |
| `/about-us` | About Us | Public-facing company info |
| `/super-admin` | Super Admin | Super Admin control panel |

---

## 📱 Subscriber (User) Portal

Isolated, mobile-first portal rendered for `Customer`/`Subscriber` roles via `SubscriberLayout`.

### Portal Sections & Features

| Section | Features |
|---|---|
| **Home Dashboard** | Connection status badge, wallet balance, quick actions, alerts |
| **My Wallet** | Balance, top-up requests, transaction history |
| **Service Plans** | Browse & request package upgrades/downgrades |
| **Billing History** | Invoices list with PDF download |
| **Trust Score** | Credit score display, history, improvement tips |
| **Emergency Credits** | Request emergency data, repayment tracking |
| **Live Usage** | Real-time bandwidth consumption |
| **Speed Test** | Internet speed test (download/upload/ping) |
| **Connected Devices** | View devices connected to their router |
| **Connection Details** | IP, router info, WiFi credentials |
| **Reset WiFi Password** | Self-service WiFi password reset |
| **Support / Help Center** | Submit & track support tickets |
| **AI Chat Assistant** | Gemini-powered chat support |
| **AI Voice Support** | AI voice call agent |
| **Referral Program** | Invite link, points balance, withdrawal |
| **Notifications / Alerts** | System & billing alerts |
| **Announcements / News** | ISP broadcast messages |
| **Weather Widget** | Local weather with forecast |
| **Profile** | Edit profile, change password, KYC status |
| **Legal Center** | Terms, Privacy Policy, Refund Policy |
| **About Provider** | ISP company information |

### Islamic Tools Suite
| Feature | Description |
|---|---|
| **Namaz Times** | Prayer times with Azan alerts |
| **Noble Quran** | Full Quran reader with surah list |
| **Qibla Finder** | Compass-based Qibla direction |
| **Digital Tasbih** | Digital dhikr counter |
| **Zakat Calculator** | Zakat calculation tool |

---

## 📲 PWA App

Click Opticx is a full **Progressive Web App (PWA)**.

### PWA Features
- `manifest.json` configured with app name, icons (192x192, 512x512), theme color `#1570ef`
- **Service Worker** (`/sw.js`) registered on app boot for offline caching
- **Install Prompt** (`PWAPrompt.tsx`) — prompts users to add to home screen on mobile
- **Offline Queue** — max 50 queued actions, retried every 30 seconds on reconnect
- **Cache Busting** — versioned SW (`sw.js?v=9.5.4`), old caches purged on version change
- **Apple Touch Icon** configured for iOS home screen
- **Multi-tab sync** — BroadcastChannel syncs auth state across tabs
- **Background Keep-Alive** — pings backend every 14 minutes to prevent Render sleep

---

## 🗄️ Database Schema

### Supabase Tables (PostgreSQL)

| Table | Purpose |
|---|---|
| `users` | All ISP subscribers with status, KYC, package, balance, credit score |
| `staff` | Internal staff accounts with roles |
| `user_roles` | RBAC role grants (used for RLS) |
| `packages` | Internet service plans |
| `signup_requests` | New user registration queue |
| `kyc_requests` | KYC verification submissions |
| `kyc_files` | KYC document files (CNIC, selfie) |
| `invoices` | Monthly/one-time billing invoices |
| `payments` | Payment collection records |
| `topup_requests` | Wallet top-up requests |
| `emergency_loads` | Emergency credit requests |
| `support_tickets` | Customer support tickets |
| `audit_logs` | Admin action audit trail |
| `security_logs` | High-risk event security log |
| `email_logs` | Email delivery tracking |
| `system_configs` | Key-value system configuration (JSONB) |
| `config_history` | Config change history |
| `sync_audit` | Firebase ↔ Supabase sync health |
| `migration_stats` | Migration batch tracking |

### Firebase Firestore
| Collection | Purpose |
|---|---|
| `registry/master_state` | Primary app state document (packages, settings, comms, AI config) |

### Key `users` Fields
```sql
id, connection_id, name, username, email, phone, password, address, area,
status, verification_status, is_kyc_verified, kyc_status, approval_status,
package_id, balance, credit_score, referral_points, referral_code,
expiry_date, activation_date, connection_type, management_mode,
nas_connection_type, portal_enabled, role, cnic, deleted,
dealer_id, fcm_token, tags, raw_data (JSONB)
```

---

## 🔌 Backend API Routes

| Route Prefix | Module |
|---|---|
| `POST /api/auth/signup` | User registration |
| `POST /api/auth/login` | Login (Supabase) |
| `GET /api/health` | System health check |
| `/api/users` | User CRUD |
| `/api/billing` | Invoices & payments |
| `/api/network` | MikroTik & SNMP network |
| `/api/mikrotik` | RouterOS direct control |
| `/api/nas` | NAS device management |
| `/api/olt` | OLT/ONT fiber management |
| `/api/email` | Email dispatch |
| `/api/email-v2` | Enhanced email with tracking |
| `/api/communication` | Unified comms (push + email) |
| `/api/automation` | Communication automation rules |
| `/api/kyc` | KYC document handling |
| `/api/packages` | Package management |
| `/api/payments` | Payment processing |
| `/api/finance` | Financial reporting |
| `/api/devices` | Device management |
| `/api/hotspot` | Hotspot token management |
| `/api/inventory` | Hardware inventory |
| `/api/speedtest` | Speed test orchestration |
| `/api/config` | System configuration |
| `/api/branding` | Business branding settings |
| `/api/provider-management` | Email/SMS provider management |
| `/api/storage` | File upload (Cloudinary) |
| `/api/cloud` | Cloud sync operations |
| `/api/migration` | Data migration tools |
| `/api/radius` | RADIUS server integration |
| `/api/trash` | Soft-delete management |
| `/api/admin` | Admin utilities |

---

## ⚙️ Backend Services

| Service | Function |
|---|---|
| `oltAdapterFactory.js` | Multi-vendor OLT adapter (VSOL, ZTE, Huawei) |
| `oltTelemetryPoller.js` | Polls OLT devices for ONU signal/status |
| `mikrotikService.js` | RouterOS API connection & provisioning |
| `notificationEngine.js` | Web Push + email notification dispatch |
| `billingService.js` | Invoice generation & auto-billing |
| `billingEngine.ts` | Core billing calculation engine |
| `health-monitor.js` | System health aggregation |
| `EmailTrackingService.js` | Email open/click tracking |
| `redisService.js` | Redis cache operations |
| `cloudinaryService.js` | Image upload & transformation |
| `cryptoService.js` | Data encryption utilities |
| `faultDetectionService.js` | Network fault detection & alerting |
| `smsService.js` | SMS dispatch (multi-provider) |
| `supabaseService.js` | Supabase server-side operations |
| `config-manager.js` | Dynamic config loading from DB |
| `response-mapper.js` | OLT response normalization |
| `googleDriveService.js` | Google Drive backup integration |
| `firebaseService.js` | Firebase Admin operations |
| `liveUsageService.js` | Real-time bandwidth usage |
| `signalMonitorService.js` | ONU signal monitoring |
| `DeviceConnectorService.js` | Multi-protocol device connector |
| `bulkProvisionService.js` | Bulk subscriber provisioning |
| `onuDiscoveryService.js` | Auto ONU discovery on OLT |
| `vsolOnuService.js` | VSOL OLT specific operations |

---

## 🚀 CI/CD & Deployment

### Frontend → Firebase Hosting

```bash
npm install
npm run build          # Vite static export → /dist
npx firebase deploy --only hosting
```

**Firebase Project ID:** `ap-click-opticx`

**GitHub Actions** (manual setup):
1. Add `FIREBASE_TOKEN` to repository secrets
2. Workflow: `npm install` → `npm run build` → `firebase deploy --token $FIREBASE_TOKEN`

### Backend → Render

- Config file: `render.yaml`
- Build command: `npm install`
- Start command: `npm run server` (`tsx backend/server.ts`)
- Auto-deploys on push to `main` branch
- Dockerfile available for container deployments

### Database → Supabase

1. Run `backend/supabase_schema.sql` in Supabase SQL Editor
2. Apply `backend/supabase_rls_policies.sql` for Row Level Security
3. Enable Realtime on: `system_configs`, `audit_logs`, `email_logs`, `users`

---

## 💻 Local Development

```bash
# 1. Clone
git clone https://github.com/HAFIZFARHAN630/Click-Opticx-ISP-APP-LIVE.git
cd Click-Opticx-ISP-APP-LIVE

# 2. Install root dependencies
npm install

# 3. Install backend dependencies
cd backend && npm install && cd ..

# 4. Setup environment variables
cp .env.example .env
# Fill in all keys (see Environment Variables below)

# 5. Run frontend (port 5173)
npm run dev

# 6. Run backend in separate terminal (port 3000)
npm run server:watch
```

---

## 🔑 Environment Variables

### Frontend (`.env` / `.env.local`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=https://click-opticx-isp-app-live.onrender.com
VITE_ENABLE_ROLE_ROUTING=true
```

### Backend (`backend/.env`)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_REDIRECT_URL=https://isp-click-opticx.web.app/verify-email

# Email
RESEND_API_KEY=re_...
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...

# Firebase Admin
FIREBASE_PROJECT_ID=click-opticx
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Web Push
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

# AI
GEMINI_API_KEY=...
```

---

## 📦 Key NPM Scripts

```bash
npm run dev          # Start Vite dev server (frontend)
npm run build        # Production build → /dist
npm run preview      # Preview production build
npm run server       # Start Express backend
npm run server:watch # Start backend with hot-reload (tsx --watch)
npm run test         # Run Vitest unit tests
```

---

<div align="center">

**Built by ClickTake Technologies**  
© 2025 Click Opticx Pvt Ltd · `v9.6.3-LIVE` · Pakistan 🇵🇰

</div>
