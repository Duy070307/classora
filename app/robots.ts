import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/tools",
        "/getting-started",
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
