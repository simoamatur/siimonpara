import { Request } from "express";
import { PaginationParams } from "../types";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export const paginate = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? String(DEFAULT_LIMIT)))));
  return { skip: (page - 1) * limit, take: limit };
};

export const paginateMeta = (req: Request) => ({
  page: Math.max(1, parseInt(String(req.query.page ?? "1"))),
  limit: Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? String(DEFAULT_LIMIT))))),
});
