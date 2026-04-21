import { AppointmentStatus } from "@prisma/client";
import { endOfDay, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";

export async function getDashboardSnapshot(tenantId: string, date = new Date()) {
  const [todayAppointments, barbersCount, servicesCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        tenantId,
        startAt: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      },
      include: {
        barber: true,
        service: true
      },
      orderBy: { startAt: "asc" }
    }),
    prisma.barber.count({ where: { tenantId } }),
    prisma.service.count({ where: { tenantId } })
  ]);

  return {
    todayAppointments,
    barbersCount,
    servicesCount,
    pendingCount: todayAppointments.filter((item) => item.status === AppointmentStatus.PENDING).length,
    confirmedCount: todayAppointments.filter((item) => item.status === AppointmentStatus.CONFIRMED).length
  };
}
