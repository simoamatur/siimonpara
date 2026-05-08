import { z } from "zod";

export const FactureItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceHT: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  tva: z.number().min(0).max(100).default(20),
});

export const FactureCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  blId: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(FactureItemSchema).min(1, "Au moins un article"),
});

export const FactureUpdateSchema = z.object({
  statut: z.enum(["payée", "impayée", "partielle"]).optional(),
  dueDate: z.string().optional(),
});
