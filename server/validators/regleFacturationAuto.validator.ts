import { z } from "zod";

export const RegleFacturationAutoCreateSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  jourMois: z.number().int().min(1).max(31).default(1),
  condition: z.string().optional(),
  actif: z.boolean().default(true),
});

export const RegleFacturationAutoUpdateSchema = z.object({
  nom: z.string().optional(),
  jourMois: z.number().int().min(1).max(31).optional(),
  condition: z.string().nullable().optional(),
  actif: z.boolean().optional(),
});
