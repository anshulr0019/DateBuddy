# DilSe / DateBuddy — Handoff Context

**Date:** 2026-08-05
**Branch:** `main` (all work uncommitted in working tree)
**Repo:** `/Users/anshul/Desktop/DateBuddy`
**Stack:** Next.js 15 (App Router), React 19, Drizzle ORM + Postgres (`pg`), Tailwind v4, Capacitor (iOS), JWT sessions via `jose`

> ✅ **Build is GREEN** with ESLint now enabled at build time. `npx tsc --noEmit` and `npm run build` both pass as of 2026-08-05.
>
> ✅ **Migrations applied and the backend is runtime-verified** against the live Neon DB (13 users, 11 backfilled). Auth, the onboarding gate, profile edit, settings, verification and account deletion were all exercised end to end with curl.
>
> ⚠️ **The UI itself has still never been opened in a browser.** Every check so far was at the API layer.

### ⚠️ Schema drift found — `otp_codes` did not exist

The live database was missing the `otp_codes` table entirely, even though it is in both `schema.ts` and `drizzle/0000`. The original schema was applied with `push`, and this one table never landed. **Phone login could never have worked in this environment** — and the old `.catch(() => [])` swallowing is exactly what hid it, since the query failed silently and the route returned `success: true` anyway.

Created directly from the `0000` definition (7 columns + `otp_codes_phone_idx`). There is still **no drizzle migration journal table**, so the DB is `push`-managed, not `migrate`-managed. Anyone running `drizzle-kit migrate` here would try to re-apply `0000` and fail on the existing tables — use `push` or hand-written SQL.

---

## Background: why this work started

The user asked for a full audit of whether the app works end to end. Three parallel subagent audits covered (1) auth + onboarding, (2) discover→swipe→match→chat, (3) meetups/profile/settings/infra. The audit found the backend was largely well-built (real DB, real session auth, correct ownership checks everywhere, no IDOR found) but with a **catastrophic auth bypass**, three screens still on mock data, and a missing profile-edit API.

The user then said "yeah, start fixing this." Work proceeded in an agreed priority order:
1. OTP verification + remove user-1 fallbacks ✅
2. Strip mock data from `/matches` and `/home` ✅ (needs typecheck fix)
3. Lock down `/api/upload` ✅
4. Add onboarding gate ✅

The user interrupted mid-task-2 to request this document. **No further coding was done after that instruction.**

---

## Current Progress

### Completed

**1. OTP verification was completely bypassed — FIXED (critical)**
The original `verify-otp/route.ts` imported `hashOtp` and `timingSafeEqual`, declared `MAX_ATTEMPTS = 5`, and used **none of them**. It fetched the OTP record, marked it consumed, and never compared the submitted code to `record.codeHash`. **Any 6-digit string authenticated any phone number.** Expiry and attempt count were also never checked.

Now implemented: constant-time hash comparison, expiry check, attempt counter with lockout at 5, single-use burn on success.

**2. Session fallbacks that minted user ID 1 — REMOVED (critical)**
Two paths (`if (!currentUser)` and the outer `catch`) fabricated `{id: 1}` and called `setAuthSession(1, ...)`, returning `success: true`. A DB outage handed every caller a valid cookie for whoever user 1 is. Both removed; errors now return 500. The same pattern in `send-otp` (returning `success: true` on failure) was also removed.

**3. Plaintext OTP logging — REMOVED**
`send-otp` logged `[AUTH][dev] OTP for ${phone} is ${code}` whenever Twilio was unconfigured — which is the case today (Twilio env vars exist but are empty). Also removed the misleading `'OTP sent (Dev mode: 1234)'` response literal (the real code was random, so that string was always a lie).

**4. Onboarding gate — ADDED**
Middleware previously only checked cookie *presence*. A user created by `verify-otp` gets placeholder values (`name: 'New User'`, `city: 'Mumbai'`, `dateOfBirth: 2000-01-01`) and could type `/discover` to enter the live dating pool mid-onboarding. There was no column tracking completion.

Added `users.onboarding_completed_at`, carried as a boolean claim in the JWT so edge middleware can gate without a DB round-trip.

