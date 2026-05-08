import { Request, Response } from "express";
import { commandeClientService } from "../services/commandeClient.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const commandeClientController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await commandeClientService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Commande list error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const cmd = await commandeClientService.getById(req.params.id);
      if (!cmd) { res.status(404).json({ error: "Commande non trouvée" }); return; }
      res.json(cmd);
    } catch (error) {
      console.error("Commande get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const cmd = await commandeClientService.create(req.body);
      res.status(201).json(cmd);
    } catch (error) {
      console.error("Commande create error:", error);
      res.status(500).json({ error: "Erreur création commande", details: error instanceof Error ? error.message : String(error) });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const cmd = await commandeClientService.update(req.params.id, req.body);
      res.json(cmd);
    } catch (error) {
      console.error("Commande update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await commandeClientService.delete(req.params.id);
      res.json({ message: "Commande supprimée" });
    } catch (error) {
      console.error("Commande delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
