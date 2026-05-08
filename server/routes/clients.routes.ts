import { Router } from "express";
import { clientsController } from "../controllers/clients.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ClientSchema, ClientUpdateSchema } from "../validators/clients.validator";

const router = Router();

router.get("/", authenticateToken, clientsController.list);
router.get("/:id", authenticateToken, clientsController.getById);
router.post("/", authenticateToken, validate(ClientSchema), clientsController.create);
router.put("/:id", authenticateToken, validate(ClientUpdateSchema), clientsController.update);
router.delete("/:id", authenticateToken, clientsController.delete);

export default router;
