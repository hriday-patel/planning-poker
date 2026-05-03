# WebSocket Implementation Guide

## Overview

This document describes the real-time WebSocket implementation for the Planning Poker application. The system uses Socket.IO for bidirectional communication between clients and server, enabling real-time game state synchronization across all players in a game room.

## Architecture

### Room-Based Model

The WebSocket system uses a **room-based pub/sub architecture**:

- Each game is a "room" identified by its `game_id` (UUID)
- Players join rooms when they enter a game
- All events are scoped to and broadcast within specific rooms
- Multiple games can run simultaneously without interference

### In-Memory State Management

Active game state is stored in memory for fast access:

```typescript
interface RoomState {
  game_id: string;
  players: Map<string, PlayerInfo>; // userId -> player data
  current_round: {
    id: string;
    issue_id: string | null;
    votes: Map<string, string>; // userId -> card value
    is_revealed: boolean;
  } | null;
  timer: {
    duration_seconds: number;
    remaining_seconds: number;
    is_running: boolean;
    interval_id: NodeJS.Timeout | null;
  } | null;
}
```

**Benefits:**

- Fast read/write operations for real-time events
- No database queries during active gameplay
- State persisted to database only at key moments (round end, settings change)

### Player Presence Tracking

Each player in a room has:

- `socket_id`: Current WebSocket connection ID
- `is_online`: Boolean indicating active connection
- `joined_at`: Timestamp of when they joined

**Reconnection Support:**

- Players can disconnect and reconnect without losing their place
- On reconnect, they receive full game state via `GAME_STATE_SYNC` event
- Previous votes are preserved if round hasn't been revealed

## Authentication

### WebSocket Handshake Authentication

All WebSocket connections must authenticate before joining rooms:

```typescript
// Client sends JWT token during connection
const socket = io("http://localhost:3001", {
  auth: {
    token: "your-jwt-token-here",
  },
});
```

**Server-side middleware** (in `server.ts`):

1. Extracts token from `socket.handshake.auth.token` or `socket.handshake.query.token`
2. Verifies JWT using `verifyAccessToken()`
3. Attaches `userId` and `displayName` to socket object
4. Rejects connection if token is invalid or missing

## Event Types

### Client → Server Events

| Event                  | Payload                           | Description                 |
| ---------------------- | --------------------------------- | --------------------------- |
| `JOIN_GAME`            | `{ game_id }`                     | Player joins a game room    |
| `LEAVE_GAME`           | `{ game_id }`                     | Player leaves a game room   |
| `SUBMIT_VOTE`          | `{ round_id, card_value }`        | Player submits their vote   |
| `REVEAL_CARDS`         | `{ round_id }`                    | Request to reveal all cards |
| `START_NEW_ROUND`      | `{ game_id, issue_id? }`          | Start a new voting round    |
| `UPDATE_GAME_SETTINGS` | `{ game_id, settings }`           | Update game configuration   |
| `START_TIMER`          | `{ game_id, duration_seconds }`   | Start countdown timer       |
| `PAUSE_TIMER`          | `{ game_id }`                     | Pause the timer             |
| `STOP_TIMER`           | `{ game_id }`                     | Stop and reset timer        |
| `ADD_ISSUE`            | `{ game_id, title }`              | Add new issue to game       |
| `UPDATE_ISSUE`         | `{ game_id, issue }`              | Update existing issue       |
| `DELETE_ISSUE`         | `{ game_id, issue_id }`           | Delete an issue             |
| `TRANSFER_FACILITATOR` | `{ game_id, new_facilitator_id }` | Change facilitator          |

### Server → Client Events

| Event                   | Payload                                   | Description                          |
| ----------------------- | ----------------------------------------- | ------------------------------------ |
| `GAME_STATE_SYNC`       | `{ game, players, current_round, timer }` | Full game state (on join/reconnect)  |
| `PLAYER_JOINED`         | `{ user }`                                | New player joined the room           |
| `PLAYER_LEFT`           | `{ user_id }`                             | Player left the room                 |
| `VOTE_SUBMITTED`        | `{ user_id }`                             | Player submitted vote (value hidden) |
| `CARDS_REVEALED`        | `{ votes, average, agreement }`           | All cards revealed with results      |
| `NEW_ROUND_STARTED`     | `{ round_id, issue_id }`                  | New voting round started             |
| `GAME_SETTINGS_UPDATED` | `{ settings }`                            | Game settings changed                |
| `TIMER_TICK`            | `{ remaining_seconds }`                   | Timer countdown update               |
| `TIMER_ENDED`           | `{}`                                      | Timer reached zero                   |
| `ISSUE_ADDED`           | `{ issue }`                               | New issue added                      |
| `ISSUE_UPDATED`         | `{ issue }`                               | Issue modified                       |
| `ISSUE_DELETED`         | `{ issue_id }`                            | Issue removed                        |
| `PLAYER_UPDATED`        | `{ user_id, display_name, avatar_url }`   | Player profile changed               |
| `FACILITATOR_CHANGED`   | `{ new_facilitator_id }`                  | Facilitator role transferred         |
| `ERROR`                 | `{ message }`                             | Error occurred                       |

