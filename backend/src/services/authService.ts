import crypto from "crypto";
import {
  W3IDProfile,
  AuthServiceResponse,
  InviteLinkResponse,
  InviteTokenPayload,
  InviteTokenRecord,
  UserRecord,
} from "../types/auth.types";
import { generateTokens } from "./tokenService";
import { upsertUser, toUserSession } from "./userService";
import { redisClient } from "../config/redis";
import { logger } from "../utils/logger";
import { db } from "../config/database";

const BLUE_PAGES_URL =
  process.env.BLUE_PAGES_URL ||
  "https://bluepages.ibm.com/BpHttpApisv3/slaphapi";
const INVITE_TOKEN_TTL_SECONDS = parseInt(
  process.env.INVITE_TOKEN_TTL_SECONDS || "604800",
  10,
);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const INVITE_TOKEN_NAMESPACE = "invite";
const SESSION_NAMESPACE = "session";
const OAUTH_STATE_NAMESPACE = "oauth:state";

const isSafeReturnPath = (value: string): boolean => {
  if (!value.startsWith("/")) {
    return false;
  }

  if (value.startsWith("//")) {
    return false;
  }

  return !value.includes("\r") && !value.includes("\n");
};

export const sanitizeReturnTo = (returnTo?: string): string => {
  if (!returnTo) {
    return "/";
  }

  try {
    const decoded = decodeURIComponent(returnTo);
    return isSafeReturnPath(decoded) ? decoded : "/";
  } catch (_error) {
    return isSafeReturnPath(returnTo) ? returnTo : "/";
  }
};

/**
 * Resolve authoritative IBM display name from Blue Pages.
 */
export const fetchBluePagesProfile = async (
  profile: W3IDProfile,
): Promise<{ displayName: string }> => {
  const email = profile.email || profile._json?.email;
  const uid =
    profile._json?.uid || profile._json?.preferred_username || profile.id;

  if (!email && !uid) {
    logger.warn(`Blue Pages lookup skipped for user ${profile.id}`);
    return { displayName: profile.displayName };
  }

  try {
    const lookupValue = email || uid;
    const lookupParam = email ? "email" : "uid";
    const url = `${BLUE_PAGES_URL}?${lookupParam}=${encodeURIComponent(lookupValue)}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Blue Pages lookup failed: ${response.status}`);
    }

    const data: any = await response.json();
    const displayName =
      data?.displayName ||
      data?.cn ||
      data?.name ||
      data?.results?.[0]?.displayName ||
      data?.results?.[0]?.cn;

    if (!displayName) {
      throw new Error("Blue Pages did not return a display name");
    }

    return { displayName };
  } catch (error) {
    logger.error("Error fetching Blue Pages profile:", error);
    return { displayName: profile.displayName };
  }
};

/**
 * Handle successful W3ID OAuth callback
 * Creates/updates user and generates JWT tokens
 */
export const handleOAuthCallback = async (
  profile: W3IDProfile,
): Promise<AuthServiceResponse> => {
  try {
    const userId = profile.id;
    const bluePagesProfile = await fetchBluePagesProfile(profile);
    const displayName = bluePagesProfile.displayName;

    const user = await upsertUser(userId, displayName);

    const tokens = generateTokens(user.id, user.display_name);

    await storeSession(user.id, tokens.refreshToken);

    logger.info(`User authenticated successfully: ${user.id}`);

    return {
      success: true,
      user: toUserSession(user),
      tokens,
    };
  } catch (error) {
    logger.error("Error handling OAuth callback:", error);
    return {
      success: false,
      error: "Failed to complete authentication",
    };
  }
};

/**
 * Store user session in Redis
 */
export const storeSession = async (
  userId: string,
  refreshToken: string,
): Promise<void> => {
  try {
    const sessionKey = `${SESSION_NAMESPACE}:${userId}`;
    const sessionData = {
      userId,
      refreshToken,
      createdAt: new Date().toISOString(),
    };

    await redisClient.setEx(
      sessionKey,
      7 * 24 * 60 * 60,
      JSON.stringify(sessionData),
    );

    logger.info(`Session stored for user: ${userId}`);
  } catch (error) {
    logger.error("Error storing session:", error);
    throw error;
  }
};

/**
 * Get user session from Redis
 */
export const getSession = async (
  userId: string,
): Promise<{
  userId: string;
  refreshToken: string;
  createdAt: string;
} | null> => {
  try {
    const sessionKey = `${SESSION_NAMESPACE}:${userId}`;
    const sessionData = await redisClient.get(sessionKey);

    if (!sessionData) {
      return null;
    }

    return JSON.parse(sessionData) as {
      userId: string;
      refreshToken: string;
      createdAt: string;
    };
  } catch (error) {
    logger.error("Error getting session:", error);
    return null;
  }
};

/**
 * Delete user session from Redis
 */
export const deleteSession = async (userId: string): Promise<void> => {
  try {
    const sessionKey = `${SESSION_NAMESPACE}:${userId}`;
    await redisClient.del(sessionKey);
    logger.info(`Session deleted for user: ${userId}`);
  } catch (error) {
    logger.error("Error deleting session:", error);
    throw error;
  }
};

