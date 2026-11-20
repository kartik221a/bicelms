# Task 7-d — Admin panel — work record

Agent: admin-panel builder (task 7-d)
Date: 2026-11-20

## Scope

All 16 admin screens + 2 loading skeletons. Server components protected by the
existing `src/app/admin/layout.tsx` guard (session role admin/super_admin).
Mutations exclusively via `src/app/admin/actions.ts` server actions (imported
into server pages, `.bind(null, id)` for dynamic params). Client interactivity
in small client components under `src/components/admin/`.

## Files created

Server pages (`src/app/admin/`):

- `dashboard/page.tsx` + `loading.tsx` — 5 StatCards (Total Students / Courses /
  Enrollments / Revenue compact / Monthly Revenue with MoM % delta computed from
  `stats.revenueTrend`), Revenue trend AreaChart (recharts, indigo fill, h-280),
  Enrollments-by-category donut PieChart with legend, Recent purchases Table,
  Recent registrations list, Most popular courses ranked list with Progress bars
  + revenue. All data via `getAdminStats()`.
- `courses/page.tsx` — GET-form toolbar (`?q=` in-memory title/slug search,
  Radix Select `name="status"` filter), courses Table (thumb+title/slug,
  category chip, instructor, price + strikethrough original, students, rating,
  status pill, updated, kebab menu: Edit link / Publish-Unpublish /
  Delete-with-confirm). Empty + filtered-empty states.
- `courses/create/page.tsx` — CourseForm (create mode) → `createCourse`, then
  client-side redirect to `/admin/courses/[id]/edit`.
- `courses/[id]/edit/page.tsx` — Curriculum builder screen: header (title,
  status pill, "Preview as student" link target=_blank, Publish/Unpublish
  toggle), CurriculumBuilder with all 10 bound actions, plus "basic course
  fields" CourseForm (edit mode, `updateCourse.bind(null, id)`).
- `categories/page.tsx` — create form (server `<form action={createCategory}>`)
  + list with course counts, rename dialog (`updateCategory` passed unbound —
  signature already `(categoryId, formData)`), delete confirm
  (`deleteCategory.bind`).
- `lessons/page.tsx` — global lessons table joined with courses/sections,
  filters `?courseId&status&q` (GET form), free-preview pill, duration, link
  "Edit course curriculum" → `/admin/courses/[id]/edit`.
- `students/page.tsx` — students table (avatar initial, name/email, joined,
  courses count, avg-progress bar, status pill, Suspend/Activate dropdown +
  Detail link). Detail = server param `?student=id` renders
  `StudentDetailDialog` (purchased courses w/ progress bars + revoke, order
  history, "Manually enroll" course select). Closing the dialog routes back to
  `/admin/students` (clears the param).
- `instructors/page.tsx` — instructor cards with course counts, create/edit
  dialog → `saveInstructor`, delete → `deleteInstructor.bind`.
- `orders/page.tsx` — orders table (Order ID mono, student, course, amount +
  strike original, Razorpay payment ID mono, status pill, date), status Tabs
  implemented as URL-param pill links, `?q=` search across order number /
  payment id / student, empty state.
- `payments/page.tsx` — payments table (order join) + StatCards (captured
  amount, failed count, refunded amount, provider status) + webhook note card
  with copyable `${site.url}/api/v1/webhooks/razorpay` (CopyText).
- `coupons/page.tsx` — coupons table (mono code, type chip, percent/fixed value,
  uses/maxUses, expires w/ expired state, active Switch → `toggleCoupon.bind`,
  delete confirm) + CouponCreateDialog → `createCoupon` (fixed-type value and
  minOrder entered in rupees, converted to paise client-side).
- `reviews/page.tsx` — reviews table (course, student, star rating, comment,
  admin-reply preview, status pill) + Approve/Hide/Reply dialog →
  `moderateReviewAction.bind(null, reviewId)`; reply keeps the review's current
  status when hidden.
- `resources/page.tsx` — resources grouped by course (type icon map, lesson
  link, Downloadable/View-only badge, "Available after <lesson>" gate badge),
  edit/delete per row, "Add resource" dialog (course → lesson-linked selects
  for lessonId and availableAfterLessonId) → `saveResource` / `deleteResource.bind`.
  Orphaned resources (course deleted) get their own card.
- `announcements/page.tsx` — publish form card (audience select toggles course
  select, pinned checkbox) → `publishAnnouncementAction` + pinned-first list
  with audience badges.
- `analytics/page.tsx` + `loading.tsx` — 5-KPI strip, gross RevenueAreaChart,
  course-sales horizontal BarChart, completion horizontal bars with 80%
  ReferenceLine + target label, registrations card, 2 data-derived insight
  callouts (top-course revenue share %, highest-completion course vs 80%
  target).
