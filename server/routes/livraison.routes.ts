import { Router } from "express";
import { livraisonController } from "../controllers/livraison.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { RouteLivraisonCreateSchema, AffectationCreateSchema, AffectationUpdateSchema } from "../validators/livraison.validator";

const router = Router();

// Routes de livraison
router.get("/routes", authenticateToken, livraisonController.listRoutes);
router.get("/routes/:id", authenticateToken, livraisonController.getRouteById);
router.post("/routes", authenticateToken, validate(RouteLivraisonCreateSchema), livraisonController.createRoute);
router.put("/routes/:id/statut", authenticateToken, livraisonController.updateRouteStatus);

// Stats livreur
router.get("/livreurs/:livreurId/stats", authenticateToken, livraisonController.getLivreurStats);

// Affectations
router.get("/routes/:routeId/affectations", authenticateToken, livraisonController.listAffectations);
router.post("/affectations", authenticateToken, validate(AffectationCreateSchema), livraisonController.createAffectation);
router.put("/affectations/:id", authenticateToken, validate(AffectationUpdateSchema), livraisonController.updateAffectationStatus);
router.delete("/affectations/:id", authenticateToken, livraisonController.removeAffectation);

export default router;
