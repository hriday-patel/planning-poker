/**
 * Game Service
 *
 * Handles all business logic related to games, including creation,
 * updates, and retrieval of game information.
 */

import { db } from "../config/database";
import {
  GameRecord,
  CreateGamePayload,
  UpdateGamePayload,
  GameDetails,
  GamePermission,
  GameStatus,
  GAME_VALIDATION,
} from "../types/game.types";
import { logger } from "../utils/logger";
import { getDeckById, getDefaultDeck } from "./deckService";

/**
 * Create a new game
 */
export const createGame = async (
  userId: string,
  payload: CreateGamePayload,
): Promise<GameRecord> => {
  try {
    // Validate game name
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error("Game name is required");
    }

    if (payload.name.length > GAME_VALIDATION.NAME_MAX_LENGTH) {
      throw new Error(
        `Game name must be ${GAME_VALIDATION.NAME_MAX_LENGTH} characters or less`,
      );
    }

    // Validate voting system (deck)
    let deckId = payload.voting_system;

    if (!deckId) {
      // Use default deck if not specified
      const defaultDeck = await getDefaultDeck();
      if (!defaultDeck) {
        throw new Error(
          "Default deck not found. Please initialize system decks.",
        );
      }
      deckId = defaultDeck.id;
    } else {
      // Verify deck exists
      const deck = await getDeckById(deckId);
      if (!deck) {
        throw new Error("Invalid voting system selected");
      }
    }

    // Set default values for optional fields
    const whoCanReveal = payload.who_can_reveal || GamePermission.ALL_PLAYERS;
    const whoCanManageIssues =
      payload.who_can_manage_issues || GamePermission.ALL_PLAYERS;
    const autoReveal = payload.auto_reveal ?? false;
    const funFeaturesEnabled = payload.fun_features_enabled ?? true;
    const showAverage = payload.show_average ?? true;
    const showCountdown = payload.show_countdown ?? true;

    // Create game
    const result = await db.query(
      `INSERT INTO games (
        name, creator_id, facilitator_id, voting_system,
        who_can_reveal, who_can_manage_issues, auto_reveal,
        fun_features_enabled, show_average, show_countdown, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        payload.name.trim(),
        userId,
        userId, // Creator is initially the facilitator
        deckId,
        whoCanReveal,
        whoCanManageIssues,
        autoReveal,
        funFeaturesEnabled,
        showAverage,
        showCountdown,
        GameStatus.ACTIVE,
      ],
    );

    const game = result.rows[0] as GameRecord;

    // Add creator as first participant
    await db.query(
      `INSERT INTO game_participants (game_id, user_id, is_active)
       VALUES ($1, $2, $3)`,
      [game.id, userId, true],
    );

    logger.info(`Game created: ${game.id} by user ${userId}`);
    return game;
  } catch (error) {
    logger.error("Error creating game:", error);
    throw error;
  }
};

/**
 * Get game by ID
 */
export const getGameById = async (
  gameId: string,
): Promise<GameRecord | null> => {
  try {
    const result = await db.query("SELECT * FROM games WHERE id = $1", [
      gameId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as GameRecord;
  } catch (error) {
    logger.error("Error fetching game by ID:", error);
    throw error;
  }
};

/**
 * Get game details with deck and user information
 */
export const getGameDetails = async (
  gameId: string,
): Promise<GameDetails | null> => {
  try {
    const result = await db.query(
      `SELECT 
        g.*,
        d.id as deck_id, d.name as deck_name, d.values as deck_values,
        d.is_default as deck_is_default, d.created_by as deck_created_by,
        d.created_at as deck_created_at,
        creator.display_name as creator_name,
        facilitator.display_name as facilitator_name
      FROM games g
      JOIN decks d ON g.voting_system = d.id
      JOIN users creator ON g.creator_id = creator.id
      JOIN users facilitator ON g.facilitator_id = facilitator.id
      WHERE g.id = $1`,
      [gameId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Construct GameDetails object
    const gameDetails: GameDetails = {
      id: row.id,
      name: row.name,
      creator_id: row.creator_id,
      facilitator_id: row.facilitator_id,
      voting_system: row.voting_system,
      who_can_reveal: row.who_can_reveal,
      who_can_manage_issues: row.who_can_manage_issues,
      auto_reveal: row.auto_reveal,
      fun_features_enabled: row.fun_features_enabled,
      show_average: row.show_average,
      show_countdown: row.show_countdown,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deck: {
        id: row.deck_id,
        name: row.deck_name,
        values: row.deck_values,
        is_default: row.deck_is_default,
        created_by: row.deck_created_by,
        created_at: row.deck_created_at,
      },
      creator_name: row.creator_name,
      facilitator_name: row.facilitator_name,
    };

    return gameDetails;
  } catch (error) {
    logger.error("Error fetching game details:", error);
    throw error;
  }
};

/**
 * Update game settings
 */
export const updateGame = async (
  gameId: string,
  userId: string,
  payload: UpdateGamePayload,
): Promise<GameRecord | null> => {
  try {
    // Get current game to check permissions
    const game = await getGameById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Only facilitator can update game settings
    if (game.facilitator_id !== userId) {
      throw new Error("Only the facilitator can update game settings");
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (payload.name !== undefined) {
      if (payload.name.length > GAME_VALIDATION.NAME_MAX_LENGTH) {
        throw new Error(
          `Game name must be ${GAME_VALIDATION.NAME_MAX_LENGTH} characters or less`,
        );
      }
      updates.push(`name = $${paramCount++}`);
      values.push(payload.name.trim());
    }

    if (payload.facilitator_id !== undefined) {
      // Verify new facilitator is a participant
      const participant = await db.query(
        "SELECT * FROM game_participants WHERE game_id = $1 AND user_id = $2",
        [gameId, payload.facilitator_id],
      );
      if (participant.rows.length === 0) {
        throw new Error("New facilitator must be a game participant");
      }
      updates.push(`facilitator_id = $${paramCount++}`);
      values.push(payload.facilitator_id);
    }

    if (payload.who_can_reveal !== undefined) {
      updates.push(`who_can_reveal = $${paramCount++}`);
      values.push(payload.who_can_reveal);
    }

    if (payload.who_can_manage_issues !== undefined) {
      updates.push(`who_can_manage_issues = $${paramCount++}`);
      values.push(payload.who_can_manage_issues);
    }

    if (payload.auto_reveal !== undefined) {
      updates.push(`auto_reveal = $${paramCount++}`);
      values.push(payload.auto_reveal);
    }

    if (payload.fun_features_enabled !== undefined) {
      updates.push(`fun_features_enabled = $${paramCount++}`);
      values.push(payload.fun_features_enabled);
    }

    if (payload.show_average !== undefined) {
      updates.push(`show_average = $${paramCount++}`);
      values.push(payload.show_average);
    }

    if (payload.show_countdown !== undefined) {
      updates.push(`show_countdown = $${paramCount++}`);
      values.push(payload.show_countdown);
    }

    if (payload.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(payload.status);
    }

    if (updates.length === 0) {
      return game; // No updates to make
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Add game ID as last parameter
    values.push(gameId);

    const query = `
      UPDATE games 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    logger.info(`Game updated: ${gameId} by user ${userId}`);
    return result.rows[0] as GameRecord;
  } catch (error) {
    logger.error("Error updating game:", error);
    throw error;
  }
};

