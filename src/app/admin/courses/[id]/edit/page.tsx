import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Info, Layers } from "lucide-react";
import { store } from "@/repositories";
import { getCurriculum } from "@/services/course.service";
import {
  addLesson,
  addSection,
  deleteCourse,
  deleteLesson,
  deleteSection,
  reorderLessons,
  reorderSections,
  renameSection,
  setCourseStatus,
  toggleFreePreview,
  updateCourse,
  updateLesson,
} from "@/app/admin/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { CourseForm } from "@/components/admin/course-form";
import { CurriculumBuilder } from "@/components/admin/curriculum-builder";
import { PublishToggleButton } from "@/components/admin/publish-toggle";

export const metadata = { title: "Curriculum builder — BICE Admin" };

export default async function AdminEditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await store.get<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    categoryId: string | null;
    instructorId: string | null;
    level: string;
    status: string;
    price: number;
    originalPrice: number | null;
    thumbnailUrl: string | null;
  }>("courses", id);
  if (!course) notFound();

  const [curriculum, categories, instructors] = await Promise.all([
    getCurriculum(course.id, false),
    store.list<{ id: string; name: string }>("categories", { orderBy: [{ field: "position" }], limit: 200 }),
    store.list<{ id: string; name: string }>("instructors", { limit: 200 }),
  ]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <div>
        <Link
          href="/admin/courses"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to courses
        </Link>
        <PageHeader
          title={course.title}
          description={`Curriculum builder — /${course.slug}`}
        >
          <span className="flex h-10 items-center">
            <StatusPill status={course.status} />
          </span>
          <Button asChild variant="outline">
            <Link href={`/courses/${course.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Preview as student
            </Link>
          </Button>
          <PublishToggleButton status={course.status} onToggle={setCourseStatus.bind(null, course.id)} />
        </PageHeader>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2]/60 px-4 py-3 text-sm text-slate-600">
        <Info className="h-4 w-4 shrink-0 text-[#dc2626]" />
        Drag sections and lessons by their handles to reorder. Switch a lesson to &ldquo;free preview&rdquo; to expose it as a
        taster; keep the rest locked behind enrollment. Total content drives the certificate automatically.
      </div>

      <CurriculumBuilder
        courseId={course.id}
        sections={curriculum.sections}
        addSection={addSection.bind(null, course.id)}
        renameSection={renameSection}
        deleteSection={deleteSection}
        reorderSections={reorderSections.bind(null, course.id)}
        addLesson={addLesson.bind(null, course.id)}
        updateLesson={updateLesson.bind(null, course.id)}
        deleteLesson={deleteLesson.bind(null, course.id)}
        reorderLessons={reorderLessons}
        toggleFreePreview={toggleFreePreview.bind(null, course.id)}
      />

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Layers className="h-4 w-4 text-[#dc2626]" /> Basic course fields
          </CardTitle>
          <CardDescription>Card copy, pricing, category and status — visible on the public course page.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm mode="edit" action={updateCourse.bind(null, course.id)} categories={categories} instructors={instructors} initial={course} />
        </CardContent>
      </Card>
    </div>
  );
}
