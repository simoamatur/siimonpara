import { prisma } from "../prisma";

interface CreateBLItem {
  productId: string;
  quantity: number;
  priceHT: number;
  discount: number;
  tva: number;
}

interface CreateBLData {
  clientId: string;
  userId: string;
  paymentMode: string;
  reference?: string;
  validated: boolean;
  items: CreateBLItem[];
}

export const bonLivraisonService = {
  async list(pagination: { skip: number; take: number }) {
    const [data, total] = await Promise.all([
      prisma.bonLivraison.findMany({
        ...pagination,
        include: { client: true, user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bonLivraison.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.bonLivraison.findUnique({
      where: { id },
      include: { client: true, items: { include: { product: true } } },
    });
  },

  async delete(id: string) {
    return prisma.bonLivraison.delete({ where: { id } });
  },

  async updateValidation(id: string, validated: boolean) {
    return prisma.bonLivraison.update({
      where: { id },
      data: { validated },
    });
  },

  async generateReference() {
    const lastBL = await prisma.bonLivraison.findFirst({
      orderBy: { createdAt: "desc" },
    });
    let nextNum = 1;
    if (lastBL) {
      const parts = lastBL.reference.split("-");
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    return `BL-${nextNum.toString().padStart(5, "0")}`;
  },

  async create(data: CreateBLData) {
    const reference = data.reference || (await this.generateReference());

    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;

    const blItems = data.items.map((item) => {
      const lineHT = item.quantity * item.priceHT * (1 - item.discount / 100);
      const lineTVA = lineHT * (item.tva / 100);
      const lineTTC = lineHT + lineTVA;
      totalHT += lineHT;
      totalTVA += lineTVA;
      totalTTC += lineTTC;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceHT: item.priceHT,
        discount: item.discount,
        tva: item.tva,
        totalHT: lineHT,
        totalTTC: lineTTC,
      };
    });

    return prisma.$transaction(async (tx) => {
      const created = await tx.bonLivraison.create({
        data: {
          reference,
          clientId: data.clientId,
          userId: data.userId,
          paymentMode: data.paymentMode,
          totalHT,
          totalTVA,
          totalTTC,
          validated: data.validated,
          items: { create: blItems },
        },
        include: { items: true },
      });

      for (const item of blItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });
  },
};
