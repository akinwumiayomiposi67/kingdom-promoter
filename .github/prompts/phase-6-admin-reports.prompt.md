---
mode: agent
description: Phase 6 — Admin dashboard, member management, audit logs, admin 2FA, CSV/PDF reports, wallet admin tools.
---

# Phase 6 — Admin Tools, Reports & Security

Complete all admin functionality including 2FA, audit trail, and report exports. Read `.github/copilot-instructions.md` first. Phases 1–5 must be complete.

## What to build

### Backend

1. **Admin 2FA — `pragmarx/google2fa-laravel`**:
   - Add `two_factor_secret` column to `users` (already in schema from Phase 1 — verify it exists)
   - `app/Http/Controllers/Auth/TwoFactorController.php`:
     - `setup()`: generate secret, return QR code URI for Google Authenticator
     - `enable(Request $request)`: verify OTP, save `two_factor_secret` to user
     - `verify(Request $request)`: verify TOTP code, set `session(['2fa_verified' => true])`
   - `app/Http/Middleware/TwoFactorVerified.php`:
     - Check `session('2fa_verified') === true` OR user has no `two_factor_secret` (not yet set up)
     - Return `403 { success: false, message: '2FA verification required' }` if not verified
   - Apply `TwoFactorVerified` middleware to all admin `POST/PATCH/DELETE` routes
   - Register alias: `'2fa' => TwoFactorVerified::class`
   - Routes:
     ```
     GET  /auth/2fa/setup   → TwoFactorController@setup   [auth:sanctum, admin]
     POST /auth/2fa/enable  → TwoFactorController@enable  [auth:sanctum, admin]
     POST /auth/2fa/verify  → TwoFactorController@verify  [auth:sanctum, admin]
     ```

2. **`app/Http/Controllers/Admin/MemberController.php`** (complete all actions):
   - `index()`: paginated list of all users (excluding admins), with wallet balance, current month contribution status, last payment date. Support query param `?status=active|suspended|pending` and `?search=name|email`.
   - `show(User $user)`: profile + wallet + full contribution history
   - `updateStatus(Request $request, User $user)`: change `users.status` to active/suspended. Write AuditLog. Dispatch notification if suspended.
   - `updatePackage(Request $request, User $user)`: change package for current cycle contribution.
   - `resendInvitation(Invitation $invitation)`: re-generate token, extend expires_at, re-send email.

3. **`app/Http/Controllers/Admin/DashboardController.php`**:

   ```
   GET /admin/dashboard → returns:
   {
     total_members, active_members, pending_invitations,
     current_month: { cycle_id, month, year, total_raised, paid_count, pending_count, not_paid_count },
     total_disbursed_this_year,
     total_wallet_balance,   // sum of all member wallets
     recent_transactions[5],  // last 5 wallet transactions across all members
     failed_jobs_count        // warn admin if > 0
   }
   ```

4. **`app/Http/Controllers/Admin/WalletController.php`**:
   - `index()`: all wallet transactions across all members, paginated, filterable by user/date/type
   - `manualDebit(Request $request, Wallet $wallet)`:
     - Requires `amount`, `description`, `reason`
     - Calls `WalletService::debit()`
     - Writes AuditLog with admin user as actor
     - Returns updated wallet

5. **`app/Http/Controllers/Admin/ReportController.php`**:
   - `contributions(Request $request)`:
     - Params: `month`, `year`, `format` (csv|pdf)
     - Query contributions for that cycle with user, package, status, paid_at
     - CSV: use `league/csv` — headers: Name, Phone, Email, Package, Amount Pledged, Amount Paid, Status, Paid At
     - PDF: use `barryvdh/laravel-dompdf` with a Blade view `resources/views/reports/contributions.blade.php`
     - Stream file as download response
   - `wallets(Request $request)`:
     - Returns snapshot of all member wallets with balances
     - CSV: Name, Email, Phone, Virtual Account, Balance, Total Contributed

6. **Blade PDF template** `resources/views/reports/contributions.blade.php`:

   ```html
   <!-- Simple clean table — association name, month/year, generated date, totals row -->
   <!-- Tailwind-like inline styles (dompdf doesn't support external CSS) -->
   ```

