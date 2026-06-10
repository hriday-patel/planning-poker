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
  getUserGameHistory,
  getGameSummary,
  addGameParticipant,
  isGameParticipant,
  getGameVotingHistory,
  GAME_HISTORY_DEFAULT_PAGE_SIZE,
  GAME_HISTORY_MAX_PAGE_SIZE,
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
        custom_deck_values,
        who_can_reveal,
        who_can_manage_issues,
        who_can_toggle_spectator,
        auto_reveal,
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
        voting_system,
        deck_id: deck_id ?? voting_system,
        custom_deck_values,
        who_can_reveal,
        who_can_manage_issues,
        who_can_toggle_spectator,
        auto_reveal,
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
 * GET /api/v1/games/my/list
 * Get a page of games the user has participated in (most recent first),
 * enriched with metadata for the Game History view.
 * Supports ?limit and ?offset query params for pagination.
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

      const parsedLimit = Number.parseInt(String(req.query.limit), 10);
      const parsedOffset = Number.parseInt(String(req.query.offset), 10);
      const limit = Math.min(
        Math.max(
          Number.isNaN(parsedLimit) ? GAME_HISTORY_DEFAULT_PAGE_SIZE : parsedLimit,
          1,
        ),
        GAME_HISTORY_MAX_PAGE_SIZE,
      );
      const offset = Math.max(Number.isNaN(parsedOffset) ? 0 : parsedOffset, 0);

      const { games, total } = await getUserGameHistory(authReq.userId, {
        limit,
        offset,
      });

      res.json({
        success: true,
        games,
        pagination: {
          total,
          limit,
          offset,
          has_more: offset + games.length < total,
        },
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
        who_can_toggle_spectator,
        auto_reveal,
        show_average,
        show_countdown,
        status,
      } = req.body;

      const updatedGame = await updateGame(gameId, authReq.userId, {
        name,
        facilitator_id,
        who_can_reveal,
        who_can_manage_issues,
        who_can_toggle_spectator,
        auto_reveal,
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

/**
 * GET /api/v1/games/:gameId/summary
 * Get the full summary of a game (details, participants, issues, rounds)
 * for the Game History detail view. Unlike GET /:gameId, this never
 * adds the requester as a participant.
 */
router.get(
  "/:gameId/summary",
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
          error: "You must be a participant to view this game",
        });
        return;
      }

      const summary = await getGameSummary(gameId);

      if (!summary) {
        res.status(404).json({
          success: false,
          error: "Game not found",
        });
        return;
      }

      res.json({
        success: true,
        ...summary,
      });
      return;
    } catch (error) {
      logger.error("Error fetching game summary:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch game summary",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
