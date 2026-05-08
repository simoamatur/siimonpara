import { Router } from "express";
import { achatController } from "../controllers/achat.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  DemandePrixCreateSchema,
  BonReceptionCreateSchema,
  FactureFournisseurCreateSchema,
  RetourFournisseurCreateSchema,
  AvoirFournisseurCreateSchema,
  ReglementFournisseurCreateSchema,
} from "../validators/achat.validator";

const router = Router();

// Demandes de Prix
router.get("/demandes", authenticateToken, achatController.listDemandes);
router.get("/demandes/:id", authenticateToken, achatController.getDemande);
router.post("/demandes", authenticateToken, validate(DemandePrixCreateSchema), achatController.createDemande);

// Bons de Réception
router.get("/receptions", authenticateToken, achatController.listReceptions);
router.get("/receptions/:id", authenticateToken, achatController.getReception);
router.post("/receptions", authenticateToken, validate(BonReceptionCreateSchema), achatController.createReception);

// Factures Fournisseur
router.get("/factures", authenticateToken, achatController.listFactures);
router.get("/factures/:id", authenticateToken, achatController.getFacture);
router.post("/factures", authenticateToken, validate(FactureFournisseurCreateSchema), achatController.createFacture);
router.delete("/factures/:id", authenticateToken, achatController.deleteFacture);

// Retours Fournisseur
router.get("/retours", authenticateToken, achatController.listRetours);
router.get("/retours/:id", authenticateToken, achatController.getRetour);
router.post("/retours", authenticateToken, validate(RetourFournisseurCreateSchema), achatController.createRetour);

// Avoirs Fournisseur
router.get("/avoirs", authenticateToken, achatController.listAvoirs);
router.post("/avoirs", authenticateToken, validate(AvoirFournisseurCreateSchema), achatController.createAvoir);

// Règlements Fournisseur
router.get("/reglements", authenticateToken, achatController.listReglements);
router.post("/reglements", authenticateToken, validate(ReglementFournisseurCreateSchema), achatController.createReglement);

export default router;
