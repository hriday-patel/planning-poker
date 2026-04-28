/**
 * Deck Service
 *
 * Handles all business logic related to voting system decks,
 * including system decks and custom user-created decks.
 */

import { db } from "../config/database";
import {
  Deck,
  CreateDeckPayload,
  SYSTEM_DECKS,
  GAME_VALIDATION,
} from "../types/game.types";
import { logger } from "../utils/logger";

/**
 * Get all decks available to a user (system decks + their custom decks)
 */
export const getAllDecks = async (userId: string): Promise<Deck[]> => {
  try {
    const result = await db.query(
      `SELECT * FROM decks 
       WHERE is_default = true OR created_by = $1
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );

    return result.rows as Deck[];
  } catch (error) {
    logger.error("Error fetching decks:", error);
    throw error;
  }
};

/**
 * Get a specific deck by ID
 */
export const getDeckById = async (deckId: string): Promise<Deck | null> => {
  try {
    const result = await db.query("SELECT * FROM decks WHERE id = $1", [
      deckId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Deck;
  } catch (error) {
    logger.error("Error fetching deck by ID:", error);
    throw error;
  }
};

/**
 * Get a deck by display name
 */
export const getDeckByName = async (name: string): Promise<Deck | null> => {
  try {
    const result = await db.query(
      `SELECT * FROM decks
       WHERE LOWER(name) = LOWER($1)
       ORDER BY is_default DESC
       LIMIT 1`,
      [name],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Deck;
  } catch (error) {
    logger.error("Error fetching deck by name:", error);
    throw error;
  }
};

/**
 * Create a custom deck for a user
 */
export const createCustomDeck = async (
  userId: string,
  payload: CreateDeckPayload,
): Promise<Deck> => {
  try {
    // Validate deck name
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error("Deck name is required");
    }

    if (payload.name.length > GAME_VALIDATION.DECK_NAME_MAX_LENGTH) {
      throw new Error(
        `Deck name must be ${GAME_VALIDATION.DECK_NAME_MAX_LENGTH} characters or less`,
      );
    }

    // Validate deck values
    if (!Array.isArray(payload.values) || payload.values.length === 0) {
      throw new Error("Deck values are required");
    }

    if (payload.values.length < GAME_VALIDATION.DECK_VALUES_MIN_COUNT) {
      throw new Error(
        `Deck must have at least ${GAME_VALIDATION.DECK_VALUES_MIN_COUNT} values`,
      );
    }

    if (payload.values.length > GAME_VALIDATION.DECK_VALUES_MAX_COUNT) {
      throw new Error(
        `Deck cannot have more than ${GAME_VALIDATION.DECK_VALUES_MAX_COUNT} values`,
      );
    }

    // Validate each value length
    for (const value of payload.values) {
      if (value.length > GAME_VALIDATION.DECK_VALUE_MAX_LENGTH) {
        throw new Error(
          `Each deck value must be ${GAME_VALIDATION.DECK_VALUE_MAX_LENGTH} characters or less`,
        );
      }
    }

    // Check for duplicate values
    const uniqueValues = new Set(payload.values);
    if (uniqueValues.size !== payload.values.length) {
      throw new Error("Deck values must be unique");
    }

    // Insert deck
    const result = await db.query(
      `INSERT INTO decks (name, values, is_default, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payload.name.trim(), payload.values, false, userId],
    );

    logger.info(`Custom deck created: ${result.rows[0].id} by user ${userId}`);
    return result.rows[0] as Deck;
  } catch (error: any) {
    if (error.code === "23505") {
      throw new Error("A deck with this name already exists");
    }
    logger.error("Error creating custom deck:", error);
    throw error;
  }
};

/**
 * Delete a custom deck (only if created by the user)
 */
export const deleteCustomDeck = async (
  deckId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // Check if deck exists and is owned by user
    const deck = await getDeckById(deckId);

    if (!deck) {
      throw new Error("Deck not found");
    }

    if (deck.is_default) {
      throw new Error("Cannot delete system decks");
    }

    if (deck.created_by !== userId) {
      throw new Error("You can only delete your own custom decks");
    }

    // Check if deck is being used by any active games
    const gamesUsingDeck = await db.query(
      `SELECT COUNT(*) as count FROM games
       WHERE deck_id = $1 AND status = 'active'`,
      [deckId],
    );

    if (parseInt(gamesUsingDeck.rows[0].count) > 0) {
      throw new Error("Cannot delete deck that is being used by active games");
    }

    // Delete deck
    const result = await db.query(
      "DELETE FROM decks WHERE id = $1 AND created_by = $2",
      [deckId, userId],
    );

    if (result.rowCount === 0) {
      return false;
    }

    logger.info(`Custom deck deleted: ${deckId} by user ${userId}`);
    return true;
  } catch (error) {
    logger.error("Error deleting custom deck:", error);
    throw error;
  }
};

/**
 * Initialize system decks in the database
 * This should be called on application startup
 */
export const initializeSystemDecks = async (): Promise<void> => {
  try {
    for (const deck of SYSTEM_DECKS) {
      const result = await db.query(
        `INSERT INTO decks (name, values, is_default, created_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [deck.name, deck.values, deck.is_default, deck.created_by],
      );

      if (result.rows.length > 0) {
        logger.info(`System deck initialized: ${deck.name}`);
      }
    }
  } catch (error) {
    logger.error("Error initializing system decks:", error);
    throw error;
  }
};

/**
 * Get the default deck (Fibonacci)
 */
export const getDefaultDeck = async (): Promise<Deck | null> => {
  try {
    const result = await db.query(
      "SELECT * FROM decks WHERE name = 'Fibonacci' AND is_default = true LIMIT 1",
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as Deck;
  } catch (error) {
    logger.error("Error fetching default deck:", error);
    throw error;
  }
};

// Made with Bob
