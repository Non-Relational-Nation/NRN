import type { Request as ExpressRequest } from "express";
import federation from "../federation.ts";

export function createFederationContextFromExpressReq(req: ExpressRequest) {
  const protocol = req.get("X-Forwarded-Proto") || req.protocol;
  const fullUrl = `${protocol}s://${req.get("host")}${req.originalUrl}`;
  const url = new URL(fullUrl);

  const headers: HeadersInit = Object.entries(req.headers).reduce(
    (acc, [key, value]) => {
      acc[key] = Array.isArray(value) ? value.join(",") : value ?? "";
      return acc;
    },
    {} as Record<string, string>
  );

  headers["content-type"] ||= "application/json";

  const fetchRequest = new globalThis.Request(url, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : JSON.stringify(req.body),
    duplex: "half",
  } as any);

  return federation.createContext(fetchRequest, undefined);
}
