import { prisma } from "@/lib/prisma";

export async function listBarbersByTenant(tenantId: string) {
  return prisma.barber.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" }
  });
}

export async function getBarberByTenant(params: { tenantId: string; barberId: string }) {
  return prisma.barber.findFirst({
    where: {
      id: params.barberId,
      tenantId: params.tenantId
    }
  });
}
