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
import {
  Reveal,
  Stagger,
  StaggerItem,
  SplitText,
  Counter,
  SpotlightCard,
  TiltCard,
  Marquee,
  Magnetic,
  FlipWords,
  DotGridHero,
} from "@/components/motion";

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

  const skills = [...new Set(courses.flatMap((c) => {
    try { return JSON.parse(c.tags) as string[]; } catch { return []; }
  }))].slice(0, 14);

  return {
    courses,
    totalCourses: catalog.total,
    categories,
    instructors,
    featured,
    reviews,
    skills,
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
      {/* ============ HERO (black, dot-grid, animated headline) ============ */}
      <section className="relative w-full overflow-hidden bg-[#0a0a0a] py-20 lg:py-28">
        <DotGridHero />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="flex flex-col items-start gap-6 lg:col-span-6">
              <Reveal y={16} duration={0.5}>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-red-600/40 bg-red-600/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-red-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  New cohort enrolling — join anytime, learn at your pace
                </span>
              </Reveal>
              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                <SplitText text="Master" accent={[0]} className="[perspective:800px]" />
                <br />
                <SplitText text="Data Skills That Drive Your Career" accent={[2, 5]} delay={0.15} className="[perspective:800px]" />
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                BICE is a professional coaching institute{" "}
                <FlipWords words={["for analysts.", "for accountants.", "for finance teams.", "for future CAs."]} />{" "}
                Enterprise-caliber coaching in Advanced Excel, Power Query automation, production SQL,
                Python and BI dashboards — taught on real business datasets, not toy examples.
              </p>
              <Reveal delay={0.35} y={14} className="flex w-full flex-wrap items-center gap-4 pt-2 sm:w-auto">
                <Magnetic>
                  <Button
                    asChild
                    size="lg"
                    className="h-12 gap-2 bg-red-600 px-7 text-base font-semibold shadow-lg shadow-red-600/30 hover:bg-red-700"
                  >
                    <Link href="/courses">
                      Explore Courses <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </Magnetic>
                <Magnetic strength={0.25}>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 gap-2 border-neutral-700 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur hover:border-red-500/50 hover:bg-white/10 hover:text-white"
                  >
                    <Link href="/register">
                      <GraduationCap className="h-5 w-5" /> Get Started
                    </Link>
                  </Button>
                </Magnetic>
              </Reveal>
              <div className="flex w-full items-center gap-4 border-t border-white/10 pt-4">
                <RatingStars rating={avgRating ?? 0} size="md" />
                <span className="text-xs text-neutral-500">
                  Average rating from verified student reviews on this platform
                </span>
              </div>
            </div>

            {/* Right visual: tilting SQL panel */}
            <Reveal delay={0.2} y={32} className="relative lg:col-span-6">
              <TiltCard maxTilt={7} className="group">
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-neutral-900 via-black to-red-950/60 p-5 shadow-[0_24px_60px_rgba(220,38,38,0.15)]">
                  <div className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-2.5 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-red-400" />
                      <span className="h-3 w-3 rounded-full bg-red-600" />
                      <span className="h-3 w-3 rounded-full bg-neutral-600" />
                      <span className="ml-2 text-xs font-medium text-neutral-300">pipeline_analysis.sql</span>
                    </div>
                    <span className="rounded bg-red-600/20 px-2 py-0.5 text-[11px] font-medium text-red-300">
                      Query executed
                    </span>
                  </div>
                  <div className="mt-4 overflow-x-auto rounded-lg bg-black/70 p-4 font-mono text-xs leading-6 text-neutral-200 shadow-inner">
                    <div className="text-neutral-500">-- Quarterly revenue by cohort (QoQ variance)</div>
                    <div>
                      <span className="font-semibold text-red-400">WITH</span> quarterly_cohorts{" "}
                      <span className="font-semibold text-red-400">AS</span> (
                    </div>
                    <div className="pl-4">
                      <span className="font-semibold text-red-400">SELECT</span> cohort_id, SUM(net_revenue){" "}
                      <span className="font-semibold text-red-400">AS</span> arr
                    </div>
                    <div className="pl-4">
                      <span className="font-semibold text-red-400">FROM</span> bice_practice.ledger
                    </div>
                    <div>
                      ) <span className="font-semibold text-red-400">ORDER BY</span> arr{" "}
                      <span className="font-semibold text-red-400">DESC</span>;
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Avg rating", value: avgRating ? avgRating.toFixed(1) : "—", accent: "text-red-400" },
                      { label: "Students", value: data.studentsTrained.toLocaleString("en-IN"), accent: "text-white" },
                      { label: "Courses", value: String(data.totalCourses), accent: "text-red-300" },
                    ].map((chip) => (
                      <div key={chip.label} className="rounded-lg bg-white/10 p-3 backdrop-blur">
                        <p className={`text-lg font-bold ${chip.accent}`}>{chip.value}</p>
                        <p className="text-[11px] text-neutral-400">{chip.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
                      <Award className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">Verified BICE certificate</p>
                      <p className="text-[11px] text-neutral-400">Publicly verifiable at /verify-certificate</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ SKILLS MARQUEE ============ */}
      {data.skills.length ? (
        <section className="w-full border-b border-neutral-200 bg-white py-5">
          <Marquee duration={34}>
            {data.skills.map((skill) => (
              <span key={skill} className="mx-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {skill}
              </span>
            ))}
          </Marquee>
        </section>
      ) : null}

      {/* ============ STATS BAND (animated counters) ============ */}
      <section className="w-full border-b border-neutral-200 bg-white py-12 shadow-sm">
        <Stagger className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { value: data.studentsTrained, suffix: "+", decimals: 0, label: "Students trained", hint: "Across all published courses" },
            { value: data.totalCourses, suffix: "", decimals: 0, label: "Courses", hint: "Published on the platform" },
            { value: avgRating ?? 0, suffix: " / 5", decimals: 1, label: "Average rating", hint: "Verified student reviews" },
            { value: data.categories.length, suffix: "", decimals: 0, label: "Expert categories", hint: "Excel to BI dashboards" },
          ].map((s) => (
            <StaggerItem key={s.label} className="flex flex-col space-y-1">
              <div className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                <Counter value={s.value} suffix={s.suffix} decimals={s.decimals} className="tabular-nums" />
              </div>
              <div className="text-sm font-semibold text-red-600">{s.label}</div>
              <p className="text-xs text-neutral-500">{s.hint}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ============ FEATURED COURSES ============ */}
      <section id="catalog" className="w-full bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <span className="text-sm font-bold uppercase tracking-wider text-red-600">Featured catalog</span>
              <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
                Top-rated courses by our students
              </h2>
              <p className="max-w-2xl text-sm text-neutral-600 sm:text-base">
                Ranked by verified student ratings. Rigorous, hands-on programs taught on real corporate
                datasets — with downloadable resources and a verified certificate on completion.
              </p>
            </div>
            {data.totalCourses > 0 ? (
              <Button asChild variant="outline" className="gap-2 border-neutral-300 bg-white transition-colors hover:border-red-300 hover:text-red-700">
                <Link href="/courses">
                  View all {data.totalCourses} courses <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </Reveal>
          {data.featured.length ? (
            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={0.09}>
              {data.featured.map((course: CourseDoc) => (
                <StaggerItem key={course.id} className="h-full">
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No published courses yet"
              description="Our faculty is preparing the next batch of programs. Check back shortly or subscribe to the newsletter below to be notified."
              action={
                <Button asChild className="bg-red-600 hover:bg-red-700">
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
            <Reveal className="space-y-2 text-center">
              <span className="text-sm font-bold uppercase tracking-wider text-red-600">Course categories</span>
              <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
                Pick the discipline you want to master
              </h2>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {data.categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.slug] ?? BookOpen;
                const count = data.coursesByCategory[cat.id] ?? 0;
                return (
                  <StaggerItem key={cat.id} className="h-full">
                    <SpotlightCard className="h-full rounded-xl border border-neutral-200 bg-white transition-colors duration-300 hover:border-red-300">
                      <Link
                        href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                        className="group flex h-full flex-col gap-3 p-5"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-all duration-300 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h3 className="font-semibold text-neutral-900 transition-colors group-hover:text-red-600">{cat.name}</h3>
                        <p className="line-clamp-2 text-xs text-neutral-500">{cat.description}</p>
                        <span className="mt-auto inline-flex translate-x-0 items-center gap-1 text-xs font-semibold text-red-600 transition-transform duration-300 group-hover:translate-x-1">
                          {count} course{count === 1 ? "" : "s"} <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </Link>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      ) : null}

      {/* ============ WHY LEARN WITH US ============ */}
      <section className="w-full bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <Reveal className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-red-600">Why BICE</span>
            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">Why learn with us</h2>
          </Reveal>
          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {benefits.map((b) => (
              <StaggerItem key={b.title} className="h-full">
                <SpotlightCard className="h-full rounded-lg border border-neutral-200 bg-white">
                  <CardContent className="relative flex h-full flex-col gap-3 p-6">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <b.icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-neutral-900">{b.title}</h3>
                    <p className="text-sm leading-relaxed text-neutral-600">{b.body}</p>
                  </CardContent>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ INSTRUCTOR INTRO ============ */}
      {leadInstructor ? (
        <section className="w-full bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <Card className="overflow-hidden border-neutral-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CardContent className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
                  <TiltCard maxTilt={8} className="w-fit">
                    {leadInstructor.photoUrl ? (
                      <img
                        src={leadInstructor.photoUrl}
                        alt={leadInstructor.name}
                        className="h-28 w-28 rounded-full object-cover ring-4 ring-red-100"
                      />
                    ) : (
                      <span className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-black to-red-700 text-3xl font-bold text-white ring-4 ring-red-100">
                        {initialsOf(leadInstructor.name)}
                      </span>
                    )}
                  </TiltCard>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">Meet your instructor</span>
                    <h2 className="text-xl font-bold text-black sm:text-2xl">{leadInstructor.name}</h2>
                    <p className="text-sm font-medium text-neutral-600">{leadInstructor.title}</p>
                    {leadInstructor.bio ? (
                      <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">{leadInstructor.bio}</p>
                    ) : null}
                    {leadInstructor.credentials ? (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <Award className="h-3.5 w-3.5" /> {leadInstructor.credentials}
                      </span>
                    ) : null}
                    <Button asChild variant="outline" className="mt-2 w-fit gap-2 border-neutral-300 transition-colors hover:border-red-300 hover:text-red-700">
                      <Link href="/about">
                        Learn more about BICE <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ============ TESTIMONIALS ============ */}
      <section className="w-full bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <Reveal className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-red-600">Student voices</span>
            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
              What our students say
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-neutral-600 sm:text-base">
              Verified reviews from enrolled students, moderated by the BICE team.
            </p>
          </Reveal>
          {data.reviews.length ? (
            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {data.reviews.map((r) => (
                <StaggerItem key={r.id} className="h-full">
                  <SpotlightCard className="h-full rounded-lg border border-neutral-200 bg-white">
                    <CardContent className="relative flex h-full flex-col gap-3 p-6">
                      <Quote className="h-5 w-5 text-red-600" />
                      <RatingStars rating={r.rating} />
                      <p className="text-sm leading-relaxed text-neutral-700">{r.comment}</p>
                      {r.title ? <p className="text-sm font-semibold text-neutral-900">“{r.title}”</p> : null}
                      <p className="mt-auto text-xs font-medium text-neutral-500">
                        {r.user?.name ?? "BICE student"}
                        {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                      </p>
                    </CardContent>
                  </SpotlightCard>
                </StaggerItem>
              ))}
            </Stagger>
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
          <Reveal className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-red-600">FAQ</span>
            <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
              Frequently asked questions
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Accordion type="single" collapsible className="rounded-xl border border-neutral-200 bg-white px-5">
              {HERO_FAQS.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-neutral-900 transition-colors hover:text-red-600 sm:text-base">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-neutral-600">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
          <p className="text-center text-sm text-neutral-500">
            More questions? Visit the{" "}
            <Link href="/faq" className="font-semibold text-red-600 hover:underline">
              full FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-red-600 hover:underline">
              contact us
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ============ NEWSLETTER (black band) ============ */}
      <section id="newsletter" className="relative w-full overflow-hidden bg-[#0a0a0a] py-16">
        <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-50" />
        <div
          aria-hidden
          className="animate-glow-drift pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.28), transparent 70%)" }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <Reveal className="max-w-xl space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Get free Excel &amp; SQL practice datasets every month
            </h2>
            <p className="text-sm leading-relaxed text-neutral-400 sm:text-base">
              One email a month: new course launches, cohort announcements and curated practice problems.
              No spam, unsubscribe anytime.
            </p>
          </Reveal>
          <NewsletterForm />
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="w-full bg-white py-16">
        <Reveal className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Users className="h-7 w-7" />
            <span className="absolute inset-0 -z-10 animate-ping rounded-xl bg-red-400/20 [animation-duration:2.5s]" />
          </span>
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-black sm:text-3xl">
            Ready to become the data person your team relies on?
          </h2>
          <p className="max-w-xl text-sm text-neutral-600 sm:text-base">
            Join <Counter value={data.studentsTrained} className="font-bold text-red-600" />+ learners building careers on BICE programs.
            Start free, upgrade when you are ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Magnetic>
              <Button asChild size="lg" className="h-12 bg-red-600 px-7 text-base font-semibold shadow-lg shadow-red-600/25 hover:bg-red-700">
                <Link href="/courses">Browse all courses</Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline" className="h-12 border-neutral-300 px-7 text-base font-semibold transition-colors hover:border-black hover:bg-black hover:text-white">
              <Link href="/register">Create a free account</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
