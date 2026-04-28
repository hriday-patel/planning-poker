import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "../types/auth.types";
import { authenticate } from "../middleware/auth";
import {
  authRateLimiter,
  gameCreationRateLimiter,
  strictAuthRateLimiter,
} from "../middleware/rateLimiter";
import {
  handleOAuthCallback,
  storeOAuthState,
  verifyOAuthState,
  deleteSession,
  createInviteLink,
  validateInviteToken,
  sanitizeReturnTo,
} from "../services/authService";
import { refreshAccessToken } from "../services/tokenService";
import { logger } from "../utils/logger";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * GET /api/v1/auth/w3id
 * Initiate W3ID OAuth flow
 */
router.get(
  "/w3id",
  authRateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate and store CSRF state
      const state = uuidv4();
      const returnTo = sanitizeReturnTo(
        req.query.returnTo as string | undefined,
      );

      await storeOAuthState(state, returnTo);

      // Initiate OAuth flow with Passport
      passport.authenticate("w3id", {
        state,
        session: false,
      })(req, res, next);
    } catch (error) {
      logger.error("Error initiating W3ID OAuth:", error);
      res.status(500).json({
        success: false,
        error: "Failed to initiate authentication",
      });
    }
  },
);

/**
 * POST /api/v1/auth/w3id/callback
 * Handle W3ID OAuth callback
 */
router.get(
  "/w3id/callback",
  authRateLimiter,
  passport.authenticate("w3id", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
  }),
  async (req: Request, res: Response) => {
    try {
      // Verify OAuth state
      const state = req.query.state as string;
      if (!state) {
        return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
      }

      const stateData = await verifyOAuthState(state);
      if (!stateData) {
        return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
      }

      // Handle OAuth callback
      const profile = req.user as any;
      const authResult = await handleOAuthCallback(profile);

      if (!authResult.success || !authResult.tokens || !authResult.user) {
        return res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
      }

      // Set httpOnly cookies
      res.cookie("accessToken", authResult.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.cookie("refreshToken", authResult.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      // Redirect to frontend with success
      const redirectUrl = `${FRONTEND_URL}${stateData.returnTo}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error("Error in OAuth callback:", error);
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  },
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  "/refresh",
  strictAuthRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: "Refresh token cookie required",
        });
        return;
      }

      const newAccessToken = await refreshAccessToken(refreshToken);

      if (!newAccessToken) {
        res.status(401).json({
          success: false,
          error: "Invalid or expired refresh token",
        });
        return;
      }

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.json({
        success: true,
      });
      return;
    } catch (error) {
      logger.error("Error refreshing token:", error);
      res.status(500).json({
        success: false,
        error: "Failed to refresh token",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/auth/logout
 * Logout user and revoke session
 */
router.post(
  "/logout",
  authenticate as any,
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (authReq.userId) {
        // Delete session from Redis
        await deleteSession(authReq.userId);
      }

      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Error during logout:", error);
      res.status(500).json({
        success: false,
        error: "Failed to logout",
      });
    }
  },
);

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get(
  "/me",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    try {
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: "Not authenticated",
        });
        return;
      }

      res.json({
        success: true,
        user: authReq.user,
      });
      return;
    } catch (error) {
      logger.error("Error fetching current user:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user data",
      });
      return;
    }
  },
);

router.post(
  "/invite-links/:gameId",
  authenticate as any,
  gameCreationRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      const invite = await createInviteLink(req.params.gameId, authReq.userId!);

      res.status(201).json({
        success: true,
        invite,
      });
      return;
    } catch (error: any) {
      logger.error("Error creating invite link:", error);
      res.status(error.message?.includes("facilitator") ? 403 : 500).json({
        success: false,
        error: error.message || "Failed to create invite link",
      });
      return;
    }
  },
);

router.get(
  "/invite-links/validate",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.query.token as string;

      if (!token) {
        res.status(400).json({
          success: false,
          error: "Invite token is required",
        });
        return;
      }

      const invite = await validateInviteToken(token);

      if (!invite) {
        res.status(404).json({
          success: false,
          error: "Invite link is invalid or expired",
        });
        return;
      }

      res.json({
        success: true,
        invite,
      });
      return;
    } catch (error) {
      logger.error("Error validating invite link:", error);
      res.status(500).json({
        success: false,
        error: "Failed to validate invite link",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
