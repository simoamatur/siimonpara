import { z } from "zod";

export const ProductSchema = z.object({
  code: z.string().min(1, "Code requis"),
  name: z.string().min(1, "Nom requis"),
  brand: z.string().optional(),
  familleId: z.string().optional(),
  sousFamilleId: z.string().optional(),
  tvaId: z.string().optional(),
  depotId: z.string().optional(),
  unit: z.string().default("Unité"),
  buyPrice: z.number().min(0).default(0),
  sellPrice: z.number().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  stockMin: z.number().int().min(0).default(0),
});

export const ProductUpdateSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  brand: z.string().optional(),
  familleId: z.string().optional(),
  sousFamilleId: z.string().optional(),
  tvaId: z.string().optional(),
  depotId: z.string().optional(),
  unit: z.string().optional(),
  buyPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  stockMin: z.number().int().min(0).optional(),
  isActif: z.boolean().optional(),
});
