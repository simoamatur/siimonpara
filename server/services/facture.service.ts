import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const factureService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.facture.findMany({
        ...pagination,
        include: { client: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.facture.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.facture.findUnique({
      where: { id },
      include: { client: true, items: { include: { product: true } }, reglements: { include: { reglement: true } } },
    });
  },

  async generateReference() {
    const last = await prisma.facture.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `FACT-${nextNum.toString().padStart(5, "0")}`;
  },

  async create(data: {
    clientId: string; blId?: string; dueDate?: string;
    items: { productId: string; quantity: number; priceHT: number; discount: number; tva: number }[];
  }) {
    const reference = await this.generateReference();
    let totalHT = 0, totalTVA = 0, totalTTC = 0;

    const factureItems = data.items.map((item) => {
      const lineHT = item.quantity * item.priceHT * (1 - item.discount / 100);
      const lineTVA = lineHT * (item.tva / 100);
      const lineTTC = lineHT + lineTVA;
      totalHT += lineHT; totalTVA += lineTVA; totalTTC += lineTTC;
      return { productId: item.productId, quantity: item.quantity, priceHT: item.priceHT, discount: item.discount, tva: item.tva, totalHT: lineHT, totalTTC: lineTTC };
    });

    return prisma.facture.create({
      data: {
        reference, clientId: data.clientId, blId: data.blId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        totalHT, totalTVA, totalTTC, statut: "impayée",
        items: { create: factureItems },
      },
      include: { items: true, client: true },
    });
  },

  async update(id: string, data: { statut?: string; dueDate?: string }) {
    return prisma.facture.update({
      where: { id },
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : undefined },
    });
  },

  async delete(id: string) {
    return prisma.facture.delete({ where: { id } });
  },
};
