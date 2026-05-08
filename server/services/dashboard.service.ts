import { prisma } from "../prisma";

const monthStart = () => {
  const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
};

export const dashboardService = {
  async getAll() {
    const now = new Date();
    const ms = monthStart();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const ventesMois = (await prisma.facture.aggregate({ where: { date: { gte: ms } }, _sum: { totalTTC: true } }))._sum.totalTTC || 0;
    const achatsMois = (await prisma.factureFournisseur.aggregate({ where: { date: { gte: ms } }, _sum: { totalTTC: true } }))._sum.totalTTC || 0;
    const marge = ventesMois - achatsMois;
    const clientsActifs = await prisma.client.count({ where: { isActif: true } });
    const fournisseursCount = await prisma.fournisseur.count({ where: { isActif: true } });
    const facturesMois = await prisma.facture.count({ where: { date: { gte: ms } } });
    const facturesAchatMois = await prisma.factureFournisseur.count({ where: { date: { gte: ms } } });
    const blCount = await prisma.bonLivraison.count({ where: { validated: false } });
    const retoursMois = await prisma.bonRetour.count({ where: { date: { gte: ms } } });

    // Stock
    const allProducts = await prisma.product.findMany({ select: { stock: true, buyPrice: true, stockMin: true } });
    const stockCritical = allProducts.filter(p => p.stockMin > 0 && p.stock <= p.stockMin).length;
    const valeurStock = allProducts.reduce((s, p) => s + (p.stock || 0) * (p.buyPrice || 0), 0);
    const stockAlert = allProducts.filter(p => p.stockMin > 0 && p.stock > 0 && p.stock <= p.stockMin * 1.5).length;

    // Évolution
    const factures6m = await prisma.facture.findMany({ where: { date: { gte: sixMonthsAgo } }, select: { date: true, totalTTC: true } });
    const achats6m = await prisma.factureFournisseur.findMany({ where: { date: { gte: sixMonthsAgo } }, select: { date: true, totalTTC: true } });
    const evolution: { month: string; ventes: number; achats: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.toLocaleString("fr-FR", { month: "short" });
      const v = factures6m.filter(f => f.date.getMonth() === d.getMonth() && f.date.getFullYear() === d.getFullYear()).reduce((s, f) => s + f.totalTTC, 0);
      const a = achats6m.filter(f => f.date.getMonth() === d.getMonth() && f.date.getFullYear() === d.getFullYear()).reduce((s, f) => s + f.totalTTC, 0);
      evolution.push({ month: m, ventes: Math.round(v * 100) / 100, achats: Math.round(a * 100) / 100 });
    }

    // Alertes
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const impayees = await prisma.facture.findMany({ where: { statut: "impayée", date: { lte: sixtyDaysAgo } }, select: { id: true, totalTTC: true } });
    const totalImpayees = impayees.reduce((s, f) => s + f.totalTTC, 0);
    const factureBLIds = (await prisma.facture.findMany({ where: { blId: { not: null } }, select: { blId: true } })).map(f => f.blId).filter(Boolean) as string[];
    const blNonFactures = factureBLIds.length > 0
      ? await prisma.bonLivraison.count({ where: { validated: true, id: { notIn: factureBLIds } } })
      : await prisma.bonLivraison.count({ where: { validated: true } });

    const alerts: { type: "danger" | "warning" | "info"; message: string; module: string; montant: number }[] = [];
    if (totalImpayees > 0) alerts.push({ type: "danger", message: `${impayees.length} facture(s) client(s) impayée(s) dépassent 60 jours`, module: "Ventes", montant: totalImpayees });
    if (stockCritical > 0) alerts.push({ type: "warning", message: `${stockCritical} produit(s) en stock critique (< seuil minimum)`, module: "Stock", montant: 0 });
    if (blNonFactures > 0) alerts.push({ type: "warning", message: `${blNonFactures} BL validé(s) non facturé(s)`, module: "Ventes", montant: 0 });

    // Activité récente
    const recentFactures = await prisma.facture.findMany({ take: 5, orderBy: { date: "desc" }, select: { reference: true, date: true, totalTTC: true, client: { select: { name: true } } } });
    const recentAchats = await prisma.factureFournisseur.findMany({ take: 5, orderBy: { date: "desc" }, select: { reference: true, date: true, totalTTC: true, fournisseur: { select: { nom: true } } } });
    const recentActivity = [
      ...recentFactures.map(f => ({ id: f.reference, type: "vente" as const, entity: f.client.name, montant: f.totalTTC, date: f.date.toISOString().slice(0, 10) })),
      ...recentAchats.map(f => ({ id: f.reference, type: "achat" as const, entity: f.fournisseur.nom, montant: f.totalTTC, date: f.date.toISOString().slice(0, 10) })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

    // Top clients
    let topClients: { name: string; ca: number; factures: number }[] = [];
    try {
      const topClientsData = await prisma.facture.groupBy({ by: ["clientId"], _sum: { totalTTC: true }, _count: true, orderBy: { _sum: { totalTTC: "desc" } }, take: 5 });
      if (topClientsData.length > 0) {
        const clientIds = topClientsData.map(c => c.clientId);
        const clients = await prisma.client.findMany({ where: { id: { in: clientIds } }, select: { id: true, name: true } });
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        topClients = topClientsData.map(c => ({ name: clientMap.get(c.clientId) || "?", ca: c._sum.totalTTC || 0, factures: c._count }));
      }
    } catch (_) { /* no data */ }

    // Top products
    let topProducts: { name: string; ventes: number; stock: number; ca: number }[] = [];
    try {
      const topProductsData = await prisma.factureItem.groupBy({ by: ["productId"], _sum: { quantity: true, totalTTC: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 });
      if (topProductsData.length > 0) {
        const productIds = topProductsData.map(p => p.productId);
        const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, stock: true } });
        const productMap = new Map(products.map(p => [p.id, p]));
        topProducts = topProductsData.map(p => {
          const prod = productMap.get(p.productId);
          return { name: prod?.name || "?", ventes: p._sum.quantity || 0, stock: prod?.stock || 0, ca: p._sum.totalTTC || 0 };
        });
      }
    } catch (_) { /* no data */ }

    // État des règlements
    let clientPayments = { paid: 0, partial: 0, overdue: 0 };
    let fournisseurPayments = { paid: 0, partial: 0, overdue: 0 };
    try {
      const cp = await prisma.facture.groupBy({ by: ["statut"], _sum: { totalTTC: true } });
      clientPayments = {
        paid: cp.find(d => d.statut === "payée")?._sum.totalTTC || 0,
        partial: cp.find(d => d.statut === "partielle")?._sum.totalTTC || 0,
        overdue: cp.find(d => d.statut === "impayée")?._sum.totalTTC || 0,
      };
    } catch (_) { /* no data */ }
    try {
      const fp = await prisma.factureFournisseur.groupBy({ by: ["statut"], _sum: { totalTTC: true } });
      fournisseurPayments = {
        paid: fp.find(d => d.statut === "payée")?._sum.totalTTC || 0,
        partial: fp.find(d => d.statut === "partielle")?._sum.totalTTC || 0,
        overdue: fp.find(d => d.statut === "impayée")?._sum.totalTTC || 0,
      };
    } catch (_) { /* no data */ }

    return {
      kpis: { ventesMois, achatsMois, marge, valeurStock, clientsActifs, fournisseurs: fournisseursCount, facturesMois, facturesAchatMois, blEnCours: blCount, retoursMois },
      evolution, alerts, recentActivity, topClients, topProducts,
      paymentStatus: { clients: clientPayments, fournisseurs: fournisseurPayments },
      stockSummary: { totalProduits: allProducts.length, stockCritique: stockCritical, stockAlerte: stockAlert, valeurStock },
    };
  },
};
