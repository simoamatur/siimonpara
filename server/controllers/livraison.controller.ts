import { Request, Response } from "express";
import { livraisonService } from "../services/livraison.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const livraisonController = {
  // Routes
  async listRoutes(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await livraisonService.listRoutes(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Routes list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getRouteById(req: Request, res: Response) {
    try {
      const route = await livraisonService.getRouteById(req.params.id);
      if (!route) { res.status(404).json({ error: "Route non trouvée" }); return; }
      res.json(route);
    } catch (error) {
      console.error("Route get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async createRoute(req: Request, res: Response) {
    try {
      const route = await livraisonService.createRoute(req.body);
      res.status(201).json(route);
    } catch (error) {
      console.error("Route create error:", error);
      res.status(500).json({ error: "فشل création route", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async updateRouteStatus(req: Request, res: Response) {
    try {
      const route = await livraisonService.updateRouteStatus(req.params.id, req.body.statut);
      res.json(route);
    } catch (error) {
      console.error("Route update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  // Affectations
  async listAffectations(req: Request, res: Response) {
    try {
      const affectations = await livraisonService.listAffectations(req.params.routeId);
      res.json(affectations);
    } catch (error) {
      console.error("Affectations list error:", error);
      res.status(500).json([]);
    }
  },

  async createAffectation(req: Request, res: Response) {
    try {
      const affectation = await livraisonService.createAffectation(req.body);
      res.status(201).json(affectation);
    } catch (error) {
      console.error("Affectation create error:", error);
      res.status(500).json({ error: "فشل affectation", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async updateAffectationStatus(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId;
      const affectation = await livraisonService.updateAffectationStatus(req.params.id, { ...req.body, userId });
      res.json(affectation);
    } catch (error) {
      console.error("Affectation update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async removeAffectation(req: Request, res: Response) {
    try {
      await livraisonService.removeAffectation(req.params.id);
      res.json({ message: "Affectation supprimée" });
    } catch (error) {
      console.error("Affectation delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  // Stats livreur
  async getLivreurStats(req: Request, res: Response) {
    try {
      const stats = await livraisonService.getLivreurStats(
        req.params.livreurId,
        req.query.dateDebut ? new Date(String(req.query.dateDebut)) : undefined,
        req.query.dateFin ? new Date(String(req.query.dateFin)) : undefined,
      );
      res.json(stats);
    } catch (error) {
      console.error("Livreur stats error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
