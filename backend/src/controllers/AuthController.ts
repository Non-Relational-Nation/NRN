import { config } from "../config/index.ts";
import { Request, Response } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";
import userService from "@/services/userService.ts";

export class AuthController {
  private userService;
  constructor(userServiceInstance = userService) {
    this.userService = userServiceInstance;
  }
  async login(req: Request, res: Response): Promise<Response> {
    console.log('[AuthController] Login attempt started');
    console.log('[AuthController] Request body:', req.body);
    console.log('[AuthController] Config check:', {
      clientId: config?.google?.clientId ? 'SET' : 'MISSING',
      clientSecret: config?.google?.clientSecret ? 'SET' : 'MISSING', 
      redirectUrl: config?.google?.redirectUrl
    });
    
    try {
      const { code } = req.body as { code?: string };

      if (!code) {
        console.error('[AuthController] Missing authorization code');
        return res.status(400).json({ error: "Missing authorization code" });
      }

      console.log('[AuthController] Exchanging code for token...');
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
      console.log('[AuthController] Google token response:', tokenJson);
      const { id_token } = tokenJson as { id_token: string };
      if (!id_token) {
        console.error('[AuthController] No id_token in Google response', tokenJson);
        return res.status(400).json({ error: 'No id_token in Google response', details: tokenJson });
      }
      // Verify Google id_token using Google's JWKS
      let decoded;
      try {
        const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
        const { payload } = await jwtVerify(id_token, JWKS, {
          issuer: 'https://accounts.google.com',
          audience: config?.google.clientId ?? '',
        });
        decoded = payload;
        console.log('[AuthController] Google id_token verified:', decoded);
      } catch (err) {
        console.error('[AuthController] Google id_token verification failed:', err);
        return res.status(400).json({ error: 'Invalid Google id_token', details: err instanceof Error ? err.message : String(err) });
      }

      const username = (decoded.username || decoded.email || decoded.sub || "").toString();
      const email = (decoded.email || "").toString();
      const displayName = (decoded.name || username).toString();
      console.log("[AuthController] Registering user:", { username, email, displayName });
      if (!username || !email) {
        console.error("[AuthController] No username or email found in token", { username, email });
        return res.status(400).json({ error: "No username or email found in token" });
      }
      const context = { hostname: req.hostname, getActorUri: () => ({ href: "" }), getInboxUri: () => ({ href: "" }) };
      // You should replace the above context with your actual federation context logic

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
          console.error("[AuthController] Error in registerUser", err);
          return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
        }
      }

      return res.status(200).json({
        id_token,
        user,
      });
    } catch (err) {
      console.error("Login handler error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  }
}
