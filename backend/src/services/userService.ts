import { db } from "../config/database";
import {
  UserRecord,
  UserUpdatePayload,
  UserSession,
} from "../types/auth.types";
import { logger } from "../utils/logger";

/**
 * Find a user by their W3ID user ID
 */
export const findUserById = async (
  userId: string,
): Promise<UserRecord | null> => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  } catch (error) {
    logger.error("Error finding user by ID:", error);
    throw error;
  }
};

/**
 * Create a new user record
 */
export const createUser = async (
  userId: string,
  displayName: string,
): Promise<UserRecord> => {
  try {
    const result = await db.query(
      `INSERT INTO users (id, display_name, avatar_url, spectator_mode, theme_preference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, displayName, "/images/avatar-placeholder.png", false, "dark"],
    );

    return result.rows[0] as UserRecord;
  } catch (error) {
    logger.error("Error creating user:", error);
    throw error;
  }
};

/**
 * Update an existing user record
 */
export const updateUser = async (
  userId: string,
  updates: UserUpdatePayload,
): Promise<UserRecord | null> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.spectator_mode !== undefined) {
      fields.push(`spectator_mode = $${paramIndex++}`);
      values.push(updates.spectator_mode);
    }

    if (updates.theme_preference !== undefined) {
      fields.push(`theme_preference = $${paramIndex++}`);
      values.push(updates.theme_preference);
    }

    if (fields.length === 0) {
      // No updates to perform
      return await findUserById(userId);
    }

    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  } catch (error) {
    logger.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Create or update a user (upsert)
 */
export const upsertUser = async (
  userId: string,
  displayName: string,
): Promise<UserRecord> => {
  try {
    const result = await db.query(
      `INSERT INTO users (id, display_name, avatar_url, spectator_mode, theme_preference)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url = users.avatar_url,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, displayName, "/images/avatar-placeholder.png", false, "dark"],
    );

    return result.rows[0] as UserRecord;
  } catch (error) {
    logger.error("Error upserting user:", error);
    throw error;
  }
};

/**
 * Convert a UserRecord to UserSession
 */
export const toUserSession = (user: UserRecord): UserSession => {
  return {
    userId: user.id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || undefined,
    spectatorMode: user.spectator_mode,
    themePreference: user.theme_preference,
    createdAt: user.created_at,
  };
};

/**
 * Delete a user (for testing purposes)
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const result = await db.query("DELETE FROM users WHERE id = $1", [userId]);

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    logger.error("Error deleting user:", error);
    throw error;
  }
};

// Made with Bob