**5. `/api/upload` accepted unauthenticated uploads — FIXED**
It only `console.warn`ed on a missing session and proceeded, letting anyone POST 8MB files. Now returns 401.

**6. `/matches` mock data — REWRITTEN** (⚠️ has the type error)
**7. `/home` mock data — REWRITTEN**
**8. `/api/meetups` enriched** with `attendeesCount`, `joined`, `hostName`.

### Session 3 — the P2 backlog

Everything below was previously listed as "known-broken, not yet addressed." All of it is now written and compiling; none of it is runtime-tested.

**9. Blocking now actually stops messaging (security).** `blocks/route.ts` set `matches.isActive = false` but no route read it, so a blocked user could keep sending messages. `requireParticipation` in `api/messages/route.ts` now includes `eq(matches.isActive, true)`.

**10. Online status is real.** `matches/route.ts` and `conversations/route.ts` both read `matches.isActive` as presence, so every partner showed permanently online. Both now compute from `lastActiveAt` against a 5-minute window, matching what `feed/route.ts` already did. Both list queries also gained `eq(matches.isActive, true)` so blocked matches disappear.

**11. Profile editing exists.** `src/app/api/users/me/route.ts` is new: `GET` (user + ordered photos + interest names + preferences), `PATCH` (partial, keyed on `'key' in body`, with an 18+ check on `dateOfBirth` and a 6-photo cap), and `DELETE`. `/profile` switched off `/api/auth/me` (which never returned interests) and gained a real edit modal — name, city, bio, interest chips — replacing every button that used to re-enter the onboarding wizard.

**12. Delete Account deletes.** Six tables reference `users` without `ON DELETE CASCADE`, so a naive `DELETE FROM users` throws a FK violation. `DELETE /api/users/me` runs an ordered transaction: hosted meetups' attendees → own attendee rows → hosted meetups → group memberships → null out `groups.createdBy` → activity requests → check-ins → the user row, then clears the session. The UI now requires typing `DELETE` to confirm.

**13. Interests persist.** `src/lib/interests.ts` is new and shared by onboarding and profile-edit: dedupes, trims, caps at 25, upserts into `interests` with `onConflictDoNothing`, then rewrites `user_interests`. `complete-onboarding` was already receiving the field from the client and silently dropping it.

**14. Settings persist.** `src/app/api/users/settings/route.ts` is new. Notification/privacy booleans merge into a new `users.settings` jsonb column via an allowlist; discovery values upsert into `preferences` with clamping. The sliders now call `setFilters` (it was destructured and never used) and write on release rather than on every drag frame.

**15. Verification is real.** `Math.random() > 0.3` is gone. `src/app/api/users/verification/route.ts` inserts a genuine `pending` row into the existing `verifications` table. The copy promising "our AI verifies it's really you (takes less than 30 seconds)" and "get your verified badge instantly" was replaced with team-review wording, and new submitted/pending/verified/failed screens were added.

**16. Premium and Apple sign-in stopped lying.** Premium's `alert()` became an amber notice saying payments aren't available yet and no charge was made. Apple sign-in — which wrote a hardcoded `apple.user@icloud.com` to localStorage with no session and then 401'd mid-onboarding — is now a disabled "Apple — soon" button.

**17. Small fixes.** `settings/page.tsx:55` read `u.verified` where the API returns `isVerified`, so the badge never rendered. `profile/page.tsx` linked to `/meetups`, which doesn't exist; the real listing is `/discover/meetups`.

**18. Infrastructure.** OTP dev logging returned behind a double guard (`NODE_ENV !== 'production'` **and** `OTP_DEV_LOG=true`) so phone login works locally without ever risking a code in a production log. `drizzle/` un-gitignored. `error.tsx`, `global-error.tsx` (inline styles only — it replaces the root layout) and `not-found.tsx` added. All six ESLint errors fixed and `eslint.ignoreDuringBuilds` removed from `next.config.ts`. `src/app/data/mockData.ts` and `src/app/components/MatchModal.tsx` deleted via `git rm` after grep confirmed zero importers.

