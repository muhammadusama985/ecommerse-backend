import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { apiRouter } from "./routes/index.js";

const app = express();

// Cloudflare Tunnel / reverse proxies forward client IP information via
// X-Forwarded-* headers, so Express must trust the proxy chain.
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedClientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(apiLimiter);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Nature Republic backend is running.",
  });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
