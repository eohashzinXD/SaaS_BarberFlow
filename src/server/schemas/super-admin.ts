import { BillingStatus, Role } from "@prisma/client";
import { z } from "zod";

const slugSchema = z
  .string()
  .min(3, "O slug precisa ter pelo menos 3 caracteres.")
  .max(50, "O slug é muito longo.")
  .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen.");

const optionalString = z.string().trim().max(300).optional();

export const superAdminBarbershopFiltersSchema = z.object({
  query: z.string().trim().optional(),
  status: z
    .enum(["ALL", "ACTIVE", "EXPIRING", "BLOCKED", "EXPIRED", "PENDING_PAYMENT", "CANCELED"])
    .default("ALL")
});

export const superAdminUsersFiltersSchema = z.object({
  query: z.string().trim().optional()
});

export const tenantUpdateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(3, "Informe o nome da barbearia."),
  slug: slugSchema,
  description: z.string().trim().max(1000, "A descrição pode ter no máximo 1000 caracteres.").optional(),
  address: optionalString,
  phone: z.string().trim().max(50).optional(),
  ownerUserId: z.string().trim().optional(),
  ownerName: z.string().trim().min(3, "Informe o nome do responsável.").optional(),
  ownerEmail: z.email("Informe um e-mail válido.").optional()
});

export const tenantSubscriptionSchema = z.object({
  tenantId: z.string().min(1),
  billingStatus: z.nativeEnum(BillingStatus),
  subscriptionStartDate: z.string().trim().optional(),
  subscriptionCurrentPeriodEnd: z.string().trim().optional(),
  gracePeriodDays: z.coerce
    .number()
    .int("A carência deve ser um número inteiro.")
    .min(0, "A carência não pode ser negativa.")
    .max(90, "A carência máxima é de 90 dias.")
});

export const tenantBlockSchema = z.object({
  tenantId: z.string().min(1),
  blockedReason: z.string().trim().max(300, "O motivo pode ter no máximo 300 caracteres.").optional()
});

export const tenantDeleteSchema = z.object({
  tenantId: z.string().min(1)
});

export const userUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(3, "Informe o nome do usuário."),
  email: z.email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha é muito longa.")
    .optional(),
  role: z.nativeEnum(Role),
  tenantId: z.string().trim().optional(),
  isBlocked: z.boolean()
});

export const userToggleBlockSchema = z.object({
  userId: z.string().min(1)
});

export const userDeleteSchema = z.object({
  userId: z.string().min(1)
});
