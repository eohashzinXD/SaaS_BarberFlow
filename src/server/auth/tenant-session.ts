import { BillingStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { isBillingActive } from "@/server/billing/status";
import { auth } from "../../../auth";

export type TenantSessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string;
  billingStatus: BillingStatus;
  subscriptionCurrentPeriodEnd: Date | null;
};

export async function requireAnyTenantSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.tenantId || !session.user.role) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      billingStatus: true,
      subscriptionCurrentPeriodEnd: true
    }
  });

  if (!tenant) {
    redirect("/login");
  }

  return {
    ...session.user,
    billingStatus: tenant.billingStatus,
    subscriptionCurrentPeriodEnd: tenant.subscriptionCurrentPeriodEnd
  } as TenantSessionUser;
}

export async function requireTenantSession() {
  const user = await requireAnyTenantSession();

  if (!isBillingActive(user.billingStatus, user.subscriptionCurrentPeriodEnd)) {
    redirect("/billing/locked");
  }

  return user;
}

export async function requireAdminSession() {
  const user = await requireTenantSession();

  if (user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  return user;
}
