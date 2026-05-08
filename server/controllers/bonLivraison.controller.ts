import { Request, Response } from "express";
import { bonLivraisonService } from "../services/bonLivraison.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const bonLivraisonController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await bonLivraisonService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const bl = await bonLivraisonService.getById(req.params.id);
      if (!bl) {
        res.status(404).json({ error: "Bon de livraison غير موجود" });
        return;
      }
      res.json(bl);
    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    const { clientId, items, paymentMode, reference, validated } = req.body;
    const userId = (req.user as any)?.userId;

    try {
      const bl = await bonLivraisonService.create({
        clientId,
        userId,
        paymentMode,
        reference,
        validated,
        items,
      });
      res.json(bl);
    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({
        error: "فشل في إنشاء bon",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const bl = await bonLivraisonService.getById(req.params.id);
      if (!bl) { res.status(404).json({ error: "Bon de livraison non trouvé" }); return; }
      await bonLivraisonService.delete(req.params.id);
      res.json({ message: "Bon de livraison supprimé" });
    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const bl = await bonLivraisonService.updateValidation(
        req.params.id,
        req.body.validated
      );
      res.json(bl);
    } catch (error) {
      console.error("Prisma Error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
