import { BillingStatus, PendingSignupStatus, Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { registerTenantAccount } from "@/server/accounts";
import { resolveAccess } from "@/server/auth/access";
import { listBarbersByTenant } from "@/server/barbers";
import {
  markPendingSignupCheckoutPaid,
  provisionPaidSignupFromCheckout,
  provisionPaidSignupFromSubscription
} from "@/server/billing";

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

  it("activates a paid signup from checkout completion and later attaches the subscription id", async () => {
    const pendingSignup = await prisma.pendingSignup.create({
      data: {
        ownerName: "Paulo Teste",
        email: "paulo-teste@example.com",
        passwordHash: "hashed-password",
        barbershopName: "Barbearia Teste",
        slug: "barbearia-teste",
        status: PendingSignupStatus.CHECKOUT_OPEN
      }
    });

    await markPendingSignupCheckoutPaid({
      checkout: {
        id: "bill_checkout_test",
        externalId: `signup:${pendingSignup.id}`,
        customerId: "cust_checkout_test",
        status: "PAID"
      },
      customer: {
        id: "cust_checkout_test",
        email: "paulo-teste@example.com",
        name: "Paulo Teste"
      }
    });

    await provisionPaidSignupFromCheckout({
      checkout: {
        id: "bill_checkout_test",
        externalId: `signup:${pendingSignup.id}`,
        customerId: "cust_checkout_test",
        status: "PAID"
      },
      customer: {
        id: "cust_checkout_test",
        email: "paulo-teste@example.com",
        name: "Paulo Teste"
      }
    });

    const provisionedSignup = await prisma.pendingSignup.findUniqueOrThrow({
      where: { id: pendingSignup.id }
    });
    const provisionedTenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: provisionedSignup.tenantId! }
    });
    const provisionedUser = await prisma.user.findUniqueOrThrow({
      where: { email: "paulo-teste@example.com" }
    });

    expect(provisionedSignup.status).toBe(PendingSignupStatus.PROVISIONED);
    expect(provisionedSignup.billingCustomerId).toBe("cust_checkout_test");
    expect(provisionedSignup.billingSubscriptionId).toBeNull();
    expect(provisionedTenant.billingStatus).toBe(BillingStatus.ACTIVE);
    expect(provisionedTenant.billingCustomerId).toBe("cust_checkout_test");
    expect(provisionedTenant.billingSubscriptionId).toBeNull();
    expect(provisionedUser.tenantId).toBe(provisionedTenant.id);

    await provisionPaidSignupFromSubscription({
      payment: {
        externalId: `signup:${pendingSignup.id}`
      },
      customer: {
        id: "cust_checkout_test",
        email: "paulo-teste@example.com",
        name: "Paulo Teste"
      },
      subscription: {
        id: "subs_checkout_test",
        status: "ACTIVE"
      }
    });

    const syncedSignup = await prisma.pendingSignup.findUniqueOrThrow({
      where: { id: pendingSignup.id }
    });
    const syncedTenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: provisionedTenant.id }
    });

    expect(syncedSignup.billingSubscriptionId).toBe("subs_checkout_test");
    expect(syncedTenant.billingSubscriptionId).toBe("subs_checkout_test");
    expect(syncedTenant.billingStatus).toBe(BillingStatus.ACTIVE);
  });
});
