import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app";
import { config } from "./config";
import { logger } from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: path.resolve(__dirname, ".."),
  });
  app.use(vite.middlewares);
  logger.info("Vite middleware attached");
  listen();
}

function startProdServer() {
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "..", "dist", "index.html"));
  });
  listen();
}

function listen() {
  app.listen(config.PORT, "0.0.0.0", () => {
    logger.info(`ERP Server running on http://localhost:${config.PORT}`);
    logger.info(`Mode: ${config.NODE_ENV}`);
  });
}

if (config.NODE_ENV === "production") {
  startProdServer();
} else {
  startDevServer();
}
