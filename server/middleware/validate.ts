import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = result.error as ZodError;
      res.status(400).json({
        error: "بيانات غير صالحة",
        details: error.issues.map((e) => e.message),
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
