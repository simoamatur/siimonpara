import { Router } from "express";
import authRoutes from "./auth.routes";
import clientsRoutes from "./clients.routes";
import productsRoutes from "./products.routes";
import bonLivraisonRoutes from "./bonLivraison.routes";
import ventesRoutes from "./ventes.routes";
import achatRoutes from "./achat.routes";
import stockRoutes from "./stock.routes";
import parametreRoutes from "./parametre.routes";
import commandeClientRoutes from "./commandeClient.routes";
import usersRoutes from "./users.routes";
import rolesRoutes from "./roles.routes";
import promotionRoutes from "./promotion.routes";
import regleFacturationAutoRoutes from "./regleFacturationAuto.routes";
import dashboardRoutes from "./dashboard.routes";
import clientPortalRoutes from "./clientPortal.routes";
import consultationRoutes from "./consultation.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/client", clientPortalRoutes);
router.use("/clients", clientsRoutes);
router.use("/products", productsRoutes);
router.use("/bon-livraison", bonLivraisonRoutes);
router.use("/ventes", ventesRoutes);
router.use("/achat", achatRoutes);
router.use("/stock", stockRoutes);
router.use("/parametres", parametreRoutes);
router.use("/commandes-clients", commandeClientRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/promotions", promotionRoutes);
router.use("/regles-facturation", regleFacturationAutoRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/consultation", consultationRoutes);

export default router;
