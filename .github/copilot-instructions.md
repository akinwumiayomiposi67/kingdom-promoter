# Kingdom Fund Circle — Copilot Workspace Instructions

## Project Identity

**App:** Kingdom Fund Circle (KFC)
**Type:** Invitation-only PWA — Christian association monthly contribution platform
**Stack:** Laravel 11 (API) + React 18 + Vite (SPA) + MySQL (cPanel VPS)
**Repo layout:** Two top-level folders: `backend/` (Laravel) and `frontend/` (React)

---

## Absolute Constraints — Never Violate

1. **No public registration.** Every user MUST arrive via a valid, non-expired invitation token. The `/api/auth/register` endpoint must reject requests without a valid token.
2. **Append-only wallet ledger.** `wallet_transactions` rows are NEVER updated or deleted. All debit/credit goes through `WalletService`. Direct `update()` or `delete()` on `WalletTransaction` model is forbidden.
3. **Receipts are private.** Disbursement receipt files are stored in the `private` disk (`storage/app/private/`), never in `public/`. Access is only via Laravel signed temporary URLs (15-minute TTL).
4. **No Redis, no Docker, no Node.js server process on production.** The backend is pure PHP served by Apache/cPanel. Queue driver is `database`. No `redis`, `beanstalkd`, or `horizon`.
5. **No paid SaaS subscriptions.** Use Brevo free SMTP, Firebase FCM free tier, Termii pay-per-SMS, Paystack pay-per-transaction. Do not introduce any service with a monthly subscription fee.
6. **Paystack webhook signature must be verified** on every inbound request to `/api/webhook/paystack` using HMAC SHA-512 against `PAYSTACK_SECRET_KEY` before any processing.

---

## Tech Stack Reference

| Layer       | Technology                       | Version                    |
| ----------- | -------------------------------- | -------------------------- |
| Backend     | Laravel                          | 11                         |
| PHP         | PHP                              | 8.2+                       |
| Auth        | Laravel Sanctum                  | token mode (Bearer)        |
| Frontend    | React + Vite                     | React 18, Vite 5           |
| CSS         | Tailwind CSS                     | 3.x                        |
| State       | Zustand                          | latest                     |
| HTTP        | Axios                            | latest                     |
| Router      | React Router                     | v6                         |
| PWA         | vite-plugin-pwa + Workbox        | latest                     |
| Database    | MySQL                            | 8 (cPanel)                 |
| Queue       | Laravel Queue                    | database driver            |
| Email       | Laravel Mail → Brevo SMTP        | —                          |
| SMS         | Termii HTTP API                  | —                          |
| Push        | Firebase Cloud Messaging         | v1 HTTP API                |
| Payments    | Paystack                         | Dedicated Virtual Accounts |
| PDF         | barryvdh/laravel-dompdf          | —                          |
| CSV         | league/csv                       | —                          |
| 2FA         | pragmarx/google2fa-laravel       | —                          |
| HTTP Client | Guzzle (via Laravel Http facade) | —                          |

---

## Backend Conventions (Laravel)

### Folder responsibilities

- `app/Http/Controllers/Auth/` — invitation validation, register, login, logout, 2FA
- `app/Http/Controllers/Member/` — all member-facing endpoints
- `app/Http/Controllers/Admin/` — all admin-facing endpoints
- `app/Http/Controllers/Webhook/` — Paystack webhook only
- `app/Services/` — `PaystackService`, `WalletService`, `FcmService`, `SmsService`
- `app/Jobs/` — all queued background jobs
- `app/Mail/` — Mailable classes (always queued via `->queue()`)

### Models

- All monetary amounts stored as `decimal(15,2)`. Never use `float` or `integer` for money.
- `WalletTransaction` — no `updated_at` column. Override `save()` to abort on existing records. Only `create()` is allowed.
- Use Eloquent model events (observers) to write to `audit_logs` for: wallet debits, disbursement publishes, member status changes.

### API responses

