import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SetupBanner } from "@/components/shared/setup-banner";
import { site } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SetupBanner />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#0a0a0a] p-10 lg:flex">
          {/* atmospheric texture */}
          <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-60" />
          <div
            aria-hidden
            className="animate-glow-drift pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(220,38,38,0.30), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="animate-glow-drift pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(153,27,27,0.25), transparent 70%)", animationDelay: "-6s" }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-600 to-transparent" />
          <Link href="/" className="group relative flex w-fit items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold text-white">{site.shortName.toUpperCase()} Academy</span>
          </Link>
          <div className="relative">
            <h2 className="text-3xl font-bold leading-tight text-white">
              <span className="gradient-text-red">{site.tagline}</span>
            </h2>
            <p className="mt-4 max-w-md text-neutral-400">
              Structured courses in Advanced Excel, Power Query, SQL and Python — with hands-on
              projects, personal dashboards and verified certificates.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["Lifetime access", "Verified certificates", "Real datasets"].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <p className="relative text-sm text-neutral-500">© {new Date().getFullYear()} {site.name}</p>
        </aside>
        <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-12">{children}</main>
      </div>
    </>
  );
}