### Verification status
- `npx tsc --noEmit` → **clean**
- `npm run build` → **clean, with ESLint enabled**. All four new API routes register.
- **API runtime testing → done** (2026-08-05, against the live Neon DB):

| Check | Result |
|---|---|
| `/api/health` | 200 |
| Unauthenticated `/api/feed`, `/api/users/me` | 401 |
| send-otp with `OTP_DEV_LOG=true` | code printed to terminal |
| **Wrong OTP** | 401 — the auth bypass is genuinely closed |
| **Correct OTP** | 200 + `HttpOnly; SameSite=lax` cookie carrying `onboardingComplete:false` |
| **Replay same code** | 401 — single-use burn works |
| **5-attempt lockout** | fires, "Too many incorrect attempts" |
| **Onboarding gate** | half-onboarded user hitting `/discover` → 307 to `/onboarding/basic-info` |
| Profile `PATCH` → `GET` | name/bio/city round-trip persisted |
| Interests | `📷 Photography` + `Hiking` written to `user_interests` |
| Settings `PATCH` → `GET` | persisted to both `users.settings` jsonb and `preferences` |
| Verification `POST` ×2 | one `pending` row, second call de-duplicates |
| **Account deletion** | 200, user gone, zero orphans across all child tables |

  Four throwaway accounts were created during testing and have been deleted; the DB is back to the original 13 users.
- **UI runtime testing → still none.** No page has been opened in a browser. Everything above was curl against the API.

---

## Files Changed

All changes are **uncommitted**. `git status` shows 15 modified + 1 new file. Note that `.gitignore`, `src/app/onboarding/photos/page.tsx`, and `src/app/welcome/page.tsx` were **already modified before this session started** — they are not my changes.

### `src/lib/session-token.ts` — NEW
**Why:** Middleware runs on the Edge runtime, where `next/headers` (used by `cookies()`) is unavailable. Importing `verifyAuthToken` from `lib/auth.ts` into middleware would pull `next/headers` into the edge bundle.
**What:** Extracted the runtime-agnostic pieces — `COOKIE_NAME`, `MAX_AGE_SECONDS`, `getSecret()`, `verifyAuthToken()`, and the `Session` type. Only imports `jose`.

### `src/lib/auth.ts`
**Why:** Support the onboarding claim; delegate token verification to the edge-safe module.
**What:** Now re-exports from `session-token.ts`. `setAuthSession(userId, phoneNumber, onboardingComplete = false)` gained a third param written into the JWT. `Session` type gained `onboardingComplete: boolean`. `getAuthSession()` delegates to `verifyAuthToken`. `clearAuthSession()` unchanged.

### `src/middleware.ts`
**Why:** Enforce the onboarding gate; protect onboarding routes.
**What:** Now `async` (JWT verification is async). Verifies the token rather than just checking presence. Three behaviors added:
- Authenticated but `!onboardingComplete` on a protected route → redirect `/onboarding/basic-info`
- Unauthenticated on `/onboarding/*` → redirect `/welcome`
- `/welcome` with a session → routes to `/discover` or `/onboarding/basic-info` depending on completion

Added `'/onboarding/:path*'` to the matcher. **Preserved the pre-existing `hasAuthError` logic** (uncommitted work by the user that stops a stale cookie from hiding OAuth errors on `/welcome?error=...`).

### `src/app/api/auth/verify-otp/route.ts` — largely rewritten
**Why:** The auth bypass.
**What:** Added `hashesMatch()` using `timingSafeEqual` with a length guard (`timingSafeEqual` throws on length mismatch). Flow is now: fetch newest unconsumed record → 401 if none → 429 if `attempts >= 5` (and burn the code) → 401 if expired (and burn) → increment `attempts` and 401 if hash mismatch → burn on success → look up or create user → set session. Removed all `.catch(() => [])` swallowing so DB failures surface as 500. Response no longer spreads the full user row (previously leaked `googleId`, `email`, etc.); returns `{id, name, phoneNumber}` plus `isNewUser` and `onboardingComplete`.

### `src/app/api/auth/send-otp/route.ts`
**Why:** Plaintext logging + success-on-failure.
**What:** Removed the dev-mode `console.log` of the code and the `'Dev mode: 1234'` response. Removed the outer catch's `success: true` fallback → now 500. Removed the inner try/catch and `.catch()` swallowing around DB writes, so a failed OTP insert can't leave the user at a verify screen with no valid code.

