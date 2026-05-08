import { Request, Response } from "express";
import { rolesService } from "../services/roles.service";

export const rolesController = {
  async list(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const roles = await rolesService.list(search);
      res.json(roles);
    } catch (error) {
      console.error("Roles list error:", error);
      res.status(500).json({ error: "Erreur lors du chargement des rôles" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const role = await rolesService.getById(req.params.id);
      if (!role) { res.status(404).json({ error: "Rôle non trouvé" }); return; }
      res.json(role);
    } catch (error) {
      console.error("Roles get error:", error);
      res.status(500).json({ error: "Erreur lors du chargement du rôle" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { code, libelle, description, permissions } = req.body;
      if (!code || !libelle) { res.status(400).json({ error: "Champs obligatoires manquants" }); return; }
      const role = await rolesService.create({ code, libelle, description, permissions });
      res.status(201).json(role);
    } catch (error) {
      console.error("Roles create error:", error);
      res.status(500).json({ error: "Erreur lors de la création du rôle" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const role = await rolesService.update(req.params.id, req.body);
      res.json(role);
    } catch (error) {
      console.error("Roles update error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du rôle" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      await rolesService.remove(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Roles delete error:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du rôle" });
    }
  },
};
