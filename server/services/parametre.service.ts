import { prisma } from "../prisma";
import { PaginationParams } from "../types";

// Generic CRUD factory
const createService = (model: any, orderBy = { id: "asc" as const }) => ({
  async list(p: PaginationParams) {
    const [data, total] = await Promise.all([
      model.findMany({ ...p, orderBy }), model.count(),
    ]);
    return { data, total };
  },
  async getById(id: string) { return model.findUnique({ where: { id } }); },
  async create(data: any) { return model.create({ data }); },
  async update(id: string, data: any) { return model.update({ where: { id }, data }); },
  async delete(id: string) { return model.delete({ where: { id } }); },
});

export const parametreService = {
  ville: createService(prisma.ville),
  zone: createService(prisma.zone),
  famille: createService(prisma.famille),
  sousFamille: createService(prisma.sousFamille),
  tva: createService(prisma.tVA),
  depot: createService(prisma.depot),
  categorieClient: createService(prisma.categorieClient),
  groupeRemise: createService(prisma.groupeRemise),
  livreur: createService(prisma.livreur),
  modeReglement: createService(prisma.modeReglement),

  async getZonesByVille(villeId: string) {
    return prisma.zone.findMany({ where: { villeId } });
  },

  async getSousFamillesByFamille(familleId: string) {
    return prisma.sousFamille.findMany({ where: { familleId } });
  },

  // Nomenclature (BOM avec items)
  async listNomenclatures(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.nomenclature.findMany({ ...p, include: { items: true }, orderBy: { createdAt: "desc" as const } }),
      prisma.nomenclature.count(),
    ]);
    return { data, total };
  },
  async getNomenclature(id: string) {
    return prisma.nomenclature.findUnique({ where: { id }, include: { items: true } });
  },
  async createNomenclature(data: any) {
    const { items, ...nomenclatureData } = data;
    const coutTotal = items?.reduce((sum: number, item: any) => sum + (item.montant || item.qte * item.puht), 0) || 0;
    return prisma.nomenclature.create({
      data: { ...nomenclatureData, coutTotal, items: items ? { create: items } : undefined },
      include: { items: true },
    });
  },
  async updateNomenclature(id: string, data: any) {
    const { items, ...nomenclatureData } = data;
    const coutTotal = items?.reduce((sum: number, item: any) => sum + (item.montant || item.qte * item.puht), 0) || 0;
    return prisma.$transaction(async (tx) => {
      await tx.nomenclatureItem.deleteMany({ where: { nomenclatureId: id } });
      return tx.nomenclature.update({
        where: { id },
        data: { ...nomenclatureData, coutTotal, items: items ? { create: items } : undefined },
        include: { items: true },
      });
    });
  },
  async deleteNomenclature(id: string) {
    return prisma.nomenclature.delete({ where: { id } });
  },

  // Fournisseur (CRUD spécifique)
  async listFournisseurs(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.fournisseur.findMany({ ...p, include: { ville: true }, orderBy: { createdAt: "desc" } }),
      prisma.fournisseur.count(),
    ]);
    return { data, total };
  },
  async getFournisseur(id: string) {
    return prisma.fournisseur.findUnique({ where: { id }, include: { ville: true, zone: true } });
  },
  async createFournisseur(data: any) { return prisma.fournisseur.create({ data }); },
  async updateFournisseur(id: string, data: any) { return prisma.fournisseur.update({ where: { id }, data }); },
};
