# Database Schema Documentation

## Overview

This directory contains the PostgreSQL database schema for the Sprint Planning Poker application. The schema is designed to support real-time collaborative estimation sessions with IBM W3ID authentication.

## Database Structure

### Core Tables

#### users

Stores user profiles authenticated via IBM W3ID SSO.

- **Primary Key**: `id` (VARCHAR - W3ID identifier)
- **Key Fields**: display_name, avatar_url, spectator_mode, theme_preference
- **Purpose**: User profile management and preferences

#### decks

Voting card decks (Fibonacci, T-shirts, Powers of 2, Custom).

- **Primary Key**: `id` (UUID)
- **Key Fields**: name, values (array), is_default, created_by
- **Purpose**: Define available voting systems
- **Default Decks**: 4 pre-populated system decks

#### games

Planning poker game sessions.

- **Primary Key**: `id` (UUID - used in shareable URLs)
- **Key Fields**: name, creator_id, facilitator_id, deck_id, settings
- **Settings**: who_can_reveal, who_can_manage_issues, auto_reveal, fun_features_enabled, show_average, show_countdown
- **Purpose**: Game configuration and state management

#### game_participants

Tracks which users have joined which games.

- **Primary Key**: (game_id, user_id) composite
- **Key Fields**: joined_at, is_active, last_seen_at
- **Purpose**: Player presence tracking and game membership

#### issues

User stories/tasks to be estimated.

- **Primary Key**: `id` (UUID)
- **Key Fields**: game_id, title, status, final_estimate, display_order
- **Status Values**: 'pending', 'voting', 'voted'
- **Purpose**: Manage estimation backlog

#### voting_rounds

Individual voting rounds within a game.

- **Primary Key**: `id` (UUID)
- **Key Fields**: game_id, issue_id, started_at, revealed_at, is_active
- **Purpose**: Track voting sessions and history

#### votes

Individual votes cast by users in a round.

- **Primary Key**: `id` (UUID)
- **Unique Constraint**: (round_id, user_id) - one vote per user per round
- **Key Fields**: round_id, user_id, card_value, submitted_at
- **Purpose**: Store individual vote selections

#### timer_state

Real-time synchronized timer state per game.

- **Primary Key**: `game_id` (UUID)
- **Key Fields**: duration_seconds, remaining_seconds, is_running, time_issues
- **Purpose**: Synchronized countdown timer across all clients

## Relationships

```
users (1) ──< (N) games [creator_id]
users (1) ──< (N) games [facilitator_id]
users (1) ──< (N) decks [created_by]
users (1) ──< (N) game_participants
users (1) ──< (N) issues [created_by]
users (1) ──< (N) votes

decks (1) ──< (N) games

games (1) ──< (N) game_participants
games (1) ──< (N) issues
games (1) ──< (N) voting_rounds
games (1) ──── (1) timer_state

issues (1) ──< (N) voting_rounds

voting_rounds (1) ──< (N) votes
```

## Indexes

Performance indexes are created on:

- Foreign key columns for join optimization
- Status and filter columns (game status, issue status, is_active)
- Timestamp columns for sorting and filtering
- Composite indexes for common query patterns

## Triggers

Automatic `updated_at` timestamp triggers on:

- users
- games
- issues
- timer_state

## Migration Files

- **001_initial_schema.sql**: Creates all tables, indexes, triggers, and default data
- **001_initial_schema_down.sql**: Rollback script to drop all database objects

## Running Migrations

### Apply Migration

```bash
psql -U postgres -d planning_poker -f database/migrations/001_initial_schema.sql
```

### Rollback Migration

```bash
psql -U postgres -d planning_poker -f database/migrations/001_initial_schema_down.sql
```

## Data Model Highlights

### Security Considerations

- User IDs from W3ID are stored as VARCHAR to accommodate external identity provider format
- Game IDs use UUID for unguessable shareable URLs
- Votes are hidden until reveal (enforced at application layer)

### Real-time Architecture Support

- `game_participants.is_active` tracks online presence
- `voting_rounds.is_active` enables quick lookup of current round
- `timer_state` table enables synchronized countdown across clients

### Scalability Features

- Indexed foreign keys for efficient joins
- Composite primary keys where appropriate
- Array type for deck values (PostgreSQL native)
- Timestamp tracking for audit and history

## Default Data

The schema includes 4 pre-populated voting decks:

1. **Fibonacci**: 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕
2. **Modified Fibonacci**: 0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ☕
3. **T-shirts**: XS, S, M, L, XL, ?, ☕
4. **Powers of 2**: 0, 1, 2, 4, 8, 16, 32, 64, ?, ☕

Special card values:

- **?** = Unknown/Need more info
- **☕** = Break/Too complex

## Future Enhancements

Potential schema additions for future features:

- User sessions table for refresh token management
- Game templates for quick setup
- Voting analytics and metrics
- Team/organization management
- Audit log table for compliance
