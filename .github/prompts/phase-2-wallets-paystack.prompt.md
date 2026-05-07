---
mode: agent
description: Phase 2 — Paystack virtual accounts, wallet model, WalletService, webhook handler, and wallet UI.
---

# Phase 2 — Paystack Wallets & Virtual Accounts

Build the complete wallet system. Read `.github/copilot-instructions.md` first. Phase 1 must be complete before starting this phase.

## What to build

### Backend

1. **`config/paystack.php`** — verify it exists from Phase 1. If not, create it:

   ```php
   return [
       'secret_key'     => env('PAYSTACK_SECRET_KEY'),
       'public_key'     => env('PAYSTACK_PUBLIC_KEY'),
       'preferred_bank' => env('PAYSTACK_PREFERRED_BANK', 'wema-bank'),
   ];
   ```

2. **Migrations**:
   - `create_wallets_table`: `id`, `user_id bigint FK unique`, `balance decimal(15,2) default 0.00`, `paystack_customer_code varchar(100)`, `virtual_account_number varchar(20)`, `virtual_account_bank varchar(100)`, `virtual_account_name varchar(191)`, timestamps
   - `create_wallet_transactions_table`: `id`, `wallet_id bigint FK`, `type enum('credit','debit')`, `amount decimal(15,2)`, `description varchar(255)`, `reference varchar(100) unique`, `paystack_event varchar(100) nullable`, `balance_before decimal(15,2)`, `balance_after decimal(15,2)`, `created_at timestamp only` (NO `updated_at`)

3. **Model: `app/Models/Wallet.php`**:
   - `$fillable`: all columns
   - Relationship: `belongsTo(User::class)`, `hasMany(WalletTransaction::class)`

4. **Model: `app/Models/WalletTransaction.php`**:
   - `public $timestamps = false;` — only `created_at`
   - Add `const CREATED_AT = 'created_at';` and `const UPDATED_AT = null;`
   - Override `save()` to throw `\RuntimeException('WalletTransaction records are immutable')` if the model already exists (i.e., `$this->exists === true`)
   - Only allow creation via `WalletTransaction::create([...])`
   - `$fillable`: all columns

5. **`app/Services/PaystackService.php`**:

   ```php
   // createCustomer(User $user): string  → returns customer_code
   // createDedicatedVirtualAccount(string $customerCode): array → returns account details
   // Use Http::withToken(config('paystack.secret_key'))->post(...)
   // Never hardcode the API key
   ```

6. **`app/Services/WalletService.php`** — this is the only place wallets are debited or credited:

   ```php
   public function credit(Wallet $wallet, float $amount, string $reference, string $description, ?string $paystackEvent = null): WalletTransaction
   // 1. Start DB transaction
   // 2. Lock wallet row: $wallet->lockForUpdate()->find($wallet->id)
   // 3. Record balance_before
   // 4. Increment wallet.balance
   // 5. Create WalletTransaction (type: credit)
   // 6. Commit
   // 7. Dispatch NotifyWalletCredited job
   // 8. Write audit_log entry

   public function debit(Wallet $wallet, float $amount, string $reference, string $description): WalletTransaction
   // Same pattern — check balance >= amount before debit
   // Throw InsufficientBalanceException if not enough
   // Dispatch NotifyWalletDebited job
   // Write audit_log entry
   ```

7. **`app/Exceptions/InsufficientBalanceException.php`** — custom exception.

8. **Webhook infrastructure**:
   - `app/Http/Middleware/VerifyPaystackWebhook.php`:
     ```php
     $signature = $request->header('X-Paystack-Signature');
     $expected  = hash_hmac('sha512', $request->getContent(), config('paystack.secret_key'));
     if (!hash_equals($expected, $signature)) { abort(400); }
     ```
   - Register in `bootstrap/app.php` as `'paystack.webhook' => VerifyPaystackWebhook::class`
   - `app/Http/Controllers/Webhook/PaystackWebhookController.php`:
     - `handle(Request $request)`: read event type, if `charge.success` → dispatch `ProcessPaystackWebhook` job, always return `response()->json(['status' => 'ok'], 200)`
   - `app/Jobs/ProcessPaystackWebhook.php`:
     - Receives raw payload array
     - On `charge.success`: find Wallet by `virtual_account_number` matching `data.paid_to.account_number`
     - Call `WalletService::credit(...)`
     - Guard against duplicate references using the `reference` unique constraint

