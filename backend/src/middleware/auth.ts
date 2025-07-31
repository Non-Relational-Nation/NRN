import { AuthUser } from "../types/auth.ts";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const unauthedEndpoints: string[] = ["/health", "/api/auth/login"];

export const authMiddleware: RequestHandler  = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (unauthedEndpoints.includes(req.path)) return next();

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  (async () => {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: "https://accounts.google.com",
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      req.user = payload;
      next();
    } catch (err) {
      console.error("Invalid Google token:", err);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  })();
};
