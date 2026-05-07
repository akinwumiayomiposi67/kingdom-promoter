# Kingdom Fund Circle — Development Checklist

Track all implementation tasks phase by phase. Check off items as they are completed.

---

## Phase 1 — Foundation (Auth, Invitations, Registration)

### Backend

- [ ] Laravel 11 project created in `backend/`
- [ ] Composer packages installed: sanctum, guzzle, google2fa-laravel, dompdf, league/csv
- [ ] `config/paystack.php` created
- [ ] `config/cors.php` — `allowed_origins` set to `FRONTEND_URL` only (not `*`)
- [ ] Migration: `users` table with phone, role, status, fcm_token, two_factor_secret
- [ ] Migration: `invitations` table (token stored as SHA-256 hash)
- [ ] Migration: `jobs` table (queue table)
- [ ] Migration: `failed_jobs` table
- [ ] Model: `User` with helpers isAdmin(), isMember(), isActive()
- [ ] Model: `Invitation` with scopePending, scopeValid
- [ ] FormRequest: `ValidateInvitationRequest`
- [ ] FormRequest: `RegisterRequest` with Nigerian phone validation
- [ ] FormRequest: `LoginRequest`
- [ ] Controller: `Auth/InvitationController@validate` — hashes token before DB query
- [ ] Controller: `Auth/RegisterController@register` — validates token, creates user
- [ ] Controller: `Auth/LoginController` — login, logout, me
- [ ] Middleware: `AdminOnly` — returns 403 if not admin
- [ ] Routes: `/invitation/validate`, `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`
- [ ] Seeder: `AdminSeeder` — creates first admin from .env vars
- [ ] `.env.example` with all required keys documented

### Frontend

- [ ] React + Vite project created in `frontend/`
- [ ] Tailwind CSS configured
- [ ] NPM packages installed: axios, zustand, react-router-dom, tanstack/react-query, react-hook-form, zod, date-fns
- [ ] `src/api/axios.js` — Axios instance with auth interceptor, 401 → clear store + redirect
- [ ] `src/store/authStore.js` — user, token, role stored in sessionStorage (NOT localStorage)
- [ ] Route guards: ProtectedRoute, MemberRoute, AdminRoute
- [ ] Page: `Login.jsx` — form with zod validation, redirects by role
- [ ] Page: `AcceptInvitation.jsx` — reads token from URL, calls validate API
- [ ] Page: `Register.jsx` — pre-fills from query params, calls register API
- [ ] `src/utils/formatCurrency.js` — ₦ formatter using Intl.NumberFormat
- [ ] `App.jsx` — all routes defined with guards
- [ ] `frontend/.env.example` with all VITE\_ keys

### Verification

- [ ] `php artisan migrate --seed` runs without error
- [ ] Invalid invitation token → 422
- [ ] Register without token → 422
- [ ] Login returns `{ success, data: { token, user, role } }`
- [ ] Login with wrong password → 401
- [ ] `GET /auth/me` with valid Bearer → returns user
- [ ] React app loads on `npm run dev`
- [ ] Successful login redirects correctly by role

---

## Phase 2 — Wallets & Paystack

### Backend

- [ ] Migration: `wallets` table
- [ ] Migration: `wallet_transactions` table (created_at ONLY — no updated_at)
- [ ] Migration: `audit_logs` table (created_at ONLY)
- [ ] Model: `Wallet` with relationships
- [ ] Model: `WalletTransaction` — `save()` throws on existing records (immutable)
- [ ] Model: `AuditLog` with static `log()` helper
- [ ] Service: `PaystackService` — createCustomer, createDedicatedVirtualAccount
- [ ] Service: `WalletService` — credit() and debit() with DB locks and balance_before/after
- [ ] Exception: `InsufficientBalanceException`
- [ ] Middleware: `VerifyPaystackWebhook` — HMAC SHA-512 verification
- [ ] Controller: `Webhook/PaystackWebhookController` — returns 200, dispatches job
- [ ] Job: `ProcessPaystackWebhook` — handles charge.success, idempotent (checks reference uniqueness)
- [ ] `RegisterController` updated — creates Paystack customer + virtual account on registration
- [ ] Controller: `Member/WalletController` — show, transactions, storeFcmToken
- [ ] Route: `POST /webhook/paystack` — EXCLUDED from Sanctum middleware group
- [ ] Routes: `/member/wallet`, `/member/transactions`, `/member/fcm-token`

