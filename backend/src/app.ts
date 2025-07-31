import express from "express";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import federation from "./federation.js";
import { integrateFederation } from "@fedify/express";
import { activityPubRoutes } from './routes/activitypub.js';

export const createApp = () => {
  const app = express();
  // Basic middleware
  app.use(express.json());
  app.use(cors());
  app.use(authMiddleware);
  app.set("trust proxy", true);

  
  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ActivityPub routes (should be mounted before API routes to avoid conflicts)
  app.use(activityPubRoutes);
  
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/", userRoutes);
  // ActivityPub routes
  app.use(integrateFederation(federation, (req: express.Request) => undefined));
  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  return app;
};
