import { formatINR } from "@/lib/money";

export interface EnrollmentDoc {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  source: string;
  orderId?: string | null;
  lastLessonId?: string | null;
  progressPercent: number;
  enrolledAt: string;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
}

export function computeProgressPercent(completed: number, total: number): number {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function describeOrderAmount(paise: number): string {
  return formatINR(paise);
}

export function formatEnrollment<T extends EnrollmentDoc>(e: T): T {
  return { ...e, progressPercent: Number(e.progressPercent) || 0 };
}
