import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Tags, ListVideo, Users, GraduationCap, ShoppingBag,
  CreditCard, TicketPercent, MessageSquareText, FolderOpen, Megaphone, BarChart3,
  Settings, ChevronLeft,
} from "lucide-react";
import { SetupBanner } from "@/components/shared/setup-banner";
import { getSession } from "@/services/auth/session";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

// Icons are pre-rendered elements (serializable across the server → client
// boundary) instead of component references.
const NAV_SECTIONS: {
  title: string;
  items: { href: string; label: string; icon: React.ReactNode }[];
}[] = [
  {
    title: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> }],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/courses", label: "Courses", icon: <BookOpen className="h-4 w-4" /> },
      { href: "/admin/categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { href: "/admin/lessons", label: "Lessons", icon: <ListVideo className="h-4 w-4" /> },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/students", label: "Students", icon: <Users className="h-4 w-4" /> },
      { href: "/admin/instructors", label: "Instructors", icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
      { href: "/admin/payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { href: "/admin/coupons", label: "Coupons", icon: <TicketPercent className="h-4 w-4" /> },
    ],
  },
  {
    title: "Engagement",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: <MessageSquareText className="h-4 w-4" /> },
      { href: "/admin/resources", label: "Resources", icon: <FolderOpen className="h-4 w-4" /> },
      { href: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    title: "Insights",
    items: [{ href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> }],
  },
  {
    title: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> }],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/dashboard");
  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/dashboard?error=forbidden");
  }

  return (
    <>
      <SetupBanner />
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col overflow-y-auto bg-[#0a0a0a] scrollbar-thin lg:flex">
          <div className="flex h-16 items-center justify-between px-5">
            <span className="font-bold tracking-tight text-white">
              BICE <span className="font-normal text-slate-400">Admin</span>
            </span>
          </div>
          <AdminSidebarNav sections={NAV_SECTIONS} />
          <div className="mt-auto border-t border-white/10 p-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" /> Back to site
            </Link>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
          <main className="flex-1 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </>
  );
}
