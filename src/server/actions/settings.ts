"use server";

import { redirect } from "next/navigation";

import { buildRedirectUrl } from "@/lib/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/server/auth/tenant-session";
import { businessHoursSchema, settingsSchema } from "@/server/schemas/settings";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateSettingsAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = settingsSchema.safeParse({
    name: getString(formData, "name"),
    slug: getString(formData, "slug").toLowerCase(),
    description: getString(formData, "description") || undefined,
    address: getString(formData, "address") || undefined,
    phone: getString(formData, "phone") || undefined
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("/dashboard/settings", { error: parsed.error.issues[0]?.message }));
  }

  const slugConflict = await prisma.tenant.findFirst({
    where: {
      slug: parsed.data.slug,
      id: {
        not: session.tenantId
      }
    },
    select: { id: true }
  });

  if (slugConflict) {
    redirect(buildRedirectUrl("/dashboard/settings", { error: "Este slug já está em uso." }));
  }

  await prisma.$transaction([
    prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug
      }
    }),
    prisma.barbershopProfile.upsert({
      where: { tenantId: session.tenantId },
      update: {
        description: parsed.data.description,
        address: parsed.data.address,
        phone: parsed.data.phone
      },
      create: {
        tenantId: session.tenantId,
        description: parsed.data.description,
        address: parsed.data.address,
        phone: parsed.data.phone
      }
    })
  ]);

  redirect(buildRedirectUrl("/dashboard/settings", { success: "Configurações atualizadas com sucesso." }));
}

export async function updateBusinessHoursAction(formData: FormData) {
  const session = await requireAdminSession();

  await prisma.$transaction(async (tx) => {
    for (let weekday = 0; weekday <= 6; weekday += 1) {
      const parsed = businessHoursSchema.safeParse({
        weekday,
        startTime: getString(formData, `startTime-${weekday}`) || undefined,
        endTime: getString(formData, `endTime-${weekday}`) || undefined
      });

      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Horário inválido.");
      }

      if (!parsed.data.startTime || !parsed.data.endTime) {
        await tx.businessHour.deleteMany({
          where: {
            tenantId: session.tenantId,
            weekday
          }
        });
        continue;
      }

      await tx.businessHour.upsert({
        where: {
          tenantId_weekday: {
            tenantId: session.tenantId,
            weekday
          }
        },
        update: {
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime
        },
        create: {
          tenantId: session.tenantId,
          weekday,
          startTime: parsed.data.startTime,
          endTime: parsed.data.endTime
        }
      });
    }
  });

  redirect(buildRedirectUrl("/dashboard/settings", { success: "Horários atualizados com sucesso." }));
}
