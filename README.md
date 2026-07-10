<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ClickOptix ISP Management Platform - Full Documentation

**ClickOptix** is a powerful, full-stack management platform engineered for Internet Service Providers (ISPs). It acts as the central nervous system for modern ISPs, unifying subscriber management, billing, network diagnostics, automated communications, and AI-powered support.

---

## 🔗 Live Deployments

*   **Frontend (Firebase Hosting):** [https://isp-click-opticx.web.app](https://isp-click-opticx.web.app) / [https://click-opticx.firebaseapp.com](https://click-opticx.firebaseapp.com)
*   **Backend API (Render):** [https://click-opticx-isp-app-live.onrender.com](https://click-opticx-isp-app-live.onrender.com)
*   **Database (Supabase):** Managed via Supabase Cloud PostgreSQL.

---

## 🌟 Comprehensive Features List

### 1. Advanced Authentication & Security
*   **Supabase Native Auth:** Secure session management leveraging Supabase.
*   **Multi-Provider Support:** OTP verification, Magic Links, and traditional passwords.
*   **KYC Workflows:** Document upload (`KYCDocument`), identity verification, and status tracking for new subscribers.
*   **Email Fallbacks:** Resend API integration with robust Gmail SMTP fallback to ensure 100% deliverability for crucial auth emails.

### 2. Subscriber & Billing Engine
*   **Subscriber 360 View:** Manage active subscriptions, data usage, connected devices, and credit scores.
*   **Diverse Payment Gateways:** Support for Stripe, PayPal, JazzCash, EasyPaisa, PayFast, Bank Transfer, and Field Collection.
*   **Automated Invoicing:** Generate invoices (`Invoice`, `LineItem`), track payment records (`PaymentRecord`), and manage ledgers.
*   **Emergency Credits:** Users can request emergency data loads (`EmergencyLoad`) if their wallet balance is low.
*   **Referral System:** `ReferralRecord` tracking to reward users for inviting friends.

### 3. Network Diagnostics & Infrastructure
*   **MikroTik RouterOS Integration:** Live synchronization using `mikronode`.
*   **SNMP & Telnet/SSH:** Hardware-level monitoring (`net-snmp`, `ssh2`, `telnet-client`).
*   **Live Usage & Speed Tests:** Real-time bandwidth monitoring and connection resets directly from the dashboard.
*   **Network Mapping:** Track network nodes, devices, and connection statuses globally (`NetworkNode`, `ConnectedDevice`).

### 4. Communication & Marketing Center
*   **Email Campaigns:** Create and deploy targeted campaigns (`EmailCampaign`, `EmailTemplate`).
*   **Audience Segmentation:** Filter users dynamically (e.g., "High Risk", "All Active") using `AudienceSegment`.
*   **Automation Rules:** Trigger-based notifications (`CommunicationAutomationRule`), such as 7-day expiry warnings.
*   **Multi-Channel Push:** Web-Push notifications for instant browser alerts.

### 5. AI Support & Islamic Tools
*   **AI Chat & Voice:** AI Assistants utilizing Gemini/OpenAI (`AIConfig`, `AICallConfig`, `AIActionLog`).
*   **Islamic Utilities:** Built-in widgets for Namaz timings, Digital Tasbih, Qibla Finder, and Quran access to increase portal stickiness.

### 6. Role-Based Admin Dashboard
*   **Granular Roles:** Super Admin, Network Admin, Support Admin, Finance Admin, Dealer, Field Agent.
*   **Support Tickets:** Fully-featured helpdesk (`SupportTicket`, `TicketComment`).
*   **NOC Events:** Network Operation Center logging for infrastructure outages.

---

## 🗄️ Database Models (Schema Overview)

The platform utilizes a structured relational and NoSQL hybrid approach. Below are the primary entities defined in the system (`db.ts` & Supabase):

### Core Entities
*   `ISPUser` / `StaffUser`: Represents subscribers and internal staff members.
*   `UserSession`: Tracks active logins and device access.
*   `Package` / `PackageRequest`: Internet service tiers (e.g., 15Mbps, 50Mbps) and user upgrade/downgrade requests.
*   `Role` / `SystemSettings`: RBAC enums and global app configurations.

### Fiscal & Billing
*   `PaymentRecord` / `PaymentMethod` / `PaymentGateway`: Tracks transactions, saved cards/wallets, and gateway configs.
*   `Invoice` / `LineItem`: Billing statements and individual charges.
*   `CreditScoreLog` / `TopupRequest` / `WithdrawalRequest`: Fiscal trust tracking and wallet operations.
*   `ReferralRecord`: Tracks invites and bonus credits.

### Network & Hardware
*   `ConnectionStatus` / `ConnectedDevice`: Real-time router status and client device tracking.
*   `NetworkNode` / `NetworkMapping`: Infrastructure topology and geographic mapping.
*   `TechnicalConfig`: Pricing for wires, clips, routers, and ONUs.

### Communications & AI
*   `EmailCampaign` / `EmailTemplate` / `AudienceSegment`: Marketing and transactional email routing.
*   `CommunicationAutomationRule` / `DeliveryLog`: Trigger-based comms and audit trails.
*   `SenderIdentity` / `SystemNotification`: Verified sender domains and in-app alerts.
*   `AIConfig` / `AIEvent` / `AICallLog` / `AICallRule`: AI prompt configurations, execution logs, and voice agent rules.

### Support & Operations
*   `SupportTicket` / `TicketComment`: Customer issue tracking.
*   `InternalTask` / `NOCEvent`: Staff task management and Network Operation Center outage logs.
*   `KYCDocument` / `SecurityLog` / `ArchiveRecord`: Compliance, audit trails, and data retention.

---

## ⚙️ CI/CD & Deployment Guide

The platform uses a split architecture deployment: **Firebase** for the static frontend and **Render** for the Express.js backend.

### 1. Frontend Deployment (Firebase Hosting)
The Next.js/Vite frontend is built as a static site export and hosted on Firebase.

**Manual Deployment:**
```bash
# 1. Install dependencies
npm install

# 2. Build the static export (outputs to /dist)
npm run build

# 3. Deploy to Firebase Hosting
npx firebase deploy --only hosting
```

**CI/CD Pipeline (GitHub Actions):**
To automate frontend deployments, set up a GitHub Action using `firebase-tools`:
1.  Add `FIREBASE_TOKEN` to your GitHub repository secrets.
2.  The workflow should run `npm install`, `npm run build`, and `firebase deploy --token $FIREBASE_TOKEN`.

### 2. Backend Deployment (Render)
The Express backend handles heavy tasks like RouterOS communication, Stripe webhooks, and AI processing.

**Manual Deployment / Local Testing:**
```bash
npm run server
```

**Render CI/CD:**
1.  The project contains a `render.yaml` configuration file.
2.  Connect the GitHub repository to Render as a "Web Service".
3.  Set the Root Directory (if applicable) and Build Command (`npm install`).
4.  Set the Start Command (`npm run server`).
5.  Render will automatically redeploy the backend upon every push to the `main` branch.

### 3. Database Management (Supabase)
*   Migrations and schema updates are handled via the Supabase Dashboard / SQL Editor.
*   Webhook listeners in Supabase trigger edge functions or hit the Render backend for event-driven architecture (e.g., auth triggers, KYC approvals).

---

## 💻 Local Development Setup

1.  **Clone & Install:**
    ```bash
    git clone <repository-url>
    cd click-opticx-isp-app-live
    npm install
    ```
2.  **Environment Variables:**
    Create a `.env` file referencing `.env.example`. Ensure you configure:
    *   `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
    *   `STRIPE_SECRET_KEY`
    *   `RESEND_API_KEY`
    *   `UPSTASH_REDIS_REST_URL`
3.  **Run Development Servers:**
    ```bash
    # Terminal 1: Frontend
    npm run dev
    
    # Terminal 2: Backend
    npm run server:watch
    ```
