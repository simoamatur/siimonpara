import { Router } from "express";
import { retourController } from "../controllers/retour.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { BonRetourCreateSchema, BonRetourUpdateSchema } from "../validators/retour.validator";

const router = Router();

router.get("/", authenticateToken, retourController.list);
router.get("/:id", authenticateToken, retourController.getById);
router.post("/", authenticateToken, validate(BonRetourCreateSchema), retourController.create);
router.put("/:id", authenticateToken, validate(BonRetourUpdateSchema), retourController.update);
router.delete("/:id", authenticateToken, retourController.delete);

export default router;
