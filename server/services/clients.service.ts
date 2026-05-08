import { prisma } from "../prisma";
import { PaginationParams } from "../types";

const clientIncludes = {
  ville: { select: { id: true, nom: true } },
  zone: { select: { id: true, nom: true } },
  categorie: { select: { id: true, nom: true } },
  groupeRemise: { select: { id: true, nom: true, taux: true } },
};

export const clientsService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.client.findMany({ ...pagination, orderBy: { createdAt: "desc" }, include: clientIncludes }),
      prisma.client.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.client.findUnique({ where: { id }, include: clientIncludes });
  },

  async create(data: any) {
    return prisma.client.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.client.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.client.delete({ where: { id } });
  },
};