### `src/app/api/auth/google/callback/route.ts`
**Why:** Consistency with the new gate.
**What:** One block changed. Was `isNewUser || !user.city` for the redirect decision; now uses `onboardingCompletedAt`, and passes the flag into `setAuthSession`. All OAuth logic (CSRF state validation, token exchange, email-verified rejection, existing-user linking) untouched — the audit confirmed it correct.

### `src/app/api/users/complete-onboarding/route.ts`
**Why:** Mark completion and refresh the cookie.
**What:** Sets `onboardingCompletedAt: new Date()` in the users update. Calls `setAuthSession(userId, ..., true)` after success to re-mint the JWT — **without this the user would be redirect-looped back into onboarding by middleware**, since the gate reads the cookie, not the DB. Imports `setAuthSession` alongside `getAuthSession`.

### `src/app/api/upload/route.ts`
**Why:** Unauthenticated upload hole.
**What:** Two-line change — `console.warn` + proceed → return 401. The `public/uploads` dev fallback is untouched and still a problem (see Bugs).

### `src/app/api/meetups/route.ts` — rewritten
**Why:** `/home` and `/discover/meetups` need attendee counts and joined state; the list returned bare rows, so the UI always displayed "👥 1".
**What:** Added a session check (was public). Three parallel queries after the main fetch: grouped attendee counts, the current user's RSVPs, and host names. Returns each meetup enriched with `attendeesCount`, `joined`, `hostName`. No N+1 — batched via `inArray`.

### `src/app/matches/page.tsx` — rewritten ⚠️
**Why:** Imported `PEOPLE` from `mockData` and fell back to it whenever the user had zero real matches, showing six fictional people. The "Message" button did `router.push('/chat/${p.id}')` using a **mockData array index**, not a match ID — so a new user tapping Message on "Priya Sharma" hit `/chat/1`, which `useChat` couldn't resolve → guaranteed dead end. Also seeded two phantom friend requests whose Accept/Decline only mutated local state.
**What:** All mock imports removed. Renders only `/api/matches` data. Added a real empty state ("No connections yet" + CTA to Discover) and an error state with retry. 401 redirects to `/welcome`. `/chat/${p.id}` now passes the real match ID, which is what `useChat` looks up.

**Removed the tab bar entirely** (Friends/Dating/Networking/Requests/Suggestions). Justification: the tabs were decorative — when real matches existed, the filter function returned them regardless of the selected tab, and the categories map to no field in the schema. Rendering five tabs that all show identical lists is worse than one honest list. **If the user wants tabs back, they need a real category field on matches first.** Also dropped the hardcoded `profession`/`distance` literals ('Creative Professional', '1.2km away') that the API never returned; the card now shows `city` instead.

### `src/app/home/page.tsx` — rewritten
**Why:** Fully mock — `PEOPLE.slice(0,4)` for picks, `GYM_SQUADS` for squads, `EVENTS` for events. Join/leave only mutated local arrays. The "Publish Squad" handler POSTed to `/api/meetups/create` **without a `date` field**, which that route rejects with a 400 — and the error was swallowed by `.catch(() => {})`, so the squad appeared in local state while never persisting.
**What:** Picks come from `/api/feed` (first 4). Squads and events both come from `/api/meetups`. Join/leave call `POST /api/meetups/[id]/join` (that endpoint toggles) and refetch. Publish sends a real `date` and surfaces validation errors in the modal instead of swallowing them. Added a `datetime-local` input and client-side future-date validation. Empty states for all three sections.

**Squads and meetups are now the same entity.** There is no `squads` table in the schema and never was — the mock had richer fields (`level`, `equipment`, `rules`, attendee rosters with avatars) that have no DB backing. Those were dropped rather than faked. The category filter maps to `meetups.category`.

Removed the `computePersona` call: it was fed a hardcoded `mockData` object literal, so it was theatre. The persona picker still works and persists to localStorage; it just defaults to `DEFAULT_PERSONA` instead of "computing" from fabricated behavior data. `PERSONAS` / `DEFAULT_PERSONA` imports retained.

