---
mode: agent
description: Phase 3 — Contribution packages, monthly cycles, auto-debit scheduler, reminders, and contribution UI.
---

# Phase 3 — Contributions: Packages, Cycles, Auto-Debit

Build the full contribution lifecycle. Read `.github/copilot-instructions.md` first. Phases 1 and 2 must be complete.

## What to build

### Backend

1. **Migrations**:
   - `create_contribution_packages_table`: `id`, `name varchar(100)`, `amount decimal(15,2)`, `is_custom boolean default false`, `is_active boolean default true`, timestamps
   - `create_contribution_cycles_table`: `id`, `month tinyint`, `year smallint`, `debit_day tinyint`, `status enum('pending','active','closed') default pending`, `total_raised decimal(15,2) default 0.00`, timestamps
   - `create_contributions_table`: `id`, `user_id FK`, `cycle_id FK`, `package_id FK`, `amount_pledged decimal(15,2)`, `amount_paid decimal(15,2) default 0.00`, `status enum('paid','pending','partial','not_paid') default pending`, `paid_at timestamp nullable`, `wallet_transaction_id FK nullable`, timestamps

2. **Models**:
   - `ContributionPackage` — `$fillable`, scope `scopeActive`
   - `ContributionCycle` — relationships: `hasMany(Contribution::class)`; helper: `isActive()`, `isClosed()`
   - `Contribution` — relationships: `belongsTo(User::class)`, `belongsTo(ContributionCycle::class)`, `belongsTo(ContributionPackage::class)`, `belongsTo(WalletTransaction::class)`

3. **Seeder: `ContributionPackageSeeder`**:

   ```
   ₦10,000  — Bronze
   ₦20,000  — Silver
   ₦50,000  — Gold
   ₦100,000 — Diamond
   ```

   Wire into `DatabaseSeeder`.

4. **Form Requests**:
   - `Member/SetPackageRequest`: validates `package_id` exists in `contribution_packages` where `is_active = true`
   - `Admin/CreateCycleRequest`: validates `month (1-12)`, `year (>=2024)`, `debit_day (1-28)`
   - `Admin/TriggerDebitRequest`: validates `cycle_id`

5. **`app/Http/Controllers/Member/ContributionController.php`**:
   - `setPackage(SetPackageRequest $request)`: find or create Contribution for current active cycle with the chosen package; update `amount_pledged`
   - `myContributions()`: paginated personal contribution history with cycle and package details
   - `groupContributions()`: list of cycles with `total_raised`, `paid_count`, `pending_count` — only closed or active cycles

6. **`app/Http/Controllers/Admin/ContributionCycleController.php`**:
   - `index()`: list cycles with summary counts
   - `store(CreateCycleRequest $request)`: create cycle, validate only one active cycle at a time
   - `summary(ContributionCycle $cycle)`: return per-member contribution status for the cycle
   - `triggerDebit(ContributionCycle $cycle)`: dispatch `DebitMonthlyContributions` job for this cycle
   - `sendReminders(ContributionCycle $cycle)`: dispatch `SendContributionReminder` job for pending members in cycle

7. **`app/Jobs/DebitMonthlyContributions.php`** (queued, `ShouldQueue`):

   ```
   Receives: ContributionCycle $cycle
   foreach active member with a contribution record in this cycle:
     $wallet = member's wallet
     if $wallet->balance >= $contribution->amount_pledged:
       $txn = WalletService::debit($wallet, amount, reference, "Monthly contribution - {month} {year}")
       $contribution->update(['status' => 'paid', 'paid_at' => now(), 'amount_paid' => amount, 'wallet_transaction_id' => $txn->id])
       dispatch(new SendContributionConfirmation($user, $amount, $cycle))
     else:
       $contribution->update(['status' => 'pending'])
       dispatch(new SendContributionReminder($user, $cycle, 'immediate'))
   ```

   Use `DB::transaction()` per member debit. Never batch all debits in one transaction.

8. **`app/Jobs/SendContributionReminder.php`** (queued):
   - Receives: User, ContributionCycle, string $reminderType ('immediate'|'day3'|'day7')
   - Sends: email (ContributionReminderMail) + SMS (SmsService) + FCM push + in-app Notification record

