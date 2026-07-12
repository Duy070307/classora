export type MaintenanceRole = "admin" | "teacher";

const protectedPagePrefixes = [
  "/admin",
  "/create",
  "/dashboard",
  "/data",
  "/drafts",
  "/history",
  "/print",
  "/question-bank",
  "/settings",
  "/templates",
  "/teacher-testing-guide",
  "/tikz-bank",
  "/tools",
];

const blockedApiPrefixes = [
  "/api/ai",
  "/api/question-bank/ai-import",
  "/api/tikz-bank",
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
export function isMaintenanceProtectedPage(pathname: string) {
  return protectedPagePrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isMaintenanceBlockedApi(pathname: string) {
  return blockedApiPrefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function maintenanceAccessDecision(input: {
  pathname: string;
  enabled: boolean;
  authenticated: boolean;
  role?: MaintenanceRole;
}) {
  if (!input.enabled || !input.authenticated || input.role === "admin" || input.pathname === "/maintenance") return "allow" as const;
  if (isMaintenanceBlockedApi(input.pathname)) return "block_api" as const;
  if (isMaintenanceProtectedPage(input.pathname)) return "redirect" as const;
  return "allow" as const;
}
