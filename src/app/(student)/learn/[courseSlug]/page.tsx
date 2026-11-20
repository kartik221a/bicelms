import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getSession } from "@/services/auth/session";
import { getCourseBySlug, getCurriculum } from "@/services/course.service";
import { getUserCourseProgress } from "@/services/progress.service";

export const metadata = { title: "Course player" };

/**
 * /learn/[courseSlug] — resolves to the resume lesson (first incomplete) or
 * falls back to the first published lesson, then redirects there.
 */
export default async function LearnIndexPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { courseSlug } = await params;

  const course = await getCourseBySlug(courseSlug).catch(() => notFound());

  const [curriculum, progress] = await Promise.all([
    getCurriculum(course.id),
    getUserCourseProgress(session.id, course.id),
  ]);
  const flat = curriculum.sections.flatMap((s) => s.lessons);

  const targetId = progress.resumeLessonId ?? flat[0]?.id ?? null;
  if (targetId) redirect(`/learn/${courseSlug}/${targetId}`);

  // Course exists but has no published lessons — say it honestly.
  return (
    <div className="mx-auto max-w-2xl py-10">
      <EmptyState
        icon={BookOpen}
        title="No lessons published yet"
        description="The instructor hasn't published any lessons for this course. Check back soon or explore other courses."
        action={
          <Button asChild variant="outline">
            <Link href={`/courses/${course.slug}`}>Back to course page</Link>
          </Button>
        }
      />
    </div>
  );
}
