import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/server/auth/password";
import { getTenantAccessMessage, isTenantAccessAllowed } from "@/server/billing/status";
import { loginSchema } from "@/server/schemas/auth";

type LoginInput = z.infer<typeof loginSchema>;

export async function authenticateCredentials(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: {
      tenant: {
        select: {
          billingStatus: true,
          subscriptionCurrentPeriodEnd: true,
          gracePeriodDays: true,
          isBlocked: true,
          blockedReason: true
        }
      }
    }
  });

  if (!user) {
    return { status: "invalid" as const };
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    return { status: "invalid" as const };
  }

  if (user.isBlocked) {
    return {
      status: "inactive" as const,
      message: "Seu usuário está bloqueado. Fale com o suporte da plataforma."
    };
  }

  if (user.role !== Role.SUPER_ADMIN) {
    if (!user.tenant) {
      return {
        status: "invalid" as const
      };
    }

    if (!isTenantAccessAllowed(user.tenant)) {
      return {
        status: "inactive" as const,
        message: getTenantAccessMessage(user.tenant)
      };
    }
  }

  return {
    status: "success" as const,
    user
  };
}
