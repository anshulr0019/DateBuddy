# DateBuddy — Changes to Make

Audit date: 2026-08-11. Priority order. All items verified against the running server and live Neon DB.

Legend: `[x]` = done, `[ ]` = pending (OTP items deferred to user, who is fixing them).

---

## P0 — must fix before anything else

### 1. Auth bypass: server must verify the Firebase idToken, never trust a client boolean
**File:** `src/app/api/auth/verify-otp/route.ts`
**Problem:** `let isVerified = Boolean(firebaseVerified)` trusts a boolean from the request body. A POST with `{"firebaseVerified": true, "otp": "000000"}` authenticates any phone number (proven live). The DB-OTP path is secure; it's just fully bypassable via this field.
**Change:**
- Remove the `firebaseVerified` trust. When the client indicates Firebase was used, the server must verify the Firebase **idToken** itself (Firebase Admin SDK or `google-auth-library` token verification), and enforce that the token's `phone_number` matches the submitted number before issuing a session.
- Do not branch on a client-supplied boolean.
- (Optional) Reject unknown fields in the request body so future bypasses can't hide as "extra" fields.
**Status:** `[ ]` — user is fixing the whole OTP flow.

### 2. New signups must not be auto-verified
**File:** `src/app/api/auth/verify-otp/route.ts:103`
**Problem:** New users are created with `isVerified: true`, so a fresh account mints a verified badge with zero verification.
**Change:** Set `isVerified: false` on creation (or `null` and treat null as unverified).
**Status:** `[ ]` — same file as #1.

---

## P1 — security / correctness hardening

### 3. Remove runtime `ALTER TABLE` from read paths
**Files:** `src/app/api/meetups/route.ts`, `src/app/api/meetups/create/route.ts`
**Problem:** Every `GET /api/meetups` ran DDL (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Took table locks and would bite at scale; failures were swallowed so `/home` broke silently.
**Change:** Removed the `pool.query` ALTER block from both routes, removed the fallback-insert retry in `create`, and dropped the now-unused `pool` imports. Confirmed both columns (`require_approval`, `status`) exist in the live DB before removal.
**Status:** `[x]` done.

### 4. Consolidate the two competing kick implementations
**Files:** `src/app/api/meetups/[id]/attendees/[userId]/route.ts` (deleted), `src/app/api/meetups/[id]/manage/route.ts`
**Problem:** Two routes did "kick" differently — one deleted the attendee row (slot freed, instant re-join), the other set `status='kicked'` (blocked from re-joining). The `kicked` status is the intended design: the join route rejects it and the UI renders it.
**Change:** Switched the UI (`src/app/meetups/[id]/page.tsx` `kickUser`) to call `POST /api/meetups/[id]/manage` with `{ action: 'kick', targetUserId }`, and `git rm`'d the DELETE route. The `manage` route's approve/decline were already the UI's only callers there.
**Status:** `[x]` done.

### 5. Sanitize `GET /api/auth/me` response
**File:** `src/app/api/auth/me/route.ts`
**Problem:** `...user` leaked every column: `phoneNumber`, `email`, `googleId`, `settings`, `onboardingCompletedAt`. Consumers: `settings/page.tsx`, `discover/page.tsx`, `useCurrentUser.ts`.
**Change:** Now returns an allowlisted shape (id, name, phoneNumber, email, city, bio, dateOfBirth, gender, lookingFor, isVerified, onboardingCompletedAt, createdAt, photos). `googleId` and `settings` no longer leave the server.
**Status:** `[x]` done.

### 6. Restore the `NODE_ENV` guard on the OTP dev log
**File:** `src/app/api/auth/send-otp/route.ts:141`
**Problem:** `if (process.env.OTP_DEV_LOG === 'true')` — the documented decision was `NODE_ENV !== 'production' && OTP_DEV_LOG === 'true'`. One misconfigured prod env leaks every login code.
**Change:** Add back the `process.env.NODE_ENV !== 'production' &&` guard.
**Status:** `[ ]` — part of the OTP work the user is doing.

### 7. Stop shipping hardcoded Firebase credentials
**File:** `src/lib/firebase.ts:11-18`
**Problem:** Real Firebase project values as `|| "AIzaSyBuT7..."` fallbacks, committed in source and shipped in the bundle.
**Change:** Remove the hardcoded fallbacks (fail hard if `NEXT_PUBLIC_FIREBASE_*` is missing), and rotate the committed key if the repo has ever been public.
**Status:** `[ ]` — tied to the OTP/Firebase work.

### 8. Handle empty body in `send-otp`
**File:** `src/app/api/auth/send-otp/route.ts:15`
**Problem:** `request.json()` throws on an empty body → 500 instead of a 400.
**Change:** Wrap parse in try/catch and return 400 `'Phone number is required'`.
**Status:** `[ ]` — part of the OTP work.

---

## P2 — UX / consistency

### 9. Wire the Gold "Like Back" button to an actual match
**File:** `src/app/likes/page.tsx`
**Problem:** The Gold-tier CTA just did `router.push('/discover')`. It didn't create a swipe or match.
**Change:** Now POSTs `{ swipedUserId, action: 'like' }` to `/api/swipes`, removes the responded-to liker from the grid, navigates to `/matches` on a match, shows a busy state ("Matching…"), and surfaces limit/error messages.
**Status:** `[x]` done.

### 10. Add `/likes` to middleware protection
**File:** `src/middleware.ts`
**Problem:** `/likes` was in neither `protectedRoutes` nor the matcher, so it rendered for unauthenticated users (self-protected via API 401, but inconsistently).
**Change:** Added `'/likes'` to `protectedRoutes` and `'/likes/:path*'` to the matcher.
**Status:** `[x]` done.

### 11. `send-otp` logs to console on success
**Files:** `send-otp/route.ts:82,99,130`
**Problem:** Real provider success logs `[AUTH] Fast2SMS real OTP sent...` — confirms a number is registered; fine in dev, noisy/leaky in prod.
**Change:** Gate these behind the same `NODE_ENV !== 'production'` guard, or drop them.
**Status:** `[ ]` — part of the OTP work.

---

## Notes
- Nothing here is committed. `git status` includes the pre-existing 12 modified files + `?? src/app/api/notifications/`, plus this session's changes: `auth/me`, `meetups/route.ts`, `meetups/create/route.ts`, `meetups/[id]/page.tsx`, `likes/page.tsx`, `middleware.ts`, and the deleted `attendees/[userId]/route.ts`.
- `npx tsc --noEmit` is clean.
- The live test user created during the bypass proof (id 29) was deleted; DB is back to 13 users.
- Run `npm run dev` and re-test after fixes:
  - Wrong OTP → 401, correct OTP → 200, replay → 401, 5-attempt lockout → 429
  - `firebaseVerified: true` with garbage OTP → **must now fail**
  - Kick a participant → slot freed, `status='kicked'`, they can't re-join
  - `/likes` unauthenticated → 307 to `/welcome`
