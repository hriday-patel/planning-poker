/**
 * Game Routes
 *
 * API endpoints for managing games
 */

import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { authenticate } from "../middleware/auth";
import { gameCreationRateLimiter } from "../middleware/rateLimiter";
import {
  createGame,
  getGameDetails,
  updateGame,
  getUserGames,
  addGameParticipant,
  isGameParticipant,
  getGameVotingHistory,
} from "../services/gameService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/v1/games
 * Create a new game
 * Rate limited to prevent spam
 */
router.post(
  "/",
  authenticate as any,
  gameCreationRateLimiter,
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

      const game = await createGame(authReq.userId, {
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
      });
      return;
    } catch (error: any) {
      logger.error("Error creating game:", error);

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
 * GET /api/v1/games/my
 * Get all games the user has participated in
 * Note: This route must be defined before /:gameId to avoid conflicts
 */
router.get(
  "/my/list",
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

      const games = await getUserGames(authReq.userId);

      res.json({
        success: true,
        games,
      });
      return;
    } catch (error) {
      logger.error("Error fetching user games:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch games",
      });
      return;
    }
  },
);

/**
 * GET /api/v1/games/:gameId
 * Get game details
 * User must be authenticated but doesn't need to be a participant yet
 * (allows joining via invite link)
 */
router.get(
  "/:gameId",
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

      const { gameId } = req.params;

      const gameDetails = await getGameDetails(gameId);

      if (!gameDetails) {
        res.status(404).json({
          success: false,
          error: "Game not found",
        });
        return;
      }

      const isParticipant = await isGameParticipant(gameId, authReq.userId);

      if (!isParticipant) {
        await addGameParticipant(gameId, authReq.userId);
      }

      res.json({
        success: true,
        game: gameDetails,
        isParticipant: true,
      });
      return;
    } catch (error) {
      logger.error("Error fetching game:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch game",
      });
      return;
    }
  },
);

/**
 * PATCH /api/v1/games/:gameId
 * Update game settings
 * Only facilitator can update
 */
router.patch(
  "/:gameId",
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

      const { gameId } = req.params;
      const {
        name,
        facilitator_id,
        who_can_reveal,
        who_can_manage_issues,
        auto_reveal,
        fun_features_enabled,
        show_average,
        show_countdown,
        status,
      } = req.body;

      const updatedGame = await updateGame(gameId, authReq.userId, {
        name,
        facilitator_id,
        who_can_reveal,
        who_can_manage_issues,
        auto_reveal,
        fun_features_enabled,
        show_average,
        show_countdown,
        status,
      });

      if (!updatedGame) {
        res.status(404).json({
          success: false,
          error: "Game not found",
        });
        return;
      }

      const gameDetails = await getGameDetails(updatedGame.id);

      res.json({
        success: true,
        game: gameDetails,
      });
      return;
    } catch (error: any) {
      logger.error("Error updating game:", error);

      if (error.message === "Game not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message === "Only the facilitator can update game settings" ||
        error.message === "New facilitator must be a game participant"
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message && error.message.includes("must")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to update game",
      });
      return;
    }
  },
);

/**
 * GET /api/v1/games/:gameId/history
 * Get voting history for a game
 */
router.get(
  "/:gameId/history",
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

      const { gameId } = req.params;

      const isParticipant = await isGameParticipant(gameId, authReq.userId);
      if (!isParticipant) {
        res.status(403).json({
          success: false,
          error: "You must be a participant to view game history",
        });
        return;
      }

      const history = await getGameVotingHistory(gameId);

      res.json({
        success: true,
        history,
      });
      return;
    } catch (error) {
      logger.error("Error fetching game history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch game history",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
