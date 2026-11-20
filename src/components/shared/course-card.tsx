import { formatHours } from "@/lib/money";
import { RatingStars } from "./rating-stars";
import { LevelBadge } from "./level-badge";
import { PriceTag } from "./price-tag";
import { Clock, Users, PlayCircle } from "lucide-react";
import Link from "next/link";
import { parseJsonArray } from "@/services/course.service";
import type { CourseDoc } from "@/services/course.service";
import { SpotlightCard, HoverLift } from "@/components/motion";

export function CourseCard({ course, href }: { course: CourseDoc; href?: string }) {
  const tags = parseJsonArray(course.tags).slice(0, 3);
  return (
    <HoverLift amount={5}>
      <SpotlightCard className="h-full rounded-xl border border-neutral-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors duration-300 hover:border-red-300 hover:shadow-[0_12px_32px_rgba(220,38,38,0.10)]">
        <Link
          href={href ?? `/courses/${course.slug}`}
          className="group flex h-full flex-col"
        >
          <div className="relative aspect-video overflow-hidden bg-neutral-100">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-red-50 to-neutral-100 text-3xl font-bold text-red-300">
                {course.title.slice(0, 1)}
              </div>
            )}
            {/* red wash on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-red-600/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute right-2 top-2">
              <LevelBadge level={course.level} />
            </div>
            {/* animated bottom accent bar */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-red-600 transition-transform duration-300 group-hover:scale-x-100" />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-4">
            <h3 className="line-clamp-2 font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-red-600">
              {course.title}
            </h3>
            <p className="line-clamp-2 text-sm text-neutral-500">{course.subtitle ?? parseJsonArray(course.learningObjectives)[0]}</p>
            <RatingStars rating={course.ratingAvg} count={course.ratingCount} />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatHours(course.durationMinutes)}</span>
              <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> lessons</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.studentsCount.toLocaleString("en-IN")}</span>
            </div>
            {tags.length ? (
              <div className="flex gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 transition-colors group-hover:bg-red-50 group-hover:text-red-700">
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
      </SpotlightCard>
    </HoverLift>
  );
}