### Frontend

- [ ] `src/api/wallet.js` — getWallet, getTransactions, storeFcmToken
- [ ] `src/store/walletStore.js` — Zustand wallet state
- [ ] `src/firebase.js` — Firebase app initialized
- [ ] `src/hooks/useFcm.js` — token registration on login, graceful permission denial
- [ ] Page: `Wallet.jsx` — virtual account card (copyable), balance, transactions table
- [ ] Dashboard: wallet balance card with virtual account details

### Verification

- [ ] Webhook with invalid signature → 400
- [ ] Webhook with valid signature + charge.success → wallet credited
- [ ] Same reference sent twice → second request ignored (idempotent)
- [ ] `WalletTransaction.save()` on existing record → RuntimeException
- [ ] Wallet page renders virtual account number with copy button
- [ ] FCM token saved via `useFcm` hook

---

## Phase 3 — Contributions

### Backend

- [ ] Migration: `contribution_packages` table
- [ ] Migration: `contribution_cycles` table
- [ ] Migration: `contributions` table
- [ ] Model: `ContributionPackage` with scopeActive
- [ ] Model: `ContributionCycle` with helpers
- [ ] Model: `Contribution` with all relationships
- [ ] Seeder: `ContributionPackageSeeder` — 4 packages (Bronze/Silver/Gold/Diamond)
- [ ] FormRequest: `SetPackageRequest`
- [ ] FormRequest: `CreateCycleRequest`
- [ ] Controller: `Member/ContributionController` — setPackage, myContributions, groupContributions
- [ ] Controller: `Admin/ContributionCycleController` — index, store, summary, triggerDebit, sendReminders
- [ ] Controller: `Admin/PackageController` — CRUD
- [ ] Job: `DebitMonthlyContributions` — per-member DB transaction, checks if already paid
- [ ] Job: `SendContributionReminder` — email + SMS + FCM + in-app notification
- [ ] Mail: `ContributionReminderMail` — includes virtual account for funding
- [ ] Service: `SmsService` (Termii) — phone normalization, silent failure
- [ ] Scheduler: debit on debit_day, reminders on day+3 and day+7

### Frontend

- [ ] `src/api/contributions.js`
- [ ] Page: `Onboarding.jsx` — package selection cards
- [ ] Page: `MyContributions.jsx` — table with status badges
- [ ] Page: `GroupContributions.jsx` — monthly cards
- [ ] Dashboard: contribution status card, group stats card
- [ ] Component: `Badge.jsx` — colored status pill

### Verification

- [ ] Package seeder creates 4 packages
- [ ] `POST /member/package` saves contribution for current active cycle
- [ ] Debit job marks paid members and sends confirmation
- [ ] Debit job skips already-paid members (idempotent)
- [ ] Pending members get reminder notification
- [ ] SMS failure is logged but doesn't break wallet debit
- [ ] Onboarding completes and redirects to dashboard

---

## Phase 4 — Disbursements

### Backend

- [ ] Migration: `disbursements` table
- [ ] Model: `Disbursement` with scopePublished, isPublished()
- [ ] `config/filesystems.php` — private disk configured
- [ ] FormRequest: `StoreDisbursementRequest` — receipt MIME + size validation
- [ ] Controller: `Admin/DisbursementController` — index, store, update, publish, receipt
- [ ] Controller: `Member/DisbursementController` — index (published only), receipt
- [ ] Controller: `PrivateFileController` — HMAC signed URL file server
- [ ] Signed URL generation — 15-minute TTL, HMAC-SHA256, path-based
- [ ] Job: `SendDisbursementNotification` — FCM + email + in-app to all active members
- [ ] Mail: `DisbursementPublishedMail`
- [ ] Observer: `DisbursementObserver` — AuditLog on publish
- [ ] Receipts stored in `storage/app/private/receipts/{year}/{month}/`

### Frontend

- [ ] `src/api/disbursements.js`
- [ ] Page: `member/Disbursements.jsx` — published cards + "View Receipt" button
- [ ] Page: `admin/Disbursements.jsx` — table, create modal, publish action
- [ ] "View Receipt" opens signed URL in new tab
- [ ] File input accepts PDF, JPG, PNG only
- [ ] Dashboard: last disbursement card (member) + undisbursed cycle alert (admin)

