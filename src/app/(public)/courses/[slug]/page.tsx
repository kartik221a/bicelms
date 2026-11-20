import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Award,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileDown,
  Home,
  Infinity as InfinityIcon,
  Lock,
  MonitorPlay,
  PlayCircle,
  ShieldCheck,
  Star,
  Target,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RatingStars } from "@/components/shared/rating-stars";
import { LevelBadge } from "@/components/shared/level-badge";
import { PriceTag } from "@/components/shared/price-tag";
import { EmptyState } from "@/components/shared/empty-state";
import { EnrollButton, GoToCourseButton, WishlistButton } from "@/components/public/enroll-button";
import {
  getCourseBySlug,
  getCurriculum,
  parseFaqs,
  parseJsonArray,
  type CourseDoc,
} from "@/services/course.service";
import { listCourseReviews } from "@/services/review.service";
import { getActiveEnrollment } from "@/services/progress.service";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { formatDuration, formatHours } from "@/lib/money";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await getCourseBySlug(slug);
    return {
      title: course.seoTitle || course.title,
      description:
        course.seoDescription || course.subtitle || course.description.slice(0, 160) || undefined,
    };
  } catch {
    return { title: "Course not found" };
  }
}

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

interface InstructorInfo {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  credentials?: string | null;
  photoUrl?: string | null;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let course: CourseDoc;
  try {
    const found = await getCourseBySlug(slug);
    if (found.status !== "published") notFound();
    course = found;
  } catch {
    notFound();
  }

  const [curriculum, reviews, session, category, instructor] = await Promise.all([
    getCurriculum(course.id, true),
    listCourseReviews(course.id, true),
    getSession(),
    course.categoryId
      ? store.get<CategoryInfo>("categories", course.categoryId)
      : Promise.resolve(null),
    course.instructorId
      ? store.get<InstructorInfo>("instructors", course.instructorId)
      : Promise.resolve(null),
  ]);

  const sessionUser = await session;
  const isEnrolled = sessionUser
    ? Boolean(await getActiveEnrollment(sessionUser.id, course.id))
    : false;

  const objectives = parseJsonArray(course.learningObjectives);
  const skills = parseJsonArray(course.skills);
  const prerequisites = parseJsonArray(course.prerequisites);
  const audience = parseJsonArray(course.targetAudience);
  const faqs = parseFaqs(course.faqs);
  const descriptionParagraphs = course.description.split(/\n{2,}/).filter((p) => p.trim());

