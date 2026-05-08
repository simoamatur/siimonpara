import { z } from "zod";

export const BonAvoirItemSchema = z.object({
  productId: z.string().min(1),
  montant: z.number().positive(),
});

export const BonAvoirUpdateSchema = z.object({
  utilise: z.boolean().optional(),
});

export const BonAvoirCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  retourId: z.string().optional(),
  items: z.array(BonAvoirItemSchema).min(1, "Au moins un article"),
});
