import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/shared/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SortSelect } from "@/components/public/sort-select";
import { courseQuerySchema, type CourseQuery } from "@/validators";
import { listPublishedCourses } from "@/services/course.service";
import { store } from "@/repositories";

export const metadata: Metadata = { title: "All Courses" };

type SearchParams = Record<string, string | string[] | undefined>;

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const RATING_OPTIONS = ["4.5", "4", "3.5"] as const;
const PRICE_OPTIONS = [
  { value: "2000", label: "Under ₹2,000" },
  { value: "5000", label: "Under ₹5,000" },
  { value: "10000", label: "Under ₹10,000" },
] as const;
const DURATION_OPTIONS = [
  { value: "5", label: "Under 5 hrs" },
  { value: "15", label: "Under 15 hrs" },
  { value: "30", label: "Under 30 hrs" },
] as const;

function firstParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  const raw = Array.isArray(v) ? v[0] : v;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function buildPageUrl(query: CourseQuery, page: number): string {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.category) p.set("category", query.category);
  if (query.level) p.set("level", query.level);
  if (query.minRating !== undefined) p.set("minRating", String(query.minRating));
  if (query.maxPrice !== undefined) p.set("maxPrice", String(query.maxPrice));
  if (query.maxDurationHours !== undefined) p.set("maxDurationHours", String(query.maxDurationHours));
  p.set("sort", query.sort);
  if (page > 1) p.set("page", String(page));
  const qs = p.toString();
  return qs ? `/courses?${qs}` : "/courses";
}

