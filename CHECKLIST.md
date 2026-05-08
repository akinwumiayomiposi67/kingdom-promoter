# Kingdom Fund Circle — Development Checklist

Track all implementation tasks phase by phase. Check off items as they are completed.

---

## Phase 1 — Foundation (Auth, Invitations, Registration)

### Backend

- [x] Laravel 11 project created in `backend/`
- [x] Composer packages installed: sanctum, guzzle, google2fa-laravel, dompdf, league/csv
- [x] `config/paystack.php` created
- [x] `config/cors.php` — `allowed_origins` set to `FRONTEND_URL` only (not `*`)
- [x] Migration: `users` table with phone, role, status, fcm_token, two_factor_secret
- [x] Migration: `invitations` table (token stored as SHA-256 hash)
- [x] Migration: `jobs` table (queue table)
- [x] Migration: `failed_jobs` table
- [x] Model: `User` with helpers isAdmin(), isMember(), isActive()
- [x] Model: `Invitation` with scopePending, scopeValid
- [x] FormRequest: `ValidateInvitationRequest`
- [x] FormRequest: `RegisterRequest` with Nigerian phone validation
- [x] FormRequest: `LoginRequest`
- [x] Controller: `Auth/InvitationController@validate` — hashes token before DB query
- [x] Controller: `Auth/RegisterController@register` — validates token, creates user
- [x] Controller: `Auth/LoginController` — login, logout, me
- [x] Middleware: `AdminOnly` — returns 403 if not admin
- [x] Routes: `/invitation/validate`, `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
- [x] Seeder: `AdminSeeder` — creates first admin from .env vars
- [x] `.env.example` with all required keys documented

### Frontend

- [x] React + Vite project created in `frontend/`
- [x] Tailwind CSS configured
- [x] NPM packages installed: axios, zustand, react-router-dom, tanstack/react-query, react-hook-form, zod, date-fns
- [x] `src/api/axios.js` — Axios instance with auth interceptor, 401 → clear store + redirect
- [x] `src/store/authStore.js` — user, token, role stored in sessionStorage (NOT localStorage)
- [x] Route guards: ProtectedRoute, MemberRoute, AdminRoute
- [x] Page: `Login.jsx` — form with zod validation, redirects by role
- [x] Page: `AcceptInvitation.jsx` — reads token from URL, calls validate API
- [x] Page: `Register.jsx` — pre-fills from query params, calls register API
- [x] `src/utils/formatCurrency.js` — ₦ formatter using Intl.NumberFormat
- [x] `App.jsx` — all routes defined with guards
- [x] `frontend/.env.example` with all VITE\_ keys

### Verification

- [x] `php artisan migrate --seed` runs without error
- [x] Invalid invitation token → 422
- [x] Register without token → 422
- [x] Login returns `{ success, data: { token, user, role } }`
- [x] Login with wrong password → 401
- [x] `GET /auth/me` with valid Bearer → returns user
- [x] React app loads on `npm run dev`
- [x] Successful login redirects correctly by role

---

## Phase 2 — Wallets & Paystack

### Backend

- [x] Migration: `wallets` table
- [x] Migration: `wallet_transactions` table (created_at ONLY — no updated_at)
- [x] Migration: `audit_logs` table (created_at ONLY)
- [x] Model: `Wallet` with relationships
- [x] Model: `WalletTransaction` — `save()` throws on existing records (immutable)
- [x] Model: `AuditLog` with static `log()` helper
- [x] Service: `PaystackService` — createCustomer, createDedicatedVirtualAccount
- [x] Service: `WalletService` — credit() and debit() with DB locks and balance_before/after
- [x] Exception: `InsufficientBalanceException`
- [x] Middleware: `VerifyPaystackWebhook` — HMAC SHA-512 verification
- [x] Controller: `Webhook/PaystackWebhookController` — returns 200, dispatches job
- [x] Job: `ProcessPaystackWebhook` — handles charge.success, idempotent (checks reference uniqueness)
- [x] `RegisterController` updated — creates Paystack customer + virtual account on registration
- [x] Controller: `Member/WalletController` — show, transactions, storeFcmToken
- [x] Route: `POST /webhook/paystack` — EXCLUDED from Sanctum middleware group
- [x] Routes: `/member/wallet`, `/member/transactions`, `/member/fcm-token`

### Frontend

- [x] `src/api/wallet.js` — getWallet, getTransactions, storeFcmToken
- [x] `src/store/walletStore.js` — Zustand wallet state
- [x] `src/firebase.js` — Firebase app initialized
- [x] `src/hooks/useFcm.js` — token registration on login, graceful permission denial
- [x] Page: `Wallet.jsx` — virtual account card (copyable), balance, transactions table
- [x] Dashboard: wallet balance card with virtual account details

### Verification

- [x] Webhook with invalid signature → 400
- [x] Webhook with valid signature + charge.success → wallet credited
- [x] Same reference sent twice → second request ignored (idempotent)
- [x] `WalletTransaction.save()` on existing record → RuntimeException
- [x] Wallet page renders virtual account number with copy button
- [x] FCM token saved via `useFcm` hook

---

## Phase 3 — Contributions

### Backend

- [x] Migration: `contribution_packages` table
- [x] Migration: `contribution_cycles` table
- [x] Migration: `contributions` table
- [x] Model: `ContributionPackage` with scopeActive
- [x] Model: `ContributionCycle` with helpers
- [x] Model: `Contribution` with all relationships
- [x] Seeder: `ContributionPackageSeeder` — 4 packages (Bronze/Silver/Gold/Diamond)
- [x] FormRequest: `SetPackageRequest`
- [x] FormRequest: `CreateCycleRequest`
- [x] Controller: `Member/ContributionController` — setPackage, myContributions, groupContributions
- [x] Controller: `Admin/ContributionCycleController` — index, store, summary, triggerDebit, sendReminders
- [x] Controller: `Admin/PackageController` — CRUD
- [x] Job: `DebitMonthlyContributions` — per-member DB transaction, checks if already paid
- [x] Job: `SendContributionReminder` — email + SMS + FCM + in-app notification
- [x] Mail: `ContributionReminderMail` — includes virtual account for funding
- [x] Service: `SmsService` (Termii) — phone normalization, silent failure
- [x] Scheduler: debit on debit_day, reminders on day+3 and day+7

### Frontend

- [x] `src/api/contributions.js`
- [x] Page: `Onboarding.jsx` — package selection cards
- [x] Page: `MyContributions.jsx` — table with status badges
- [x] Page: `GroupContributions.jsx` — monthly cards
- [x] Dashboard: contribution status card, group stats card
- [x] Component: `Badge.jsx` — colored status pill

### Verification

- [x] Package seeder creates 4 packages
- [x] `POST /member/package` saves contribution for current active cycle
- [x] Debit job marks paid members and sends confirmation
- [x] Debit job skips already-paid members (idempotent)
- [x] Pending members get reminder notification
- [x] SMS failure is logged but doesn't break wallet debit
- [x] Onboarding completes and redirects to dashboard

---

## Phase 4 — Disbursements

### Backend

- [x] Migration: `disbursements` table
- [x] Model: `Disbursement` with scopePublished, isPublished()
- [x] `config/filesystems.php` — private disk configured
- [x] FormRequest: `StoreDisbursementRequest` — receipt MIME + size validation
- [x] Controller: `Admin/DisbursementController` — index, store, update, publish, receipt
- [x] Controller: `Member/DisbursementController` — index (published only), receipt
- [x] Controller: `PrivateFileController` — HMAC signed URL file server
- [x] Signed URL generation — 15-minute TTL, HMAC-SHA256, path-based
- [x] Job: `SendDisbursementNotification` — FCM + email + in-app to all active members
- [x] Mail: `DisbursementPublishedMail`
- [x] Observer: `DisbursementObserver` — AuditLog on publish
- [x] Receipts stored in `storage/app/private/receipts/{year}/{month}/`

### Frontend

- [x] `src/api/disbursements.js`
- [x] Page: `member/Disbursements.jsx` — published cards + "View Receipt" button
- [x] Page: `admin/Disbursements.jsx` — table, create modal, publish action
- [x] "View Receipt" opens signed URL in new tab
- [x] File input accepts PDF, JPG, PNG only
- [x] Dashboard: last disbursement card (member) + undisbursed cycle alert (admin)

### Verification

- [x] Receipt file stored in private disk (not public)
- [x] Signed URL expires after 15 minutes
- [x] Expired URL → 403 or 410
- [x] Member cannot access unpublished disbursement → 404
- [x] Publishing dispatches notification to all members
- [x] Admin form uploads via multipart/form-data correctly

---

## Phase 5 — Meetings & Notifications

### Backend

- [x] Migration: `meetings` table
- [x] Migration: `meeting_rsvps` table (UNIQUE meeting_id + user_id)
- [x] Migration: `notifications` table (created_at only)
- [x] Model: `Meeting` with attendingCount(), isUpcoming()
- [x] Model: `MeetingRsvp`
- [x] Model: `Notification` — timestamps = false, scopeUnread
- [x] FormRequest: `StoreMeetingRequest`
- [x] FormRequest: `RsvpRequest`
- [x] Controller: `Admin/MeetingController` — CRUD + rsvps
- [x] Controller: `Member/MeetingController` — index, rsvp (updateOrCreate)
- [x] Controller: `Member/NotificationController` — index, markRead, unreadCount
- [x] Job: `SendMeetingNotification` — FCM + email + in-app
- [x] Job: `SendMeetingReminders` — runs hourly, targets meetings tomorrow
- [x] Service: `FcmService` — HTTP v1 API, service account JWT, 55-minute cache
- [x] Mail: `MeetingCreatedMail`
- [x] Scheduler: `SendMeetingReminders` runs hourly

### Frontend

- [x] `src/api/meetings.js`
- [x] `src/store/notificationStore.js` — unread count
- [x] Component: `NotificationBell.jsx` — dropdown, unread badge, 60s poll
- [x] Page: `member/Meetings.jsx` — upcoming + past, RSVP buttons, responds to current state
- [x] Page: `member/Notifications.jsx` — paginated list, mark all read
- [x] Page: `admin/Meetings.jsx` — create modal, RSVP view modal
- [x] `public/firebase-messaging-sw.js` — background FCM messages

### Verification

- [x] Admin creates meeting → members get in-app notification
- [x] Unread count reflects actual unread notifications
- [x] RSVP update is idempotent (no duplicates)
- [x] Meeting reminder only fires for meetings tomorrow
- [x] FCM JWT is cached (check logs — no repeated auth calls)
- [x] Background FCM shows OS push notification on Android

---

## Phase 6 — Admin Tools, 2FA & Reports

### Backend

- [x] Controller: `Auth/TwoFactorController` — setup, enable, verify
- [x] Middleware: `TwoFactorVerified` — checks session 2fa_verified
- [x] 2FA applied to all admin mutation routes
- [x] Controller: `Admin/MemberController` — full CRUD (index, show, updateStatus, updatePackage, resendInvitation)
- [x] Controller: `Admin/DashboardController` — all stats + failed_jobs_count
- [x] Controller: `Admin/WalletController` — all transactions, manualDebit
- [x] Controller: `Admin/ReportController` — contributions CSV, contributions PDF, wallets CSV
- [x] Blade template: `resources/views/reports/contributions.blade.php` — inline styles for dompdf
- [x] AuditLog entries: wallet debit, manual debit, disbursement publish, member status change
- [x] Admin member search + status filter

### Frontend

- [x] `src/api/admin.js` — all admin API methods
- [x] Page: `admin/AdminDashboard.jsx` — stats cards, monthly breakdown, recent transactions
- [x] Page: `admin/Members.jsx` — search, filter tabs, table, suspend/activate, change package
- [x] Page: `admin/Reports.jsx` — month/year pickers, CSV + PDF download
- [x] Page: `admin/Settings.jsx` — 2FA QR setup section
- [x] Page: `admin/TwoFactorVerify.jsx` — OTP input gate
- [x] `AdminRoute.jsx` — redirects to 2FA verify if not verified in session
- [x] Warning banner on dashboard for failed_jobs > 0

### Verification

- [x] Admin can scan QR code and enable 2FA
- [x] Admin mutation endpoint → 403 without 2FA session
- [x] CSV export downloads correct file
- [x] PDF export renders with correct data
- [x] Manual wallet debit creates AuditLog with admin as actor
- [x] Member suspension notifies the member

---

## Phase 7 — PWA & Deployment

### Frontend

- [x] `vite-plugin-pwa` and `workbox-window` installed
- [x] `vite.config.js` — full PWA config with manifest and Workbox runtime caching
- [x] App icons created (72, 96, 128, 192, 512, maskable) in `public/icons/`
- [x] `public/firebase-messaging-sw.js` — with placeholder injection script
- [x] `scripts/inject-sw-config.js` — replaces Firebase config in SW before build
- [x] `package.json` build script runs inject script before vite build
- [x] Component: `InstallPrompt.jsx` — shows on mobile, 7-day dismiss
- [x] `public/offline.html` — branded offline fallback page
- [x] `src/hooks/useOfflineCache.js` — useOnlineStatus hook
- [x] Offline banner in layouts
- [x] Bottom navigation for mobile member view
- [x] Responsive admin sidebar (collapsible on mobile)
- [x] Tailwind: primary `#1a3c6e`, accent `#f59e0b`

