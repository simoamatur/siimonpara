import { prisma } from "../prisma";

export const consultationService = {
  async etatStock(depot?: string, famille?: string) {
    const where: any = {};
    if (depot) where.depotId = depot;
    if (famille) where.familleId = famille;

    const products = await prisma.product.findMany({
      where,
      include: { depot: true, famille: true, mouvementsStock: { orderBy: { date: "desc" } } },
      orderBy: { code: "asc" },
    });

    return products.map((p) => {
      const entrees = p.mouvementsStock.filter((m) => m.type === "entrée").reduce((s, m) => s + m.quantite, 0);
      const sorties = p.mouvementsStock.filter((m) => m.type === "sortie").reduce((s, m) => s + m.quantite, 0);
      return {
        id: p.id,
        codeArticle: p.code,
        libelle: p.name,
        famille: p.famille?.nom || "",
        sousFamille: "",
        unite: p.unit || "",
        stockInitial: p.stock - entrees + sorties,
        entrees,
        sorties,
        stockTheorique: p.stock,
        stockPhysique: p.stock,
        ecart: 0,
        puht: p.buyPrice || p.sellPrice || 0,
        valeurStock: p.stock * (p.buyPrice || p.sellPrice || 0),
        depot: p.depot?.nom || "",
      };
    });
  },

  async journalVentes(dateDebut?: string, dateFin?: string, type?: string) {
    const items: any[] = [];
    const dateFilter: any = {};
    if (dateDebut) dateFilter.gte = new Date(dateDebut);
    if (dateFin) dateFilter.lte = new Date(dateFin);

    const whereDate = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    if (!type || type === "BL") {
      const bls = await prisma.bonLivraison.findMany({
        where: whereDate,
        include: { client: true, items: { include: { product: true } }, user: true },
      });
      for (const bl of bls) {
        for (const item of bl.items) {
          items.push({
            date: bl.date.toISOString().split("T")[0],
            nDocument: bl.reference,
            type: "BL",
            codeClient: bl.client?.code || bl.clientId,
            client: bl.client?.name || "",
            codeArticle: item.product?.code || item.productId,
            article: item.product?.name || "",
            qte: item.quantity,
            puht: item.priceHT,
            montantHT: item.totalHT,
            tva: item.totalTTC - item.totalHT,
            montantTTC: item.totalTTC,
            depot: "",
            vendeur: bl.user?.name || "",
          });
        }
      }
    }

    if (!type || type === "FAC") {
      const factures = await prisma.facture.findMany({
        where: whereDate,
        include: { client: true, items: { include: { product: true } } },
      });
      for (const fac of factures) {
        for (const item of fac.items) {
          items.push({
            date: fac.date.toISOString().split("T")[0],
            nDocument: fac.reference,
            type: "FAC",
            codeClient: fac.client?.code || fac.clientId,
            client: fac.client?.name || "",
            codeArticle: item.product?.code || item.productId,
            article: item.product?.name || "",
            qte: item.quantity,
            puht: item.priceHT,
            montantHT: item.totalHT,
            tva: item.totalTTC - item.totalHT,
            montantTTC: item.totalTTC,
            depot: "",
            vendeur: "",
          });
        }
      }
    }

    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return items;
  },

  async releveClient(clientId: string) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { client: null, items: [] };

    const items: any[] = [];
    let solde = 0;

    // Factures
    const factures = await prisma.facture.findMany({
      where: { clientId },
      include: { reglements: { include: { reglement: { include: { modePaiement: true } } } } },
      orderBy: { date: "asc" },
    });
    for (const f of factures) {
      solde += f.totalTTC;
      items.push({
        date: f.date.toISOString().split("T")[0],
        nDocument: f.reference,
        type: "FAC",
        libelle: `Facture N° ${f.reference}`,
        debit: f.totalTTC,
        credit: 0,
        solde,
      });
      for (const ri of f.reglements) {
        solde -= ri.reglement.montant;
        items.push({
          date: ri.reglement.date.toISOString().split("T")[0],
          nDocument: ri.reglement.reference,
          type: "REG",
          libelle: `Règlement ${ri.reglement.modePaiement?.nom || ""}`,
          debit: 0,
          credit: ri.reglement.montant,
          solde,
        });
      }
    }

    // Avoirs
    const avoirs = await prisma.bonAvoir.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    });
    for (const a of avoirs) {
      solde -= a.totalTTC;
      items.push({
        date: a.date.toISOString().split("T")[0],
        nDocument: a.reference,
        type: "AV",
        libelle: `Avoir N° ${a.reference}`,
        debit: 0,
        credit: a.totalTTC,
        solde,
      });
    }

    items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return {
      client: {
        code: client.code || client.id,
        name: client.name,
        address: client.address || "",
        city: client.city || "",
        phone: client.phone || "",
        email: client.email || "",
        soldeInitial: 0,
      },
      items,
    };
  },
};
