import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken, dashboardController.getAll);

export default router;
