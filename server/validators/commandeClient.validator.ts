import { z } from "zod";

export const CommandeClientItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const CommandeClientCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  items: z.array(CommandeClientItemSchema).min(1, "Au moins un article"),
});

export const CommandeClientUpdateSchema = z.object({
  statut: z.enum(["en_attente", "confirmée", "livrée", "annulée"]).optional(),
});
