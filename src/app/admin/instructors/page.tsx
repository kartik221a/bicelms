import { GraduationCap, Trash2 } from "lucide-react";
import { store } from "@/repositories";
import { CourseDoc } from "@/services/course.service";
import { deleteInstructor, saveInstructor } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { InstructorDialog } from "@/components/admin/instructor-dialog";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";

export const metadata = { title: "Instructors — BICE Admin" };

interface InstructorRow {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  credentials?: string | null;
}

export default async function AdminInstructorsPage() {
  const [instructors, courses] = await Promise.all([
    store.list<InstructorRow>("instructors", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 200 }),
    store.list<CourseDoc>("courses", { limit: 500 }),
  ]);

  const courseCount = new Map<string, number>();
  for (const c of courses) {
    if (c.instructorId) courseCount.set(c.instructorId, (courseCount.get(c.instructorId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="Instructors"
        count={`${instructors.length} instructors`}
        description="Teaching profiles surfaced on course pages and certificates."
      >
        <InstructorDialog action={saveInstructor} />
      </PageHeader>

      {instructors.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No instructors yet"
          description="Add instructor profiles so courses can be attributed to teachers."
          action={<InstructorDialog action={saveInstructor} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {instructors.map((inst) => (
            <Card key={inst.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fef2f2] text-lg font-bold text-[#dc2626]">
                    {inst.photoUrl ? (
                       
                      <img src={inst.photoUrl} alt={inst.name} className="h-full w-full object-cover" />
                    ) : (
                      inst.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{inst.name}</p>
                    <p className="truncate text-xs text-slate-500">{inst.title ?? "Instructor"}</p>
                    {inst.credentials ? (
                      <Badge variant="secondary" className="mt-1.5 px-2 py-0 text-[10px] font-medium">
                        {inst.credentials}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <InstructorDialog initial={inst} action={saveInstructor} />
                    <ConfirmDialogButton
                      trigger={
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label={`Delete instructor ${inst.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Delete instructor?"
                      description={`"${inst.name}" will be removed. Courses assigned to them keep running without an instructor.`}
                      confirmLabel="Delete instructor"
                      onConfirm={deleteInstructor.bind(null, inst.id)}
                    />
                  </div>
                </div>
                {inst.bio ? (
                  <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">{inst.bio}</p>
                ) : null}
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{courseCount.get(inst.id) ?? 0}</span> course(s) assigned
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
