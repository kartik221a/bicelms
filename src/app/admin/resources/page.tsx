import {
  ClipboardList,
  Download,
  ExternalLink,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LayoutTemplate,
  Link2,
  Lock,
  ScrollText,
  Trash2,
} from "lucide-react";
import { store } from "@/repositories";
import { CourseDoc, LessonDoc } from "@/services/course.service";
import { deleteResource, saveResource } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceDialog } from "@/components/admin/resource-dialog";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";

export const metadata = { title: "Resources — BICE Admin" };

interface ResourceRow {
  id: string;
  courseId: string;
  lessonId?: string | null;
  title: string;
  type: string;
  storageId?: string | null;
  externalUrl?: string | null;
  downloadable: boolean;
  availableAfterLessonId?: string | null;
}

const TYPE_ICONS: Record<string, { icon: typeof FileText; label: string }> = {
  pdf: { icon: FileText, label: "PDF" },
  cheatsheet: { icon: ScrollText, label: "Cheat sheet" },
  practice_file: { icon: FileSpreadsheet, label: "Practice file" },
  template: { icon: LayoutTemplate, label: "Template" },
  assignment: { icon: ClipboardList, label: "Assignment" },
  external: { icon: Link2, label: "External link" },
  other: { icon: FileIcon, label: "Other" },
};

export default async function AdminResourcesPage() {
  const [resources, courses, lessons] = await Promise.all([
    store.list<ResourceRow>("resources", { orderBy: [{ field: "createdAt", direction: "asc" }], limit: 2000 }),
    store.list<CourseDoc>("courses", { orderBy: [{ field: "title" }], limit: 500 }),
    store.list<LessonDoc>("lessons", { limit: 20000 }),
  ]);

  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const dialogCourses = courses.map((c) => ({
    id: c.id,
    title: c.title,
    lessons: lessons
      .filter((l) => l.courseId === c.id)
      .sort((a, b) => a.position - b.position)
      .map((l) => ({ id: l.id, title: l.title })),
  }));

  const grouped = courses
    .map((course) => ({ course, items: resources.filter((r) => r.courseId === course.id) }))
    .filter((g) => g.items.length > 0);

  const orphaned = resources.filter((r) => !courses.some((c) => c.id === r.courseId));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="Resources"
        count={`${resources.length} resources`}
        description="Practice files, cheat sheets and assignments attached to courses — optionally gated behind lessons."
      >
        <ResourceDialog courses={dialogCourses} action={saveResource} />
      </PageHeader>

      {resources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description="Add downloadable files or external links students can use alongside lessons."
          action={<ResourceDialog courses={dialogCourses} action={saveResource} />}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ course, items }) => (
            <Card key={course.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <ul className="divide-y divide-slate-100">
                  {items.map((r) => {
                    const meta = TYPE_ICONS[r.type] ?? TYPE_ICONS.other;
                    const Icon = meta.icon;
                    const lesson = r.lessonId ? lessonById.get(r.lessonId) : undefined;
                    const gate = r.availableAfterLessonId ? lessonById.get(r.availableAfterLessonId) : undefined;
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                            <span>{meta.label}</span>
                            {lesson ? (
                              <>
                                <span aria-hidden>·</span>
                                <span className="truncate">Lesson: {lesson.title}</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                          {r.downloadable ? (
                            <Badge variant="outline" className="border-0 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              <Download className="h-3 w-3" /> Downloadable
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-0 bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20">
                              View only
                            </Badge>
                          )}
                          {gate ? (
                            <Badge variant="outline" className="border-0 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25">
                              <Lock className="h-3 w-3" /> After “{gate.title}”
                            </Badge>
                          ) : null}
                          {r.type === "external" && r.externalUrl ? (
                            <a
                              href={r.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#4f46e5] hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Open
                            </a>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <ResourceDialog courses={dialogCourses} action={saveResource} initial={r} />
                          <ConfirmDialogButton
                            trigger={
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label={`Delete resource ${r.title}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                            title="Delete resource?"
                            description={`"${r.title}" will no longer be available to students.`}
                            confirmLabel="Delete resource"
                            onConfirm={deleteResource.bind(null, r.id)}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}

          {orphaned.length > 0 ? (
            <Card className="border-amber-200 bg-amber-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-amber-800">{orphaned.length} resource(s) without a valid course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {orphaned.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2">
                    <p className="truncate text-sm text-slate-700">{r.title}</p>
                    <div className="flex items-center gap-1">
                      <ResourceDialog courses={dialogCourses} action={saveResource} initial={r} />
                      <ConfirmDialogButton
                        trigger={
                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label="Delete orphaned resource">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                        title="Delete resource?"
                        description="This resource points to a course that no longer exists."
                        confirmLabel="Delete resource"
                        onConfirm={deleteResource.bind(null, r.id)}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
