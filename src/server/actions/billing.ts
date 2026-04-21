"use server";

import { redirect } from "next/navigation";

import { createTenantBillingCheckout } from "@/server/billing";
import { requireAnyTenantSession } from "@/server/auth/tenant-session";
import { prisma } from "@/lib/prisma";

export async function openBillingPortalAction() {
  const session = await requireAnyTenantSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      id: true,
      name: true,
      billingCustomerId: true
    }
  });

  if (!tenant) {
    redirect("/billing/locked");
  }

  const checkout = await createTenantBillingCheckout({
    tenantId: tenant.id,
    customerEmail: session.email,
    customerName: session.name,
    customerId: tenant.billingCustomerId
  });

  redirect(checkout.url);
}
