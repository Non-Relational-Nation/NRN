import { config } from "../config/index.ts";
import { Request, Response } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";
import userService from "@/services/userService.ts";
import actorService from "@/services/actorService.ts";
import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";

export class AuthController {
  private userService;
  private actorService;
  constructor(userServiceInstance = userService, actorServiceInstance = actorService) {
    this.userService = userServiceInstance;
    this.actorService = actorServiceInstance;
  }
  async login(req: Request, res: Response): Promise<Response> {
    console.log('[AuthController] Login attempt started');
    try {
      const { code } = req.body as { code?: string };

      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: config?.google.clientId ?? "",
          client_secret: config?.google.clientSecret ?? "",
          redirect_uri: config?.google.redirectUrl ?? "",
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Google token exchange failed:", errorData);
        return res
          .status(500)
          .json({ error: "Failed to exchange code for token" });
      }

      const tokenJson = await tokenResponse.json();
      const { id_token } = tokenJson as { id_token: string };
      if (!id_token) {
        return res.status(400).json({ error: 'No id_token in Google response', details: tokenJson });
      }
      let decoded;
      try {
        const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
        const { payload } = await jwtVerify(id_token, JWKS, {
          issuer: 'https://accounts.google.com',
          audience: config?.google.clientId ?? '',
        });
        decoded = payload;
      } catch (err) {
        return res.status(400).json({ error: 'Invalid Google id_token', details: err instanceof Error ? err.message : String(err) });
      }

      const email = (decoded.email || "").toString();
      const username = email.split('@')[0] || (decoded.username || decoded.sub || "").toString();
      const displayName = (decoded.name || username).toString();

      if (!username || !email) {
        return res.status(400).json({ error: "No username or email found in token" });
      }
      const context = createFederationContextFromExpressReq(req);

      const existingUser = await this.userService.getUserByUsername(username);
      let user = existingUser;
      if (!user) {
        try {
          await this.userService.registerUser({
            username,
            email,
            displayName,
            bio: "",
            avatar: null,
            context
          });
          user = await this.userService.getUserByUsername(username);
          
        } catch (err) {
          return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
        }
      }

      if (!user) {
        return res.status(500).json({ error: "User not found after registration" });
      }
      const actor = await this.actorService.getActorByUserId(user.id);

      return res.status(200).json({
        id_token,
        user,
        actor
      });
    } catch (err) {
      return res.status(500).json({ error: "Login failed" });
    }
  }
}
