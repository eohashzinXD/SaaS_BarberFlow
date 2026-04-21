import { z } from "zod";

export const bookingQuerySchema = z.object({
  serviceId: z.string().cuid().optional(),
  barberId: z.string().cuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use uma data válida.")
    .optional(),
  slot: z.string().optional()
});

export const publicBookingSchema = z.object({
  serviceId: z.string().cuid(),
  barberId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().min(3, "Informe o nome do cliente."),
  customerEmail: z.email("Informe um e-mail válido.")
});

export const appointmentStatusSchema = z.object({
  appointmentId: z.string().cuid(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELED", "DONE"])
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().regex(/^\d{2}:\d{2}$/)
});
