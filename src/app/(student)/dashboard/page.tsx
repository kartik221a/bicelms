import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Award, BookOpen, CalendarClock, CheckCircle2, Clock3, Megaphone,
  Play, Target, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { listUserEnrollments, getUserCourseProgress, type ProgressDoc } from "@/services/progress.service";
import { getCurriculum, type CourseDoc, type LessonDoc } from "@/services/course.service";
import { listUserCertificates } from "@/services/certificate.service";
import { listAnnouncementsForUser, type AnnouncementDoc } from "@/services/announcement.service";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [enrollments, progressDocs, certificates] = await Promise.all([
    listUserEnrollments(session.id),
    store.list<ProgressDoc>("lessonProgress", { where: [["userId", "==", session.id]] }),
    listUserCertificates(session.id),
  ]);

  // Per-course details: curriculum for lesson names/durations + progress stats.
  const courseDetails = await Promise.all(
    enrollments.map(async (e) => {
      const [progress, curriculum] = await Promise.all([
        getUserCourseProgress(session.id, e.courseId),
        getCurriculum(e.courseId),
      ]);
      const lessonMap = new Map<string, LessonDoc>();
      for (const section of curriculum.sections) {
        for (const lesson of section.lessons) lessonMap.set(lesson.id, lesson);
      }
      const completedSeconds = progress.completedLessonIds.reduce(
        (acc, id) => acc + (lessonMap.get(id)?.durationSeconds ?? 0),
        0
      );
      const firstLessonId = curriculum.sections.flatMap((s) => s.lessons)[0]?.id ?? null;
      const resumeLesson = progress.resumeLessonId
        ? lessonMap.get(progress.resumeLessonId) ?? null
        : null;
      return {
        enrollment: e,
        course: e.course as CourseDoc,
        progress,
        lessonMap,
        completedSeconds,
        firstLessonId,
        resumeLesson,
      };
    })
  );

  const inProgress = courseDetails.filter((d) => !d.enrollment.completedAt);
  const completedCount = courseDetails.filter((d) => d.enrollment.completedAt).length;

  // KPIs — computed from real data only.
  const completedLessonsTotal = courseDetails.reduce((acc, d) => acc + d.progress.completedLessons, 0);
  const hoursLearned = courseDetails.reduce((acc, d) => acc + d.completedSeconds, 0) / 3600;

  // Weekly activity: lessons completed per day over the last 7 days.
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const perDay: number[] = Array.from({ length: 7 }, () => 0);
  let weekCompletions = 0;
  for (const doc of progressDocs) {
    if (doc.status !== "completed" || !doc.completedAt) continue;
    const at = new Date(doc.completedAt);
    if (at >= weekStart && at <= now) {
      weekCompletions += 1;
      perDay[6 - Math.floor((now.getTime() - at.getTime()) / 86400000)] += 1;
    }
  }
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-IN", { weekday: "narrow" });
  });
  const maxDay = Math.max(...perDay, 1);

  // Continue-learning hero: most recent in-progress enrollment (review mode if all done).
  const hero = inProgress[0] ?? courseDetails[0] ?? null;
  const heroIsCompleted = hero ? Boolean(hero.enrollment.completedAt) : false;
  const heroTargetId = hero
    ? hero.progress.resumeLessonId ?? hero.resumeLesson?.id ?? hero.firstLessonId
    : null;
  const heroHref = hero && heroTargetId ? `/learn/${hero.course.slug}/${heroTargetId}` : null;
  const others = heroIsCompleted ? inProgress : inProgress.filter((d) => d !== hero);

  const announcements = await listAnnouncementsForUser(
    session.id,
    enrollments.map((e) => e.courseId)
  );
  const courseTitleById = new Map(enrollments.map((e) => [e.courseId, e.course.title] as const));

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-[#4f46e5]/10 to-transparent blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-[15px]">
              You completed{" "}
              <span className="font-semibold text-slate-900">{weekCompletions} lesson{weekCompletions === 1 ? "" : "s"}</span>{" "}
              in the last 7 days across {enrollments.length} enrolled course{enrollments.length === 1 ? "" : "s"}.
              {completedCount > 0
                ? ` ${completedCount} course${completedCount === 1 ? " is" : "s are"} fully completed.`
                : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
            <CalendarClock className="h-4 w-4" />
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section aria-label="Learning statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Enrolled courses"
          value={enrollments.length}
          hint={inProgress.length ? `${inProgress.length} in active progress` : undefined}
        />
        <StatCard icon={CheckCircle2} label="Completed lessons" value={completedLessonsTotal} />
        <StatCard
          icon={Clock3}
          label="Hours learned"
          value={hoursLearned.toFixed(1)}
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={certificates.length}
          hint={certificates.length ? undefined : "Finish a course to earn one"}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Play className="h-5 w-5 text-[#4f46e5]" /> Continue learning
            </h2>
            {enrollments.length ? (
              <Link
                href="/my-courses"
                className="text-sm font-semibold text-[#4f46e5] hover:underline"
              >
                View all ({enrollments.length})
              </Link>
            ) : null}
          </div>

          {hero && heroHref ? (
            <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <Thumbnail course={hero.course} className="h-20 w-32 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4f46e5]">
                      {heroIsCompleted ? "Course completed" : "Pick up where you left off"}
                    </p>
                    <h3 className="mt-1 truncate text-lg font-bold text-slate-900">{hero.course.title}</h3>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {heroIsCompleted
                        ? "All lessons done — review any lesson or download your certificate."
                        : hero.resumeLesson
                          ? `Next up: ${hero.resumeLesson.title}`
                          : "Start with the first lesson"}
                    </p>
                    <div className="mt-3 flex max-w-sm items-center gap-3">
                      <Progress value={hero.progress.percent} className="h-2 flex-1 bg-slate-100" />
                      <span className="shrink-0 text-xs font-semibold text-slate-600">
                        {hero.progress.percent}% ({hero.progress.completedLessons}/{hero.progress.totalLessons})
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      Last accessed{" "}
                      {hero.enrollment.lastAccessedAt
                        ? formatDistanceToNow(new Date(hero.enrollment.lastAccessedAt), { addSuffix: true })
                        : "recently"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end">
                  <ProgressRing percent={hero.progress.percent} />
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={heroHref}>
                      <Play className="h-4 w-4" /> {heroIsCompleted ? "Review course" : "Resume lesson"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Enroll in your first course to start tracking learning progress here."
              action={
                <Button asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              }
            />
          )}

          {others.length ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Other in-progress courses
              </h3>
              {others.map((d) => {
                const targetId = d.progress.resumeLessonId ?? d.firstLessonId;
                return (
                  <Card key={d.enrollment.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                    <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <Thumbnail course={d.course} className="h-14 w-24 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-slate-900">{d.course.title}</h4>
                          <div className="mt-2 flex max-w-sm items-center gap-2">
                            <Progress value={d.progress.percent} className="h-2 flex-1 bg-slate-100" />
                            <span className="shrink-0 text-xs font-medium text-slate-500">
                              {d.progress.percent}% ({d.progress.completedLessons}/{d.progress.totalLessons})
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-xs text-slate-500">
                            Next lesson:{" "}
                            {d.resumeLesson?.title ?? d.lessonMap.get(targetId ?? "")?.title ?? "First lesson"}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" className="shrink-0">
                        <Link href={targetId ? `/learn/${d.course.slug}/${targetId}` : `/learn/${d.course.slug}`}>
                          <Play className="h-4 w-4" /> Resume
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-4">
          <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <TrendingUp className="h-4 w-4 text-[#4f46e5]" /> Learning activity
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                <span className="text-xl font-bold text-slate-900">{weekCompletions}</span> lessons completed
                in the last 7 days
              </p>
              <div
                className="mt-4 flex h-32 items-end justify-between gap-2 px-1"
                role="img"
                aria-label={`Lessons completed per day over the last week: ${perDay.join(", ")}`}
              >
                {perDay.map((count, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-1.5">
                    <div className="text-[10px] font-medium text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
                      {count}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        count === maxDay && count > 0
                          ? "bg-[#4f46e5]"
                          : count > 0
                            ? "bg-[#4f46e5]/40 group-hover:bg-[#4f46e5]/60"
                            : "bg-slate-200"
                      }`}
                      style={{ height: `${Math.max(count === 0 ? 6 : 12, (count / maxDay) * 100)}%` }}
                    />
                    <span
                      className={`text-[11px] ${count === maxDay && count > 0 ? "font-bold text-[#4f46e5]" : "text-slate-400"}`}
                    >
                      {dayLabels[i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <CardContent className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Megaphone className="h-4 w-4 text-[#4f46e5]" /> Recent announcements
              </h3>
              {announcements.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No announcements right now. Course updates will appear here.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {announcements.slice(0, 4).map((a) => (
                    <AnnouncementItem key={a.id} announcement={a} courseTitleById={courseTitleById} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-[#0f172a] text-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Target className="h-5 w-5 text-[#a5b4fc]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Certificates earned</p>
                <p className="text-sm text-slate-300">
                  {certificates.length
                    ? `Congratulations — ${certificates.length} certificate${certificates.length === 1 ? "" : "s"} issued.`
                    : "Complete all lessons of a course to receive your certificate."}
                </p>
                <Link href="/certificates" className="mt-1 inline-block text-xs font-semibold text-[#a5b4fc] hover:underline">
                  View certificates →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Thumbnail({ course, className }: { course: CourseDoc; className?: string }) {
  if (course.thumbnailUrl) {
    return (
       
      <img
        src={course.thumbnailUrl}
        alt={`Thumbnail of ${course.title}`}
        className={`${className ?? ""} rounded-lg border border-slate-200 object-cover`}
      />
    );
  }
  return (
    <span className={`flex ${className ?? ""} items-center justify-center rounded-lg border border-slate-200 bg-slate-100`}>
      <BookOpen className="h-5 w-5 text-slate-400" />
    </span>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <div className="relative flex h-24 w-24 items-center justify-center" role="img" aria-label={`${percent} percent complete`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle className="text-slate-100" cx="50" cy="50" fill="none" r={radius} stroke="currentColor" strokeWidth="8" />
        <circle
          className="text-[#4f46e5]"
          cx="50"
          cy="50"
          fill="none"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none text-slate-900">{percent}%</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-tight text-slate-400">Done</span>
      </div>
    </div>
  );
}

function AnnouncementItem({
  announcement,
  courseTitleById,
}: {
  announcement: AnnouncementDoc;
  courseTitleById: Map<string, string>;
}) {
  const label =
    announcement.audience === "course" && announcement.courseId
      ? courseTitleById.get(announcement.courseId) ?? "Your course"
      : "BICE Academy";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${announcement.pinned ? "bg-[#4f46e5]" : "bg-slate-300"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-[#4f46e5]">{label}</span>
          <span className="shrink-0 text-xs text-slate-400">
            {announcement.publishedAt
              ? formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true })
              : ""}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-800">{announcement.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{announcement.body}</p>
      </div>
    </li>
  );
}
