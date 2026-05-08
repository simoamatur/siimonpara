import { z } from "zod";

export const VilleSchema = z.object({ nom: z.string().min(1, "Nom requis") });

export const ZoneSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  villeId: z.string().min(1, "Ville requise"),
});

export const FamilleSchema = z.object({ nom: z.string().min(1, "Nom requis") });

export const SousFamilleSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  familleId: z.string().min(1, "Famille requise"),
});

export const TVASchema = z.object({
  taux: z.number().min(0).max(100),
  libelle: z.string().min(1),
});

export const DepotSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  adresse: z.string().optional(),
});

export const CategorieClientSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
});

export const GroupeRemiseSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  taux: z.number().min(0).max(100).default(0),
});

export const LivreurSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  telephone: z.string().optional(),
  vehicule: z.string().optional(),
  zoneId: z.string().optional(),
  isActif: z.boolean().default(true),
});

export const ModeReglementSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
});

export const NomenclatureItemSchema = z.object({
  codeEnfant: z.string().min(1, "Code article requis"),
  libelleEnfant: z.string().min(1, "Libellé requis"),
  unite: z.string().default("U"),
  qte: z.number().min(1, "Quantité >= 1"),
  puht: z.number().min(0, "Prix >= 0"),
  montant: z.number().default(0),
});

export const NomenclatureSchema = z.object({
  code: z.string().min(1, "Code requis"),
  libelle: z.string().min(1, "Libellé requis"),
  famille: z.string().optional(),
  unite: z.string().default("U"),
  items: z.array(NomenclatureItemSchema).default([]),
});

export const FournisseurSchema = z.object({
  code: z.string().min(1, "Code requis"),
  nom: z.string().min(1, "Nom requis"),
  email: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  villeId: z.string().optional(),
  zoneId: z.string().optional(),
});

export const ClientUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  villeId: z.string().optional(),
  zoneId: z.string().optional(),
  categorieId: z.string().optional(),
  groupeRemiseId: z.string().optional(),
  discountRate: z.number().min(0).max(100).optional(),
});
