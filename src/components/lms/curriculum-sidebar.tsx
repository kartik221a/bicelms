"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, ChevronDown, ChevronRight, Circle,
  Lock, PlayCircle, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/money";

export interface SidebarLesson {
  id: string;
  title: string;
  durationSeconds: number;
  completed: boolean;
  isFreePreview: boolean;
}

export interface SidebarSection {
  id: string;
  title: string;
  lessons: SidebarLesson[];
}

/**
 * Left curriculum rail for the learning interface (desktop column + mobile
 * Sheet content). Search filters lessons; sections collapse independently.
 */
export function CurriculumSidebar({
  courseTitle,
  instructorName,
  courseSlug,
  sections,
  currentLessonId,
  percent,
  completedCount,
  totalCount,
  enrolled,
}: {
  courseTitle: string;
  instructorName?: string | null;
  courseSlug: string;
  sections: SidebarSection[];
  currentLessonId: string;
  percent: number;
  completedCount: number;
  totalCount: number;
  enrolled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        lessons: s.lessons.filter((l) => l.title.toLowerCase().includes(q)),
      }))
      .filter((s) => s.lessons.length > 0 || s.title.toLowerCase().includes(q));
  }, [sections, query]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-100 p-4">
        <Link
          href={`/courses/${courseSlug}`}
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>
        <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900">{courseTitle}</h2>
        {instructorName ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full bg-[#4f46e5]" />
            By {instructorName}
          </p>
        ) : null}
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
            <span className="text-slate-900">Course progress</span>
            <span className="font-bold text-[#4f46e5]">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2 bg-slate-200" />
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#4f46e5]" />
            {completedCount} of {totalCount} lessons completed
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons..."
            className="h-8 rounded-lg border-slate-200 bg-slate-50 pl-8 text-xs focus-visible:bg-white"
            aria-label="Search lessons"
          />
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-2 pb-6" aria-label="Course curriculum">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-500">No lessons match “{query}”.</p>
        ) : null}
        {filtered.map((section, idx) => {
          const done = section.lessons.filter((l) => l.completed).length;
          const isCollapsed = collapsed[section.id] ?? false;
          return (
            <div key={section.id} className="overflow-hidden rounded-lg">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !isCollapsed }))}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                aria-expanded={!isCollapsed}
              >
                <div className="min-w-0 pr-2">
                  <span className="block truncate text-[13px] font-semibold text-slate-900">
                    {section.id === "__orphan__" ? "More lessons" : `${idx + 1}. ${section.title}`}
                  </span>
                  <span className="text-xs text-slate-500">
                    {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"} •{" "}
                    {formatHoursLabel(section.lessons.reduce((acc, l) => acc + l.durationSeconds, 0))}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {section.lessons.length ? (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] font-medium",
                        done === section.lessons.length
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {done}/{section.lessons.length} done
                    </span>
                  ) : null}
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {!isCollapsed ? (
                <div className="mt-0.5 space-y-0.5 pb-1">
                  {section.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const locked = !enrolled && !lesson.isFreePreview;
                    const icon = locked ? (
                      <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : lesson.completed ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-[18px] w-[18px] shrink-0 text-[#4f46e5]" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-slate-300" />
                    );
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${courseSlug}/${lesson.id}`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cn(
                          "group flex items-center justify-between gap-2 rounded-md px-2.5 py-2 transition-colors",
                          isCurrent
                            ? "bg-[#eef2ff] shadow-[inset_3px_0_0_0_#4f46e5]"
                            : "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2 pr-2">
                          {icon}
                          <span
                            className={cn(
                              "truncate text-xs",
                              isCurrent ? "font-bold text-[#3730a3]" : "text-slate-700 group-hover:text-[#4f46e5]"
                            )}
                          >
                            {lesson.title}
                          </span>
                          {lesson.isFreePreview && !enrolled ? (
                            <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              Free
                            </span>
                          ) : null}
                        </div>
                        <span className={cn("shrink-0 text-[11px]", isCurrent ? "font-semibold text-[#4f46e5]" : "text-slate-400")}>
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function formatHoursLabel(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}