/**
 * Store OAuth state for CSRF protection
 */
export const storeOAuthState = async (
  state: string,
  returnTo?: string,
): Promise<void> => {
  try {
    const stateKey = `${OAUTH_STATE_NAMESPACE}:${state}`;
    const stateData = {
      state,
      returnTo: sanitizeReturnTo(returnTo),
      createdAt: new Date().toISOString(),
    };

    await redisClient.setEx(stateKey, 10 * 60, JSON.stringify(stateData));

    logger.info(`OAuth state stored: ${state}`);
  } catch (error) {
    logger.error("Error storing OAuth state:", error);
    throw error;
  }
};

/**
 * Verify and retrieve OAuth state
 */
export const verifyOAuthState = async (
  state: string,
): Promise<{ returnTo: string } | null> => {
  try {
    const stateKey = `${OAUTH_STATE_NAMESPACE}:${state}`;
    const stateData = await redisClient.get(stateKey);

    if (!stateData) {
      logger.warn(`Invalid OAuth state: ${state}`);
      return null;
    }

    await redisClient.del(stateKey);

    const parsed = JSON.parse(stateData);
    return { returnTo: sanitizeReturnTo(parsed.returnTo) };
  } catch (error) {
    logger.error("Error verifying OAuth state:", error);
    return null;
  }
};

/**
 * Ensure the invite requester can manage the target game.
 */
const getInvitableGame = async (
  gameId: string,
  invitedBy: string,
): Promise<{ id: string }> => {
  const result = await db.query(
    `SELECT id
     FROM games
     WHERE id = $1 AND facilitator_id = $2`,
    [gameId, invitedBy],
  );

  if (result.rows.length === 0) {
    throw new Error("Only the facilitator can generate invite links");
  }

  return result.rows[0] as { id: string };
};

/**
 * Create a secure single-use invite URL for a game.
 */
export const createInviteLink = async (
  gameId: string,
  invitedBy: string,
): Promise<InviteLinkResponse> => {
  await getInvitableGame(gameId, invitedBy);

  const token = crypto.randomBytes(32).toString("hex");
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000,
  ).toISOString();

  const record: InviteTokenRecord = {
    tokenId,
    gameId,
    invitedBy,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  await redisClient.setEx(
    `${INVITE_TOKEN_NAMESPACE}:${token}`,
    INVITE_TOKEN_TTL_SECONDS,
    JSON.stringify(record),
  );

  return {
    inviteUrl: `${FRONTEND_URL}/game/${gameId}?invite=${token}`,
    expiresAt,
    tokenId,
  };
};

/**
 * Validate invite token without consuming it.
 */
export const validateInviteToken = async (
  token: string,
): Promise<InviteTokenPayload | null> => {
  try {
    const tokenKey = `${INVITE_TOKEN_NAMESPACE}:${token}`;
    const raw = await redisClient.get(tokenKey);
    if (!raw) {
      return null;
    }

    const record = JSON.parse(raw) as InviteTokenRecord;

    if (record.usedAt || record.usedBy) {
      await redisClient.del(tokenKey);
      return null;
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      await redisClient.del(tokenKey);
      return null;
    }

    const gameResult = await db.query(
      "SELECT id, status FROM games WHERE id = $1",
      [record.gameId],
    );

    if (
      gameResult.rows.length === 0 ||
      gameResult.rows[0].status === "archived"
    ) {
      await redisClient.del(tokenKey);
      return null;
    }

    return {
      tokenId: record.tokenId,
      gameId: record.gameId,
      invitedBy: record.invitedBy,
      expiresAt: record.expiresAt,
    };
  } catch (error) {
    logger.error("Error validating invite token:", error);
    return null;
  }
};

/**
 * Mark invite token as consumed by a user.
 */
export const consumeInviteToken = async (
  token: string,
  _usedBy: string,
): Promise<InviteTokenPayload | null> => {
  try {
    const tokenKey = `${INVITE_TOKEN_NAMESPACE}:${token}`;
    const raw = await redisClient.getDel(tokenKey);
    if (!raw) {
      return null;
    }

    const record = JSON.parse(raw) as InviteTokenRecord;

    if (record.usedAt || record.usedBy) {
      return null;
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    const gameResult = await db.query(
      "SELECT id, status FROM games WHERE id = $1",
      [record.gameId],
    );

    if (
      gameResult.rows.length === 0 ||
      gameResult.rows[0].status === "archived"
    ) {
      return null;
    }

    return {
      tokenId: record.tokenId,
      gameId: record.gameId,
      invitedBy: record.invitedBy,
      expiresAt: record.expiresAt,
    };
  } catch (error) {
    logger.error("Error consuming invite token:", error);
    return null;
  }
};

/**
 * Resolve current user for invite issuance.
 */
export const getUserForInvite = async (userId: string): Promise<UserRecord> => {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  return result.rows[0] as UserRecord;
};

// Made with Bob
