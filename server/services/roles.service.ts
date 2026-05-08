import { prisma } from "../prisma";

export const rolesService = {
  async list(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { libelle: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.role.findMany({ where, orderBy: { createdAt: "desc" } });
  },

  async getById(id: string) {
    return prisma.role.findUnique({ where: { id } });
  },

  async create(data: { code: string; libelle: string; description?: string; permissions?: any }) {
    return prisma.role.create({ data: { ...data, permissions: data.permissions || [] } });
  },

  async update(id: string, data: { code?: string; libelle?: string; description?: string; permissions?: any }) {
    return prisma.role.update({ where: { id }, data });
  },

  async remove(id: string) {
    return prisma.role.delete({ where: { id } });
  },
};
