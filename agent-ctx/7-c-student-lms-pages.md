# Task 7-c — Student LMS pages — work record

Agent: student-pages builder (task 7-c)
Date: 2026-11-20

## Files created

Pages (`src/app/(student)/`, all server components, `getSession()` + redirect to
`/login` when unauthenticated):

- `dashboard/page.tsx` — welcome banner ("Welcome back, {first name}" + week
  summary line computed from real `completedAt` docs), KPI StatCards (enrolled
  count, completed lessons sum, hours learned = completed lesson
  durations/3600 at 1 decimal, certificates count), Continue Learning hero
  (most recent in-progress enrollment, progress ring, next-lesson name,
  Resume → `/learn/{slug}/{resumeLessonId}`, review mode when everything is
  completed), "Other in-progress courses" rows, right column = CSS bar chart
  of lessons completed per day (last 7 days, from lessonProgress docs) +
  Recent announcements (`listAnnouncementsForUser` with enrolled course ids)
  + certificates teaser card. `loading.tsx` skeleton.
- `my-courses/page.tsx` — All / In progress / Completed tabs via `?filter=`
  Links (styled, aria-current), card grid (thumbnail, title, instructor name
  via read-only `store.get("instructors")`, Progress + percent, "Completed X
  of Y lessons", relative last-accessed via date-fns, Continue Learning
  button, or View certificate (links to `/verify-certificate/{id}`) when
  completed + cert exists). EmptyState + Browse Courses CTA. `loading.tsx`.
- `learn/[courseSlug]/page.tsx` — resolves `resumeLessonId ?? first published
  lesson` and 307-redirects; honest "No lessons published yet" panel when the
  course has none; `notFound()` for unknown slugs.
- `learn/[courseSlug]/[lessonId]/page.tsx` — the learning interface. Server
  checks: session, `getCourseBySlug`, `getCurriculum`, lesson lookup
  (`notFound()` if missing), `getActiveEnrollment`; access = enrolled OR
  `isFreePreview`, else an honest enroll-required panel linking to
  `/courses/[slug]`. Left = `CurriculumSidebar` (sticky, scrollable), center =
  breadcrumb chips (Course > Section > Lesson), `ProtectedVideoPlayer`
  (resumeSeconds read server-side from the single lessonProgress doc —
  completed lessons resume at 0), lesson title/description, attachment chips
  (resources where lessonId matches), Previous / Mark as Completed / Next
  action row. Right = `LessonSidePanel` (Notes/Resources/Q&A tabs).
  Mobile: "Course content" Sheet trigger + progress badge above the player;
  panels stack. `loading.tsx` skeleton.
- `my-notes/page.tsx` — two-pane. Left: GET search form (`?q=`), course filter
  chips from enrollments, note list (title, snippet, relative time, course
  badge) linking with `?note=`; Right: `NotesEditor` (title/content/save/
  delete/AlertDialog confirm, "Open lesson" link when lessonId+course known,
  selection placeholder). Empty/search-no-match states.
- `my-resources/page.tsx` — course filter chips (`?courseId`) + type summary
  chips, grouped per course; rows: type icon (pdf rose / practice-file
  emerald / other indigo / external amber), type chip, linked lesson name,
  size, View (external) / Download (`/api/v1/resources/{id}/download`, only
  when unlocked) / disabled Download with honest reason; locked rows show
  "Unlocks after Lesson {title}" (gating lesson resolved read-only from
  `store.get("resources")` since the view hides it). Empty states.
