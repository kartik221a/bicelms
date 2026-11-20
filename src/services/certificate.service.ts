import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { CourseDoc } from "./course.service";
import { randomId } from "@/lib/crypto";
import { sendTemplatedEmail, emailTemplates } from "./email";
import { SessionUser } from "@/types";
import { audit } from "./audit.service";

/**
 * Certificates (master prompt §12): issued only when completion requirements
 * are satisfied; publicly verifiable at /verify-certificate/[certificateId].
 */

export interface CertificateDoc {
  id: string;
  certificateId: string;
  userId: string;
  courseId: string;
  instructorName?: string | null;
  issuedAt: string;
}

export async function maybeIssueCertificate(userId: string, courseId: string, completedLessonIds: string[]) {
  const course = await store.get<CourseDoc>("courses", courseId);
  if (!course || !course.certificateEnabled || course.status !== "published") return null;
  const existing = await store.list<CertificateDoc>("certificates", {
    where: [
      ["userId", "==", userId],
      ["courseId", "==", courseId],
    ],
    limit: 1,
  });
  if (existing.length) return existing[0];

  const lessons = await store.list<{ id: string; status: string }>("lessons", {
    where: [["courseId", "==", courseId]],
  });
  const published = lessons.filter((l) => l.status === "published");
  if (!published.length || completedLessonIds.length < published.length) return null;

  const instructor = course.instructorId
    ? await store.get<{ name: string }>("instructors", course.instructorId)
    : null;
  const courseCode = course.slug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "GEN";
  const certificate = await store.create<CertificateDoc>("certificates", {
    certificateId: `BICE-${new Date().getFullYear()}-${courseCode}-${randomId(5).toUpperCase()}`,
    userId,
    courseId,
    instructorName: instructor?.name ?? "BICE Academy",
  });
  const user = await store.get<{ id: string; email: string; name: string }>("users", userId);
  if (user) {
    await sendTemplatedEmail(
      user.email,
      emailTemplates.certificateEarned(user.name, course.title, certificate.certificateId)
    );
  }
  return certificate;
}

export async function listUserCertificates(userId: string) {
  const certs = await store.list<CertificateDoc>("certificates", {
    where: [["userId", "==", userId]],
    orderBy: [{ field: "issuedAt", direction: "desc" }],
  });
  return Promise.all(
    certs.map(async (c) => ({
      ...c,
      course: await store.get<CourseDoc>("courses", c.courseId),
      user: await store.get<{ name: string; email: string }>("users", c.userId),
    }))
  );
}

export async function getCertificateForVerification(certificateId: string) {
  const cert = await store.getByField<CertificateDoc>("certificates", "certificateId", certificateId);
  if (!cert) throw errors.notFound("Certificate not found");
  const [course, user] = await Promise.all([
    store.get<CourseDoc>("courses", cert.courseId),
    store.get<{ name: string; email: string }>("users", cert.userId),
  ]);
  return {
    certificateId: cert.certificateId,
    issuedAt: cert.issuedAt,
    instructorName: cert.instructorName,
    studentName: user?.name ?? "Student",
    courseTitle: course?.title ?? "Course",
    valid: true,
  };
}

export async function requireCertificateOwner(session: SessionUser, certificateId: string) {
  const cert = await store.getByField<CertificateDoc>("certificates", "certificateId", certificateId);
  if (!cert) throw errors.notFound("Certificate not found");
  if (cert.userId !== session.id && session.role !== "admin" && session.role !== "super_admin") {
    throw errors.forbidden();
  }
  return cert;
}
