import { z } from "zod";

export const BonLivraisonItemSchema = z.object({
  productId: z.string().min(1, "ProductId مطلوب"),
  quantity: z.number().int().positive("الكمية يجب أن تكون أكبر من 0"),
  priceHT: z.number().positive("السعر يجب أن يكون موجب"),
  discount: z.number().min(0).max(100).default(0),
  tva: z.number().min(0).max(100).default(20),
});

export const BonLivraisonSchema = z.object({
  clientId: z.string().min(1, "العميل مطلوب"),
  paymentMode: z.enum(["ESPÈCE", "CHÈQUE", "VIREMENT"]).default("ESPÈCE"),
  reference: z.string().optional(),
  validated: z.boolean().default(false),
  items: z.array(BonLivraisonItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
});
