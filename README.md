# BICE LMS — Learning Management System

Production-oriented LMS for **BICE Academy**, a professional data-skills coaching
institute (Advanced Excel, Power Query, SQL, Python, Business Dashboards).

One unified **Next.js 16** application: public marketing website + course
marketplace + student learning platform + admin control panel.

> UI designed in **Google Stitch** (project `BICE LMS Platform`) with a single
> shared design system applied to all 24 screens. Design reference package:
> `docs/design/README.md`.

## Feature checklist

| Area | Status |
| --- | --- |
| Public website (home, courses, course detail + curriculum preview, about, contact, FAQ, legal) | Done |
| Course landing with Free-Preview vs locked lessons, pricing, coupons, reviews | Done |
| Auth: email/password + Google (Firebase) with local dev provider fallback, sessions, password reset, email verification | Done |
| Student dashboard (KPIs, continue learning, announcements, activity) | Done |
| Learning interface: curriculum sidebar, protected player, notes, resources, mark-complete, prev/next | Done |
| Video security: authenticated playback, enrollment verification, short-lived signed tokens, rate limiting, session/device tracking, dynamic moving watermark, no download controls | Done |
| Progress tracking with configurable completion rules (auto 90% / manual) + resume | Done |
| Notes (CRUD + timestamps + search) and gated resources (view-only vs downloadable) | Done |
| Razorpay: server-side orders, checkout, signature verification, webhooks (idempotent), auto-enrollment after verified payment | Done (code complete; activates with env vars) |
| Admin: dashboard analytics, courses CRUD, drag-and-drop curriculum builder, students (manual enroll/revoke/suspend), orders, payments, coupons, reviews moderation, resources, announcements, settings | Done |
| Certificates: auto-issued on completion, public verification page, PDF download | Done |
| SEO: dynamic metadata, JSON-LD course schema, sitemap.xml, robots.txt, noindex on private areas | Done |
| Security: server-side RBAC, enrollment checks, zod validation, rate limiting, HTTP-only cookies, audit log, IDOR guards, no secrets in client | Done |

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Data layer**: `DataStore` abstraction (`src/repositories`) — **Firestore** in
  production (Firebase env vars present), **Prisma + SQLite** locally. Business
  logic is provider-independent.
- **Auth**: Firebase Authentication (email/password + Google) with Admin SDK
  session cookies; a clearly-marked local provider (scrypt + signed cookies)
  keeps the platform fully usable in setup mode.
- **Storage**: provider abstraction — Cloudinary (signed direct uploads) first;
  local dev provider fallback. Video delivery behind a `VideoProvider`
  abstraction (Cloudinary signed/authenticated delivery in production).
- **Payments**: Razorpay (INR). Never trusts client price/status; webhook
  verification with HMAC + idempotency.
- React Hook Form + Zod, Recharts, Lucide, sonner, hls.js, pdf-lib, dnd-kit.

## Getting started

```bash
bun install
cp .env.example .env        # fill in what you have; everything optional for dev
bun run db:push             # create SQLite schema
bun prisma/seed.ts          # demo data (courses, lessons, users, coupons)
bun run dev                 # http://localhost:3000
```

Demo accounts (seed, local provider):

| Role | Email | Password |
| --- | --- | --- |
| Super admin | `admin@bice.local` | `Admin@12345` |
| Student (enrolled) | `rahul@example.com` | `Student@12345` |
| Student | `priya@example.com` | `Student@12345` |

## Environment variables

See `.env.example`. Every integration is env-guarded: without credentials the
app runs in an honest **setup mode** (banner shown; payments show a clear
"not configured" state instead of simulating success).

### Firebase (auth + Firestore)

1. Create a Firebase project; enable Email/Password and Google providers.
2. Generate a service account key; set `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
3. Add the web app config (`NEXT_PUBLIC_FIREBASE_*`).
4. Deploy Firestore security rules to deny direct client access — all reads
   happen through the server (Admin SDK).

### Razorpay

1. Dashboard → Settings → API keys → generate; set `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`.
2. Webhooks → add `https://YOUR-DOMAIN/api/v1/webhooks/razorpay` with events
   `payment.captured`, `payment.failed`, `refund.processed`; set
   `RAZORPAY_WEBHOOK_SECRET`.

### Cloudinary

1. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
2. For protected video, mark video assets **authenticated**; the VideoProvider
   issues signed, expiring URLs only after authorization.

## Architecture

```
src/
  app/                    # routes: (public) (auth) (student) admin/ api/v1/
  components/             # shared/ lms/ player/ admin/ public/ ui/ (shadcn)
  config/                 # env (env-guarded flags), site
  lib/                    # api helpers, crypto (HMAC/scrypt), money, rate-limit
  providers/              # auth, storage, video, payments abstractions
  repositories/           # DataStore: Prisma + Firestore implementations
  services/               # domain logic (auth, courses, progress, payments…)
  validators/             # zod schemas
  middleware.ts           # edge cookie gate (real checks server-side)
prisma/                   # schema + seed
docs/                     # design reference + agent guide
```

## Video security model (honest limits)

Layered deterrents and access control: session + enrollment verification on
every playback request, short-lived signed tokens, rate limits, concurrent
session tracking, dynamic moving watermark, disabled download controls and
context menu. **No web platform can make screen recording impossible** — the
design is honest about this (master prompt §7) and the `VideoProvider`
interface is ready for fully private HLS/DRM providers.

## Deployment

```bash
bun run build
bun run start             # standalone server
```

Works on any Node host (Vercel, Railway, VPS). Set env vars from `.env.example`;
run `bun run db:push` against your database (or switch the DataStore to Firestore
by adding Firebase credentials).

## Known limitations

- Email delivery uses a console provider until SMTP/API env vars are set.
- Analytics aggregate in application code (fine at current scale; swap for
  native aggregation queries at scale).
- Q&A tab in the learning interface is a placeholder for the live cohort feature.
- `list_screens` limitation applies only to the Stitch project (see design docs).

## License

Proprietary — © BICE Academy.
