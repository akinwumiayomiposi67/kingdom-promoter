---
mode: agent
description: Phase 7 — PWA configuration, service worker, offline caching, app icons, Android installability, and cPanel VPS deployment.
---

# Phase 7 — PWA, Polish & Deployment

Make the app installable, offline-capable, and deploy to cPanel VPS. Read `.github/copilot-instructions.md` first. All previous phases must be complete.

## What to build

### Frontend — PWA

1. **Install PWA dependencies**:

   ```bash
   cd frontend
   npm install vite-plugin-pwa workbox-window
   ```

2. **`frontend/vite.config.js`** — complete configuration:

   ```js
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import { VitePWA } from "vite-plugin-pwa";

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: "autoUpdate",
         includeAssets: ["icons/*.png", "icons/*.svg"],
         manifest: {
           name: "Kingdom Fund Circle",
           short_name: "KFC",
           description: "Christian association monthly contribution platform",
           theme_color: "#1a3c6e",
           background_color: "#ffffff",
           display: "standalone",
           orientation: "portrait",
           start_url: "/",
           scope: "/",
           icons: [
             { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
             { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
             {
               src: "/icons/icon-128.png",
               sizes: "128x128",
               type: "image/png",
             },
             {
               src: "/icons/icon-192.png",
               sizes: "192x192",
               type: "image/png",
             },
             {
               src: "/icons/icon-512.png",
               sizes: "512x512",
               type: "image/png",
             },
             {
               src: "/icons/icon-512-maskable.png",
               sizes: "512x512",
               type: "image/png",
               purpose: "maskable",
             },
           ],
         },
         workbox: {
           globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
           runtimeCaching: [
             {
               urlPattern: ({ url }) =>
                 url.pathname.startsWith("/api/member/dashboard"),
               handler: "StaleWhileRevalidate",
               options: {
                 cacheName: "dashboard-cache",
                 expiration: { maxAgeSeconds: 3600 },
               },
             },
             {
               urlPattern: ({ url }) =>
                 url.pathname.startsWith("/api/member/contributions"),
               handler: "StaleWhileRevalidate",
               options: {
                 cacheName: "contributions-cache",
                 expiration: { maxAgeSeconds: 3600 },
               },
             },
             {
               urlPattern: ({ url }) =>
                 url.pathname.startsWith("/api/member/disbursements"),
               handler: "StaleWhileRevalidate",
               options: {
                 cacheName: "disbursements-cache",
                 expiration: { maxAgeSeconds: 3600 },
               },
             },
             {
               urlPattern: ({ url }) =>
                 url.pathname.startsWith("/api/member/meetings"),
               handler: "StaleWhileRevalidate",
               options: {
                 cacheName: "meetings-cache",
                 expiration: { maxAgeSeconds: 3600 },
               },
             },
             {
               urlPattern: ({ url }) =>
                 url.pathname.startsWith("/api/member/wallet"),
               handler: "NetworkOnly", // Never cache wallet balance
             },
             {
               urlPattern: ({ url }) => url.pathname.startsWith("/api/webhook"),
               handler: "NetworkOnly", // Never cache webhook
             },
           ],
           navigateFallback: "/index.html",
           navigateFallbackDenylist: [/^\/api\//],
         },
         devOptions: { enabled: true },
       }),
     ],
   });
   ```

3. **App icons** — create placeholder instructions. The developer must supply actual PNG icons. Place them in `frontend/public/icons/`:
   - `icon-72.png` (72×72)
   - `icon-96.png` (96×96)
   - `icon-128.png` (128×128)
   - `icon-192.png` (192×192)
   - `icon-512.png` (512×512)
   - `icon-512-maskable.png` (512×512, with safe zone padding for maskable)
   - Design: cross/flame motif on deep blue `#1a3c6e` background

4. **`frontend/public/firebase-messaging-sw.js`**:

   ```js
   importScripts(
     "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
   );
   importScripts(
     "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
   );

   firebase.initializeApp({
     apiKey: "__FIREBASE_API_KEY__",
     authDomain: "__FIREBASE_AUTH_DOMAIN__",
     projectId: "__FIREBASE_PROJECT_ID__",
     messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
     appId: "__FIREBASE_APP_ID__",
   });

   const messaging = firebase.messaging();
   messaging.onBackgroundMessage((payload) => {
     const { title, body } = payload.notification;
     self.registration.showNotification(title, {
       body,
       icon: "/icons/icon-192.png",
     });
   });
   ```

   Note: Replace `__PLACEHOLDER__` values using a build script or Vite plugin that injects env vars into this file. Add `scripts/inject-sw-config.js` that reads `.env` and replaces placeholders before build.

