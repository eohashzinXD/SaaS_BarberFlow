"use server";

import { AppointmentStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import {
  createAppointmentForPublicBooking,
  rescheduleAppointment,
  updateAppointmentStatus
} from "@/server/appointments";
import { requireAdminSession } from "@/server/auth/tenant-session";
import {
  appointmentStatusSchema,
  publicBookingSchema,
  rescheduleAppointmentSchema
} from "@/server/schemas/appointments";
import { getTenantBySlug } from "@/server/public";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createPublicAppointmentAction(formData: FormData) {
  const slug = getString(formData, "slug");
  const parsed = publicBookingSchema.safeParse({
    serviceId: getString(formData, "serviceId"),
    barberId: getString(formData, "barberId"),
    date: getString(formData, "date"),
    slot: getString(formData, "slot"),
    customerName: getString(formData, "customerName"),
    customerEmail: getString(formData, "customerEmail")
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl(`/barbearia/${slug}`, {
        error: parsed.error.issues[0]?.message
      })
    );
  }

  const tenant = await getTenantBySlug(slug);

  if (!tenant) {
    redirect(buildRedirectUrl("/", { error: "Barbearia não encontrada." }));
  }

  try {
    await createAppointmentForPublicBooking({
      tenantId: tenant.id,
      ...parsed.data
    });
  } catch (error) {
    redirect(
      buildRedirectUrl(`/barbearia/${slug}`, {
        error: error instanceof Error ? error.message : "Não foi possível concluir o agendamento."
      })
    );
  }

  redirect(
    buildRedirectUrl(`/barbearia/${slug}`, {
      success: "Agendamento criado com sucesso. Aguarde a confirmação da barbearia."
    })
  );
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const date = getString(formData, "date");
  const parsed = appointmentStatusSchema.safeParse({
    appointmentId: getString(formData, "appointmentId"),
    status: getString(formData, "status")
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl(`/dashboard/appointments`, {
        error: parsed.error.issues[0]?.message,
        date
      })
    );
  }

  try {
    await updateAppointmentStatus({
      tenantId: session.tenantId,
      appointmentId: parsed.data.appointmentId,
      status: parsed.data.status as AppointmentStatus
    });
  } catch (error) {
    redirect(
      buildRedirectUrl("/dashboard/appointments", {
        error: error instanceof Error ? error.message : "Não foi possível atualizar o status.",
        date
      })
    );
  }

  redirect(
    buildRedirectUrl("/dashboard/appointments", {
      success: "Status atualizado com sucesso.",
      date
    })
  );
}

export async function rescheduleAppointmentAction(formData: FormData) {
  const session = await requireAdminSession();
  const currentDate = getString(formData, "currentDate");
  const parsed = rescheduleAppointmentSchema.safeParse({
    appointmentId: getString(formData, "appointmentId"),
    date: getString(formData, "date"),
    slot: getString(formData, "slot")
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("/dashboard/appointments", {
        error: parsed.error.issues[0]?.message,
        date: currentDate
      })
    );
  }

  try {
    await rescheduleAppointment({
      tenantId: session.tenantId,
      appointmentId: parsed.data.appointmentId,
      date: parsed.data.date,
      slot: parsed.data.slot
    });
  } catch (error) {
    redirect(
      buildRedirectUrl("/dashboard/appointments", {
        error: error instanceof Error ? error.message : "Não foi possível remarcar o agendamento.",
        date: currentDate
      })
    );
  }

  redirect(
    buildRedirectUrl("/dashboard/appointments", {
      success: "Agendamento remarcado com sucesso.",
      date: parsed.data.date
    })
  );
}
