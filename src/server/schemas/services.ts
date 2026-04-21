import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(2, "Informe o nome do serviço."),
  description: z.string().max(400, "A descrição é muito longa.").optional(),
  durationMinutes: z.coerce
    .number()
    .int("Use minutos inteiros.")
    .min(10, "A duração mínima é 10 minutos.")
    .max(240, "A duração máxima é 240 minutos."),
  price: z
    .string()
    .regex(/^\d+([.,]\d{1,2})?$/, "Informe um preço válido.")
});
