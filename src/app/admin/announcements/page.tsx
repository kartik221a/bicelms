import { listAllAnnouncements, AnnouncementDoc } from "@/services/announcement.service";
import { publishAnnouncementAction } from "@/app/admin/actions";
import { store } from "@/repositories";
import { CourseDoc } from "@/services/course.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Megaphone, Pin } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { formatDateTime } from "@/components/admin/format";

export const metadata = { title: "Announcements — BICE Admin" };

export default async function AdminAnnouncementsPage() {
  const [announcements, courses] = await Promise.all([
    listAllAnnouncements(),
    store.list<CourseDoc>("courses", { orderBy: [{ field: "title" }], limit: 500 }),
  ]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const ordered = [...announcements].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <PageHeader
        title="Announcements"
        count={`${announcements.length} published`}
        description="Broadcast updates to everyone, students only, or a single course cohort."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Megaphone className="h-4 w-4 text-[#4f46e5]" /> Publish announcement
            </CardTitle>
            <CardDescription>Appears instantly on student dashboards for the selected audience.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementForm courses={courses.map((c) => ({ id: c.id, title: c.title }))} action={publishAnnouncementAction} />
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">All announcements</CardTitle>
              <p className="text-xs text-slate-500">Pinned items stay at the top of student dashboards.</p>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {ordered.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Megaphone} title="Nothing published yet" description="Use the form to send your first announcement." />
                </div>
              ) : (
                <ul className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">
                  {ordered.map((a: AnnouncementDoc) => (
                    <li key={a.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.pinned ? (
                          <Badge className="border-0 bg-[#eef2ff] text-[#4f46e5] ring-1 ring-inset ring-[#4f46e5]/20">
                            <Pin className="h-3 w-3" /> Pinned
                          </Badge>
                        ) : null}
                        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{a.title}</p>
                        <Badge variant="outline" className="border-slate-200 text-[10px] capitalize text-slate-500">
                          {a.audience === "course" && a.courseId
                            ? `Course: ${courseById.get(a.courseId)?.title ?? "removed"}`
                            : a.audience}
                        </Badge>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{a.body}</p>
                      <p className="mt-2 text-xs text-slate-400">Published {formatDateTime(a.publishedAt ?? a.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
