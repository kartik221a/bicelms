import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Award, BookOpen, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { listUserEnrollments, getUserCourseProgress } from "@/services/progress.service";
import { listUserCertificates } from "@/services/certificate.service";
import { cn } from "@/lib/utils";
import type { CourseDoc } from "@/services/course.service";

export const metadata = { title: "My Courses" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { filter: rawFilter } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : "all";

  const [enrollments, certificates] = await Promise.all([
    listUserEnrollments(session.id, filter),
    listUserCertificates(session.id),
  ]);
  const certByCourse = new Map(certificates.map((c) => [c.courseId, c] as const));

  // Instructor names (read-only lookups; no instructor service exists).
  const instructorIds = [...new Set(enrollments.map((e) => e.course.instructorId).filter(Boolean))] as string[];
  const instructors = await Promise.all(
    instructorIds.map(async (id) => {
      const doc = await store.get<{ id: string; name: string }>("instructors", id);
      return [id, doc?.name ?? "BICE Academy"] as const;
    })
  );
  const instructorNames = new Map(instructors);

  const cards = await Promise.all(
    enrollments.map(async (e) => {
      const progress = await getUserCourseProgress(session.id, e.courseId);
      const firstLessonId = (await getFirstLessonId(e.courseId)) ?? progress.resumeLessonId;
      return { enrollment: e, course: e.course as CourseDoc, progress, firstLessonId };
    })
  );

  const tabHref = (key: FilterKey) => (key === "all" ? "/my-courses" : `/my-courses?filter=${key}`);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My courses</h1>
          <p className="mt-1 text-sm text-slate-500">
            {enrollments.length
              ? `${enrollments.length} course${enrollments.length === 1 ? "" : "s"} in this view.`
              : "Your enrolled courses will appear here."}
          </p>
        </div>
        <nav aria-label="Filter courses" className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={tabHref(f.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-[#dc2626] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
              aria-current={filter === f.key ? "page" : undefined}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter === "completed" ? "No completed courses yet" : "No enrolled courses"}
          description={
            filter === "completed"
              ? "Finish all lessons of a course and it will show up here with its certificate."
              : "Browse the catalog and enroll to start learning."
          }
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ enrollment, course, progress, firstLessonId }) => {
            const isCompleted = Boolean(enrollment.completedAt);
            const cert = certByCourse.get(course.id);
            const resumeId = progress.resumeLessonId ?? firstLessonId;
            return (
              <Card
                key={enrollment.id}
                className="flex flex-col overflow-hidden border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md"
              >
                <Link href={`/courses/${course.slug}`} className="relative block aspect-video overflow-hidden bg-slate-100">
                  {course.thumbnailUrl ? (
                     
                    <img
                      src={course.thumbnailUrl}
                      alt={`Thumbnail of ${course.title}`}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-8 w-8 text-slate-300" />
                    </span>
                  )}
                  {isCompleted ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                      <Award className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : null}
                </Link>
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div>
                    <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">
                      <Link href={`/courses/${course.slug}`} className="hover:text-[#dc2626]">
                        {course.title}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      By {course.instructorId ? instructorNames.get(course.instructorId) ?? "BICE Academy" : "BICE Academy"}
                    </p>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-3">
                      <Progress value={progress.percent} className="h-2 flex-1 bg-slate-100" />
                      <span className="shrink-0 text-xs font-semibold text-slate-600">{progress.percent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Completed {progress.completedLessons} of {progress.totalLessons} lessons
                      </span>
                      <span title={enrollment.lastAccessedAt ?? undefined}>
                        {enrollment.lastAccessedAt
                          ? formatDistanceToNow(new Date(enrollment.lastAccessedAt), { addSuffix: true })
                          : "Not started"}
                      </span>
                    </div>
                  </div>

                  {isCompleted && cert ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/verify-certificate/${cert.certificateId}`} target="_blank">
                        <Award className="h-4 w-4" /> View certificate
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href={resumeId ? `/learn/${course.slug}/${resumeId}` : `/learn/${course.slug}`}>
                        <Play className="h-4 w-4" /> Continue learning
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function getFirstLessonId(courseId: string): Promise<string | null> {
  const lessons = await store.list<{ id: string; status: string }>("lessons", {
    where: [
      ["courseId", "==", courseId],
      ["status", "==", "published"],
    ],
    orderBy: [{ field: "position", direction: "asc" }],
    limit: 1,
  });
  return lessons[0]?.id ?? null;
}
