import { Router } from "express";
import { productsController } from "../controllers/products.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ProductSchema, ProductUpdateSchema } from "../validators/products.validator";

const router = Router();

router.get("/", authenticateToken, productsController.list);
router.get("/:id", authenticateToken, productsController.getById);
router.post("/", authenticateToken, validate(ProductSchema), productsController.create);
router.put("/:id", authenticateToken, validate(ProductUpdateSchema), productsController.update);
router.delete("/:id", authenticateToken, productsController.delete);

export default router;
