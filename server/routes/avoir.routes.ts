import { Router } from "express";
import { avoirController } from "../controllers/avoir.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { BonAvoirCreateSchema, BonAvoirUpdateSchema } from "../validators/avoir.validator";

const router = Router();

router.get("/", authenticateToken, avoirController.list);
router.get("/:id", authenticateToken, avoirController.getById);
router.post("/", authenticateToken, validate(BonAvoirCreateSchema), avoirController.create);
router.put("/:id", authenticateToken, validate(BonAvoirUpdateSchema), avoirController.update);
router.delete("/:id", authenticateToken, avoirController.delete);

export default router;
