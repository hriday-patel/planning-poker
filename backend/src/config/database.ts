import { Knex } from "knex";
import { Pool } from "pg";
import { logger } from "../utils/logger";

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = parseInt(process.env.DB_PORT || "5432", 10);
const dbName = process.env.DB_NAME || "planning_poker_dev";
const dbUser = process.env.DB_USER || "planning_poker";
const dbPassword = process.env.DB_PASSWORD || "planning_poker";
const dbSsl =
  process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false;

logger.info(
  `Database configuration loaded for ${dbUser}@${dbHost}:${dbPort}/${dbName}`,
);

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: dbSsl,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "../../database/migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "../../database/seeds",
    },
  },
  test: {
    client: "postgresql",
    connection: {
      host: dbHost,
      port: dbPort,
      database: process.env.DB_NAME || "planning_poker_test",
      user: dbUser,
      password: dbPassword,
      ssl: dbSsl,
    },
    pool: {
      min: 1,
      max: 5,
    },
  },
  production: {
    client: "postgresql",
    connection: {
      host: dbHost,
      port: dbPort,
      database: process.env.DB_NAME || dbName,
      user: process.env.DB_USER || dbUser,
      password: process.env.DB_PASSWORD || dbPassword,
      ssl: dbSsl,
    },
    pool: {
      min: 2,
      max: 20,
    },
  },
};

// Create PostgreSQL connection pool
export const db = new Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: dbSsl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

db.on("error", (err) => {
  logger.error("Unexpected database error:", err);
});

db.on("connect", () => {
  logger.info("Database pool connected");
});

export default config;

// Made with Bob
