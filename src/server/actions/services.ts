"use server";

import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/server/auth/tenant-session";
import { serviceSchema } from "@/server/schemas/services";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePrice(price: string) {
  return price.replace(",", ".");
}

export async function createServiceAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = serviceSchema.safeParse({
    name: getString(formData, "name"),
    description: getString(formData, "description") || undefined,
    durationMinutes: getString(formData, "durationMinutes"),
    price: getString(formData, "price")
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("/dashboard/services/new", { error: parsed.error.issues[0]?.message }));
  }

  await prisma.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      durationMinutes: parsed.data.durationMinutes,
      price: normalizePrice(parsed.data.price),
      tenantId: session.tenantId
    }
  });

  redirect(buildRedirectUrl("/dashboard/services", { success: "Serviço cadastrado com sucesso." }));
}

export async function updateServiceAction(formData: FormData) {
  const session = await requireAdminSession();
  const serviceId = getString(formData, "serviceId");
  const parsed = serviceSchema.safeParse({
    name: getString(formData, "name"),
    description: getString(formData, "description") || undefined,
    durationMinutes: getString(formData, "durationMinutes"),
    price: getString(formData, "price")
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl(`/dashboard/services/${serviceId}`, {
        error: parsed.error.issues[0]?.message
      })
    );
  }

  const result = await prisma.service.updateMany({
    where: {
      id: serviceId,
      tenantId: session.tenantId
    },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      durationMinutes: parsed.data.durationMinutes,
      price: normalizePrice(parsed.data.price)
    }
  });

  if (!result.count) {
    redirect(buildRedirectUrl("/dashboard/services", { error: "Serviço não encontrado." }));
  }

  redirect(buildRedirectUrl("/dashboard/services", { success: "Serviço atualizado com sucesso." }));
}

export async function deleteServiceAction(formData: FormData) {
  const session = await requireAdminSession();
  const serviceId = getString(formData, "serviceId");

  const appointmentsCount = await prisma.appointment.count({
    where: {
      serviceId,
      tenantId: session.tenantId,
      status: {
        not: "CANCELED"
      }
    }
  });

  if (appointmentsCount > 0) {
    redirect(
      buildRedirectUrl("/dashboard/services", {
        error: "Cancele ou finalize os agendamentos deste serviço antes de excluí-lo."
      })
    );
  }

  await prisma.service.deleteMany({
    where: {
      id: serviceId,
      tenantId: session.tenantId
    }
  });

  redirect(buildRedirectUrl("/dashboard/services", { success: "Serviço removido com sucesso." }));
}