function pageWindow(current: number, total: number): number[] {
  const window = 2;
  const out: number[] = [];
  for (let i = Math.max(1, current - window); i <= Math.min(total, current + window); i++) out.push(i);
  return out;
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  let query: CourseQuery;
  try {
    query = courseQuerySchema.parse({
      q: firstParam(sp, "q"),
      category: firstParam(sp, "category"),
      level: firstParam(sp, "level"),
      minRating: firstParam(sp, "minRating"),
      maxPrice: firstParam(sp, "maxPrice"),
      maxDurationHours: firstParam(sp, "maxDurationHours"),
      sort: firstParam(sp, "sort"),
      page: firstParam(sp, "page"),
    });
  } catch {
    query = courseQuerySchema.parse({});
  }

  const [result, categories, all] = await Promise.all([
    listPublishedCourses(query),
    store.list<CategoryInfo>("categories", { orderBy: [{ field: "position" }] }),
    listPublishedCourses({ sort: "popularity", page: 1, pageSize: 48 }),
  ]);

  const courses = all.items;
  const countByCategory = courses.reduce<Record<string, number>>((acc, c) => {
    if (c.categoryId) acc[c.categoryId] = (acc[c.categoryId] ?? 0) + 1;
    return acc;
  }, {});
  const countByLevel = courses.reduce<Record<string, number>>((acc, c) => {
    acc[c.level] = (acc[c.level] ?? 0) + 1;
    return acc;
  }, {});
  const matches = (fn: (c: (typeof courses)[number]) => boolean) => courses.filter(fn).length;

  const categoryCounts = new Map(categories.map((c) => [c.id, countByCategory[c.id] ?? 0]));
  const activeCategory = query.category
    ? categories.find((c) => c.slug === query.category)
    : undefined;

  const sortParams: Record<string, string | undefined> = {
    q: query.q,
    category: query.category,
    level: query.level,
    minRating: query.minRating !== undefined ? String(query.minRating) : undefined,
    maxPrice: query.maxPrice !== undefined ? String(query.maxPrice) : undefined,
    maxDurationHours: query.maxDurationHours !== undefined ? String(query.maxDurationHours) : undefined,
  };

  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

  return (
    <div className="flex w-full flex-col">
      {/* Header band */}
      <div className="w-full bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-[#4f46e5]">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900">Courses</span>
          </nav>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">All Courses</h1>
                <Badge className="bg-[#eef2ff] text-[#4f46e5] hover:bg-[#eef2ff]">{result.total} available</Badge>
              </div>
              <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
                Master corporate-grade Excel, Power Query ETL, SQL pipelines, Python analytics and BI
                reporting with BICE&apos;s hands-on, certificate-backed programs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Link
              href={buildPageUrl({ ...query, category: undefined, page: 1 }, 1)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                query.category
                  ? "bg-white text-slate-600 hover:bg-slate-100"
                  : "bg-slate-900 text-white"
              }`}
            >
              All Disciplines
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildPageUrl({ ...query, category: c.slug, page: 1 }, 1)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
                  query.category === c.slug
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row">
          {/* ---------------- SIDEBAR FILTERS (GET form) ---------------- */}
          <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-72">
            <form
              method="get"
              action="/courses"
              className="flex flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
              aria-label="Course filters"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-[#4f46e5]" /> Filters
                </span>
                <Link href="/courses" className="text-xs font-medium text-[#4f46e5] hover:underline">
                  Clear all
                </Link>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="filter-q" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quick search
                </label>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="filter-q"
                    name="q"
                    defaultValue={query.q ?? ""}
                    placeholder="Search courses, skills…"
                    className="pl-9"
                  />
                </div>
              </div>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-1 text-sm font-bold text-slate-900">Category</legend>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      className="h-4 w-4 accent-[#4f46e5]"
                      defaultChecked={!query.category}
                    />
                    All categories
                  </span>
                  <span className="text-xs text-slate-400">{courses.length}</span>
                </label>
                {categories.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-slate-600">
                      <input
                        type="radio"
                        name="category"
                        value={c.slug}
                        className="h-4 w-4 accent-[#4f46e5]"
                        defaultChecked={query.category === c.slug}
                      />
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-400">{categoryCounts.get(c.id) ?? 0}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-1 text-sm font-bold text-slate-900">Skill level</legend>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <input
                      type="radio"
                      name="level"
                      value=""
                      className="h-4 w-4 accent-[#4f46e5]"
                      defaultChecked={!query.level}
                    />
                    Any level
                  </span>
                  <span className="text-xs text-slate-400">{courses.length}</span>
                </label>
                {LEVEL_OPTIONS.map((l) => (
                  <label key={l.value} className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-slate-600">
                      <input
                        type="radio"
                        name="level"
                        value={l.value}
                        className="h-4 w-4 accent-[#4f46e5]"
                        defaultChecked={query.level === l.value}
                      />
                      {l.label}
                    </span>
                    <span className="text-xs text-slate-400">{countByLevel[l.value] ?? 0}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-1 text-sm font-bold text-slate-900">Rating</legend>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <input
                      type="radio"
                      name="minRating"
                      value=""
                      className="h-4 w-4 accent-[#4f46e5]"
                      defaultChecked={query.minRating === undefined}
                    />
                    Any rating
                  </span>
                </label>
                {RATING_OPTIONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <input
                        type="radio"
                        name="minRating"
                        value={r}
                        className="h-4 w-4 accent-[#4f46e5]"
                        defaultChecked={query.minRating === Number(r)}
                      />
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r} &amp; up
                      </span>
                    </span>
                    <span className="text-xs text-slate-400">{matches((c) => c.ratingAvg >= Number(r))}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-1 text-sm font-bold text-slate-900">Price</legend>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <input
                      type="radio"
                      name="maxPrice"
                      value=""
                      className="h-4 w-4 accent-[#4f46e5]"
                      defaultChecked={query.maxPrice === undefined}
                    />
                    Any price
                  </span>
                </label>
                {PRICE_OPTIONS.map((p) => (
                  <label key={p.value} className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-slate-600">
                      <input
                        type="radio"
                        name="maxPrice"
                        value={p.value}
                        className="h-4 w-4 accent-[#4f46e5]"
                        defaultChecked={query.maxPrice === Number(p.value)}
                      />
                      {p.label}
                    </span>
                    <span className="text-xs text-slate-400">{matches((c) => c.price <= Number(p.value) * 100)}</span>
                  </label>
                ))}
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="pb-1 text-sm font-bold text-slate-900">Duration</legend>
                <label className="flex cursor-pointer items-center justify-between text-sm">
                  <span className="flex items-center gap-2.5 text-slate-600">
                    <input
                      type="radio"
                      name="maxDurationHours"
                      value=""
                      className="h-4 w-4 accent-[#4f46e5]"
                      defaultChecked={query.maxDurationHours === undefined}
                    />
                    Any duration
                  </span>
                </label>
                {DURATION_OPTIONS.map((d) => (
                  <label key={d.value} className="flex cursor-pointer items-center justify-between text-sm">
                    <span className="flex items-center gap-2.5 text-slate-600">
                      <input
                        type="radio"
                        name="maxDurationHours"
                        value={d.value}
                        className="h-4 w-4 accent-[#4f46e5]"
                        defaultChecked={query.maxDurationHours === Number(d.value)}
                      />
                      {d.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {matches((c) => c.durationMinutes <= Number(d.value) * 60)}
                    </span>
                  </label>
                ))}
              </fieldset>

              <Button type="submit" className="mt-1 bg-[#4f46e5] hover:bg-[#4338ca]">
                Apply filters
              </Button>
            </form>
          </aside>

          {/* ---------------- RESULTS ---------------- */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-slate-600" aria-live="polite">
                {result.total > 0 ? (
                  <>
                    Showing <span className="font-semibold text-slate-900">{from}</span>–
                    <span className="font-semibold text-slate-900">{to}</span> of{" "}
                    <span className="font-semibold text-slate-900">{result.total}</span> courses
                    {activeCategory ? (
                      <>
                        {" "}
                        in <span className="font-semibold text-slate-900">{activeCategory.name}</span>
                      </>
                    ) : null}
                    {query.q ? (
                      <>
                        {" "}
                        for <span className="font-semibold text-slate-900">“{query.q}”</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  "No courses match the current filters"
                )}
              </p>
              <SortSelect value={query.sort} params={sortParams} />
            </div>

            {result.items.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title="No courses found"
                description="Try widening your filters — clear the search term, pick a different category or raise the price cap."
                action={
                  <Button asChild className="bg-[#4f46e5] hover:bg-[#4338ca]">
                    <Link href="/courses">Clear all filters</Link>
                  </Button>
                }
              />
            )}

            {result.pages > 1 ? (
              <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-4">
                {result.page > 1 ? (
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href={buildPageUrl(query, result.page - 1)}>
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Link>
                  </Button>
                ) : null}
                {pageWindow(result.page, result.pages).map((n) => (
                  <Button
                    key={n}
                    asChild
                    variant={n === result.page ? "default" : "outline"}
                    size="sm"
                    className={n === result.page ? "bg-[#4f46e5] hover:bg-[#4338ca]" : ""}
                  >
                    <Link href={buildPageUrl(query, n)}>{n}</Link>
                  </Button>
                ))}
                {result.page < result.pages ? (
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href={buildPageUrl(query, result.page + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
