import { AppointmentStatus } from "@prisma/client";

import {
  calculateAvailableSlots,
  canTransitionAppointmentStatus,
  hasAppointmentConflict
} from "@/server/appointments/slot-utils";

describe("appointment slot utilities", () => {
  it("calculates only available slots inside business hours", () => {
    const slots = calculateAvailableSlots({
      date: "2026-04-20",
      serviceDurationMinutes: 30,
      businessHours: [{ weekday: 1, startTime: "09:00", endTime: "10:00" }],
      appointments: [
        {
          startAt: new Date("2026-04-20T09:15:00"),
          endAt: new Date("2026-04-20T09:45:00"),
          status: AppointmentStatus.CONFIRMED
        }
      ],
      now: new Date("2026-04-19T12:00:00")
    });

    expect(slots.map((slot) => ({ label: slot.label, available: slot.available }))).toEqual([
      { label: "09:00", available: false },
      { label: "09:15", available: false },
      { label: "09:30", available: false }
    ]);
  });

  it("detects conflicting appointments", () => {
    const conflict = hasAppointmentConflict(
      new Date("2026-04-20T10:00:00"),
      new Date("2026-04-20T10:45:00"),
      [
        {
          startAt: new Date("2026-04-20T10:30:00"),
          endAt: new Date("2026-04-20T11:00:00"),
          status: AppointmentStatus.PENDING
        }
      ]
    );

    expect(conflict).toBe(true);
  });

  it("validates appointment status transitions", () => {
    expect(
      canTransitionAppointmentStatus(AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)
    ).toBe(true);
    expect(
      canTransitionAppointmentStatus(AppointmentStatus.CONFIRMED, AppointmentStatus.DONE)
    ).toBe(true);
    expect(
      canTransitionAppointmentStatus(AppointmentStatus.DONE, AppointmentStatus.PENDING)
    ).toBe(false);
  });
});
