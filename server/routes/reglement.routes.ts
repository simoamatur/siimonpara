import { Router } from "express";
import { reglementController } from "../controllers/reglement.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ReglementCreateSchema } from "../validators/reglement.validator";

const router = Router();

router.get("/", authenticateToken, reglementController.list);
router.get("/:id", authenticateToken, reglementController.getById);
router.post("/", authenticateToken, validate(ReglementCreateSchema), reglementController.create);
router.delete("/:id", authenticateToken, reglementController.delete);

export default router;
