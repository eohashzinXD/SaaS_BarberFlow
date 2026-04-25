import { resolveAccess } from "@/server/auth/access";

describe("access control resolution", () => {
  it("redirects unauthenticated users away from protected dashboards", () => {
    expect(resolveAccess({ pathname: "/dashboard", hasSession: false })).toBe("login");
    expect(resolveAccess({ pathname: "/super-admin", hasSession: false })).toBe("login");
  });

  it("keeps super admins isolated from tenant dashboards", () => {
    expect(
      resolveAccess({
        pathname: "/dashboard",
        hasSession: true,
        role: "SUPER_ADMIN"
      })
    ).toBe("super-admin");
  });

  it("keeps tenant users away from the super admin area", () => {
    expect(
      resolveAccess({
        pathname: "/super-admin/users",
        hasSession: true,
        role: "ADMIN"
      })
    ).toBe("dashboard");
  });
});
