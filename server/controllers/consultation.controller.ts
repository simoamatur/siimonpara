import { Request, Response } from "express";
import { consultationService } from "../services/consultation.service";

export const consultationController = {
  async etatStock(req: Request, res: Response) {
    try {
      const depot = req.query.depot as string | undefined;
      const famille = req.query.famille as string | undefined;
      const data = await consultationService.etatStock(depot, famille);
      res.json(data);
    } catch (error) {
      console.error("Etat stock error:", error);
      res.status(500).json([]);
    }
  },

  async journalVentes(req: Request, res: Response) {
    try {
      const dateDebut = req.query.dateDebut as string | undefined;
      const dateFin = req.query.dateFin as string | undefined;
      const type = req.query.type as string | undefined;
      const data = await consultationService.journalVentes(dateDebut, dateFin, type);
      res.json(data);
    } catch (error) {
      console.error("Journal ventes error:", error);
      res.status(500).json([]);
    }
  },

  async releveClient(req: Request, res: Response) {
    try {
      const data = await consultationService.releveClient(req.params.clientId);
      res.json(data);
    } catch (error) {
      console.error("Releve client error:", error);
      res.status(500).json({ client: null, items: [] });
    }
  },
};
