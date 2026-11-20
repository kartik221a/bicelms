import { formatHours } from "@/lib/money";
import { RatingStars } from "./rating-stars";
import { LevelBadge } from "./level-badge";
import { PriceTag } from "./price-tag";
import { Clock, Users, PlayCircle } from "lucide-react";
import Link from "next/link";
import { parseJsonArray } from "@/services/course.service";
import type { CourseDoc } from "@/services/course.service";

export function CourseCard({ course, href }: { course: CourseDoc; href?: string }) {
  const tags = parseJsonArray(course.tags).slice(0, 3);
  return (
    <Link
      href={href ?? `/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 text-3xl font-bold text-indigo-300">
            {course.title.slice(0, 1)}
          </div>
        )}
        <div className="absolute right-2 top-2">
          <LevelBadge level={course.level} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-[#4f46e5]">
          {course.title}
        </h3>
        <p className="line-clamp-2 text-sm text-slate-500">{course.subtitle ?? parseJsonArray(course.learningObjectives)[0]}</p>
        <RatingStars rating={course.ratingAvg} count={course.ratingCount} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatHours(course.durationMinutes)}</span>
          <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> lessons</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.studentsCount.toLocaleString("en-IN")}</span>
        </div>
        {tags.length ? (
          <div className="flex gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-2">
          <PriceTag price={course.price} originalPrice={course.originalPrice} />
        </div>
      </div>
    </Link>
  );
}
