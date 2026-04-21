import { z } from "zod";

export const barberSchema = z.object({
  name: z.string().min(2, "Informe o nome do barbeiro.")
});
