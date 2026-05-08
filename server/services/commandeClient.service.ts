import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const commandeClientService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.commandeClient.findMany({
        ...pagination,
        include: { client: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.commandeClient.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.commandeClient.findUnique({
      where: { id },
      include: { client: true, items: { include: { product: true } } },
    });
  },

  async generateReference() {
    const last = await prisma.commandeClient.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `CMD-${nextNum.toString().padStart(5, "0")}`;
  },

  async create(data: { clientId: string; items: { productId: string; quantity: number }[] }) {
    const reference = await this.generateReference();
    let totalHT = 0, totalTTC = 0;

    const items = [];
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const priceHT = product?.sellPrice || 0;
      const lineHT = item.quantity * priceHT;
      totalHT += lineHT;
      items.push({ productId: item.productId, quantity: item.quantity, priceHT, totalHT: lineHT, totalTTC: lineHT });
    }
    totalTTC = totalHT;

    return prisma.commandeClient.create({
      data: {
        reference, clientId: data.clientId, totalHT, totalTTC, statut: "en_attente",
        items: { create: items },
      },
      include: { items: { include: { product: true } }, client: true },
    });
  },

  async update(id: string, data: { statut?: string }) {
    return prisma.commandeClient.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.commandeClient.delete({ where: { id } });
  },
};
