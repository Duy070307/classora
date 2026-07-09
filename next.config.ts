import type { NextConfig } from "next";

const hiddenRouteRedirects = [
  { source: "/samples", destination: "/tools" },
  { source: "/system-status", destination: "/dashboard" },
  { source: "/ai-lab", destination: "/dashboard" },
  { source: "/demo-checklist", destination: "/dashboard" },
  { source: "/demo-data", destination: "/dashboard" },
  { source: "/diagnostics", destination: "/dashboard" },
  { source: "/feedback", destination: "/dashboard" },
  { source: "/known-issues", destination: "/dashboard" },
  { source: "/release-candidate", destination: "/dashboard" },
  { source: "/private-beta", destination: "/dashboard" },
  { source: "/tester-guide", destination: "/getting-started" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return hiddenRouteRedirects.map((route) => ({
      ...route,
      permanent: false,
    }));
  },
};

export default nextConfig;
