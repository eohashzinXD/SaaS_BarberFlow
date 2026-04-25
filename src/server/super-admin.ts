import { Role } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import {
  getSubscriptionDaysRemaining,
  getTenantPlatformStatus,
  getTenantPlatformStatusLabel,
  type TenantPlatformStatus
} from "@/server/billing/status";
import {
  superAdminBarbershopFiltersSchema,
  superAdminUsersFiltersSchema
} from "@/server/schemas/super-admin";

function pickResponsibleUser<T extends { role: Role; createdAt: Date }>(users: T[]) {
  return users.find((user) => user.role === Role.ADMIN) ?? users[0] ?? null;
}

function mapTenantSummary<
  T extends {
    id: string;
    name: string;
    slug: string;
    billingStatus: import("@prisma/client").BillingStatus;
    subscriptionStartDate: Date | null;
    subscriptionCurrentPeriodEnd: Date | null;
    gracePeriodDays: number;
    isBlocked: boolean;
    blockedAt: Date | null;
    blockedReason: string | null;
    createdAt: Date;
    profile: {
      phone: string | null;
      address: string | null;
      description: string | null;
    } | null;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: Role;
      isBlocked: boolean;
      createdAt: Date;
    }>;
    _count: {
      users: number;
      barbers: number;
      services: number;
      appointments: number;
    };
  }
>(tenant: T) {
  const responsibleUser = pickResponsibleUser(tenant.users);
  const platformStatus = getTenantPlatformStatus(tenant);

  return {
    ...tenant,
    responsibleUser,
    platformStatus,
    platformStatusLabel: getTenantPlatformStatusLabel(platformStatus),
    subscriptionDaysRemaining: getSubscriptionDaysRemaining(
      tenant.subscriptionCurrentPeriodEnd,
      tenant.gracePeriodDays
    )
  };
}

export function getPlatformStatusTone(status: TenantPlatformStatus) {
  const tones: Record<TenantPlatformStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-900",
    EXPIRING: "bg-amber-100 text-amber-900",
    BLOCKED: "bg-rose-100 text-rose-900",
    EXPIRED: "bg-orange-100 text-orange-900",
    PENDING_PAYMENT: "bg-slate-200 text-slate-900",
    CANCELED: "bg-zinc-200 text-zinc-900"
  };

  return tones[status];
}

export async function getSuperAdminDashboardSnapshot() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      billingStatus: true,
      subscriptionStartDate: true,
      subscriptionCurrentPeriodEnd: true,
      gracePeriodDays: true,
      isBlocked: true,
      blockedAt: true,
      blockedReason: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          address: true,
          description: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" },
        take: 5
      },
      _count: {
        select: {
          users: true,
          barbers: true,
          services: true,
          appointments: true
        }
      }
    }
  });

  const mappedTenants = tenants.map(mapTenantSummary);
  const recentWindowStart = subDays(new Date(), 30);
  const previousWindowStart = subDays(new Date(), 60);

  const totalUsers = await prisma.user.count({
    where: {
      role: {
        not: Role.SUPER_ADMIN
      }
    }
  });

  const totalAppointments = await prisma.appointment.count();
  const recentTenantsCount = mappedTenants.filter((tenant) => tenant.createdAt >= recentWindowStart).length;
  const previousTenantsCount = mappedTenants.filter(
    (tenant) => tenant.createdAt >= previousWindowStart && tenant.createdAt < recentWindowStart
  ).length;

  return {
    totalTenants: mappedTenants.length,
    totalUsers,
    totalAppointments,
    activeTenants: mappedTenants.filter((tenant) => tenant.platformStatus === "ACTIVE").length,
    blockedTenants: mappedTenants.filter((tenant) => tenant.platformStatus === "BLOCKED").length,
    expiredTenants: mappedTenants.filter((tenant) => tenant.platformStatus === "EXPIRED").length,
    expiringTenants: mappedTenants.filter((tenant) => tenant.platformStatus === "EXPIRING").length,
    canceledTenants: mappedTenants.filter((tenant) => tenant.platformStatus === "CANCELED").length,
    recentTenantsCount,
    growthDelta: recentTenantsCount - previousTenantsCount,
    recentTenants: mappedTenants.slice(0, 6)
  };
}

export async function listSuperAdminBarbershops(rawFilters: Record<string, string | string[] | undefined>) {
  const filters = superAdminBarbershopFiltersSchema.parse({
    query: typeof rawFilters.query === "string" ? rawFilters.query : undefined,
    status: typeof rawFilters.status === "string" ? rawFilters.status : undefined
  });

  const tenants = await prisma.tenant.findMany({
    where: filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { slug: { contains: filters.query, mode: "insensitive" } },
            { profile: { is: { phone: { contains: filters.query, mode: "insensitive" } } } },
            { users: { some: { email: { contains: filters.query, mode: "insensitive" } } } },
            { users: { some: { name: { contains: filters.query, mode: "insensitive" } } } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      billingStatus: true,
      subscriptionStartDate: true,
      subscriptionCurrentPeriodEnd: true,
      gracePeriodDays: true,
      isBlocked: true,
      blockedAt: true,
      blockedReason: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          address: true,
          description: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      },
      _count: {
        select: {
          users: true,
          barbers: true,
          services: true,
          appointments: true
        }
      }
    }
  });

  const mappedTenants = tenants.map(mapTenantSummary);
  const barbershops =
    filters.status === "ALL"
      ? mappedTenants
      : mappedTenants.filter((tenant) => tenant.platformStatus === filters.status);

  return {
    filters,
    barbershops
  };
}

export async function getSuperAdminBarbershopDetail(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      billingStatus: true,
      subscriptionStartDate: true,
      subscriptionCurrentPeriodEnd: true,
      gracePeriodDays: true,
      isBlocked: true,
      blockedAt: true,
      blockedReason: true,
      createdAt: true,
      profile: {
        select: {
          phone: true,
          address: true,
          description: true
        }
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          blockedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "asc" }
      },
      activityLogs: {
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true,
          actorUser: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: {
          users: true,
          barbers: true,
          services: true,
          appointments: true
        }
      }
    }
  });

  if (!tenant) {
    return null;
  }

  return mapTenantSummary(tenant);
}

export async function listSuperAdminUsers(rawFilters: Record<string, string | string[] | undefined>) {
  const filters = superAdminUsersFiltersSchema.parse({
    query: typeof rawFilters.query === "string" ? rawFilters.query : undefined
  });

  const users = await prisma.user.findMany({
    where: filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { email: { contains: filters.query, mode: "insensitive" } },
            { tenant: { is: { name: { contains: filters.query, mode: "insensitive" } } } },
            { tenant: { is: { slug: { contains: filters.query, mode: "insensitive" } } } }
          ]
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBlocked: true,
      blockedAt: true,
      createdAt: true,
      tenantId: true,
      tenant: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  return {
    filters,
    users
  };
}

export async function createTenantActivityLog(input: {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  description: string;
}) {
  await prisma.tenantActivityLog.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      description: input.description
    }
  });
}
