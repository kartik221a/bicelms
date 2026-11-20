"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, site } from "@/config/site";
import type { SessionUser } from "@/types";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a] text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            {site.shortName.toUpperCase()} <span className="font-normal text-slate-500">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard" className="gap-1.5">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              {user.role === "admin" || user.role === "super_admin" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={handleLogout} disabled={loggingOut} className="gap-1.5 text-slate-600">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#4f46e5] hover:bg-[#4338ca]">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex gap-2">
            {user ? (
              <>
                <Button asChild size="sm" className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca]">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-[#4f46e5] hover:bg-[#4338ca]">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
