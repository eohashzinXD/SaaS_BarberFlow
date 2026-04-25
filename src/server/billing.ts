import {
  BillingStatus,
  PendingSignupStatus,
  Role
} from "@prisma/client";
import { z } from "zod";

import {
  createAbacatePayCustomer,
  createAbacatePaySubscriptionCheckout,
  type AbacatePayCheckoutResponse
} from "@/lib/abacate-pay";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import { getNextSubscriptionPeriodEnd, mapSubscriptionStatus } from "@/server/billing/status";
import { registerSchema } from "@/server/schemas/auth";

type RegisterInput = z.infer<typeof registerSchema>;

type AbacatePayCheckoutWebhookPayload = {
  checkout: {
    id: string;
    externalId: string | null;
    customerId?: string | null;
    status?: string | null;
  };
  customer?: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
};

type AbacatePaySubscriptionWebhookPayload = {
  checkout?: {
    id: string;
    externalId: string | null;
  } | null;
  customer?: {
    id: string;
    email?: string | null;
    name?: string | null;
  } | null;
  payment?: {
    externalId: string | null;
  } | null;
  subscription: {
    id: string;
    status: string | null;
  };
};

type TenantBillingCheckoutInput = {
  tenantId: string;
  customerEmail: string;
  customerName: string;
  customerId?: string | null;
};

type ExternalReference =
  | { kind: "signup"; id: string }
  | { kind: "tenant"; id: string };

function assertBillingConfigured() {
  if (!env.abacatePayProductId) {
    throw new Error("ABACATEPAY_PRODUCT_ID is not configured.");
  }
}

function buildAppUrl(pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, env.appUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

function buildExternalReference(kind: ExternalReference["kind"], id: string) {
  return `${kind}:${id}`;
}

function parseExternalReference(externalId: string | null | undefined): ExternalReference | null {
  if (!externalId) {
    return null;
  }

  const [kind, id] = externalId.split(":");

  if ((kind === "signup" || kind === "tenant") && id) {
    return { kind, id };
  }

  return null;
}

function getSubscriptionExternalReference(payload: AbacatePaySubscriptionWebhookPayload) {
  return payload.checkout?.externalId ?? payload.payment?.externalId ?? null;
}

async function ensureAbacatePayCustomer(input: {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}) {
  return createAbacatePayCustomer({
    email: input.email,
    name: input.name,
    metadata: input.metadata
  });
}

async function updateTenantBilling(params: {
  billingStatus: BillingStatus;
  customerId?: string | null;
  subscriptionId?: string | null;
  subscriptionStartDate?: Date | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  tenantId?: string;
}) {
  const data = {
    billingStatus: params.billingStatus,
    subscriptionStartDate: params.subscriptionStartDate,
    subscriptionCurrentPeriodEnd: params.subscriptionCurrentPeriodEnd ?? null,
    ...(params.customerId ? { billingCustomerId: params.customerId } : {}),
    ...(params.subscriptionId ? { billingSubscriptionId: params.subscriptionId } : {})
  };

  if (params.tenantId) {
    const result = await prisma.tenant.updateMany({
      where: { id: params.tenantId },
      data
    });

    return result.count;
  }

  const identifiers = [
    ...(params.subscriptionId ? [{ billingSubscriptionId: params.subscriptionId }] : []),
    ...(params.customerId ? [{ billingCustomerId: params.customerId }] : [])
  ];

  if (identifiers.length === 0) {
    return 0;
  }

  const result = await prisma.tenant.updateMany({
    where: {
      OR: identifiers
    },
    data
  });

  return result.count;
}

function assertCheckoutUrl(checkout: AbacatePayCheckoutResponse) {
  if (!checkout.url) {
    throw new Error("AbacatePay did not return a checkout URL.");
  }

  return checkout;
}

export async function ensureSignupEligibility(input: Pick<RegisterInput, "email" | "slug">) {
  const [user, tenant, pendingSignup] = await Promise.all([
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true }
    }),
    prisma.tenant.findUnique({
      where: { slug: input.slug },
      select: { id: true }
    }),
    prisma.pendingSignup.findFirst({
      where: {
        OR: [{ email: input.email }, { slug: input.slug }],
        status: {
          in: [
            PendingSignupStatus.PENDING_PAYMENT,
            PendingSignupStatus.CHECKOUT_OPEN,
            PendingSignupStatus.PAID,
            PendingSignupStatus.PROVISIONED
          ]
        }
      },
      select: { id: true }
    })
  ]);

  if (user) {
    throw new Error("Este e-mail já está em uso.");
  }

  if (tenant) {
    throw new Error("Este slug já está em uso.");
  }

  if (pendingSignup) {
    throw new Error("Já existe um cadastro em andamento com este e-mail ou slug.");
  }
}

