import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const avoirService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.bonAvoir.findMany({
        ...pagination, include: { client: true }, orderBy: { createdAt: "desc" },
      }),
      prisma.bonAvoir.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.bonAvoir.findUnique({
      where: { id }, include: { client: true, items: { include: { product: true } }, retour: true },
    });
  },

  async generateReference() {
    const last = await prisma.bonAvoir.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `AVOIR-${nextNum.toString().padStart(5, "0")}`;
  },

  async update(id: string, data: { utilise?: boolean }) {
    return prisma.bonAvoir.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.bonAvoir.delete({ where: { id } });
  },

  async create(data: {
    clientId: string; retourId?: string;
    items: { productId: string; montant: number }[];
  }) {
    const reference = await this.generateReference();
    const totalTTC = data.items.reduce((sum, i) => sum + i.montant, 0);

    return prisma.bonAvoir.create({
      data: {
        reference, clientId: data.clientId, retourId: data.retourId, totalTTC,
        items: { create: data.items },
      },
      include: { items: true, client: true },
    });
  },
};
