import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BadgeCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = { title: "Verify a Certificate" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.certificateId) ? sp.certificateId[0] : sp.certificateId;
  const id = raw?.trim();
  if (id) {
    redirect(`/verify-certificate/${encodeURIComponent(id)}`);
  }

  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#dc2626]">Credential check</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Verify a BICE certificate
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Every BICE certificate carries a unique ID of the form{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-700 shadow-sm">
              BICE-YYYY-CCC-XXXXX
            </code>
            . Enter it below to confirm the student name, course, issue date and instructor.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <form
          method="get"
          action="/verify-certificate"
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="certificateId" className="mb-1.5 block text-sm font-semibold text-slate-900">
              Certificate ID
            </label>
            <Input
              id="certificateId"
              name="certificateId"
              required
              placeholder="e.g. BICE-2025-ADV-X7K2M"
              className="h-11 font-mono"
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="h-11 gap-2 bg-[#dc2626] px-6 hover:bg-[#b91c1c]">
            <Search className="h-4 w-4" /> Verify
          </Button>
        </form>

        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[#dc2626]/30 bg-[#fef2f2]/50 p-5 text-sm text-slate-600">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <BadgeCheck className="h-4 w-4 text-[#dc2626]" /> Why verification matters
          </span>
          <p>
            Certificates are issued automatically only when every published lesson of a course is
            completed, and each carries a public verification record. Recruiters and employers can
            confirm a credential here in seconds — no login required. The verified record always shows
            the student name, course title, issue date and instructor, and offers a downloadable PDF.
          </p>
        </div>
      </section>
    </div>
  );
}
