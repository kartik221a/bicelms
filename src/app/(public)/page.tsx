import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  DatabaseZap,
  GraduationCap,
  Grid3X3,
  Quote,
  Star,
  TerminalSquare,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/shared/course-card";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { listPublishedCourses, type CourseDoc } from "@/services/course.service";
import { listCourseReviews } from "@/services/review.service";
import { store } from "@/repositories";

export const metadata: Metadata = {
  title: { absolute: "BICE Academy — Master Data Skills That Drive Your Career" },
  description:
    "BICE is a professional coaching institute for data skills — Advanced Excel, Power Query, SQL, Python and Business Dashboards — with structured courses, hands-on projects and verified certificates.",
};

/* ------------------------------------------------------------------ */
/* Server-side data loading                                            */
/* ------------------------------------------------------------------ */

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface InstructorInfo {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  credentials?: string | null;
  photoUrl?: string | null;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  excel: Grid3X3,
  "power-query": DatabaseZap,
  sql: TerminalSquare,
  python: Code2,
  dashboards: BarChart3,
};

async function loadHomepageData() {
  const [catalog, categories, instructors] = await Promise.all([
    listPublishedCourses({ sort: "popularity", page: 1, pageSize: 48 }),
    store.list<CategoryInfo>("categories", { orderBy: [{ field: "position" }] }),
    store.list<InstructorInfo>("instructors", { orderBy: [{ field: "createdAt" }] }),
  ]);

  const courses = catalog.items;
  const featured = [...courses].sort((a, b) => b.ratingAvg - a.ratingAvg).slice(0, 4);
  const topRated = [...courses].sort((a, b) => b.ratingAvg - a.ratingAvg).find((c) => c.ratingCount > 0);
  const reviews = topRated ? (await listCourseReviews(topRated.id, true)).slice(0, 3) : [];

  return {
    courses,
    totalCourses: catalog.total,
    categories,
    instructors,
    featured,
    reviews,
    studentsTrained: courses.reduce((acc, c) => acc + (c.studentsCount ?? 0), 0),
    ratedCourses: courses.filter((c) => c.ratingCount > 0),
    coursesByCategory: courses.reduce<Record<string, number>>((acc, c) => {
      if (c.categoryId) acc[c.categoryId] = (acc[c.categoryId] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const HERO_FAQS = [
  {
    q: "Are the courses suitable for complete beginners?",
    a: "Yes. Every track starts from fundamentals — Excel for Beginners assumes zero spreadsheet experience, while Advanced Excel and Python tracks include refresher modules before moving into advanced territory.",
  },
  {
    q: "Will I get a certificate after completing a course?",
    a: "Yes. Every course issues a verified BICE certificate once you complete all lessons. Each certificate carries a unique ID that anyone can verify publicly on our certificate verification page.",
  },
  {
    q: "How long do I have access to a course I enroll in?",
    a: "Lifetime access. Enrolled students keep all videos, practice files and future updates — there is no subscription expiry on individual courses.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major Indian payment methods (UPI, cards, net banking and wallets) through Razorpay, in INR. Coupon codes can be applied on the checkout page.",
  },
  {
    q: "Is there a refund policy if the course isn't right for me?",
    a: "Yes — we offer a 30-day, no-questions-asked refund window from the date of purchase. See the Refund Policy page for details and how to raise a refund request.",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const data = await loadHomepageData();
  const avgRating =
    data.ratedCourses.length > 0
      ? Math.round((data.ratedCourses.reduce((acc, c) => acc + c.ratingAvg, 0) / data.ratedCourses.length) * 10) / 10
      : null;
  const leadInstructor = data.instructors[0];

  const stats = [
    { value: data.studentsTrained.toLocaleString("en-IN"), label: "Students trained", hint: "Across all published courses" },
    { value: String(data.totalCourses), label: "Courses", hint: "Published on the platform" },
    { value: avgRating ? `${avgRating.toFixed(1)} / 5` : "—", label: "Average rating", hint: "Verified student reviews" },
    { value: String(data.categories.length), label: "Expert categories", hint: "Excel to BI dashboards" },
  ];

  const benefits = [
    {
      icon: Briefcase,
      title: "Expert instructors",
      body: "Learn from practicing professionals — CAs, analysts and BI leads who use these exact workflows on live business data every week.",
    },
    {
      icon: CheckCircle2,
      title: "Hands-on projects",
      body: "Every module ends with a real dataset and a deliverable — sales dashboards, GL clean-ups, SQL pipelines — so skills stick beyond the videos.",
    },
    {
      icon: Award,
      title: "Verified certificates",
      body: "Complete all lessons and receive a BICE certificate with a publicly verifiable ID that recruiters can check in seconds.",
    },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* ============ HERO ============ */}
      <section className="relative w-full overflow-hidden bg-indigo-50/70 py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#4f46e5]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            <div className="flex flex-col items-start gap-6 lg:col-span-6">
              <span className="inline-flex items-center gap-2.5 rounded-full bg-[#e0e7ff] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#312e81] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4f46e5]" />
                New cohort enrolling — join anytime, learn at your pace
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
                Master Data Skills That Drive Your Career
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                BICE is a professional coaching institute for ambitious analysts and finance teams.
                Enterprise-caliber coaching in Advanced Excel, Power Query automation, production SQL,
                Python and BI dashboards — taught on real business datasets, not toy examples.
              </p>
              <div className="flex w-full flex-wrap items-center gap-4 pt-2 sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="h-12 gap-2 bg-[#4f46e5] px-6 text-base font-semibold hover:bg-[#4338ca]"
                >
                  <Link href="/courses">
                    Explore Courses <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2 border-slate-300 bg-white px-6 text-base font-semibold text-slate-900 hover:bg-slate-100"
                >
                  <Link href="/register">
                    <GraduationCap className="h-5 w-5" /> Get Started
                  </Link>
                </Button>
              </div>
              <div className="flex w-full items-center gap-4 border-t border-indigo-100 pt-4">
                <RatingStars rating={avgRating ?? 0} size="md" />
                <span className="text-xs text-slate-600">
                  Average rating from verified student reviews on this platform
                </span>
              </div>
            </div>

            {/* Right visual: gradient analytics panel with live stat chips */}
            <div className="relative lg:col-span-6">
              <div className="rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#4f46e5] p-5 shadow-xl">
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-medium text-indigo-100">pipeline_analysis.sql</span>
                  </div>
                  <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    Query executed
                  </span>
                </div>
                <div className="mt-4 overflow-x-auto rounded-lg bg-slate-950/70 p-4 font-mono text-xs leading-6 text-indigo-100 shadow-inner">
                  <div className="text-slate-400">-- Quarterly revenue by cohort (QoQ variance)</div>
                  <div>
                    <span className="font-semibold text-indigo-300">WITH</span> quarterly_cohorts{" "}
                    <span className="font-semibold text-indigo-300">AS</span> (
                  </div>
                  <div className="pl-4">
                    <span className="font-semibold text-indigo-300">SELECT</span> cohort_id, SUM(net_revenue){" "}
                    <span className="font-semibold text-indigo-300">AS</span> arr
                  </div>
                  <div className="pl-4">
                    <span className="font-semibold text-indigo-300">FROM</span> bice_practice.ledger
                  </div>
                  <div>
                    ) <span className="font-semibold text-indigo-300">ORDER BY</span> arr{" "}
                    <span className="font-semibold text-indigo-300">DESC</span>;
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Avg rating", value: avgRating ? avgRating.toFixed(1) : "—", accent: "text-amber-300" },
                    { label: "Students", value: data.studentsTrained.toLocaleString("en-IN"), accent: "text-emerald-300" },
                    { label: "Courses", value: String(data.totalCourses), accent: "text-indigo-200" },
                  ].map((chip) => (
                    <div key={chip.label} className="rounded-lg bg-white/10 p-3 backdrop-blur">
                      <p className={`text-lg font-bold ${chip.accent}`}>{chip.value}</p>
                      <p className="text-[11px] text-indigo-200">{chip.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4f46e5] text-white">
                    <Award className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Verified BICE certificate</p>
                    <p className="text-[11px] text-indigo-200">Publicly verifiable at /verify-certificate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS BAND ============ */}
      <section className="w-full border-b border-slate-200 bg-white py-10 shadow-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col space-y-1">
              <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{s.value}</div>
              <div className="text-sm font-semibold text-[#4f46e5]">{s.label}</div>
              <p className="text-xs text-slate-500">{s.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ FEATURED COURSES ============ */}
      <section id="catalog" className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Featured catalog</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Top-rated courses by our students
              </h2>
              <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
                Ranked by verified student ratings. Rigorous, hands-on programs taught on real corporate
                datasets — with downloadable resources and a verified certificate on completion.
              </p>
            </div>
            {data.totalCourses > 0 ? (
              <Button asChild variant="outline" className="gap-2 border-slate-300 bg-white">
                <Link href="/courses">
                  View all {data.totalCourses} courses <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
          {data.featured.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {data.featured.map((course: CourseDoc) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No published courses yet"
              description="Our faculty is preparing the next batch of programs. Check back shortly or subscribe to the newsletter below to be notified."
              action={
                <Button asChild className="bg-[#4f46e5] hover:bg-[#4338ca]">
                  <Link href="#newsletter">Notify me</Link>
                </Button>
              }
            />
          )}
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      {data.categories.length ? (
        <section className="w-full bg-white py-20">
          <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Course categories</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Pick the discipline you want to master
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] ?? BookOpen;
                const count = data.coursesByCategory[cat.id] ?? 0;
                return (
                  <Link
                    key={cat.id}
                    href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                    className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:border-[#4f46e5]/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5] transition-colors group-hover:bg-[#4f46e5] group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-slate-900 group-hover:text-[#4f46e5]">{cat.name}</h3>
                    <p className="line-clamp-2 text-xs text-slate-500">{cat.description}</p>
                    <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[#4f46e5]">
                      {count} course{count === 1 ? "" : "s"} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============ WHY LEARN WITH US ============ */}
      <section className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Why BICE</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Why learn with us</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CardContent className="flex flex-col gap-3 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold text-slate-900">{b.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{b.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INSTRUCTOR INTRO ============ */}
      {leadInstructor ? (
        <section className="w-full bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="overflow-hidden border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
                {leadInstructor.photoUrl ? (
                  <img
                    src={leadInstructor.photoUrl}
                    alt={leadInstructor.name}
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-[#eef2ff]"
                  />
                ) : (
                  <span className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#0f172a] to-[#4f46e5] text-3xl font-bold text-white ring-4 ring-[#eef2ff]">
                    {initialsOf(leadInstructor.name)}
                  </span>
                )}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4f46e5]">Meet your instructor</span>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{leadInstructor.name}</h2>
                  <p className="text-sm font-medium text-slate-600">{leadInstructor.title}</p>
                  {leadInstructor.bio ? (
                    <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{leadInstructor.bio}</p>
                  ) : null}
                  {leadInstructor.credentials ? (
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4f46e5]">
                      <Award className="h-3.5 w-3.5" /> {leadInstructor.credentials}
                    </span>
                  ) : null}
                  <Button asChild variant="outline" className="mt-2 w-fit gap-2 border-slate-300">
                    <Link href="/about">
                      Learn more about BICE <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {/* ============ TESTIMONIALS ============ */}
      <section className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Student voices</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              What our students say
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              Verified reviews from enrolled students, moderated by the BICE team.
            </p>
          </div>
          {data.reviews.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.reviews.map((r) => (
                <Card key={r.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <CardContent className="flex flex-col gap-3 p-6">
                    <Quote className="h-5 w-5 text-[#4f46e5]" />
                    <RatingStars rating={r.rating} />
                    <p className="text-sm leading-relaxed text-slate-700">{r.comment}</p>
                    {r.title ? <p className="text-sm font-semibold text-slate-900">“{r.title}”</p> : null}
                    <p className="mt-auto text-xs font-medium text-slate-500">
                      {r.user?.name ?? "BICE student"}
                      {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Star}
              title="No verified reviews yet"
              description="Reviews appear here once enrolled students complete courses and share verified feedback. Be the first cohort to leave one!"
            />
          )}
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">FAQ</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Frequently asked questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="rounded-xl border border-slate-200 bg-white px-5">
            {HERO_FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-slate-600">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="text-center text-sm text-slate-500">
            More questions? Visit the{" "}
            <Link href="/faq" className="font-semibold text-[#4f46e5] hover:underline">
              full FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-[#4f46e5] hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section id="newsletter" className="w-full bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#4f46e5] py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Get free Excel &amp; SQL practice datasets every month
            </h2>
            <p className="text-sm leading-relaxed text-indigo-200 sm:text-base">
              One email a month: new course launches, cohort announcements and curated practice problems.
              No spam, unsubscribe anytime.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
            <Users className="h-7 w-7" />
          </span>
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ready to become the data person your team relies on?
          </h2>
          <p className="max-w-xl text-sm text-slate-600 sm:text-base">
            Join {data.studentsTrained.toLocaleString("en-IN")}+ learners building careers on BICE programs.
            Start free, upgrade when you are ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-12 bg-[#4f46e5] px-6 text-base font-semibold hover:bg-[#4338ca]">
              <Link href="/courses">Browse all courses</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-slate-300 px-6 text-base font-semibold">
              <Link href="/register">Create a free account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
