import { z } from "zod";

export const PromotionCreateSchema = z.object({
  code: z.string().min(1, "Code requis"),
  libelle: z.string().optional(),
  type: z.enum(["remise", "produit_gratuit"]).default("remise"),
  valeur: z.number().positive("Valeur requise"),
  produitId: z.string().optional(),
  dateDebut: z.string().min(1, "Date début requise"),
  dateFin: z.string().min(1, "Date fin requise"),
  actif: z.boolean().default(true),
});

export const PromotionUpdateSchema = z.object({
  code: z.string().optional(),
  libelle: z.string().optional(),
  type: z.enum(["remise", "produit_gratuit"]).optional(),
  valeur: z.number().positive().optional(),
  produitId: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  actif: z.boolean().optional(),
});
