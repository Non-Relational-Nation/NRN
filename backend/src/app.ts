import express from "express";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.ts";
import federation from "./federation.ts";
import { integrateFederation } from "@fedify/express";
import { postRoutes } from "./routes/posts.ts";

export const createApp = () => {
  const app = express();

  // CORS middleware
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "https://d3m0gyk7rj0vr1.cloudfront.net",
        "http://nrn-alb-grad-group01-dev-1538977457.af-south-1.elb.amazonaws.com",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Fix missing Accept header
  app.use((req, res, next) => {
    if (!req.headers.accept || req.headers.accept.trim() === "") {
      req.headers.accept = "application/activity+json";
    }
    next();
  });

  // Federation middleware MUST be before any body parsing middleware
  app.use(
    integrateFederation(federation, (req) => {
      const headers = new Headers(req.headers as any);

      // Build absolute URL required by Request constructor
      const protocol =
        req.protocol ||
        (req.headers["x-forwarded-proto"] as string) ||
        "http";
      const host = req.headers.host;
      if (!host) {
        throw new Error("Missing Host header");
      }
      const fullUrl = `${protocol}://${host}${req.url}`;

      const body =
        req.method !== "GET" && req.method !== "HEAD" ? req : undefined;

      return new Request(fullUrl, {
        method: req.method,
        headers,
        body,
        duplex: "half",
      } as RequestInit & { duplex: string });
    })
  );

  // Use express.json() for your API routes AFTER federation middleware
  app.use(express.json());

  // Your API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/users", userRoutes);

  // Health check route
  app.get("/api/health", async (req, res) => {
    try {
      const mongoose = await import("mongoose");
      const dbStatus =
        mongoose.default.connection.readyState === 1 ? "connected" : "disconnected";

      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
};
