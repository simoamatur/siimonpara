import { prisma } from "../prisma";
import { PaginationParams } from "../types";

const generateRef = async (model: any, prefix: string) => {
  const last = await model.findFirst({ orderBy: { createdAt: "desc" } });
  let n = 1;
  if (last) { const p = last.reference.split("-"); const x = parseInt(p[p.length - 1]); if (!isNaN(x)) n = x + 1; }
  return `${prefix}-${n.toString().padStart(5, "0")}`;
};

export const achatService = {
  // Demande de Prix
  async listDemandes(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.demandePrix.findMany({ ...p, include: { fournisseur: true }, orderBy: { createdAt: "desc" } }),
      prisma.demandePrix.count(),
    ]);
    return { data, total };
  },
  async getDemande(id: string) {
    return prisma.demandePrix.findUnique({ where: { id }, include: { fournisseur: true, items: { include: { product: true } } } });
  },
  async createDemande(data: { fournisseurId: string; items: { productId: string; quantite: number; prixPropose?: number }[] }) {
    const reference = await generateRef(prisma.demandePrix, "DP");
    return prisma.demandePrix.create({ data: { reference, fournisseurId: data.fournisseurId, items: { create: data.items } }, include: { items: true } });
  },

  // Bon de Réception
  async listReceptions(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.bonReception.findMany({ ...p, include: { fournisseur: true, depot: true }, orderBy: { createdAt: "desc" } }),
      prisma.bonReception.count(),
    ]);
    return { data, total };
  },
  async getReception(id: string) {
    return prisma.bonReception.findUnique({ where: { id }, include: { fournisseur: true, depot: true, items: { include: { product: true } } } });
  },
  async createReception(data: { fournisseurId: string; depotId?: string; items: { productId: string; quantity: number; priceHT: number }[] }) {
    const reference = await generateRef(prisma.bonReception, "BR");
    let totalHT = 0, totalTTC = 0;
    const items = data.items.map(i => {
      const t = i.quantity * i.priceHT; totalHT += t; totalTTC += t;
      return { productId: i.productId, quantity: i.quantity, priceHT: i.priceHT, totalHT: t, totalTTC: t };
    });
    return prisma.$transaction(async (tx) => {
      const br = await tx.bonReception.create({
        data: { reference, fournisseurId: data.fournisseurId, depotId: data.depotId, totalHT, totalTTC, items: { create: items } },
        include: { items: true, fournisseur: true },
      });
      for (const i of items) {
        await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.quantity } } });
        if (data.depotId) {
          await tx.mouvementStock.create({ data: { productId: i.productId, depotId: data.depotId, type: "entrée", quantite: i.quantity, prixUnitaire: i.priceHT, documentRef: reference, motif: "Réception fournisseur" } });
        }
      }
      return br;
    });
  },

  // Facture Fournisseur
  async listFactures(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.factureFournisseur.findMany({ ...p, include: { fournisseur: true }, orderBy: { createdAt: "desc" } }),
      prisma.factureFournisseur.count(),
    ]);
    return { data, total };
  },
  async getFacture(id: string) {
    return prisma.factureFournisseur.findUnique({ where: { id }, include: { fournisseur: true, items: { include: { product: true } }, reglements: { include: { reglement: true } } } });
  },
  async createFacture(data: { fournisseurId: string; dueDate?: string; items: { productId: string; quantity: number; priceHT: number; discount: number; tva: number }[] }) {
    const reference = await generateRef(prisma.factureFournisseur, "FF");
    let totalHT = 0, totalTVA = 0, totalTTC = 0;
    const items = data.items.map(i => {
      const lht = i.quantity * i.priceHT * (1 - i.discount / 100);
      const ltva = lht * (i.tva / 100); const lttc = lht + ltva;
      totalHT += lht; totalTVA += ltva; totalTTC += lttc;
      return { productId: i.productId, quantity: i.quantity, priceHT: i.priceHT, discount: i.discount, tva: i.tva, totalHT: lht, totalTTC: lttc };
    });
    return prisma.factureFournisseur.create({
      data: { reference, fournisseurId: data.fournisseurId, dueDate: data.dueDate ? new Date(data.dueDate) : undefined, totalHT, totalTVA, totalTTC, items: { create: items } },
      include: { items: true, fournisseur: true },
    });
  },
  async deleteFacture(id: string) { return prisma.factureFournisseur.delete({ where: { id } }); },

  // Retour Fournisseur
  async listRetours(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.bonRetourFournisseur.findMany({ ...p, include: { fournisseur: true }, orderBy: { createdAt: "desc" } }),
      prisma.bonRetourFournisseur.count(),
    ]);
    return { data, total };
  },
  async getRetour(id: string) {
    return prisma.bonRetourFournisseur.findUnique({ where: { id }, include: { fournisseur: true, items: { include: { product: true } } } });
  },
  async createRetour(data: { fournisseurId: string; motif?: string; items: { productId: string; quantity: number; priceHT: number }[] }) {
    const reference = await generateRef(prisma.bonRetourFournisseur, "RFR");
    let totalHT = 0, totalTTC = 0;
    const items = data.items.map(i => { const t = i.quantity * i.priceHT; totalHT += t; totalTTC += t; return { productId: i.productId, quantity: i.quantity, priceHT: i.priceHT, totalHT: t, totalTTC: t }; });
    return prisma.bonRetourFournisseur.create({
      data: { reference, fournisseurId: data.fournisseurId, motif: data.motif, totalHT, totalTTC, items: { create: items } },
      include: { items: true },
    });
  },

  // Avoir Fournisseur
  async listAvoirs(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.bonAvoirFournisseur.findMany({ ...p, include: { fournisseur: true }, orderBy: { createdAt: "desc" } }),
      prisma.bonAvoirFournisseur.count(),
    ]);
    return { data, total };
  },
  async createAvoir(data: { fournisseurId: string; retourId?: string; items: { productId: string; montant: number }[] }) {
    const reference = await generateRef(prisma.bonAvoirFournisseur, "AFR");
    const totalTTC = data.items.reduce((s, i) => s + i.montant, 0);
    return prisma.bonAvoirFournisseur.create({ data: { reference, fournisseurId: data.fournisseurId, retourId: data.retourId, totalTTC, items: { create: data.items } }, include: { items: true } });
  },

  // Règlement Fournisseur
  async listReglements(p: PaginationParams) {
    const [data, total] = await Promise.all([
      prisma.reglementFournisseur.findMany({ ...p, include: { fournisseur: true, modePaiement: true }, orderBy: { createdAt: "desc" } }),
      prisma.reglementFournisseur.count(),
    ]);
    return { data, total };
  },
  async createReglement(data: { fournisseurId: string; montant: number; modePaiementId?: string; referenceChèque?: string; userId?: string; items: { factureId: string; montantApplique: number }[] }) {
    const reference = await generateRef(prisma.reglementFournisseur, "RFR");
    return prisma.$transaction(async (tx) => {
      const r = await tx.reglementFournisseur.create({
        data: { reference, fournisseurId: data.fournisseurId, montant: data.montant, modePaiementId: data.modePaiementId, referenceChèque: data.referenceChèque, userId: data.userId, items: { create: data.items } },
        include: { items: true },
      });
      const f = await tx.fournisseur.findUnique({ where: { id: data.fournisseurId } });
      if (f) await tx.fournisseur.update({ where: { id: data.fournisseurId }, data: { solde: f.solde - data.montant } });
      for (const i of data.items) {
        const fac = await tx.factureFournisseur.findUnique({ where: { id: i.factureId }, include: { reglements: true } });
        if (fac) {
          const paye = (fac.reglements || []).reduce((s, r) => s + r.montantApplique, 0) + i.montantApplique;
          await tx.factureFournisseur.update({ where: { id: i.factureId }, data: { statut: paye >= fac.totalTTC ? "payée" : "partielle" } });
        }
      }
      return r;
    });
  },
};