  const videoMinutes = Math.round(curriculum.totals.durationSeconds / 60);
  const updatedLabel = new Date(course.updatedAt).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  /* Rating breakdown (5 → 1) from approved reviews */
  const starCounts = [5, 4, 3, 2, 1].map(
    (s) => reviews.filter((r) => r.rating === s).length
  );
  const reviewTotal = reviews.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.seoDescription || course.subtitle || course.description.slice(0, 300),
    provider: { "@type": "Organization", name: "BICE Academy", sameAs: "https://bice.example" },
    ...(course.price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: (course.price / 100).toFixed(2),
            priceCurrency: "INR",
          },
        }
      : {
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        }),
    ...(course.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: course.ratingAvg,
            reviewCount: course.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="flex w-full flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumbs */}
      <div className="w-full border-b border-slate-200/60 bg-slate-50 py-4">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto flex max-w-7xl items-center gap-2 px-4 text-xs text-slate-500 sm:px-6 lg:px-8"
        >
          <Link href="/" className="flex items-center gap-1.5 font-medium hover:text-[#dc2626]">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <Link href="/courses" className="font-medium hover:text-[#dc2626]">
            Courses
          </Link>
          {category ? (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <Link
                href={`/courses?category=${encodeURIComponent(category.slug)}`}
                className="font-medium hover:text-[#dc2626]"
              >
                {category.name}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="truncate font-semibold text-slate-900">{course.title}</span>
        </nav>
      </div>

      {/* Course header */}
      <section className="w-full border-b border-slate-200/60 bg-slate-50 pb-10">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {category ? (
                <Badge className="gap-1.5 bg-[#fef2f2] text-[#dc2626] uppercase tracking-wider hover:bg-[#fef2f2]">
                  <BarChart3 className="h-3.5 w-3.5" /> {category.name}
                </Badge>
              ) : null}
              <LevelBadge level={course.level} />
              {course.certificateEnabled ? (
                <Badge variant="outline" className="gap-1 bg-white text-slate-600">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#dc2626]" /> BICE certified track
                </Badge>
              ) : null}
            </div>
            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {course.title}
            </h1>
            {course.subtitle ? (
              <p className="max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{course.subtitle}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 shadow-sm">
                <RatingStars rating={course.ratingAvg} count={course.ratingCount} />
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-900">
                  {course.studentsCount.toLocaleString("en-IN")}
                </span>{" "}
                students enrolled
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {formatHours(videoMinutes)} on-demand · {curriculum.totals.lessons} lessons
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-slate-400" />
                Updated {updatedLabel}
              </span>
            </div>
            {instructor ? (
              <div className="flex items-center gap-3 pt-2">
                {instructor.photoUrl ? (
                  <img
                    src={instructor.photoUrl}
                    alt={instructor.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#dc2626]/20"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0a0a0a] to-[#dc2626] text-xs font-bold text-white ring-2 ring-[#dc2626]/20">
                    {initialsOf(instructor.name)}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    Created by {instructor.name}
                    <BadgeCheck className="h-4 w-4 text-[#dc2626]" />
                  </span>
                  <span className="text-xs text-slate-500">{instructor.title}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Body: content + sticky purchase card */}
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            {/* Promo video */}
            {course.promoVideoUrl ? (
              <div className="overflow-hidden rounded-xl bg-slate-950 shadow-xl">
                <video
                  controls
                  preload="metadata"
                  poster="/video-poster.svg"
                  src={course.promoVideoUrl}
                  className="aspect-video w-full"
                  aria-label={`Course preview trailer for ${course.title}`}
                />
              </div>
            ) : (
              <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#0a0a0a] via-[#1e1b4b] to-[#dc2626] text-white shadow-xl">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <PlayCircle className="h-8 w-8" />
                </span>
                <p className="text-sm font-semibold">Preview trailer coming soon</p>
                <p className="text-xs text-red-200">
                  Free-preview lessons are available in the curriculum below.
                </p>
              </div>
            )}

            <Tabs defaultValue="overview" className="gap-6">
              <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-white p-1 shadow-sm ring-1 ring-slate-200">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#dc2626]">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="curriculum" className="data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#dc2626]">
                  Curriculum
                </TabsTrigger>
                <TabsTrigger value="instructor" className="data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#dc2626]">
                  Instructor
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#dc2626]">
                  Reviews {reviewTotal > 0 ? `(${reviewTotal})` : ""}
                </TabsTrigger>
                <TabsTrigger value="faq" className="data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#dc2626]">
                  FAQ
                </TabsTrigger>
              </TabsList>

              {/* ---------------- OVERVIEW ---------------- */}
              <TabsContent value="overview" className="space-y-6">
                {objectives.length ? (
                  <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <CardContent className="space-y-5 p-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                          <BadgeCheck className="h-5 w-5 text-[#dc2626]" /> What you&apos;ll learn
                        </h2>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {objectives.length} objectives
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {objectives.map((o) => (
                          <div key={o} className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                            <p className="text-sm leading-snug text-slate-700">{o}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {descriptionParagraphs.length ? (
                  <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <CardContent className="space-y-4 p-6">
                      <h2 className="text-lg font-bold text-slate-900">About this course</h2>
                      {descriptionParagraphs.map((p, i) => (
                        <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
                          {p}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}

                {skills.length ? (
                  <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <CardContent className="space-y-4 p-6">
                      <h2 className="text-lg font-bold text-slate-900">Skills you&apos;ll gain</h2>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                          <Badge key={s} variant="secondary" className="bg-[#fef2f2] text-[#dc2626]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {prerequisites.length ? (
                    <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <CardContent className="space-y-4 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                          <Lock className="h-4.5 w-4.5 text-[#dc2626]" /> Prerequisites
                        </h2>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                          {prerequisites.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : null}
                  {audience.length ? (
                    <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <CardContent className="space-y-4 p-6">
                        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                          <Target className="h-4.5 w-4.5 text-[#dc2626]" /> Who this course is for
                        </h2>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
                          {audience.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </TabsContent>

              {/* ---------------- CURRICULUM ---------------- */}
              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {curriculum.totals.sections} sections
                  </span>
                  <span>·</span>
                  <span>{curriculum.totals.lessons} lessons</span>
                  <span>·</span>
                  <span>{formatHours(videoMinutes)} total video</span>
                </div>
                {curriculum.sections.length ? (
                  <Accordion
                    type="multiple"
                    defaultValue={curriculum.sections[0]?.id ? [curriculum.sections[0].id] : []}
                    className="rounded-xl border border-slate-200 bg-white px-5"
                  >
                    {curriculum.sections.map((section) => {
                      const sectionSeconds = section.lessons.reduce(
                        (acc, l) => acc + (l.durationSeconds || 0),
                        0
                      );
                      return (
                        <AccordionItem key={section.id} value={section.id}>
                          <AccordionTrigger className="gap-4 py-4 text-left hover:no-underline">
                            <span className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-sm font-semibold text-slate-900 sm:text-base">
                                {section.title}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"} ·{" "}
                                {formatHours(Math.round(sectionSeconds / 60))}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <ul className="divide-y divide-slate-100">
                              {section.lessons.map((lesson) => (
                                <li
                                  key={lesson.id}
                                  className="flex items-center gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                                >
                                  {lesson.isFreePreview ? (
                                    <PlayCircle className="h-4 w-4 shrink-0 text-[#dc2626]" />
                                  ) : (
                                    <Lock className="h-4 w-4 shrink-0 text-slate-300" />
                                  )}
                                  <span className="flex-1 text-slate-700">{lesson.title}</span>
                                  {lesson.isFreePreview ? (
                                    <Badge className="bg-[#fef2f2] text-[#dc2626] hover:bg-[#fef2f2]">
                                      Free Preview
                                    </Badge>
                                  ) : null}
                                  <span className="w-12 text-right font-mono text-xs text-slate-400">
                                    {formatDuration(lesson.durationSeconds)}
                                  </span>
                                </li>
                              ))}
                              {section.lessons.length === 0 ? (
                                <li className="py-3 text-sm text-slate-400">
                                  Lessons for this section are being prepared.
                                </li>
                              ) : null}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  <EmptyState
                    icon={PlayCircle}
                    title="Curriculum coming soon"
                    description="The faculty is still publishing lessons for this course. Check back shortly."
                  />
                )}
              </TabsContent>

              {/* ---------------- INSTRUCTOR ---------------- */}
              <TabsContent value="instructor">
                {instructor ? (
                  <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <CardContent className="flex flex-col gap-4 p-6 sm:flex-row">
                      {instructor.photoUrl ? (
                        <img
                          src={instructor.photoUrl}
                          alt={instructor.name}
                          className="h-20 w-20 rounded-full object-cover ring-4 ring-[#fef2f2]"
                        />
                      ) : (
                        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0a0a0a] to-[#dc2626] text-xl font-bold text-white ring-4 ring-[#fef2f2]">
                          {initialsOf(instructor.name)}
                        </span>
                      )}
                      <div className="space-y-2">
                        <h2 className="text-lg font-bold text-slate-900">{instructor.name}</h2>
                        <p className="text-sm font-medium text-slate-600">{instructor.title}</p>
                        {instructor.credentials ? (
                          <Badge className="bg-[#fef2f2] text-[#dc2626] hover:bg-[#fef2f2]">
                            {instructor.credentials}
                          </Badge>
                        ) : null}
                        {instructor.bio ? (
                          <p className="text-sm leading-relaxed text-slate-600">{instructor.bio}</p>
                        ) : null}
                        <p className="text-xs text-slate-400">
                          Teaches {course.studentsCount.toLocaleString("en-IN")} students in this course
                          cohort.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="Instructor profile coming soon"
                    description="We're still adding the faculty profile for this course."
                  />
                )}
              </TabsContent>

              {/* ---------------- REVIEWS ---------------- */}
              <TabsContent value="reviews" className="space-y-6">
                {reviewTotal > 0 ? (
                  <>
                    <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                      <CardContent className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
                        <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-50 px-8 py-4">
                          <span className="text-4xl font-extrabold text-slate-900">
                            {course.ratingAvg.toFixed(1)}
                          </span>
                          <RatingStars rating={course.ratingAvg} />
                          <span className="text-xs text-slate-500">
                            {course.ratingCount.toLocaleString("en-IN")} reviews
                          </span>
                        </div>
                        <div className="flex flex-col justify-center gap-2">
                          {starCounts.map((count, idx) => {
                            const stars = 5 - idx;
                            const pct = reviewTotal ? Math.round((count / reviewTotal) * 100) : 0;
                            return (
                              <div key={stars} className="flex items-center gap-3 text-sm">
                                <span className="flex w-14 items-center gap-1 text-slate-600">
                                  {stars} <Star className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                                </span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-10 text-right text-xs text-slate-500">
                                  {count} {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <Card key={r.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                          <CardContent className="space-y-3 p-6">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fef2f2] text-sm font-bold text-[#dc2626]">
                                {initialsOf(r.user?.name ?? "BICE Student")}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900">
                                  {r.user?.name ?? "BICE Student"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(r.createdAt).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <span className="ml-auto">
                                <RatingStars rating={r.rating} />
                              </span>
                            </div>
                            {r.title ? <p className="font-semibold text-slate-900">{r.title}</p> : null}
                            <p className="text-sm leading-relaxed text-slate-600">{r.comment}</p>
                            {r.adminReply ? (
                              <div className="rounded-lg border-l-4 border-[#dc2626] bg-slate-50 p-3 text-sm text-slate-600">
                                <span className="font-semibold text-slate-900">BICE team: </span>
                                {r.adminReply}
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description="Only enrolled students can review this course, and reviews appear after moderation. Enroll, complete the lessons, and be the first to share feedback."
                  />
                )}
              </TabsContent>

              {/* ---------------- FAQ ---------------- */}
              <TabsContent value="faq">
                {faqs.length ? (
                  <Accordion type="single" collapsible className="rounded-xl border border-slate-200 bg-white px-5">
                    {faqs.map((f, i) => (
                      <AccordionItem key={f.q} value={`cf-${i}`}>
                        <AccordionTrigger className="text-left text-sm font-semibold text-slate-900">
                          {f.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-slate-600">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No FAQs published for this course"
                    description="Have a question? Reach the BICE team from the Contact page — we reply within one business day."
                    action={
                      <Button asChild variant="outline" className="border-slate-300">
                        <Link href="/contact">Contact us</Link>
                      </Button>
                    }
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ---------------- STICKY PURCHASE CARD ---------------- */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <Card className="border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
              <CardContent className="flex flex-col gap-5 p-6">
                <PriceTag price={course.price} originalPrice={course.originalPrice} size="lg" />

                {isEnrolled ? (
                  <div className="space-y-3">
                    <GoToCourseButton slug={course.slug} />
                    <p className="text-center text-xs font-medium text-emerald-600">
                      You&apos;re already enrolled in this course.
                    </p>
                  </div>
                ) : (
                  <>
                    <EnrollButton
                      courseId={course.id}
                      courseTitle={course.title}
                      slug={course.slug}
                      isLoggedIn={Boolean(sessionUser)}
                      studentName={sessionUser?.name}
                      studentEmail={sessionUser?.email}
                    />
                    <WishlistButton slug={course.slug} title={course.title} />
                  </>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>30-day money-back guarantee — full refund, no questions asked.</span>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <h3 className="text-sm font-bold text-slate-900">This course includes</h3>
                  <ul className="space-y-2.5 text-sm text-slate-600">
                    <li className="flex items-center gap-2.5">
                      <MonitorPlay className="h-4 w-4 shrink-0 text-[#dc2626]" />
                      {formatHours(videoMinutes)} on-demand video
                    </li>
                    <li className="flex items-center gap-2.5">
                      <PlayCircle className="h-4 w-4 shrink-0 text-[#dc2626]" />
                      {curriculum.totals.lessons} published lessons
                    </li>
                    <li className="flex items-center gap-2.5">
                      <FileDown className="h-4 w-4 shrink-0 text-[#dc2626]" />
                      Practice files &amp; downloadable resources
                    </li>
                    {course.certificateEnabled ? (
                      <li className="flex items-center gap-2.5">
                        <Award className="h-4 w-4 shrink-0 text-[#dc2626]" />
                        Verified certificate of completion
                      </li>
                    ) : null}
                    <li className="flex items-center gap-2.5">
                      <InfinityIcon className="h-4 w-4 shrink-0 text-[#dc2626]" />
                      Lifetime access, including future updates
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
