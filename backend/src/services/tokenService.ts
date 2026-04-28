import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload, TokenPair } from "../types/auth.types";
import { getSession } from "./authService";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    "JWT_SECRET and JWT_REFRESH_SECRET must be set before the server starts",
  );
}

/**
 * Generate access and refresh tokens for a user
 */
export const generateTokens = (
  userId: string,
  displayName: string,
): TokenPair => {
  try {
    const payload: JWTPayload = {
      userId,
      displayName,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("Error generating tokens:", error);
    throw new Error("Failed to generate authentication tokens");
  }
};

/**
 * Verify and decode an access token
 */
export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid access token");
    } else {
      logger.error("Error verifying access token:", error);
    }
    return null;
  }
};

/**
 * Verify and decode a refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid refresh token");
    } else {
      logger.error("Error verifying refresh token:", error);
    }
    return null;
  }
};

/**
 * Generate a new access token from a valid refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string,
): Promise<string | null> => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    const session = await getSession(payload.userId);
    if (!session || session.refreshToken !== refreshToken) {
      logger.warn(`Refresh token session mismatch for user: ${payload.userId}`);
      return null;
    }

    if (session.userId !== payload.userId) {
      logger.warn(`Refresh token user mismatch for user: ${payload.userId}`);
      return null;
    }

    const newAccessToken = jwt.sign(
      {
        userId: payload.userId,
        displayName: payload.displayName,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      } as SignOptions,
    );

    return newAccessToken;
  } catch (error) {
    logger.error("Error refreshing access token:", error);
    return null;
  }
};

// Made with Bob
