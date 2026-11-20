# BICE LMS — Project Progress Document

Last updated: 2026-11-20 (design phase complete, awaiting design approval)

## Workflow (per client instruction)

1. **Design entire platform in Google Stitch FIRST** (done — 24 screens)
2. Get client approval on designs (pending)
3. Implement in Next.js using the Stitch designs as the primary visual reference (not started)

## Phase 0 — Stitch design phase: DONE

- Stitch MCP connected via `https://stitch.googleapis.com/mcp` (API key stored at
  `.secrets/stitch.key`, never committed/delivered).
- Project created: **BICE LMS Platform** (`projects/9891734431591622481`),
  URL: https://stitch.withgoogle.com/projects/9891734431591622481
- Design system **"Executive Analytics Academy"** auto-generated from the homepage
  prompt and reused for all screens: asset `assets/62d258c341d7452480482da47a621716`.
- 24 screens generated (17 desktop, 4 mobile, 1 tablet, 3 auth). Full inventory in
  `download/stitch-designs/README.md`; machine index in `registry.json`.
- All screen HTML + screenshots exported to `download/stitch-designs/{html,screenshots}/`.
- Design tokens: primary `#4F46E5`, shell `#0F172A`, canvas `#F8FAFC`, accent `#FBBF24`,
  Inter, 8px grid, rounded-lg/1px-border cards.

Scripts (reusable): `scripts/stitch/stitch.py` (MCP client), `run_queue.py` (generation
queue), `collect.py` (asset export), `sheets.py` (contact sheets), `screens.json`
(screen prompt library — source of truth for the screen set).

## Known notes

- Interrupted generation retries may have left a few duplicate screens in the Stitch
  canvas (e.g. two homepages). Keep one of each; duplicates use the same design system.
- Stitch `list_screens` returns empty for this V1 project; screens are addressed by id
  via `get_screen`. IDs are recorded in `registry.json`.

## Next phases (after design approval)

- Phase 1 Foundation: Next.js + TS + Tailwind + App Router, folder architecture per
  master prompt §16, UI kit from Stitch components, `.env.example`
- Phase 2 Auth/DB: Firebase Auth (email/password + Google, email verification, reset),
  HTTP-only cookie sessions via Firebase Admin, DB abstraction layer (Firestore first)
- Phase 3 Public website (homepage/courses/course detail with curriculum preview + SEO)
- Phase 4 Student LMS (dashboard, learning interface, protected HLS-style playback with
  signed short-lived tokens, dynamic watermark, progress tracking, notes, resources)
- Phase 5 Razorpay (server-side orders, signature verification, webhooks, auto-enrollment)
- Phase 6 Admin (courses, curriculum builder, students, orders/payments, coupons, analytics, settings)
- Phase 7 Certificates (`/verify-certificate/[id]`), reviews, announcements, notifications
- Phase 8 Security audit + Phase 9 end-to-end QA (full journey + failure scenarios)

## Credentials required before implementation can be fully activated

- Firebase (auth + Firestore) · Razorpay (key id/secret + webhook secret) ·
  Cloudinary (cloud name + signed-upload API key/secret) · SMTP/email provider (optional,
  abstracted). If unavailable at build time, integrations ship as real code with a
  clearly marked setup state (per master prompt §17).
