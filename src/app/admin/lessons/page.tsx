import { BookOpen, ListVideo, Search } from "lucide-react";
import Link from "next/link";
import { store } from "@/repositories";
import { CourseDoc, LessonDoc, SectionDoc } from "@/services/course.service";
import { formatDuration } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { formatDate } from "@/components/admin/format";

export const metadata = { title: "Lessons — BICE Admin" };

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; q?: string; status?: string }>;
}) {
  const { courseId = "", q = "", status = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [lessons, sections, courses] = await Promise.all([
    store.list<LessonDoc>("lessons", { orderBy: [{ field: "position" }], limit: 20000 }),
    store.list<SectionDoc>("sections", { limit: 5000 }),
    store.list<CourseDoc>("courses", { orderBy: [{ field: "title" }], limit: 500 }),
  ]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const sectionById = new Map(sections.map((s) => [s.id, s]));

  const rows = lessons
    .map((lesson) => {
      const course = courseById.get(lesson.courseId);
      const section = sectionById.get(lesson.sectionId);
      return { lesson, course, sectionTitle: section?.title ?? "Uncategorized" };
    })
    .filter(({ lesson, course }) => {
      if (courseId && courseId !== "any" && lesson.courseId !== courseId) return false;
      if (status && status !== "any" && lesson.status !== status) return false;
      if (query) {
        const hay = `${lesson.title} ${course?.title ?? ""} ${sectionById.get(lesson.sectionId)?.title ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.course?.title ?? "").localeCompare(b.course?.title ?? ""));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Lessons"
        count={`${lessons.length} lessons`}
        description="Every lesson across the catalog — jump into a course's curriculum builder to edit."
      />

      <form method="GET" action="/admin/lessons" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder="Search lesson or course title…" className="pl-9" aria-label="Search lessons" />
        </div>
        <Select name="courseId" defaultValue={courseId || "any"}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by course">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={status || "any"}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" className="shrink-0">
          Filter
        </Button>
      </form>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ListVideo}
                title="No lessons found"
                description="No lessons match the current filters. Lessons are created inside a course's curriculum builder."
              />
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[240px]">Lesson</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead className="text-right">Curriculum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ lesson, course }) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="max-w-[260px] truncate font-medium text-slate-800">{lesson.title}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-slate-600">{course?.title ?? "—"}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-slate-500">{sectionById.get(lesson.sectionId)?.title ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600">{formatDuration(lesson.durationSeconds || 0)}</TableCell>
                      <TableCell>
                        {lesson.isFreePreview ? (
                          <Badge className="border-0 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25" variant="outline">
                            Free preview
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Locked (paid)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={lesson.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">{formatDate(course?.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        {course ? (
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#dc2626] hover:underline"
                          >
                            <BookOpen className="h-3.5 w-3.5" /> Edit course curriculum
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
