import { Router } from "express";
import { parametreController } from "../controllers/parametre.controller";
import { authenticateToken } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  VilleSchema,
  ZoneSchema,
  FamilleSchema,
  SousFamilleSchema,
  TVASchema,
  DepotSchema,
  CategorieClientSchema,
  GroupeRemiseSchema,
  LivreurSchema,
  ModeReglementSchema,
  FournisseurSchema,
  NomenclatureSchema,
} from "../validators/parametre.validator";

const router = Router();

// Villes
router.get("/villes", authenticateToken, parametreController.ville.list);
router.get("/villes/:id", authenticateToken, parametreController.ville.getById);
router.post("/villes", authenticateToken, validate(VilleSchema), parametreController.ville.create);
router.put("/villes/:id", authenticateToken, validate(VilleSchema), parametreController.ville.update);
router.delete("/villes/:id", authenticateToken, parametreController.ville.delete);

// Zones
router.get("/zones", authenticateToken, parametreController.zone.list);
router.get("/zones/:id", authenticateToken, parametreController.zone.getById);
router.get("/zones/by-ville/:villeId", authenticateToken, parametreController.getZonesByVille);
router.post("/zones", authenticateToken, validate(ZoneSchema), parametreController.zone.create);
router.put("/zones/:id", authenticateToken, validate(ZoneSchema), parametreController.zone.update);
router.delete("/zones/:id", authenticateToken, parametreController.zone.delete);

// Familles
router.get("/familles", authenticateToken, parametreController.famille.list);
router.get("/familles/:id", authenticateToken, parametreController.famille.getById);
router.post("/familles", authenticateToken, validate(FamilleSchema), parametreController.famille.create);
router.put("/familles/:id", authenticateToken, validate(FamilleSchema), parametreController.famille.update);
router.delete("/familles/:id", authenticateToken, parametreController.famille.delete);

// Sous-Familles
router.get("/sous-familles", authenticateToken, parametreController.sousFamille.list);
router.get("/sous-familles/:id", authenticateToken, parametreController.sousFamille.getById);
router.get("/sous-familles/by-famille/:familleId", authenticateToken, parametreController.getSousFamillesByFamille);
router.post("/sous-familles", authenticateToken, validate(SousFamilleSchema), parametreController.sousFamille.create);
router.put("/sous-familles/:id", authenticateToken, validate(SousFamilleSchema), parametreController.sousFamille.update);
router.delete("/sous-familles/:id", authenticateToken, parametreController.sousFamille.delete);

// TVA
router.get("/tva", authenticateToken, parametreController.tva.list);
router.get("/tva/:id", authenticateToken, parametreController.tva.getById);
router.post("/tva", authenticateToken, validate(TVASchema), parametreController.tva.create);
router.put("/tva/:id", authenticateToken, validate(TVASchema), parametreController.tva.update);
router.delete("/tva/:id", authenticateToken, parametreController.tva.delete);

// Dépôts
router.get("/depots", authenticateToken, parametreController.depot.list);
router.get("/depots/:id", authenticateToken, parametreController.depot.getById);
router.post("/depots", authenticateToken, validate(DepotSchema), parametreController.depot.create);
router.put("/depots/:id", authenticateToken, validate(DepotSchema), parametreController.depot.update);
router.delete("/depots/:id", authenticateToken, parametreController.depot.delete);

// Catégories Clients
router.get("/categories-clients", authenticateToken, parametreController.categorieClient.list);
router.get("/categories-clients/:id", authenticateToken, parametreController.categorieClient.getById);
router.post("/categories-clients", authenticateToken, validate(CategorieClientSchema), parametreController.categorieClient.create);
router.put("/categories-clients/:id", authenticateToken, validate(CategorieClientSchema), parametreController.categorieClient.update);
router.delete("/categories-clients/:id", authenticateToken, parametreController.categorieClient.delete);

// Groupes de Remise
router.get("/groupes-remise", authenticateToken, parametreController.groupeRemise.list);
router.get("/groupes-remise/:id", authenticateToken, parametreController.groupeRemise.getById);
router.post("/groupes-remise", authenticateToken, validate(GroupeRemiseSchema), parametreController.groupeRemise.create);
router.put("/groupes-remise/:id", authenticateToken, validate(GroupeRemiseSchema), parametreController.groupeRemise.update);
router.delete("/groupes-remise/:id", authenticateToken, parametreController.groupeRemise.delete);

// Livreurs
router.get("/livreurs", authenticateToken, parametreController.livreur.list);
router.get("/livreurs/:id", authenticateToken, parametreController.livreur.getById);
router.post("/livreurs", authenticateToken, validate(LivreurSchema), parametreController.livreur.create);
router.put("/livreurs/:id", authenticateToken, validate(LivreurSchema), parametreController.livreur.update);
router.delete("/livreurs/:id", authenticateToken, parametreController.livreur.delete);

// Modes de Règlement
router.get("/modes-reglement", authenticateToken, parametreController.modeReglement.list);
router.get("/modes-reglement/:id", authenticateToken, parametreController.modeReglement.getById);
router.post("/modes-reglement", authenticateToken, validate(ModeReglementSchema), parametreController.modeReglement.create);
router.put("/modes-reglement/:id", authenticateToken, validate(ModeReglementSchema), parametreController.modeReglement.update);
router.delete("/modes-reglement/:id", authenticateToken, parametreController.modeReglement.delete);

// Nomenclatures (BOM)
router.get("/nomenclatures", authenticateToken, parametreController.listNomenclatures);
router.get("/nomenclatures/:id", authenticateToken, parametreController.getNomenclature);
router.post("/nomenclatures", authenticateToken, validate(NomenclatureSchema), parametreController.createNomenclature);
router.put("/nomenclatures/:id", authenticateToken, validate(NomenclatureSchema), parametreController.updateNomenclature);
router.delete("/nomenclatures/:id", authenticateToken, parametreController.deleteNomenclature);

// Fournisseurs
router.get("/fournisseurs", authenticateToken, parametreController.listFournisseurs);
router.get("/fournisseurs/:id", authenticateToken, parametreController.getFournisseur);
router.post("/fournisseurs", authenticateToken, validate(FournisseurSchema), parametreController.createFournisseur);
router.put("/fournisseurs/:id", authenticateToken, validate(FournisseurSchema), parametreController.updateFournisseur);

export default router;
