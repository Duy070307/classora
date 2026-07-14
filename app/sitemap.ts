import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

const routes = [
  "",
  "/dang-ky-dung-thu",
  "/tools",
  "/getting-started",
  "/privacy",
  "/terms",
  "/tools/exam-generator",
  "/tools/exam-audit",
  "/tools/worksheet-generator",
  "/tools/lesson-plan-generator",
  "/tools/student-comments",
  "/tools/image-to-latex",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/tools/") ? 0.65 : 0.75,
  }));
}
