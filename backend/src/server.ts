// Load environment variables FIRST, before any module that reads process.env
// at import time (e.g. tokenService).
import "./config/env";

import express, { Application } from "express";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import selfsigned from "selfsigned";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import passport from "passport";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { connectRedis, disconnectRedis, redisClient } from "./config/redis";
import { db } from "./config/database";
import { configurePassport } from "./config/passport";
import { verifyAccessToken } from "./services/tokenService";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import gameRoutes from "./routes/game.routes";
import deckRoutes from "./routes/deck.routes";
import issueRoutes from "./routes/issue.routes";
import guestRoutes from "./routes/guest.routes";
import { initializeSystemDecks } from "./services/deckService";
import { findGuestUserById, isGuestUser } from "./services/guestService";
import { findUserById } from "./services/userService";
import { registerHandlers } from "./websocket/handlers";

const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return cookies;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());

      if (key) {
        cookies[key] = value;
      }

      return cookies;
    }, {});
};

const extractSocketAccessToken = (
  socket: Parameters<Parameters<typeof io.use>[0]>[0],
): string | null => {
  const cookies = parseCookies(socket.handshake.headers.cookie);
  const cookieToken = cookies.accessToken;

  if (cookieToken) {
    return cookieToken;
  }

  const authToken = socket.handshake.auth.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken;
  }

  const queryToken = socket.handshake.query.token;
  if (typeof queryToken === "string" && queryToken.trim()) {
    return queryToken;
  }

  return null;
};

// Initialize Redis connection
connectRedis().catch((error) => {
  logger.error("Failed to connect to Redis:", error);
  process.exit(1);
});

// Initialize system decks
initializeSystemDecks().catch((error) => {
  logger.error("Failed to initialize system decks:", error);
  // Don't exit - this is not critical for startup
});

// Configure Passport
configurePassport();

const app: Application = express();

const useHttps = process.env.LOCAL_HTTPS === "true";
const certDirectory = path.join(__dirname, "../certs");
const keyPath = path.join(certDirectory, "localhost-key.pem");
const certPath = path.join(certDirectory, "localhost.pem");

const createHttpsServer = (): https.Server => {
  if (!fs.existsSync(certDirectory)) {
    fs.mkdirSync(certDirectory, { recursive: true });
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    const attrs = [{ name: "commonName", value: "localhost" }];
    const pems = selfsigned.generate(attrs, {
      algorithm: "sha256",
      days: 30,
      keySize: 2048,
      extensions: [
        {
          name: "subjectAltName",
          altNames: [{ type: 2, value: "localhost" }],
        },
      ],
    });

    fs.writeFileSync(keyPath, pems.private, "utf8");
    fs.writeFileSync(certPath, pems.cert, "utf8");
    logger.info(`Generated local HTTPS certificate at ${certPath}`);
  }

  return https.createServer(
    {
      key: fs.readFileSync(keyPath, "utf8"),
      cert: fs.readFileSync(certPath, "utf8"),
    },
    app,
  );
};

const server = useHttps ? createHttpsServer() : http.createServer(app);

const parseAllowedOrigins = (): string[] => {
  const configuredOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    "http://localhost:3000",
  ]
    .filter(Boolean)
    .flatMap((originList) => originList!.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set(configuredOrigins));
};

const allowedOrigins = parseAllowedOrigins();
const corsCredentials = process.env.CORS_CREDENTIALS !== "false";
const expressCorsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: corsCredentials,
};

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: corsCredentials,
  },
});

app.set("io", io);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(expressCorsOptions));
app.use(compression());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Serve static files (uploaded avatars)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", async (_req, res) => {
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([db.query("SELECT 1"), redisClient.ping()]);

    res.status(200).json({
      status: "ok",
      timestamp,
      dependencies: {
        database: "ok",
        redis: "ok",
      },
    });
    return;
  } catch (error) {
    logger.error("Health check failed:", error);

    res.status(503).json({
      status: "degraded",
      timestamp,
      dependencies: {
        database: "unknown",
        redis: "unknown",
      },
    });
    return;
  }
});

// API routes
app.get("/api/v1", (_req, res) => {
  res.json({
    message: "Planning Poker API v1",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      guest: "/api/v1/guest",
      users: "/api/v1/users",
      games: "/api/v1/games",
      decks: "/api/v1/decks",
      issues: "/api/v1/games/:gameId/issues",
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/guest", guestRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/games", gameRoutes);
app.use("/api/v1/games", issueRoutes);
app.use("/api/v1/decks", deckRoutes);

// Error handling middleware
app.use(errorHandler);

// WebSocket connection handling with authentication (supports guest users)
io.use(async (socket, next) => {
  try {
    const token = extractSocketAccessToken(socket);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(new Error("Invalid or expired token"));
    }

    const isGuest = isGuestUser(payload.userId);
    const user = isGuest
      ? await findGuestUserById(payload.userId)
      : await findUserById(payload.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    // Store current user info in socket for handlers
    (socket as any).userId = payload.userId;
    (socket as any).displayName = user.display_name;
    (socket as any).isGuest = isGuest;

    logger.info(
      `WebSocket authenticated: ${payload.userId} (guest: ${isGuest})`,
    );
    next();
  } catch (error) {
    logger.error("WebSocket authentication error:", error);
    next(new Error("Authentication failed"));
  }
});

// Register WebSocket event handlers
registerHandlers(io);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(
    `Server running on ${useHttps ? "https" : "http"}://localhost:${PORT}`,
  );
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Shutdown signal received: closing connections");

  // Close HTTP server
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Close Redis connection
  await disconnectRedis();

  // Close database connections if needed
  // await db.end();

  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export { app, server, io };

// Made with Bob
