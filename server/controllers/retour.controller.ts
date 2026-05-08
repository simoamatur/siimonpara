import { Request, Response } from "express";
import { retourService } from "../services/retour.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const retourController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await retourService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Retour list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const retour = await retourService.getById(req.params.id);
      if (!retour) { res.status(404).json({ error: "Retour non trouvé" }); return; }
      res.json(retour);
    } catch (error) {
      console.error("Retour get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const retour = await retourService.update(req.params.id, req.body);
      res.json(retour);
    } catch (error) {
      console.error("Retour update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const retour = await retourService.getById(req.params.id);
      if (!retour) { res.status(404).json({ error: "Retour non trouvé" }); return; }
      await retourService.delete(req.params.id);
      res.json({ message: "Retour supprimé" });
    } catch (error) {
      console.error("Retour delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const retour = await retourService.create(req.body);
      res.status(201).json(retour);
    } catch (error) {
      console.error("Retour create error:", error);
      res.status(500).json({ error: "فشل création retour", details: error instanceof Error ? error.message : String(error) });
    }
  },
};
