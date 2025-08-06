import type { Request as ExpressRequest } from "express";
import federation from "../federation.ts";
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
export function createFederationContextFromExpressReq(req: ExpressRequest) {
  logger.log("[federationContext] Request headers:", req);
  const protocol = "https";//req.get("X-Forwarded-Proto") || req.protocol;
  const fullUrl = 'https://dikiudmyn4guv.cloudfront.net';
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
