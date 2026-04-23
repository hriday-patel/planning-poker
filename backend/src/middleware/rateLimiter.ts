import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger";

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/callback endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many requests, please try again later",
    });
  },
});

/**
 * Stricter rate limiter for sensitive auth operations
 * (e.g., password reset, token refresh)
 */
export const strictAuthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: "Too many attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many attempts, please try again in 15 minutes",
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    error: "Too many uploads, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many uploads, please try again in an hour",
    });
  },
});

/**
 * Rate limiter for game creation
 * Prevents spam game creation
 */
export const gameCreationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 game creations per 15 minutes
  message: {
    success: false,
    error: "Too many games created, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Game creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: "Too many games created, please try again in 15 minutes",
    });
  },
});

// Made with Bob
