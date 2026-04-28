/**
 * Guest User Service
 *
 * Handles guest user creation, authentication, and session management
 * without requiring IBM W3ID authentication.
 */

import { v4 as uuidv4 } from "uuid";
import { db } from "../config/database";
import { redisClient } from "../config/redis";
import { logger } from "../utils/logger";
import {
  GuestSession,
  TokenPair,
  UserRecord,
  UserSession,
} from "../types/auth.types";
import { generateTokens } from "./tokenService";

const GUEST_SESSION_NAMESPACE = "guest:session";
const GUEST_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const GUEST_ID_PREFIX = "guest_";

const normalizeGuestDisplayName = (displayName?: string): string | null => {
  const trimmedDisplayName = displayName?.trim();

  if (!trimmedDisplayName) {
    return null;
  }

  if (trimmedDisplayName.length > 40) {
    throw new Error("Display name must be 40 characters or less");
  }

  return trimmedDisplayName;
};

/**
 * Generate a unique guest ID
 */
export const generateGuestId = (): string => {
  return `${GUEST_ID_PREFIX}${uuidv4()}`;
};

/**
 * Generate a random guest display name
 */
export const generateGuestDisplayName = (): string => {
  const adjectives = [
    "Happy",
    "Clever",
    "Swift",
    "Brave",
    "Wise",
    "Kind",
    "Bold",
    "Calm",
    "Eager",
    "Fair",
  ];
  const animals = [
    "Panda",
    "Fox",
    "Eagle",
    "Wolf",
    "Bear",
    "Tiger",
    "Lion",
    "Hawk",
    "Owl",
    "Dolphin",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 1000);

  return `${adjective} ${animal} ${number}`;
};

/**
 * Check if a user ID is a guest
 */
export const isGuestUser = (userId: string): boolean => {
  return userId.startsWith(GUEST_ID_PREFIX);
};

/**
 * Create a guest user in the database
 */
export const createGuestUser = async (
  displayName?: string,
): Promise<UserRecord> => {
  try {
    const guestId = generateGuestId();
    const guestDisplayName =
      normalizeGuestDisplayName(displayName) || generateGuestDisplayName();

    const result = await db.query(
      `INSERT INTO users (id, display_name, avatar_url, spectator_mode, theme_preference)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [guestId, guestDisplayName, "/images/guest-avatar.png", false, "dark"],
    );

    const user = result.rows[0] as UserRecord;
    logger.info(`Guest user created: ${guestId} (${guestDisplayName})`);

    return user;
  } catch (error) {
    logger.error("Error creating guest user:", error);
    throw error;
  }
};

/**
 * Update an existing guest user's display name and refresh auth tokens.
 */
export const updateGuestDisplayName = async (
  guestId: string,
  displayName: string,
): Promise<{
  user: UserSession;
  tokens: TokenPair;
}> => {
  try {
    if (!isGuestUser(guestId)) {
      throw new Error("Only guest display names can be updated here");
    }

    const guestDisplayName = normalizeGuestDisplayName(displayName);
    if (!guestDisplayName) {
      throw new Error("Display name is required");
    }

    const result = await db.query(
      `UPDATE users
       SET display_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [guestId, guestDisplayName],
    );

    if (result.rows.length === 0) {
      throw new Error("Guest user not found");
    }

    const guestUser = result.rows[0] as UserRecord;
    const tokens = generateTokens(guestUser.id, guestUser.display_name);

    await storeGuestSession(
      guestUser.id,
      guestUser.display_name,
      tokens.refreshToken,
    );

    logger.info(`Guest display name updated: ${guestId} (${guestDisplayName})`);

    return {
      user: toGuestUserSession(guestUser),
      tokens,
    };
  } catch (error) {
    logger.error("Error updating guest display name:", error);
    throw error;
  }
};

/**
 * Store guest session in Redis
 */
