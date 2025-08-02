import express from "express";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.ts";
import federation from "./federation.ts";
import { integrateFederation } from "@fedify/express";
import { postRoutes } from "./routes/posts.ts";

export const createApp = () => {
  const app = express();
  // Basic middleware
  app.use(express.json());
  app.use(cors());
  app.use(authMiddleware);
  app.set("trust proxy", true);

  
  // Health check
  app.get("api/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/users", userRoutes);
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