type AccessResolutionParams = {
  pathname: string;
  hasSession: boolean;
};

export function resolveAccess({ pathname, hasSession }: AccessResolutionParams) {
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !hasSession) {
    return "login";
  }

  if (isAuthRoute && hasSession) {
    return "dashboard";
  }

  return "allow";
}
