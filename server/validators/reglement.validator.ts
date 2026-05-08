import { z } from "zod";

export const ReglementItemSchema = z.object({
  factureId: z.string().min(1),
  montantApplique: z.number().positive(),
});

export const ReglementCreateSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  montant: z.number().positive("Montant doit être positif"),
  modePaiementId: z.string().optional(),
  referenceChèque: z.string().optional(),
  items: z.array(ReglementItemSchema).min(1, "Au moins une facture"),
});
