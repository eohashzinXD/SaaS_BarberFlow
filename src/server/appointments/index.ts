import { AppointmentStatus } from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import {
  calculateAvailableSlots,
  canTransitionAppointmentStatus,
  hasAppointmentConflict,
  parseDateAndTime
} from "@/server/appointments/slot-utils";

export async function listAppointmentsByTenant(params: { tenantId: string; date: Date }) {
  const { tenantId, date } = params;

  return prisma.appointment.findMany({
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
  });
}

export async function getAppointmentByTenant(params: { tenantId: string; appointmentId: string }) {
  return prisma.appointment.findFirst({
    where: {
      id: params.appointmentId,
      tenantId: params.tenantId
    },
    include: {
      barber: true,
      service: true
    }
  });
}

export async function getAvailableSlotsForBooking(params: {
  tenantId: string;
  barberId: string;
  serviceId: string;
  date: string;
}) {
  const [service, businessHours, appointments] = await Promise.all([
    prisma.service.findFirst({
      where: {
        id: params.serviceId,
        tenantId: params.tenantId
      }
    }),
    prisma.businessHour.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { weekday: "asc" }
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: params.tenantId,
        barberId: params.barberId,
        startAt: {
          gte: startOfDay(new Date(`${params.date}T00:00:00`)),
          lt: startOfDay(addDays(new Date(`${params.date}T00:00:00`), 1))
        }
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true
      }
    })
  ]);

  if (!service) {
    return [];
  }

  return calculateAvailableSlots({
    date: params.date,
    serviceDurationMinutes: service.durationMinutes,
    businessHours,
    appointments
  });
}

export async function createAppointmentForPublicBooking(params: {
  tenantId: string;
  barberId: string;
  serviceId: string;
  date: string;
  slot: string;
  customerName: string;
  customerEmail: string;
}) {
  const [barber, service, businessHours, appointments] = await Promise.all([
    prisma.barber.findFirst({
      where: {
        id: params.barberId,
        tenantId: params.tenantId
      }
    }),
    prisma.service.findFirst({
      where: {
        id: params.serviceId,
        tenantId: params.tenantId
      }
    }),
    prisma.businessHour.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { weekday: "asc" }
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: params.tenantId,
        barberId: params.barberId,
        startAt: {
          gte: startOfDay(new Date(`${params.date}T00:00:00`)),
          lt: startOfDay(addDays(new Date(`${params.date}T00:00:00`), 1))
        }
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true
      }
    })
  ]);

  if (!barber || !service) {
    throw new Error("Serviço ou barbeiro não encontrado para esta barbearia.");
  }

  const startAt = parseDateAndTime(params.date, params.slot);
  const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
  const availableSlots = calculateAvailableSlots({
    date: params.date,
    serviceDurationMinutes: service.durationMinutes,
    businessHours,
    appointments
  });

  const selectedSlot = availableSlots.find((slot) => slot.label === params.slot);

  if (!selectedSlot?.available) {
    throw new Error("O horário selecionado não está mais disponível.");
  }

  return prisma.appointment.create({
    data: {
      tenantId: params.tenantId,
      barberId: barber.id,
      serviceId: service.id,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      startAt,
      endAt,
      status: AppointmentStatus.PENDING
    }
  });
}

export async function updateAppointmentStatus(params: {
  tenantId: string;
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: params.appointmentId,
      tenantId: params.tenantId
    }
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  if (!canTransitionAppointmentStatus(appointment.status, params.status)) {
    throw new Error("Transição de status inválida.");
  }

  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: params.status }
  });
}

export async function rescheduleAppointment(params: {
  tenantId: string;
  appointmentId: string;
  date: string;
  slot: string;
}) {
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: params.appointmentId,
      tenantId: params.tenantId
    },
    include: {
      service: true
    }
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  const [businessHours, sameDayAppointments] = await Promise.all([
    prisma.businessHour.findMany({
      where: { tenantId: params.tenantId },
      orderBy: { weekday: "asc" }
    }),
    prisma.appointment.findMany({
      where: {
        tenantId: params.tenantId,
        barberId: appointment.barberId,
        startAt: {
          gte: startOfDay(new Date(`${params.date}T00:00:00`)),
          lt: startOfDay(addDays(new Date(`${params.date}T00:00:00`), 1))
        }
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true
      }
    })
  ]);

  const startAt = parseDateAndTime(params.date, params.slot);
  const endAt = new Date(startAt.getTime() + appointment.service.durationMinutes * 60_000);
  const availableSlots = calculateAvailableSlots({
    date: params.date,
    serviceDurationMinutes: appointment.service.durationMinutes,
    businessHours,
    appointments: sameDayAppointments.filter((item) => item.id !== appointment.id)
  });

  const selectedSlot = availableSlots.find((slot) => slot.label === params.slot);

  if (!selectedSlot?.available || hasAppointmentConflict(startAt, endAt, sameDayAppointments, appointment.id)) {
    throw new Error("O novo horário informado não está disponível.");
  }

  return prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      startAt,
      endAt,
      status: appointment.status === AppointmentStatus.CANCELED ? appointment.status : AppointmentStatus.PENDING
    }
  });
}
