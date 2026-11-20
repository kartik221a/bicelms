# Task 7-a — Public Website Pages (work record)

Agent: public-website agent (task id 7-a)
Scope: `src/app/(public)/**`, `src/components/public/**`, `src/app/sitemap.ts`, `src/app/robots.ts`

## Files created

Pages (server components unless noted):

- `src/app/(public)/page.tsx` — homepage (hero + live stat chips, stats band derived from
  published courses, featured courses by ratingAvg, category tiles linking
  `/courses?category=slug`, why-learn cards, instructor intro, 3 latest approved reviews of
  the highest-rated course, FAQ accordion, newsletter band, CTA). Metadata uses
  `title: { absolute: ... }` to avoid the root layout template duplicating the brand.
- `src/app/(public)/courses/page.tsx` — catalog. Next 16 `searchParams` is awaited;
  `courseQuerySchema.parse` wrapped in try/catch falling back to defaults. GET-form sidebar
  filters (category/level/rating/price/duration radios + q search, counts computed from an
  unfiltered `listPublishedCourses` call), results toolbar with client `SortSelect`,
  CourseCard grid, server-built pagination links preserving query params, EmptyState.
- `src/app/(public)/courses/[slug]/page.tsx` — course landing. `getCourseBySlug` in
  try/catch -> `notFound()`; unpublished -> `notFound()`. Curriculum via `getCurriculum`,
  reviews via `listCourseReviews`, instructor/category via `store.get` (allowed collections),
  session via `getSession`, enrollment via `getActiveEnrollment`. Course JSON-LD
  (provider BICE Academy, INR offer price in rupees, aggregateRating when ratingCount>0).
  Tabs: Overview / Curriculum (accordion, Free Preview pills, locks, durations) /
  Instructor / Reviews (breakdown + cards) / FAQ (`parseFaqs`). Sticky purchase card with
  PriceTag lg, EnrollButton / GoToCourseButton, WishlistButton, coupon input, money-back
  note, includes list from curriculum totals. Promo video uses plain `<video>` with
  `/video-poster.svg` (asset already existed in `public/`).
- `src/app/(public)/about/page.tsx`, `contact/page.tsx` (uses `getSettings()` contact
  email/phone/address + client ContactForm), `faq/page.tsx` (4 grouped accordions),
  `privacy-policy/page.tsx`, `terms/page.tsx`, `refund-policy/page.tsx` (400+ words each,
  Razorpay/GST/30-day refund/Firebase auth/Cloudinary references).
- `src/app/(public)/verify-certificate/page.tsx` (GET form; redirects to
  `/verify-certificate/<id>` when `searchParams.certificateId` present) and
  `verify-certificate/[certificateId]/page.tsx` (`getCertificateForVerification` in
  try/catch; green verified card + PDF download link `/api/v1/certificates/<id>/pdf`;
  red not-found card otherwise).

Client components (`src/components/public/`):

- `newsletter-form.tsx` — validates, `toast.success("You're on the list!")`, no fake backend.
- `enroll-button.tsx` — EnrollButton (login redirect `?next=`, POST `/api/v1/payments/order`
  with couponCode, Razorpay checkout.js lazy-load + handler -> `/api/v1/payments/verify`
  -> `/dashboard?enrolled=1`, honest setupRequired Dialog, free-course paid-order redirect),
  WishlistButton (localStorage `bice:wishlist`, heart toggle + toasts),
  GoToCourseButton (enrolled state, links `/my-courses`).
- `sort-select.tsx` — controlled shadcn Select inside its own GET form; hidden inputs
  preserve current filters; auto-submits after value commit.
- `contact-form.tsx` — client-side validation + success toast, no fake submission.

Root metadata routes:

- `src/app/sitemap.ts` — 9 static routes + all published course slugs (`listPublishedCourses`,
  try/catch).
- `src/app/robots.ts` — allow `/`, disallow `/admin /dashboard /learn /my- /orders /profile
  /settings /certificates`, sitemap from `site.url`.

## Files removed

- `public/robots.txt` — static file conflicted with the `app/robots.ts` metadata route
  (Next.js conflicting-public-file error); the route version supersedes it with the same
  intent plus the disallow list.

## Conventions honored

- No `@/lib/db` / `@prisma/client` imports in UI; all data via services; `store` used only
  for instructors/categories (+ settings via service) inside server components.
- Paise amounts only via shared PriceTag/CourseCard/`formatINR`; JSON-LD converts to rupees
  (schema.org expects the currency unit).
- Indigo `#4f46e5` / navy `#0f172a` design tokens, rounded-xl cards, slate canvas per guide.
- No hardcoded marketing stats — numbers derived from published course data; honest empty
  states (EmptyState) everywhere data can be missing.

## Verification

- HTTP sweep (all my routes): `/` `/courses` `/courses?...filters` `/courses/<slug>` (all
  seeded slugs) `/about` `/contact` `/faq` `/privacy-policy` `/terms` `/refund-policy`
  `/verify-certificate` `/verify-certificate/<id>` `/sitemap.xml` `/robots.txt` -> **200**;
  `/courses/does-not-exist` -> **404** (notFound works).
- Content spot checks: hero headline, stat labels, JSON-LD script, Free Preview pills,
  wishlist button, includes list, robots disallow list + Sitemap line, sitemap 15 URLs.
- `bunx eslint "src/app/(public)" src/components/public src/app/sitemap.ts src/app/robots.ts`
  -> **0 errors, 0 warnings** (after removing 5 now-unneeded eslint-disable directives).
- Fresh dev.log scan per route: no runtime errors on public routes. (Errors seen in the log
  belong to other route groups — `/admin/settings` and `/my-notes` 500s from other agents.)

## Environment note

The supervised dev server died mid-session (sandbox memory pressure); I restarted it with
the same command (`next dev -p 3000`) for verification. If it is not running, the platform
supervisor should restart `bun run dev` as usual.

## Open issues

- None for public pages. Cross-group note: `GET /admin/settings` and `GET /my-notes` return
  500 with "Functions cannot be passed directly to Client Components" (icon components in
  nav arrays passed to client components) — those belong to admin (7-d) / student (7-c)
  groups, not touched here.
