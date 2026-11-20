"use server";

import { revalidatePath } from "next/cache";
import { store } from "@/repositories";
import { requireAdmin } from "@/services/auth/session";
import { courseInputSchema, lessonInputSchema, couponSchema } from "@/validators";
import { uniqueSlug, refreshCourseAggregate } from "@/services/course.service";
import { couponService } from "@/services/coupon.service";
import { moderateReview } from "@/services/review.service";
import { publishAnnouncement } from "@/services/announcement.service";
import { updateSettings } from "@/services/settings.service";
import { enrollAfterVerifiedPayment } from "@/services/payment.service";
import { audit } from "@/services/audit.service";
import { errors } from "@/lib/api";

async function assertAdmin() {
  return requireAdmin();
}

/* ---------------- Courses ---------------- */

export async function createCourse(formData: FormData) {
  const admin = await assertAdmin();
  const raw = courseInputSchema.parse({
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description") || "",
    level: formData.get("level") || "beginner",
    price: Number(formData.get("price") ?? 0),
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : null,
    thumbnailUrl: formData.get("thumbnailUrl") || null,
    categoryId: formData.get("categoryId") || null,
    instructorId: formData.get("instructorId") || null,
    status: formData.get("status") || "draft",
  });
  const slug = formData.get("slug") ? String(formData.get("slug")) : await uniqueSlug(raw.title);
  const course = await store.create("courses", { ...raw, slug });
  await audit({ actorUserId: admin.id, action: "course.create", entity: "course", entityId: course.id });
  revalidatePath("/admin/courses");
  return course;
}

export async function updateCourse(courseId: string, formData: FormData) {
  const admin = await assertAdmin();
  const existing = await store.get<{ slug: string; title: string }>("courses", courseId);
  if (!existing) throw errors.notFound("Course not found");
  const raw = courseInputSchema.partial().parse({
    title: formData.get("title") || undefined,
    subtitle: formData.get("subtitle") || undefined,
    description: formData.get("description") || undefined,
    level: formData.get("level") || undefined,
    price: formData.get("price") !== null && formData.get("price") !== "" ? Number(formData.get("price")) : undefined,
    originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : undefined,
    thumbnailUrl: formData.get("thumbnailUrl") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    instructorId: formData.get("instructorId") || undefined,
    status: formData.get("status") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
  if (raw.title) raw.slug = await uniqueSlug(raw.title, courseId);
  const updated = await store.update("courses", courseId, raw);
  await refreshCourseAggregate(courseId);
  await audit({ actorUserId: admin.id, action: "course.update", entity: "course", entityId: courseId });
  revalidatePath("/admin/courses");
  return updated;
}

export async function setCourseStatus(courseId: string, status: "draft" | "published" | "scheduled") {
  const admin = await assertAdmin();
  await store.update("courses", courseId, { status });
  await audit({ actorUserId: admin.id, action: `course.${status}`, entity: "course", entityId: courseId });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}

export async function deleteCourse(courseId: string) {
  const admin = await assertAdmin();
  await store.delete("courses", courseId);
  await audit({ actorUserId: admin.id, action: "course.delete", entity: "course", entityId: courseId });
  revalidatePath("/admin/courses");
}

/* ---------------- Curriculum ---------------- */

export async function addSection(courseId: string, title: string) {
  await assertAdmin();
  const existing = await store.list("sections", { where: [["courseId", "==", courseId]] });
  const section = await store.create("sections", {
    courseId,
    title,
    position: existing.length,
  });
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return section;
}

export async function renameSection(sectionId: string, title: string) {
  await assertAdmin();
  await store.update("sections", sectionId, { title });
}

export async function deleteSection(sectionId: string) {
  await assertAdmin();
  await store.delete("sections", sectionId);
}

export async function reorderSections(courseId: string, sectionIds: string[]) {
  await assertAdmin();
  for (const [i, id] of sectionIds.entries()) {
    await store.update("sections", id, { position: i });
  }
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export async function addLesson(courseId: string, sectionId: string, formData: FormData) {
  await assertAdmin();
  const raw = lessonInputSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    videoStorageId: formData.get("videoStorageId") || undefined,
    durationSeconds: Number(formData.get("durationSeconds") ?? 0),
    isFreePreview: formData.get("isFreePreview") === "on",
    status: formData.get("status") || "published",
  });
  const existing = await store.list("lessons", { where: [["sectionId", "==", sectionId]] });
  const lesson = await store.create("lessons", {
    ...raw,
    courseId,
    sectionId,
    position: existing.length,
  });
  await refreshCourseAggregate(courseId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
  return lesson;
}

export async function updateLesson(courseId: string, lessonId: string, formData: FormData) {
  await assertAdmin();
  const raw = lessonInputSchema.partial().parse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    videoStorageId: formData.get("videoStorageId") || undefined,
    durationSeconds: formData.get("durationSeconds") ? Number(formData.get("durationSeconds")) : undefined,
    isFreePreview: formData.get("isFreePreview") === "on" ? true : undefined,
    status: formData.get("status") || undefined,
    completionRule: formData.get("completionRule") || undefined,
  });
  await store.update("lessons", lessonId, raw);
  await refreshCourseAggregate(courseId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export async function deleteLesson(courseId: string, lessonId: string) {
  await assertAdmin();
  await store.delete("lessons", lessonId);
  await refreshCourseAggregate(courseId);
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

export async function reorderLessons(sectionId: string, lessonIds: string[]) {
  await assertAdmin();
  for (const [i, id] of lessonIds.entries()) {
    await store.update("lessons", id, { position: i });
  }
}

export async function toggleFreePreview(courseId: string, lessonId: string, isFree: boolean) {
  await assertAdmin();
  await store.update("lessons", lessonId, { isFreePreview: isFree });
  revalidatePath(`/admin/courses/${courseId}/edit`);
}

/* ---------------- Students & enrollment ---------------- */

export async function manuallyEnrollStudent(userId: string, courseId: string) {
  const admin = await assertAdmin();
  const enrollment = await enrollAfterVerifiedPayment(userId, courseId, "manual");
  await store.update("enrollments", enrollment.id, { source: "manual" });
  await audit({ actorUserId: admin.id, action: "enrollment.manual", entity: "enrollment", entityId: enrollment.id, meta: { userId, courseId } });
  revalidatePath("/admin/students");
  return enrollment;
}

export async function revokeEnrollment(enrollmentId: string) {
  const admin = await assertAdmin();
  await store.update("enrollments", enrollmentId, { status: "revoked" });
  await audit({ actorUserId: admin.id, action: "enrollment.revoke", entity: "enrollment", entityId: enrollmentId });
  revalidatePath("/admin/students");
}

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  const admin = await assertAdmin();
  await store.update("users", userId, { status });
  await audit({ actorUserId: admin.id, action: `user.${status}`, entity: "user", entityId: userId });
  revalidatePath("/admin/students");
}

/* ---------------- Coupons ---------------- */

export async function createCoupon(formData: FormData) {
  await assertAdmin();
  const input = couponSchema.parse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: Number(formData.get("value")),
    minOrderValue: Number(formData.get("minOrderValue") ?? 0),
    expiresAt: formData.get("expiresAt") || null,
    active: formData.get("active") === "on",
  });
  const coupon = await couponService.create(input);
  revalidatePath("/admin/coupons");
  return coupon;
}

