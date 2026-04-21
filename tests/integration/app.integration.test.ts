import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { registerTenantAccount } from "@/server/accounts";
import { resolveAccess } from "@/server/auth/access";
import { listBarbersByTenant } from "@/server/barbers";

async function resetDatabase() {
  await prisma.appointment.deleteMany();
  await prisma.businessHour.deleteMany();
  await prisma.service.deleteMany();
  await prisma.barber.deleteMany();
  await prisma.pendingSignup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.barbershopProfile.deleteMany();
  await prisma.tenant.deleteMany();
}

describe("integration flows", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("enforces tenant isolation when listing barbers", async () => {
    const tenantA = await prisma.tenant.create({
      data: { name: "Tenant A", slug: "tenant-a" }
    });
    const tenantB = await prisma.tenant.create({
      data: { name: "Tenant B", slug: "tenant-b" }
    });

    await prisma.barber.createMany({
      data: [
        { name: "Barber A", tenantId: tenantA.id },
        { name: "Barber B", tenantId: tenantB.id }
      ]
    });

    const barbers = await listBarbersByTenant(tenantA.id);

    expect(barbers).toHaveLength(1);
    expect(barbers[0]?.name).toBe("Barber A");
    expect(barbers[0]?.tenantId).toBe(tenantA.id);
  });

  it("registers a tenant, admin user and profile together", async () => {
    const result = await registerTenantAccount({
      ownerName: "Ana Admin",
      email: "ana@example.com",
      password: "supersegura123",
      barbershopName: "Barbearia Ana",
      slug: "barbearia-ana"
    });

    expect(result.tenant.slug).toBe("barbearia-ana");
    expect(result.user.role).toBe(Role.ADMIN);
    expect(result.user.tenantId).toBe(result.tenant.id);
    expect(result.profile.tenantId).toBe(result.tenant.id);
  });

  it("protects dashboard routes and redirects authenticated users away from auth pages", () => {
    expect(resolveAccess({ pathname: "/dashboard", hasSession: false })).toBe("login");
    expect(resolveAccess({ pathname: "/dashboard/services", hasSession: true })).toBe("allow");
    expect(resolveAccess({ pathname: "/login", hasSession: true })).toBe("dashboard");
  });
});
