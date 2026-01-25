## 2. UI/UX improvements

### 2.1. Theming & design tokens

You already have a strong `ThemeContext` with `colors` and `isDark`, but many screens still hard‑code light theme colors.

Examples:

- `HomeScreen` styles: `backgroundColor: '#F8F9FA'`, text `'#202124'`, card backgrounds `'#FFFFFF'`, etc., while JSX wraps everything in `backgroundColor: colors.background`.
- `SeatMapScreen` and `SeatDetailsScreen` also use lots of `#F8F9FA`, `#FFFFFF`, `#e2e8f0`, etc. in styles.
- `app.json` sets `"userInterfaceStyle": "light"` while you support dark mode in the app.

**Improvements:**

1. Replace hard‑coded colors in styles with theme tokens from `ThemeContext`:
   - Container backgrounds → `colors.background`.
   - Cards → `colors.surface`.
   - Secondary surfaces → `colors.surfaceSecondary`.
   - Text → `colors.text`, `colors.textSecondary`, `colors.textMuted`.
   - Borders → `colors.border` / `colors.borderLight`.
   - Status colors (success/warning/error/available/etc.) → the ones defined in `themes`.

2. Align platform setting with your theme system:
   - In `app.json`, consider `"userInterfaceStyle": "automatic"` so the OS theme aligns with your “system” mode.

3. Typography consistency:
   - You load `Montserrat_700Bold`, `Inter_400Regular`, `Inter_500Medium` in `App.js` but most text doesn’t set `fontFamily`.
   - Define a small typography map (e.g. `heading`, `body`, `caption`) with font families and reuse those.

---

### 2.2. Header, tab bar, and global layout

- `Header` is used only in the Home stack (`HomeStack()` in `App.js`), so Seat Map, Seat Details, Focus Timer, etc. all roll their own headers.
- The bottom tab bar is nicely styled and uses theme colors, but the top header experience is inconsistent across screens.

**Improvements:**

1. **Global layout shell:**
   - Introduce a `Shell`/`ScreenContainer` component that:
     - Renders `Header` (user info + theme toggle).
     - Optionally renders `OfflineIndicator`.
     - Provides a consistent padded scroll container and FAB region.
   - Wrap major screens (`HomeScreen`, `SeatMapScreen`, `BookingsScreen`, `ProfileScreen`) in it.

2. **Consistent headers:**
   - For detail screens (Seat Details, Focus Timer, Rewards, QR Scan):
     - Use a shared header component that supports:
       - Back button.
       - Title.
       - Optional right actions.
     - Style it only with theme colors.

3. **Offline indicator placement:**
   - `OfflineIndicator` is currently only on `HomeScreen`.
   - Consider placing it in the global shell so connectivity state is visible anywhere (seat map, bookings, etc.).

---

### 2.3. Home screen UX (`HomeScreen.js`)

Observations:

- Search bar is purely visual—no state or filtering logic.
- “Live occupancy” banner + map preview is currently static (hard‑coded text and image).
- Active booking card:
  - Uses `activeBooking.seatId` but hard‑codes location `"Library North"` instead of `activeBooking.location`.
- FAB at bottom right goes to `QRScan` (good), but the “Find Nearest Available Seat” button always goes to `Map` without considering location or filters.

**Improvements:**

1. **Make search actual search:**
   - Add local state for the query and use it to filter:
     - Nearby libraries.
     - Or at least seat zones/floors shown on the map screen.
   - Debounce and wire to `services/api` or in‑memory mock until backend is ready.

2. **Use real data in occupancy section:**
   - Feed the “Live Occupancy” text from:
     - Aggregated seat stats from `SeatMapScreen` (e.g., via a shared context or a “stats” endpoint).
   - Example: “Current capacity: 64%” should be computed from `available/total` instead of hard‑coded.

3. **Use real booking location:**
   - Replace `"Library North"` with `activeBooking.location` from `BookingContext`.

4. **Contextual CTA:**
   - When user has an active booking, the Home FAB could be “Extend booking” or “Check in/out” rather than scanning QR again.

---

### 2.4. Seat map UX (`SeatMapScreen.js`)

Strengths:

