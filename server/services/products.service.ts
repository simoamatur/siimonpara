import { prisma } from "../prisma";
import { PaginationParams } from "../types";

const productIncludes = {
  famille: { select: { id: true, nom: true } },
  sousFamille: { select: { id: true, nom: true } },
  tva: { select: { id: true, taux: true, libelle: true } },
  depot: { select: { id: true, nom: true } },
};

export const productsService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.product.findMany({ ...pagination, orderBy: { createdAt: "desc" }, include: productIncludes }),
      prisma.product.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: productIncludes });
  },

  async create(data: any) {
    return prisma.product.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.product.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },
};
