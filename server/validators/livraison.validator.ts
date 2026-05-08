import { z } from "zod";

export const RouteLivraisonCreateSchema = z.object({
  livreurId: z.string().min(1, "Livreur requis"),
  date: z.string().optional(),
});

export const AffectationCreateSchema = z.object({
  routeId: z.string().min(1, "Route requise"),
  bonLivraisonId: z.string().min(1, "BL requis"),
  ordre: z.number().int().default(0),
});

export const AffectationUpdateSchema = z.object({
  statutLivraison: z.enum(["en_attente", "livré", "retourné"]),
  dateLivraison: z.string().optional(),
  motifRetour: z.string().optional(),
});
