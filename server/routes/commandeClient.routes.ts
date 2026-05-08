import { Router } from "express";
import { commandeClientController } from "../controllers/commandeClient.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { CommandeClientCreateSchema, CommandeClientUpdateSchema } from "../validators/commandeClient.validator";

const router = Router();

router.get("/", authenticateToken, commandeClientController.list);
router.get("/:id", authenticateToken, commandeClientController.getById);
router.post("/", authenticateToken, validate(CommandeClientCreateSchema), commandeClientController.create);
router.put("/:id", authenticateToken, validate(CommandeClientUpdateSchema), commandeClientController.update);
router.delete("/:id", authenticateToken, commandeClientController.delete);

export default router;