### Verification

- [ ] Receipt file stored in private disk (not public)
- [ ] Signed URL expires after 15 minutes
- [ ] Expired URL → 403 or 410
- [ ] Member cannot access unpublished disbursement → 404
- [ ] Publishing dispatches notification to all members
- [ ] Admin form uploads via multipart/form-data correctly

---

## Phase 5 — Meetings & Notifications

### Backend

- [ ] Migration: `meetings` table
- [ ] Migration: `meeting_rsvps` table (UNIQUE meeting_id + user_id)
- [ ] Migration: `notifications` table (created_at only)
- [ ] Model: `Meeting` with attendingCount(), isUpcoming()
- [ ] Model: `MeetingRsvp`
- [ ] Model: `Notification` — timestamps = false, scopeUnread
- [ ] FormRequest: `StoreMeetingRequest`
- [ ] FormRequest: `RsvpRequest`
- [ ] Controller: `Admin/MeetingController` — CRUD + rsvps
- [ ] Controller: `Member/MeetingController` — index, rsvp (updateOrCreate)
- [ ] Controller: `Member/NotificationController` — index, markRead, unreadCount
- [ ] Job: `SendMeetingNotification` — FCM + email + in-app
- [ ] Job: `SendMeetingReminders` — runs hourly, targets meetings tomorrow
- [ ] Service: `FcmService` — HTTP v1 API, service account JWT, 55-minute cache
- [ ] Mail: `MeetingCreatedMail`
- [ ] Scheduler: `SendMeetingReminders` runs hourly

### Frontend

- [ ] `src/api/meetings.js`
- [ ] `src/store/notificationStore.js` — unread count
- [ ] Component: `NotificationBell.jsx` — dropdown, unread badge, 60s poll
- [ ] Page: `member/Meetings.jsx` — upcoming + past, RSVP buttons, responds to current state
- [ ] Page: `member/Notifications.jsx` — paginated list, mark all read
- [ ] Page: `admin/Meetings.jsx` — create modal, RSVP view modal
- [ ] `public/firebase-messaging-sw.js` — background FCM messages

### Verification

- [ ] Admin creates meeting → members get in-app notification
- [ ] Unread count reflects actual unread notifications
- [ ] RSVP update is idempotent (no duplicates)
- [ ] Meeting reminder only fires for meetings tomorrow
- [ ] FCM JWT is cached (check logs — no repeated auth calls)
- [ ] Background FCM shows OS push notification on Android

---

## Phase 6 — Admin Tools, 2FA & Reports

### Backend

- [ ] Controller: `Auth/TwoFactorController` — setup, enable, verify
- [ ] Middleware: `TwoFactorVerified` — checks session 2fa_verified
- [ ] 2FA applied to all admin mutation routes
- [ ] Controller: `Admin/MemberController` — full CRUD (index, show, updateStatus, updatePackage, resendInvitation)
- [ ] Controller: `Admin/DashboardController` — all stats + failed_jobs_count
- [ ] Controller: `Admin/WalletController` — all transactions, manualDebit
- [ ] Controller: `Admin/ReportController` — contributions CSV, contributions PDF, wallets CSV
- [ ] Blade template: `resources/views/reports/contributions.blade.php` — inline styles for dompdf
- [ ] AuditLog entries: wallet debit, manual debit, disbursement publish, member status change
- [ ] Admin member search + status filter

### Frontend

- [ ] `src/api/admin.js` — all admin API methods
- [ ] Page: `admin/AdminDashboard.jsx` — stats cards, monthly breakdown, recent transactions
- [ ] Page: `admin/Members.jsx` — search, filter tabs, table, suspend/activate, change package
- [ ] Page: `admin/Reports.jsx` — month/year pickers, CSV + PDF download
- [ ] Page: `admin/Settings.jsx` — 2FA QR setup section
- [ ] Page: `admin/TwoFactorVerify.jsx` — OTP input gate
- [ ] `AdminRoute.jsx` — redirects to 2FA verify if not verified in session
- [ ] Warning banner on dashboard for failed_jobs > 0

### Verification