export async function toggleCoupon(couponId: string, active: boolean) {
  await assertAdmin();
  await store.update("coupons", couponId, { active });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  await assertAdmin();
  await couponService.delete(couponId);
  revalidatePath("/admin/coupons");
}

/* ---------------- Reviews & announcements ---------------- */

export async function moderateReviewAction(reviewId: string, status: "approved" | "hidden" | "pending", adminReply?: string) {
  await assertAdmin();
  await moderateReview(reviewId, status, adminReply);
  revalidatePath("/admin/reviews");
}

export async function publishAnnouncementAction(formData: FormData) {
  await assertAdmin();
  await publishAnnouncement({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    audience: String(formData.get("audience") ?? "all"),
    courseId: (formData.get("courseId") as string) || null,
    pinned: formData.get("pinned") === "on",
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

/* ---------------- Settings ---------------- */

export async function updateSettingsAction(formData: FormData) {
  await assertAdmin();
  await updateSettings({
    instituteName: (formData.get("instituteName") as string) || undefined,
    tagline: (formData.get("tagline") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    contactPhone: (formData.get("contactPhone") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    taxPercent: formData.get("taxPercent") !== null ? Number(formData.get("taxPercent")) : undefined,
    videoSessionLimit: formData.get("videoSessionLimit") ? Number(formData.get("videoSessionLimit")) : undefined,
    watermarkOpacity: formData.get("watermarkOpacity") ? Number(formData.get("watermarkOpacity")) : undefined,
    playbackTokenTtlMin: formData.get("playbackTokenTtlMin") ? Number(formData.get("playbackTokenTtlMin")) : undefined,
    downloadsEnabled: formData.get("downloadsEnabled") === "on",
    seoTitle: (formData.get("seoTitle") as string) || undefined,
    seoDescription: (formData.get("seoDescription") as string) || undefined,
  });
  revalidatePath("/admin/settings");
}
