import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SetupBanner } from "@/components/shared/setup-banner";
import { site } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetupBanner />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-[45%] flex-col justify-between bg-[#0f172a] p-10 lg:flex">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f46e5] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-white">{site.shortName.toUpperCase()} Academy</span>
          </Link>
          <div>
            <h2 className="text-3xl font-bold leading-tight text-white">{site.tagline}</h2>
            <p className="mt-4 max-w-md text-slate-400">
              Structured courses in Advanced Excel, Power Query, SQL and Python — with hands-on
              projects, personal dashboards and verified certificates.
            </p>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} {site.name}</p>
        </aside>
        <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">{children}</main>
      </div>
    </>
  );
}
