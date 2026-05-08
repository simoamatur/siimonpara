import { Request, Response } from "express";
import { productsService } from "../services/products.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const productsController = {
  async list(req: Request, res: Response) {
    try {
      const pag = paginate(req);
      const meta = paginateMeta(req);
      const { data, total } = await productsService.list(pag);
      res.json({ data, total, ...meta });
    } catch (error) {
      console.error("Prisma Products Error:", error);
      res.status(500).json({ data: [], total: 0, page: 1, limit: 50 });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const product = await productsService.getById(req.params.id);
      if (!product) { res.status(404).json({ error: "Produit non trouvé" }); return; }
      res.json(product);
    } catch (error) {
      console.error("Product get error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const product = await productsService.create(req.body);
      res.json(product);
    } catch (error) {
      console.error("Create Product Error:", error);
      res.status(500).json({ error: "فشل في إضافة المنتج" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const product = await productsService.update(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      console.error("Product update error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await productsService.delete(req.params.id);
      res.json({ message: "Produit supprimé" });
    } catch (error) {
      console.error("Product delete error:", error);
      res.status(500).json({ error: "خطأ داخلي" });
    }
  },
};