7. **AuditLog helper** — add static method to `AuditLog`:

   ```php
   public static function log(string $action, Model $model, array $payload = []): void
   {
       static::create([
           'user_id'    => auth()->id(),
           'action'     => $action,
           'model_type' => get_class($model),
           'model_id'   => $model->getKey(),
           'payload'    => $payload,
           'ip_address' => request()->ip(),
           'user_agent' => request()->userAgent(),
       ]);
   }
   ```

   Call `AuditLog::log()` in: WalletService debit, DisbursementController publish, MemberController updateStatus, manual debit.

8. **Routes** (complete admin routes):

   ```
   # Auth 2FA
   GET  /auth/2fa/setup            [auth:sanctum, admin]
   POST /auth/2fa/enable           [auth:sanctum, admin]
   POST /auth/2fa/verify           [auth:sanctum, admin]

   # Admin — [auth:sanctum, admin], mutations also [2fa]
   GET  /admin/dashboard
   GET  /admin/members
   GET  /admin/members/{user}
   PATCH /admin/members/{user}/status    [2fa]
   PATCH /admin/members/{user}/package   [2fa]
   POST /admin/members/{user}/invite-resend
   GET  /admin/transactions
   POST /admin/wallets/{wallet}/debit    [2fa]
   GET  /admin/reports/contributions
   GET  /admin/reports/wallets
   ```

---

### Frontend

1. **`src/api/admin.js`** — consolidate all admin API calls:

   ```js
   export const getAdminDashboard = () => api.get("/admin/dashboard");
   export const getMembers = (params) => api.get("/admin/members", { params });
   export const getMember = (id) => api.get(`/admin/members/${id}`);
   export const updateMemberStatus = (id, status) =>
     api.patch(`/admin/members/${id}/status`, { status });
   export const manualDebit = (walletId, data) =>
     api.post(`/admin/wallets/${walletId}/debit`, data);
   export const getContributionReport = (month, year, format) =>
     api.get("/admin/reports/contributions", {
       params: { month, year, format },
       responseType: format === "pdf" ? "blob" : "json",
     });
   export const setup2fa = () => api.get("/auth/2fa/setup");
   export const enable2fa = (code) => api.post("/auth/2fa/enable", { code });
   export const verify2fa = (code) => api.post("/auth/2fa/verify", { code });
   ```

2. **`src/pages/admin/AdminDashboard.jsx`**:
   - Top stats row: Total Members | Active | Pending Invitations | Total Wallet Balance
   - Current month card: Month Name, Total Raised, Paid/Pending/Not Paid breakdown with progress bar
   - Recent Transactions table (5 rows)
   - Warning banner if `failed_jobs_count > 0`

3. **`src/pages/admin/Members.jsx`**:
   - Search bar + status filter tabs (All / Active / Suspended / Pending)
   - Table: Avatar | Name | Email | Phone | Package | Wallet Balance | This Month | Status | Actions
   - Row actions: "View", "Suspend/Activate", "Change Package"
   - "Invite Member" button → modal with name, email, phone fields

4. **`src/pages/admin/Reports.jsx`**:
   - Month/Year pickers
   - "Export CSV" button → download CSV file
   - "Export PDF" button → download PDF file
   - Use `URL.createObjectURL(blob)` for PDF download

5. **`src/pages/admin/Settings.jsx`** — includes 2FA setup section:
   - If 2FA not set up: show QR code (from setup endpoint) + OTP input to activate
   - If 2FA active: show "2FA Enabled" status + option to regenerate

6. **2FA gate in `AdminRoute.jsx`**:
   - After role check: if admin, call `GET /auth/me` to check if 2FA is verified for session
   - If admin has `two_factor_secret` but session isn't verified: redirect to `/admin/2fa-verify`
   - `src/pages/admin/TwoFactorVerify.jsx` — simple OTP input form

---

## Acceptance Criteria

- [ ] Admin can generate 2FA QR code, scan with Google Authenticator, and enable 2FA
- [ ] Admin mutation endpoints return 403 if 2FA not verified in session
- [ ] `GET /api/admin/dashboard` returns all stats including failed_jobs_count
- [ ] CSV export downloads a properly formatted file with all members
- [ ] PDF export renders correctly with headers and totals row
- [ ] Manual wallet debit creates AuditLog entry with admin user_id
- [ ] Member suspension writes AuditLog and notifies the member
- [ ] AdminDashboard shows warning banner when failed_jobs > 0