### `src/db/schema.ts`
**What:** One column added to `users` (see Database).

---

## Database

### Schema changes
| Table | Change |
|---|---|
| `users` | **Added** `onboardingCompletedAt: timestamp('onboarding_completed_at')` — nullable, no default |
| `users` | **Added** `settings: jsonb('settings')` — nullable; holds notification/privacy booleans |

Nothing else changed. No columns removed, no types altered, no indexes touched. One jsonb column was chosen over five boolean columns because the set of toggles is still in flux.

### Migrations
- **Generated:** `drizzle/0001_quick_skreet.sql` and `drizzle/0002_strange_sue_storm.sql` via `npx drizzle-kit generate`
- **Contents:** `ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp;` and `ALTER TABLE "users" ADD COLUMN "settings" jsonb;`
- **⚠️ NEITHER APPLIED.** No `db:push` or migrate was run. **The app will crash against the live DB until they are** — every `select()` on `users` references both columns.
- `drizzle/` is no longer gitignored, but the migration files are still **unstaged**. Nothing has been committed across any of these sessions.
- Pre-existing `drizzle/0000_fixed_kingpin.sql` was verified by audit to match the schema exactly (24 tables, all indexes). No drift.

### Backfill consideration (not done)
Existing users all have `onboarding_completed_at = NULL`, so **every current user will be forced back through onboarding** on next login. If there is real user data worth preserving, run something like:
```sql
UPDATE users SET onboarding_completed_at = created_at
WHERE name != 'New User' AND city != '' AND city IS NOT NULL;
```
Decide this before applying the migration to any environment with real accounts.

### Note
`drizzle/` is listed in `.gitignore:44` and `git ls-files drizzle/` is empty — **migrations are not in version control.** A fresh clone has no migrations to run. Not addressed.

---

## APIs

| Endpoint | Change |
|---|---|
| `POST /api/auth/verify-otp` | Now actually verifies. New responses: 401 invalid/expired, 429 too many attempts, 500 on error (was: always 200 + session). Response body adds `onboardingComplete`, no longer spreads the raw user row. |
| `POST /api/auth/send-otp` | No longer logs the code. Failures return 500/502 instead of `success: true`. |
| `GET /api/auth/google/callback` | Redirect target now keys off `onboardingCompletedAt`; session carries the flag. |
| `POST /api/users/complete-onboarding` | Writes `onboardingCompletedAt`; re-mints the session cookie with `onboardingComplete: true`. |
| `POST /api/upload` | Returns 401 without a session (was: proceeded as guest). |
| `GET /api/meetups` | **Now requires auth** (was public). Returns `attendeesCount`, `joined`, `hostName` per meetup. |
| `GET/PATCH/DELETE /api/users/me` | **NEW.** Profile read, partial update, and real account deletion. |
| `GET/PATCH /api/users/settings` | **NEW.** Notification/privacy toggles → `users.settings` jsonb; discovery values → `preferences`. |
| `GET/POST /api/users/verification` | **NEW.** Real `pending` row in `verifications`; replaces `Math.random()`. |
| `GET /api/matches`, `GET /api/conversations` | `online` now derives from `lastActiveAt` (5-min window), not `isActive`. Lists filter to active matches. |
| `POST /api/messages` | Blocked matches (`isActive = false`) are now rejected. |

**Unchanged but relevant:** `/api/feed`, `/api/swipes`, `/api/blocks`, `/api/reports`, `/api/meetups/[id]`, `/api/meetups/[id]/join`, `/api/meetups/create`, `/api/auth/me`, `/api/auth/logout`, `/api/health`.

---

## Important Decisions

1. **Onboarding state lives in the JWT, not the DB, for gating purposes.** Middleware runs on the edge and cannot query Postgres. The claim is written at login and re-written by `complete-onboarding`. *Consequence:* if `onboarding_completed_at` is changed directly in the DB, existing cookies stay stale until re-login. Accepted — the alternative is a DB hit on every page navigation.

