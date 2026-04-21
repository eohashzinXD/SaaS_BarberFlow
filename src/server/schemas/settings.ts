import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(3, "Informe o nome da barbearia."),
  slug: z
    .string()
    .min(3, "O slug precisa ter pelo menos 3 caracteres.")
    .max(50, "O slug é muito longo.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  description: z.string().max(500, "A descrição é muito longa.").optional(),
  address: z.string().max(250, "O endereço é muito longo.").optional(),
  phone: z.string().max(40, "O telefone é muito longo.").optional()
});

export const businessHoursSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().optional(),
  endTime: z.string().optional()
});