- `settings/page.tsx` — Razorpay status card (env-driven `flags`/`env`
  read-only — never shows secrets, webhook URL copy button) + SettingsForm
  (institute profile, video security: session limit input, watermark opacity
  Slider 0.05–0.30, TTL Select, downloads Switch, SEO fields) →
  `updateSettingsAction`.

Client components (`src/components/admin/`):

- `curriculum-builder.tsx` — the core screen. Nested dnd-kit: one outer
  DndContext sorting sections (handle = GripVertical), one inner DndContext per
  expanded section sorting lessons (separate handles → no sensor conflicts).
  Optimistic reorder (local order state) then `reorderSections` /
  `reorderLessons`; derived-state sync during render (no setState-in-effect).
  Expand/collapse sections, inline rename, section delete, "Add section" inline
  input, per-section "Add lesson" dashed button, LessonEditorDialog
  (title/description/video URL w/ Cloudinary helper text/durationSeconds with
  mm:ss hint/completionRule/status/isFreePreview) → `addLesson` /
  `updateLesson` + explicit `toggleFreePreview` (the action's FormData parse
  can't set `false`, so the dialog forces the boolean after edit).
- `course-form.tsx` — create/edit course form; rupees inputs converted to
  integer paise in a client wrapper before invoking the bound server action;
  Select-based category/instructor/level/status with "none"→"" normalization.
- `course-row-actions.tsx`, `publish-toggle.tsx`, `confirm-dialog.tsx`
  (generic confirm Dialog used by every destructive action), `status-pill.tsx`
  (server-safe color map for all statuses), `copy-text.tsx`, `page-header.tsx`,
  `format.ts` (formatDate/formatDateTime via en-IN locale).
- `charts.tsx` — RevenueAreaChart / CategoryPieChart (donut+legend) /
  SalesBarChart / CompletionBarChart (with ReferenceLine), recharts, compact
  `formatINR` tick formatters.
- `student-detail.tsx`, `student-row-actions.tsx`, `instructor-dialog.tsx`,
  `category-rename-dialog.tsx`, `coupon-active-switch.tsx`,
  `coupon-create-dialog.tsx`, `review-actions.tsx`, `resource-dialog.tsx`,
  `announcement-form.tsx`, `settings-form.tsx`.

Also fixed (inside my ownership area, required for ANY admin page to render):

- `src/app/admin/layout.tsx` — NAV_SECTIONS passed Lucide component references
  (non-serializable) to the client `AdminSidebarNav`, which 500'd every admin
  route ("Functions cannot be passed directly to Client Components",
  `{$$typeof, render: LayoutDashboard}`). Icons are now pre-rendered elements
  (`React.ReactNode`).
- `src/components/admin/admin-sidebar-nav.tsx` — accepts `icon: React.ReactNode`
  accordingly.

## Verification

Logged out (all 307 → /login):

```
/admin/dashboard 307   /admin/courses 307    /admin/courses/create 307
/admin/categories 307  /admin/lessons 307    /admin/students 307
/admin/instructors 307 /admin/orders 307     /admin/payments 307
/admin/coupons 307     /admin/reviews 307    /admin/resources 307
/admin/announcements 307 /admin/analytics 307 /admin/settings 307
/admin/courses/[id]/edit 307
```

Logged in as seeded `admin@bice.local` (super_admin) — all of the above → 200
with real seeded content (courses table shows seeded courses, lessons table
shows "Edit course curriculum" / "Free preview" / "Locked (paid)", edit page
renders "Curriculum builder / Add section / Drag handles to reorder",
`?student=` opens the detail dialog payload, `?status=paid` filters orders,
`?status=any`/`courseId=any` are no-ops).

- `bunx eslint src/app/admin src/components/admin` → 0 errors, 0 warnings.
- `bunx tsc --noEmit` → no errors in admin files (remaining repo errors are
  pre-existing in `src/app/admin/actions.ts` — off-limits to this task).
- dev.log tail clean (only prisma query noise + other groups' routes).

## Notes / unresolved

1. `createCoupon` action does not read `maxUses` from FormData (only code, type,
   value, minOrderValue, expiresAt, active) — the create dialog includes the
   field per spec but it won't persist until the action is extended. Did NOT
   edit actions.ts (out of my scope).
2. Radix Dialog (shadcn) renders content in a portal, so dialog markup is not
   in the SSR HTML; it appears after hydration (verified via flight payload).
   This is default Radix behavior, not a bug.
3. Had to hard-restart the dev server and clear `.next/dev` once (stale
   Turbopack dev cache after the earlier server died made API routes 404);
   unrelated to admin code, everything healthy afterwards.
4. Seeded admin creds used for verification: admin@bice.local / Admin@12345.
