import { BillingStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { isTenantAccessAllowed } from "@/server/billing/status";
import { auth } from "../../../auth";

export type AuthenticatedSessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  billingStatus: BillingStatus | null;
  isBlocked: boolean;
};

export type TenantSessionUser = {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "SUPER_ADMIN">;
  tenantId: string;
  billingStatus: BillingStatus;
  subscriptionCurrentPeriodEnd: Date | null;
  gracePeriodDays: number;
  isBlocked: boolean;
  tenantIsBlocked: boolean;
  tenantBlockedReason: string | null;
};

export type SuperAdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN";
  tenantId: null;
  billingStatus: null;
  isBlocked: boolean;
};

export async function requireAuthenticatedSession() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return session.user as AuthenticatedSessionUser;
}

export async function requireSuperAdminSession() {
  const user = await requireAuthenticatedSession();

  if (user.isBlocked) {
    redirect("/login");
  }

  if (user.role !== Role.SUPER_ADMIN) {
    redirect("/dashboard");
  }

  return user as SuperAdminSessionUser;
}

export async function requireAnyTenantSession() {
  const session = await requireAuthenticatedSession();

  if (session.role === Role.SUPER_ADMIN) {
    redirect("/super-admin");
  }

  if (!session.tenantId || !session.billingStatus) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      billingStatus: true,
      subscriptionCurrentPeriodEnd: true,
      gracePeriodDays: true,
      isBlocked: true,
      blockedReason: true
    }
  });

  if (!tenant) {
    redirect("/login");
  }

  return {
    ...session,
    tenantId: session.tenantId,
    billingStatus: tenant.billingStatus,
    subscriptionCurrentPeriodEnd: tenant.subscriptionCurrentPeriodEnd,
    gracePeriodDays: tenant.gracePeriodDays,
    tenantIsBlocked: tenant.isBlocked,
    tenantBlockedReason: tenant.blockedReason
  } as TenantSessionUser;
}

export async function requireTenantSession() {
  const user = await requireAnyTenantSession();

  if (user.isBlocked) {
    redirect("/billing/locked");
  }

  if (!isTenantAccessAllowed({
    billingStatus: user.billingStatus,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd,
    gracePeriodDays: user.gracePeriodDays,
    isBlocked: user.tenantIsBlocked
  })) {
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
