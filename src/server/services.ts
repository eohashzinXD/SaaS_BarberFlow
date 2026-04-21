import { prisma } from "@/lib/prisma";

export async function listServicesByTenant(tenantId: string) {
  return prisma.service.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" }
  });
}

export async function getServiceByTenant(params: { tenantId: string; serviceId: string }) {
  return prisma.service.findFirst({
    where: {
      id: params.serviceId,
      tenantId: params.tenantId
    }
  });
}
