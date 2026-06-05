import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit } from 'express-rate-limit';

import { apiRouter } from "./src/server/api";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for secure ingress
  app.set('trust proxy', 1);

  app.use(helmet({
      contentSecurityPolicy: false,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Basic rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false }
  });
  app.use('/api', limiter);

  // Mount API router
  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
