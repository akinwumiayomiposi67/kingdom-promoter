---
mode: agent
description: Phase 5 — Meetings with RSVP, in-app notifications, SMS/FCM multi-channel notification system.
---

# Phase 5 — Meetings, RSVP & Notification System

Build the meeting module and complete the notification infrastructure. Read `.github/copilot-instructions.md` first. Phases 1–4 must be complete.

## What to build

### Backend

1. **Migrations**:
   - `create_meetings_table`:
     ```
     id, title varchar(255), description text nullable, agenda text nullable,
     date date, time time, venue varchar(255) nullable, meeting_link varchar(500) nullable,
     attachment_path varchar(255) nullable, created_by FK users,
     timestamps
     ```
   - `create_meeting_rsvps_table`:
     ```
     id, meeting_id FK, user_id FK, response enum('attending','not_attending'),
     timestamps
     UNIQUE(meeting_id, user_id)
     ```
   - `create_notifications_table`:
     ```
     id, user_id FK, type varchar(100), title varchar(255), body text,
     data json nullable, read_at timestamp nullable,
     created_at timestamp only (NO updated_at)
     ```

2. **Models**:
   - `Meeting`: `$fillable` all, relationships: `hasMany(MeetingRsvp::class)`, `belongsTo(User::class, 'created_by')`; helper: `attendingCount()`, `isUpcoming(): bool`
   - `MeetingRsvp`: `$fillable`, `belongsTo(Meeting::class)`, `belongsTo(User::class)`
   - `Notification`: `public $timestamps = false;`, `const CREATED_AT = 'created_at';`, `const UPDATED_AT = null;`, scope `scopeUnread`

