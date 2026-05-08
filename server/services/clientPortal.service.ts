import { prisma } from "../prisma";

export const clientPortalService = {
  async getDashboard(clientId: string) {
    const [totalOrders, totalSpentResult, factures, client] = await Promise.all([
      prisma.commandeClient.count({ where: { clientId } }),
      prisma.commandeClient.aggregate({ where: { clientId, statut: { not: "annulée" } }, _sum: { totalTTC: true } }),
      prisma.facture.findMany({ where: { clientId, statut: { in: ["impayée", "partielle"] } }, select: { id: true, reference: true, totalTTC: true, dueDate: true, statut: true } }),
      prisma.client.findUnique({ where: { id: clientId }, select: { solde: true, creditPlafond: true, name: true } }),
    ]);

    const totalSpent = totalSpentResult._sum.totalTTC || 0;
    const pendingOrders = await prisma.commandeClient.count({ where: { clientId, statut: { in: ["en_attente", "confirmée"] } } });
    const deliveredOrders = await prisma.commandeClient.count({ where: { clientId, statut: "livrée" } });

    const recentOrders = await prisma.commandeClient.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reference: true, date: true, statut: true, totalTTC: true, _count: { select: { items: true } } },
    });

    const activePromotions = await prisma.promotion.findMany({
      where: { actif: true, dateFin: { gte: new Date() } },
      take: 3,
      orderBy: { dateFin: "asc" },
    });

    return {
      name: client?.name || "",
      totalOrders,
      totalSpent,
      pendingOrders,
      deliveredOrders,
      unpaidInvoices: factures.length,
      creditLimit: client?.creditPlafond || 0,
      currentBalance: client?.solde || 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        reference: o.reference,
        date: o.date,
        status: o.statut,
        total: o.totalTTC,
        items: o._count.items,
      })),
      unpaidInvoicesList: factures.map((f) => ({
        id: f.id,
        reference: f.reference,
        dueDate: f.dueDate,
        amount: f.totalTTC,
        status: f.statut,
      })),
      promotions: activePromotions.map((p) => ({
        id: p.id,
        title: p.libelle || p.code,
        validUntil: p.dateFin,
        code: p.code,
      })),
    };
  },

  async listProducts(search?: string) {
    const where: any = { isActif: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.product.findMany({ where, orderBy: { name: "asc" }, select: { id: true, code: true, name: true, sellPrice: true, buyPrice: true, stock: true } });
  },

  async getProductById(id: string) {
    return prisma.product.findUnique({ where: { id }, select: { id: true, code: true, name: true, sellPrice: true, buyPrice: true, stock: true } });
  },

  async listCommandes(clientId: string) {
    return prisma.commandeClient.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { items: true } } },
    });
  },

  async getCommande(id: string, clientId: string) {
    return prisma.commandeClient.findFirst({
      where: { id, clientId },
      include: { items: { include: { product: { select: { id: true, name: true, code: true } } } } },
    });
  },

  async createCommande(clientId: string, items: { productId: string; quantity: number; priceHT: number }[]) {
    const totalHT = items.reduce((s, i) => s + i.priceHT * i.quantity, 0);
    const totalTTC = totalHT;
    const count = await prisma.commandeClient.count();
    const reference = `CMD-${String(count + 1).padStart(4, "0")}`;
    return prisma.commandeClient.create({
      data: {
        reference,
        clientId,
        totalHT,
        totalTTC,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            priceHT: i.priceHT,
            totalHT: i.priceHT * i.quantity,
            totalTTC: i.priceHT * i.quantity,
          })),
        },
      },
      include: { items: { include: { product: { select: { id: true, name: true, code: true } } } } },
    });
  },

  async listPromotions() {
    const now = new Date();
    return prisma.promotion.findMany({
      where: { actif: true, dateFin: { gte: now } },
      orderBy: { dateFin: "asc" },
      include: { produit: { select: { id: true, name: true, sellPrice: true } } },
    });
  },

  async updateProfile(clientId: string, data: { name?: string; email?: string; phone?: string; address?: string; city?: string }) {
    return prisma.client.update({ where: { id: clientId }, data, select: { id: true, code: true, name: true, email: true, phone: true, address: true, city: true, solde: true, creditPlafond: true } });
  },
};
