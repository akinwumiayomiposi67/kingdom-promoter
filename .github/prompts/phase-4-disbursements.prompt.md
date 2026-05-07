---
mode: agent
description: Phase 4 — Admin disbursement recording, receipt upload to private disk, signed URL access, member transparency feed.
---

# Phase 4 — Disbursements & Transparency

Build the disbursement recording system and member transparency feed. Read `.github/copilot-instructions.md` first. Phases 1–3 must be complete.

## What to build

### Backend

1. **Migration: `create_disbursements_table`**:

   ```
   id bigint PK
   cycle_id FK → contribution_cycles
   beneficiary_name varchar(255)
   beneficiary_type enum('missionary','organization','project')
   purpose text
   total_raised decimal(15,2)
   amount_disbursed decimal(15,2)
   date_sent date
   payment_method varchar(100)
   receipt_path varchar(255) nullable
   notes text nullable
   published_at timestamp nullable
   created_by FK → users.id
   timestamps
   ```

2. **`app/Models/Disbursement.php`**:
   - `$fillable`: all columns
   - Cast `date_sent` to `date`, `published_at` to `datetime`
   - Scope: `scopePublished` — where `published_at is not null`
   - Relationship: `belongsTo(ContributionCycle::class)`, `belongsTo(User::class, 'created_by')`
   - Helper: `isPublished(): bool`

3. **`config/filesystems.php`** — ensure `private` disk is configured:

   ```php
   'private' => [
       'driver' => 'local',
       'root'   => storage_path('app/private'),
   ],
   ```

4. **Form Requests**:
   - `Admin/StoreDisbursementRequest`:
     - `cycle_id` — required, exists in contribution_cycles
     - `beneficiary_name` — required string
     - `beneficiary_type` — required, in: missionary, organization, project
     - `purpose` — required string
     - `total_raised` — required numeric min:0
     - `amount_disbursed` — required numeric min:0
     - `date_sent` — required date
     - `payment_method` — required string
     - `receipt` — nullable, file, mimes:pdf,jpg,jpeg,png, max:5120
     - `notes` — nullable string
   - `Admin/UpdateDisbursementRequest` — same but all nullable (partial update)

5. **`app/Http/Controllers/Admin/DisbursementController.php`**:
   - `index()`: paginated list of all disbursements, newest first
   - `store(StoreDisbursementRequest $request)`:
     - Store receipt file: `$request->file('receipt')->store("receipts/{$year}/{$month}", 'private')`
     - Create Disbursement record
     - Return `{ success: true, data: disbursement }`
   - `update(UpdateDisbursementRequest $request, Disbursement $disbursement)`:
     - Only allowed if `published_at is null`
     - Replace receipt file if new file uploaded (delete old file from private disk)
     - Return updated record
   - `publish(Disbursement $disbursement)`:
     - Set `published_at = now()`
     - Dispatch `SendDisbursementNotification` job
     - Write AuditLog entry
     - Return `{ success: true }`
   - `receipt(Disbursement $disbursement)` — admin version: return signed URL (60 min TTL)

6. **`app/Http/Controllers/Member/DisbursementController.php`**:
   - `index()`: list published disbursements only (use `scopePublished`), newest first
   - `receipt(Disbursement $disbursement)`:
     - Abort 403 if not published
     - Abort 401 if not authenticated
     - Return `Storage::disk('private')->temporaryUrl($disbursement->receipt_path, now()->addMinutes(15))`
     - Note: `temporaryUrl` on local disk requires implementing a signed URL route. Create `GET /files/private/{path}` route that validates a time-limited HMAC signature.

