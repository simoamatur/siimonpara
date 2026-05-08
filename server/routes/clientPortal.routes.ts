import { Router } from "express";
import { clientPortalController } from "../controllers/clientPortal.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/dashboard", clientPortalController.getDashboard);
router.get("/products", clientPortalController.listProducts);
router.get("/products/:id", clientPortalController.getProductById);
router.get("/commandes", clientPortalController.listCommandes);
router.post("/commandes", clientPortalController.createCommande);
router.get("/commandes/:id", clientPortalController.getCommande);
router.get("/promotions", clientPortalController.listPromotions);
router.put("/profile", clientPortalController.updateProfile);

export default router;