Always return JSON. Use consistent structure:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "errors": { ... } }
```

Use Laravel's `JsonResponse` — never `echo` or `print`.

### Authentication

- All member and admin routes protected by `auth:sanctum` middleware.
- Admin routes additionally protected by `AdminOnly` middleware (checks `user->role === 'admin'`).
- Admin routes that mutate data also require `TwoFactorVerified` middleware (checks session `2fa_verified`).
- Invitation token validation: always hash the raw token with `hash('sha256', $rawToken)` before querying DB.

### Form Requests

Use dedicated `FormRequest` classes for every endpoint that accepts input. Never validate inside controller methods directly.

### Error handling

- Return `422` for validation errors (Laravel default).
- Return `403` for permission errors.
- Return `404` for not found.
- Webhook endpoint always returns `200` immediately — process in a queued job.

---

## Frontend Conventions (React)

### File naming

- Pages: `PascalCase.jsx` in `src/pages/{member|admin|auth}/`
- Components: `PascalCase.jsx` in `src/components/{layout|ui|shared}/`
- Stores: `camelCaseStore.js` in `src/store/`
- API modules: `camelCase.js` in `src/api/`

### State management

- Auth state (user, token, role) → `authStore.js` (Zustand)
- Wallet state → `walletStore.js` (Zustand)
- Notifications state → `notificationStore.js` (Zustand)
- Server data (lists, paginated results) → `@tanstack/react-query`

### API calls

- All API calls go through `src/api/axios.js` — a single Axios instance with base URL from `VITE_API_URL` and a request interceptor that attaches `Authorization: Bearer {token}`.
- Never call `fetch()` directly. Never hardcode API URLs.
- On 401 response: interceptor clears auth store and redirects to `/login`.

### Currency formatting

Always use `src/utils/formatCurrency.js` to display Nigerian Naira:

```js
formatCurrency(amount); // returns "₦10,000.00"
```

### Route guards

Wrap routes with:

- `<ProtectedRoute>` — redirects to `/login` if not authenticated
- `<MemberRoute>` — redirects to `/admin` if role is admin
- `<AdminRoute>` — redirects to `/dashboard` if role is member; also checks 2FA

### PWA

- Offline-cacheable routes: dashboard, contributions, disbursements, meetings (StaleWhileRevalidate)
- Online-only: wallet balance, transactions, any POST/PATCH/DELETE (NetworkOnly)
- Never cache the Paystack webhook URL

---

## Database Rules

- All tables use `bigint` primary keys (auto-increment).
- All string columns use `utf8mb4` charset.
- Monetary columns: `decimal(15,2)` — not `float`, not `double`, not `integer`.
- Foreign keys must have indexes.
- `wallet_transactions` has `created_at` only — no `updated_at`.
- `audit_logs` has `created_at` only — no `updated_at`.
- `notifications` has `created_at` only — no `updated_at`.
- Invitation `token` column stores the SHA-256 hash, never the raw token.

### Key relationships

```
users 1──1 wallets
wallets 1──* wallet_transactions
users *──* contribution_cycles  (through contributions)
contributions *──1 contribution_packages
contributions *──1 contribution_cycles
disbursements *──1 contribution_cycles
meetings 1──* meeting_rsvps
users 1──* notifications
users 1──* audit_logs (as actor)
```

---

## Security Non-Negotiables

- Paystack webhook: verify `X-Paystack-Signature` header with `hash_hmac('sha512', rawBody, secret)` before touching any data.
- File uploads: validate MIME type (`pdf,jpg,jpeg,png`) and max size (`5120` KB). Store to `private` disk only for receipts/meeting attachments.
- CORS: `allowed_origins` in `config/cors.php` must be `[env('FRONTEND_URL')]` — never `['*']`.
- Rate limit auth endpoints: `throttle:10,1` (10 req/min).
- Sanctum token storage on frontend: memory or `sessionStorage` only — never `localStorage`.
- Admin 2FA: required for all admin state-mutating actions.
- Signed URLs for receipts: max 15-minute TTL.
- Input sanitization: use Laravel's Form Requests everywhere. Never trust raw `$request->all()`.

---

## Paystack Integration Pattern

```php
// Always use Http facade (Guzzle under the hood)
Http::withToken(config('paystack.secret_key'))
    ->post('https://api.paystack.co/...', [...]);

// Config keys — never hardcode keys in code
config('paystack.secret_key')   // PAYSTACK_SECRET_KEY in .env
config('paystack.public_key')   // PAYSTACK_PUBLIC_KEY in .env
config('paystack.preferred_bank') // PAYSTACK_PREFERRED_BANK in .env
```

Create `config/paystack.php`:

```php
return [
    'secret_key'      => env('PAYSTACK_SECRET_KEY'),
    'public_key'      => env('PAYSTACK_PUBLIC_KEY'),
    'preferred_bank'  => env('PAYSTACK_PREFERRED_BANK', 'wema-bank'),
];
```

---

## Notification Dispatch Pattern

Always dispatch notifications through the service layer, not directly in controllers:

```php
// In controller — delegate to service
$this->walletService->credit($wallet, $amount, $reference);

// In WalletService::credit() — dispatch notification job
dispatch(new NotifyWalletCredited($user, $amount));

// Job sends: FCM + email + in-app notification record
```

---

## Composer Packages Required

```
laravel/sanctum
guzzlehttp/guzzle
pragmarx/google2fa-laravel
barryvdh/laravel-dompdf
league/csv
```

## NPM Packages Required

```
axios
zustand
react-router-dom
firebase
@tanstack/react-query
react-hook-form
zod
vite-plugin-pwa
workbox-window
date-fns
```

---

## Environment Variables

Backend `.env` keys agent must reference (never hardcode values):
`APP_URL`, `FRONTEND_URL`, `DB_*`, `QUEUE_CONNECTION=database`,
`MAIL_*` (Brevo SMTP), `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`,
`PAYSTACK_PREFERRED_BANK`, `TERMII_API_KEY`, `TERMII_SENDER_ID`,
`FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_PATH`

Frontend `.env` keys:
`VITE_API_URL`, `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_FIREBASE_*`, `VITE_FCM_VAPID_KEY`

---

## Reference Files

- Full spec: `DEVELOPER_HANDOFF.md`
- Deployment guide: `README.md`
- Original concept: `concept_note.txt`
