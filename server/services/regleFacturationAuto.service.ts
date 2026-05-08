import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const regleFacturationAutoService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.regleFacturationAuto.findMany({
        ...pagination,
        orderBy: { createdAt: "desc" },
      }),
      prisma.regleFacturationAuto.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.regleFacturationAuto.findUnique({ where: { id } });
  },

  async create(data: any) {
    return prisma.regleFacturationAuto.create({
      data: { nom: data.nom, jourMois: data.jourMois, condition: data.condition, actif: data.actif },
    });
  },

  async update(id: string, data: any) {
    return prisma.regleFacturationAuto.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.regleFacturationAuto.delete({ where: { id } });
  },
};
