import { createClient } from "redis";
import { logger } from "../utils/logger";

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || "0"),
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

redisClient.on("ready", () => {
  logger.info("Redis client ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis client reconnecting");
});

// Connect to Redis
const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info("Successfully connected to Redis");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
};

// Graceful shutdown
const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error("Error closing Redis connection:", error);
  }
};

export { redisClient, connectRedis, disconnectRedis };

// Made with Bob