2. **Split `lib/auth.ts` into two modules.** Edge runtime forbids `next/headers`. `session-token.ts` is import-safe everywhere; `auth.ts` is server-only. Preferred over duplicating verification logic.

3. **Squads == meetups.** No `squads` table exists. Rather than inventing one, `/home` squads map to `meetups` filtered by category. Mock-only fields (`level`, `equipment`, `rules`, attendee avatar rosters) were dropped, not faked.

4. **Deleted the `/matches` tab bar rather than making tabs work.** The categories have no schema backing. Five tabs showing identical data is a worse lie than one honest list. Reversible once matches carry a real type field.

5. **Removed `computePersona` from `/home`.** It consumed a hardcoded literal, so its output was decorative. Picker retained; computation dropped.

6. **Failures now fail loudly.** The prior codebase pervasively used `.catch(() => [])` and `success: true` fallbacks that converted outages into silent wrong behavior — that pattern is exactly what hid the auth bypass. Errors now return real status codes.

7. **Did not touch the working core loop.** The audit confirmed discover/swipe/match/chat are correctly built with proper ownership checks. Left alone deliberately.

8. **Honest disabled states over fake success.** Premium and Apple sign-in now say plainly that they aren't available rather than simulating a charge or a login. This follows from decision #6 — a fake success is the same class of bug as a silent fallback.

9. **OTP dev logging is double-guarded, not `NODE_ENV`-guarded.** Printing a login code to a log is a real credential leak, so it requires both a non-production build *and* an explicit `OTP_DEV_LOG=true`. Keying off `NODE_ENV` alone is one misconfigured deploy away from leaking codes.

10. **Account deletion is an explicit ordered transaction, not a cascade.** Six tables reference `users` without `ON DELETE CASCADE`. Adding cascades would be a schema migration touching live FKs; the transaction is reversible and doesn't risk existing data. *Consequence:* a new table referencing `users` must be added to this transaction by hand or deletion starts failing.

11. **`users.settings` is one jsonb column, not five booleans.** The toggle set is still changing; a jsonb blob avoids a migration per toggle. Writes go through an allowlist so the client can't inject arbitrary keys.

---

## Remaining Tasks (priority order)

### P0 — none. The app runs and the backend is verified.

### P1 — the UI has never been opened
1. **Click through the app in a browser.** All verification so far is API-level. Forms, modals, empty states, the persona picker, and the new profile-edit modal have never been rendered. Run `npm run dev` and walk the flows.
2. **Test photo upload** — the one write path not exercised, and the one that still has no durable backing.

### P2 — real gaps that remain
3. **Photos still write to `public/uploads/`** when Cloudinary is unconfigured — ephemeral, wiped on every deploy. Cloudinary env vars exist but are empty. Last unaddressed item from the original audit.
4. **No test suite.** No jest/vitest/playwright, no test script. Everything rests on reading code plus one manual curl pass.
5. **Commit the work.** Nothing from any session is committed.
6. **The DB has no migration journal.** It is `push`-managed. `drizzle-kit migrate` would fail trying to re-apply `0000`. Worth reconciling before a second environment exists.
7. **No `loading.tsx` anywhere.** Error boundaries exist; loading states don't.
8. **`src/lib/firebase.ts` is imported nowhere** and the six Firebase env vars are unused.

---

## Bugs Remaining

**1. Photo storage is ephemeral** — `public/uploads/` is wiped on every deploy.

**2. `/home` calls `/api/feed` for picks**, sharing a pool with Discover. Believed fine (feed excludes swiped users) but not specifically tested.

**3. Two users have placeholder data** (`name = 'New User'`, no city) and were deliberately left un-backfilled — they will be asked to complete onboarding, which is correct.

**Resolved this session:** missing `otp_codes` table (phone login could never have worked), both migrations applied, backfill done, and every item in the former P2 list except photo storage — all verified at the API layer.

---

## Current Plan (what was about to happen next)

The backend is done and verified. What's left:

1. **Open the app in a browser.** This is the only meaningful gap. The API contract is proven; the UI that consumes it is not.
2. **Cloudinary** if photos need to survive a deploy.
3. **Commit.** Three sessions of work sit uncommitted in the working tree.

---

## TODO