- Nice animated seats, clear legend, zoom control, floor tabs, and live badge with `isLive` state.
- Bottom sheet for selected seat is polished.

Issues / opportunities:

- QR FAB on Seat Map (`styles.fab` in `SeatMapScreen`) currently has no `onPress`, so it doesn’t do anything.
- Floor tabs call `setCurrentFloor(floor)`, but there’s no immediate visual feedback of loading/failure when fetching new data for that floor.
- No explicit empty/failed state for when API returns nothing or errors; it silently falls back.

**Improvements:**

1. **Wire QR FAB:**
   - Add `onPress={() => navigation.navigate('QRScan')}` to the Seat Map FAB, to match Home’s FAB behaviour.

2. **Loading state per floor:**
   - When `currentFloor` changes:
     - Show a “Loading seats…” label near the live badge or temporarily grey out the grid.

3. **Error/empty state:**
   - If `getSeatHeatmap` fails or returns empty, show:
     - A small inline message (“Using sample layout – live data not available.”) rather than silent fallback.

4. **Accessibility:**
   - You already have `accessibilityLabel` and `accessibilityRole` on `AnimatedSeat`, which is excellent.
   - Consider:
     - Adding `accessibilityHint` for occupied/reserved seats (e.g. “Seat occupied; cannot be selected”).

---

### 2.5. Seat details UX (`SeatDetailsScreen.js`)

Observations:

- Strong detail view: hero image, rating, amenities, schedule chips, rewards card, duration selector, bottom CTA bar.
- Location gating: `locationStatus !== 'in_range'` disables booking, shows warning card.

Issues / opportunities:

- Hard‑coded color palette (lots of whites/grays) instead of theme tokens.
- Warning card is static text and doesn’t offer actions (like “Open settings”, “Retry location”).
- The “Today’s Schedule” row uses fixed decorative sample times; not actually wired to any booking data.

**Improvements:**

1. **Use theme colors:**
   - Replace direct hex codes in styles with `colors.surface`, `colors.textSecondary`, `colors.warning`, etc.
   - For the location warning card, use `colors.error`, `colors.surfaceSecondary`.

2. **Better location failure UX:**
   - Differentiate between:
     - “Permission denied” vs “Out of range”:
       - If no permission: show “Enable Location” CTA → calls a helper in `geolocation.js` to request permissions / open settings.
   - Add a “Retry location” button near the warning.

3. **Integrate schedule with bookings:**
   - Derive “busy/blocked/selected” slots from the user’s existing bookings on that seat or on the floor/day.
   - For now you can:
     - Use booking history from `BookingContext` to highlight times user has already booked.

---

### 2.6. Header & user identity (`Header.js`, `AuthContext.js`)

Issues:

- `Header` uses hard‑coded:
  - Avatar URL.
  - User name `"Alex Sterling"`.
- `AuthContext`’s mock user uses the same hard‑coded avatar URL and details.

**Improvements:**

1. **Connect header to auth:**
   - Import `useAuth` in `Header` and derive:
     - `userInfo?.fullName` or fallback to `"Guest"`.
     - `userInfo?.imageUrl` or fallback to initials avatar.

2. **Single source of truth for demo identity:**
   - Keep demo user (name/avatar) centralized in `AuthContext` only; the header should never hard‑code them.

3. **Notification button:**
   - Currently static. Options:
     - Show real count of unread notifications (from `notifications.js` if you add it).
     - Or open a simple notifications screen/bottom‑sheet, even if initially filled with mock data.

---

### 2.7. Auth flows (`App.js`, `AuthContext`, `LoginScreen`/`SignUpScreen`)

From `App.js`:

- If Clerk not configured, app goes straight to `AppContent` (dev mode).
- If configured, `ClerkProvider` + `SignedIn`/`SignedOut` gates Root vs Auth Navigator.

Likely UX gaps (Login/SignUp screens are truncated but typical):

- No explicit loading screen for “auth + fonts + theme” combined.
- Potential flicker when Clerk is booting but fonts are already loaded.

**Improvements:**

1. **Unified app loading screen:**
   - Create `AppLoading` that:
     - Uses theme.
     - Shows brand mark and a spinner.
   - Render it while:
     - Fonts are not loaded OR
     - `AuthContext.isLoading` is true OR
     - `ClerkLoaded` is not ready (if Clerk configured).