9. **`app/Mail/ContributionReminderMail.php`** — queued Mailable. Template should include: member name, amount owed, month/year, virtual account number for funding.

10. **`app/Console/Kernel.php`** (scheduler):

    ```php
    // Get active cycle's debit_day from DB dynamically
    // Run DebitMonthlyContributions on debit_day at 08:00
    // Run SendContributionReminder day3 on debit_day+3 at 09:00
    // Run SendContributionReminder day7 on debit_day+7 at 09:00
    ```

11. **`app/Services/SmsService.php`** (Termii):

    ```php
    public function send(string $to, string $message): void
    // POST https://api.ng.termii.com/api/sms/send
    // Auth: TERMII_API_KEY, sender: TERMII_SENDER_ID
    // Normalize phone: convert 0XXXXXXXXXX to 234XXXXXXXXXX
    // Silently fail (log error, don't throw) — SMS failure must never break wallet operations
    ```

12. **Routes** (add to `routes/api.php`):

    ```
    # Member
    POST /member/package                    → Member\ContributionController@setPackage
    GET  /member/contributions              → Member\ContributionController@myContributions
    GET  /member/group/contributions        → Member\ContributionController@groupContributions

    # Admin [auth:sanctum, admin middleware]
    GET  /admin/packages                    → Admin\PackageController@index
    POST /admin/packages                    → Admin\PackageController@store
    PATCH /admin/packages/{package}         → Admin\PackageController@update
    GET  /admin/cycles                      → Admin\ContributionCycleController@index
    POST /admin/cycles                      → Admin\ContributionCycleController@store
    GET  /admin/cycles/{cycle}/summary      → Admin\ContributionCycleController@summary
    POST /admin/cycles/{cycle}/debit        → Admin\ContributionCycleController@triggerDebit
    POST /admin/cycles/{cycle}/reminder     → Admin\ContributionCycleController@sendReminders
    ```

---

### Frontend

1. **`src/api/contributions.js`**:

   ```js
   export const setPackage = (package_id) =>
     api.post("/member/package", { package_id });
   export const getMyContributions = (page) =>
     api.get(`/member/contributions?page=${page}`);
   export const getGroupContributions = () =>
     api.get("/member/group/contributions");
   export const getPackages = () => api.get("/admin/packages");
   ```

2. **`src/pages/auth/Onboarding.jsx`**:
   - Fetches packages from `GET /admin/packages` (use public endpoint or pass token)
   - Displays package cards: Bronze ₦10k, Silver ₦20k, Gold ₦50k, Diamond ₦100k
   - "Select" button calls `setPackage(package_id)`
   - On success → navigate to `/dashboard`
   - Skip for now if already selected

3. **`src/pages/member/MyContributions.jsx`**:
   - Table: Month | Package | Amount Pledged | Amount Paid | Status badge (Paid=green, Pending=yellow, Not Paid=red)
   - Running total: "Total Contributed: ₦X" at top

4. **`src/pages/member/GroupContributions.jsx`**:
   - Monthly cards: "April 2026 — Total Raised: ₦5,000,000 — Members Paid: 48/50"
   - Status badge: Active / Closed

5. **Dashboard update** (`Dashboard.jsx`):
   - Add contribution status card: "April 2026 — ₦10,000 — PAID" (or PENDING with fund wallet CTA)
   - Add group stats card: Total raised this month, Paid count / Total members

6. **`src/components/ui/Badge.jsx`**:
   ```jsx
   // Props: status ('paid'|'pending'|'partial'|'not_paid')
   // Returns colored pill badge
   ```

---

## Acceptance Criteria

- [ ] `ContributionPackageSeeder` creates 4 packages
- [ ] `POST /api/member/package` saves the member's package for the current active cycle
- [ ] `DebitMonthlyContributions` job debits members with sufficient balance and marks them as paid
- [ ] Members with insufficient balance are marked as pending and receive a reminder
- [ ] Duplicate debit is prevented — job checks if contribution is already `paid` before debiting
- [ ] `SmsService::send()` failure does not throw — errors are logged only
- [ ] Onboarding page renders packages, selection persists
- [ ] MyContributions page shows personal history with correct status badges
- [ ] Dashboard shows current month contribution status
