import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, BadgeCheck, CalendarDays, Download, GraduationCap, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCertificateForVerification } from "@/services/certificate.service";

type Params = { params: Promise<{ certificateId: string }> };

interface VerificationInfo {
  certificateId: string;
  issuedAt: string;
  instructorName?: string | null;
  studentName: string;
  courseTitle: string;
  valid: boolean;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { certificateId } = await params;
  return { title: `Certificate ${certificateId}` };
}

export default async function CertificateResultPage({ params }: Params) {
  const { certificateId } = await params;

  let info: VerificationInfo | null = null;
  try {
    info = await getCertificateForVerification(certificateId);
  } catch {
    info = null;
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#dc2626]">Credential check</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Certificate verification result
          </h1>
        </div>
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {info && info.valid ? (
          <Card className="border-emerald-200 shadow-[0_4px_16px_rgba(16,185,129,0.12)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-bold text-emerald-800">Valid certificate — verified</p>
                  <p className="text-sm text-emerald-700">
                    This credential was issued by BICE Academy and is publicly verifiable.
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 text-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                  <User className="h-4 w-4 shrink-0 text-[#dc2626]" />
                  <dt className="w-36 shrink-0 text-slate-500">Student</dt>
                  <dd className="font-semibold text-slate-900">{info.studentName}</dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <GraduationCap className="h-4 w-4 shrink-0 text-[#dc2626]" />
                  <dt className="w-36 shrink-0 text-slate-500">Course</dt>
                  <dd className="font-semibold text-slate-900">{info.courseTitle}</dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#dc2626]" />
                  <dt className="w-36 shrink-0 text-slate-500">Issued on</dt>
                  <dd className="font-semibold text-slate-900">
                    {new Date(info.issuedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-[#dc2626]" />
                  <dt className="w-36 shrink-0 text-slate-500">Instructor</dt>
                  <dd className="font-semibold text-slate-900">{info.instructorName ?? "BICE Academy"}</dd>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#dc2626]" />
                  <dt className="w-36 shrink-0 text-slate-500">Certificate ID</dt>
                  <dd className="font-mono font-semibold text-slate-900">{info.certificateId}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 flex-1 gap-2 bg-[#dc2626] hover:bg-[#b91c1c]">
                  <a
                    href={`/api/v1/certificates/${encodeURIComponent(info.certificateId)}/pdf`}
                    download
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-11 flex-1 border-slate-300">
                  <Link href="/verify-certificate">Verify another certificate</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-rose-200 shadow-[0_4px_16px_rgba(244,63,94,0.12)]">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-lg font-bold text-rose-800">Certificate not found</p>
                  <p className="text-sm text-rose-700">
                    No valid BICE certificate matches ID{" "}
                    <span className="font-mono font-semibold">{certificateId}</span>.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">What this means</p>
                <p>
                  The ID may contain a typo, or the credential was never issued by BICE Academy. BICE
                  certificates always follow the format{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                    BICE-YYYY-CCC-XXXXX
                  </code>{" "}
                  and can be verified here at any time. If you believe this is an error, contact{" "}
                  <span className="font-medium">support@bice.example</span> with a photo of the
                  certificate.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 flex-1 bg-[#dc2626] hover:bg-[#b91c1c]">
                  <Link href="/verify-certificate">Try another ID</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 flex-1 border-slate-300">
                  <Link href="/contact">Report a problem</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
