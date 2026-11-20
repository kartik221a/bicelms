# Task 7-b — Authentication pages — work record

Agent: auth-pages builder (task 7-b)
Date: 2026-11-20

## Files created

Components (`src/components/auth/`):

- `firebase-client.ts` — lazy Firebase web client. `isFirebaseClientConfigured()`
  guards on `NEXT_PUBLIC_FIREBASE_API_KEY`. SDK (`firebase/app`, `firebase/auth`)
  is dynamically imported so setup-mode bundles stay light. Exposes
  `firebaseSignInWithEmail`, `firebaseCreateUserWithEmail` (also triggers
  `sendEmailVerification`), `firebaseSignInWithGoogle` (popup, select_account),
  `exchangeIdTokenForSession` (POST `/api/v1/auth/session` { idToken }), and
  `firebaseErrorMessageFor` (maps common `auth/*` codes to friendly copy).
- `auth-api.ts` — typed envelope helpers `postJson`/`getJson` (`{ ok, data }` /
  `{ ok, error: { code, message } }`), `AuthApiError`, `fetchSessionInfo`
  (GET `/api/v1/auth/session`).
- `password-input.tsx` — password field with eye toggle (forwardRef, RHF-ready).
- `password-strength-meter.tsx` — 4-segment live meter (length 8+, mixed case,
  digit, symbol) with red→orange→amber→emerald scoring and criteria hint.
- `google-button.tsx` — "Continue with Google": when Firebase client is NOT
  configured renders disabled with tooltip "Configure Firebase to enable Google
  sign-in"; when configured runs popup sign-in → session exchange → redirect.
- `demo-accounts-hint.tsx` — dismissible subtle info box shown on the login card
  only when `GET /api/v1/auth/session` returns `setupMode === true`. Shows
  `admin@bice.local / Admin@12345` and `rahul@example.com / Student@12345`.

Pages (`src/app/(auth)/`):

- `login/page.tsx` — "Welcome back" card; RHF + zod `loginSchema`; email +
  password (eye toggle) + cosmetic remember-me + "Forgot password?" link; root
  error Alert + toast on failure; success → `router.push(next || "/dashboard")`
  (`next` sanitized, must start with "/") + `router.refresh()`. Uses Firebase
  client flow when configured, else local login API. Demo hint, Google button,
  "New to BICE? Create an account" footer, trust row with lock icon
  ("Secured with Firebase Authentication • 256-bit TLS encryption"). Wrapped in
  `<Suspense>` for `useSearchParams`.
- `register/page.tsx` — full name, email, phone (optional, +91 prefix), password
  with live strength meter, confirm password (zod refine match), required terms
  checkbox; mail-icon note "We'll send a verification link to your email
  address". Submit: local mode → POST `/api/v1/auth/register`; firebase mode →
  `createUserWithEmailAndPassword` → POST register (profile record) → POST
  session. Redirect `/verify-email?email=…`. 409 conflict marks the email field
  + inline Alert. Google button + "Already have an account? Log in".
- `forgot-password/page.tsx` — email → POST `/api/v1/auth/forgot-password`;
  success state swaps form for green CheckCircle banner: "Reset link sent —
  check your inbox. Link expires in 30 minutes.", Resend button with 30s
  cooldown, back-to-login link.
- `reset-password/page.tsx` — Suspense-wrapped; reads `?token`; missing token →
  "Invalid reset link" card; form = new password (strength meter) + confirm
  (refine); POST `/api/v1/auth/reset-password` { token, password }; success →
  "Password updated" card + auto-redirect to /login after 1.5s.
- `verify-email/page.tsx` — Suspense-wrapped. `?token` → POST
  `/api/v1/auth/verify-email` once (ref-guarded) → success card ("Email
  verified", dashboard/login links) or error card (API message, e.g. "This
  verification link is invalid or has expired."). `?email` only → "Check your
  inbox" info card with the address, 60-minute expiry note, resend guidance.
  Neither → generic check-inbox card.

## Scope compliance

- Only `src/app/(auth)/**` and `src/components/auth/**` were created/edited.
- No edits to layouts, services, API routes, validators, or other groups.
- Reused `@/validators` schemas (login/register/forgotPassword/password) and
  extended register with client-only confirmPassword + terms refine.

## Verification (curl, all 200 on clean boot)

- `GET /login` 200, `/register` 200, `/forgot-password` 200,
  `/reset-password` 200, `/verify-email` 200 (also with `?token=` / `?email=`
  / `?next=` params).
- `GET /api/v1/auth/session` → 200 `{ setupMode: true, dataProvider:
  "local-sqlite", integrations.firebase: false }` → demo hint renders.
- `POST /api/v1/auth/login` admin@bice.local → 200 + session cookie; wrong
  password → 401 unauthorized (rendered inline + toast).
- `POST /api/v1/auth/register` → 201; duplicate email → 409 conflict.
- `POST /api/v1/auth/forgot-password` → 200 (non-revealing message).
- `POST /api/v1/auth/verify-email` (real token from local store) → 200; bad
  token → 400 bad_request.
- `POST /api/v1/auth/reset-password` → 200; login with new password → 200.
- `bunx eslint "src/app/(auth)" src/components/auth` → clean (0 errors, 0
  warnings).
- dev.log: no runtime errors from these routes (last entries show all requests
  200 and the expected 400 for an invalid verify token).

## Environment notes / incidents

- One transient dev-server crash occurred mid-task: `Cannot find module
  '@opentelemetry/api'` inside `firebase-admin` → `google-gax` when the auth
  session route first compiled. Root cause: node_modules churn during the
  initial install while the server was hot-compiling. On a clean boot the same
  route compiles and serves 200 — no code or dependency change needed.
- Sandbox kills any process started from an agent shell when the shell command
  finishes, so the dev server was left down after verification; the platform
  supervisor owns `bun run dev` on port 3000 and will bring it back up. All
  routes verified working on each fresh boot.
- Test artifacts (user `curl-test@example.com` + tokens) were deleted from the
  local SQLite store after verification.

## Unresolved issues

- None in my scope. Note for future agents: `POST /api/v1/auth/session` (ID
  token exchange) has no route handler yet in `src/app/api/v1/auth/session/route.ts`
  (GET only) — the Firebase-mode login/register/Google flows I built call it
  and currently surface its error. Owner of the auth API (task 7-a?) needs to
  add the POST handler calling `createFirebaseSession(idToken)`.
