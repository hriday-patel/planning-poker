import { db } from "../config/database";
import {
  JiraSettings,
  JiraSettingsUpdatePayload,
  UserRecord,
  UserUpdatePayload,
  UserSession,
} from "../types/auth.types";
import { DEFAULT_JIRA_SITE_URL } from "./jiraService";
import { decryptSecret, encryptSecret } from "../utils/encryption";
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

const toJiraSettings = (user: UserRecord): JiraSettings => {
  return {
    siteUrl: user.jira_site_url || DEFAULT_JIRA_SITE_URL,
    hasApiToken: Boolean(user.jira_api_token_encrypted),
  };
};

/**
 * Get the user's Jira settings (token never leaves the server)
 */
export const getUserJiraSettings = async (
  userId: string,
): Promise<JiraSettings | null> => {
  const user = await findUserById(userId);
  return user ? toJiraSettings(user) : null;
};

/**
 * Update the user's Jira settings. The API token is encrypted at rest.
 */
export const updateUserJiraSettings = async (
  userId: string,
  updates: JiraSettingsUpdatePayload,
): Promise<JiraSettings | null> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.siteUrl !== undefined) {
      fields.push(`jira_site_url = $${paramIndex++}`);
      values.push(updates.siteUrl);
    }

    if (updates.apiToken !== undefined) {
      fields.push(`jira_api_token_encrypted = $${paramIndex++}`);
      values.push(encryptSecret(updates.apiToken));
    }

    if (fields.length === 0) {
      return await getUserJiraSettings(userId);
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

    return toJiraSettings(result.rows[0] as UserRecord);
  } catch (error) {
    logger.error("Error updating user Jira settings:", error);
    throw error;
  }
};

/**
 * Get the user's Jira credentials for server-side use (decrypted token)
 */
export const getUserJiraCredentials = async (
  userId: string,
): Promise<{ siteUrl: string; apiToken: string | null } | null> => {
  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  let apiToken: string | null = null;

  if (user.jira_api_token_encrypted) {
    try {
      apiToken = decryptSecret(user.jira_api_token_encrypted);
    } catch (error) {
      logger.warn("Failed to decrypt stored Jira API token:", error);
    }
  }

  return {
    siteUrl: user.jira_site_url || DEFAULT_JIRA_SITE_URL,
    apiToken,
  };
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

// Made with Bob
