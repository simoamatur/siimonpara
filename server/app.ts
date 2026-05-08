import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requêtes, réessayez plus tard" },
  })
);

// Body parsing
app.use(express.json());
app.use(cookieParser());

// Logging
app.use(morgan("short"));

// API Routes
app.use("/api", routes);

// 404 for API
app.use("/api", notFound);

// Error handler
app.use(errorHandler);

export default app;
