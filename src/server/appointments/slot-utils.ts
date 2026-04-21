import { AppointmentStatus, type Appointment, type BusinessHour } from "@prisma/client";
import {
  addMinutes,
  format,
  getDay,
  isBefore,
  parse,
  set
} from "date-fns";

export const SLOT_INTERVAL_MINUTES = 15;

type AppointmentWindow = Pick<Appointment, "startAt" | "endAt" | "status">;
type BusinessHourWindow = Pick<BusinessHour, "weekday" | "startTime" | "endTime">;

export function parseDateAndTime(date: string, time: string) {
  const day = parse(date, "yyyy-MM-dd", new Date());
  const [hours, minutes] = time.split(":").map(Number);

  return set(day, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0
  });
}

export function hasAppointmentConflict(
  candidateStart: Date,
  candidateEnd: Date,
  appointments: AppointmentWindow[],
  ignoreAppointmentId?: string
) {
  return appointments.some((appointment) => {
    if (appointment.status === AppointmentStatus.CANCELED) {
      return false;
    }

    if (ignoreAppointmentId && "id" in appointment && appointment.id === ignoreAppointmentId) {
      return false;
    }

    return candidateStart < appointment.endAt && candidateEnd > appointment.startAt;
  });
}

export function calculateAvailableSlots(params: {
  date: string;
  serviceDurationMinutes: number;
  businessHours: BusinessHourWindow[];
  appointments: AppointmentWindow[];
  now?: Date;
}) {
  const { date, serviceDurationMinutes, businessHours, appointments, now = new Date() } = params;
  const day = parse(date, "yyyy-MM-dd", new Date());
  const weekday = getDay(day);
  const hourWindow = businessHours.find((businessHour) => businessHour.weekday === weekday);

  if (!hourWindow) {
    return [];
  }

  const openAt = parseDateAndTime(date, hourWindow.startTime);
  const closeAt = parseDateAndTime(date, hourWindow.endTime);

  if (isBefore(closeAt, openAt) || closeAt.getTime() === openAt.getTime()) {
    return [];
  }

  const slots: Array<{ label: string; startAt: Date; endAt: Date; available: boolean }> = [];
  let current = openAt;

  while (true) {
    const slotEnd = addMinutes(current, serviceDurationMinutes);

    if (slotEnd > closeAt) {
      break;
    }

    const available =
      !isBefore(current, now) &&
      !hasAppointmentConflict(current, slotEnd, appointments);

    slots.push({
      label: format(current, "HH:mm"),
      startAt: current,
      endAt: slotEnd,
      available
    });

    current = addMinutes(current, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

export function canTransitionAppointmentStatus(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
) {
  const pendingTransitions = new Set<AppointmentStatus>([
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELED,
    AppointmentStatus.PENDING
  ]);
  const confirmedTransitions = new Set<AppointmentStatus>([
    AppointmentStatus.DONE,
    AppointmentStatus.CANCELED,
    AppointmentStatus.CONFIRMED
  ]);

  if (currentStatus === AppointmentStatus.CANCELED || currentStatus === AppointmentStatus.DONE) {
    return currentStatus === nextStatus;
  }

  if (currentStatus === AppointmentStatus.PENDING) {
    return pendingTransitions.has(nextStatus);
  }

  if (currentStatus === AppointmentStatus.CONFIRMED) {
    return confirmedTransitions.has(nextStatus);
  }

  return false;
}