3. **Form Requests**:
   - `Admin/StoreMeetingRequest`: `title` required, `date` required date, `time` required`, `venue` required_without:`meeting_link`, `meeting_link` required_without:`venue`, `attachment` nullable file mimes:pdf,jpg,jpeg,png max:5120
   - `Member/RsvpRequest`: `response` required in:`attending,not_attending`

4. **`app/Http/Controllers/Admin/MeetingController.php`**:
   - `index()`: all meetings newest first, include attending count
   - `store(StoreMeetingRequest $request)`:
     - Store attachment if present to `private` disk: `meetings/{id}/filename`
     - Create Meeting
     - Dispatch `SendMeetingNotification` job
   - `update(Request $request, Meeting $meeting)`: update fields
   - `destroy(Meeting $meeting)`: soft-delete or hard delete
   - `rsvps(Meeting $meeting)`: return list of members with their RSVP response

5. **`app/Http/Controllers/Member/MeetingController.php`**:
   - `index()`: upcoming meetings (date >= today) + past 3 meetings
   - `rsvp(RsvpRequest $request, Meeting $meeting)`:
     - `MeetingRsvp::updateOrCreate(['meeting_id' => id, 'user_id' => userId], ['response' => response])`
     - Return `{ success: true, response }`

6. **`app/Http/Controllers/Member/NotificationController.php`**:
   - `index()`: paginated notifications for auth user, newest first
   - `markRead(Request $request)`:
     - Optional `id` param — mark single; if absent, mark all unread as read
     - `update(['read_at' => now()])` — allowed on notifications (not wallet_transactions)
   - `unreadCount()`: return `{ count: int }` — used for notification bell badge

7. **`app/Jobs/SendMeetingNotification.php`** (queued):
   - Receives Meeting
   - Foreach active user: FCM push + email (MeetingCreatedMail) + create Notification record
   - Title: "New Meeting: {title}", Body: "{date} at {time} — {venue or Online}"

8. **`app/Jobs/SendMeetingReminders.php`** (scheduled hourly):
   - Find meetings where `date = tomorrow`
   - Foreach attending member (or all members if no RSVP yet): send FCM push + SMS
   - Message: "Reminder: {title} is tomorrow at {time}"

9. **`app/Services/FcmService.php`** (FCM HTTP v1 API):

   ```php
   public function send(string $fcmToken, string $title, string $body, array $data = []): void
   // Use service account JSON to get access token (cache it for 55 minutes)
   // POST https://fcm.googleapis.com/v1/projects/{FCM_PROJECT_ID}/messages:send
   // Headers: Authorization: Bearer {access_token}, Content-Type: application/json
   // Silently fail — log error, never throw
   ```

   Service account auth (no Firebase Admin SDK needed — use raw Guzzle):

   ```php
   // Load service account JSON from FCM_SERVICE_ACCOUNT_PATH
   // Create JWT signed with RS256
   // Exchange for access token via https://oauth2.googleapis.com/token
   // Cache access token in Laravel Cache for 55 minutes
   ```

10. **`app/Mail/MeetingCreatedMail.php`** — queued Mailable with meeting details.

11. **Scheduler update** (`app/Console/Kernel.php`):

    ```php
    $schedule->job(new SendMeetingReminders)->hourly();
    ```

12. **Routes** (add to `routes/api.php`):

    ```
    # Member [auth:sanctum]
    GET  /member/meetings                   → Member\MeetingController@index
    POST /member/meetings/{meeting}/rsvp    → Member\MeetingController@rsvp
    GET  /member/notifications              → Member\NotificationController@index
    POST /member/notifications/read         → Member\NotificationController@markRead
    GET  /member/notifications/count        → Member\NotificationController@unreadCount

    # Admin [auth:sanctum, admin]
    GET  /admin/meetings                    → Admin\MeetingController@index
    POST /admin/meetings                    → Admin\MeetingController@store
    PATCH /admin/meetings/{meeting}         → Admin\MeetingController@update
    DELETE /admin/meetings/{meeting}        → Admin\MeetingController@destroy
    GET  /admin/meetings/{meeting}/rsvps    → Admin\MeetingController@rsvps
    ```

---

### Frontend

1. **`src/api/meetings.js`**:

   ```js
   export const getMeetings = () => api.get("/member/meetings");
   export const rsvpMeeting = (id, response) =>
     api.post(`/member/meetings/${id}/rsvp`, { response });
   export const getNotifications = (page) =>
     api.get(`/member/notifications?page=${page}`);
   export const markNotificationsRead = (id) =>
     api.post("/member/notifications/read", id ? { id } : {});
   export const getUnreadCount = () => api.get("/member/notifications/count");
   ```

2. **`src/store/notificationStore.js`** (Zustand):

   ```js
   {
     (unreadCount, setUnreadCount(n), decrementUnread());
   }
   ```

3. **`src/components/shared/NotificationBell.jsx`**:
   - Shows bell icon with unread count badge
   - Clicking opens dropdown of last 5 notifications
   - "View All" link → `/notifications`
   - Each item: title, body truncated, time ago (use `date-fns/formatDistanceToNow`)
   - Clicking item marks it read + navigates to relevant page if `data.link` present
   - Poll unread count every 60s with `useQuery` `refetchInterval`

4. **`src/pages/member/Meetings.jsx`**:
   - Section: "Upcoming Meetings" — card per meeting
   - Card: title, date (formatted), time, venue or "Online Meeting" with link, description
   - RSVP buttons: "I Will Attend" (green) / "Can't Attend" (red)
   - Shows current user's RSVP status if already responded
   - Section: "Past Meetings" — collapsed list

5. **`src/pages/member/Notifications.jsx`**:
   - Full paginated list of notifications
   - "Mark all as read" button at top
   - Each row: icon by type, title, body, time ago, unread indicator dot
   - On page load: mark all as read

6. **`src/pages/admin/Meetings.jsx`**:
   - Table: Title | Date | Venue | Attending count | Actions
   - "Create Meeting" → modal with form fields (title, date, time, venue, online link, description, agenda, attach file)
   - Row "View RSVPs" → modal showing member list + their responses

7. **Background FCM** — `public/firebase-messaging-sw.js`:
   ```js
   importScripts(
     "https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js",
   );
   importScripts(
     "https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js",
   );
   // Init Firebase with hard-coded config values (service worker can't read env vars)
   // messaging.onBackgroundMessage(payload => { ... })
   ```
   Note: Firebase config values in the SW must be hardcoded or injected at build time.

---

## Acceptance Criteria

- [ ] Admin creates meeting → all active members receive in-app notification
- [ ] `GET /api/member/notifications/count` returns correct unread count
- [ ] Marking notification as read decrements count
- [ ] RSVP is idempotent — updating to same response doesn't create duplicate
- [ ] Meeting reminder job only fires for meetings happening tomorrow
- [ ] FCM service account JWT is cached — no re-auth on every push
- [ ] NotificationBell shows unread count and updates without page reload
- [ ] Meetings page shows RSVP buttons, reflects current user's response
- [ ] Background FCM messages show as OS push notifications on Android