## Core Flows

### 1. Joining a Game

**Client:**

```typescript
socket.emit("JOIN_GAME", { game_id: "uuid-here" });
```

**Server:**

1. Validates game exists
2. Fetches user profile from database
3. Adds player to room state via `roomManager.addPlayerToRoom()`
4. Sends `GAME_STATE_SYNC` to joining player with full state
5. Broadcasts `PLAYER_JOINED` to all other players in room

**State Changes:**

- Player added to `room.players` Map
- Socket joins Socket.IO room for broadcasts

### 2. Voting Flow

**Step 1: Submit Vote**

Client:

```typescript
socket.emit("SUBMIT_VOTE", {
  round_id: "round-uuid",
  card_value: "5",
});
```

Server:

1. Validates round exists and is not revealed
2. Records vote in `room.current_round.votes`
3. Broadcasts `VOTE_SUBMITTED` (value hidden) to all players
4. If auto-reveal enabled and all players voted, automatically triggers reveal

**Step 2: Reveal Cards**

Client:

```typescript
socket.emit("REVEAL_CARDS", { round_id: "round-uuid" });
```

Server:

1. Checks permission (`who_can_reveal` setting)
2. Marks round as revealed
3. Calculates results:
   - Vote distribution (count per value)
   - Average (numeric values only)
   - Agreement percentage (how many voted the same)
4. Persists round to database
5. Broadcasts `CARDS_REVEALED` with full results

**Step 3: Start New Round**

Client:

```typescript
socket.emit("START_NEW_ROUND", {
  game_id: "game-uuid",
  issue_id: "issue-uuid", // optional
});
```

Server:

1. Clears previous round state
2. Creates new round ID
3. Sets voting issue if provided
4. Broadcasts `NEW_ROUND_STARTED` to all players

### 3. Timer Synchronization

**Start Timer:**

```typescript
socket.emit("START_TIMER", {
  game_id: "game-uuid",
  duration_seconds: 300,
});
```

Server:

1. Creates timer state with interval
2. Broadcasts `TIMER_TICK` every second to all players
3. When timer reaches 0, broadcasts `TIMER_ENDED`
4. Auto-resets if "time issues" setting is enabled

**All players see synchronized countdown** because server is the single source of truth.

### 4. Issue Management

**Add Issue:**

```typescript
socket.emit("ADD_ISSUE", {
  game_id: "game-uuid",
  title: "User story title",
});
```

Server:

1. Checks permission (`who_can_manage_issues`)
2. Creates issue in database
3. Broadcasts `ISSUE_ADDED` to all players

**Update/Delete** follow similar pattern with permission checks.

## Permission System

Game settings control who can perform certain actions:

### `who_can_reveal`

- `"all_players"`: Any player can reveal cards
- `"only_facilitator"`: Only facilitator can reveal

**Enforced in:** `REVEAL_CARDS` handler

### `who_can_manage_issues`

- `"all_players"`: Any player can add/edit/delete issues
- `"only_facilitator"`: Only facilitator can manage issues

**Enforced in:** `ADD_ISSUE`, `UPDATE_ISSUE`, `DELETE_ISSUE` handlers

**Implementation:**

```typescript
const game = await getGameById(game_id);
if (
  game.who_can_reveal === "only_facilitator" &&
  authSocket.userId !== game.facilitator_id
) {
  throw new Error("Only facilitator can reveal cards");
}
```

## Auto-Reveal Logic

When `auto_reveal` setting is enabled:

1. After each vote submission, check if all players have voted
2. If yes, automatically trigger reveal (no manual action needed)
3. Countdown animation still plays if enabled

**Implementation:**

```typescript
if (game.auto_reveal && roomManager.haveAllPlayersVoted(game_id)) {
  // Trigger reveal automatically
  const results = roomManager.revealCards(game_id);
  io.to(game_id).emit("CARDS_REVEALED", results);
}
```

## Results Calculation

### Vote Distribution

Count how many players voted for each value:

```typescript
{ '3': 2, '5': 3, '8': 1 }  // 2 voted 3, 3 voted 5, 1 voted 8
```

### Average

Only numeric values included:

- `?` and `☕` excluded
- Fractional values like `½` converted to 0.5
- Result rounded to 1 decimal place

### Agreement Percentage

```typescript
agreement = (most_common_vote_count / total_votes) * 100;
```

Examples:

- All voted same: 100% (full consensus)
- 3 out of 5 voted same: 60%
- All different: ~16-20% (depending on vote count)

## Error Handling

All event handlers wrapped in try-catch:

```typescript
authSocket.on(ClientEvents.EVENT_NAME, async (payload) => {
  try {
    // Handle event
  } catch (error) {
    logger.error(`Error in EVENT_NAME:`, error);
    authSocket.emit(ServerEvents.ERROR, {
      message: error.message,
    });
  }
});
```

**Client should listen for ERROR events:**

```typescript
socket.on("ERROR", ({ message }) => {
  console.error("Server error:", message);
  // Show error toast to user
});
```

