import { Router } from "express";
import { stockController } from "../controllers/stock.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { MouvementStockCreateSchema, InventaireCreateSchema, InventaireValidateSchema } from "../validators/stock.validator";

const router = Router();

// Mouvements
router.get("/mouvements", authenticateToken, stockController.listMouvements);
router.post("/mouvements", authenticateToken, validate(MouvementStockCreateSchema), stockController.createMouvement);

// Inventaires
router.get("/inventaires", authenticateToken, stockController.listInventaires);
router.get("/inventaires/:id", authenticateToken, stockController.getInventaire);
router.post("/inventaires", authenticateToken, validate(InventaireCreateSchema), stockController.createInventaire);
router.put("/inventaires/:id/validate", authenticateToken, validate(InventaireValidateSchema), stockController.validateInventaire);

export default router;
