/**
 * Issue Service
 *
 * Handles all business logic related to issues (user stories/tickets)
 * in Planning Poker games.
 */

import { db } from "../config/database";
import {
  IssueRecord,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueStatus,
  GAME_VALIDATION,
} from "../types/game.types";
import { logger } from "../utils/logger";
import { hasGamePermission } from "./gameService";

/**
 * Get all issues for a game
 */
export const getGameIssues = async (gameId: string): Promise<IssueRecord[]> => {
  try {
    const result = await db.query(
      `SELECT * FROM issues 
       WHERE game_id = $1 
       ORDER BY 
         CASE status 
           WHEN 'voting' THEN 1 
           WHEN 'pending' THEN 2 
           WHEN 'voted' THEN 3 
         END,
         display_order ASC,
         created_at ASC`,
      [gameId],
    );

    return result.rows as IssueRecord[];
  } catch (error) {
    logger.error("Error fetching game issues:", error);
    throw error;
  }
};

/**
 * Get a specific issue by ID
 */
export const getIssueById = async (
  issueId: string,
): Promise<IssueRecord | null> => {
  try {
    const result = await db.query("SELECT * FROM issues WHERE id = $1", [
      issueId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as IssueRecord;
  } catch (error) {
    logger.error("Error fetching issue by ID:", error);
    throw error;
  }
};

/**
 * Create a new issue
 */
export const createIssue = async (
  gameId: string,
  userId: string,
  payload: CreateIssuePayload,
): Promise<IssueRecord> => {
  try {
    // Validate title
    if (!payload.title || payload.title.trim().length === 0) {
      throw new Error("Issue title is required");
    }

    if (
      payload.title.length < GAME_VALIDATION.ISSUE_TITLE_MIN_LENGTH ||
      payload.title.length > GAME_VALIDATION.ISSUE_TITLE_MAX_LENGTH
    ) {
      throw new Error(
        `Issue title must be between ${GAME_VALIDATION.ISSUE_TITLE_MIN_LENGTH} and ${GAME_VALIDATION.ISSUE_TITLE_MAX_LENGTH} characters`,
      );
    }

    // Check if user has permission to manage issues
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Lock the parent game row so concurrent issue writes for the same game
      // serialize within this transaction before calculating the next order.
      await client.query("SELECT id FROM games WHERE id = $1 FOR UPDATE", [
        gameId,
      ]);

      const orderResult = await client.query(
        "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM issues WHERE game_id = $1",
        [gameId],
      );
      const nextOrder = orderResult.rows[0].next_order;

      // Create issue
      const result = await client.query(
        `INSERT INTO issues (game_id, title, status, created_by, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [gameId, payload.title.trim(), IssueStatus.PENDING, userId, nextOrder],
      );

      await client.query("COMMIT");

      logger.info(`Issue created: ${result.rows[0].id} in game ${gameId}`);
      return result.rows[0] as IssueRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error creating issue:", error);
    throw error;
  }
};

/**
 * Update an issue
 */
export const updateIssue = async (
  issueId: string,
  gameId: string,
  userId: string,
  payload: UpdateIssuePayload,
): Promise<IssueRecord | null> => {
  try {
    // Check if issue exists and belongs to the game
    const issue = await getIssueById(issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    if (issue.game_id !== gameId) {
      throw new Error("Issue does not belong to this game");
    }

    // Check if user has permission to manage issues
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (payload.title !== undefined) {
      if (
        payload.title.length < GAME_VALIDATION.ISSUE_TITLE_MIN_LENGTH ||
        payload.title.length > GAME_VALIDATION.ISSUE_TITLE_MAX_LENGTH
      ) {
        throw new Error(
          `Issue title must be between ${GAME_VALIDATION.ISSUE_TITLE_MIN_LENGTH} and ${GAME_VALIDATION.ISSUE_TITLE_MAX_LENGTH} characters`,
        );
      }
      updates.push(`title = $${paramCount++}`);
      values.push(payload.title.trim());
    }

    if (payload.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(payload.status);
    }

    if (payload.final_estimate !== undefined) {
      updates.push(`final_estimate = $${paramCount++}`);
      values.push(payload.final_estimate);
    }

    if (payload.display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(payload.display_order);
    }

    if (updates.length === 0) {
      return issue; // No updates to make
    }

    // Add issue ID as last parameter
    values.push(issueId);

    const query = `
      UPDATE issues 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    logger.info(`Issue updated: ${issueId} in game ${gameId}`);
    return result.rows[0] as IssueRecord;
  } catch (error) {
    logger.error("Error updating issue:", error);
    throw error;
  }
};

/**
 * Delete an issue
 */
export const deleteIssue = async (
  issueId: string,
  gameId: string,
  userId: string,
): Promise<boolean> => {
  try {
    // Check if issue exists and belongs to the game
    const issue = await getIssueById(issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }

    if (issue.game_id !== gameId) {
      throw new Error("Issue does not belong to this game");
    }

    // Check if user has permission to manage issues
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    // Delete issue
    const result = await db.query("DELETE FROM issues WHERE id = $1", [
      issueId,
    ]);

    if (result.rowCount === 0) {
      return false;
    }

    logger.info(`Issue deleted: ${issueId} from game ${gameId}`);
    return true;
  } catch (error) {
    logger.error("Error deleting issue:", error);
    throw error;
  }
};

/**
 * Import multiple issues at once
 */
export const importIssues = async (
  gameId: string,
  userId: string,
  titles: string[],
): Promise<IssueRecord[]> => {
  try {
    // Check if user has permission to manage issues
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    // Validate titles
    const validTitles = titles
      .map((title) => title.trim())
      .filter(
        (title) =>
          title.length >= GAME_VALIDATION.ISSUE_TITLE_MIN_LENGTH &&
          title.length <= GAME_VALIDATION.ISSUE_TITLE_MAX_LENGTH,
      );

    if (validTitles.length === 0) {
      throw new Error("No valid issue titles provided");
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Lock the parent game row so concurrent issue imports for the same game
      // serialize within this transaction before calculating the next order.
      await client.query("SELECT id FROM games WHERE id = $1 FOR UPDATE", [
        gameId,
      ]);

      const orderResult = await client.query(
        "SELECT COALESCE(MAX(display_order), 0) as max_order FROM issues WHERE game_id = $1",
        [gameId],
      );
      let nextOrder = orderResult.rows[0].max_order + 1;

      // Insert all issues
      const createdIssues: IssueRecord[] = [];

      for (const title of validTitles) {
        const result = await client.query(
          `INSERT INTO issues (game_id, title, status, created_by, display_order)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [gameId, title, IssueStatus.PENDING, userId, nextOrder++],
        );
        createdIssues.push(result.rows[0] as IssueRecord);
      }

      await client.query("COMMIT");

      logger.info(
        `${createdIssues.length} issues imported to game ${gameId} by user ${userId}`,
      );
      return createdIssues;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error importing issues:", error);
    throw error;
  }
};

/**
 * Reorder issues
 */
export const reorderIssues = async (
  gameId: string,
  userId: string,
  issueOrders: { id: string; display_order: number }[],
): Promise<void> => {
  try {
    // Check if user has permission to manage issues
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Update display orders atomically
      for (const { id, display_order } of issueOrders) {
        await client.query(
          "UPDATE issues SET display_order = $1 WHERE id = $2 AND game_id = $3",
          [display_order, id, gameId],
        );
      }

      await client.query("COMMIT");
      logger.info(`Issues reordered in game ${gameId} by user ${userId}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error reordering issues:", error);
    throw error;
  }
};

/**
 * Set current voting issue
 */
export const setVotingIssue = async (
  gameId: string,
  issueId: string,
  userId: string,
): Promise<IssueRecord> => {
  try {
    // Check if user has permission
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      // Reset all issues in the game to pending (except voted ones)
      await client.query(
        "UPDATE issues SET status = $1 WHERE game_id = $2 AND status = $3",
        [IssueStatus.PENDING, gameId, IssueStatus.VOTING],
      );

      // Set the selected issue to voting
      const result = await client.query(
        "UPDATE issues SET status = $1 WHERE id = $2 AND game_id = $3 RETURNING *",
        [IssueStatus.VOTING, issueId, gameId],
      );

      if (result.rows.length === 0) {
        throw new Error("Issue not found");
      }

      await client.query("COMMIT");

      logger.info(`Issue ${issueId} set to voting in game ${gameId}`);
      return result.rows[0] as IssueRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error setting voting issue:", error);
    throw error;
  }
};

export const startIssueVotingRound = async (
  gameId: string,
  issueId: string,
  roundId: string,
  userId: string,
): Promise<IssueRecord> => {
  try {
    const hasPermission = await hasGamePermission(
      gameId,
      userId,
      "manage_issues",
    );
    if (!hasPermission) {
      throw new Error(
        "You don't have permission to manage issues in this game",
      );
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const issueResult = await client.query(
        "SELECT * FROM issues WHERE id = $1 AND game_id = $2 FOR UPDATE",
        [issueId, gameId],
      );

      if (issueResult.rows.length === 0) {
        throw new Error("Issue not found");
      }

      const existingIssue = issueResult.rows[0] as IssueRecord;
      if (existingIssue.status === IssueStatus.VOTED) {
        throw new Error("This issue has already been voted");
      }

      await client.query(
        "UPDATE issues SET status = $1 WHERE game_id = $2 AND status = $3",
        [IssueStatus.PENDING, gameId, IssueStatus.VOTING],
      );

      const updatedIssueResult = await client.query(
        "UPDATE issues SET status = $1 WHERE id = $2 AND game_id = $3 RETURNING *",
        [IssueStatus.VOTING, issueId, gameId],
      );

      await client.query(
        "UPDATE voting_rounds SET is_active = FALSE WHERE game_id = $1 AND is_active = TRUE",
        [gameId],
      );

      await client.query(
        `INSERT INTO voting_rounds (id, game_id, issue_id, is_active)
         VALUES ($1, $2, $3, TRUE)`,
        [roundId, gameId, issueId],
      );

      await client.query("COMMIT");

      logger.info(`Voting round ${roundId} started for issue ${issueId}`);
      return updatedIssueResult.rows[0] as IssueRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error starting issue voting round:", error);
    throw error;
  }
};

export const completeIssueVotingRound = async (
  gameId: string,
  roundId: string,
  issueId: string,
  finalEstimate: string | null,
  votes: Array<{
    user_id: string;
    card_value: string;
    submitted_at?: string | null;
  }>,
): Promise<IssueRecord | null> => {
  try {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO voting_rounds (id, game_id, issue_id, revealed_at, is_active)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, FALSE)
         ON CONFLICT (id)
         DO UPDATE SET revealed_at = CURRENT_TIMESTAMP, is_active = FALSE`,
        [roundId, gameId, issueId],
      );

      for (const vote of votes) {
        const submittedAt = vote.submitted_at
          ? new Date(vote.submitted_at)
          : new Date();

        await client.query(
          `INSERT INTO votes (round_id, user_id, card_value, submitted_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (round_id, user_id)
           DO UPDATE SET card_value = EXCLUDED.card_value, submitted_at = EXCLUDED.submitted_at`,
          [roundId, vote.user_id, vote.card_value, submittedAt],
        );
      }

      const issueResult = await client.query(
        `UPDATE issues
         SET status = $1, final_estimate = $2
         WHERE id = $3 AND game_id = $4
         RETURNING *`,
        [IssueStatus.VOTED, finalEstimate, issueId, gameId],
      );

      await client.query("COMMIT");

      logger.info(`Voting round ${roundId} completed for issue ${issueId}`);
      return issueResult.rows[0] || null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Error completing issue voting round:", error);
    throw error;
  }
};

// Made with Bob
