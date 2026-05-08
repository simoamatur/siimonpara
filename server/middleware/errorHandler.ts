import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled Error:", err);
  res.status(500).json({ error: "خطأ داخلي في الخادم" });
};
