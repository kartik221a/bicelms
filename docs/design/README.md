# BICE LMS — Google Stitch Design Package

All major screens of the BICE LMS platform were designed in **Google Stitch** (project
`BICE LMS Platform`, id `9891734431591622481`) with a single shared design system
(**"Executive Analytics Academy"**, asset `assets/62d258c341d7452480482da47a621716`)
applied to every screen for full visual consistency.

**Open in Stitch:** https://stitch.withgoogle.com/projects/9891734431591622481

## What's in this folder

| File | Purpose |
| --- | --- |
| `DESIGN.md` | The Stitch-generated design system spec (colors, typography, spacing, elevation, components) — the token source for Next.js/Tailwind implementation |
| `registry.json` | Machine-readable index: screen ids, Stitch resource names, titles, device types, files |
| `contact-sheet-desktop.jpg` | Visual overview of all 17 desktop screens |
| `contact-sheet-mobile-tablet.jpg` | Visual overview of the 4 mobile screens + tablet layout |
| `html/<slug>.html` | Full Tailwind HTML for each screen (primary visual reference for implementation) |
| `screenshots/<slug>.png` | High-resolution screenshot of each screen |

## Screen inventory (24 screens)

### Public website (desktop)
- `public-homepage-desktop` — hero, stats, featured courses, categories, why-us, instructor, testimonials, FAQ, newsletter, footer
- `public-courses-listing-desktop` — filters sidebar, sorting, search, course card grid, pagination, empty state
- `public-course-detail-desktop` — promo video, overview/curriculum/instructor/reviews/FAQ tabs, curriculum accordion with Free Preview + locked lessons, sticky purchase card with discount + coupon

### Authentication (desktop)
- `auth-login-desktop` — split navy brand panel + login form + Google sign-in
- `auth-register-desktop` — registration with password strength, terms, email-verification note
- `auth-forgot-password-desktop` — reset request + success state

### Student LMS (desktop)
- `student-dashboard-desktop` — welcome banner, KPI cards, continue learning, progress chart, announcements, skeleton state
- `student-my-courses-desktop` — filter tabs, enrolled course cards with progress + certificate state
- `student-learning-interface-desktop` — 3-zone layout: curriculum sidebar (completed/current/locked), video player with dynamic watermark + no download control, notes/resources/Q&A panel
- `student-my-notes-desktop` — searchable notes list + rich editor with lesson timestamps
- `student-my-resources-desktop` — resources grouped by course, view-only vs downloadable, lesson-gated items
- `student-orders-desktop` — order history, Razorpay payment ids, invoices, refund state
- `student-certificates-desktop` — certificate cards with verification id + download

### Admin (desktop)
- `admin-dashboard-desktop` — KPI row, revenue trend chart, enrollments donut, recent purchases/registrations, popular courses
- `admin-courses-desktop` — course table with status pills, bulk actions, filters
- `admin-curriculum-builder-desktop` — drag-drop sections/lessons, free-preview toggles, video upload with processing state, lesson completion rules
- `admin-students-orders-desktop` — students table + detail drawer (manual enroll/revoke), orders table with Razorpay ids + refunds
- `admin-analytics-desktop` — revenue/sales/registration trends, completion rates, insights
- `admin-settings-desktop` — general/branding/payments(Razorpay)/video security/session limits/SEO settings

### Mobile & tablet
- `public-homepage-mobile`, `public-course-detail-mobile` (sticky enroll bar), `student-learning-interface-mobile` (bottom sheet curriculum + watermark), `student-dashboard-mobile` (bottom nav), `student-dashboard-tablet` (icon-rail adaptation)

## Design tokens (summary — full spec in DESIGN.md)

- Primary `#4F46E5` (indigo-600) · hover `#4338CA`
- Shell/nav `#0F172A` (slate-900) · canvas `#F8FAFC` (slate-50) · surface `#FFFFFF`
- Ratings/highlights `#FBBF24` · success emerald · locked/advanced rose
- Typography: Inter; 8px spacing grid; cards 1px `#E2E8F0` border + soft shadow
- Buttons radius 8px; levels: Beginner emerald / Intermediate amber / Advanced rose
