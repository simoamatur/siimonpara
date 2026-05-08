import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const promotionService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.promotion.findMany({
        ...pagination,
        include: { produit: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.promotion.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.promotion.findUnique({
      where: { id },
      include: { produit: { select: { id: true, name: true, sellPrice: true } } },
    });
  },

  async create(data: any) {
    return prisma.promotion.create({
      data: {
        code: data.code,
        libelle: data.libelle,
        type: data.type,
        valeur: data.valeur,
        produitId: data.produitId,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        actif: data.actif,
      },
    });
  },

  async update(id: string, data: any) {
    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.libelle !== undefined) updateData.libelle = data.libelle;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.valeur !== undefined) updateData.valeur = data.valeur;
    if (data.produitId !== undefined) updateData.produitId = data.produitId;
    if (data.dateDebut !== undefined) updateData.dateDebut = new Date(data.dateDebut);
    if (data.dateFin !== undefined) updateData.dateFin = new Date(data.dateFin);
    if (data.actif !== undefined) updateData.actif = data.actif;
    return prisma.promotion.update({ where: { id }, data: updateData });
  },

  async delete(id: string) {
    return prisma.promotion.delete({ where: { id } });
  },
};
