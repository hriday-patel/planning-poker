# Game Creation API & Deck Management Implementation Guide

## Overview

This document provides a comprehensive guide to the Game Creation API and Deck Management system implemented for the Planning Poker application. This implementation covers Section 16, Step 4 of the project requirements.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Models](#data-models)
3. [API Endpoints](#api-endpoints)
4. [Service Layer](#service-layer)
5. [Validation & Security](#validation--security)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Component Structure

```
backend/src/
├── types/
│   └── game.types.ts          # TypeScript type definitions
├── services/
│   ├── deckService.ts         # Deck business logic
│   └── gameService.ts         # Game business logic
├── routes/
│   ├── deck.routes.ts         # Deck API endpoints
│   └── game.routes.ts         # Game API endpoints
└── middleware/
    └── rateLimiter.ts         # Rate limiting (updated)
```

### Key Features

- **System Decks**: Pre-defined voting systems (Fibonacci, Modified Fibonacci, T-shirts, Powers of 2)
- **Custom Decks**: User-created voting systems with validation
- **Game Management**: Create, read, update games with comprehensive settings
- **Permission System**: Facilitator-based access control
- **Rate Limiting**: Prevents spam game creation (5 games per 15 minutes)
- **Auto-join**: Users automatically join games when accessing via invite link

---

## Data Models

### Deck Entity

```typescript
interface Deck {
  id: string; // UUID
  name: string; // Deck name (max 50 chars)
  values: string[]; // Ordered array of card values
  is_default: boolean; // System deck vs custom deck
  created_by: string | null; // User ID (null for system decks)
  created_at: Date;
}
```

### Game Entity

```typescript
interface GameRecord {
  id: string; // UUID (used in invite URLs)
  name: string; // Game name (max 60 chars)
  creator_id: string; // User who created the game
  facilitator_id: string; // Current facilitator
  voting_system: string; // Deck ID
  who_can_reveal: GamePermission; // "all_players" | "only_facilitator"
  who_can_manage_issues: GamePermission; // "all_players" | "only_facilitator"
  who_can_toggle_spectator: GamePermission; // "all_players" | "only_facilitator"
  auto_reveal: boolean; // Auto-reveal after all votes
  show_average: boolean; // Show average in results
  show_countdown: boolean; // Show countdown animation
  status: GameStatus; // "active" | "archived"
  created_at: Date;
  updated_at: Date;
}
```

### System Decks

Five pre-defined decks are automatically initialized on server startup:

1. **Fibonacci**: `[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, ☕]`
2. **Modified Fibonacci**: `[0, ½, 1, 2, 3, 5, 8, 13, 20, 40, 100, ?, ☕]`
3. **T-shirts**: `[XS, S, M, L, XL, ?, ☕]`
4. **Powers of 2**: `[0, 1, 2, 4, 8, 16, 32, 64, ?, ☕]`
5. **Normal (0-10)**: `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`
6. **Powers of 2**: `[0, 1, 2, 4, 8, 16, 32, 64, ?, ☕]`

---

## API Endpoints

### Deck Endpoints

#### 1. Get All Decks

```http
GET /api/v1/decks
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "decks": [
    {
      "id": "uuid",
      "name": "Fibonacci",
      "values": [
        "0",
        "1",
        "2",
        "3",
        "5",
        "8",
        "13",
        "21",
        "34",
        "55",
        "89",
        "?",
        "☕"
      ],
      "is_default": true,
      "created_by": null,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. Get Specific Deck

```http
GET /api/v1/decks/:deckId
Authorization: Bearer <token>
```

#### 3. Create Custom Deck

```http
POST /api/v1/decks
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Custom Deck",
  "values": ["1", "2", "3", "5", "8", "?"]
}
```

**Validation Rules:**

- Name: Required, max 50 characters
- Values: Array, 2-20 items, each max 3 characters
- Values must be unique
- Supports emojis

**Response:**

```json
{
  "success": true,
  "deck": {
    "id": "uuid",
    "name": "My Custom Deck",
    "values": ["1", "2", "3", "5", "8", "?"],
    "is_default": false,
    "created_by": "user-id",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 4. Delete Custom Deck

```http
DELETE /api/v1/decks/:deckId
Authorization: Bearer <token>
```

**Restrictions:**

- Cannot delete system decks
- Can only delete own custom decks
- Cannot delete decks used by active games

---

### Game Endpoints

#### 1. Create Game

```http
POST /api/v1/games
Authorization: Bearer <token>
Content-Type: application/json
Rate Limit: 5 requests per 15 minutes

{
  "name": "Sprint 23 Planning",
  "voting_system": "deck-uuid",
  "who_can_reveal": "all_players",
  "who_can_manage_issues": "only_facilitator",
  "who_can_toggle_spectator": "all_players",
  "auto_reveal": false,
  "show_average": true,
  "show_countdown": true
}
```

**Required Fields:**

- `name`: Game name (max 60 characters, supports emojis)

**Optional Fields (with defaults):**

- `voting_system`: Deck ID (defaults to Fibonacci)
- `who_can_reveal`: "all_players" | "only_facilitator" (default: "all_players")
- `who_can_manage_issues`: "all_players" | "only_facilitator" (default: "all_players")
- `who_can_toggle_spectator`: "all_players" | "only_facilitator" (default: "all_players")
- `auto_reveal`: boolean (default: false)
- `show_average`: boolean (default: true)
- `show_countdown`: boolean (default: true)

**Response:**

```json
{
  "success": true,
  "game": {
    "id": "game-uuid",
    "name": "Sprint 23 Planning",
    "creator_id": "user-id",
    "facilitator_id": "user-id",
    "voting_system": "deck-uuid",
    "who_can_reveal": "all_players",
    "who_can_manage_issues": "only_facilitator",
    "who_can_toggle_spectator": "all_players",
    "auto_reveal": false,
    "show_average": true,
    "show_countdown": true,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "deck": {
      "id": "deck-uuid",
      "name": "Fibonacci",
      "values": [
        "0",
        "1",
        "2",
        "3",
        "5",
        "8",
        "13",
        "21",
        "34",
        "55",
        "89",
        "?",
        "☕"
      ],
      "is_default": true,
      "created_by": null,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "creator_name": "John Doe",
    "facilitator_name": "John Doe"
  }
}
```

#### 2. Get Game Details

```http
GET /api/v1/games/:gameId
Authorization: Bearer <token>
```

**Behavior:**

- If user is not a participant, they are automatically added (join via invite link)
- Returns full game details including deck information

**Response:** Same as Create Game response

#### 3. Update Game Settings

```http
PATCH /api/v1/games/:gameId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Game Name",
  "facilitator_id": "new-facilitator-user-id",
  "auto_reveal": true,
  "status": "archived"
}
```

**Authorization:**

- Only the current facilitator can update game settings

**Updatable Fields:**

- `name`: Game name
- `facilitator_id`: Transfer facilitator role (must be a participant)
- `who_can_reveal`: Permission setting
- `who_can_manage_issues`: Permission setting
- `who_can_toggle_spectator`: Permission setting for room spectator/voter self-toggle
- `auto_reveal`: Toggle auto-reveal
- `show_average`: Toggle average display
- `show_countdown`: Toggle countdown animation
- `status`: Archive/activate game

#### 4. Get User's Games

```http
GET /api/v1/games/my/list
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "games": [
    {
      "id": "game-uuid",
      "name": "Sprint 23 Planning",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 5. Get Voting History (Placeholder)

```http
GET /api/v1/games/:gameId/history
Authorization: Bearer <token>
```

**Note:** This endpoint is a placeholder for future implementation (Step 12).

---

## Service Layer

### Deck Service (`deckService.ts`)

**Key Functions:**

```typescript
// Get all decks (system + user's custom)
getAllDecks(userId: string): Promise<Deck[]>

// Get specific deck
getDeckById(deckId: string): Promise<Deck | null>

// Create custom deck with validation
createCustomDeck(userId: string, payload: CreateDeckPayload): Promise<Deck>

// Delete custom deck (with safety checks)
deleteCustomDeck(deckId: string, userId: string): Promise<boolean>

// Initialize system decks on startup
initializeSystemDecks(): Promise<void>

// Get default deck (Fibonacci)
getDefaultDeck(): Promise<Deck | null>
```

**Validation Logic:**

- Deck name: 1-50 characters
- Deck values: 2-20 items, each 1-3 characters
- Unique values required
- Cannot delete system decks
- Cannot delete decks used by active games

### Game Service (`gameService.ts`)

**Key Functions:**

```typescript
// Create new game
createGame(userId: string, payload: CreateGamePayload): Promise<GameRecord>

// Get game by ID
getGameById(gameId: string): Promise<GameRecord | null>

// Get game with full details (includes deck, user names)
getGameDetails(gameId: string): Promise<GameDetails | null>

// Update game settings (facilitator only)
updateGame(gameId: string, userId: string, payload: UpdateGamePayload): Promise<GameRecord | null>

// Get all games user participated in
getUserGames(userId: string): Promise<GameRecord[]>

// Check if user is participant
isGameParticipant(gameId: string, userId: string): Promise<boolean>

// Add user as participant
addGameParticipant(gameId: string, userId: string): Promise<void>

// Check permissions
hasGamePermission(gameId: string, userId: string, action: "reveal" | "manage_issues"): Promise<boolean>
```

**Business Logic:**

- Creator is automatically the first facilitator
- Creator is automatically added as first participant
- Default deck is Fibonacci if not specified
- Facilitator can transfer role to any participant
- Permission checks for reveal and issue management

---

## Validation & Security

### Input Validation

**Game Name:**

- Required
- Max 60 characters
- Supports emojis
- Trimmed before storage

**Deck Name:**

- Required
- Max 50 characters
- Trimmed before storage

**Deck Values:**

- Array of 2-20 strings
- Each value max 3 characters
- Must be unique
- Supports emojis

### Rate Limiting

**Game Creation:**

- 5 games per 15 minutes per IP
- Returns 429 status on limit exceeded
- Implemented via `gameCreationRateLimiter` middleware

### Authorization

**Deck Operations:**

- All endpoints require authentication
- Users can only delete their own custom decks
- System decks cannot be deleted

**Game Operations:**

- All endpoints require authentication
- Only facilitator can update game settings
- Only facilitator can transfer facilitator role
- New facilitator must be a participant

### Security Features

- JWT authentication required for all endpoints
- Rate limiting on game creation
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- Permission checks on sensitive operations

---

## Testing Guide

### Manual Testing with cURL

#### 1. Get All Decks

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/decks
```

#### 2. Create Custom Deck

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Deck",
    "values": ["1", "2", "3", "5", "8", "?"]
  }' \
  http://localhost:3001/api/v1/decks
```

#### 3. Create Game

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sprint Planning",
    "auto_reveal": true,
    "show_average": true
  }' \
  http://localhost:3001/api/v1/games
```

#### 4. Get Game Details

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/games/GAME_UUID
```

#### 5. Update Game Settings

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "auto_reveal": false
  }' \
  http://localhost:3001/api/v1/games/GAME_UUID
```

#### 6. Get User's Games

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/games/my/list
```

### Test Scenarios

#### Scenario 1: Create Game with Default Settings

1. Authenticate user
2. POST to `/api/v1/games` with only `name` field
3. Verify Fibonacci deck is used
4. Verify default settings applied
5. Verify user is added as participant

#### Scenario 2: Create Custom Deck and Use in Game

1. POST to `/api/v1/decks` with custom values
2. Save returned deck ID
3. POST to `/api/v1/games` with `voting_system` = deck ID
4. Verify game uses custom deck

#### Scenario 3: Transfer Facilitator Role

1. Create game as User A
2. User B joins game (GET game details)
3. User A updates game with `facilitator_id` = User B's ID
4. Verify User B is now facilitator
5. Verify User A can no longer update settings

#### Scenario 4: Rate Limiting

1. Create 5 games rapidly
2. Attempt 6th game creation
3. Verify 429 status code returned
4. Wait 15 minutes
5. Verify can create games again

#### Scenario 5: Delete Custom Deck Validation

1. Create custom deck
2. Create game using that deck
3. Attempt to delete deck
4. Verify deletion fails with appropriate error
5. Archive game
6. Verify deck can now be deleted

---

## Troubleshooting

### Common Issues

#### Issue: "Default deck not found"

**Cause:** System decks not initialized
**Solution:**

```bash
# Check server logs for initialization errors
# Manually run initialization:
# In psql: SELECT * FROM decks WHERE is_default = true;
# Should see 4 system decks
```

#### Issue: "Cannot delete deck that is being used"

**Cause:** Deck is used by active games
**Solution:** Archive all games using the deck first, then delete

#### Issue: "Only the facilitator can update game settings"

**Cause:** Non-facilitator trying to update game
**Solution:** Transfer facilitator role first, or use facilitator account

#### Issue: Rate limit exceeded

**Cause:** Too many game creations in 15 minutes
**Solution:** Wait for rate limit window to reset, or increase limit in environment variables

#### Issue: "New facilitator must be a game participant"

**Cause:** Trying to transfer facilitator to non-participant
**Solution:** Have new facilitator join game first (GET game details)

### Database Queries for Debugging

```sql
-- Check system decks
SELECT * FROM decks WHERE is_default = true;

-- Check user's custom decks
SELECT * FROM decks WHERE created_by = 'user-id';

-- Check game participants
SELECT * FROM game_participants WHERE game_id = 'game-uuid';

-- Check active games using a deck
SELECT * FROM games WHERE voting_system = 'deck-uuid' AND status = 'active';

-- Check user's games
SELECT g.* FROM games g
JOIN game_participants gp ON g.id = gp.game_id
WHERE gp.user_id = 'user-id';
```

### Logging

All operations are logged with appropriate levels:

- **INFO**: Successful operations (game created, deck created, etc.)
- **WARN**: Rate limit exceeded, validation failures
- **ERROR**: Database errors, unexpected failures

Check logs at: `backend/logs/` or console output

---

## Environment Variables

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # General rate limit
GAME_CREATION_RATE_LIMIT=5           # Games per window

# Database
DATABASE_URL=postgresql://...

# Server
PORT=3001
NODE_ENV=development
```

---

## Next Steps

After implementing game creation and deck management, the next steps are:

1. **Step 5**: Game room route + basic layout (no real-time yet)
2. **Step 6**: Issues CRUD API + Issues sidebar UI
3. **Step 7**: WebSocket server setup + room management
4. **Step 8**: Voting flow (submit vote, reveal, new round) — full real-time

---

## Summary

This implementation provides:

✅ Complete deck management system with 4 system decks
✅ Custom deck creation with comprehensive validation
✅ Game creation with 8 configurable settings
✅ Permission-based access control
✅ Rate limiting to prevent abuse
✅ Auto-join functionality for invite links
✅ Facilitator role management
✅ Full CRUD operations for games
✅ Integration with authentication system
✅ Comprehensive error handling and validation

All endpoints are protected by JWT authentication and follow RESTful conventions. The system is ready for the next phase: real-time WebSocket integration.

---

**Implementation Date:** 2024-01-20  
**Version:** 1.0.0  
**Status:** Complete ✅