/**
 * Get all games a user has participated in
 */
export const getUserGames = async (userId: string): Promise<GameRecord[]> => {
  try {
    const result = await db.query(
      `SELECT DISTINCT g.* 
       FROM games g
       JOIN game_participants gp ON g.id = gp.game_id
       WHERE gp.user_id = $1
       ORDER BY g.updated_at DESC`,
      [userId],
    );

    return result.rows as GameRecord[];
  } catch (error) {
    logger.error("Error fetching user games:", error);
    throw error;
  }
};

/**
 * Check if user is a participant in a game
 */
export const isGameParticipant = async (
  gameId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const result = await db.query(
      "SELECT 1 FROM game_participants WHERE game_id = $1 AND user_id = $2",
      [gameId, userId],
    );

    return result.rows.length > 0;
  } catch (error) {
    logger.error("Error checking game participant:", error);
    throw error;
  }
};

/**
 * Add a user as a participant to a game
 */
export const addGameParticipant = async (
  gameId: string,
  userId: string,
): Promise<void> => {
  try {
    // Check if already a participant
    const exists = await isGameParticipant(gameId, userId);
    if (exists) {
      // Update is_active to true
      await db.query(
        `UPDATE game_participants 
         SET is_active = true 
         WHERE game_id = $1 AND user_id = $2`,
        [gameId, userId],
      );
    } else {
      // Add as new participant
      await db.query(
        `INSERT INTO game_participants (game_id, user_id, is_active)
         VALUES ($1, $2, $3)`,
        [gameId, userId, true],
      );
    }

    logger.info(`User ${userId} joined game ${gameId}`);
  } catch (error) {
    logger.error("Error adding game participant:", error);
    throw error;
  }
};

