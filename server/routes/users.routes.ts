import { Router } from "express";
import { usersController } from "../controllers/users.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, usersController.list);
router.get("/:id", authenticateToken, usersController.getById);
router.post("/", authenticateToken, usersController.create);
router.put("/:id", authenticateToken, usersController.update);
router.delete("/:id", authenticateToken, usersController.remove);

export default router;
