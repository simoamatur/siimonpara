import { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";

export const dashboardController = {
  async getAll(_req: Request, res: Response) {
    try {
      const data = await dashboardService.getAll();
      res.json(data);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({
        kpis: { ventesMois: 0, achatsMois: 0, marge: 0, valeurStock: 0, clientsActifs: 0, fournisseurs: 0, facturesMois: 0, facturesAchatMois: 0, blEnCours: 0, retoursMois: 0 },
        evolution: [], alerts: [], recentActivity: [], topClients: [], topProducts: [],
        paymentStatus: { clients: { paid: 0, partial: 0, overdue: 0 }, fournisseurs: { paid: 0, partial: 0, overdue: 0 } },
        stockSummary: { totalProduits: 0, stockCritique: 0, stockAlerte: 0, valeurStock: 0 },
      });
    }
  },
};
