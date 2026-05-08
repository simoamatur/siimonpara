import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import { config } from "../config";
import { logger } from "../logger";

export const authService = {
  async register(email: string, password: string, name: string, role?: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || "USER" },
    });
    return { id: user.id, email: user.email };
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null;
    }
    const token = jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      config.JWT_SECRET,
      { expiresIn: "8h" }
    );
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async clientLogin(email: string, password: string) {
    const client = await prisma.client.findFirst({ where: { email } });
    if (!client || !client.password || !(await bcrypt.compare(password, client.password))) {
      return null;
    }
    if (!client.isActif) return null;
    const token = jwt.sign(
      { clientId: client.id, role: "client", name: client.name },
      config.JWT_SECRET,
      { expiresIn: "8h" }
    );
    return {
      token,
      user: { id: client.id, email: client.email, name: client.name, role: "client" },
    };
  },

  async getClientProfile(clientId: string) {
    return prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, code: true, name: true, email: true, phone: true, address: true, city: true, solde: true, creditPlafond: true, isActif: true },
    });
  },

  async checkUserExists(email: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn(`User already exists: ${email}`);
      return true;
    }
    return false;
  },
};
