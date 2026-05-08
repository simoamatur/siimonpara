import { Request, Response } from "express";
import { usersService } from "../services/users.service";

export const usersController = {
  async list(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const users = await usersService.list(search);
      res.json(users);
    } catch (error) {
      console.error("Users list error:", error);
      res.status(500).json({ error: "Erreur lors du chargement des utilisateurs" });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const user = await usersService.getById(req.params.id);
      if (!user) { res.status(404).json({ error: "Utilisateur non trouvé" }); return; }
      res.json(user);
    } catch (error) {
      console.error("Users get error:", error);
      res.status(500).json({ error: "Erreur lors du chargement de l'utilisateur" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) { res.status(400).json({ error: "Champs obligatoires manquants" }); return; }
      const existing = await usersService.list();
      if (existing.find((u) => u.email === email)) { res.status(409).json({ error: "Email déjà utilisé" }); return; }
      const user = await usersService.create({ name, email, password, role });
      res.status(201).json(user);
    } catch (error) {
      console.error("Users create error:", error);
      res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const user = await usersService.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Users update error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      await usersService.remove(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Users delete error:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  },
};