- [ ] Admin can scan QR code and enable 2FA
- [ ] Admin mutation endpoint → 403 without 2FA session
- [ ] CSV export downloads correct file
- [ ] PDF export renders with correct data
- [ ] Manual wallet debit creates AuditLog with admin as actor
- [ ] Member suspension notifies the member

---

## Phase 7 — PWA & Deployment

### Frontend

- [ ] `vite-plugin-pwa` and `workbox-window` installed
- [ ] `vite.config.js` — full PWA config with manifest and Workbox runtime caching
- [ ] App icons created (72, 96, 128, 192, 512, maskable) in `public/icons/`
- [ ] `public/firebase-messaging-sw.js` — with placeholder injection script
- [ ] `scripts/inject-sw-config.js` — replaces Firebase config in SW before build
- [ ] `package.json` build script runs inject script before vite build
- [ ] Component: `InstallPrompt.jsx` — shows on mobile, 7-day dismiss
- [ ] `public/offline.html` — branded offline fallback page
- [ ] `src/hooks/useOfflineCache.js` — useOnlineStatus hook
- [ ] Offline banner in layouts
- [ ] Bottom navigation for mobile member view
- [ ] Responsive admin sidebar (collapsible on mobile)
- [ ] Tailwind: primary `#1a3c6e`, accent `#f59e0b`

### Backend (Hardening)

- [ ] `backend/public/.htaccess` — Laravel default present
- [ ] Production env documented in `.env.production.example`
- [ ] `storage/` and `bootstrap/cache/` writable (775)

### Deployment Scripts

- [ ] `scripts/deploy-backend.sh` — SSH deployment script
- [ ] `scripts/deploy-frontend.sh` — local build + inject script
- [ ] `public_html/.htaccess` — SPA routing + security headers

### cPanel Setup Checklist

- [ ] PHP 8.2+ selected in MultiPHP Manager
- [ ] MySQL database + user created
- [ ] `api.yourdomain.com` subdomain document root → `backend/public`
- [ ] AutoSSL enabled for both domains
- [ ] Cron job set: `* * * * * php artisan schedule:run`
- [ ] Background process set: `php artisan queue:work database --sleep=3 --tries=3 --max-time=3600`
- [ ] `php artisan storage:link` run on server
- [ ] `php artisan migrate --force` run on server
- [ ] `php artisan db:seed --class=AdminSeeder` run once

### Verification

- [ ] `npm run build` completes without errors
- [ ] Chrome DevTools → Application → Manifest correct
- [ ] "Add to Home Screen" prompt appears on Android
- [ ] Installed PWA opens in standalone mode
- [ ] Dashboard loads from cache when offline
- [ ] Wallet page shows error (no cache) when offline
- [ ] FCM push received as OS notification (background)
- [ ] Backend deploy script runs cleanly via SSH
- [ ] SPA routing works (no 404 on page refresh)
- [ ] HTTP redirects to HTTPS on both domains

---

## Security Final Review

- [ ] No `localStorage` usage for auth tokens — sessionStorage or memory only
- [ ] `CORS allowed_origins` is `FRONTEND_URL` — not `*`
- [ ] Paystack webhook signature verified on every request
- [ ] All receipt files in private disk, never public
- [ ] Invitation tokens stored as SHA-256 hash — raw token never persisted
- [ ] Rate limiting active on `/auth/login` and `/invitation/validate`
- [ ] Admin 2FA enforced on all mutation routes
- [ ] `WalletTransaction::save()` throws on existing records
- [ ] File upload MIME type validated (mimes:pdf,jpg,jpeg,png, max 5MB)
- [ ] No hardcoded API keys anywhere in codebase
- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `php artisan config:cache` run — no env exposure via `/telescope` or similar
- [ ] `failed_jobs` table monitored — admin alerted in dashboard

---

## Post-Launch

- [ ] Paystack business account KYC verified (required for live virtual accounts)
- [ ] Brevo SMTP domain verified (SPF + DKIM records in cPanel DNS)
- [ ] Termii sender ID `KingdomFC` registered
- [ ] Firebase project FCM VAPID key added to frontend `.env`
- [ ] First admin password changed from seed value
- [ ] Admin 2FA enabled for first admin account
- [ ] Test full invitation flow end-to-end with real email
- [ ] Test Paystack virtual account transfer (₦100 test)
- [ ] Test monthly debit scheduler: `php artisan schedule:run` manually
- [ ] Test FCM push notification on Android device
