import { Request, Response } from "express";
import { reglementService } from "../services/reglement.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const reglementController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await reglementService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Reglement list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const reglement = await reglementService.getById(req.params.id);
      if (!reglement) { res.status(404).json({ error: "Règlement non trouvé" }); return; }
      res.json(reglement);
    } catch (error) {
      console.error("Reglement get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId;
      const reglement = await reglementService.create({ ...req.body, userId });
      res.status(201).json(reglement);
    } catch (error) {
      console.error("Reglement create error:", error);
      res.status(500).json({ error: "فشل création règlement", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await reglementService.delete(req.params.id);
      res.json({ message: "Règlement supprimé" });
    } catch (error) {
      console.error("Reglement delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
