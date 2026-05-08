import { prisma } from "../prisma";
import { PaginationParams } from "../types";

export const reglementService = {
  async list(pagination: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.reglement.findMany({
        ...pagination, include: { client: true, modePaiement: true }, orderBy: { createdAt: "desc" },
      }),
      prisma.reglement.count(),
    ]);
    return { data, total };
  },

  async getById(id: string) {
    return prisma.reglement.findUnique({
      where: { id }, include: { client: true, modePaiement: true, items: { include: { facture: true } } },
    });
  },

  async generateReference() {
    const last = await prisma.reglement.findFirst({ orderBy: { createdAt: "desc" } });
    let nextNum = 1;
    if (last) {
      const parts = last.reference.split("-");
      const num = parseInt(parts[parts.length - 1]);
      if (!isNaN(num)) nextNum = num + 1;
    }
    return `REG-${nextNum.toString().padStart(5, "0")}`;
  },

  async create(data: {
    clientId: string; montant: number; modePaiementId?: string; referenceChèque?: string; userId?: string;
    items: { factureId: string; montantApplique: number }[];
  }) {
    const reference = await this.generateReference();

    return prisma.$transaction(async (tx) => {
      const reglement = await tx.reglement.create({
        data: {
          reference, clientId: data.clientId, montant: data.montant,
          modePaiementId: data.modePaiementId, referenceChèque: data.referenceChèque, userId: data.userId,
          items: { create: data.items },
        },
        include: { items: true, client: true },
      });

      // Mettre à jour le solde client
      const client = await tx.client.findUnique({ where: { id: data.clientId } });
      if (client) {
        const nouveauSolde = client.solde - data.montant;
        await tx.client.update({ where: { id: data.clientId }, data: { solde: nouveauSolde } });
      }

      // Mettre à jour le statut des factures
      for (const item of data.items) {
        const facture = await tx.facture.findUnique({ where: { id: item.factureId }, include: { reglements: true } });
        if (facture) {
          const totalPaye = [...(facture.reglements || []), { montantApplique: item.montantApplique }]
            .reduce((sum, r) => sum + r.montantApplique, item.montantApplique);
          const nouveauStatut = totalPaye >= facture.totalTTC ? "payée" : "partielle";
          await tx.facture.update({ where: { id: item.factureId }, data: { statut: nouveauStatut } });
        }
      }

      return reglement;
    });
  },

  async delete(id: string) {
    return prisma.reglement.delete({ where: { id } });
  },
};
