import type { Role } from "@prisma/client";

type AccessResolutionParams = {
  pathname: string;
  hasSession: boolean;
  role?: Role;
};

export function resolveAccess({ pathname, hasSession, role }: AccessResolutionParams) {
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isSuperAdmin = role === "SUPER_ADMIN";

  if ((isDashboardRoute || isSuperAdminRoute) && !hasSession) {
    return "login";
  }

  if (isDashboardRoute && isSuperAdmin) {
    return "super-admin";
  }

  if (isSuperAdminRoute && hasSession && !isSuperAdmin) {
    return "dashboard";
  }

  if (isAuthRoute && hasSession) {
    return isSuperAdmin ? "super-admin" : "dashboard";
  }

  return "allow";
}
