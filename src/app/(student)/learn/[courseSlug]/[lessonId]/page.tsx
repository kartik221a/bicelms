import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  BookOpen, ChevronDown, ChevronLeft, ChevronRight, FileText, FileSpreadsheet,
  Link2, ListVideo, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProtectedVideoPlayer } from "@/components/player/video-player";
import { CurriculumSidebar, type SidebarSection } from "@/components/lms/curriculum-sidebar";
import { MarkCompletedButton } from "@/components/lms/mark-completed-button";
import { LessonSidePanel } from "@/components/lms/lesson-side-panel";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { getCourseBySlug, getCurriculum } from "@/services/course.service";
import {
  getActiveEnrollment, getUserCourseProgress, type ProgressDoc,
} from "@/services/progress.service";
import { listNotes, type NoteDoc } from "@/services/note.service";
import { listStudentResources } from "@/services/resource.service";
import { maskEmail } from "@/lib/money";
import { formatDuration } from "@/lib/money";

export const metadata = { title: "Learning" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { courseSlug, lessonId } = await params;

  const course = await getCourseBySlug(courseSlug).catch(() => notFound());
  const curriculum = await getCurriculum(course.id);
  const flat = curriculum.sections.flatMap((s) => s.lessons);
  const lesson = flat.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const enrollment = await getActiveEnrollment(session.id, course.id);
  const enrolled = Boolean(enrollment);
  const canWatch = enrolled || lesson.isFreePreview;

  const [progress, instructor] = await Promise.all([
    enrolled ? getUserCourseProgress(session.id, course.id) : null,
    course.instructorId
      ? store.get<{ id: string; name: string }>("instructors", course.instructorId)
      : Promise.resolve(null),
  ]);
  const completedSet = new Set(progress?.completedLessonIds ?? []);

  // Read the single progress doc for this lesson (server-side only) to resume
  // playback at the saved position.
  const lessonProgressDocs = await store.list<ProgressDoc>("lessonProgress", {
    where: [
      ["userId", "==", session.id],
      ["lessonId", "==", lesson.id],
    ],
    limit: 1,
  });
  const lessonProgress = lessonProgressDocs[0] ?? null;
  const resumeSeconds =
    canWatch && lessonProgress && lessonProgress.status !== "completed"
      ? Math.max(0, lessonProgress.positionSeconds ?? 0)
      : 0;

  const flatIndex = flat.findIndex((l) => l.id === lesson.id);
  const prev = flatIndex > 0 ? flat[flatIndex - 1] : null;
  const next = flatIndex >= 0 && flatIndex < flat.length - 1 ? flat[flatIndex + 1] : null;
  const section = curriculum.sections.find((s) => s.lessons.some((l) => l.id === lesson.id));

  const [notes, resources] = await Promise.all([
    listNotes(session.id, { courseId: course.id }),
    listStudentResources(session.id, course.id, progress?.completedLessonIds ?? []),
  ]);
  const lessonNotes = notes.filter((n) => n.lessonId === lesson.id);
  const attachments = resources.filter((r) => r.lessonId === lesson.id);

  const sidebarSections: SidebarSection[] = curriculum.sections.map((s) => ({
    id: s.id,
    title: s.title,
    lessons: s.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      durationSeconds: l.durationSeconds,
      completed: completedSet.has(l.id),
      isFreePreview: l.isFreePreview,
    })),
  }));

  const watermark = {
    name: session.name,
    maskedEmail: maskEmail(session.email),
    studentId: session.id.slice(-8).toUpperCase(),
    opacity: 0.12,
  };

  const sidebar = (
    <CurriculumSidebar
      courseTitle={course.title}
      instructorName={instructor?.name ?? null}
      courseSlug={course.slug}
      sections={sidebarSections}
      currentLessonId={lesson.id}
      percent={progress?.percent ?? 0}
      completedCount={progress?.completedLessons ?? 0}
      totalCount={progress?.totalLessons ?? flat.length}
      enrolled={enrolled}
    />
  );

  return (
    <div className="mx-auto max-w-[1440px]">
      {/* Mobile: curriculum collapses into a sheet */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-[44px] gap-2">
              <ListVideo className="h-4 w-4" /> Course content
              <ChevronDown className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[340px] max-w-[88vw] gap-0 overflow-hidden p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Course content</SheetTitle>
            </SheetHeader>
            {sidebar}
          </SheetContent>
        </Sheet>
        <span className="rounded-full bg-[#fef2f2] px-3 py-1.5 text-sm font-semibold text-[#dc2626]">
          {progress?.percent ?? 0}%
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:gap-6">
        {/* Left: curriculum rail */}
        <aside className="hidden lg:block">
          <div className="scrollbar-thin lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100vh-6.5rem)] lg:overflow-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            {sidebar}
          </div>
        </aside>

        {/* Center: player + lesson content */}
        <main className="min-w-0 space-y-5">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              href={`/courses/${course.slug}`}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {course.title}
            </Link>
            {section ? (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600">
                {section.title}
              </span>
            ) : null}
            <span className="rounded-full bg-[#dc2626] px-2.5 py-1 font-semibold text-white">
              {lesson.title}
            </span>
          </nav>

          {canWatch ? (
            <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="space-y-5 p-4 sm:p-6">
                <ProtectedVideoPlayer
                  lessonId={lesson.id}
                  resumeSeconds={resumeSeconds}
                  watermark={watermark}
                />

                <div className="space-y-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {lesson.title}
                  </h1>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                    <span>Duration {formatDuration(lesson.durationSeconds)}</span>
                    {lesson.isFreePreview && !enrolled ? (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Free preview — enroll to track progress
                      </span>
                    ) : null}
                    {completedSet.has(lesson.id) ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Completed
                      </span>
                    ) : null}
                  </p>
                  {lesson.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {lesson.description}
                    </p>
                  ) : null}
                </div>

                {attachments.length ? (
                  <div>
                    <h2 className="mb-2 text-sm font-semibold text-slate-900">Lesson attachments</h2>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((r) => (
                        <AttachmentChip key={r.id} resource={r} enrolled={enrolled} />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  {prev ? (
                    <Button asChild variant="outline" className="min-h-[44px]">
                      <Link href={`/learn/${course.slug}/${prev.id}`}>
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="min-h-[44px]">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <MarkCompletedButton lessonId={lesson.id} completed={completedSet.has(lesson.id)} enrolled={enrolled} />
                    {next ? (
                      <Button asChild className="min-h-[44px]">
                        <Link href={`/learn/${course.slug}/${next.id}`}>
                          Next <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="min-h-[44px]">
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="flex flex-col items-center py-16 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Lock className="h-7 w-7 text-slate-400" />
                </span>
                <h1 className="mt-4 text-xl font-bold text-slate-900">Enroll to unlock this lesson</h1>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  “{lesson.title}” is part of <span className="font-semibold text-slate-700">{course.title}</span>.
                  Enroll in the course to watch the full video, track progress, download resources and earn a
                  certificate.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="min-h-[44px]">
                    <Link href={`/courses/${course.slug}`}>View course &amp; enroll</Link>
                  </Button>
                  <Button asChild variant="outline" className="min-h-[44px]">
                    <Link href="/courses">Browse other courses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Right: notes / resources / Q&A */}
        {canWatch ? (
          <aside>
            <div className="scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100vh-6.5rem)] lg:overflow-hidden">
              <div className="flex h-full max-h-[calc(100vh-6.5rem)] flex-col lg:overflow-hidden">
                <LessonSidePanel
                  lessonId={lesson.id}
                  courseId={course.id}
                  notes={lessonNotes.map(serializeNote)}
                  resources={resources}
                  enrolled={enrolled}
                />
              </div>
            </div>
          </aside>
        ) : (
          <aside className="hidden lg:block" aria-hidden />
        )}
      </div>
    </div>
  );
}

function serializeNote(n: NoteDoc) {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    timestampSeconds: n.timestampSeconds ?? null,
    updatedAt: n.updatedAt,
  };
}

function AttachmentChip({
  resource,
  enrolled,
}: {
  resource: {
    id: string;
    title: string;
    type: string;
    downloadable: boolean;
    locked: boolean;
    downloadUrl: string | null;
    externalUrl: string | null;
    sizeBytes?: number | null;
  };
  enrolled: boolean;
}) {
  const Icon =
    resource.type === "pdf"
      ? FileText
      : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
        ? FileSpreadsheet
        : resource.type === "external"
          ? Link2
          : BookOpen;
  const canDownload = enrolled && resource.downloadUrl && resource.downloadable && !resource.locked;

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-2.5 pr-3">
      <Icon
        className={`h-4 w-4 ${
          resource.type === "pdf"
            ? "text-rose-600"
            : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
              ? "text-emerald-700"
              : "text-[#dc2626]"
        }`}
      />
      <span className="text-[13px] font-medium text-slate-800">{resource.title}</span>
      {canDownload ? (
        <a
          href={resource.downloadUrl!}
          className="text-xs font-semibold text-[#dc2626] hover:underline"
          aria-label={`Download ${resource.title}`}
        >
          Download
        </a>
      ) : resource.externalUrl ? (
        <a
          href={resource.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#dc2626] hover:underline"
        >
          View
        </a>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-xs text-slate-400"
          title={resource.locked ? "Unlocks after completing the gating lesson" : "View only resource"}
        >
          <Lock className="h-3 w-3" /> {resource.locked ? "Locked" : "View only"}
        </span>
      )}
    </div>
  );
}
