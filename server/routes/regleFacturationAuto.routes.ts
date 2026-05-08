import { Router } from "express";
import { regleFacturationAutoController } from "../controllers/regleFacturationAuto.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { RegleFacturationAutoCreateSchema, RegleFacturationAutoUpdateSchema } from "../validators/regleFacturationAuto.validator";

const router = Router();

router.get("/", authenticateToken, regleFacturationAutoController.list);
router.get("/:id", authenticateToken, regleFacturationAutoController.getById);
router.post("/", authenticateToken, validate(RegleFacturationAutoCreateSchema), regleFacturationAutoController.create);
router.put("/:id", authenticateToken, validate(RegleFacturationAutoUpdateSchema), regleFacturationAutoController.update);
router.delete("/:id", authenticateToken, regleFacturationAutoController.delete);

export default router;