export async function createPendingSignupCheckout(input: RegisterInput) {
  assertBillingConfigured();

  const passwordHash = await hashPassword(input.password);
  const pendingSignup = await prisma.pendingSignup.create({
    data: {
      ownerName: input.ownerName,
      email: input.email,
      passwordHash,
      barbershopName: input.barbershopName,
      slug: input.slug,
      status: PendingSignupStatus.PENDING_PAYMENT,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  });

  try {
    const customer = await ensureAbacatePayCustomer({
      email: input.email,
      name: input.ownerName,
      metadata: {
        pendingSignupId: pendingSignup.id
      }
    });

    const checkout = await createAbacatePaySubscriptionCheckout({
      itemId: env.abacatePayProductId!,
      customerId: customer.id,
      returnUrl: buildAppUrl("/register", {
        error: "Pagamento cancelado. Sua conta ainda não foi ativada."
      }),
      completionUrl: buildAppUrl("/register/success", {
        signup_id: pendingSignup.id
      }),
      externalId: buildExternalReference("signup", pendingSignup.id),
      metadata: {
        pendingSignupId: pendingSignup.id,
        slug: input.slug
      }
    });

    await prisma.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        billingCheckoutId: checkout.id,
        billingCustomerId: customer.id,
        status: PendingSignupStatus.CHECKOUT_OPEN
      }
    });

    return assertCheckoutUrl(checkout);
  } catch (error) {
    await prisma.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        status: PendingSignupStatus.CANCELED
      }
    });
    throw error;
  }
}

export async function getSignupStatusById(signupId: string) {
  return prisma.pendingSignup.findUnique({
    where: {
      id: signupId
    },
    select: {
      id: true,
      email: true,
      ownerName: true,
      barbershopName: true,
      slug: true,
      status: true,
      completedAt: true
    }
  });
}

export async function markPendingSignupCheckoutPaid(payload: AbacatePayCheckoutWebhookPayload) {
  const externalReference = parseExternalReference(payload.checkout.externalId);

  if (!externalReference || externalReference.kind !== "signup") {
    return;
  }

  await prisma.pendingSignup.updateMany({
    where: {
      id: externalReference.id,
      status: {
        in: [PendingSignupStatus.PENDING_PAYMENT, PendingSignupStatus.CHECKOUT_OPEN]
      }
    },
    data: {
      status: PendingSignupStatus.PAID,
      billingCheckoutId: payload.checkout.id,
      billingCustomerId: payload.customer?.id ?? payload.checkout.customerId ?? undefined
    }
  });
}