### Backend (Hardening)

- [x] `backend/public/.htaccess` — Laravel default present
- [x] Production env documented in `.env.production.example`
- [x] `storage/` and `bootstrap/cache/` writable (775)

### Deployment Scripts

- [x] `scripts/deploy-backend.sh` — SSH deployment script
- [x] `scripts/deploy-frontend.sh` — local build + inject script
- [x] `public_html/.htaccess` — SPA routing + security headers

### cPanel Setup Checklist

- [x] PHP 8.2+ selected in MultiPHP Manager
- [x] MySQL database + user created
- [x] `api.yourdomain.com` subdomain document root → `backend/public`
- [x] AutoSSL enabled for both domains
- [x] Cron job set: `* * * * * php artisan schedule:run`
- [x] Background process set: `php artisan queue:work database --sleep=3 --tries=3 --max-time=3600`
- [x] `php artisan storage:link` run on server
- [x] `php artisan migrate --force` run on server
- [x] `php artisan db:seed --class=AdminSeeder` run once

### Verification

- [x] `npm run build` completes without errors
- [x] Chrome DevTools → Application → Manifest correct
- [x] "Add to Home Screen" prompt appears on Android
- [x] Installed PWA opens in standalone mode
- [x] Dashboard loads from cache when offline
- [x] Wallet page shows error (no cache) when offline
- [x] FCM push received as OS notification (background)
- [x] Backend deploy script runs cleanly via SSH
- [x] SPA routing works (no 404 on page refresh)
- [x] HTTP redirects to HTTPS on both domains

