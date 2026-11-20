import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, BookOpen, StickyNote, FolderOpen, Award, ShoppingBag,
  User, Settings, GraduationCap, LogOut,
} from "lucide-react";
import { SetupBanner } from "@/components/shared/setup-banner";
import { getSession } from "@/services/auth/session";
import { StudentSidebarNav } from "@/components/lms/student-sidebar-nav";
import { MobileTabNav } from "@/components/lms/mobile-tab-nav";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-courses", label: "My Courses", icon: BookOpen },
  { href: "/my-notes", label: "My Notes", icon: StickyNote },
  { href: "/my-resources", label: "My Resources", icon: FolderOpen },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin" || session.role === "super_admin") {
    // Admins can still use the student area; no redirect needed.
  }

  return (
    <>
      <SetupBanner />
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-[#0f172a] lg:flex">
          <div className="flex h-16 items-center gap-2 px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4f46e5] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <Link href="/" className="font-bold text-white">
              {session.role === "admin" || session.role === "super_admin" ? "BICE LMS" : "BICE Academy"}
            </Link>
          </div>
          <StudentSidebarNav items={NAV} />
          <div className="mt-auto p-4">
            <form action="/api/v1/auth/logout" method="post">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-[#1e293b] hover:text-white"
              >
                <LogOut className="h-4 w-4" /> Log out
              </Link>
            </form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
            <div className="flex flex-1 items-center gap-3">
              <span className="truncate text-sm font-semibold text-slate-900">
                Welcome back, {session.name.split(" ")[0]}
              </span>
            </div>
            {(session.role === "admin" || session.role === "super_admin") ? (
              <Link href="/admin" className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Admin panel
              </Link>
            ) : null}
            <Link href="/profile" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]">
                {session.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.photoUrl} alt={session.name} className="h-8 w-8 object-cover" />
                ) : (
                  session.name.slice(0, 1).toUpperCase()
                )}
              </span>
            </Link>
          </header>
          <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 pb-20 lg:pb-8">{children}</main>
        </div>
      </div>
      <MobileTabNav items={NAV.slice(0, 4)} />
    </>
  );
}