2. **Onboarding vs login:**
   - If user is completely new (no bookings, no profile setup):
     - Direct them to a short onboarding explaining:
       - Seat map.
       - Focus timer.
       - Rewards.

---

### 2.8. Accessibility and motion

You already use haptics (`selectionChanged`, `lightImpact`, `successNotification`) and animation.

Further improvements:

- Respect reduced motion:
  - For `SkeletonLoader` and pulsating seats, conditionally disable `withRepeat` animations if the system “reduce motion” is on.
- Larger hit areas:
  - Ensure touch targets like floor tabs, schedule chips, and small icons meet 44px minimum.

---

## 3. Functionality & architecture improvements

### 3.1. Booking flow consistency (`BookingContext`, Home, Seat Map, Seat Details, Bookings)

Current state:

- `BookingContext`:
  - Fallback user ID.
  - Abstracts `createBooking`, `checkIn`, `cancelBooking`, `completeBooking`.
  - Converts Supabase rows to an internal shape with `expiresAt`, `checkedIn`, etc.
- `HomeScreen` shows a countdown from `activeBooking.expiresAt`.
- `SeatDetailsScreen` triggers `createBooking` and then immediately navigates to `Bookings`.

**Improvements:**

1. **Single source of truth for status:**
   - Ensure the same `activeBooking` state drives:
     - Home “Active Booking” card.
     - Bookings list.
     - Seat map highlighting of the reserved seat.
   - On booking creation, consider:
     - Navigating back to Home and showing a toast/snackbar rather than an alert.

2. **Check‑in via QR + geofence:**
   - `QRScanScreen` + `LocationContext` + `BookingContext.checkIn`:
     - On valid scan and in‑range location:
       - Call `checkIn(bookingId)` and show a “You’re checked in” state on Home & Bookings.

3. **Expiry handling:**
   - When `remainingSeconds` hits 0 in `HomeScreen`, call `completeBooking` or prompt extension.

---

### 3.2. Offline & sync (`OfflineIndicator`, `useOffline`, `services/offline.js`, `syncQueue.js`)

You already have:

- `OfflineIndicator` reading `useOfflineSync()` (`isOnline`, `pendingCount`, `isSyncing`).
- `offline` and `syncQueue` services in `src/services`.

Improvements:

1. **Enforce offline‑first patterns on booking/API calls:**
   - Wrap booking mutations (`createBooking`, `checkIn`, `cancelBooking`, `completeBooking`) so that:
     - If offline:
       - Add task to syncQueue.
       - Immediately update local UI state optimistically.
     - If online:
       - Do live API call but still queue for retry on failure.

2. **Global offline gate:**
   - Disable or label certain CTAs when offline (e.g. “Book seat” becomes “Book when back online (queued)”).

---

### 3.3. Error handling & logging

- `BookingContext` mostly `console.error`/`console.warn` on errors.
- `SeatMapScreen` catches seat API errors and falls back silently.

Improvements:

1. **User‑visible error messaging:**
   - Add small non‑blocking banners or inline error labels:
     - “Couldn’t refresh seats. Showing last known layout.”
     - “Some bookings may be out of date; check your connection.”

2. **Central error boundary:**
   - You already have `ErrorBoundary` wrapped around the app in `App.js`.
   - Consider:
     - Logging more detailed error info or adding a “Send feedback” button when a crash occurs.

---

### 3.4. Code organization & duplication

- Repeated spacing, typography, radii, card patterns across screens.
- Repeated usage of haptics in many places with similar patterns.

Improvements:

1. **Design system primitives:**
   - Create small building blocks in `components/`:
     - `Card`, `SectionHeader`, `Chip`, `PrimaryButton`, `SecondaryButton`, `IconButton`, etc.
   - Replace ad‑hoc `View` + `StyleSheet` card definitions in Home, Seat Map, Seat Details.

2. **Haptics utility normalization:**
   - You already have `utils/haptics.js` with `selectionChanged`, `lightImpact`, etc.
   - Standardize when to use which:
     - `selectionChanged` for toggles/tabs.
     - `lightImpact` for main CTAs.

---