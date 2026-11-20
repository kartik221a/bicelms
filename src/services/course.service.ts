import { store, QueryOptions, WhereClause } from "@/repositories";
import { CourseQuery } from "@/validators";
import { errors } from "@/lib/api";
import { slugify } from "@/lib/slug";

export interface CourseDoc {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  thumbnailUrl?: string | null;
  promoVideoUrl?: string | null;
  categoryId?: string | null;
  instructorId?: string | null;
  level: string;
  status: string;
  price: number;
  originalPrice?: number | null;
  durationMinutes: number;
  tags: string;
  learningObjectives: string;
  prerequisites: string;
  targetAudience: string;
  skills: string;
  faqs: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ratingAvg: number;
  ratingCount: number;
  studentsCount: number;
  certificateEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionDoc {
  id: string;
  courseId: string;
  title: string;
  position: number;
}

export interface LessonDoc {
  id: string;
  sectionId: string;
  courseId: string;
  title: string;
  description?: string | null;
  videoStorageId?: string | null;
  durationSeconds: number;
  position: number;
  isFreePreview: boolean;
  status: string;
  completionRule: string;
}

export function parseJsonArray(v?: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function parseFaqs(v?: string | null): { q: string; a: string }[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function listPublishedCourses(query: CourseQuery) {
  const where: WhereClause[] = [["status", "==", "published"]];
  if (query.category) {
    const cat = await store.getByField<{ id: string }>("categories", "slug", query.category);
    where.push(["categoryId", "==", cat?.id ?? "__none__"]);
  }
  if (query.level) where.push(["level", "==", query.level]);
  if (query.minRating && query.minRating > 0) where.push(["ratingAvg", ">=", query.minRating]);
  if (query.maxPrice !== undefined) where.push(["price", "<=", Math.round(query.maxPrice * 100)]);

  const orderByMap: Record<CourseQuery["sort"], QueryOptions["orderBy"]> = {
    popularity: [{ field: "studentsCount", direction: "desc" }],
    newest: [{ field: "createdAt", direction: "desc" }],
    price_asc: [{ field: "price", direction: "asc" }],
    price_desc: [{ field: "price", direction: "desc" }],
    rating: [{ field: "ratingAvg", direction: "desc" }],
  };

  let courses = await store.list<CourseDoc>("courses", {
    where,
    orderBy: orderByMap[query.sort],
    limit: 500,
  });

  // Text search across title / description / tags (post-filter, provider-agnostic)
  if (query.q) {
    const q = query.q.toLowerCase();
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle ?? "").toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        parseJsonArray(c.tags).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (query.maxDurationHours !== undefined) {
    courses = courses.filter((c) => c.durationMinutes <= query.maxDurationHours! * 60);
  }

  const total = courses.length;
  const start = (query.page - 1) * query.pageSize;
  const items = courses.slice(start, start + query.pageSize);
  return { items, total, page: query.page, pageSize: query.pageSize, pages: Math.max(1, Math.ceil(total / query.pageSize)) };
}

export async function getCourseBySlug(slug: string) {
  const course = await store.getByField<CourseDoc>("courses", "slug", slug);
  if (!course) throw errors.notFound("Course not found");
  return course;
}

export async function getCourseById(id: string) {
  const course = await store.get<CourseDoc>("courses", id);
  if (!course) throw errors.notFound("Course not found");
  return course;
}

export interface Curriculum {
  sections: (SectionDoc & { lessons: LessonDoc[] })[];
  totals: { sections: number; lessons: number; durationSeconds: number; publishedLessons: number };
}

export async function getCurriculum(courseId: string, onlyPublished = true): Promise<Curriculum> {
  const [sections, lessons] = await Promise.all([
    store.list<SectionDoc>("sections", { where: [["courseId", "==", courseId]], orderBy: [{ field: "position" }] }),
    store.list<LessonDoc>("lessons", {
      where: [["courseId", "==", courseId]],
      orderBy: [{ field: "position" }],
    }),
  ]);
  const visible = onlyPublished ? lessons.filter((l) => l.status === "published") : lessons;
  const grouped = sections.map((s) => ({
    ...s,
    lessons: visible
      .filter((l) => l.sectionId === s.id)
      .sort((a, b) => a.position - b.position),
  }));
  // Lessons in sections that no longer exist (defensive)
  const sectionIds = new Set(sections.map((s) => s.id));
  const orphans = visible.filter((l) => !sectionIds.has(l.sectionId));
  if (orphans.length) {
    grouped.push({
      id: "__orphan__",
      courseId,
      title: "Uncategorized lessons",
      position: 999,
      lessons: orphans.sort((a, b) => a.position - b.position),
    });
  }
  return {
    sections: grouped,
    totals: {
      sections: sections.length,
      lessons: visible.length,
      durationSeconds: visible.reduce((acc, l) => acc + (l.durationSeconds || 0), 0),
      publishedLessons: visible.length,
    },
  };
}

export async function refreshCourseAggregate(courseId: string) {
  const course = await store.get<CourseDoc>("courses", courseId);
  if (!course) return;
  const lessons = await store.list<LessonDoc>("lessons", { where: [["courseId", "==", courseId]] });
  const published = lessons.filter((l) => l.status === "published");
  const durationMinutes = Math.round(published.reduce((acc, l) => acc + (l.durationSeconds || 0), 0) / 60);
  await store.update("courses", courseId, { durationMinutes });
}

export async function uniqueSlug(title: string, currentId?: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 2;
  for (;;) {
    const existing = await store.getByField<CourseDoc>("courses", "slug", slug);
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${i++}`;
  }
}
