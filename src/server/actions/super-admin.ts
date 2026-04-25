"use server";

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/server/auth/tenant-session";
import {
  tenantBlockSchema,
  tenantDeleteSchema,
  tenantSubscriptionSchema,
  tenantUpdateSchema,
  userDeleteSchema,
  userToggleBlockSchema,
  userUpdateSchema
} from "@/server/schemas/super-admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || undefined;
}

function getRedirectTarget(formData: FormData, fallbackPath: string) {
  const redirectTo = getString(formData, "redirectTo");
  return redirectTo.startsWith("/") ? redirectTo : fallbackPath;
}

function parseDateInput(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateSuperAdminBarbershopAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/barbershops");
  const parsed = tenantUpdateSchema.safeParse({
    tenantId: getString(formData, "tenantId"),
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    description: getOptionalString(formData, "description"),
    address: getOptionalString(formData, "address"),
    phone: getOptionalString(formData, "phone"),
    ownerUserId: getOptionalString(formData, "ownerUserId"),
    ownerName: getOptionalString(formData, "ownerName"),
    ownerEmail: getOptionalString(formData, "ownerEmail")?.toLowerCase()
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const [tenant, slugConflict, ownerEmailConflict] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: parsed.data.tenantId },
      select: { id: true, name: true }
    }),
    prisma.tenant.findFirst({
      where: {
        slug: parsed.data.slug,
        id: {
          not: parsed.data.tenantId
        }
      },
      select: { id: true }
    }),
    parsed.data.ownerUserId && parsed.data.ownerEmail
      ? prisma.user.findFirst({
          where: {
            email: parsed.data.ownerEmail,
            id: {
              not: parsed.data.ownerUserId
            }
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  if (!tenant) {
    redirect(buildRedirectUrl(redirectTo, { error: "Barbearia não encontrada." }));
  }

  if (slugConflict) {
    redirect(buildRedirectUrl(redirectTo, { error: "Este slug já está em uso." }));
  }

  if (ownerEmailConflict) {
    redirect(buildRedirectUrl(redirectTo, { error: "O e-mail do responsável já está em uso." }));
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: parsed.data.tenantId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug
      }
    });

    await tx.barbershopProfile.upsert({
      where: { tenantId: parsed.data.tenantId },
      update: {
        description: parsed.data.description ?? null,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null
      },
      create: {
        tenantId: parsed.data.tenantId,
        description: parsed.data.description ?? null,
        address: parsed.data.address ?? null,
        phone: parsed.data.phone ?? null
      }
    });

    if (parsed.data.ownerUserId && parsed.data.ownerName && parsed.data.ownerEmail) {
      const ownerResult = await tx.user.updateMany({
        where: {
          id: parsed.data.ownerUserId,
          tenantId: parsed.data.tenantId
        },
        data: {
          name: parsed.data.ownerName,
          email: parsed.data.ownerEmail
        }
      });

      if (!ownerResult.count) {
        throw new Error("Responsável da barbearia não encontrado.");
      }
    }

    await tx.tenantActivityLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        actorUserId: session.id,
        action: "TENANT_UPDATED",
        description: `Dados principais da barbearia ${parsed.data.name} atualizados no painel do Super Admin.`
      }
    });
  });

  redirect(buildRedirectUrl(redirectTo, { success: "Dados da barbearia atualizados com sucesso." }));
}

