"use server";

import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/server/auth/tenant-session";
import { barberSchema } from "@/server/schemas/barbers";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createBarberAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = barberSchema.safeParse({
    name: getString(formData, "name")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("/dashboard/barbers/new", { error: parsed.error.issues[0]?.message }));
  }

  await prisma.barber.create({
    data: {
      name: parsed.data.name,
      tenantId: session.tenantId
    }
  });

  redirect(buildRedirectUrl("/dashboard/barbers", { success: "Barbeiro cadastrado com sucesso." }));
}

export async function updateBarberAction(formData: FormData) {
  const session = await requireAdminSession();
  const barberId = getString(formData, "barberId");
  const parsed = barberSchema.safeParse({
    name: getString(formData, "name")
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl(`/dashboard/barbers/${barberId}`, {
        error: parsed.error.issues[0]?.message
      })
    );
  }

  const result = await prisma.barber.updateMany({
    where: {
      id: barberId,
      tenantId: session.tenantId
    },
    data: {
      name: parsed.data.name
    }
  });

  if (!result.count) {
    redirect(buildRedirectUrl("/dashboard/barbers", { error: "Barbeiro não encontrado." }));
  }

  redirect(buildRedirectUrl("/dashboard/barbers", { success: "Barbeiro atualizado com sucesso." }));
}

export async function deleteBarberAction(formData: FormData) {
  const session = await requireAdminSession();
  const barberId = getString(formData, "barberId");

  const appointmentsCount = await prisma.appointment.count({
    where: {
      barberId,
      tenantId: session.tenantId,
      status: {
        not: "CANCELED"
      }
    }
  });

  if (appointmentsCount > 0) {
    redirect(
      buildRedirectUrl("/dashboard/barbers", {
        error: "Cancele ou finalize os agendamentos deste barbeiro antes de excluí-lo."
      })
    );
  }

  await prisma.barber.deleteMany({
    where: {
      id: barberId,
      tenantId: session.tenantId
    }
  });

  redirect(buildRedirectUrl("/dashboard/barbers", { success: "Barbeiro removido com sucesso." }));
}
