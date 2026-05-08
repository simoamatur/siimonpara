import { Router } from "express";
import { bonLivraisonController } from "../controllers/bonLivraison.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { BonLivraisonSchema } from "../validators/bonLivraison.validator";

const router = Router();

router.get("/", authenticateToken, bonLivraisonController.list);
router.get("/:id", authenticateToken, bonLivraisonController.getById);
router.post("/", authenticateToken, validate(BonLivraisonSchema), bonLivraisonController.create);
router.put("/:id", authenticateToken, bonLivraisonController.update);
router.delete("/:id", authenticateToken, bonLivraisonController.delete);

export default router;