export async function provisionPaidSignupFromSubscription(
  payload: AbacatePaySubscriptionWebhookPayload
) {
  const externalReference = parseExternalReference(getSubscriptionExternalReference(payload));

  if (!externalReference || externalReference.kind !== "signup") {
    return;
  }

  const pendingSignup = await prisma.pendingSignup.findUnique({
    where: { id: externalReference.id }
  });

  if (!pendingSignup) {
    return;
  }

  if (pendingSignup.status === PendingSignupStatus.PROVISIONED && pendingSignup.tenantId) {
    await updateTenantBilling({
      tenantId: pendingSignup.tenantId,
      billingStatus: BillingStatus.ACTIVE,
      customerId: payload.customer?.id ?? pendingSignup.billingCustomerId,
      subscriptionId: payload.subscription.id,
      subscriptionCurrentPeriodEnd: getNextSubscriptionPeriodEnd()
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: pendingSignup.email },
      select: { tenantId: true }
    });

    if (existingUser?.tenantId) {
      await tx.tenant.update({
        where: { id: existingUser.tenantId },
        data: {
          billingStatus: BillingStatus.ACTIVE,
          billingCustomerId: payload.customer?.id ?? pendingSignup.billingCustomerId,
          billingSubscriptionId: payload.subscription.id,
          subscriptionStartDate: new Date(),
          subscriptionCurrentPeriodEnd: getNextSubscriptionPeriodEnd()
        }
      });

      await tx.pendingSignup.update({
        where: { id: pendingSignup.id },
        data: {
          status: PendingSignupStatus.PROVISIONED,
          tenantId: existingUser.tenantId,
          billingCustomerId: payload.customer?.id ?? pendingSignup.billingCustomerId,
          billingSubscriptionId: payload.subscription.id,
          completedAt: new Date()
        }
      });
      return;
    }

    const tenant = await tx.tenant.create({
      data: {
        name: pendingSignup.barbershopName,
        slug: pendingSignup.slug,
        billingStatus: BillingStatus.ACTIVE,
        billingCustomerId: payload.customer?.id ?? pendingSignup.billingCustomerId,
        billingSubscriptionId: payload.subscription.id,
        subscriptionStartDate: new Date(),
        subscriptionCurrentPeriodEnd: getNextSubscriptionPeriodEnd()
      }
    });

    await tx.barbershopProfile.create({
      data: {
        tenantId: tenant.id,
        description: "Edite esta descrição no painel para apresentar sua barbearia."
      }
    });

    await tx.user.create({
      data: {
        name: pendingSignup.ownerName,
        email: pendingSignup.email,
        passwordHash: pendingSignup.passwordHash,
        tenantId: tenant.id,
        role: Role.ADMIN
      }
    });

    await tx.pendingSignup.update({
      where: { id: pendingSignup.id },
      data: {
        status: PendingSignupStatus.PROVISIONED,
        tenantId: tenant.id,
        billingCustomerId: payload.customer?.id ?? pendingSignup.billingCustomerId,
        billingSubscriptionId: payload.subscription.id,
        completedAt: new Date()
      }
    });
  });
}

export async function syncTenantFromSubscriptionEvent(
  payload: AbacatePaySubscriptionWebhookPayload
) {
  const billingStatus = mapSubscriptionStatus(payload.subscription.status);
  const customerId = payload.customer?.id;
  const subscriptionId = payload.subscription.id;
  const subscriptionCurrentPeriodEnd =
    billingStatus === BillingStatus.ACTIVE ? getNextSubscriptionPeriodEnd() : null;

  const updatedTenants = await updateTenantBilling({
    billingStatus,
    customerId,
    subscriptionId,
    subscriptionCurrentPeriodEnd
  });

  if (updatedTenants > 0) {
    return;
  }

  const externalReference = parseExternalReference(getSubscriptionExternalReference(payload));

  if (!externalReference || externalReference.kind !== "tenant") {
    return;
  }

  await updateTenantBilling({
    tenantId: externalReference.id,
    billingStatus,
    customerId,
    subscriptionId,
    subscriptionCurrentPeriodEnd
  });
}

export async function createTenantBillingCheckout(input: TenantBillingCheckoutInput) {
  assertBillingConfigured();

  const customerId =
    input.customerId ??
    (
      await ensureAbacatePayCustomer({
        email: input.customerEmail,
        name: input.customerName,
        metadata: {
          tenantId: input.tenantId
        }
      })
    ).id;

  if (!input.customerId) {
    await prisma.tenant.update({
      where: { id: input.tenantId },
      data: {
        billingCustomerId: customerId
      }
    });
  }

  const checkout = await createAbacatePaySubscriptionCheckout({
    itemId: env.abacatePayProductId!,
    customerId,
    returnUrl: buildAppUrl("/billing/locked"),
    completionUrl: buildAppUrl("/billing/locked", {
      success: "Pagamento recebido. Aguarde a confirmação para reativar o acesso."
    }),
    externalId: buildExternalReference("tenant", input.tenantId),
    metadata: {
      tenantId: input.tenantId
    }
  });

  return assertCheckoutUrl(checkout);
}
