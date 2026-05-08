import { Request, Response } from "express";
import { clientsService } from "../services/clients.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const clientsController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await clientsService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Prisma Clients Error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const client = await clientsService.getById(req.params.id);
      if (!client) { res.status(404).json({ error: "Client non trouvé" }); return; }
      res.json(client);
    } catch (error) {
      console.error("Client get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const client = await clientsService.create(req.body);
      res.json(client);
    } catch (error) {
      console.error("Create Client Error:", error);
      res.status(500).json({ error: "فشل في إضافة العميل" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const client = await clientsService.update(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error("Client update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await clientsService.delete(req.params.id);
      res.json({ message: "Client supprimé" });
    } catch (error) {
      console.error("Client delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
