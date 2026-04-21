import { BillingStatus, Role } from "@prisma/client";
import { addMonths } from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import { registerSchema } from "@/server/schemas/auth";

type RegisterTenantAccountInput = z.infer<typeof registerSchema>;

export async function registerTenantAccount(input: RegisterTenantAccountInput) {
  const passwordHash = await hashPassword(input.password);
  const subscriptionCurrentPeriodEnd = addMonths(new Date(), 1);

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: input.barbershopName,
        slug: input.slug,
        billingStatus: BillingStatus.ACTIVE,
        subscriptionCurrentPeriodEnd
      }
    });

    const profile = await tx.barbershopProfile.create({
      data: {
        tenantId: tenant.id,
        description: "Edite esta descrição no painel para apresentar sua barbearia."
      }
    });

    const user = await tx.user.create({
      data: {
        name: input.ownerName,
        email: input.email,
        passwordHash,
        tenantId: tenant.id,
        role: Role.ADMIN
      }
    });

    return {
      tenant,
      profile,
      user
    };
  });
}
