import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { verifyAccessToken } from "../services/tokenService";
import { findUserById, toUserSession } from "../services/userService";
import { logger } from "../utils/logger";

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token from Authorization header or cookies
    let token: string | undefined;

    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fall back to cookie if no header
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Verify the token
    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
      return;
    }

    // Fetch user from database
    const user = await findUserById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Attach user session to request
    req.user = toUserSession(user);
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during authentication",
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Extract token
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // If no token, just continue without user
    if (!token) {
      next();
      return;
    }

    // Try to verify and attach user
    const payload = verifyAccessToken(token);
    if (payload) {
      const user = await findUserById(payload.userId);
      if (user) {
        req.user = toUserSession(user);
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    logger.error("Optional authentication error:", error);
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Middleware to check if user is authenticated (simpler version)
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || !req.userId) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }
  next();
};

// Made with Bob