- `orders/page.tsx` — StatCards (Total spent = sum paid finalAmount, Orders,
  Refunds), shadcn Table (order number mono, course thumb+title, date en-IN,
  `formatINR(finalAmount)`, Razorpay badge when razorpayPaymentId, status pill
  Paid emerald / Failed rose / Created amber / Refunded+Cancelled slate,
  Invoice disabled with Tooltip "Invoices are available once email delivery is
  configured"). EmptyState.
- `certificates/page.tsx` — elegant certificate cards (navy double border,
  BICE Academy wordmark, "Certificate of Completion", serif italic student
  name, course title, instructor, issued date, mono certificate ID) +
  Download PDF (`/api/v1/certificates/{certificateId}/pdf`) + Copy
  verification link (client, clipboard + toast) + public verify path shown.
  Below: "Courses close to completion" rows (percent >= 60 without a cert,
  progress bar, "complete all lessons to receive your certificate", Continue
  button). Empty states.
- `profile/page.tsx` — avatar placeholder (photoUrl if present), account card
  (email + verified badge, role, member since from user doc), `ProfileForm`
  (name, phone → PUT `/api/v1/users/me` → toast + refresh), security link to
  /settings.
- `settings/page.tsx` — `PasswordForm` (current/new/confirm → POST
  `/api/v1/users/me/password`, server error messages surfaced verbatim —
  honest about Firebase-managed auth), Preferences card ("Dark mode — coming
  with the next iteration", Planned badge, NO fake toggle), Danger zone notes
  only (log out everywhere + delete account expectations). No fake actions.

Components (`src/components/lms/`):

- `curriculum-sidebar.tsx` (client) — course meta + progress box, lesson
  search, collapsible sections with per-section "done" counts, lesson rows
  (green CheckCircle2 done, indigo PlayCircle current with inset accent bar +
  `bg-[#eef2ff]`, gray circle pending, Lock for locked = not enrolled AND not
  free preview, durations, "Free" tag), links to
  `/learn/{slug}/{lessonId}`. Reused inside the mobile Sheet.
- `mark-completed-button.tsx` (client) — POST `/api/v1/progress`
  {lessonId, positionSeconds: 0, watchPercent: 100, completed: true} → toast
  + `router.refresh()`; disabled "Completed" state; "Enroll to track
  progress" for non-enrolled.
- `lesson-side-panel.tsx` (client) — underline Tabs (Notes/Resources/Q&A).
  Notes: title+content+optional timestamp editor with 1.5s debounce auto-save
  AND save-on-blur, toast "Note saved", create/PUT/DELETE via
  `/api/v1/users/me/notes`, timestamped saved-note list, AlertDialog delete.
  Resources: rows with honest lock/view-only states + tooltips (downloads
  hard-disabled for non-enrolled). Q&A: honest "coming with the live cohort".
- `notes-editor.tsx` (client) — editor for /my-notes right pane.
- `copy-verification-button.tsx`, `confirm-dialog.tsx`, `profile-form.tsx`,
  `password-form.tsx` (client) — small shared pieces.
- `nav-icons.ts` — serializable icon-key registry (see "Critical fixes").

## Critical fixes outside my original scope (documented, required)

Both were found by live verification and are REQUIRED for any student page to
render correctly; changes were kept minimal:

1. **Server→client function props crashed every student page (500).**
   `src/app/(student)/layout.tsx` passed `NAV` entries containing LucideIcon
   component references to client components `StudentSidebarNav` /
   `MobileTabNav` → RSC serialization error "Functions cannot be passed
   directly to Client Components" (verified in the flight payload). Fix:
   layout now passes string icon keys; both nav components (my scope)
   resolve keys via new `src/components/lms/nav-icons.ts`. Layout diff is
   only the import list + NAV array + a comment. NOTE: `admin-sidebar-nav`
   was modified by the admin agent for the same reason — the pattern is
   systemic in the scaffolded shells.

2. **Tuple where-clauses were silently IGNORED by the Prisma store**
   (`WHERE 1=1`, proven: `store.list("users", {where:[["role","==","student"]]})`
   returned all 3 users incl. admin). Every service that queries with tuples
   (`listUserEnrollments`, `getUserCourseProgress`, `listNotes`,
   `listUserOrders`, `listUserCertificates`, `listStudentResources`,
   `getCurriculum`, `upsertProgress`, …) was returning CROSS-USER /
   cross-course rows, and `upsertProgress` could have updated another user's
   progress doc (mutation!). Fix in `src/repositories/` (4 files, minimal):
   added `WhereInput` (object | [field, op, value]) + `asWhereClause()` in
   `types.ts`, normalized in `prisma.store.ts` `buildWhere` and
   `firestore.store.ts` `buildQuery`, updated `count`/`deleteWhere`
   signatures, and `index.ts` now re-exports `./types` (services import
   `WhereClause`/`QueryOptions` from `@/repositories`). Post-fix proof:
   tuple query returns only students; student pages now show strictly
   user-scoped data (dashboard KPIs 1 / 4 / 0.9 / 0 match the seed for
   rahul@example.com). Firestore path normalized identically for production
   parity. This also fixed mass pre-existing tsc errors in services
   (`WhereClause[] = [tuple]` no longer type-errors).

## Verification

Logged out (middleware + page guard, all 307 → /login): /dashboard,
/my-courses, /my-notes, /my-resources, /orders, /certificates, /profile,
/settings, /learn/{slug} — 9/9 = 307.

Logged in as rahul@example.com (seed: 1 enrollment, 4 completed lessons, 1
paid order, 1 note): /dashboard 200, /my-courses 200 (+ ?filter=completed
200), /my-notes 200 (+ ?note=… 200, editor + "Open lesson" render),
/my-resources 200 (+ ?courseId=… 200), /orders 200, /certificates 200,
/profile 200, /settings 200 — all 200 with correct scoped content
("Advanced Excel Masterclass", "Completed 4 of 19 lessons", order ORD-…
Razorpay Paid, no foreign data).

Learn flow: `/learn/advanced-excel-masterclass` → 307 to resume lesson
(first incomplete) for Rahul, → first lesson for priya@example.com (no
progress). Lesson page 200 (Rahul) with sidebar, breadcrumbs, progress box,
Mark-as-completed, side panel; Priya (non-enrolled): locked lesson →
"Enroll to unlock this lesson" panel (player absent), free-preview lesson →
player + "Free preview — enroll to track progress". APIs: POST
`/api/v1/playback/authorize` 200 (signed src + token), POST `/api/v1/progress`
200 (correctly user-scoped; test row deleted afterwards).

Lint: `bunx eslint "src/app/(student)" src/components/lms src/repositories`
→ clean (0 errors, 0 warnings). tsc: 0 errors in my scope + repositories
(remaining 26 project errors are pre-existing in examples/, admin actions,
public enroll-button, providers, price-tag — untouched groups).

dev.log: all requests 200 after fixes, queries correctly scoped
(`WHERE userId = ?`, compound conditions), no runtime errors. One transient
incident: a dev-server crash + stale Turbopack cache made ALL routes 404
(including pre-existing /login) right after a restart; cleared
`.next/dev/cache + manifests` and the supervisor's server recovered (all
routes 200 again). No code cause — cache corruption from the crash.

## Unresolved issues / notes for other agents

- Pre-existing tsc errors remain in: `examples/websocket/*` (missing deps),
  `src/app/admin/actions.ts` (unknown/possibly-null), `src/components/public/
  enroll-button.tsx` (razorpay possibly null), `src/components/shared/
  price-tag.tsx` (size "md"), `src/providers/auth/firebase-admin.ts`
  (getApps import), `src/services/auth/session.ts` (never-typed narrowing),
  `src/services/course.service.ts:79` + `progress.service.ts:159`
  (`const where: WhereClause[] = [tuple]` — runtime now works; change the
  annotation to `WhereInput[]` for a clean tsc), `payment.service.ts:85`.
  All outside my scope.
- Invoice action is an intentionally disabled button with an honest tooltip
  (no invoice pipeline exists).
- The (student) layout edit + repositories fix are shared-infrastructure
  changes made out of necessity; owners of those files should re-review.
- Q&A tab is an honest placeholder; notes/resources/orders/certificates are
  fully wired to real services/APIs.
