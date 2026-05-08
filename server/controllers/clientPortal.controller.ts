import { Request, Response } from "express";
import { clientPortalService } from "../services/clientPortal.service";

export const clientPortalController = {
  async getDashboard(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) { res.status(401).json({ error: "Non autorisé" }); return; }
    try {
      const data = await clientPortalService.getDashboard(clientId);
      res.json(data);
    } catch (error) {
      console.error("Client dashboard error:", error);
      res.status(500).json({ error: "Erreur lors du chargement du tableau de bord" });
    }
  },

  async listProducts(req: Request, res: Response) {
    try {
      const search = req.query.search as string | undefined;
      const products = await clientPortalService.listProducts(search);
      res.json(products);
    } catch (error) {
      console.error("Client products error:", error);
      res.status(500).json({ error: "Erreur lors du chargement des produits" });
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const product = await clientPortalService.getProductById(req.params.id);
      if (!product) { res.status(404).json({ error: "Produit non trouvé" }); return; }
      res.json(product);
    } catch (error) {
      console.error("Client product error:", error);
      res.status(500).json({ error: "Erreur lors du chargement du produit" });
    }
  },

  async listCommandes(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) { res.status(401).json({ error: "Non autorisé" }); return; }
    try {
      const data = await clientPortalService.listCommandes(clientId);
      res.json(data);
    } catch (error) {
      console.error("Client commandes error:", error);
      res.status(500).json({ error: "Erreur lors du chargement des commandes" });
    }
  },

  async getCommande(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) { res.status(401).json({ error: "Non autorisé" }); return; }
    try {
      const commande = await clientPortalService.getCommande(req.params.id, clientId);
      if (!commande) { res.status(404).json({ error: "Commande non trouvée" }); return; }
      res.json(commande);
    } catch (error) {
      console.error("Client commande error:", error);
      res.status(500).json({ error: "Erreur lors du chargement de la commande" });
    }
  },

  async createCommande(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) { res.status(401).json({ error: "Non autorisé" }); return; }
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) { res.status(400).json({ error: "Panier vide" }); return; }
      const commande = await clientPortalService.createCommande(clientId, items);
      res.status(201).json(commande);
    } catch (error) {
      console.error("Client create commande error:", error);
      res.status(500).json({ error: "Erreur lors de la création de la commande" });
    }
  },

  async listPromotions(_req: Request, res: Response) {
    try {
      const promotions = await clientPortalService.listPromotions();
      res.json(promotions);
    } catch (error) {
      console.error("Client promotions error:", error);
      res.status(500).json({ error: "Erreur lors du chargement des promotions" });
    }
  },

  async updateProfile(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) { res.status(401).json({ error: "Non autorisé" }); return; }
    try {
      const { name, email, phone, address, city } = req.body;
      const profile = await clientPortalService.updateProfile(clientId, { name, email, phone, address, city });
      res.json(profile);
    } catch (error) {
      console.error("Client profile update error:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }
  },
};
