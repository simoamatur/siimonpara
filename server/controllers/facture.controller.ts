import { Request, Response } from "express";
import { factureService } from "../services/facture.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const factureController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await factureService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Facture list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const facture = await factureService.getById(req.params.id);
      if (!facture) { res.status(404).json({ error: "Facture non trouvée" }); return; }
      res.json(facture);
    } catch (error) {
      console.error("Facture get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const facture = await factureService.create(req.body);
      res.status(201).json(facture);
    } catch (error) {
      console.error("Facture create error:", error);
      res.status(500).json({ error: "فشل création facture", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const facture = await factureService.update(req.params.id, req.body);
      res.json(facture);
    } catch (error) {
      console.error("Facture update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await factureService.delete(req.params.id);
      res.json({ message: "Facture supprimée" });
    } catch (error) {
      console.error("Facture delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