export const storeGuestSession = async (
  guestId: string,
  displayName: string,
  refreshToken: string,
): Promise<void> => {
  try {
    const sessionKey = `${GUEST_SESSION_NAMESPACE}:${guestId}`;
    const expiresAt = new Date(
      Date.now() + GUEST_SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    const sessionData: GuestSession & { refreshToken: string } = {
      guestId,
      displayName,
      createdAt: new Date().toISOString(),
      expiresAt,
      refreshToken,
    };

    await redisClient.setEx(
      sessionKey,
      GUEST_SESSION_TTL_SECONDS,
      JSON.stringify(sessionData),
    );

    logger.info(`Guest session stored: ${guestId}`);
  } catch (error) {
    logger.error("Error storing guest session:", error);
    throw error;
  }
};

/**
 * Get guest session from Redis
 */
export const getGuestSession = async (
  guestId: string,
): Promise<(GuestSession & { refreshToken: string }) | null> => {
  try {
    const sessionKey = `${GUEST_SESSION_NAMESPACE}:${guestId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as GuestSession & { refreshToken: string };
  } catch (error) {
    logger.error("Error getting guest session:", error);
    return null;
  }
};

/**
 * Delete guest session from Redis
 */
export const deleteGuestSession = async (guestId: string): Promise<void> => {
  try {
    const sessionKey = `${GUEST_SESSION_NAMESPACE}:${guestId}`;
    await redisClient.del(sessionKey);
    logger.info(`Guest session deleted: ${guestId}`);
  } catch (error) {
    logger.error("Error deleting guest session:", error);
    throw error;
  }
};

/**
 * Create a guest user and generate tokens
 */
export const createGuestSession = async (
  displayName?: string,
): Promise<{
  user: UserSession;
  tokens: { accessToken: string; refreshToken: string };
}> => {
  try {
    // Create guest user in database
    const guestUser = await createGuestUser(displayName);

    // Generate JWT tokens
    const tokens = generateTokens(guestUser.id, guestUser.display_name);

    // Store session in Redis
    await storeGuestSession(
      guestUser.id,
      guestUser.display_name,
      tokens.refreshToken,
    );

    // Convert to UserSession
    const userSession: UserSession = {
      userId: guestUser.id,
      displayName: guestUser.display_name,
      avatarUrl: guestUser.avatar_url || undefined,
      spectatorMode: guestUser.spectator_mode,
      themePreference: guestUser.theme_preference,
      createdAt: guestUser.created_at,
      isGuest: true,
    };

    logger.info(`Guest session created: ${guestUser.id}`);

    return {
      user: userSession,
      tokens,
    };
  } catch (error) {
    logger.error("Error creating guest session:", error);
    throw error;
  }
};

/**
 * Find guest user by ID
 */
export const findGuestUserById = async (
  guestId: string,
): Promise<UserRecord | null> => {
  try {
    if (!isGuestUser(guestId)) {
      return null;
    }

    const result = await db.query("SELECT * FROM users WHERE id = $1", [
      guestId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as UserRecord;
  } catch (error) {
    logger.error("Error finding guest user:", error);
    throw error;
  }
};

/**
 * Convert guest user to UserSession
 */
export const toGuestUserSession = (user: UserRecord): UserSession => {
  return {
    userId: user.id,
    displayName: user.display_name,
    avatarUrl: user.avatar_url || undefined,
    spectatorMode: user.spectator_mode,
    themePreference: user.theme_preference,
    createdAt: user.created_at,
    isGuest: true,
  };
};

/**
 * Clean up expired guest users (can be run periodically)
 */
export const cleanupExpiredGuestUsers = async (): Promise<number> => {
  try {
    // Delete guest users older than 7 days
    const result = await db.query(
      `DELETE FROM users 
       WHERE id LIKE $1 
       AND created_at < NOW() - INTERVAL '7 days'
       RETURNING id`,
      [`${GUEST_ID_PREFIX}%`],
    );

    const deletedCount = result.rows.length;
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired guest users`);
    }

    return deletedCount;
  } catch (error) {
    logger.error("Error cleaning up expired guest users:", error);
    throw error;
  }
};

// Made with Bob
