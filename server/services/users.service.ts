import { prisma } from "../prisma";
import bcrypt from "bcryptjs";

export const usersService = {
  async list(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async create(data: { name: string; email: string; password: string; role?: string }) {
    const hashed = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed, role: data.role || "USER" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async update(id: string, data: { name?: string; email?: string; role?: string; password?: string; isActive?: boolean }) {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }
    return prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  },

  async remove(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
