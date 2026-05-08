import { z } from "zod";

// Demande de Prix
export const DemandePrixItemSchema = z.object({
  productId: z.string().min(1),
  quantite: z.number().int().positive(),
  prixPropose: z.number().positive().optional(),
});

export const DemandePrixCreateSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  items: z.array(DemandePrixItemSchema).min(1, "Au moins un article"),
});

// Bon de Réception
export const BonReceptionItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceHT: z.number().positive(),
});

export const BonReceptionCreateSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  depotId: z.string().optional(),
  items: z.array(BonReceptionItemSchema).min(1, "Au moins un article"),
});

// Facture Fournisseur
export const FactureFournisseurItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceHT: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  tva: z.number().min(0).max(100).default(20),
});

export const FactureFournisseurCreateSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  dueDate: z.string().optional(),
  items: z.array(FactureFournisseurItemSchema).min(1, "Au moins un article"),
});

// Retour Fournisseur
export const RetourFournisseurItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  priceHT: z.number().positive(),
});

export const RetourFournisseurCreateSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  motif: z.string().optional(),
  items: z.array(RetourFournisseurItemSchema).min(1),
});

// Avoir Fournisseur
export const AvoirFournisseurItemSchema = z.object({
  productId: z.string().min(1),
  montant: z.number().positive(),
});

export const AvoirFournisseurCreateSchema = z.object({
  fournisseurId: z.string().min(1, "Fournisseur requis"),
  retourId: z.string().optional(),
  items: z.array(AvoirFournisseurItemSchema).min(1),
});

// Règlement Fournisseur
export const ReglementFournisseurItemSchema = z.object({
  factureId: z.string().min(1),
  montantApplique: z.number().positive(),
});

export const ReglementFournisseurCreateSchema = z.object({
  fournisseurId: z.string().min(1),
  montant: z.number().positive(),
  modePaiementId: z.string().optional(),
  referenceChèque: z.string().optional(),
  items: z.array(ReglementFournisseurItemSchema).min(1),
});
