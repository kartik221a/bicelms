"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navIcon } from "@/components/lms/nav-icons";

export function MobileTabNav({ items }: { items: { href: string; label: string; icon: string }[] }) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = navIcon(item.icon);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
              active ? "text-[#dc2626]" : "text-slate-500"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
