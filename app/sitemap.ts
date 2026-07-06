import type { MetadataRoute } from "next";

const routes = [
  "",
  "/tools",
  "/samples",
  "/getting-started",
  "/pricing",
  "/privacy",
  "/terms",
  "/tools/exam-generator",
  "/tools/worksheet-generator",
  "/tools/lesson-plan-generator",
  "/tools/student-comments",
  "/tools/image-to-latex",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/tools/") ? 0.65 : 0.75,
  }));
}
