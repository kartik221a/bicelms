# BICE LMS — Implementation Guide for page modules

This document defines the shared architecture that page modules must use.
Design reference: `download/stitch-designs/html/*.html` (Tailwind HTML per screen)
and `download/stitch-designs/screenshots/*.png` (visuals). Match the Stitch
designs closely — indigo `#4f46e5` primary, navy `#0f172a` shell, slate canvas,
Inter, rounded-xl cards, 1px `#e2e8f0` borders.

## Stack rules

- Next.js 16 App Router + TypeScript strict. Server components by default;
  `"use client"` only for interactivity.
- shadcn/ui components exist in `src/components/ui/*` — use them (Button, Card,
  Input, Select, Dialog, Table, Tabs, Badge, Progress, Skeleton, etc.).
- Icons: `lucide-react`. Toasts: `sonner` (`toast.success(...)`).
- No hardcoded demo statistics in dashboards — always read through services.
- Every page: loading (skeletons), empty (`<EmptyState/>`), and error states.

## Data access (NEVER query the DB directly in pages)

All data flows through services in `src/services/*`. They use the DataStore
abstraction (`src/repositories`) — Prisma/SQLite in this environment, Firestore
in production. Do NOT import `@/lib/db` (Prisma) in UI code.

Key service functions (server components / route handlers only):

```ts
import { getSession, requireUser, requireAdmin } from "@/services/auth/session";
import { listPublishedCourses, getCourseBySlug, getCurriculum, parseJsonArray, parseFaqs } from "@/services/course.service";
import { listUserEnrollments, getUserCourseProgress, markLessonCompleted, recomputeCourseProgress } from "@/services/progress.service";
import { getActiveEnrollment } from "@/services/progress.service"; // enrollment doc or null
import { listUserOrders } from "@/services/payment.service";
import { createCourseOrder, verifyCheckoutPayment } from "@/services/payment.service";
import { listNotes, createNote, updateNote, deleteNote } from "@/services/note.service";
import { listStudentResources } from "@/services/resource.service"; // needs completedLessonIds
import { listUserCertificates, getCertificateForVerification } from "@/services/certificate.service";
import { submitReview, listCourseReviews } from "@/services/review.service";
import { listAnnouncementsForUser } from "@/services/announcement.service";
import { getAdminStats } from "@/services/analytics.service";
import { getSettings } from "@/services/settings.service";
import { couponService } from "@/services/coupon.service";
```

UI shared components:

```tsx
import { CourseCard } from "@/components/shared/course-card"; // needs CourseDoc
import { RatingStars } from "@/components/shared/rating-stars";
import { LevelBadge } from "@/components/shared/level-badge";
import { PriceTag } from "@/components/shared/price-tag";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { ProtectedVideoPlayer } from "@/components/player/video-player"; // client
import { VideoWatermark } from "@/components/player/watermark"; // client
```

Helpers: `formatINR(paise)`, `formatHours(minutes)`, `formatDuration(seconds)`,
`maskEmail(email)` from `@/lib/money`; `parseJsonArray(course.tags)` etc. from
course.service (JSON string fields).

## API routes (client-side fetch when needed)

- `POST /api/v1/auth/register|login|logout|forgot-password|reset-password|verify-email`
- `GET  /api/v1/courses?q&category&level&minRating&maxPrice&sort&page`
- `GET  /api/v1/courses/[slug]`
- `POST /api/v1/playback/authorize` {lessonId} → signed src + watermark
- `POST /api/v1/progress` {lessonId, positionSeconds, watchPercent, completed}
- `GET  /api/v1/enrollments/mine?filter=all|in_progress|completed`
- `POST /api/v1/payments/order` {courseId, couponCode?} → order + razorpay checkout payload or setupRequired
- `POST /api/v1/payments/verify` (Razorpay handler callback)
- `GET  /api/v1/payments/mine`
- `GET/POST/PUT/DELETE /api/v1/users/me/notes`
- `GET  /api/v1/resources/{id}/download`
- `GET  /api/v1/certificates/{id}/pdf`
- `GET  /api/v1/admin/stats`

All responses: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.

## Server actions (admin mutations)

`src/app/admin/actions.ts` exports: createCourse, updateCourse, setCourseStatus,
deleteCourse, addSection, renameSection, deleteSection, reorderSections,
addLesson, updateLesson, deleteLesson, reorderLessons, toggleFreePreview,
manuallyEnrollStudent, revokeEnrollment, setUserStatus, createCoupon,
toggleCoupon, deleteCoupon, moderateReviewAction, publishAnnouncementAction,
updateSettingsAction. All call `revalidatePath` themselves.

## Route ownership (do not touch other groups)

- Public group: `src/app/(public)/**` (+ shared components under `src/components/shared`)
- Auth group: `src/app/(auth)/**`
- Student group: `src/app/(student)/**` + `src/components/lms/**` + `src/components/player/**`
- Admin group: `src/app/admin/**` + `src/components/admin/**`
- Root files (layout, middleware, services, config): DO NOT EDIT without need.

## Money & dates

All amounts are integer **paise**; display with `formatINR`. Dates arrive as ISO
strings; format with `date-fns` or `toLocaleDateString("en-IN")`.

## Security invariants (must hold on every page)

1. Never render private video URLs or storage IDs in payloads/HTML.
2. Server-side session + role + enrollment checks on every protected page
   (`getSession`/`requireUser`/`requireAdmin` + `getActiveEnrollment`).
3. Never trust client-sent prices/roles — server recomputes.
4. No fake payment success: when Razorpay is unconfigured, show the setup state
   returned by the API (`setupRequired`).
