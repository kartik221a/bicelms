import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { store } from "@/repositories";
import { createCourse } from "@/app/admin/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { CourseForm } from "@/components/admin/course-form";

export const metadata = { title: "Create course — BICE Admin" };

export default async function AdminCreateCoursePage() {
  const [categories, instructors] = await Promise.all([
    store.list<{ id: string; name: string }>("categories", { orderBy: [{ field: "position" }], limit: 200 }),
    store.list<{ id: string; name: string }>("instructors", { limit: 200 }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/courses"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to courses
        </Link>
        <PageHeader
          title="Create course"
          description="Set the basics first — you will build the full curriculum in the next step."
        />
      </div>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">Course details</CardTitle>
          <CardDescription>Title and price are required; everything else can be edited later.</CardDescription>
        </CardHeader>
        <CardContent>
          <CourseForm
            mode="create"
            action={createCourse}
            categories={categories}
            instructors={instructors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
