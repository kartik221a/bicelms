import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, CalendarDays, Download, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { CopyVerificationButton } from "@/components/lms/copy-verification-button";
import { getSession } from "@/services/auth/session";
import { listUserCertificates } from "@/services/certificate.service";
import { listUserEnrollments, getUserCourseProgress } from "@/services/progress.service";

export const metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [certificates, enrollments] = await Promise.all([
    listUserCertificates(session.id),
    listUserEnrollments(session.id),
  ]);
  const certCourseIds = new Set(certificates.map((c) => c.courseId));

  // Courses at 60%+ completion without a certificate yet.
  const nearCompletion = (
    await Promise.all(
      enrollments
        .filter((e) => !certCourseIds.has(e.courseId))
        .map(async (e) => {
          const progress = await getUserCourseProgress(session.id, e.courseId);
          return { enrollment: e, progress };
        })
    )
  ).filter(({ progress }) => progress.percent >= 60);

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Certificates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Certificates are issued automatically when you complete every published lesson of a course.
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Finish all lessons of a course with certificates enabled and your certificate will appear here."
          action={
            <Button asChild variant="outline">
              <Link href="/my-courses">Continue learning</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="space-y-4">
              {/* Certificate itself */}
              <div className="rounded-xl border-4 border-[#0f172a] bg-white p-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
                <div className="rounded-lg border border-[#0f172a]/30 px-6 py-10 text-center sm:px-10">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f172a] text-white">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#0f172a]">
                      BICE Academy
                    </span>
                  </div>
                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                    Certificate of Completion
                  </p>
                  <p className="mt-6 text-xs text-slate-500">This certifies that</p>
                  <p className="mt-2 font-serif text-3xl font-bold italic text-[#0f172a] sm:text-4xl">
                    {cert.user?.name ?? session.name}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">has successfully completed the course</p>
                  <p className="mx-auto mt-2 max-w-md font-serif text-xl font-semibold leading-snug text-slate-900">
                    {cert.course?.title ?? "Course"}
                  </p>
                  <div className="mx-auto mt-2 h-px w-24 bg-[#0f172a]/20" />
                  <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-slate-600 sm:flex-row sm:px-4">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">Instructor</p>
                      <p className="mt-0.5 font-medium text-slate-800">{cert.instructorName ?? "BICE Academy"}</p>
                    </div>
                    <div className="text-center">
                      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
                        <CalendarDays className="h-3 w-3" /> Issued
                      </p>
                      <p className="mt-0.5 font-medium text-slate-800">
                        {new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-slate-400 sm:justify-end">
                        <Fingerprint className="h-3 w-3" /> Certificate ID
                      </p>
                      <p className="mt-0.5 font-mono text-xs font-semibold text-slate-800">{cert.certificateId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild className="gap-2">
                  <a href={`/api/v1/certificates/${cert.certificateId}/pdf`} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </Button>
                <CopyVerificationButton certificateId={cert.certificateId} />
                <span className="text-xs text-slate-400">
                  Verify publicly at /verify-certificate/{cert.certificateId}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close to completion */}
      <section aria-labelledby="near-completion-heading">
        <h2 id="near-completion-heading" className="text-lg font-semibold text-slate-900">
          Courses close to completion
        </h2>
        {nearCompletion.length === 0 ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-4 py-5 text-sm text-slate-500">
            {certificates.length
              ? "No other courses are close to completion right now."
              : "Once you pass 60% of a course it will appear here so you know how close your certificate is."}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {nearCompletion.map(({ enrollment, progress }) => (
              <Card key={enrollment.id} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="truncate font-semibold text-slate-900">{enrollment.course.title}</h3>
                      <span className="shrink-0 text-sm font-bold text-[#4f46e5]">{progress.percent}%</span>
                    </div>
                    <Progress value={progress.percent} className="mt-2 h-2 bg-slate-100" />
                    <p className="mt-2 text-xs text-slate-500">
                      {progress.completedLessons} of {progress.totalLessons} lessons complete — complete all
                      lessons to receive your certificate.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="shrink-0">
                    <Link href={`/learn/${enrollment.course.slug}`}>
                      <BookOpen className="h-4 w-4" /> Continue
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
