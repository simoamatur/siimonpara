import { Router } from "express";
import factureRoutes from "./facture.routes";
import retourRoutes from "./retour.routes";
import avoirRoutes from "./avoir.routes";
import reglementRoutes from "./reglement.routes";
import livraisonRoutes from "./livraison.routes";

const router = Router();

router.use("/factures", factureRoutes);
router.use("/retours", retourRoutes);
router.use("/avoirs", avoirRoutes);
router.use("/reglements", reglementRoutes);
router.use("/livraisons", livraisonRoutes);

export default router;
