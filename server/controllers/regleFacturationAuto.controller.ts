import { Request, Response } from "express";
import { regleFacturationAutoService } from "../services/regleFacturationAuto.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const regleFacturationAutoController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await regleFacturationAutoService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Regle list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const r = await regleFacturationAutoService.getById(req.params.id);
      if (!r) { res.status(404).json({ error: "Règle non trouvée" }); return; }
      res.json(r);
    } catch (error) {
      console.error("Regle get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const r = await regleFacturationAutoService.create(req.body);
      res.status(201).json(r);
    } catch (error) {
      console.error("Regle create error:", error);
      res.status(500).json({ error: "Erreur création règle", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const r = await regleFacturationAutoService.update(req.params.id, req.body);
      res.json(r);
    } catch (error) {
      console.error("Regle update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await regleFacturationAutoService.delete(req.params.id);
      res.json({ message: "Règle supprimée" });
    } catch (error) {
      console.error("Regle delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
