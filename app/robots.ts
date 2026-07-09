import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/tools",
        "/getting-started",
        "/pricing",
        "/privacy",
        "/terms",
      ],
      disallow: [
        "/release-candidate",
        "/private-beta",
        "/tester-guide",
        "/diagnostics",
        "/demo-checklist",
        "/demo-data",
        "/feedback",
        "/ai-lab",
        "/samples",
        "/system-status",
        "/known-issues",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
