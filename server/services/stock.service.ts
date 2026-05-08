import { prisma } from "../prisma";
import { PaginationParams } from "../types";

const generateRef = async (model: any, prefix: string) => {
  const last = await model.findFirst({ orderBy: { createdAt: "desc" } });
  let n = 1;
  if (last) { const p = last.reference.split("-"); const x = parseInt(p[p.length - 1]); if (!isNaN(x)) n = x + 1; }
  return `${prefix}-${n.toString().padStart(5, "0")}`;
};

export const stockService = {
  // Mouvements
  async listMouvements(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.mouvementStock.findMany({ ...p, include: { product: true, depot: true }, orderBy: { date: "desc" } }),
      prisma.mouvementStock.count(),
    ]);
    return { data, total };
  },
  async createMouvement(data: { productId: string; depotId?: string; type: string; quantite: number; prixUnitaire?: number; documentRef?: string; motif?: string; userId?: string }) {
    return prisma.$transaction(async (tx) => {
      const m = await tx.mouvementStock.create({ data });
      if (data.type === "entrée") {
        await tx.product.update({ where: { id: data.productId }, data: { stock: { increment: data.quantite } } });
      } else if (data.type === "sortie") {
        await tx.product.update({ where: { id: data.productId }, data: { stock: { decrement: data.quantite } } });
      }
      return m;
    });
  },

  // Inventaires
  async listInventaires(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.inventaire.findMany({ ...p, include: { depot: true }, orderBy: { date: "desc" } }),
      prisma.inventaire.count(),
    ]);
    return { data, total };
  },
  async getInventaire(id: string) {
    return prisma.inventaire.findUnique({ where: { id }, include: { depot: true, items: { include: { product: true } } } });
  },
  async createInventaire(data: { depotId?: string; items: { productId: string; stockTheorique: number; stockPhysique: number }[]; userId?: string }) {
    const reference = await generateRef(prisma.inventaire, "INV");
    const items = data.items.map(i => ({ ...i, ecart: i.stockPhysique - i.stockTheorique }));
    return prisma.inventaire.create({
      data: { reference, depotId: data.depotId, userId: data.userId, items: { create: items } },
      include: { items: true },
    });
  },
  async validateInventaire(id: string) {
    return prisma.$transaction(async (tx) => {
      const inv = await tx.inventaire.findUnique({ where: { id }, include: { items: true } });
      if (!inv) throw new Error("Inventaire non trouvé");
      for (const i of inv.items) {
        await tx.product.update({ where: { id: i.productId }, data: { stock: i.stockPhysique } });
        await tx.mouvementStock.create({
          data: { productId: i.productId, depotId: inv.depotId || undefined, type: "correction", quantite: Math.abs(i.ecart), documentRef: inv.reference, motif: `Correction inventaire: ${i.ecart > 0 ? "+" : ""}${i.ecart}` },
        });
      }
      return tx.inventaire.update({ where: { id }, data: { statut: "validé" } });
    });
  },
};
