import type { AppRole } from "@/types/domain";

export function canAccessAdminArea(role: AppRole) {
  return role === "admin";
}

export function canAccessCoordinatorArea(role: AppRole) {
  return role === "admin";
}
