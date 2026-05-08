import { Request, Response } from "express";
import { parametreService } from "../services/parametre.service";
import { paginate, paginateMeta } from "../middleware/paginate";

// Generic controller factory
const ctrl = (service: ReturnType<typeof Object>) => ({
  list: async (req: Request, res: Response) => {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await (service as any).list(p); res.json({ data, total, ...m }); }
    catch (e) { console.error(e); res.status(500).json({ data: [], total: 0, page: 1, limit: 50 }); }
  },
  getById: async (req: Request, res: Response) => {
    try { const d = await (service as any).getById(req.params.id); if (!d) { res.status(404).json({ error: "Non trouvé" }); return; } res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "خطأ داخلي" }); }
  },
  create: async (req: Request, res: Response) => {
    try { const d = await (service as any).create(req.body); res.status(201).json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur création", details: e instanceof Error ? e.message : String(e) }); }
  },
  update: async (req: Request, res: Response) => {
    try { const d = await (service as any).update(req.params.id, req.body); res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur modification", details: e instanceof Error ? e.message : String(e) }); }
  },
  delete: async (req: Request, res: Response) => {
    try { await (service as any).delete(req.params.id); res.json({ message: "Supprimé" }); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur suppression", details: e instanceof Error ? e.message : String(e) }); }
  },
});

export const parametreController = {
  ville: ctrl(parametreService.ville),
  zone: ctrl(parametreService.zone),
  famille: ctrl(parametreService.famille),
  sousFamille: ctrl(parametreService.sousFamille),
  tva: ctrl(parametreService.tva),
  depot: ctrl(parametreService.depot),
  categorieClient: ctrl(parametreService.categorieClient),
  groupeRemise: ctrl(parametreService.groupeRemise),
  livreur: ctrl(parametreService.livreur),
  modeReglement: ctrl(parametreService.modeReglement),

  // Nomenclature
  async listNomenclatures(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await parametreService.listNomenclatures(p); res.json({ data, total, ...m }); }
    catch (e) { console.error(e); res.status(500).json({ data: [], total: 0, page: 1, limit: 50 }); }
  },
  async getNomenclature(req: Request, res: Response) {
    try { const d = await parametreService.getNomenclature(req.params.id); if (!d) { res.status(404).json({ error: "Non trouvé" }); return; } res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "خطأ داخلي" }); }
  },
  async createNomenclature(req: Request, res: Response) {
    try { const d = await parametreService.createNomenclature(req.body); res.status(201).json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur création", details: e instanceof Error ? e.message : String(e) }); }
  },
  async updateNomenclature(req: Request, res: Response) {
    try { const d = await parametreService.updateNomenclature(req.params.id, req.body); res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur modification", details: e instanceof Error ? e.message : String(e) }); }
  },
  async deleteNomenclature(req: Request, res: Response) {
    try { await parametreService.deleteNomenclature(req.params.id); res.json({ message: "Supprimé" }); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur suppression", details: e instanceof Error ? e.message : String(e) }); }
  },

  async getZonesByVille(req: Request, res: Response) {
    try { const zones = await parametreService.getZonesByVille(req.params.villeId); res.json(zones); }
    catch (e) { console.error(e); res.status(500).json([]); }
  },

  async getSousFamillesByFamille(req: Request, res: Response) {
    try { const sf = await parametreService.getSousFamillesByFamille(req.params.familleId); res.json(sf); }
    catch (e) { console.error(e); res.status(500).json([]); }
  },

  // Fournisseur
  async listFournisseurs(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await parametreService.listFournisseurs(p); res.json({ data, total, ...m }); }
    catch (e) { console.error(e); res.status(500).json({ data: [], total: 0, page: 1, limit: 50 }); }
  },
  async getFournisseur(req: Request, res: Response) {
    try { const d = await parametreService.getFournisseur(req.params.id); if (!d) { res.status(404).json({ error: "Fournisseur non trouvé" }); return; } res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "خطأ داخلي" }); }
  },
  async createFournisseur(req: Request, res: Response) {
    try { const d = await parametreService.createFournisseur(req.body); res.status(201).json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur création", details: e instanceof Error ? e.message : String(e) }); }
  },
  async updateFournisseur(req: Request, res: Response) {
    try { const d = await parametreService.updateFournisseur(req.params.id, req.body); res.json(d); }
    catch (e) { console.error(e); res.status(500).json({ error: "Erreur modification", details: e instanceof Error ? e.message : String(e) }); }
  },
};
