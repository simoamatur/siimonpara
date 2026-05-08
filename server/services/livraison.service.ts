import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const livraisonService = {
  // Routes
  async listRoutes(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.routeLivraison.findMany({
        ...pagination, include: { livreur: true, affectations: { include: { bonLivraison: { include: { client: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.routeLivraison.count(),
    ]);
    return { data, total };
  },

  async getRouteById(id: string) {
    return prisma.routeLivraison.findUnique({
      where: { id }, include: { livreur: true, affectations: { include: { bonLivraison: { include: { client: true } }, user: true } } },
    });
  },

  async generateRouteReference() {
    const last = await prisma.routeLivraison.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `DR-${nextNum.toString().padStart(5, "0")}`;
  },

  async createRoute(data: { livreurId: string; date?: string }) {
    const reference = await this.generateRouteReference();
    return prisma.routeLivraison.create({
      data: { reference, livreurId: data.livreurId, date: data.date ? new Date(data.date) : undefined },
      include: { livreur: true },
    });
  },

  async updateRouteStatus(id: string, statut: string) {
    return prisma.routeLivraison.update({ where: { id }, data: { statut } });
  },

  // Affectations
  async listAffectations(routeId: string) {
    return prisma.documentAffectation.findMany({
      where: { routeId },
      include: { bonLivraison: { include: { client: true } } },
      orderBy: { ordre: "asc" },
    });
  },

  async createAffectation(data: { routeId: string; bonLivraisonId: string; ordre?: number }) {
    const maxOrdre = await prisma.documentAffectation.aggregate({
      where: { routeId: data.routeId },
      _max: { ordre: true },
    });
    return prisma.documentAffectation.create({
      data: {
        routeId: data.routeId, bonLivraisonId: data.bonLivraisonId,
        ordre: data.ordre ?? (maxOrdre._max.ordre ?? -1) + 1,
      },
      include: { bonLivraison: { include: { client: true } } },
    });
  },

  async updateAffectationStatus(id: string, data: { statutLivraison: string; dateLivraison?: string; motifRetour?: string; userId?: string }) {
    return prisma.documentAffectation.update({
      where: { id },
      data: {
        statutLivraison: data.statutLivraison,
        dateLivraison: data.dateLivraison ? new Date(data.dateLivraison) : undefined,
        motifRetour: data.motifRetour, userId: data.userId,
      },
    });
  },

  async removeAffectation(id: string) {
    return prisma.documentAffectation.delete({ where: { id } });
  },

  // État livreur
  async getLivreurStats(livreurId: string, dateDebut?: Date, dateFin?: Date) {
    const where: any = { livreurId };
    if (dateDebut || dateFin) {
      where.date = {};
      if (dateDebut) where.date.gte = dateDebut;
      if (dateFin) where.date.lte = dateFin;
    }
    const routes = await prisma.routeLivraison.findMany({ where, include: { affectations: true } });
    const totalLivres = routes.reduce((sum, r) => sum + r.affectations.filter(a => a.statutLivraison === "livré").length, 0);
    const totalRetournes = routes.reduce((sum, r) => sum + r.affectations.filter(a => a.statutLivraison === "retourné").length, 0);
    return { routes: routes.length, totalLivres, totalRetournes };
  },
};
