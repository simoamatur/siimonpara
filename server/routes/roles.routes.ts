import { Router } from "express";
import { rolesController } from "../controllers/roles.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, rolesController.list);
router.get("/:id", authenticateToken, rolesController.getById);
router.post("/", authenticateToken, rolesController.create);
router.put("/:id", authenticateToken, rolesController.update);
router.delete("/:id", authenticateToken, rolesController.remove);

export default router;
