/** Domain-level unions shared across services, API and UI. */

export type Role = "student" | "instructor" | "admin" | "super_admin";
export type UserStatus = "active" | "suspended";
export type Level = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published" | "scheduled";
export type LessonStatus = "draft" | "published";
export type CompletionRule = "auto_90" | "manual";
export type EnrollmentStatus = "active" | "revoked";
export type EnrollmentSource = "purchase" | "manual" | "coupon";
export type OrderStatus = "created" | "paid" | "failed" | "refunded" | "cancelled";
export type PaymentStatus = "pending" | "captured" | "failed" | "refunded";
export type CouponType = "percent" | "fixed";
export type ReviewStatus = "pending" | "approved" | "hidden";
export type ResourceType =
  | "pdf"
  | "cheatsheet"
  | "practice_file"
  | "template"
  | "assignment"
  | "external"
  | "other";
export type ProgressStatus = "started" | "completed";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  photoUrl?: string | null;
  status: UserStatus;
  emailVerified: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PlaybackAuthorization {
  lessonId: string;
  src: string;
  token: string;
  expiresAt: string;
  kind: "hls" | "mp4";
  watermark: { name: string; maskedEmail: string; studentId: string; opacity: number };
}

export interface JsonMap {
  [k: string]: unknown;
}
