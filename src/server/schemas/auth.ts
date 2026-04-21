import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha é muito longa.");

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: passwordSchema
});

export const registerSchema = z.object({
  ownerName: z.string().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido."),
  password: passwordSchema,
  barbershopName: z.string().min(3, "Informe o nome da barbearia."),
  slug: z
    .string()
    .min(3, "O slug precisa ter pelo menos 3 caracteres.")
    .max(50, "O slug é muito longo.")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen.")
});

export const registerSuccessQuerySchema = z.object({
  signup_id: z.string().min(1)
});