```
[x] Fix SafeImage src type — widened to `string | null` in shared.tsx:19
[x] npx tsc --noEmit → clean
[x] npm run build → clean, with eslint enabled
[x] Verify discover/meetups/page.tsx handles /api/meetups 401 — now redirects to /welcome
[x] Decide OTP dev-access strategy — gated behind NODE_ENV + OTP_DEV_LOG=true
[x] Build profile-edit API (GET/PATCH /api/users/me) + edit modal on /profile
[x] Make Delete Account actually delete — ordered transaction over 6 non-cascading tables
[x] Add eq(matches.isActive, true) to requireParticipation in api/messages/route.ts
[x] Persist interests in complete-onboarding → user_interests (via src/lib/interests.ts)
[x] Remove or implement Apple sign-in — now a disabled "Apple — soon" button
[x] Fix /meetups dead link → /discover/meetups
[x] Persist settings toggles + wire discovery sliders to setFilters
[x] Replace fake verification (Math.random) and premium (alert) flows
[x] Fix u.verified vs isVerified (settings/page.tsx:55)
[x] Use lastActiveAt for online status in matches/conversations routes
[x] Un-gitignore drizzle/
[x] Add error boundaries (error.tsx, global-error.tsx, not-found.tsx)
[x] Remove eslint.ignoreDuringBuilds + fix all 6 lint errors
[x] Delete src/app/data/mockData.ts and MatchModal.tsx (zero importers)
[x] Fix stale npm db scripts (drizzle-kit v0.20 syntax → v0.31)
[x] Decide backfill for onboarding_completed_at — backfilled 11 of 13 users
[x] Apply both migrations to the live Neon DB
[x] Create the missing otp_codes table (schema drift — was never in the DB)
[x] API-test: wrong OTP fails, correct OTP works, replay fails, 5-attempt lockout
[x] API-test: onboarding gate 307s /discover → /onboarding/basic-info
[x] API-test: profile edit, interests, settings persistence, verification, account delete

[ ] Open the app in a browser and click through every flow (UI is untested)
[ ] Test photo upload end to end
[ ] Configure Cloudinary or another durable photo store
[ ] Commit all session work (nothing is committed yet)
[ ] Add loading.tsx states
[ ] Add a test suite
[ ] Reconcile the missing drizzle migration journal (DB is push-managed)
```

---

## Context for Next Session

**How to orient quickly:**
- `git diff` shows everything. Nothing is committed.
- `src/lib/firebase.ts` is imported nowhere and Firebase env vars exist but are unused. Left in place — it was never on the TODO list.
- `mockData.ts` and `MatchModal.tsx` were deleted with `git rm`, so they're recoverable from history if a UI turns out to need something from them.
- New files worth knowing about: `src/lib/interests.ts`, `src/app/api/users/{me,settings,verification}/route.ts`, and the three error boundaries in `src/app/`.

**Environment:** `.env.local` exists and is correctly gitignored (never committed — verified via `git log --diff-filter=A`). Contains `DATABASE_URL`, `SESSION_SECRET` (64 chars, valid), Google OAuth creds (populated, working), Twilio (**empty**), Cloudinary (**empty**), and six Firebase vars (unused). Add `OTP_DEV_LOG=true` to get login codes printed to the dev terminal.

**Architecture notes for anyone continuing:**
- The API layer is genuinely well-built. Every route handler checks `getAuthSession()` and enforces row ownership. The audit specifically looked for IDOR and found none. Don't assume the backend is sloppy because the UI had mock data.
- The core loop (feed → swipe → match → chat) is real and correct: no N+1, keyset pagination, bidirectional block filtering in the feed, chat polling at 5s with optimistic send and an offline queue. **Don't rewrite it.**
- The failure mode throughout this codebase was *silent fallbacks* — `.catch(() => [])`, `success: true` on error, mock data behind an `if`. When something looks like it works, verify it actually hits the DB.

**Tone/process notes:** The user asked for verification, not assumption — the audit brief explicitly said "be skeptical, verify by reading, don't assume a route works because it exists." Continue that standard. The user also interrupted to request this handoff, which suggests they want visibility before more code lands; check in before large changes.
