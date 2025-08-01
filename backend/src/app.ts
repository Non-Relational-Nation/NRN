import express from "express";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.ts";
import federation from "./federation.ts";
import { integrateFederation } from "@fedify/express";
import mongoose from "mongoose";

export const createApp = () => {
  const app = express();
  // Basic middleware
  app.use(express.json());
  app.use(cors());
  //app.use(authMiddleware);
  app.set("trust proxy", true);

  
  // Health check with database connectivity verification at /api/health endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const healthStatus = {
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        database: {
          status: "unknown",
          readyState: mongoose.connection.readyState
        }
      };

      // Check MongoDB connection state
      switch (mongoose.connection.readyState) {
        case 1: // Connected
          await mongoose.connection.db?.admin().ping();
          healthStatus.database.status = "connected";
          break;
        case 2: // Connecting
          healthStatus.database.status = "connecting";
          healthStatus.status = "DEGRADED";
          break;
        case 0: // Disconnected
          healthStatus.database.status = "disconnected";
          healthStatus.status = "UNHEALTHY";
          break;
        default:
          healthStatus.database.status = "unknown";
          healthStatus.status = "DEGRADED";
      }

      const statusCode = healthStatus.status === "UNHEALTHY" ? 503 : 200;
      res.status(statusCode).json(healthStatus);
      
    } catch (error) {
      res.status(503).json({
        status: "UNHEALTHY",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        database: {
          status: "error",
          error: error instanceof Error ? error.message : "Database check failed"
        }
      });
    }
  });
  
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