/**
 * Check if user has permission to perform an action in a game
 */
export const hasGamePermission = async (
  gameId: string,
  userId: string,
  action: "reveal" | "manage_issues",
): Promise<boolean> => {
  try {
    const game = await getGameById(gameId);
    if (!game) {
      return false;
    }

    // Facilitator always has permission
    if (game.facilitator_id === userId) {
      return true;
    }

    // Check specific permission
    if (action === "reveal") {
      return game.who_can_reveal === GamePermission.ALL_PLAYERS;
    } else if (action === "manage_issues") {
      return game.who_can_manage_issues === GamePermission.ALL_PLAYERS;
    }

    return false;
  } catch (error) {
    logger.error("Error checking game permission:", error);
    throw error;
  }
};

/**
 * Get voting history for a game
 */
export interface VotingHistoryEntry {
  round_id: string;
  issue_id: string | null;
  issue_title: string | null;
  started_at: string;
  revealed_at: string | null;
  final_estimate: string | null;
  vote_count: number;
  votes: Array<{
    user_id: string;
    display_name: string;
    card_value: string;
  }>;
}

export const getGameVotingHistory = async (
  gameId: string,
): Promise<VotingHistoryEntry[]> => {
  try {
    // Get all revealed rounds for this game with issue and vote information
    const result = await db.query(
      `SELECT 
        vr.id as round_id,
        vr.issue_id,
        i.title as issue_title,
        i.final_estimate,
        vr.started_at,
        vr.revealed_at,
        COUNT(v.id) as vote_count,
        json_agg(
          json_build_object(
            'user_id', v.user_id,
            'display_name', u.display_name,
            'card_value', v.card_value
          ) ORDER BY v.submitted_at
        ) as votes
      FROM voting_rounds vr
      LEFT JOIN issues i ON vr.issue_id = i.id
      LEFT JOIN votes v ON vr.id = v.round_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE vr.game_id = $1 
        AND vr.revealed_at IS NOT NULL
        AND vr.is_active = FALSE
      GROUP BY vr.id, vr.issue_id, i.title, i.final_estimate, vr.started_at, vr.revealed_at
      ORDER BY vr.revealed_at DESC`,
      [gameId],
    );

    return result.rows.map((row) => ({
      round_id: row.round_id,
      issue_id: row.issue_id,
      issue_title: row.issue_title,
      started_at: row.started_at,
      revealed_at: row.revealed_at,
      final_estimate: row.final_estimate,
      vote_count: parseInt(row.vote_count),
      votes: row.votes || [],
    }));
  } catch (error) {
    logger.error("Error fetching game voting history:", error);
    throw error;
  }
};

// Made with Bob
