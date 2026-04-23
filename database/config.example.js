/**
 * Database Configuration
 *
 * This file contains the database connection configuration for PostgreSQL.
 * Copy this file to config.js and update with your actual credentials.
 */

module.exports = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "planning_poker_dev",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },

  test: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "planning_poker_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: "./migrations",
      tableName: "knex_migrations",
    },
  },
};

// Made with Bob
