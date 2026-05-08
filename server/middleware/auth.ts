import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ error: "Token manquant" });
    return;
  }

  jwt.verify(token, config.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ error: "Token non valide ou expiré" });
      return;
    }
    req.user = user;
    next();
  });
};
