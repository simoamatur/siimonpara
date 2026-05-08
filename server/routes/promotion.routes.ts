import { Router } from "express";
import { promotionController } from "../controllers/promotion.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { PromotionCreateSchema, PromotionUpdateSchema } from "../validators/promotion.validator";

const router = Router();

router.get("/", authenticateToken, promotionController.list);
router.get("/:id", authenticateToken, promotionController.getById);
router.post("/", authenticateToken, validate(PromotionCreateSchema), promotionController.create);
router.put("/:id", authenticateToken, validate(PromotionUpdateSchema), promotionController.update);
router.delete("/:id", authenticateToken, promotionController.delete);

export default router;
