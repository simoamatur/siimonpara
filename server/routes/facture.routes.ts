import { Router } from "express";
import { factureController } from "../controllers/facture.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { FactureCreateSchema, FactureUpdateSchema } from "../validators/facture.validator";

const router = Router();

router.get("/", authenticateToken, factureController.list);
router.get("/:id", authenticateToken, factureController.getById);
router.post("/", authenticateToken, validate(FactureCreateSchema), factureController.create);
router.put("/:id", authenticateToken, validate(FactureUpdateSchema), factureController.update);
router.delete("/:id", authenticateToken, factureController.delete);

export default router;
