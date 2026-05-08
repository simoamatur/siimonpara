import { z } from "zod";

export const ClientSchema = z.object({
  code: z.string().min(1, "Code requis"),
  name: z.string().min(1, "Nom requis"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zoneId: z.string().optional(),
  categorieId: z.string().optional(),
  groupeRemiseId: z.string().optional(),
  discountRate: z.number().min(0).max(100).default(0),
  creditPlafond: z.number().min(0).default(0),
});

export const ClientUpdateSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zoneId: z.string().optional(),
  categorieId: z.string().optional(),
  groupeRemiseId: z.string().optional(),
  discountRate: z.number().min(0).max(100).optional(),
  creditPlafond: z.number().min(0).optional(),
  isActif: z.boolean().optional(),
});