## Disconnect Handling

When a player disconnects:

1. Socket disconnect event fires
2. Player marked as offline in room state
3. `PLAYER_LEFT` broadcast to other players
4. Player data retained in room for reconnection

**Reconnection:**

- Player reconnects with same JWT
- Emits `JOIN_GAME` again
- Receives full state via `GAME_STATE_SYNC`
- Previous votes preserved if round not revealed

## Room Cleanup

Rooms are automatically cleaned up when empty:

```typescript
removePlayerFromRoom(gameId: string, userId: string) {
  // ... remove player ...

  if (room.players.size === 0) {
    // Stop timer if running
    if (room.timer?.interval_id) {
      clearInterval(room.timer.interval_id);
    }
    // Delete room from memory
    this.rooms.delete(gameId);
  }
}
```

## Testing WebSocket Events

### Using Socket.IO Client

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: { token: "your-jwt-token" },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Join game
  socket.emit("JOIN_GAME", { game_id: "test-game-id" });
});

socket.on("GAME_STATE_SYNC", (state) => {
  console.log("Game state:", state);
});

socket.on("PLAYER_JOINED", (data) => {
  console.log("Player joined:", data.user.display_name);
});
```

### Testing Checklist

- [ ] Authentication: Invalid token rejected
- [ ] Join game: Receive full state
- [ ] Submit vote: Other players see vote submitted (value hidden)
- [ ] Reveal cards: All players see results simultaneously
- [ ] Auto-reveal: Cards reveal when all voted (if enabled)
- [ ] Timer: All players see synchronized countdown
- [ ] Issue management: Add/update/delete broadcasts to all
- [ ] Permissions: Only authorized users can perform restricted actions
- [ ] Reconnection: Player rejoins and receives current state
- [ ] Disconnect: Other players notified

## Frontend Integration

### React Hook Example

```typescript
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useGameSocket(gameId: string, token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:3001", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      newSocket.emit("JOIN_GAME", { game_id: gameId });
    });

    newSocket.on("GAME_STATE_SYNC", (state) => {
      setGameState(state);
    });

    newSocket.on("VOTE_SUBMITTED", ({ user_id }) => {
      // Update UI to show player voted
    });

    newSocket.on("CARDS_REVEALED", (results) => {
      // Show results modal
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("LEAVE_GAME", { game_id: gameId });
      newSocket.close();
    };
  }, [gameId, token]);

  const submitVote = (cardValue: string) => {
    socket?.emit("SUBMIT_VOTE", {
      round_id: gameState?.current_round?.id,
      card_value: cardValue,
    });
  };

  return { socket, gameState, submitVote };
}
```

## Performance Considerations

### Memory Management

- Active rooms stored in Map for O(1) access
- Rooms automatically cleaned up when empty
- Timer intervals properly cleared on cleanup

### Broadcast Optimization

- Use `io.to(gameId).emit()` for room-scoped broadcasts
- Avoid broadcasting to sender when not needed
- Send minimal data in events (IDs instead of full objects when possible)

### Database Writes

- Batch writes when possible
- Write to DB only at key moments:
  - Round revealed (persist votes)
  - Game settings changed
  - Issue created/updated/deleted
- Active gameplay uses in-memory state only

## Security

### Authentication

- All connections require valid JWT
- Token verified before any event processing
- User ID extracted from verified token (not from client payload)

### Authorization

- Permission checks on restricted actions
- Game settings enforced server-side
- Client UI should hide/disable unauthorized actions (UX)

### Input Validation

- All payloads validated before processing
- Game/round/issue IDs verified to exist
- Card values validated against game's deck

### Rate Limiting

Consider adding rate limiting for:

- Vote submissions (prevent spam)
- Issue creation (prevent flooding)
- Timer starts (prevent abuse)

## Troubleshooting

### Connection Issues

- **Problem:** Client can't connect
- **Check:** CORS settings in `server.ts`
- **Check:** Token is valid and not expired
- **Check:** WebSocket port is accessible

### State Sync Issues

- **Problem:** Players see different states
- **Check:** All events properly broadcast to room
- **Check:** Room state updates are atomic
- **Check:** No race conditions in vote submission

### Timer Drift

- **Problem:** Timers out of sync across clients
- **Check:** Server is single source of truth
- **Check:** TIMER_TICK broadcasts every second
- **Check:** Client doesn't run its own countdown

## Future Enhancements

### Planned Features

- [x] Spectator mode support (join without voting)
- [ ] Voting history in-game view
- [ ] Export results to CSV/PDF
- [ ] Integration with JIRA/Linear for issue import

### Scalability

For high-traffic scenarios:

- Use Redis adapter for Socket.IO to enable horizontal scaling
- Store room state in Redis instead of in-memory Map
- Implement sticky sessions for load balancing

## Related Documentation

- [Authentication Implementation](./AUTH_IMPLEMENTATION.md)
- [Game API Implementation](./GAME_API_IMPLEMENTATION.md)
- [Database Schema](../database/README.md)

---

**Last Updated:** 2026-04-20  
**Version:** 1.0.0
