---
mode: agent
description: Phase 1 — Scaffold the Laravel backend and React frontend with authentication, invitation system, and database migrations.
---

# Phase 1 — Foundation: Auth, Invitations, Registration

Build the complete foundation for Kingdom Fund Circle. Read `DEVELOPER_HANDOFF.md` and `.github/copilot-instructions.md` before starting. Follow every constraint exactly.

## What to build

### Backend (`backend/`)

1. **Init Laravel 11 project** inside `backend/` if not already present:

   ```bash
   composer create-project laravel/laravel backend
   cd backend
   composer require laravel/sanctum guzzlehttp/guzzle pragmarx/google2fa-laravel barryvdh/laravel-dompdf league/csv
   php artisan sanctum:install
   ```

2. **`config/paystack.php`** — create this config file:

   ```php
   return [
       'secret_key'     => env('PAYSTACK_SECRET_KEY'),
       'public_key'     => env('PAYSTACK_PUBLIC_KEY'),
       'preferred_bank' => env('PAYSTACK_PREFERRED_BANK', 'wema-bank'),
   ];
   ```

3. **`config/cors.php`** — set `allowed_origins` to `[env('FRONTEND_URL')]`. Never `*`.

4. **Database migrations** — create all migrations in order:
   - `users` table (add: `phone varchar(20)`, `role enum('member','admin') default member`, `status enum('active','suspended','pending') default pending`, `profile_photo nullable`, `fcm_token nullable`, `two_factor_secret nullable`)
   - `invitations` table: `id`, `invited_by FK users`, `name`, `email`, `phone`, `token varchar(255) unique` (SHA-256 hash), `status enum('pending','accepted','expired')`, `expires_at timestamp`, `accepted_at nullable`, timestamps
   - `personal_access_tokens` (from Sanctum — already exists)
   - `jobs` table: `php artisan queue:table && php artisan migrate`
   - `failed_jobs` table

5. **Models**:
   - `User` — add `phone`, `role`, `status`, `fcm_token` to `$fillable`. Add helper: `isAdmin()`, `isMember()`, `isActive()`.
   - `Invitation` — `$fillable`, `expires_at` cast to datetime. Add scope: `scopePending`, `scopeValid` (pending + not expired).

6. **Form Requests** in `app/Http/Requests/Auth/`:
   - `ValidateInvitationRequest` — validates `token` string required
   - `RegisterRequest` — validates `token`, `name`, `email`, `phone` (Nigerian: starts with 0 or +234, 11 digits), `password` (min 8, confirmed)
   - `LoginRequest` — validates `email`, `password`

7. **Controllers**:
   - `app/Http/Controllers/Auth/InvitationController.php`:
     - `validate(ValidateInvitationRequest $request)`: hash token → find Invitation → return `{ success, data: { name, email, phone } }`
   - `app/Http/Controllers/Auth/RegisterController.php`:
     - `register(RegisterRequest $request)`: validate token again → create User → mark invitation accepted → return Sanctum token
   - `app/Http/Controllers/Auth/LoginController.php`:
     - `login(LoginRequest $request)`: authenticate → return `{ success, data: { token, user, role } }`
     - `logout()`: revoke current token → return `{ success: true }`
     - `me()`: return authenticated user

8. **Middleware**:
   - `app/Http/Middleware/AdminOnly.php`: checks `auth()->user()->role === 'admin'`, returns `403` if not
   - Register middleware aliases in `bootstrap/app.php`: `'admin' => AdminOnly::class`

9. **Routes** (`routes/api.php`):

   ```
   POST /invitation/validate  → Auth\InvitationController@validate
   POST /auth/register        → Auth\RegisterController@register
   POST /auth/login           → Auth\LoginController@login  [throttle:10,1]
   POST /auth/logout          → Auth\LoginController@logout  [auth:sanctum]
   GET  /auth/me              → Auth\LoginController@me     [auth:sanctum]
   ```

10. **Seeders**:
    - `AdminSeeder`: creates one admin user with `role=admin`, `status=active`. Use `bcrypt` for password. Email/password from `.env` keys `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
    - Wire in `DatabaseSeeder`.

11. **`.env.example`**: include all keys from DEVELOPER_HANDOFF.md §16.

---

### Frontend (`frontend/`)

1. **Init Vite + React project**:

   ```bash
   npm create vite@latest frontend -- --template react
   cd frontend
   npm install axios zustand react-router-dom @tanstack/react-query react-hook-form zod date-fns
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. **`src/api/axios.js`** — Axios instance:
   - `baseURL` from `import.meta.env.VITE_API_URL`
   - Request interceptor: attach `Authorization: Bearer {token}` from `authStore`
   - Response interceptor: on 401 → clear auth store → `navigate('/login')`

3. **`src/store/authStore.js`** (Zustand):

   ```js
   {
     (user, token, role, setAuth(user, token, role), clearAuth());
   }
   ```

   Persist to `sessionStorage` only (not `localStorage`).

4. **Route guards** in `src/components/guards/`:
   - `ProtectedRoute.jsx` — redirects to `/login` if no token
   - `MemberRoute.jsx` — redirects to `/admin` if role is `admin`
   - `AdminRoute.jsx` — redirects to `/dashboard` if role is `member`

5. **Pages**:
   - `src/pages/auth/Login.jsx` — email + password form using `react-hook-form` + `zod`, calls `POST /api/auth/login`, stores token in authStore, redirects by role
   - `src/pages/auth/AcceptInvitation.jsx` — reads `:token` from URL, calls `POST /api/invitation/validate`, shows member's name/email, redirects to `/register?token=...`
   - `src/pages/auth/Register.jsx` — pre-fills name/email/phone from query params, password + confirm, terms checkbox, calls `POST /api/auth/register`, stores token, redirects to `/onboarding`

6. **`src/utils/formatCurrency.js`**:

   ```js
   export const formatCurrency = (amount) =>
     new Intl.NumberFormat("en-NG", {
       style: "currency",
       currency: "NGN",
     }).format(amount);
   ```

7. **`src/App.jsx`** — set up `BrowserRouter` with React Router v6, `QueryClientProvider`, all routes defined. Public routes: `/login`, `/accept-invitation/:token`, `/register`. Protected routes under `<ProtectedRoute>`.

8. **`frontend/.env.example`**:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_PAYSTACK_PUBLIC_KEY=
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   VITE_FCM_VAPID_KEY=
   ```

---

## Acceptance Criteria

- [ ] `php artisan migrate --seed` runs without error
- [ ] `POST /api/invitation/validate` with invalid token returns `422`
- [ ] `POST /api/auth/register` without token returns `422`
- [ ] `POST /api/auth/login` with valid admin credentials returns `{ success: true, data: { token, user, role: 'admin' } }`
- [ ] `GET /api/auth/me` with Bearer token returns authenticated user
- [ ] React app starts on `npm run dev`, Login page renders, form submits to API
- [ ] Successful login redirects to `/dashboard` (member) or `/admin` (admin)
- [ ] AcceptInvitation page validates token and pre-fills Register form
