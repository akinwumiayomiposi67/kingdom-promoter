# Kingdom Fund Circle (KFC)

> Invitation-only Christian association contribution platform — transparent, wallet-based, mobile-first PWA.

---

## Overview

Kingdom Fund Circle is a **Progressive Web App (PWA)** that enables a closed group of Christian association members to:

- Contribute monthly to a shared fund via dedicated virtual accounts
- Track personal wallet balances and contribution history
- View group-level transparency reports, disbursement records, and receipts
- Receive notifications about meetings, payments, and fund activity

Only invited members can register. Admins manage the entire lifecycle from invitations to disbursements.

---

## Hosting — VPS cPanel (Zero Extra Infrastructure Cost)

This stack is intentionally chosen to run entirely on a standard **cPanel VPS** (Apache/Nginx + PHP + MySQL) with no paid cloud services.

| Layer              | Choice                          | Why                                                 |
| ------------------ | ------------------------------- | --------------------------------------------------- |
| Backend            | Laravel 11 (PHP 8.2+)           | Native on cPanel, no Node.js server needed          |
| Frontend           | React + Vite + Tailwind CSS     | Compiled to static files, served from `public_html` |
| Database           | MySQL                           | Built into cPanel, free                             |
| File Storage       | Laravel local disk (`storage/`) | No S3/Cloudinary cost                               |
| Email              | cPanel SMTP or Brevo free tier  | 300 emails/day free on Brevo                        |
| SMS                | Termii or Africa's Talking      | Pay-as-you-go, Nigerian numbers supported           |
| Push Notifications | Firebase Cloud Messaging        | Free tier, unlimited devices                        |
| Payments           | Paystack                        | Per-transaction fee only, no subscription           |
| PWA                | Vite PWA plugin                 | Service worker + manifest, installable on Android   |

---

## Tech Stack

```
Frontend     → React 18, Vite, Tailwind CSS, Zustand (state), Axios
Backend      → Laravel 11, Laravel Sanctum (auth), Laravel Queue (jobs)
Database     → MySQL 8 (cPanel)
Auth         → Invitation token + Sanctum SPA tokens
Storage      → Laravel local disk → public symlink
Email        → Laravel Mail → Brevo SMTP (free) or cPanel mail
SMS          → Termii HTTP API (or Africa's Talking)
Push         → Firebase Cloud Messaging (FCM)
Payments     → Paystack Dedicated Virtual Accounts + Webhooks
PWA          → vite-plugin-pwa (Workbox service worker)
```

---

## Project Structure

```
kingdom-promoter/
├── backend/                  # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Jobs/             # Queue jobs (debit, reminders, notifications)
│   │   └── Services/         # Paystack, FCM, Termii service classes
│   ├── database/migrations/
│   ├── routes/api.php
│   └── .env
│
├── frontend/                 # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/            # Zustand state
│   │   └── api/              # Axios API client
│   ├── public/
│   └── vite.config.js
│
└── README.md
```

---

## Quick Start (Local — XAMPP)

### Prerequisites

- XAMPP (PHP 8.2+, MySQL)
- Composer
- Node.js 20+
- Git

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Edit .env — set DB_DATABASE, DB_USERNAME, DB_PASSWORD (XAMPP defaults)
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The `.env` file is pre-configured for local development with `VITE_API_URL=http://localhost:8000`. For production, update the env vars as needed (see **Frontend .env** section below).

Open `http://localhost:5173` — the React app proxies API requests to the Laravel backend.

---

## Deployment on cPanel VPS

### 1. Backend (Laravel API — subdomain `api.yourdomain.com`)

1. Upload `/backend` to `/home/user/api.yourdomain.com/`
2. Set document root in cPanel → **Domains** → point `api.yourdomain.com` to `.../backend/public`
3. Create MySQL database in cPanel → update `.env`
4. SSH in and run:
   ```bash
   composer install --optimize-autoloader --no-dev
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache
   php artisan route:cache
   ```
