# Kingdom Fund Circle — Developer Handoff Document

**Project:** Kingdom Fund Circle (KFC)  
**Type:** Invitation-only PWA — Christian Association Monthly Contribution Platform  
**Date:** May 2026  
**Hosting:** VPS with cPanel (Apache + PHP + MySQL)  
**Status:** Greenfield — ready for development

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Tech Stack — Full Justification](#2-tech-stack--full-justification)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [User Journeys (All Flows)](#6-user-journeys-all-flows)
7. [API Endpoint Map](#7-api-endpoint-map)
8. [Frontend Pages & Components](#8-frontend-pages--components)
9. [Background Jobs & Scheduler](#9-background-jobs--scheduler)
10. [Notification System](#10-notification-system)
11. [Payment Integration (Paystack)](#11-payment-integration-paystack)
12. [Security Implementation](#12-security-implementation)
13. [PWA Setup](#13-pwa-setup)
14. [File Storage Strategy](#14-file-storage-strategy)
15. [cPanel Deployment Checklist](#15-cpanel-deployment-checklist)
16. [Environment Variables Reference](#16-environment-variables-reference)
17. [Development Phases & Roadmap](#17-development-phases--roadmap)

---

## 1. Project Summary

Kingdom Fund Circle (KFC) is a closed-membership contribution platform for a Christian association. Members are invited by an admin, register via a unique token link, and each receive a dedicated virtual bank account (Paystack). They fund their wallet by simply transferring money to that bank account. Every month, the system auto-debits each member's wallet for their chosen contribution package and pools the money. Admins then disburse to missionary/organization beneficiaries and publish transparent receipts visible to all members.

**Core constraints:**
- No public registration — invitation-only
- Full financial transparency — every member sees group totals and disbursements
- Must run on cPanel VPS — no AWS, no Heroku, no Docker (unless VPS supports it)
- All third-party services must be free-tier or pay-per-use (no monthly SaaS subscriptions)
- Mobile-first PWA — must be installable on Android

---

## 2. Tech Stack — Full Justification

### Backend: Laravel 11 (PHP 8.2+)

- Runs natively on cPanel without additional server processes
- Built-in scheduler (replaces cron setup complexity)
- Eloquent ORM for clean relational models
- Laravel Sanctum for SPA authentication (httpOnly cookie, CSRF-safe)
- Laravel Queue with `database` driver (no Redis needed on cPanel)
- Laravel Mail, Notifications, Jobs — all built-in
- PHP ecosystem — easy to hire freelancers for maintenance

### Frontend: React 18 + Vite + Tailwind CSS

- Compiled to static files → uploaded to `public_html` (no Node.js process on server)
- Vite build is fast and produces optimized bundles
- Tailwind CSS — utility-first, no bloated CSS framework
- Zustand — lightweight state management (no Redux overhead)
- Axios — HTTP client with interceptors for auth tokens
- React Router v6 — client-side routing
- `vite-plugin-pwa` — generates service worker + manifest automatically

### Database: MySQL 8 (cPanel)

- Included in every cPanel plan — zero extra cost
- Well-supported by Laravel Eloquent
- Use `utf8mb4` charset for full emoji/unicode support

### Authentication: Laravel Sanctum

- SPA mode with cookies (most secure for browser apps)
- Alternatively: token mode (easier for debugging mobile)
- Recommend token mode for PWA — store token in memory/sessionStorage (not localStorage)

### Queue: Laravel Queue — Database Driver

- `database` queue driver stores jobs in MySQL — no Redis needed
- Run worker via cPanel Background Processes
- Handles: auto-debits, email sending, SMS, FCM push

### Email: Brevo SMTP (free 300/day) or cPanel Mail

- Use Brevo's free SMTP for reliability and deliverability
- cPanel mail can go to spam — Brevo has better deliverability
- Laravel Mail with queued Mailable classes

### SMS: Termii

- Nigerian-focused, supports local numbers and sender IDs
- REST API, simple HTTP POST
- Cheap per-SMS pricing for NG numbers

### Push Notifications: Firebase Cloud Messaging (FCM)

- Free, unlimited devices
- `firebase/firebase-js-sdk` in the React app registers the service worker
- Backend sends via FCM HTTP v1 API using service account

### Payments: Paystack

- Most trusted payment processor in Nigeria
- Dedicated Virtual Accounts — members get a unique Wema/Providus bank account number
- Webhooks — `charge.success` event updates wallet in real time
- No monthly subscription — percentage per transaction only
- Laravel package: `unicodeveloper/laravel-paystack` or raw HTTP via Guzzle

### File Storage: Laravel Local Disk

- Receipts stored in `storage/app/private/receipts/`
- Served via signed temporary URLs (Laravel `Storage::temporaryUrl()`)
- No S3 or Cloudinary — uses the server disk
- Keep receipts outside `public/` for access control

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (cPanel)                        │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │  yourdomain.com      │  │  api.yourdomain.com       │ │
│  │  React SPA           │  │  Laravel 11 API           │ │
│  │  (static files in    │  │  (public_html → /public)  │ │
│  │   public_html)       │  │                           │ │
│  └──────────┬───────────┘  └───────────┬──────────────┘ │
│             │   HTTPS / Axios           │                │
│             └──────────────────────────┘                │
│                                          │               │
│                                    ┌─────▼──────┐       │
│                                    │  MySQL DB  │       │
│                                    └────────────┘       │
│                                                          │
│  Background Process: queue:work (database driver)        │
│  Cron: schedule:run every minute                        │
└─────────────────────────────────────────────────────────┘

External:
  Paystack API ←→ Laravel (webhooks inbound to /api/webhook/paystack)
  Brevo SMTP   ←→ Laravel Mail
  Termii API   ←→ Laravel SmsService
  FCM API      ←→ Laravel PushService
  FCM SW       ←→ React PWA (service worker)
```

---

## 4. Folder Structure

### Backend (`/backend`)

```
backend/
├── app/
│   ├── Console/
│   │   └── Kernel.php                  # Scheduler definitions
│   ├── Exceptions/Handler.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── InvitationController.php
│   │   │   │   ├── RegisterController.php
│   │   │   │   └── LoginController.php
│   │   │   ├── Member/
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── WalletController.php
│   │   │   │   ├── ContributionController.php
│   │   │   │   └── MeetingController.php
│   │   │   ├── Admin/
│   │   │   │   ├── MemberController.php
│   │   │   │   ├── InvitationController.php
│   │   │   │   ├── ContributionCycleController.php
│   │   │   │   ├── DisbursementController.php
│   │   │   │   ├── MeetingController.php
│   │   │   │   └── ReportController.php
│   │   │   └── Webhook/
│   │   │       └── PaystackWebhookController.php
│   │   ├── Middleware/
│   │   │   ├── AdminOnly.php
│   │   │   └── VerifyPaystackWebhook.php
│   │   └── Requests/               # Form request validation
│   ├── Jobs/
│   │   ├── DebitMonthlyContributions.php
│   │   ├── SendContributionReminder.php
│   │   ├── SendMeetingNotification.php
│   │   └── SendDisbursementNotification.php
│   ├── Mail/
│   │   ├── InvitationMail.php
│   │   ├── ContributionConfirmationMail.php
│   │   ├── ContributionReminderMail.php
│   │   └── DisbursementPublishedMail.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Invitation.php
│   │   ├── Wallet.php
│   │   ├── WalletTransaction.php
│   │   ├── ContributionPackage.php
│   │   ├── ContributionCycle.php
│   │   ├── Contribution.php
│   │   ├── Disbursement.php
│   │   ├── Meeting.php
│   │   ├── MeetingRsvp.php
│   │   ├── Notification.php
│   │   └── AuditLog.php
│   ├── Notifications/              # Laravel Notification classes
│   └── Services/
│       ├── PaystackService.php
│       ├── FcmService.php
│       ├── SmsService.php          # Termii
│       └── WalletService.php       # Core debit/credit logic
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── AdminSeeder.php         # Creates first admin account
├── routes/
│   ├── api.php
│   └── web.php                     # Only for webhook endpoint
├── storage/
│   └── app/
│       ├── private/
│       │   └── receipts/           # Disbursement receipt files
│       └── public/                 # Profile photos (symlinked)
└── .env
```

### Frontend (`/frontend`)

```
frontend/
├── public/
│   ├── icons/                      # PWA app icons (512x512, 192x192, etc.)
│   ├── manifest.json               # Generated by vite-plugin-pwa
│   └── sw.js                       # Generated by Workbox
├── src/
│   ├── api/
│   │   ├── axios.js                # Axios instance with auth interceptor
│   │   ├── auth.js
│   │   ├── wallet.js
│   │   ├── contributions.js
│   │   ├── disbursements.js
│   │   ├── meetings.js
│   │   └── admin.js
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MemberLayout.jsx
│   │   │   ├── AdminLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── ui/
│   │   │   ├── StatCard.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Toast.jsx
│   │   └── shared/
│   │       ├── NotificationBell.jsx
│   │       └── InstallPrompt.jsx   # PWA install prompt
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── AcceptInvitation.jsx
│   │   │   └── Register.jsx
│   │   ├── member/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Wallet.jsx
│   │   │   ├── MyContributions.jsx
│   │   │   ├── GroupContributions.jsx
│   │   │   ├── Disbursements.jsx
│   │   │   ├── Meetings.jsx
│   │   │   └── Profile.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── Members.jsx
│   │       ├── Invitations.jsx
│   │       ├── ContributionPackages.jsx
│   │       ├── MonthlyContributions.jsx
│   │       ├── WalletTransactions.jsx
│   │       ├── Disbursements.jsx
│   │       ├── Meetings.jsx
│   │       ├── Reports.jsx
│   │       └── Settings.jsx
│   ├── store/
│   │   ├── authStore.js
│   │   ├── walletStore.js
│   │   └── notificationStore.js
│   ├── hooks/
│   │   ├── useFcm.js               # FCM token registration
│   │   └── useOfflineCache.js
│   ├── utils/
│   │   ├── formatCurrency.js       # ₦ formatter
│   │   └── dateHelpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── firebase.js                 # Firebase app init
├── .env
└── vite.config.js
```

---

## 5. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(191) | |
| email | varchar(191) unique | |
| phone | varchar(20) | Nigerian format |
| password | varchar(255) | bcrypt |
| role | enum('member','admin') | default: member |
| status | enum('active','suspended','pending') | |
| profile_photo | varchar(255) nullable | |
| fcm_token | varchar(255) nullable | Firebase device token |
| two_factor_secret | varchar(255) nullable | Admin TOTP |
| email_verified_at | timestamp nullable | |
| created_at / updated_at | timestamps | |

### `invitations`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| invited_by | bigint FK → users.id | |
| name | varchar(191) | Recipient name |
| email | varchar(191) | |
| phone | varchar(20) | |
| token | varchar(255) unique | SHA-256 hashed |
| status | enum('pending','accepted','expired') | |
| expires_at | timestamp | 7 days from creation |
| accepted_at | timestamp nullable | |
| created_at / updated_at | timestamps | |

### `wallets`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK → users.id unique | |
| balance | decimal(15,2) default 0 | |
| paystack_customer_code | varchar(100) | |
| virtual_account_number | varchar(20) | |
| virtual_account_bank | varchar(100) | |
| virtual_account_name | varchar(191) | |
| created_at / updated_at | timestamps | |

### `wallet_transactions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| wallet_id | bigint FK → wallets.id | |
| type | enum('credit','debit') | |
| amount | decimal(15,2) | |
| description | varchar(255) | |
| reference | varchar(100) unique | Paystack ref or system ref |
| paystack_event | varchar(100) nullable | e.g. charge.success |
| balance_before | decimal(15,2) | Immutable audit |
| balance_after | decimal(15,2) | Immutable audit |
| created_at | timestamp | No updated_at — append-only |

### `contribution_packages`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| name | varchar(100) | e.g. "Bronze" |
| amount | decimal(15,2) | |
| is_custom | boolean default false | |
| is_active | boolean default true | |
| created_at / updated_at | timestamps | |

### `contribution_cycles`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| month | tinyint | 1–12 |
| year | smallint | |
| debit_day | tinyint | Day of month to debit |
| status | enum('pending','active','closed') | |
| total_raised | decimal(15,2) default 0 | Computed on close |
| created_at / updated_at | timestamps | |

### `contributions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK → users.id | |
| cycle_id | bigint FK → contribution_cycles.id | |
| package_id | bigint FK → contribution_packages.id | |
| amount_pledged | decimal(15,2) | |
| amount_paid | decimal(15,2) default 0 | |
| status | enum('paid','pending','partial','not_paid') | |
| paid_at | timestamp nullable | |
| wallet_transaction_id | bigint FK nullable | |
| created_at / updated_at | timestamps | |

### `disbursements`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| cycle_id | bigint FK → contribution_cycles.id | |
| beneficiary_name | varchar(255) | |
| beneficiary_type | enum('missionary','organization','project') | |
| purpose | text | |
| total_raised | decimal(15,2) | |
| amount_disbursed | decimal(15,2) | |
| date_sent | date | |
| payment_method | varchar(100) | |
| receipt_path | varchar(255) nullable | Stored in private disk |
| notes | text nullable | |
| published_at | timestamp nullable | Visible to members when set |
| created_by | bigint FK → users.id | |
| created_at / updated_at | timestamps | |

### `meetings`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| title | varchar(255) | |
| description | text nullable | |
| agenda | text nullable | |
| date | date | |
| time | time | |
| venue | varchar(255) nullable | |
| meeting_link | varchar(500) nullable | Online link |
| attachment_path | varchar(255) nullable | |
| created_by | bigint FK → users.id | |
| created_at / updated_at | timestamps | |

### `meeting_rsvps`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| meeting_id | bigint FK → meetings.id | |
| user_id | bigint FK → users.id | |
| response | enum('attending','not_attending') | |
| created_at / updated_at | timestamps | |
| UNIQUE(meeting_id, user_id) | | |

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK → users.id | |
| type | varchar(100) | e.g. contribution_paid |
| title | varchar(255) | |
| body | text | |
| data | json nullable | Extra payload |
| read_at | timestamp nullable | |
| created_at | timestamp | |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| user_id | bigint FK nullable | Who did it |
| action | varchar(100) | e.g. wallet.debit |
| model_type | varchar(100) | e.g. App\Models\Wallet |
| model_id | bigint | |
| payload | json | Before/after snapshot |
| ip_address | varchar(45) | |
| user_agent | varchar(255) | |
| created_at | timestamp | |

---

## 6. User Journeys (All Flows)

### Flow 1 — Admin Invites a Member

```
Admin → Admin Dashboard → Members → "Invite Member"
  → Enter: name, email, phone
  → System creates Invitation record
      token = bin2hex(random_bytes(32)) stored as SHA-256 hash
      expires_at = now() + 7 days
  → InvitationMail dispatched (queued)
      Email contains: https://yourdomain.com/accept-invitation/{raw_token}
  → Admin sees invitation in "Pending Invitations" list
  → Admin can resend or revoke
```

### Flow 2 — Member Accepts Invitation & Registers

```
Member → clicks link in email
  → Frontend route: /accept-invitation/:token
  → API call: POST /api/invitation/validate  { token }
  → Laravel: hash token → find Invitation → check not expired, not accepted
  → Returns: { name, email, phone, valid: true }
  → Member sees pre-filled Register form
  → Member sets: password, optional profile photo
  → Member reads + accepts Terms
  → POST /api/auth/register { token, password, photo? }
  → Laravel:
      1. Validates token again
      2. Creates User (role: member, status: active)
      3. Creates Wallet
      4. Calls PaystackService::createCustomer()
      5. Calls PaystackService::createDedicatedVirtualAccount()
      6. Saves virtual account details to wallet
      7. Marks Invitation as accepted
      8. Returns Sanctum token
  → Member is redirected to /onboarding (package selection)
```

### Flow 3 — Onboarding (Package Selection)

```
Member → /onboarding
  → Sees welcome screen with association purpose
  → Sees available contribution packages (fetched from API)
  → Selects package (or enters custom amount if allowed)
  → POST /api/member/package  { package_id }
  → System saves member's package selection to contributions table
     for current cycle (or stores as default_package_id on user)
  → Member redirected to /dashboard
```

### Flow 4 — Member Funds Wallet (Virtual Account)

```
Member → Dashboard → "My Wallet" → sees virtual account number
  → Member opens their bank app
  → Transfers ₦X to the virtual account number shown
  → Paystack detects transfer on their end
  → Paystack sends webhook: POST to https://api.yourdomain.com/api/webhook/paystack
  → Laravel VerifyPaystackWebhook middleware:
      validates X-Paystack-Signature header (HMAC SHA-512)
  → PaystackWebhookController handles event: charge.success
      1. Find wallet by virtual_account.account_number
      2. WalletService::credit(wallet, amount, reference)
         - Creates WalletTransaction (type: credit)
         - Updates wallet.balance
      3. Creates in-app Notification
      4. Dispatches FcmService::send() + SmsService::send()
  → Member's dashboard wallet balance updates on next refresh
  → Member receives push + SMS: "Wallet credited ₦X,000"
```

### Flow 5 — Monthly Auto-Debit

```
Scheduler (1st of month, 8:00 AM) → DebitMonthlyContributions Job dispatched

Job foreach active member:
  1. Get member's contribution for current cycle
  2. Get member's package amount
  3. If wallet.balance >= package.amount:
     → WalletService::debit(wallet, amount, "Monthly contribution - March 2026")
     → Creates WalletTransaction (type: debit)
     → Creates/updates Contribution (status: paid)
     → Notifies member: "March contribution of ₦10,000 paid"
  4. Else:
     → Contribution status: pending (or partial if partially funded)
     → Notifies member: "Insufficient wallet balance for March contribution"
     → Queues SendContributionReminder Job (sends again in 3 days, 7 days)
```

### Flow 6 — Member Views Dashboard

```
Member → /dashboard
  → API: GET /api/member/dashboard
  → Returns:
      wallet: { balance, virtual_account }
      my_contribution: { month, package_amount, status, paid_at }
      my_total_contributed: sum of all paid contributions
      group: { month_total, paid_count, pending_count, current_cycle }
      last_disbursement: { beneficiary, amount, receipt_url }
      upcoming_meeting: { title, date, venue }
      unread_notifications: count
```

### Flow 7 — Admin Records Disbursement

```
Admin → Disbursements → "Record Disbursement"
  → Enter: beneficiary, purpose, total raised, amount disbursed,
            date sent, payment method, notes
  → Upload receipt (PDF/image — max 5MB)
  → POST /api/admin/disbursements
  → Laravel:
      1. Validates and stores disbursement record
      2. Stores receipt in storage/app/private/receipts/
      3. Cycle is marked as closed
      4. Published = false (admin can review before publishing)
  → Admin clicks "Publish"
  → PATCH /api/admin/disbursements/{id}/publish
  → published_at = now()
  → SendDisbursementNotification Job dispatched to all active members
  → Members see disbursement on their dashboard with "View Receipt" link
```

### Flow 8 — Member Views Receipt

```
Member → Disbursements → clicks "View Receipt"
  → Frontend: GET /api/disbursements/{id}/receipt
  → Laravel:
      1. Checks member is authenticated and active
      2. Generates temporary signed URL (Storage::temporaryUrl, 15 min TTL)
      3. Returns signed URL
  → Frontend opens signed URL in new tab (PDF/image served directly)
```

### Flow 9 — Admin Creates Meeting

```
Admin → Meetings → "Create Meeting"
  → Enter: title, date, time, venue/link, description, agenda
  → Optionally attach file
  → POST /api/admin/meetings
  → Meeting created
  → SendMeetingNotification Job dispatched → all members notified
  → Members see meeting in /meetings
  → Member clicks "I will attend" → POST /api/member/meetings/{id}/rsvp
  → Admin sees attendance count in real time
```

### Flow 10 — Admin Exports Report

```
Admin → Reports → select: Month/Year → Export CSV or PDF
  → GET /api/admin/reports/contributions?month=4&year=2026&format=csv
  → Laravel generates report on-the-fly (no queuing for small datasets)
  → Returns file download response
  → CSV: member name, phone, package, status, paid_at
  → PDF: monthly summary with group totals (use barryvdh/laravel-dompdf)
```

---

## 7. API Endpoint Map

### Auth & Invitation
```
POST   /api/invitation/validate          Validate invitation token
POST   /api/auth/register                Register via invitation
POST   /api/auth/login                   Login
POST   /api/auth/logout                  Logout (revoke token)
GET    /api/auth/me                      Get current user
POST   /api/auth/2fa/verify              Admin 2FA verification
```

### Member
```
GET    /api/member/dashboard             Full dashboard data
GET    /api/member/wallet                Wallet + virtual account
GET    /api/member/transactions          Wallet transaction history
GET    /api/member/contributions         Personal contribution history
GET    /api/member/group/contributions   Group monthly totals
GET    /api/member/disbursements         Disbursement records (published)
GET    /api/disbursements/:id/receipt    Temporary signed receipt URL
GET    /api/member/meetings              Upcoming meetings
POST   /api/member/meetings/:id/rsvp    RSVP to meeting
POST   /api/member/package               Set/change contribution package
GET    /api/member/notifications         In-app notifications
PATCH  /api/member/notifications/read    Mark notifications read
PATCH  /api/member/profile               Update profile (name, photo, password)
POST   /api/member/fcm-token             Register FCM device token
```

### Admin
```
GET    /api/admin/dashboard              Admin stats overview

# Members
GET    /api/admin/members                List all members (paginated)
GET    /api/admin/members/:id            Member profile + contribution history
PATCH  /api/admin/members/:id/status     Activate/suspend member
PATCH  /api/admin/members/:id/package    Change member package

# Invitations
POST   /api/admin/invitations            Create invitation
GET    /api/admin/invitations            List invitations
POST   /api/admin/invitations/:id/resend Resend invitation
DELETE /api/admin/invitations/:id        Revoke invitation

# Contribution Packages
GET    /api/admin/packages               List packages
POST   /api/admin/packages               Create package
PATCH  /api/admin/packages/:id           Update package
DELETE /api/admin/packages/:id           Deactivate package

# Contribution Cycles
GET    /api/admin/cycles                 List cycles
POST   /api/admin/cycles                 Create cycle
GET    /api/admin/cycles/:id/summary     Cycle contribution summary
POST   /api/admin/cycles/:id/debit       Trigger manual debit run
POST   /api/admin/cycles/:id/reminder    Send reminders to pending members

# Disbursements
GET    /api/admin/disbursements          List disbursements
POST   /api/admin/disbursements          Create disbursement (with receipt upload)
PATCH  /api/admin/disbursements/:id      Update before publish
PATCH  /api/admin/disbursements/:id/publish  Publish to members
GET    /api/admin/disbursements/:id/receipt  Admin receipt access

# Meetings
GET    /api/admin/meetings               List meetings
POST   /api/admin/meetings               Create meeting
PATCH  /api/admin/meetings/:id           Update meeting
DELETE /api/admin/meetings/:id           Delete meeting
GET    /api/admin/meetings/:id/rsvps     View attendance

# Reports
GET    /api/admin/reports/contributions  Monthly contribution report (CSV/PDF)
GET    /api/admin/reports/wallets        Wallet balance snapshot

# Wallet
GET    /api/admin/transactions           All wallet transactions
POST   /api/admin/wallets/:id/debit      Manual debit (with reason)
```

### Webhook
```
POST   /api/webhook/paystack             Paystack event webhook (public, no auth)
```

---

## 8. Frontend Pages & Components

### Member Pages

| Route | Page | Key Data |
|---|---|---|
| `/login` | Login | Auth form |
| `/accept-invitation/:token` | AcceptInvitation | Token validation |
| `/register` | Register | Post-invitation form |
| `/onboarding` | Onboarding | Package selection |
| `/dashboard` | Dashboard | Wallet, contributions, group stats |
| `/wallet` | Wallet | Balance, virtual account, transactions |
| `/contributions/mine` | MyContributions | Personal history + status per month |
| `/contributions/group` | GroupContributions | Monthly group totals |
| `/disbursements` | Disbursements | Published disbursements + receipt links |
| `/meetings` | Meetings | Upcoming + past meetings, RSVP |
| `/notifications` | Notifications | In-app notification list |
| `/profile` | Profile | Edit name, photo, password |

### Admin Pages

| Route | Page |
|---|---|
| `/admin` | AdminDashboard |
| `/admin/members` | Members — list, invite, manage |
| `/admin/invitations` | Invitations — pending, expired |
| `/admin/packages` | ContributionPackages |
| `/admin/cycles` | MonthlyContributions — cycles, debit |
| `/admin/transactions` | WalletTransactions |
| `/admin/disbursements` | Disbursements — record, upload, publish |
| `/admin/meetings` | Meetings — create, view RSVP |
| `/admin/reports` | Reports — export CSV/PDF |
| `/admin/settings` | Settings — app config, admin profile |

### Route Guards

```jsx
// Three guard wrappers:
<ProtectedRoute>          — must be logged in
<MemberRoute>             — role: member
<AdminRoute>              — role: admin (+ optional 2FA check)
```

---

## 9. Background Jobs & Scheduler

### Laravel Scheduler (app/Console/Kernel.php)

```php
// Every month on the configured debit day at 8:00 AM
$schedule->job(new DebitMonthlyContributions)->monthlyOn($debitDay, '08:00');

// Reminder: 3 days after debit day at 9:00 AM (for pending members)
$schedule->job(new SendContributionReminder('day3'))->monthlyOn($debitDay + 3, '09:00');

// Reminder: 7 days after debit day
$schedule->job(new SendContributionReminder('day7'))->monthlyOn($debitDay + 7, '09:00');

// Meeting reminders: 24h before meeting
$schedule->job(new SendMeetingReminders)->hourly();
```

### Queue Jobs

| Job | Trigger | Actions |
|---|---|---|
| `DebitMonthlyContributions` | Scheduler | Debits all wallets, creates contributions, sends confirmations |
| `SendContributionReminder` | Scheduler | Sends email + SMS + push to pending members |
| `SendMeetingNotification` | Meeting created | FCM push + email to all members |
| `SendMeetingReminders` | Scheduler (hourly) | Checks meetings in next 24h → sends reminders |
| `SendDisbursementNotification` | Disbursement published | FCM push + email to all members |

---

## 10. Notification System

### Channels Per Event

| Event | Email | SMS | FCM Push | In-App |
|---|---|---|---|---|
| Invitation sent | ✅ | ✅ | — | — |
| Wallet credited | ✅ | ✅ | ✅ | ✅ |
| Contribution paid | ✅ | — | ✅ | ✅ |
| Contribution pending | ✅ | ✅ | ✅ | ✅ |
| Reminder (day 3/7) | ✅ | ✅ | ✅ | ✅ |
| Meeting created | ✅ | — | ✅ | ✅ |
| Meeting reminder | — | ✅ | ✅ | ✅ |
| Disbursement published | ✅ | — | ✅ | ✅ |

### FCM Setup

1. Create Firebase project → generate service account JSON
2. Place in `backend/storage/app/firebase-service-account.json`
3. `FcmService::send($fcmToken, $title, $body, $data)` uses HTTP v1 API via Guzzle
4. Frontend: `firebase.js` initializes app → `getToken(messaging, { vapidKey })` on user login
5. Token sent to `POST /api/member/fcm-token` and stored in `users.fcm_token`
6. Service worker (`firebase-messaging-sw.js`) handles background messages

---

## 11. Payment Integration (Paystack)

### Virtual Account Creation (on registration)

```php
// PaystackService.php
public function createCustomer(User $user): string
{
    $response = Http::withToken(config('paystack.secret_key'))
        ->post('https://api.paystack.co/customer', [
            'email'      => $user->email,
            'first_name' => $user->name,
            'phone'      => $user->phone,
        ]);
    return $response['data']['customer_code'];
}

public function createDedicatedVirtualAccount(string $customerCode): array
{
    $response = Http::withToken(config('paystack.secret_key'))
        ->post('https://api.paystack.co/dedicated_account', [
            'customer'           => $customerCode,
            'preferred_bank'     => 'wema-bank',  // or 'titan-paystack'
        ]);
    return $response['data']; // account_number, bank.name, account_name
}
```

### Webhook Handler

```php
// VerifyPaystackWebhook middleware
public function handle(Request $request, Closure $next)
{
    $signature = $request->header('X-Paystack-Signature');
    $expected  = hash_hmac('sha512', $request->getContent(), config('paystack.secret_key'));

    if (!hash_equals($expected, $signature)) {
        abort(400, 'Invalid signature');
    }
    return $next($request);
}

// PaystackWebhookController
public function handle(Request $request)
{
    $event = $request->input('event');
    $data  = $request->input('data');

    if ($event === 'charge.success') {
        $accountNumber = $data['paid_to']['account_number'] ?? null;
        $wallet = Wallet::where('virtual_account_number', $accountNumber)->first();
        if ($wallet) {
            WalletService::credit($wallet, $data['amount'] / 100, $data['reference']);
        }
    }
    return response()->json(['status' => 'ok']);
}
```

**Important:** Always return HTTP 200 quickly from the webhook endpoint. Do heavy processing in a queued job if needed.

---

## 12. Security Implementation

### Invitation Token

```php
// Creating invitation
$raw   = bin2hex(random_bytes(32));           // 64-char hex token (sent in email)
$hash  = hash('sha256', $raw);                // SHA-256 hash stored in DB
$invitation->token = $hash;

// Validating token (in controller)
$hash = hash('sha256', $request->token);
$invitation = Invitation::where('token', $hash)
    ->where('status', 'pending')
    ->where('expires_at', '>', now())
    ->firstOrFail();
```

### Receipt Access Control

```php
// Receipts are NOT in public disk — only served via signed temporary URLs
public function getReceipt(Disbursement $disbursement)
{
    abort_unless(auth()->check(), 401);
    abort_unless(auth()->user()->status === 'active', 403);
    abort_unless($disbursement->published_at !== null, 404);

    $url = Storage::disk('private')->temporaryUrl(
        $disbursement->receipt_path,
        now()->addMinutes(15)
    );
    return response()->json(['url' => $url]);
}
```

### File Upload Validation

```php
$request->validate([
    'receipt' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // 5MB max
]);
$path = $request->file('receipt')->store('receipts', 'private');
```

### Admin 2FA (TOTP)

- Use `pragmarx/google2fa-laravel` package
- Admin must verify TOTP on first login per session
- Store `2fa_verified` flag in session
- Middleware checks `2fa_verified` on all `/admin/*` routes

### Rate Limiting

```php
// routes/api.php
Route::middleware(['throttle:10,1'])->group(function () {  // 10 req/min
    Route::post('/auth/login', ...);
    Route::post('/invitation/validate', ...);
});
```

---

## 13. PWA Setup

### `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Kingdom Fund Circle',
        short_name: 'KFC',
        description: 'Christian association contribution platform',
        theme_color: '#1a3c6e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/member\/dashboard/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'dashboard-cache' }
          },
          {
            urlPattern: /\/api\/member\/contributions/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'contributions-cache' }
          }
        ]
      }
    })
  ]
})
```

### Offline Behavior

- Dashboard, contribution history, disbursements, meeting list → cached via service worker (StaleWhileRevalidate)
- Wallet balance and live payment data → NetworkFirst (must be online)
- App shell (HTML/JS/CSS) → CacheFirst

---

## 14. File Storage Strategy

| File Type | Disk | Path | Access |
|---|---|---|---|
| Disbursement receipts | `private` | `receipts/{year}/{month}/filename.pdf` | Signed temp URL (15 min) |
| Meeting attachments | `private` | `meetings/{id}/filename.pdf` | Signed temp URL |
| Profile photos | `public` | `photos/{user_id}/filename.jpg` | Public URL via symlink |

Configure `config/filesystems.php`:

```php
'disks' => [
    'local'   => ['driver' => 'local', 'root' => storage_path('app/private')],
    'public'  => ['driver' => 'local', 'root' => storage_path('app/public'), 'url' => env('APP_URL').'/storage', 'visibility' => 'public'],
],
```

Run once on server: `php artisan storage:link`

---

## 15. cPanel Deployment Checklist

### Pre-deployment

- [ ] PHP 8.2+ enabled in cPanel → MultiPHP Manager
- [ ] MySQL database and user created in cPanel → MySQL Databases
- [ ] Two subdomains created: `api.yourdomain.com`, `yourdomain.com`
- [ ] SSL enabled via AutoSSL for both domains
- [ ] SSH access enabled (cPanel → Terminal or WHM)

### Backend Deployment

- [ ] Upload `/backend` to `/home/user/laravel/api/` (NOT inside public_html)
- [ ] Set document root of `api.yourdomain.com` → `/home/user/laravel/api/public`
- [ ] Via SSH: `composer install --optimize-autoloader --no-dev`
- [ ] Copy `.env.example` to `.env`, fill all values
- [ ] `php artisan key:generate`
- [ ] `php artisan migrate --force`
- [ ] `php artisan db:seed --class=AdminSeeder`
- [ ] `php artisan storage:link`
- [ ] `php artisan config:cache && php artisan route:cache && php artisan view:cache`
- [ ] Set folder permissions: `storage/` and `bootstrap/cache/` → 775

### Cron Job (cPanel → Cron Jobs)

```
* * * * * /usr/local/bin/php /home/user/laravel/api/artisan schedule:run >> /dev/null 2>&1
```

### Queue Worker (cPanel → Background Processes)

```
/usr/local/bin/php /home/user/laravel/api/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
```

Add `--daemon` flag is NOT recommended on shared VPS — use `--max-time` to auto-restart.

### Frontend Deployment

- [ ] Run `npm run build` locally (or on server if Node.js available)
- [ ] Upload contents of `/dist` to `public_html/` (the document root of `yourdomain.com`)
- [ ] Add `.htaccess` for SPA routing (see README)

### Post-deployment

- [ ] Test invitation flow end-to-end
- [ ] Test Paystack webhook (use Paystack dashboard test events)
- [ ] Verify FCM push notifications on Android device
- [ ] Verify receipt upload and signed URL access
- [ ] Verify scheduler by manually running `php artisan schedule:run`

---

## 16. Environment Variables Reference

### Backend `.env`

```env
# App
APP_NAME="Kingdom Fund Circle"
APP_ENV=production
APP_KEY=                          # php artisan key:generate
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kfc_db
DB_USERNAME=kfc_user
DB_PASSWORD=

# Queue
QUEUE_CONNECTION=database

# Mail (Brevo free SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=                    # Brevo login email
MAIL_PASSWORD=                    # Brevo SMTP key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Kingdom Fund Circle"

# Paystack
PAYSTACK_SECRET_KEY=sk_live_
PAYSTACK_PUBLIC_KEY=pk_live_
PAYSTACK_PREFERRED_BANK=wema-bank  # or titan-paystack

# Termii SMS
TERMII_API_KEY=
TERMII_SENDER_ID=KingdomFC
TERMII_BASE_URL=https://api.ng.termii.com/api

# Firebase FCM
FCM_PROJECT_ID=
FCM_SERVICE_ACCOUNT_PATH=storage/app/firebase-service-account.json

# Filesystem
FILESYSTEM_DISK=local

# Session / Sanctum
SESSION_DRIVER=cookie
SESSION_DOMAIN=.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
```

### Frontend `.env`

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME="Kingdom Fund Circle"
VITE_PAYSTACK_PUBLIC_KEY=pk_live_
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FCM_VAPID_KEY=
```

---

## 17. Development Phases & Roadmap

### Phase 1 — Foundation (Weeks 1–2)

**Goal:** Working auth, invitations, member registration

- [ ] Laravel project init + Sanctum setup
- [ ] CORS configured for React frontend
- [ ] Database migrations: users, invitations, wallets
- [ ] `AdminSeeder` — creates first admin account
- [ ] Invitation create + validate API endpoints
- [ ] Registration API endpoint (with invitation token validation)
- [ ] Login / logout API endpoints
- [ ] React project init (Vite + Tailwind)
- [ ] Login page
- [ ] Accept Invitation + Register pages
- [ ] Auth store (Zustand) + Axios interceptors
- [ ] Route guards (ProtectedRoute, AdminRoute, MemberRoute)

**Deliverable:** Admin can invite → member registers via link → member can log in

---

### Phase 2 — Paystack Wallets (Weeks 3–4)

**Goal:** Virtual accounts and wallet funding working

- [ ] `PaystackService` — createCustomer + createDedicatedVirtualAccount
- [ ] Wallet model + migration
- [ ] WalletTransaction model + migration
- [ ] `WalletService` — credit/debit with balance_before/after
- [ ] Webhook endpoint + `VerifyPaystackWebhook` middleware
- [ ] `charge.success` event handler
- [ ] Wallet page (frontend) — show virtual account, balance
- [ ] Transaction history list
- [ ] FCM setup (register token on login)
- [ ] Push notification on wallet credit

**Deliverable:** Member can see virtual account → transfer money → wallet balance updates instantly

---

### Phase 3 — Contributions (Weeks 5–6)

**Goal:** Package selection, contribution cycles, auto-debit

- [ ] ContributionPackage model + seeder (₦10k, ₦20k, ₦50k, ₦100k)
- [ ] ContributionCycle model
- [ ] Contribution model
- [ ] Onboarding page (package selection)
- [ ] `DebitMonthlyContributions` Job
- [ ] Laravel Scheduler configuration
- [ ] Queue worker setup
- [ ] `SendContributionReminder` Job (day 3, day 7)
- [ ] Dashboard page — wallet card, contribution status card, group stats
- [ ] My Contributions page
- [ ] Group Contributions page
- [ ] Admin contribution cycle management
- [ ] Admin: view paid/pending members per cycle
- [ ] Admin: trigger manual debit + send reminder

**Deliverable:** Monthly auto-debit runs on scheduler, members see their status, admin has full overview

---

### Phase 4 — Disbursements & Transparency (Week 7)

**Goal:** Admin records disbursements, members see transparency feed

- [ ] Disbursement model + migration
- [ ] Receipt upload (private disk)
- [ ] Disbursement create API (admin)
- [ ] Publish disbursement API
- [ ] Signed temporary URL for receipt
- [ ] `SendDisbursementNotification` Job
- [ ] Admin Disbursements page
- [ ] Member Disbursements page
- [ ] Receipt view (opens in new tab via signed URL)

**Deliverable:** Admin records and publishes disbursement with receipt → members see it and can view receipt

---

### Phase 5 — Meetings & Notifications (Week 8)

**Goal:** Meeting management, RSVP, full notification system

- [ ] Meeting + MeetingRsvp models
- [ ] Admin create/edit meeting API
- [ ] `SendMeetingNotification` Job
- [ ] `SendMeetingReminders` Job (scheduled hourly)
- [ ] Admin Meetings page (create, view RSVPs)
- [ ] Member Meetings page (view, RSVP)
- [ ] In-app Notifications model + API
- [ ] NotificationBell component (unread count, dropdown)
- [ ] Notifications page
- [ ] SMS integration (Termii) for critical notifications

**Deliverable:** Full notification system across email, SMS, FCM, in-app

---

### Phase 6 — Admin Tools & Reports (Week 9)

**Goal:** Full admin control, reports, audit trail

- [ ] AuditLog model — auto-log on all admin actions (Observer pattern)
- [ ] Admin Dashboard stats API
- [ ] Admin Members page (full CRUD)
- [ ] CSV export (League/csv package or Laravel Excel)
- [ ] PDF export (barryvdh/laravel-dompdf)
- [ ] Admin Reports page
- [ ] Admin Settings page (contribution day, app name, etc.)
- [ ] Admin 2FA (pragmarx/google2fa-laravel)

**Deliverable:** Admin has full reporting, audit trail, and 2FA security

---

### Phase 7 — PWA, Polish & Deployment (Week 10)

**Goal:** PWA installable, offline cache, production deployment

- [ ] vite-plugin-pwa configuration (manifest, workbox caching)
- [ ] App icons (192x192, 512x512, maskable)
- [ ] Offline fallback page
- [ ] Service worker for background FCM (firebase-messaging-sw.js)
- [ ] InstallPrompt component (detect beforeinstallprompt event)
- [ ] Mobile UI review + responsive fixes
- [ ] cPanel deployment (backend + frontend)
- [ ] Cron job + queue worker on cPanel
- [ ] AutoSSL enabled
- [ ] End-to-end testing (invitation → registration → wallet → debit → disbursement)
- [ ] Paystack webhook tested with live test events

**Deliverable:** Live, installable PWA on production VPS

---

### Suggested Laravel Packages

```bash
composer require laravel/sanctum              # Auth
composer require guzzlehttp/guzzle            # HTTP client (Paystack, FCM)
composer require pragmarx/google2fa-laravel   # Admin 2FA
composer require barryvdh/laravel-dompdf      # PDF reports
composer require league/csv                   # CSV export
```

### Suggested NPM Packages

```bash
npm install axios zustand react-router-dom
npm install firebase                          # FCM
npm install @tanstack/react-query             # Server state / caching
npm install react-hook-form zod               # Forms + validation
npm install vite-plugin-pwa workbox-window    # PWA
npm install date-fns                          # Date formatting
```

---

## Developer Notes

1. **Never allow direct editing of wallet_transactions** — this table is append-only. Enforce in model: `public $timestamps = false;` with only `created_at`, and override `save()` to block updates on existing records.

2. **Paystack virtual accounts require KYC** — ensure the Paystack business account is verified before going live. Test with Paystack test keys first.

3. **Queue worker must stay running** — on cPanel, use Background Processes. If the worker dies, jobs will queue up in the `jobs` table and fire when it restarts. Add alerting if `failed_jobs` table grows.

4. **cPanel PHP version** — confirm PHP 8.2+ is selected in MultiPHP Manager for both the API subdomain and CLI PHP (`php -v` via SSH).

5. **Frontend API URL** — bake `VITE_API_URL` at build time. If deploying to a staging subdomain, rebuild the frontend with the correct env value.

6. **Receipt storage on VPS** — the private disk path is `storage/app/private/`. On cPanel VPS this is under the user's home directory. Ensure disk quota is sufficient for receipt PDFs over time (~100KB–2MB per file).

7. **First admin account** — seed via `AdminSeeder` with a secure password. Force admin to change password and set up 2FA on first login.

8. **CORS** — `config/cors.php` → `allowed_origins` must be set to `FRONTEND_URL` only. Never use `'*'` in production.
