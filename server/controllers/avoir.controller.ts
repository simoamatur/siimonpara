import { Request, Response } from "express";
import { avoirService } from "../services/avoir.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const avoirController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await avoirService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Avoir list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const avoir = await avoirService.getById(req.params.id);
      if (!avoir) { res.status(404).json({ error: "Avoir non trouvé" }); return; }
      res.json(avoir);
    } catch (error) {
      console.error("Avoir get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const avoir = await avoirService.update(req.params.id, req.body);
      res.json(avoir);
    } catch (error) {
      console.error("Avoir update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const avoir = await avoirService.getById(req.params.id);
      if (!avoir) { res.status(404).json({ error: "Avoir non trouvé" }); return; }
      await avoirService.delete(req.params.id);
      res.json({ message: "Avoir supprimé" });
    } catch (error) {
      console.error("Avoir delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const avoir = await avoirService.create(req.body);
      res.status(201).json(avoir);
    } catch (error) {
      console.error("Avoir create error:", error);
      res.status(500).json({ error: "فشل création avoir", details: error instanceof Error ? error.message : String(error) });
    }
  },
};