9. **Update RegisterController** — after creating User, call:

   ```php
   $customerCode = $paystackService->createCustomer($user);
   $accountDetails = $paystackService->createDedicatedVirtualAccount($customerCode);
   Wallet::create([...]);
   ```

10. **Routes** (add to `routes/api.php`):

    ```
    POST /webhook/paystack   → Webhook\PaystackWebhookController@handle  [middleware: paystack.webhook]

    GET  /member/wallet      → Member\WalletController@show     [auth:sanctum]
    GET  /member/transactions → Member\WalletController@transactions [auth:sanctum]
    POST /member/fcm-token   → Member\WalletController@storeFcmToken [auth:sanctum]
    ```

    Webhook route must be in `routes/api.php` but EXCLUDED from Sanctum middleware.

11. **`app/Http/Controllers/Member/WalletController.php`**:
    - `show()`: return `{ wallet: { balance, virtual_account_number, virtual_account_bank, virtual_account_name } }`
    - `transactions()`: paginated list of wallet transactions (15 per page), newest first
    - `storeFcmToken(Request $request)`: validate `fcm_token` string, update `users.fcm_token`

12. **`app/Models/AuditLog.php`** + migration:
    - `id`, `user_id nullable FK`, `action varchar(100)`, `model_type varchar(100)`, `model_id bigint`, `payload json`, `ip_address varchar(45)`, `user_agent varchar(255)`, `created_at timestamp only`
    - `public $timestamps = false;`

---

### Frontend

1. **`src/api/wallet.js`**:

   ```js
   export const getWallet = () => api.get("/member/wallet");
   export const getTransactions = (page = 1) =>
     api.get(`/member/transactions?page=${page}`);
   export const storeFcmToken = (fcm_token) =>
     api.post("/member/fcm-token", { fcm_token });
   ```

2. **`src/store/walletStore.js`** (Zustand):

   ```js
   {
     (wallet, setWallet(wallet), clearWallet());
   }
   ```

3. **`src/pages/member/Wallet.jsx`**:
   - Fetch wallet with `useQuery` from `@tanstack/react-query`
   - Display card: Account Number (large, copyable), Bank Name, Account Name
   - Display wallet balance with `formatCurrency`
   - Paginated transaction history table: Date | Type (credit/debit badge) | Description | Amount | Balance After
   - "Copy Account Number" button with clipboard API

4. **`src/firebase.js`** — Firebase app init:

   ```js
   import { initializeApp } from "firebase/app";
   import { getMessaging } from "firebase/messaging";
   // init with VITE_FIREBASE_* env vars
   export const messaging = getMessaging(app);
   ```

5. **`src/hooks/useFcm.js`**:
   - On mount: calls `getToken(messaging, { vapidKey: VITE_FCM_VAPID_KEY })`
   - If token obtained: calls `storeFcmToken(token)` API
   - Handles permission denied gracefully (no error thrown to user)
   - Call this hook inside the authenticated layout

6. **`src/pages/member/Dashboard.jsx`** (skeleton for now):
   - Show wallet balance card (refetch every 30s via `refetchInterval`)
   - Show virtual account details
   - Show "Fund Your Wallet" instructions panel

---

## Acceptance Criteria

- [ ] `POST /api/webhook/paystack` with invalid signature returns `400`
- [ ] `POST /api/webhook/paystack` with valid signature + `charge.success` event credits the correct wallet
- [ ] Duplicate webhook reference is ignored (idempotent)
- [ ] `WalletTransaction::save()` throws exception when called on existing record
- [ ] `GET /api/member/wallet` returns virtual account details
- [ ] `GET /api/member/transactions` returns paginated list
- [ ] Wallet page in React renders virtual account card and transaction history
- [ ] FCM token is stored on first login via `useFcm` hook
