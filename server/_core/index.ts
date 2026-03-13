import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createStripeWebhookRoute } from "./stripeWebhookRoute";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => { server.close(() => resolve(true)); });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Security headers middleware (replaces helmet) ────────────────────────────
function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Basic XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Limit referrer info
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  // Content Security Policy
  const isDev = process.env.NODE_ENV !== "production";
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ""} https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.amazonaws.com",
      "connect-src 'self' https://api.stripe.com https://*.amazonaws.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "font-src 'self' data:",
      "object-src 'none'",
    ].join("; ")
  );
  next();
}

// ─── CORS middleware ──────────────────────────────────────────────────────────
function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : ["http://localhost:3000", "http://localhost:5173"];

  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === "production";

  // Allow any LAN IP (192.168.x.x / 10.x.x.x / 172.16-31.x.x) in development
  const isLanOrigin = !isProduction && origin
    ? /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)
    : false;

  if (!isProduction || isLanOrigin || (origin && allowedOrigins.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
}

// ─── Request logger ───────────────────────────────────────────────────────────
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    if (req.path.startsWith("/api")) {
      console.log(`[${level}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
}

function validateEnv() {
  const required: Record<string, string> = {
    DATABASE_URL: "MySQL connection string",
    JWT_SECRET: "Session signing secret (min 32 chars)",
  };

  const missing: string[] = [];
  for (const [key, desc] of Object.entries(required)) {
    if (!process.env[key]) missing.push(`  ${key} — ${desc}`);
  }

  // ENCRYPTION_KEY: required in production, warn in dev
  if (!process.env.ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
      missing.push("  ENCRYPTION_KEY — 64-char hex key for AES-256-GCM encryption");
    } else {
      console.warn("[Startup] ENCRYPTION_KEY not set — using dev fallback key (NEVER in production)");
    }
  }

  if (missing.length > 0) {
    console.error("[Startup] Missing required environment variables:\n" + missing.join("\n"));
    process.exit(1);
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error("[Startup] JWT_SECRET must be at least 32 characters");
    process.exit(1);
  }
}

async function startServer() {
  validateEnv();

  const app = express();
  const server = createServer(app);

  // Apply security + CORS first
  app.use(corsMiddleware);
  app.use(securityHeaders);
  app.use(requestLogger);

  // Stripe webhook needs raw body — BEFORE json parsing
  app.use(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    createStripeWebhookRoute()
  );

  // Body parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth
  registerOAuthRoutes(app);

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const host = "0.0.0.0";
  server.listen(port, host, () => {
    const { networkInterfaces } = require("os");
    const nets = networkInterfaces();
    const lanIPs: string[] = [];
    for (const iface of Object.values(nets) as any[]) {
      for (const net of (iface ?? []) as any[]) {
        if (net.family === "IPv4" && !net.internal) lanIPs.push(net.address);
      }
    }
    console.log(`[INFO] Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`[INFO] Local:   http://localhost:${port}/`);
    lanIPs.forEach(ip => console.log(`[INFO] Network: http://${ip}:${port}/  <-- شارك هذا الرابط مع اجهزة الشبكة`));
  });

  return server;
}

startServer().then((server) => {
  function shutdown(signal: string) {
    console.log(`[Shutdown] Received ${signal}, closing server gracefully...`);
    (server as any).close(() => {
      console.log("[Shutdown] HTTP server closed");
      process.exit(0);
    });
    // Force close after 10s if hanging
    setTimeout(() => {
      console.error("[Shutdown] Forced exit after 10s timeout");
      process.exit(1);
    }, 10_000);
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));
}).catch(console.error);