export async function updateSuperAdminBarbershopSubscriptionAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/barbershops");
  const parsed = tenantSubscriptionSchema.safeParse({
    tenantId: getString(formData, "tenantId"),
    billingStatus: getString(formData, "billingStatus"),
    subscriptionStartDate: getOptionalString(formData, "subscriptionStartDate"),
    subscriptionCurrentPeriodEnd: getOptionalString(formData, "subscriptionCurrentPeriodEnd"),
    gracePeriodDays: getString(formData, "gracePeriodDays") || "0"
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const subscriptionStartDate = parseDateInput(parsed.data.subscriptionStartDate);
  const subscriptionCurrentPeriodEnd = parseDateInput(parsed.data.subscriptionCurrentPeriodEnd);

  if (parsed.data.billingStatus === "ACTIVE" && !subscriptionCurrentPeriodEnd) {
    redirect(
      buildRedirectUrl(redirectTo, {
        error: "Informe a data de vencimento para uma assinatura ativa."
      })
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, name: true }
  });

  if (!tenant) {
    redirect(buildRedirectUrl(redirectTo, { error: "Barbearia não encontrada." }));
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: parsed.data.tenantId },
      data: {
        billingStatus: parsed.data.billingStatus,
        subscriptionStartDate,
        subscriptionCurrentPeriodEnd,
        gracePeriodDays: parsed.data.gracePeriodDays
      }
    });

    await tx.tenantActivityLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        actorUserId: session.id,
        action: "SUBSCRIPTION_UPDATED",
        description: `Assinatura de ${tenant.name} atualizada para ${parsed.data.billingStatus}.`
      }
    });
  });

  redirect(buildRedirectUrl(redirectTo, { success: "Assinatura atualizada com sucesso." }));
}

export async function blockSuperAdminBarbershopAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/barbershops");
  const parsed = tenantBlockSchema.safeParse({
    tenantId: getString(formData, "tenantId"),
    blockedReason: getOptionalString(formData, "blockedReason")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, name: true }
  });

  if (!tenant) {
    redirect(buildRedirectUrl(redirectTo, { error: "Barbearia não encontrada." }));
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: parsed.data.tenantId },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: parsed.data.blockedReason ?? null
      }
    });

    await tx.tenantActivityLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        actorUserId: session.id,
        action: "TENANT_BLOCKED",
        description: parsed.data.blockedReason?.trim()
          ? `Barbearia bloqueada manualmente. Motivo: ${parsed.data.blockedReason.trim()}`
          : "Barbearia bloqueada manualmente pelo Super Admin."
      }
    });
  });

  redirect(buildRedirectUrl(redirectTo, { success: `${tenant.name} foi bloqueada.` }));
}

export async function unblockSuperAdminBarbershopAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/barbershops");
  const parsed = tenantDeleteSchema.safeParse({
    tenantId: getString(formData, "tenantId")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, name: true }
  });

  if (!tenant) {
    redirect(buildRedirectUrl(redirectTo, { error: "Barbearia não encontrada." }));
  }

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: parsed.data.tenantId },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null
      }
    });

    await tx.tenantActivityLog.create({
      data: {
        tenantId: parsed.data.tenantId,
        actorUserId: session.id,
        action: "TENANT_UNBLOCKED",
        description: "Barbearia desbloqueada pelo Super Admin."
      }
    });
  });

  redirect(buildRedirectUrl(redirectTo, { success: `${tenant.name} foi desbloqueada.` }));
}

export async function deleteSuperAdminBarbershopAction(formData: FormData) {
  await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/barbershops");
  const parsed = tenantDeleteSchema.safeParse({
    tenantId: getString(formData, "tenantId")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: parsed.data.tenantId },
    select: { id: true, name: true }
  });

  if (!tenant) {
    redirect(buildRedirectUrl(redirectTo, { error: "Barbearia não encontrada." }));
  }

  await prisma.$transaction([
    prisma.pendingSignup.deleteMany({
      where: { tenantId: parsed.data.tenantId }
    }),
    prisma.tenant.delete({
      where: { id: parsed.data.tenantId }
    })
  ]);

  redirect(buildRedirectUrl("/super-admin/barbershops", { success: `${tenant.name} foi excluída.` }));
}

