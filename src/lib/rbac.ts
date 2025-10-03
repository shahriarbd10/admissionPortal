// src/lib/rbac.ts

export type Role = "APPLICANT" | "MODERATOR" | "ADMIN";

/** Any staff (non-student) role */
export const StaffRoles: Role[] = ["MODERATOR", "ADMIN"];

/** Convenience groups */
export const AdminOnly: Role[] = ["ADMIN"];
export const AdminOrModerator: Role[] = ["ADMIN", "MODERATOR"];

/** Check if a user has one of the desired roles */
export function hasRole(role: Role | undefined, desired: Role | Role[]) {
  if (!role) return false;
  const arr = Array.isArray(desired) ? desired : [desired];
  return arr.includes(role);
}

/** Type guard + boolean for staff */
export function isStaff(role: Role | undefined): role is "MODERATOR" | "ADMIN" {
  return !!role && StaffRoles.includes(role);
}

/** Throwing guards for API routes (use try/catch or return 403) */
export function requireRole(role: Role | undefined, desired: Role | Role[]) {
  if (!hasRole(role, desired)) {
    const want = Array.isArray(desired) ? desired.join(" or ") : desired;
    throw new Error(`Forbidden: requires ${want}`);
  }
}

export function requireStaff(role: Role | undefined) {
  requireRole(role, StaffRoles);
}

export function requireAdminOrModerator(role: Role | undefined) {
  requireRole(role, AdminOrModerator);
}

export function requireAdmin(role: Role | undefined) {
  requireRole(role, AdminOnly);
}

/** Helper for branching UI/server logic */
export const roleUtils = {
  isApplicant: (r?: Role) => r === "APPLICANT",
  isModerator: (r?: Role) => r === "MODERATOR",
  isAdmin:     (r?: Role) => r === "ADMIN",
};
