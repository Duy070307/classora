import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/tools",
        "/samples",
        "/getting-started",
        "/pricing",
        "/privacy",
        "/terms",
        "/system-status",
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
        "/known-issues",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
