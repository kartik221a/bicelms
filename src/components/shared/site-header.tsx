"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS, site } from "@/config/site";
import type { SessionUser } from "@/types";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 transition-all duration-300 ${
        scrolled ? "border-neutral-200 shadow-[0_2px_20px_rgba(0,0,0,0.06)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: -8, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm group-hover:shadow-red-600/30 group-hover:shadow-md"
          >
            <GraduationCap className="h-5 w-5" />
          </motion.span>
          <span className="text-lg font-bold tracking-tight text-black">
            {site.shortName.toUpperCase()} <span className="font-normal text-neutral-500">Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "text-red-600" : "text-neutral-600 hover:text-black"
                }`}
              >
                {l.label}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-red-600 transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
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
              <Button size="sm" variant="ghost" onClick={handleLogout} disabled={loggingOut} className="gap-1.5 text-neutral-600">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="bg-red-600 shadow-sm shadow-red-600/25 hover:bg-red-700">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-neutral-200 bg-white md:hidden"
          >
            <div className="px-4 pb-4 pt-2">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 flex gap-2">
                {user ? (
                  <>
                    <Button asChild size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
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
                    <Button asChild size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
