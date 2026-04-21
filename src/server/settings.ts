import { prisma } from "@/lib/prisma";

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      profile: true,
      businessHours: {
        orderBy: { weekday: "asc" }
      },
      pendingSignups: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
}
