import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getPublicBarbershopBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: {
      profile: true,
      barbers: {
        orderBy: { createdAt: "asc" }
      },
      services: {
        orderBy: { createdAt: "asc" }
      },
      businessHours: {
        orderBy: { weekday: "asc" }
      }
    }
  });
}

export async function getPublicBookingContext(params: {
  slug: string;
  serviceId?: string;
  barberId?: string;
  date?: string;
}) {
  const shop = await getPublicBarbershopBySlug(params.slug);

  if (!shop) {
    return null;
  }

  const selectedService = params.serviceId
    ? shop.services.find((service) => service.id === params.serviceId)
    : undefined;
  const selectedBarber = params.barberId
    ? shop.barbers.find((barber) => barber.id === params.barberId)
    : undefined;

  let appointments: Array<{
    id: string;
    startAt: Date;
    endAt: Date;
    status: import("@prisma/client").AppointmentStatus;
  }> = [];

  if (params.date && selectedBarber) {
    const date = new Date(`${params.date}T00:00:00`);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    appointments = await prisma.appointment.findMany({
      where: {
        tenantId: shop.id,
        barberId: selectedBarber.id,
        startAt: {
          gte: date,
          lt: nextDate
        }
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true
      },
      orderBy: { startAt: "asc" }
    });
  }

  return {
    shop,
    selectedService,
    selectedBarber,
    appointments
  };
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });
}

export type Decimalish = Prisma.Decimal | string | number;
