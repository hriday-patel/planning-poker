/**
 * Deck Routes
 *
 * API endpoints for managing voting system decks
 */

import { Router, Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth.types";
import { authenticate } from "../middleware/auth";
import {
  getAllDecks,
  getDeckById,
  createCustomDeck,
  deleteCustomDeck,
} from "../services/deckService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/v1/decks
 * Get all decks available to the user (system + custom)
 */
router.get(
  "/",
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

      const decks = await getAllDecks(authReq.userId);

      res.json({
        success: true,
        decks,
      });
      return;
    } catch (error) {
      logger.error("Error fetching decks:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch decks",
      });
      return;
    }
  },
);

/**
 * GET /api/v1/decks/:deckId
 * Get a specific deck by ID
 */
router.get(
  "/:deckId",
  authenticate as any,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { deckId } = req.params;

      const deck = await getDeckById(deckId);

      if (!deck) {
        res.status(404).json({
          success: false,
          error: "Deck not found",
        });
        return;
      }

      res.json({
        success: true,
        deck,
      });
      return;
    } catch (error) {
      logger.error("Error fetching deck:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch deck",
      });
      return;
    }
  },
);

/**
 * POST /api/v1/decks
 * Create a custom deck
 */
router.post(
  "/",
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

      const { name, values } = req.body;

      if (!name || !values) {
        res.status(400).json({
          success: false,
          error: "Name and values are required",
        });
        return;
      }

      if (!Array.isArray(values)) {
        res.status(400).json({
          success: false,
          error: "Values must be an array",
        });
        return;
      }

      const deck = await createCustomDeck(authReq.userId, { name, values });

      res.status(201).json({
        success: true,
        deck,
      });
      return;
    } catch (error: any) {
      logger.error("Error creating custom deck:", error);

      if (error.message && error.message.includes("must")) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to create custom deck",
      });
      return;
    }
  },
);

/**
 * DELETE /api/v1/decks/:deckId
 * Delete a custom deck
 */
router.delete(
  "/:deckId",
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

      const { deckId } = req.params;

      const deleted = await deleteCustomDeck(deckId, authReq.userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Deck not found or already deleted",
        });
        return;
      }

      res.json({
        success: true,
        message: "Deck deleted successfully",
      });
      return;
    } catch (error: any) {
      logger.error("Error deleting custom deck:", error);

      if (error.message === "Deck not found") {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (
        error.message === "Cannot delete system decks" ||
        error.message === "You can only delete your own custom decks" ||
        error.message.includes("Cannot delete deck that is being used")
      ) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete deck",
      });
      return;
    }
  },
);

export default router;

// Made with Bob
