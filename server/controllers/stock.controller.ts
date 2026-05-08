import { Request, Response } from "express";
import { stockService } from "../services/stock.service";
import { paginate, paginateMeta } from "../middleware/paginate";

export const stockController = {
  // Mouvements
  async listMouvements(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await stockService.listMouvements(p); res.json({ data, total, ...m }); }
    catch (e) { console.error(e); res.status(500).json({ data: [], total: 0, page: 1, limit: 50 }); }
  },
  async createMouvement(req: Request, res: Response) {
    try { const userId = (req.user as any)?.userId; const m = await stockService.createMouvement({ ...req.body, userId }); res.status(201).json(m); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur création mouvement", details: e instanceof Error ? e.message : String(e) }); }
  },

  // Inventaires
  async listInventaires(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await stockService.listInventaires(p); res.json({ data, total, ...m }); }
    catch (e) { console.error(e); res.status(500).json({ data: [], total: 0, page: 1, limit: 50 }); }
  },
  async getInventaire(req: Request, res: Response) {
    try { const d = await stockService.getInventaire(req.params.id); if (!d) { res.status(404).json({ error: "Inventaire non trouvé" }); return; } res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "خطأ داخلي" }); }
  },
  async createInventaire(req: Request, res: Response) {
    try { const userId = (req.user as any)?.userId; const d = await stockService.createInventaire({ ...req.body, userId }); res.status(201).json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur création inventaire", details: e instanceof Error ? e.message : String(e) }); }
  },
  async validateInventaire(req: Request, res: Response) {
    try { const d = await stockService.validateInventaire(req.params.id); res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur validation", details: e instanceof Error ? e.message : String(e) }); }
  },
};
