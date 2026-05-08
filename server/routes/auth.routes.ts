import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { LoginSchema, RegisterSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(RegisterSchema), authController.register);
router.post("/login", validate(LoginSchema), authController.login);
router.post("/client-login", authController.clientLogin);
router.get("/client/profile", authenticateToken, authController.clientProfile);
router.post("/logout", authController.logout);

export default router;
