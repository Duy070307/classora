import type { MetadataRoute } from "next";

const routes = ["", "/dashboard", "/tools", "/samples", "/getting-started", "/pricing", "/privacy", "/terms", "/changelog", "/share", "/known-issues"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
