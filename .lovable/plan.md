# Plan

## 1. Per-question images (cropped, one per question)

- Add a well-known folder `src/assets/questions/q/` where you drop `q{ID}.png` (or `.jpg`) — one image per question ID that has a sign.
- Update `src/lib/exam/question-images.ts`:
  - Prefer a per-question file via `import.meta.glob("@/assets/questions/q/q*.png.asset.json")`.
  - Fall back to the current combined page image only if the per-question file isn't present yet.
- No UI changes needed — exam and review already call `getQuestionImage(qid)`.

I'll wire the loader now. You then upload cropped images named `q230.png`, `q238.png`, … via chat and I'll register each as a Lovable asset in `src/assets/questions/q/`.

## 2. Enable Lovable Cloud (backend)

Enable Cloud to get database + auth. Adds email/password login. No user profile table needed beyond `auth.users` — we only need role + tokens + attempts.

## 3. Access-token gating

Users cannot start an exam without a valid, unused token. Admin issues tokens.

Schema (all in one migration, with grants + RLS):

- `app_role` enum: `admin`, `user`.
- `user_roles(user_id, role)` — standard pattern with `has_role()` SECURITY DEFINER function.
- `access_tokens`:
  - `id`, `code` (unique, uppercase 10-char), `created_by` (admin uid), `assigned_to` (nullable uid, set on redeem), `redeemed_at`, `revoked` bool, `note` text, `created_at`.
  - RLS: admins full CRUD; authenticated users can SELECT the row whose `assigned_to = auth.uid()`.
- `exam_attempts`:
  - `id`, `user_id`, `token_id`, `score` int, `total` int, `percentage` numeric, `passed` bool, `correct` int, `wrong` int, `unanswered` int, `time_used_ms` bigint, `lang` text, `answers` jsonb, `questions` jsonb (id + correct letter for admin review), `created_at`.
  - RLS: users select/insert their own; admins select all.

Server functions (`src/lib/exam/*.functions.ts`):
- `redeemToken({ code })` — validates & marks `assigned_to = auth.uid()`, `redeemed_at = now()`. Idempotent if already assigned to same user.
- `checkAccess()` — returns `{ hasAccess: boolean, tokenId?: string }`.
- `submitAttempt({ ...result })` — inserts into `exam_attempts`.
- `listMyAttempts()` — user history.
- Admin fns (guarded by `has_role(uid,'admin')`):
  - `createTokens({ count, note })` — generates N codes.
  - `listTokens()`, `revokeToken({ id })`.
  - `listAllAttempts({ filters })` — user email + score + date.
  - `promoteToAdmin({ email })` — bootstrap seed inserts one row for the initial admin so the first admin exists on day one.

## 4. Auth UI

- `/auth` route: sign in / sign up (email+password). Standard onAuthStateChange listener in `__root.tsx`.
- Site header: show email + Sign out when logged in; Sign in button otherwise. Admin link only when `has_role admin`.

## 5. Route gating

- `src/routes/_authenticated/route.tsx` (managed pattern) — redirect to `/auth` if not signed in.
- Move `exam`, `result`, `review`, `stats` under `_authenticated/`.
- Home (`/`) stays public but "Start exam" requires sign-in.
- Before starting an exam: call `checkAccess()`. If no token, show "Enter access token" screen that calls `redeemToken`.
- `/admin` route: replaces current password gate. Requires `has_role admin`. Tabs: Tokens · Attempts · Question bank.

## 6. Results storage + visibility

- On exam submit, in addition to current localStorage flow, call `submitAttempt`.
- User stats page reads `listMyAttempts` (falls back to localStorage for legacy).
- Admin "Attempts" tab reads `listAllAttempts` — table of user email, score, %, pass/fail, date, and a drill-in to review answers.

## 7. Technical notes

- Store roles in separate table with `has_role()` SECURITY DEFINER (per project rules).
- All new tables in `public` get explicit GRANTs + RLS enabled.
- The admin bootstrap: after Cloud is enabled, tell you to sign up with your email; then I run an insert to grant you `admin`.
- Old admin password (`Manzi*182#`) is removed; access is via the admin role.

## Deliverables this turn

1. Enable Lovable Cloud.
2. Migration: enum, `user_roles`, `access_tokens`, `exam_attempts`, `has_role`, grants, RLS.
3. Server functions above.
4. `/auth` route + header auth state.
5. Move protected routes under `_authenticated/`.
6. Token-gate before exam start; attempt submission wired.
7. New admin panel (tokens + attempts + questions).
8. Per-question image loader with fallback.

After this ships you: (a) tell me your signup email so I grant admin, (b) upload cropped per-question images.
