<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ClickOptix ISP Management Platform

**ClickOptix** is a comprehensive, full-stack management platform tailored for Internet Service Providers (ISPs). It streamlines billing, subscriber management, network diagnostics, and customer communications into a centralized, modern interface. 

## 🚀 Key Features

*   **Robust Authentication & KYC:** Secure user onboarding with Supabase Auth, supporting OTP verification, custom email fallbacks (Resend + Gmail), and structured KYC (Know Your Customer) workflows.
*   **Subscriber Management:** Manage user profiles, active packages, data usage, and service statuses seamlessly.
*   **Network Diagnostics:** Direct integration with MikroTik RouterOS and SNMP for live network monitoring, bandwidth tracking, and speed test capabilities.
*   **Billing & Payments:** Integrated with Stripe for automated invoicing, package subscriptions, and payment processing.
*   **Unified Communication Center:** Push notifications (Web Push) and dynamic email dispatching to specific audience segments (e.g., unpaid invoices, new signups).
*   **Admin Dashboard:** Real-time analytics, user metrics, and system health monitoring visualized with dynamic charts.

## 🛠️ Technology Stack

**Frontend:**
*   **Framework:** React 18 with Vite
*   **Language:** TypeScript
*   **State Management:** Zustand, React Query
*   **Routing:** React Router v6
*   **UI Components:** Lucide-react (Icons), Recharts (Data Visualization)

**Backend:**
*   **Server:** Node.js, Express.js
*   **Database:** Supabase (PostgreSQL)
*   **Caching & Queues:** Redis (Upstash), BullMQ
*   **Network Integration:** `mikronode` (RouterOS), `net-snmp`, `ssh2`, `telnet-client`

**Infrastructure & Deployment:**
*   **Hosting:** Firebase Hosting
*   **Authentication:** Supabase & Firebase Admin

## 💻 Getting Started (Local Development)

**Prerequisites:**  
*   Node.js (v18+)
*   NPM or Yarn
*   A Supabase project
*   A Firebase project
*   Stripe, Resend, and Redis credentials

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd click-opticx-isp-app-live
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` or `.env.local` file in the root directory and populate it with the necessary API keys and database URLs (e.g., Supabase URL, Stripe Secret, Redis connection string).

4. **Run the development servers:**
   To run the frontend:
   ```bash
   npm run dev
   ```
   To run the backend server:
   ```bash
   npm run server
   ```

## 🏗️ Building for Production

To build a static export for Firebase Hosting:
```bash
npm run build
```

The application is configured to deploy directly to Firebase (`output: 'export'`).

## 🛡️ Stability & Recent Updates
The platform recently underwent significant stabilization focusing on:
*   Migrating fully to native Supabase SDK methods for resilient authentication flows.
*   Enhancing email and OTP delivery mechanisms with fallback providers.
*   Overhauling UI responsiveness and optimizing performance via Lighthouse audits.
*   Transitioning deployment strategies to static site generation for optimized hosting.
