import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Download, ExternalLink, File, FileSpreadsheet, FileText, FolderOpen, Link2, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { listUserEnrollments, getUserCourseProgress } from "@/services/progress.service";
import { getCurriculum, type LessonDoc } from "@/services/course.service";
import { listStudentResources, type ResourceDoc, type StudentResourceView } from "@/services/resource.service";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Resources" };

const TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  cheatsheet: "Cheat sheet",
  practice_file: "Practice file",
  template: "Template",
  assignment: "Assignment",
  external: "External link",
  other: "File",
};

const CHIP_ORDER = ["pdf", "practice_file", "template", "assignment", "cheatsheet", "external", "other"];

export default async function MyResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { courseId } = await searchParams;

  const enrollments = await listUserEnrollments(session.id);
  if (enrollments.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My resources</h1>
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description="Resources (PDFs, practice files, datasets) attached to your enrolled courses appear here."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const selectedEnrollments = courseId
    ? enrollments.filter((e) => e.courseId === courseId)
    : enrollments;

  const groups = await Promise.all(
    selectedEnrollments.map(async (e) => {
      const [progress, curriculum] = await Promise.all([
        getUserCourseProgress(session.id, e.courseId),
        getCurriculum(e.courseId),
      ]);
      const resources = await listStudentResources(session.id, e.courseId, progress.completedLessonIds);
      const lessonMap = new Map<string, LessonDoc>();
      for (const s of curriculum.sections) {
        for (const l of s.lessons) lessonMap.set(l.id, l);
      }
      // The student view hides the gating lesson id on locked rows; resolve it
      // read-only so we can show an honest "Unlocks after Lesson X" label.
      const gateTitles = new Map<string, string>();
      for (const r of resources) {
        if (!r.locked) continue;
        const raw = await store.get<ResourceDoc>("resources", r.id);
        const gateLessonId = raw?.availableAfterLessonId ?? null;
        gateTitles.set(r.id, (gateLessonId && lessonMap.get(gateLessonId)?.title) || "the previous lesson");
      }
      return { course: e.course, lessonMap, resources, gateTitles };
    })
  );

  const filtered = courseId ? groups.filter((g) => g.course.id === courseId) : groups;

  // Summary chips: counts by type across every enrolled course.
  const counts = new Map<string, number>();
  let total = 0;
  let readyCount = 0;
  for (const g of groups) {
    for (const r of g.resources) {
      total += 1;
      counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
      if (r.downloadUrl) readyCount += 1;
    }
  }
  const chipTypes = CHIP_ORDER.filter((t) => counts.has(t));

  const chipHref = (id?: string) => (id ? `/my-resources?courseId=${id}` : "/my-resources");

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My resources</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} file{total === 1 ? "" : "s"} across {enrollments.length} enrolled course
          {enrollments.length === 1 ? "" : "s"} — {readyCount} ready to download.
        </p>
      </div>

      {/* Course filter + type summary chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={chipHref()}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            !courseId
              ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          )}
        >
          All courses
        </Link>
        {enrollments.map((e) => (
          <Link
            key={e.courseId}
            href={chipHref(e.courseId)}
            className={cn(
              "max-w-[220px] truncate rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              courseId === e.courseId
                ? "border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {e.course.title}
          </Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        {chipTypes.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            <span className="font-bold text-slate-900">{counts.get(t)}</span> {TYPE_LABELS[t] ?? t}
          </span>
        ))}
      </div>

      {/* Grouped resource rows */}
      {total === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources attached yet"
          description="When your instructor adds files to these courses they will show up here."
        />
      ) : (
        <div className="space-y-6">
          {filtered.map((g) =>
            g.resources.length === 0 ? null : (
              <Card key={g.course.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <h2 className="truncate font-bold text-slate-900">{g.course.title}</h2>
                    <Link
                      href={`/learn/${g.course.slug}`}
                      className="shrink-0 text-xs font-semibold text-[#4f46e5] hover:underline"
                    >
                      Open course
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {g.resources.map((r) => (
                      <ResourceRow
                        key={r.id}
                        resource={r}
                        lessonName={r.lessonId ? g.lessonMap.get(r.lessonId)?.title ?? null : null}
                        lockLabel={g.gateTitles.get(r.id) ?? null}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ResourceRow({
  resource,
  lessonName,
  lockLabel,
}: {
  resource: StudentResourceView;
  lessonName: string | null;
  lockLabel: string | null;
}) {
  const Icon =
    resource.type === "pdf"
      ? FileText
      : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
        ? FileSpreadsheet
        : resource.type === "external"
          ? Link2
          : File;
  const iconClass =
    resource.type === "pdf"
      ? "bg-rose-50 text-rose-600"
      : resource.type === "practice_file" || resource.type === "template" || resource.type === "assignment"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-[#eef2ff] text-[#4f46e5]";

  const size = formatSize(resource.sizeBytes);

  return (
    <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{resource.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
            {TYPE_LABELS[resource.type] ?? TYPE_LABELS.other}
          </Badge>
          <span className="truncate">{lessonName ? `Lesson: ${lessonName}` : "Course-wide"}</span>
          {size ? <span>• {size}</span> : null}
          {resource.locked ? (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Lock className="h-3 w-3" /> {lockLabel ? `Unlocks after Lesson ${lockLabel}` : "Locked"}
            </span>
          ) : !resource.downloadable ? (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              View only
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {resource.externalUrl ? (
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="h-4 w-4" /> View
          </a>
        ) : null}
        {resource.downloadUrl ? (
          <a
            href={resource.downloadUrl}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#4f46e5] px-3 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
          >
            <Download className="h-4 w-4" /> Download
          </a>
        ) : (
          <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400">
            <Lock className="h-4 w-4" /> Download
          </span>
        )}
      </div>
    </div>
  );
}

function formatSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
