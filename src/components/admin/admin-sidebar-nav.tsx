"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function AdminSidebarNav({
  sections,
}: {
  sections: { title: string; items: { href: string; label: string; icon: LucideIcon }[] }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-4 px-3 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {section.title}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-[#4f46e5] text-white" : "text-slate-300 hover:bg-[#1e293b] hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
