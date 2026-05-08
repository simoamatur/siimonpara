import { Request, Response } from "express";
import { achatService } from "../services/achat.service";
import { paginate, paginateMeta } from "../middleware/paginate";

const ok = (res: Response, data: any, status = 200) => res.status(status).json(data);
const fail = (res: Response, msg: string, err?: unknown) => {
  console.error(msg, err); res.status(500).json({ error: msg, details: err instanceof Error ? err.message : String(err) });
};

export const achatController = {
  // Demandes de Prix
  async listDemandes(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listDemandes(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste demandes", e); }
  },
  async getDemande(req: Request, res: Response) {
    try { const d = await achatService.getDemande(req.params.id); if (!d) { res.status(404).json({ error: "Demande non trouvée" }); return; } ok(res, d); }
    catch (e) { fail(res, "Erreur", e); }
  },
  async createDemande(req: Request, res: Response) {
    try { const d = await achatService.createDemande(req.body); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création demande", e); }
  },

  // Bons de Réception
  async listReceptions(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listReceptions(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste réceptions", e); }
  },
  async getReception(req: Request, res: Response) {
    try { const d = await achatService.getReception(req.params.id); if (!d) { res.status(404).json({ error: "Réception non trouvée" }); return; } ok(res, d); }
    catch (e) { fail(res, "Erreur", e); }
  },
  async createReception(req: Request, res: Response) {
    try { const d = await achatService.createReception(req.body); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création réception", e); }
  },

  // Factures Fournisseur
  async listFactures(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listFactures(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste factures", e); }
  },
  async getFacture(req: Request, res: Response) {
    try { const d = await achatService.getFacture(req.params.id); if (!d) { res.status(404).json({ error: "Facture non trouvée" }); return; } ok(res, d); }
    catch (e) { fail(res, "Erreur", e); }
  },
  async createFacture(req: Request, res: Response) {
    try { const d = await achatService.createFacture(req.body); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création facture", e); }
  },
  async deleteFacture(req: Request, res: Response) {
    try { await achatService.deleteFacture(req.params.id); ok(res, { message: "Facture supprimée" }); }
    catch (e) { fail(res, "Erreur suppression", e); }
  },

  // Retours Fournisseur
  async listRetours(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listRetours(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste retours", e); }
  },
  async getRetour(req: Request, res: Response) {
    try { const d = await achatService.getRetour(req.params.id); if (!d) { res.status(404).json({ error: "Retour non trouvé" }); return; } ok(res, d); }
    catch (e) { fail(res, "Erreur", e); }
  },
  async createRetour(req: Request, res: Response) {
    try { const d = await achatService.createRetour(req.body); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création retour", e); }
  },

  // Avoirs Fournisseur
  async listAvoirs(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listAvoirs(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste avoirs", e); }
  },
  async createAvoir(req: Request, res: Response) {
    try { const d = await achatService.createAvoir(req.body); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création avoir", e); }
  },

  // Règlements Fournisseur
  async listReglements(req: Request, res: Response) {
    try { const p = paginate(req); const m = paginateMeta(req); const { data, total } = await achatService.listReglements(p); ok(res, { data, total, ...m }); }
    catch (e) { fail(res, "Erreur liste règlements", e); }
  },
  async createReglement(req: Request, res: Response) {
    try { const userId = (req.user as any)?.userId; const d = await achatService.createReglement({ ...req.body, userId }); ok(res, d, 201); }
    catch (e) { fail(res, "Erreur création règlement", e); }
  },
};
