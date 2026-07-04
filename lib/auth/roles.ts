export type UserRole = "admin" | "teacher";

export function normalizeRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "teacher";
}

export function isAdminRole(value: unknown) {
  return normalizeRole(value) === "admin";
}
