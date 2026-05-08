import { z } from "zod";

export const MouvementStockCreateSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  depotId: z.string().optional(),
  type: z.enum(["entrée", "sortie", "correction"]),
  quantite: z.number().int().positive("Quantité doit être positive"),
  prixUnitaire: z.number().positive().optional(),
  documentRef: z.string().optional(),
  motif: z.string().optional(),
});

export const InventaireCreateSchema = z.object({
  depotId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    stockTheorique: z.number().int(),
    stockPhysique: z.number().int(),
  })).min(1, "Au moins un article"),
});

export const InventaireValidateSchema = z.object({
  statut: z.enum(["validé"]),
});
