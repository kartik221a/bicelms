import { BookOpen, Search, X } from "lucide-react";
import Link from "next/link";
import { store } from "@/repositories";
import { CourseDoc } from "@/services/course.service";
import { createCourse, deleteCourse, setCourseStatus } from "@/app/admin/actions";
import { formatINR } from "@/lib/money";
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
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { CourseRowActions } from "@/components/admin/course-row-actions";
import { formatDate } from "@/components/admin/format";

export const metadata = { title: "Courses — BICE Admin" };

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [courses, categories, instructors] = await Promise.all([
    store.list<CourseDoc>("courses", { orderBy: [{ field: "updatedAt", direction: "desc" }], limit: 500 }),
    store.list<{ id: string; name: string }>("categories", { limit: 200 }),
    store.list<{ id: string; name: string }>("instructors", { limit: 200 }),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const instructorName = new Map(instructors.map((i) => [i.id, i.name]));

  const filtered = courses.filter((c) => {
    if (query && !c.title.toLowerCase().includes(query) && !c.slug.toLowerCase().includes(query)) return false;
    if (status && status !== "any" && c.status !== status) return false;
    return true;
  });

  const hasFilters = Boolean(query || (status && status !== "any"));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Courses"
        count={`${courses.length} total`}
        description="Orchestrate course curriculums, pricing and publication status across the catalog."
      >
        <Link
          href="/admin/categories"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Manage categories
        </Link>
        <Link
          href="/admin/courses/create"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#dc2626] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#b91c1c]"
        >
          Create course
        </Link>
      </PageHeader>

      {/* Toolbar — GET form keeps filters shareable via URL params */}
      <form method="GET" action="/admin/courses" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search courses by title or slug…"
            className="pl-9"
            aria-label="Search courses"
          />
        </div>
        <Select name="status" defaultValue={status || "any"}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline" className="shrink-0">
          Filter
        </Button>
        {hasFilters ? (
          <Link
            href="/admin/courses"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm text-slate-500 transition-colors hover:text-slate-800"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Link>
        ) : null}
      </form>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={BookOpen}
                title={hasFilters ? "No courses match your filters" : "No courses yet"}
                description={
                  hasFilters
                    ? "Try a different search term or clear the status filter."
                    : "Create your first course to start building the catalog."
                }
                action={
                  hasFilters ? (
                    <Link href="/admin/courses" className="text-sm font-medium text-[#dc2626] hover:underline">
                      Clear filters
                    </Link>
                  ) : (
                    <Link
                      href="/admin/courses/create"
                      className="inline-flex h-10 items-center rounded-lg bg-[#dc2626] px-4 text-sm font-medium text-white hover:bg-[#b91c1c]"
                    >
                      Create course
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[260px]">Course</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                    <TableHead className="w-12" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                            {course.thumbnailUrl ? (
                               
                              <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <BookOpen className="h-4 w-4 text-slate-400" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/courses/${course.id}/edit`}
                              className="block max-w-[240px] truncate font-medium text-slate-900 hover:text-[#dc2626] hover:underline"
                            >
                              {course.title}
                            </Link>
                            <p className="max-w-[240px] truncate font-mono text-xs text-slate-400">/{course.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.categoryId ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {categoryName.get(course.categoryId) ?? "Unknown"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-slate-600">
                        {course.instructorId ? instructorName.get(course.instructorId) ?? "—" : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-slate-900">{formatINR(course.price)}</span>
                        {course.originalPrice && course.originalPrice > course.price ? (
                          <span className="ml-1.5 text-xs text-slate-400 line-through">{formatINR(course.originalPrice)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">{course.studentsCount.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-slate-600">
                        {course.ratingCount > 0 ? `${course.ratingAvg.toFixed(1)} ★` : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={course.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-slate-500">{formatDate(course.updatedAt)}</TableCell>
                      <TableCell>
                        <CourseRowActions
                          courseId={course.id}
                          slug={course.slug}
                          status={course.status}
                          setStatus={setCourseStatus.bind(null, course.id)}
                          onDelete={deleteCourse.bind(null, course.id)}
                        />
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