5. Set up **cPanel Cron Job** for Laravel scheduler:
   ```
   * * * * * php /home/user/api.yourdomain.com/artisan schedule:run >> /dev/null 2>&1
   ```
6. Set up **Laravel Queue Worker** via cPanel → **Background Processes**:
   ```
   php /home/user/api.yourdomain.com/artisan queue:work --sleep=3 --tries=3
   ```

### 2. Frontend (React SPA — `yourdomain.com`)

```bash
cd frontend
npm run build
# Upload /dist contents to public_html/
```

Add `public_html/.htaccess` for client-side routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### 3. SSL

Enable **AutoSSL** in cPanel → free Let's Encrypt cert for both domains.

---

## Environment Variables

### Backend `.env` (key entries)

```env
APP_NAME="Kingdom Fund Circle"
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=kfc_db
DB_USERNAME=kfc_user
DB_PASSWORD=secret

MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your_brevo_login
MAIL_PASSWORD=your_brevo_api_key

PAYSTACK_SECRET_KEY=sk_live_xxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxx

TERMII_API_KEY=xxxx
TERMII_SENDER_ID=KingdomFC

FCM_SERVER_KEY=xxxx

QUEUE_CONNECTION=database
```

### Frontend `.env` (key entries)

```env
VITE_API_URL=http://localhost:8000          # Backend API root (no /api suffix)
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx       # From Paystack dashboard
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=1:xxxx:web:xxxx
VITE_FCM_VAPID_KEY=xxxx                     # From Firebase Cloud Messaging settings
```

### Frontend `.env`

```env
VITE_API_URL=https://api.yourdomain.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
VITE_FCM_VAPID_KEY=xxxx
```

---

## Key Features

- **Invitation-only registration** — token-based, expires after 7 days
- **Dedicated virtual accounts** — Paystack creates a unique bank account per member
- **Auto-debit** — Laravel scheduler debits wallets on contribution day
- **Transparency feed** — all members see group totals and disbursement receipts
- **PWA** — installable on Android, offline dashboard cache via service worker
- **Role-based access** — Member vs. Admin with middleware guards
- **Audit trail** — every wallet debit and disbursement is immutably logged
- **Meeting RSVP** — admin creates meetings, members RSVP

---

## Payment Flow (Paystack)

```
Member tops up wallet:
  Member → transfers to virtual bank account
        → Paystack webhook → POST /api/webhook/paystack
        → Laravel verifies signature
        → WalletTransaction created
        → Wallet balance updated
        → FCM push + email notification sent

Monthly debit (scheduler):
  Laravel scheduler (1st of month 8am) → DebitMonthlyContributions Job
        → foreach active member: if wallet >= pledge → debit wallet
        → Contribution record created (status: paid)
        → Notification dispatched
        → If insufficient → status: pending → reminder notifications queued
```

---

## Security

- Paystack webhook signature verification (`X-Paystack-Signature`)
- Sanctum SPA token auth (httpOnly cookies)
- Invitation tokens: SHA-256 hashed, single-use, 7-day TTL
- Admin 2FA via TOTP (Laravel Fortify or custom)
- CORS restricted to `FRONTEND_URL`
- Receipt uploads: MIME validation, stored outside `public/`, served via signed URLs
- No direct transaction history editing — append-only ledger model
- Rate limiting on auth endpoints

---

## Third-Party Services (All Free or Pay-per-use — No Subscriptions)

| Service               | Purpose                     | Cost Model           |
| --------------------- | --------------------------- | -------------------- |
| Paystack              | Virtual accounts + webhooks | % per transaction    |
| Brevo (ex-Sendinblue) | Transactional email         | Free 300/day         |
| Termii                | SMS (Nigeria)               | Pay per SMS          |
| Firebase FCM          | Push notifications          | Free                 |
| cPanel AutoSSL        | HTTPS                       | Free (Let's Encrypt) |

---

## License

Private — internal association use only.
