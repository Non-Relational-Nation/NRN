import express from "express";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import federation from "./federation.ts";
import { integrateFederation } from "@fedify/express";
import { postRoutes } from "./routes/posts.ts";

export const createApp = () => {
  const app = express();
  // Basic middleware
  app.use(express.json());
  app.use(cors());
  app.use(authMiddleware); // Re-enabled with proper path checking
  app.set("trust proxy", true);

  
  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const mongoose = await import("mongoose");
      const dbStatus = mongoose.default.connection.readyState === 1 ? "connected" : "disconnected";
      
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/users", userRoutes);
  // ActivityPub routes
  app.use(integrateFederation(federation, (req: express.Request) => undefined));
  
  // Error handler middleware (must be last)
  app.use(errorHandler);
  
  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  return app;
};