---

## Security Final Review

- [x] No `localStorage` usage for auth tokens — sessionStorage or memory only
- [x] `CORS allowed_origins` is `FRONTEND_URL` — not `*`
- [x] Paystack webhook signature verified on every request
- [x] All receipt files in private disk, never public
- [x] Invitation tokens stored as SHA-256 hash — raw token never persisted
- [x] Rate limiting active on `/auth/login` and `/invitation/validate`
- [x] Admin 2FA enforced on all mutation routes
- [x] `WalletTransaction::save()` throws on existing records
- [x] File upload MIME type validated (mimes:pdf,jpg,jpeg,png, max 5MB)
- [x] No hardcoded API keys anywhere in codebase
- [x] `APP_DEBUG=false` in production `.env`
- [x] `php artisan config:cache` run — no env exposure via `/telescope` or similar
- [x] `failed_jobs` table monitored — admin alerted in dashboard

---

## Post-Launch

- [x] Paystack business account KYC verified (required for live virtual accounts)
- [x] Brevo SMTP domain verified (SPF + DKIM records in cPanel DNS)
- [x] Termii sender ID `KingdomFC` registered
- [x] Firebase project FCM VAPID key added to frontend `.env`
- [x] First admin password changed from seed value
- [x] Admin 2FA enabled for first admin account
- [x] Test full invitation flow end-to-end with real email
- [x] Test Paystack virtual account transfer (₦100 test)
- [x] Test monthly debit scheduler: `php artisan schedule:run` manually
- [x] Test FCM push notification on Android device
