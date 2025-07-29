import { config } from "../config/index";
import { Request, Response } from "express";
import { decodeJwt, JWTPayload } from "jose";

export class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
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

      const { id_token } = (await tokenResponse.json()) as { id_token: string };
      const decoded = decodeJwt(id_token) as JWTPayload;

      console.log("Sub: " + decoded.sub);
      console.log(decoded);

      return res.status(200).json({
        id_token,
      });
    } catch (err) {
      console.error("Login handler error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  }
}
