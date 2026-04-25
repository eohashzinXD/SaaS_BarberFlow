import { BillingStatus, PrismaClient, Role } from "@prisma/client";
import { addMonths } from "date-fns";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123456", 10);
  const superAdminPasswordHash = await bcrypt.hash("superadmin123", 10);
  const subscriptionStartDate = new Date();
  const subscriptionCurrentPeriodEnd = addMonths(new Date(), 1);

  const tenant = await prisma.tenant.upsert({
    where: { slug: "barbearia-demo" },
    update: {
      name: "Barbearia Demo",
      billingStatus: BillingStatus.ACTIVE,
      subscriptionStartDate,
      subscriptionCurrentPeriodEnd
    },
    create: {
      name: "Barbearia Demo",
      slug: "barbearia-demo",
      billingStatus: BillingStatus.ACTIVE,
      subscriptionStartDate,
      subscriptionCurrentPeriodEnd,
      profile: {
        create: {
          description:
            "Cortes clássicos e contemporâneos com atendimento pontual e agenda online.",
          address: "Rua das Tesouras, 123 - Centro",
          phone: "(11) 99999-0000"
        }
      }
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {
      name: "Administrador Demo",
      passwordHash,
      tenantId: tenant.id,
      role: Role.ADMIN
    },
    create: {
      name: "Administrador Demo",
      email: "admin@demo.com",
      passwordHash,
      tenantId: tenant.id,
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: "superadmin@barbersaas.com" },
    update: {
      name: "Super Admin",
      passwordHash: superAdminPasswordHash,
      tenantId: null,
      role: Role.SUPER_ADMIN,
      isBlocked: false,
      blockedAt: null
    },
    create: {
      name: "Super Admin",
      email: "superadmin@barbersaas.com",
      passwordHash: superAdminPasswordHash,
      tenantId: null,
      role: Role.SUPER_ADMIN
    }
  });

  const barbers = await Promise.all(
    ["Rafael Cortez", "Lucas Navalha"].map(async (name) => {
      const existing = await prisma.barber.findFirst({
        where: {
          tenantId: tenant.id,
          name
        }
      });

      if (existing) {
        return prisma.barber.update({
          where: { id: existing.id },
          data: { name }
        });
      }

      return prisma.barber.create({
        data: {
          name,
          tenantId: tenant.id
        }
      });
    })
  );

  const services = [
    {
      name: "Corte Tradicional",
      description: "Acabamento na tesoura e máquina com finalização.",
      durationMinutes: 45,
      price: "55.00"
    },
    {
      name: "Barba Completa",
      description: "Modelagem, toalha quente e acabamento premium.",
      durationMinutes: 30,
      price: "40.00"
    },
    {
      name: "Combo Corte + Barba",
      description: "Serviço completo para quem quer resolver tudo em uma visita.",
      durationMinutes: 75,
      price: "85.00"
    }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: service.name
      }
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service
      });
      continue;
    }

    await prisma.service.create({
      data: {
        tenantId: tenant.id,
        ...service
      }
    });
  }

  const weekdays = [
    { weekday: 1, startTime: "09:00", endTime: "19:00" },
    { weekday: 2, startTime: "09:00", endTime: "19:00" },
    { weekday: 3, startTime: "09:00", endTime: "19:00" },
    { weekday: 4, startTime: "09:00", endTime: "19:00" },
    { weekday: 5, startTime: "09:00", endTime: "19:00" },
    { weekday: 6, startTime: "08:00", endTime: "16:00" }
  ];

  for (const hour of weekdays) {
    await prisma.businessHour.upsert({
      where: {
        tenantId_weekday: {
          tenantId: tenant.id,
          weekday: hour.weekday
        }
      },
      update: {
        startTime: hour.startTime,
        endTime: hour.endTime
      },
      create: {
        tenantId: tenant.id,
        weekday: hour.weekday,
        startTime: hour.startTime,
        endTime: hour.endTime
      }
    });
  }

  const firstBarber = barbers[0];
  const firstService = await prisma.service.findFirstOrThrow({
    where: { tenantId: tenant.id, name: "Corte Tradicional" }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      customerEmail: "cliente@demo.com",
      startAt: tomorrow
    }
  });

  if (existingAppointment) {
    await prisma.appointment.update({
      where: { id: existingAppointment.id },
      data: {
        barberId: firstBarber.id,
        serviceId: firstService.id,
        customerName: "Carlos Demo",
        endAt: new Date(tomorrow.getTime() + firstService.durationMinutes * 60_000)
      }
    });
  } else {
    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        barberId: firstBarber.id,
        serviceId: firstService.id,
        customerName: "Carlos Demo",
        customerEmail: "cliente@demo.com",
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + firstService.durationMinutes * 60_000)
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
