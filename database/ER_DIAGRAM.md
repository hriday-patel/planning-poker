# Entity-Relationship Diagram

## Sprint Planning Poker Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USERS (Authentication)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ PK  id (VARCHAR)              ← W3ID user identifier                        │
│     display_name (VARCHAR)                                                   │
│     avatar_url (TEXT)                                                        │
│     spectator_mode (BOOLEAN)                                                 │
│     theme_preference (VARCHAR)                                               │
│     created_at (TIMESTAMP)                                                   │
│     updated_at (TIMESTAMP)                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ creates            │ facilitates        │ creates custom
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│      DECKS       │  │      GAMES       │  │ GAME_PARTICIPANTS│
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ PK  id (UUID)    │  │ PK  id (UUID)    │  │ PK  game_id      │
│     name         │  │     name         │  │ PK  user_id      │
│     values[]     │◄─┤ FK  deck_id      │  │     joined_at    │
│     is_default   │  │ FK  creator_id   │  │     is_active    │
│ FK  created_by   │  │ FK  facilitator  │  │     last_seen_at │
│     created_at   │  │     who_can_*    │  └──────────────────┘
└──────────────────┘  │     auto_reveal  │           ▲
                      │     settings...  │           │
                      │     status       │           │ joins
                      │     created_at   │           │
                      │     updated_at   │           │
                      └──────────────────┘           │
                               │                     │
                               │ has                 │
                               │                     │
         ┌─────────────────────┼─────────────────────┘
         │                     │
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│     ISSUES       │  │   TIMER_STATE    │
├──────────────────┤  ├──────────────────┤
│ PK  id (UUID)    │  │ PK  game_id      │
│ FK  game_id      │  │     duration_sec │
│     title        │  │     remaining_sec│
│     status       │  │     is_running   │
│     final_est    │  │     time_issues  │
│ FK  created_by   │  │     started_at   │
│     display_order│  │     updated_at   │
│     created_at   │  └──────────────────┘
│     updated_at   │
└──────────────────┘
         │
         │ estimated in
         │
         ▼
┌──────────────────┐
│  VOTING_ROUNDS   │
├──────────────────┤
│ PK  id (UUID)    │
│ FK  game_id      │
│ FK  issue_id     │
│     started_at   │
│     revealed_at  │
│     is_active    │
└──────────────────┘
         │
         │ contains
         │
         ▼
┌──────────────────┐
│      VOTES       │
├──────────────────┤
│ PK  id (UUID)    │
│ FK  round_id     │
│ FK  user_id      │
│     card_value   │
│     submitted_at │
│ UNIQUE(round,usr)│
└──────────────────┘
```

## Relationship Cardinalities

### One-to-Many Relationships

1. **users → games (creator)**
   - One user can create many games
   - Each game has one creator

2. **users → games (facilitator)**
   - One user can facilitate many games
   - Each game has one facilitator

3. **users → decks**
   - One user can create many custom decks
   - Each custom deck has one creator (system decks have NULL)

4. **users → issues**
   - One user can create many issues
   - Each issue has one creator

5. **decks → games**
   - One deck can be used in many games
   - Each game uses one deck

6. **games → issues**
   - One game can have many issues
   - Each issue belongs to one game

7. **games → voting_rounds**
   - One game can have many voting rounds
   - Each round belongs to one game

8. **issues → voting_rounds**
   - One issue can have many voting rounds (if re-estimated)
   - Each round estimates one issue (optional)

9. **voting_rounds → votes**
   - One round can have many votes
   - Each vote belongs to one round

### Many-to-Many Relationships

1. **users ↔ games (via game_participants)**
   - Many users can join many games
   - Tracks participation and online status

### One-to-One Relationships

1. **games → timer_state**
   - Each game has one timer state
   - Each timer state belongs to one game

## Key Constraints

### Primary Keys

- **UUID**: games, decks, issues, voting_rounds, votes
- **VARCHAR**: users (external W3ID)
- **Composite**: game_participants (game_id, user_id)

### Foreign Keys

- All foreign keys have appropriate ON DELETE actions:
  - CASCADE: Delete dependent records
  - SET NULL: Keep record but clear reference
  - RESTRICT: Prevent deletion if referenced

### Unique Constraints

- votes: (round_id, user_id) - one vote per user per round

### Check Constraints

- games.who_can_reveal: 'all_players' | 'facilitator_only'
- games.who_can_manage_issues: 'all_players' | 'facilitator_only'
- games.status: 'active' | 'archived'
- issues.status: 'pending' | 'voting' | 'voted'
- users.theme_preference: 'dark' | 'light'

## Indexes

### Performance Indexes

```sql
-- Users
CREATE INDEX idx_users_created_at ON users(created_at);

-- Decks
CREATE INDEX idx_decks_created_by ON decks(created_by);
CREATE INDEX idx_decks_is_default ON decks(is_default);

-- Games
CREATE INDEX idx_games_creator_id ON games(creator_id);
CREATE INDEX idx_games_facilitator_id ON games(facilitator_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at);

-- Game Participants
CREATE INDEX idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_game_participants_is_active ON game_participants(game_id, is_active);

-- Issues
CREATE INDEX idx_issues_game_id ON issues(game_id);
CREATE INDEX idx_issues_status ON issues(game_id, status);
CREATE INDEX idx_issues_display_order ON issues(game_id, display_order);

-- Voting Rounds
CREATE INDEX idx_voting_rounds_game_id ON voting_rounds(game_id);
CREATE INDEX idx_voting_rounds_issue_id ON voting_rounds(issue_id);
CREATE INDEX idx_voting_rounds_is_active ON voting_rounds(game_id, is_active);

-- Votes
CREATE INDEX idx_votes_round_id ON votes(round_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
```

## Data Flow Examples

### Creating a Game

```
1. User authenticated via W3ID → users table
2. User creates game → games table (creator_id, facilitator_id = user.id)
3. User selects deck → games.deck_id references decks.id
4. Game URL generated → games.id (UUID)
```

### Joining a Game

```
1. User opens game URL → lookup games by id
2. User joins → insert into game_participants
3. WebSocket connection → update is_active = true
```

### Voting Flow

```
1. Facilitator starts round → insert into voting_rounds (is_active = true)
2. Update issue status → issues.status = 'voting'
3. Users submit votes → insert into votes
4. Reveal cards → update voting_rounds.revealed_at
5. Save estimate → update issues.final_estimate, status = 'voted'
6. Mark round complete → voting_rounds.is_active = false
```

### Timer Synchronization

```
1. User starts timer → insert/update timer_state
2. WebSocket broadcasts → all clients receive TIMER_TICK events
3. Timer updates → timer_state.remaining_seconds decremented
4. Timer ends → timer_state.is_running = false
```

## Security Considerations

1. **User Identity**: W3ID provides trusted user identity
2. **Game Access**: UUID-based URLs prevent enumeration
3. **Vote Privacy**: Votes hidden until reveal (enforced in application layer)
4. **Authorization**: Facilitator permissions checked before operations
5. **Input Validation**: All user inputs validated and sanitized

## Scalability Notes

1. **Partitioning**: Games table can be partitioned by created_at for archival
2. **Caching**: Active game state cached in Redis for WebSocket performance
3. **Indexing**: All foreign keys and filter columns indexed
4. **Connection Pooling**: Configured for concurrent WebSocket connections
