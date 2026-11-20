"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreVertical, ShieldBan, ShieldCheck, UserRoundSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudentRowActions({
  userId,
  name,
  status,
  setStatus,
}: {
  userId: string;
  name: string;
  status: string;
  setStatus: (status: "active" | "suspended") => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  const active = status === "active";

  function changeStatus(next: "active" | "suspended") {
    startTransition(async () => {
      try {
        await setStatus(next);
        toast.success(next === "active" ? `${name} re-activated` : `${name} suspended`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update student");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs text-[#4f46e5] hover:bg-[#eef2ff]">
        <Link href={`/admin/students?student=${userId}`}>
          <UserRoundSearch className="h-3.5 w-3.5" /> Detail
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${name}`}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs text-slate-500">Account</DropdownMenuLabel>
          {active ? (
            <DropdownMenuItem onSelect={() => changeStatus("suspended")} disabled={pending} className="cursor-pointer">
              <ShieldBan className="h-4 w-4" /> Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => changeStatus("active")} disabled={pending} className="cursor-pointer">
              <ShieldCheck className="h-4 w-4" /> Activate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/admin/students?student=${userId}`}>Open detail</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