export async function updateSuperAdminUserAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/users");
  const parsed = userUpdateSchema.safeParse({
    userId: getString(formData, "userId"),
    name: getString(formData, "name"),
    email: getString(formData, "email").toLowerCase(),
    role: getString(formData, "role")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const [user, emailConflict] = await Promise.all([
    prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    }),
    prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        id: {
          not: parsed.data.userId
        }
      },
      select: { id: true }
    })
  ]);

  if (!user) {
    redirect(buildRedirectUrl(redirectTo, { error: "Usuário não encontrado." }));
  }

  if (emailConflict) {
    redirect(buildRedirectUrl(redirectTo, { error: "Este e-mail já está em uso." }));
  }

  if (session.id === user.id && parsed.data.role !== Role.SUPER_ADMIN) {
    redirect(buildRedirectUrl(redirectTo, { error: "Você não pode remover seu próprio acesso de Super Admin." }));
  }

  if (user.role === Role.SUPER_ADMIN && parsed.data.role !== Role.SUPER_ADMIN) {
    redirect(buildRedirectUrl(redirectTo, { error: "Altere o papel de Super Admin diretamente pelo processo operacional da plataforma." }));
  }

  if (user.role !== Role.SUPER_ADMIN && parsed.data.role === Role.SUPER_ADMIN) {
    redirect(buildRedirectUrl(redirectTo, { error: "Promoção para Super Admin não está disponível por esta tela." }));
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role
      }
    });

    if (user.tenantId) {
      await tx.tenantActivityLog.create({
        data: {
          tenantId: user.tenantId,
          actorUserId: session.id,
          action: "USER_UPDATED",
          description: `Usuário ${parsed.data.email} atualizado pelo Super Admin.`
        }
      });
    }
  });

  redirect(buildRedirectUrl(redirectTo, { success: "Usuário atualizado com sucesso." }));
}

export async function toggleSuperAdminUserBlockAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/users");
  const parsed = userToggleBlockSchema.safeParse({
    userId: getString(formData, "userId")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      name: true,
      email: true,
      isBlocked: true,
      role: true,
      tenantId: true
    }
  });

  if (!user) {
    redirect(buildRedirectUrl(redirectTo, { error: "Usuário não encontrado." }));
  }

  if (session.id === user.id) {
    redirect(buildRedirectUrl(redirectTo, { error: "Você não pode bloquear o próprio usuário." }));
  }

  if (user.role === Role.SUPER_ADMIN) {
    redirect(buildRedirectUrl(redirectTo, { error: "Bloqueio de contas Super Admin não é permitido por esta tela." }));
  }

  const nextBlockedState = !user.isBlocked;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        isBlocked: nextBlockedState,
        blockedAt: nextBlockedState ? new Date() : null
      }
    });

    if (user.tenantId) {
      await tx.tenantActivityLog.create({
        data: {
          tenantId: user.tenantId,
          actorUserId: session.id,
          action: nextBlockedState ? "USER_BLOCKED" : "USER_UNBLOCKED",
          description: nextBlockedState
            ? `Usuário ${user.email} bloqueado pelo Super Admin.`
            : `Usuário ${user.email} desbloqueado pelo Super Admin.`
        }
      });
    }
  });

  redirect(
    buildRedirectUrl(redirectTo, {
      success: nextBlockedState ? `${user.email} foi bloqueado.` : `${user.email} foi desbloqueado.`
    })
  );
}

export async function deleteSuperAdminUserAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const redirectTo = getRedirectTarget(formData, "/super-admin/users");
  const parsed = userDeleteSchema.safeParse({
    userId: getString(formData, "userId")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl(redirectTo, { error: parsed.error.issues[0]?.message }));
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true
    }
  });

  if (!user) {
    redirect(buildRedirectUrl(redirectTo, { error: "Usuário não encontrado." }));
  }

  if (session.id === user.id) {
    redirect(buildRedirectUrl(redirectTo, { error: "Você não pode excluir o próprio usuário." }));
  }

  if (user.role === Role.SUPER_ADMIN) {
    redirect(buildRedirectUrl(redirectTo, { error: "Exclusão de Super Admin não é permitida por esta tela." }));
  }

  await prisma.$transaction(async (tx) => {
    if (user.tenantId) {
      await tx.tenantActivityLog.create({
        data: {
          tenantId: user.tenantId,
          actorUserId: session.id,
          action: "USER_DELETED",
          description: `Usuário ${user.email} excluído pelo Super Admin.`
        }
      });
    }

    await tx.user.delete({
      where: { id: parsed.data.userId }
    });
  });

  redirect(buildRedirectUrl(redirectTo, { success: `${user.email} foi excluído.` }));
}
