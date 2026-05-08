import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { config } from "../config";

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password, name, role } = req.body;
    try {
      const exists = await authService.checkUserExists(email);
      if (exists) {
        res.status(400).json({ error: "المستخدم موجود بالفعل" });
        return;
      }
      const user = await authService.register(email, password, name, role);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "المستخدم موجود بالفعل" });
    }
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    if (!result) {
      res.status(401).json({ error: "بيانات غير صحيحة" });
      return;
    }
    const isProd = config.NODE_ENV === "production";
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 8 * 60 * 60 * 1000,
      path: "/",
    });
    res.json(result);
  },

  async clientLogin(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.clientLogin(email, password);
    if (!result) {
      res.status(401).json({ error: "Email ou mot de passe incorrect" });
      return;
    }
    res.json(result);
  },

  async clientProfile(req: Request, res: Response) {
    const clientId = (req as any).user?.clientId;
    if (!clientId) {
      res.status(401).json({ error: "Non autorisé" });
      return;
    }
    const profile = await authService.getClientProfile(clientId);
    if (!profile) {
      res.status(404).json({ error: "Client non trouvé" });
      return;
    }
    res.json(profile);
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie("token");
    res.json({ message: "تم تسجيل الخروج" });
  },
};
