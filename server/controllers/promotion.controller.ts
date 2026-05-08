import { Request, Response } from "express";
import { promotionService } from "../services/promotion.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const promotionController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await promotionService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Promotion list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const p = await promotionService.getById(req.params.id);
      if (!p) { res.status(404).json({ error: "Promotion non trouvée" }); return; }
      res.json(p);
    } catch (error) {
      console.error("Promotion get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const p = await promotionService.create(req.body);
      res.status(201).json(p);
    } catch (error) {
      console.error("Promotion create error:", error);
      res.status(500).json({ error: "Erreur création promotion", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const p = await promotionService.update(req.params.id, req.body);
      res.json(p);
    } catch (error) {
      console.error("Promotion update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await promotionService.delete(req.params.id);
      res.json({ message: "Promotion supprimée" });
    } catch (error) {
      console.error("Promotion delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
