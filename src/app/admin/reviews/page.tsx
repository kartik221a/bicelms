import { MessageSquareText, Star } from "lucide-react";
import { store } from "@/repositories";
import { CourseDoc } from "@/services/course.service";
import { moderateReviewAction } from "@/app/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
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
import { ReviewActions } from "@/components/admin/review-actions";
import { formatDate } from "@/components/admin/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reviews — BICE Admin" };

interface ReviewRow {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  status: string;
  adminReply?: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < rating ? "fill-red-500 text-red-500" : "fill-slate-200 text-slate-200")}
        />
      ))}
    </span>
  );
}

export default async function AdminReviewsPage() {
  const [reviews, courses, users] = await Promise.all([
    store.list<ReviewRow>("reviews", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 2000 }),
    store.list<CourseDoc>("courses", { limit: 500 }),
    store.list<UserRow>("users", { limit: 5000 }),
  ]);

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Reviews"
        count={`${reviews.length} reviews`}
        description={
          pendingCount > 0
            ? `${pendingCount} review(s) waiting for moderation. Approved reviews appear on course pages.`
            : "Moderate student reviews and reply publicly."
        }
      />

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {reviews.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={MessageSquareText} title="No reviews yet" description="Students can review courses they are enrolled in." />
            </div>
          ) : (
            <div className="max-h-[680px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Course</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="min-w-[280px]">Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => {
                    const course = courseById.get(r.courseId);
                    const user = userById.get(r.userId);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[180px] truncate font-medium text-slate-800">{course?.title ?? "—"}</TableCell>
                        <TableCell className="max-w-[160px]">
                          <p className="truncate text-slate-700">{user?.name ?? "—"}</p>
                          <p className="max-w-[160px] truncate text-xs text-slate-400">{user?.email ?? ""}</p>
                        </TableCell>
                        <TableCell>
                          <RatingStars rating={r.rating} />
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="line-clamp-2 text-sm text-slate-600">{r.comment}</p>
                          {r.adminReply ? (
                            <p className="mt-1 line-clamp-1 text-xs text-[#dc2626]">Reply: {r.adminReply}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <StatusPill status={r.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{formatDate(r.createdAt)}</TableCell>
                        <TableCell>
                          <ReviewActions reviewId={r.id} currentStatus={r.status} onModerate={moderateReviewAction.bind(null, r.id)} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