7. **Signed URL for local disk** (since cPanel/local disk doesn't support native `temporaryUrl`):
   Create `app/Http/Controllers/PrivateFileController.php`:

   ```php
   // GET /files/private/{path}?expires={timestamp}&signature={hmac}
   // Validate: hash_hmac('sha256', $path.$expires, config('app.key')) === $signature
   // Validate: $expires > now()
   // Return file stream from private disk
   ```

   Generate the signed URL in DisbursementController:

   ```php
   $expires = now()->addMinutes(15)->timestamp;
   $signature = hash_hmac('sha256', $path.$expires, config('app.key'));
   $url = url("/files/private/{$path}?expires={$expires}&signature={$signature}");
   ```

8. **`app/Jobs/SendDisbursementNotification.php`** (queued):
   - Receives Disbursement
   - Foreach active user: send FCM push + email (DisbursementPublishedMail) + create in-app Notification record
   - Log failures, never throw

9. **`app/Mail/DisbursementPublishedMail.php`** — queued Mailable:
   - Subject: "April 2026 Disbursement Published"
   - Body: beneficiary name, purpose, total raised, amount disbursed, date sent, link to app

10. **Routes** (add to `routes/api.php`):

    ```
    # Member [auth:sanctum]
    GET  /member/disbursements              → Member\DisbursementController@index
    GET  /disbursements/{disbursement}/receipt → Member\DisbursementController@receipt

    # Admin [auth:sanctum, admin]
    GET  /admin/disbursements               → Admin\DisbursementController@index
    POST /admin/disbursements               → Admin\DisbursementController@store
    PATCH /admin/disbursements/{id}         → Admin\DisbursementController@update
    PATCH /admin/disbursements/{id}/publish → Admin\DisbursementController@publish
    GET  /admin/disbursements/{id}/receipt  → Admin\DisbursementController@receipt

    # Private file server [web.php — no Sanctum, uses HMAC signature]
    GET  /files/private/{path}             → PrivateFileController@serve
    ```

11. **Observer: `DisbursementObserver`**:
    - On `updated` where `published_at` was just set: write AuditLog entry
    - Register in `AppServiceProvider`

---

### Frontend

1. **`src/api/disbursements.js`**:

   ```js
   export const getDisbursements = (page) =>
     api.get(`/member/disbursements?page=${page}`);
   export const getReceiptUrl = (id) => api.get(`/disbursements/${id}/receipt`);
   export const adminGetDisbursements = () => api.get("/admin/disbursements");
   export const adminCreateDisbursement = (data) =>
     api.post("/admin/disbursements", data, {
       headers: { "Content-Type": "multipart/form-data" },
     });
   export const adminPublishDisbursement = (id) =>
     api.patch(`/admin/disbursements/${id}/publish`);
   ```

2. **`src/pages/member/Disbursements.jsx`**:
   - Card list of published disbursements
   - Each card: Month/Year, Beneficiary name + type badge, Purpose excerpt, Total Raised, Amount Disbursed, Date Sent
   - "View Receipt" button — calls `getReceiptUrl(id)` → opens signed URL in new tab
   - If no receipt: hide button

3. **`src/pages/admin/Disbursements.jsx`**:
   - Table: Month | Beneficiary | Amount Disbursed | Status (Draft/Published)
   - "Record Disbursement" button → opens modal with form
   - Form fields: cycle (select), beneficiary name, beneficiary type, purpose, total raised, amount disbursed, date sent, payment method, receipt upload, notes
   - File input: accept="application/pdf,image/jpeg,image/png"
   - After save: row shows "Publish" button if not yet published
   - "Publish" button: confirm dialog → calls `adminPublishDisbursement(id)`

4. **Dashboard update** (both member and admin):
   - Member: add "Last Disbursement" card — beneficiary, amount, "View Receipt" link
   - Admin: add "Undisbursed Cycles" alert if cycle is closed but no disbursement recorded

---

## Acceptance Criteria

- [ ] Receipt files stored in `storage/app/private/receipts/{year}/{month}/`
- [ ] `GET /api/disbursements/{id}/receipt` returns a URL that expires in 15 minutes
- [ ] Accessing receipt URL after expiry returns 403/410
- [ ] Member cannot access unpublished disbursement — returns 404
- [ ] Admin publishes disbursement → all members receive in-app notification
- [ ] Member Disbursements page shows only published records
- [ ] "View Receipt" opens the file in a new browser tab
- [ ] Admin form uploads receipt file correctly (multipart/form-data)
