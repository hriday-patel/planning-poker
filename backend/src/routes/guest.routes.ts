/**
 * Guest Routes
 *
 * API endpoints for guest user functionality
 */

import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { optionalAuthenticate } from "../middleware/auth";
import {
  gameCreationRateLimiter,
  authRateLimiter,
} from "../middleware/rateLimiter";
import { createGuestSession, isGuestUser } from "../services/guestService";
import { createGame, getGameDetails } from "../services/gameService";
import { logger } from "../utils/logger";

const router = Router();

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * POST /api/v1/guest/create-session
 * Create a new guest session
 */
router.post(
  "/create-session",
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { displayName } = req.body;

      // Create guest session
      const { user, tokens } = await createGuestSession(displayName);

      // Set httpOnly cookies
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
      });

      res.status(201).json({
        success: true,
        user,
        tokens,
      });
      return;
    } catch (error) {
      logger.error("Error creating guest session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create guest session",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/guest/games
 * Create a new game as a guest user
 */
router.post(
  "/games",
  optionalAuthenticate as any,
  gameCreationRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      let userId = authReq.userId;
      let isNewGuest = false;

      // If no user is authenticated, create a guest session
      if (!userId) {
        const { displayName } = req.body;
        const { user, tokens } = await createGuestSession(displayName);
        userId = user.userId;
        isNewGuest = true;

        // Set cookies for the new guest
        res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
        });

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
        });
      }

      const {
        name,
        voting_system,
        deck_id,
        who_can_reveal,
        who_can_manage_issues,
        auto_reveal,
        fun_features_enabled,
        show_average,
        show_countdown,
      } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: "Game name is required",
        });
        return;
      }

      // Create the game
      const game = await createGame(userId, {
        name,
        deck_id: deck_id ?? voting_system,
        who_can_reveal,
        who_can_manage_issues,
        auto_reveal,
        fun_features_enabled,
        show_average,
        show_countdown,
      });

      const gameDetails = await getGameDetails(game.id);

      res.status(201).json({
        success: true,
        game: gameDetails,
        isNewGuest,
      });
      return;
    } catch (error: any) {
      logger.error("Error creating game as guest:", error);

      if (error.message && error.message.includes("must")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to create game",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/guest/join/:gameId
 * Join a game as a guest user
 */
router.post(
  "/join/:gameId",
  optionalAuthenticate as any,
  authRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      let userId = authReq.userId;
      let isNewGuest = false;

      // If no user is authenticated, create a guest session
      if (!userId) {
        const { displayName } = req.body;
        const { user, tokens } = await createGuestSession(displayName);
        userId = user.userId;
        isNewGuest = true;

        // Set cookies for the new guest
        res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
        });

        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: COOKIE_MAX_AGE,
        });
      }

      const { gameId } = req.params;

      // Get game details
      const gameDetails = await getGameDetails(gameId);

      if (!gameDetails) {
        res.status(404).json({
          success: false,
          error: "Game not found",
        });
        return;
      }

      res.json({
        success: true,
        game: gameDetails,
        isNewGuest,
        userId,
      });
      return;
    } catch (error) {
      logger.error("Error joining game as guest:", error);
      res.status(500).json({
        success: false,
        error: "Failed to join game",
      });
      return;
    }
  },
);

/**
 * GET /api/v1/guest/check
 * Check if current user is a guest
 */
router.get(
  "/check",
  optionalAuthenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    try {
      const isGuest = authReq.userId ? isGuestUser(authReq.userId) : false;

      res.json({
        success: true,
        isGuest,
        user: authReq.user || null,
      });
      return;
    } catch (error) {
      logger.error("Error checking guest status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check guest status",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
