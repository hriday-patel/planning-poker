-- Sprint Planning Poker Database Schema
-- Migration 001 Rollback: Drop all tables and extensions

-- Drop triggers first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
DROP TRIGGER IF EXISTS update_timer_state_updated_at ON timer_state;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order (respecting foreign key constraints)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS voting_rounds CASCADE;
DROP TABLE IF EXISTS timer_state CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";

-- Made with Bob