5. **`scripts/inject-sw-config.js`** — Node script:

   ```js
   // Reads frontend/.env, replaces __FIREBASE_*__ in firebase-messaging-sw.js
   // Run before `vite build` as part of package.json build script:
   // "build": "node scripts/inject-sw-config.js && vite build"
   ```

6. **`src/components/shared/InstallPrompt.jsx`**:

   ```jsx
   // Listen for 'beforeinstallprompt' event
   // Show banner: "Install Kingdom Fund Circle on your phone"
   // "Install" button triggers prompt.prompt()
   // Dismiss hides banner for 7 days (store in sessionStorage)
   // Only show on mobile (check navigator.userAgent)
   ```

7. **Offline fallback page** `frontend/public/offline.html`:
   - Simple HTML (no React build required) — branded page
   - "You are offline. Cached data is shown. Please reconnect for live updates."

8. **`src/hooks/useOfflineCache.js`**:

   ```js
   import { useEffect, useState } from "react";
   export const useOnlineStatus = () => {
     const [isOnline, setIsOnline] = useState(navigator.onLine);
     useEffect(() => {
       const on = () => setIsOnline(true);
       const off = () => setIsOnline(false);
       window.addEventListener("online", on);
       window.addEventListener("offline", off);
       return () => {
         window.removeEventListener("online", on);
         window.removeEventListener("offline", off);
       };
     }, []);
     return isOnline;
   };
   ```

9. **Offline banner component** — show at top of layout when `!isOnline`:
   ```jsx
   <div className="bg-yellow-500 text-center text-sm py-1">
     You are offline — showing cached data
   </div>
   ```

---

### Mobile-First UI Polish

1. **Tailwind config** — ensure mobile breakpoints are the default (no `sm:` prefix needed for mobile):

   ```js
   // tailwind.config.js
   content: ['./src/**/*.{js,jsx}'],
   theme: { extend: { colors: { primary: '#1a3c6e', accent: '#f59e0b' } } }
   ```

2. **Bottom navigation** for mobile member layout:
   - Fixed bottom bar: Dashboard | Wallet | Contributions | Meetings | Notifications
   - Icons + labels, active indicator
   - Hide on desktop (use `md:hidden`)

3. **Responsive admin sidebar** — collapsible on mobile, always visible on desktop.

---

### Backend — Final Hardening

1. **`backend/.htaccess`** (if using Apache shared hosting):

   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteRule ^ index.php [L]
   </IfModule>
   ```

2. **Production config caching** — document that these must be run after every deploy:

   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```

3. **`backend/public/.htaccess`** — verify Laravel's default `.htaccess` is present.

4. **`backend/.env.production.example`** — copy of `.env.example` with production-specific comments.

---

### cPanel Deployment Scripts

1. **`scripts/deploy-backend.sh`**:

   ```bash
   #!/bin/bash
   # Run on server via SSH after uploading files
   cd /home/$USER/laravel/api
   composer install --optimize-autoloader --no-dev
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan storage:link
   chmod -R 775 storage bootstrap/cache
   echo "Backend deployed."
   ```

2. **`scripts/deploy-frontend.sh`**:

   ```bash
   #!/bin/bash
   # Run locally before uploading /dist to public_html
   cd frontend
   node scripts/inject-sw-config.js
   npm run build
   echo "Frontend built. Upload /dist contents to public_html."
   ```

3. **`public_html/.htaccess`** (upload this to the frontend domain root on cPanel):

   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # Security headers
   Header always set X-Frame-Options "SAMEORIGIN"
   Header always set X-Content-Type-Options "nosniff"
   Header always set Referrer-Policy "strict-origin-when-cross-origin"
   Header always set Permissions-Policy "geolocation=(), microphone=()"
   ```

---

## Acceptance Criteria

- [ ] `npm run build` completes without errors
- [ ] Chrome DevTools → Application → Manifest shows correct app name, icons, theme color
- [ ] "Add to Home Screen" prompt appears on Android Chrome
- [ ] Installed PWA opens in standalone mode (no browser chrome)
- [ ] Dashboard loads from cache when offline
- [ ] Wallet page shows NetworkOnly error message when offline (no stale cache)
- [ ] FCM push notification received as OS notification when app is in background on Android
- [ ] `deploy-backend.sh` runs successfully on cPanel VPS via SSH
- [ ] Frontend SPA routing works after `.htaccess` setup (no 404 on page refresh)
- [ ] AutoSSL cert active on both domains, HTTP redirects to HTTPS
