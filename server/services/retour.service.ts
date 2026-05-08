import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const retourService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.bonRetour.findMany({
        ...pagination, include: { client: true }, orderBy: { createdAt: "desc" },
      }),
      prisma.bonRetour.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.bonRetour.findUnique({
      where: { id },
      include: { client: true, items: { include: { product: true } }, bonsAvoir: true },
    });
  },

  async generateReference() {
    const last = await prisma.bonRetour.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `RET-${nextNum.toString().padStart(5, "0")}`;
  },

  async update(id: string, data: { motif?: string }) {
    return prisma.bonRetour.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.bonRetour.delete({ where: { id } });
  },

  async create(data: {
    clientId: string; blId?: string; motif?: string;
    items: { productId: string; quantity: number; priceHT: number }[];
  }) {
    const reference = await this.generateReference();
    let totalHT = 0, totalTTC = 0;

    const retourItems = data.items.map((item) => {
      const lineHT = item.quantity * item.priceHT;
      totalHT += lineHT; totalTTC += lineHT;
      return { productId: item.productId, quantity: item.quantity, priceHT: item.priceHT, totalHT: lineHT, totalTTC: lineHT };
    });

    return prisma.bonRetour.create({
      data: {
        reference, clientId: data.clientId, blId: data.blId, motif: data.motif,
        totalHT, totalTTC, items: { create: retourItems },
      },
      include: { items: true, client: true },
    });
  },
};
