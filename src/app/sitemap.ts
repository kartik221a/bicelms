import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { listPublishedCourses } from "@/services/course.service";

const STATIC_ROUTES = [
  "",
  "/courses",
  "/about",
  "/contact",
  "/faq",
  "/privacy-policy",
  "/terms",
  "/refund-policy",
  "/verify-certificate",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let courses: Awaited<ReturnType<typeof listPublishedCourses>>["items"] = [];
  try {
    const result = await listPublishedCourses({ sort: "popularity", page: 1, pageSize: 48 });
    courses = result.items;
  } catch {
    courses = [];
  }

  return [
    ...STATIC_ROUTES.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...courses.map((c) => ({
      url: `${site.url}/courses/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
