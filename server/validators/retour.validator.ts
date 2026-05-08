import { z } from "zod";

export const BonRetourItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceHT: z.number().positive(),
});

export const BonRetourUpdateSchema = z.object({
  motif: z.string().optional(),
});

export const BonRetourCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  blId: z.string().optional(),
  motif: z.string().optional(),
  items: z.array(BonRetourItemSchema).min(1, "Au moins un article"),
});
