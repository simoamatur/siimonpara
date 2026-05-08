import { Router } from "express";
import { consultationController } from "../controllers/consultation.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/etat-stock", authenticateToken, consultationController.etatStock);
router.get("/journal-ventes", authenticateToken, consultationController.journalVentes);
router.get("/releve-client/:clientId", authenticateToken, consultationController.releveClient);

export default router;
