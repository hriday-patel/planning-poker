# 🕵️ Planning Poker — Deep Code Audit Prompt
### For Agentic Code Editor (Cursor / Windsurf / etc.)

---

## 🧠 YOUR MINDSET FOR THIS ENTIRE AUDIT

You are not a developer adding features. You are **three people at once**:

**1. The Security Researcher**
> "How can I break authentication? Can I access someone else's game? Can I make the server crash? Can I bypass permissions? What happens if I send unexpected data?"

**2. The QA Engineer**
> "What happens when the network drops mid-vote? What if two users click reveal at the same time? What if the database is slow? What if a field is empty, null, or 10x larger than expected? What if someone opens the same game in two browser tabs?"

**3. The Code Reviewer**
> "Is this logic duplicated somewhere else? Is this function doing two unrelated things? Is this variable name misleading? Will the next developer understand what this does in 6 months? Is this the simplest way to write this?"

**Every time you read a file, you must wear all three hats simultaneously.**

---

## ⚠️ ABSOLUTE RULES (Never Break These)

1. **Read first, code last.** In every phase: read all listed files completely → form your findings → ask your questions → wait for my answers → only then make changes.

2. **One phase at a time.** Do not start the next phase until I say "proceed to Phase N+1".

3. **Report everything, fix only what I approve.** If you find 10 issues in a phase, list all 10 and ask me which ones to fix. Do not silently skip things.

4. **Explain like I'm not a developer.** I am a beginner. For every issue you find, explain it as: *"In `filename.ts`, the code does [X]. The problem is [Y]. This can cause [Z] to happen."* No unexplained jargon.

5. **No new features.** Only fix, clean, and simplify. Do not add anything that wasn't already there.

6. **Separate findings from questions.** First list all your findings in a numbered format. Then list your questions separately. This keeps things readable.

---

## 📁 Codebase Map

```
backend/src/
├── config/           → database.ts, passport.ts, redis.ts
├── middleware/       → auth.ts, errorHandler.ts, rateLimiter.ts
├── routes/           → auth.routes.ts, game.routes.ts, deck.routes.ts,
│                       issue.routes.ts, user.routes.ts
├── services/         → authService.ts, gameService.ts, deckService.ts,
│                       issueService.ts, roomManager.ts, tokenService.ts,
│                       userService.ts
├── types/            → auth.types.ts, game.types.ts, websocket.types.ts
├── utils/            → logger.ts
├── websocket/        → handlers.ts
└── server.ts

database/
├── migrations/       → 001_initial_schema.sql
└── seeds/            → 001_dev_data.sql

frontend/src/
├── app/              → page.tsx, login/page.tsx, create/page.tsx,
│                       game/[gameId]/page.tsx, account/page.tsx, layout.tsx
├── components/       → Timer.tsx, InviteModal.tsx, GameSettingsModal.tsx,
│                       VotingHistory.tsx, EditProfileModal.tsx,
│                       ProfileDropdown.tsx, ThemeToggle.tsx
├── contexts/         → ThemeContext.tsx
├── hooks/            → useGameSocket.ts
├── types/            → game.types.ts
└── styles/           → globals.css
```

---

---

# PHASE 1 — The Database Layer
### Files: `database/migrations/001_initial_schema.sql`, `database/seeds/001_dev_data.sql`, `backend/src/types/game.types.ts`, `backend/src/config/database.ts`

**Read every line of all four files before forming any findings.**

---

### Investigation Checklist — Security Researcher Hat 🔴

While reading, ask yourself:

- **Do the SQL CHECK constraints actually enforce what the application expects?**
  Compare every `CHECK (column IN (...))` constraint in the schema against every enum defined in `game.types.ts`. If the allowed string values in the SQL and in the TypeScript don't match exactly (character-by-character), that's a bug.

- **Can the schema be put into an inconsistent state?**
  Look for foreign key relationships. Are they all `ON DELETE CASCADE` or `ON DELETE SET NULL` or `ON DELETE RESTRICT`? For each one, ask: "If I delete a user, what happens to their games? Their votes? Their issues?" Does this match what the application logic expects?

- **Are there missing constraints that allow impossible data?**
  Example: Can a game have `facilitator_id` pointing to a user who is not in `game_participants`? Can a vote exist for a round that has `is_active = FALSE`? The schema may not prevent these.

- **What is the data type for user IDs vs game IDs?**
  Users use `VARCHAR(255)`, games use `UUID`. Are all foreign keys using the right type? A `VARCHAR` referencing a `UUID` column, or vice versa, is a silent type mismatch.

---

### Investigation Checklist — QA Engineer Hat 🟡

- **What happens if two people insert the same system deck name at startup?**
  Look at `initializeSystemDecks()` in `deckService.ts` and check the schema. Is there a `UNIQUE` constraint on deck name? What prevents race conditions during server startup?

- **What is the maximum length of `display_name` in the schema vs the application?**
  Compare `VARCHAR(40)` in the schema against any validation in the services. If the application allows 40 chars but somewhere else it allows more or less, data will either be truncated silently or rejected with a confusing error.

- **Can `display_order` in `issues` become negative or non-sequential?**
  Is there a `CHECK (display_order >= 0)` constraint? What happens to ordering when an issue in the middle is deleted?

- **The `timer_state` table has `game_id` as primary key — is this correct?**
  This means only ONE timer per game. If a timer is paused and restarted, does it UPDATE the row or INSERT a new one? Check what the application actually does vs what the schema supports.

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Is there any configuration duplicated across `database.ts` and `database/config.example.js`?**
  Both define database connection settings. Is the example file actually used anywhere, or is it just a template? If it's only a template, does it need to exist at all?

- **Does `database.ts` export two different connection objects (`config` and `db`)?**
  If yes — why? Document your reasoning: what is each one used for, and could they be consolidated?

- **Are there any columns in the schema that have no corresponding field in the TypeScript types?**
  Read every column in every table and verify it appears somewhere in `game.types.ts` or `auth.types.ts`. Orphaned schema columns are dead weight or forgotten features.

---

### 📋 What to Deliver at the End of Phase 1

Format your output exactly like this:

```
FINDINGS:
[1] SEVERITY: Critical/High/Medium/Low
    File: filename, line number
    What the code does: ...
    What the problem is: ...
    What could go wrong: ...

[2] ...

QUESTIONS FOR YOU:
[Q1] (simple, plain English question about a decision I need to make)
[Q2] ...
```

Do NOT make any code changes yet. Wait for my answers.

---

---

# PHASE 2 — The Services Layer (Business Logic)
### Files: `authService.ts`, `gameService.ts`, `deckService.ts`, `issueService.ts`, `tokenService.ts`, `userService.ts`, `roomManager.ts`

**Read every service file completely before forming findings.**

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Can User A access or modify User B's data?**
  For every function that takes a `userId` parameter — is that userId coming from a trusted source (the JWT token), or could it be supplied by the caller? If any service function blindly trusts a caller-supplied userId without verification, that's a privilege escalation bug.

- **Can a non-facilitator perform facilitator-only actions by calling service functions directly?**
  Some permission checks happen in the route layer. But service functions are also called from the WebSocket handler. Are the same permission checks performed in BOTH places? Trace the path: `WebSocket event → handler function → service function`. At which point does permission checking happen? What if the WebSocket handler calls the service but skips the check?

- **Is the invite token system secure?**
  In `authService.ts`, read `createInviteLink`, `validateInviteToken`, and `consumeInviteToken` carefully.
  - Can the same token be used twice? What prevents this?
  - Is there a time-of-check to time-of-use (TOCTOU) gap? Meaning: what happens if two users click the same invite link at exactly the same millisecond? Draw out the sequence of Redis reads and writes. Is any operation atomic?
  - Can anyone generate an invite link for someone else's game?
  - What happens to the invite token after the game is archived?

- **Are JWT secrets validated at startup?**
  In `tokenService.ts`, what happens if `process.env.JWT_SECRET` is not set? Does the app start anyway with a fallback value? What would that fallback value be? Is it secret?

- **Can a deleted user's JWT still be used?**
  In `auth.ts` middleware, after verifying the JWT signature, does the code verify the user still exists in the database? What happens if someone's account is deleted but their token is still valid?

---

### Investigation Checklist — QA Engineer Hat 🟡

- **What happens to database consistency when a multi-step write fails halfway?**
  Find every function that does more than ONE database write operation. Examples: creating a game (inserts game + inserts participant), importing issues (inserts N issues in a loop). For each one: if the 2nd write fails after the 1st succeeded, is the database left in a consistent state? Are any of these wrapped in a transaction?

- **What happens when `getDefaultDeck()` returns null?**
  In `gameService.ts`, `createGame` calls `getDefaultDeck()`. Trace what happens if it returns null. Is there a clear error message, or does the code crash with a confusing null reference error?

- **What happens when `calculateVotingResults` is called with zero votes?**
  In `roomManager.ts`, find the `calculateVotingResults` function. What happens with: 0 players, 1 player, all players voting `?` (non-numeric), all players voting `☕`? Does the average calculation divide by zero?

- **What happens to an in-memory room if the server restarts?**
  `roomManager.ts` stores all room state in a JavaScript `Map` in memory. If the server process restarts (crash, deployment), all in-progress game states are permanently lost. Is there any mechanism to recover? This may be acceptable, but it should be a documented limitation rather than a hidden surprise.

- **In `addGameParticipant`, what happens if the same user is added twice concurrently?**
  The function checks `isGameParticipant` then inserts. What if two simultaneous requests both pass the check before either inserts? Does the database have a UNIQUE constraint that would catch this, or would there be duplicate rows?

- **Timer state: what happens if `startTimer` is called twice without stopping?**
  In `roomManager.ts`, the `startTimer` function stops any existing interval before starting a new one. But check carefully: is the old `interval_id` cleared before or after the new interval is created? Is there a window where two intervals could be running simultaneously?

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Are there functions that exist but are never called?**
  Look specifically at: `createUser` in `userService.ts` (vs `upsertUser`), `deleteUser` in `userService.ts`, `revokeAllSessions` in `authService.ts` (vs `deleteSession`), `decodeToken` in `tokenService.ts`. For each: find every place in the codebase it is called. If it is called zero times and does the same thing as another function, it is dead code.

- **Is the same Redis key prefix pattern used consistently?**
  Count how many different Redis key formats exist across all services: `session:${userId}`, `oauth:state:${state}`, `invite:${token}`. Is there a single place that defines these key patterns, or are they hardcoded strings scattered across multiple files? Scattered string keys are a maintenance hazard.

- **Does `roomManager.ts` mix two unrelated concerns?**
  Read it top to bottom. Does it manage room state AND calculate game results AND manage timers? If yes, is this one function doing too many things? Note this as a structural observation, not necessarily something to fix now.

---

### 📋 What to Deliver at the End of Phase 2

Same format as Phase 1: numbered findings + separate questions. No code changes yet.

---

---

# PHASE 3 — The Routes & Middleware Layer
### Files: `server.ts`, `auth.routes.ts`, `game.routes.ts`, `deck.routes.ts`, `issue.routes.ts`, `user.routes.ts`, `auth.ts`, `rateLimiter.ts`, `errorHandler.ts`

**Read all files before forming findings.**

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Can routes be accessed without authentication?**
  Go through every route in every routes file. For each `router.get(...)`, `router.post(...)`, etc. — is `authenticate` in the middleware chain? Make a list of any routes that are missing it and should have it.

- **Is the rate limiter on the right routes?**
  Look at where `authRateLimiter`, `strictAuthRateLimiter`, `uploadRateLimiter`, and `gameCreationRateLimiter` are applied. Are there any routes where abuse would be possible because rate limiting is missing? Examples: the token refresh endpoint, the invite link creation endpoint, the voting history endpoint.

- **Can the OAuth callback be triggered by an attacker?**
  The CSRF state parameter is stored in Redis before initiating OAuth. But look carefully: when is the state verified? Is it verified BEFORE or AFTER Passport processes the callback? If Passport processes the callback first and only then the state is checked, an attacker could replay a callback and the check might be too late.

- **What does the `sanitizeReturnTo` function in `authService.ts` actually protect against?**
  After OAuth completes, the user is redirected to `${FRONTEND_URL}${stateData.returnTo}`. Trace what values `returnTo` could contain. Does `sanitizeReturnTo` prevent open redirect attacks? Specifically: what if `returnTo` is `//evil.com`? What if it contains URL-encoded characters? Test the logic of `isSafeReturnPath` mentally.

- **Does the GET game route have an unintended behavior?**
  In `game.routes.ts`, `GET /:gameId` automatically adds any authenticated user as a participant. This means: if someone guesses or knows a game UUID, they can join any game without an invite. Is this the intended behavior? What was the design intent here?

- **Are error messages leaking internal information?**
  In `errorHandler.ts`, check what is returned in production vs development. In development, is the full stack trace included in the response? Could this expose file paths, database structure, or internal logic to an attacker monitoring the network?

---

### Investigation Checklist — QA Engineer Hat 🟡

- **Is there a route order bug anywhere in Express routing?**
  Express matches routes in the ORDER they are defined. For every routes file and for `server.ts`, carefully read the order of route definitions. Specifically check: are there any static paths (like `/my/list`, `/history`, `/import`, `/vote`, `/validate`) that are defined AFTER a dynamic path (like `/:gameId`, `/:deckId`, `/:issueId`)? If a static path appears after a dynamic path, Express will match the dynamic path first and the static path will never be reached.

- **What happens if `req.body` is completely missing or malformed?**
  For every route that reads from `req.body` — what happens if the request has no body, or the body is an empty object `{}`? Are there null-safety checks, or will the code throw a reference error?

- **What happens if route parameters contain unexpected characters?**
  What if someone calls `GET /api/v1/games/; DROP TABLE games; --`? Or a UUID with extra characters? Express passes these as raw strings. Do any service functions pass these directly into SQL queries, or are they always using parameterized queries?

- **Is the `/health` endpoint doing enough?**
  In `server.ts`, `GET /health` returns `{ status: "ok" }`. Does it check if the database is reachable? Does it check if Redis is reachable? A health endpoint that always returns 200 even when dependencies are down is worse than useless.

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Is there repeated authentication boilerplate across routes?**
  In every single route handler, there is this pattern:
  ```
  if (!authReq.userId) {
    res.status(401).json({ ... });
    return;
  }
  ```
  But `authenticate` middleware already guarantees that `req.userId` is set — if it wasn't, the middleware would have returned 401 before reaching the route handler. Is this check redundant? Could it be removed?

- **Is the `as any` cast used too liberally?**
  Search across all route files for `as any`. Every occurrence is a place where TypeScript's type safety was bypassed. List each one and evaluate: is the `as any` necessary, or is there a proper type that should be used instead?

- **Are route response shapes consistent?**
  Across all routes, look at the success response format. Some return `{ success: true, game: ... }`, some may return `{ success: true, data: ... }`. Is the schema consistent? Inconsistency makes frontend parsing fragile.

---

### 📋 What to Deliver at the End of Phase 3

Same format: numbered findings + separate questions. No code changes yet.

---

---

# PHASE 4 — The WebSocket Layer
### Files: `handlers.ts`, `roomManager.ts`, `websocket.types.ts`, `frontend/src/hooks/useGameSocket.ts`

**This phase requires you to read both the backend handler AND the frontend hook together, as a pair. You are looking for mismatches between what the server sends and what the client expects.**

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Can a player perform actions on a game they haven't joined?**
  Every WebSocket event handler in `handlers.ts` receives a `game_id`. Does the handler verify that the connected user is actually a participant of that game before processing the event? If not, any authenticated user could emit `SUBMIT_VOTE` with any `game_id` and it might be processed.

- **Can a player vote on behalf of another player?**
  In `submitVote` in `roomManager.ts`, the vote is recorded using the `userId` from `authSocket.userId` (extracted from the verified JWT). Can a client supply a different userId in the payload to override this? Read carefully — is the userId ever taken from the payload instead of the socket?

- **Can a player reveal cards when the game setting says only the facilitator can?**
  Trace the `REVEAL_CARDS` event: handler → `hasGamePermission` check → `revealCards`. Is the permission check happening? What is the exact condition? What if the game settings are updated mid-session — does the permission check use the latest settings or stale in-memory data?

- **Can timer events be abused?**
  `START_TIMER` accepts a `duration_seconds` from the client. Is there a maximum limit? What if someone sends `duration_seconds: 999999999`? What if they send `duration_seconds: -1` or `duration_seconds: 0`? Does the timer interval start with a negative remaining time, potentially causing an infinite loop?

- **What happens if a WebSocket message payload is missing required fields?**
  For each event handler (JOIN_GAME, SUBMIT_VOTE, REVEAL_CARDS, etc.) — what happens if the payload is `{}` (empty object)? Or if `game_id` is `null`? Or if `card_value` is an SQL injection string? Are there guards before every destructured field is used?

---

### Investigation Checklist — QA Engineer Hat 🟡

- **Do the event names match between server and client?**
  Create a mental table:
  - For each `io.to(...).emit(EventName, ...)` or `authSocket.emit(EventName, ...)` in `handlers.ts` → what is the exact string value of `EventName`?
  - For each `newSocket.on(EventName, ...)` in `useGameSocket.ts` → what is the exact string value of `EventName`?
  - Do they match exactly, character by character? Even ONE mismatch means that event will never be received by the client.

  Do the same check in reverse: for each event the CLIENT emits (`socket.emit(ClientEvents.X, ...)`), is there a matching handler on the SERVER?

- **What happens when a player disconnects mid-vote?**
  A player submits their vote. Before cards are revealed, they disconnect. Questions:
  - Is their vote still in the room state?
  - If auto-reveal is enabled, does `haveAllPlayersVoted` still count the disconnected player as needing to vote?
  - Is the disconnected player removed from `room.players`?

- **What happens if a new round starts while a player is still on the results screen?**
  Player A sees results. Player B (facilitator) starts a new round immediately. Player A's local state shows `VotingPhase.REVEALED`. The WebSocket event `NEW_ROUND_STARTED` arrives. Does the frontend correctly reset to `VotingPhase.WAITING`? Or does the stale `REVEALED` state persist?

- **What happens if `getRoomState` is called for a game that has no room created yet?**
  In `roomManager.ts`, `getRoom(gameId)` creates a new empty room if one doesn't exist. If a player connects via WebSocket but the room doesn't exist yet, they get an empty state with no game data. Is this handled gracefully?

- **What happens when two players click "Reveal Cards" at the exact same millisecond?**
  `revealCards` in `roomManager.ts` sets `is_revealed = true`. If two handlers run simultaneously (JavaScript's event loop makes this unlikely but not impossible with async operations), could `CARDS_REVEALED` be emitted twice? Would that break the frontend?

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Are the `ClientEvents` and `ServerEvents` enums defined in multiple places?**
  Check `websocket.types.ts` (backend) vs `useGameSocket.ts` (frontend). Are there duplicate enum definitions? If the same event name string is defined in two places, changing one place breaks the other silently. There should be ONE source of truth.

- **Does `handlers.ts` have direct database access, or does it go through service functions?**
  Look for any `db.query(...)` calls inside `handlers.ts`. If direct DB calls exist in the handler file, that's a separation of concerns violation. Handlers should only call service functions, not the database directly.

- **Are there any `console.log` statements that should be `logger` calls?**
  Search `handlers.ts` and `useGameSocket.ts` for `console.log`, `console.error`, `console.warn`. Backend code should use the Winston `logger`. Frontend WebSocket hook should use `logger` or at minimum only log in development mode.

- **Are any WebSocket event handlers duplicating logic that already exists in the REST service layer?**
  Example: `UPDATE_ISSUE` WebSocket event calls `updateIssueService(...)`. There is also a `PATCH /api/v1/games/:gameId/issues/:issueId` REST route that calls the same service. This is intentional (two ways to update), but verify the same validation and permission logic runs in both paths.

---

### 📋 What to Deliver at the End of Phase 4

Same format: numbered findings + separate questions. No code changes yet.

---

---

# PHASE 5 — The Frontend: State, Data Flow & UI Logic
### Files: `game/[gameId]/page.tsx`, `create/page.tsx`, `useGameSocket.ts`, `frontend/src/types/game.types.ts`

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Is any sensitive data exposed in the frontend that should not be?**
  When the `GAME_STATE` sync event arrives, it contains the full game object and all player data. Is the vote value of other players ever sent to the client before cards are revealed? If yes, a technically inclined user could read their teammates' votes from the browser's WebSocket console before the "reveal" animation.

- **Are API calls using `credentials: "include"` everywhere they should?**
  Search every `fetch(...)` call in the frontend. Missing `credentials: "include"` means cookies (including JWT tokens) won't be sent, causing mysterious 401 errors. Make a list of every fetch call and verify this option is present.

- **What happens if a user manually navigates to `/game/some-random-id`?**
  The page tries to connect via WebSocket. The WebSocket auth uses the session cookie. If the game doesn't exist, what error does the user see? Is there a clean error state, or does the page hang indefinitely?

---

### Investigation Checklist — QA Engineer Hat 🟡

- **What is the state of the page before the WebSocket connects?**
  Between page load and the first `GAME_STATE` event arriving — what does the user see? Is `gameState.isLoading` true? Is there a loading screen? What if the WebSocket never connects (server is down)?

- **Is `currentUser` ever populated?**
  The `GameState` interface has a `currentUser` field. Trace through the entire component: where is it set? Where is it read? If it's never set to an actual value, every feature that depends on it (`currentUser?.id`, `currentUser?.is_facilitator`, etc.) will silently fail.

- **Does the voting card selection survive a re-render?**
  When a player selects a card (`handleCardSelect`), `selectedCard` is set in local state. If the WebSocket then delivers an update (e.g., another player joined), the component re-renders. Does `selectedCard` survive this re-render? Does the card appear still selected? Is the vote re-submitted?

- **What happens if `gameState.game.deck.values` is empty?**
  The card deck at the bottom maps over `gameState.game.deck.values`. What if this array is empty or null? Does the component crash or gracefully show an empty deck?

- **Does the `useEffect` that syncs `wsGameState` have a stale closure issue?**
  Inside the `useEffect`, is any piece of local state (from `useState`) read? If yes, check whether that state variable is in the effect's dependency array. If it's read inside the effect but not in the dependency array, the effect will see an old ("stale") version of that state, leading to silent bugs.

- **What happens when voting results arrive for a player who has since disconnected?**
  `CARDS_REVEALED` contains votes for all users. But `gameState.players` might no longer contain the disconnected player. Does the results display crash when trying to look up their display name?

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Is the "fallback mock game data" actually necessary?**
  In `game/[gameId]/page.tsx`, there is a `useEffect` that runs when `!isConnected` and populates mock player and game data. Is this ever needed in production, or is it only for development/demo purposes? If it's development-only, is it clearly marked as such, or will it silently run in production if the WebSocket fails to connect?

- **Is the `VotingResults` type consistent between `useGameSocket.ts` and `game.types.ts`?**
  There are two separate `VotingResults` interfaces in the codebase — one in `useGameSocket.ts` and one in `frontend/src/types/game.types.ts`. Do they have the same fields? If not, which one does the game page actually use, and is it receiving the right shape from the server?

- **Is the `GameSettingsModal` saving settings optimistically or waiting for confirmation?**
  When the facilitator clicks "Save Changes", does the UI update immediately before the server confirms, or does it wait? What happens to the UI state if the WebSocket call silently fails?

---

### 📋 What to Deliver at the End of Phase 5

Same format: numbered findings + separate questions. No code changes yet.

---

---

# PHASE 6 — Frontend Components & Utility Files
### Files: `Timer.tsx`, `InviteModal.tsx`, `GameSettingsModal.tsx`, `VotingHistory.tsx`, `EditProfileModal.tsx`, `ProfileDropdown.tsx`, `ThemeContext.tsx`, `logger.ts`, `globals.css`

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Does `EditProfileModal` accept fields it should reject?**
  The backend rejects updates to `display_name` and `avatar_url`. But does the frontend even send these fields? If the modal has hidden or disabled fields that still get included in the PATCH body, the server will return an error that confuses the user.

- **Is there any sensitive data being stored in `localStorage`?**
  Search `ThemeContext.tsx` and all components for `localStorage.setItem`. Is any authentication-related data (tokens, user IDs, session info) stored in localStorage? JWT tokens in localStorage are vulnerable to XSS attacks — they should only be in httpOnly cookies.

---

### Investigation Checklist — QA Engineer Hat 🟡

- **In `Timer.tsx`: what happens if the server and client timers drift?**
  The timer display relies entirely on `remainingSeconds` from WebSocket events. But `TIMER_TICK` fires every second from the server. What if a packet is delayed by 2 seconds due to network lag? Does the displayed time jump? Does it skip a number or display the same number twice?

- **In `InviteModal.tsx`: what happens if the invite link API call fails?**
  A `useEffect` triggers the invite link creation as soon as the modal opens. What if the API fails (network error, not facilitator, server error)? Is the error displayed? Is the modal still closeable? Can the user try again?

- **In `VotingHistory.tsx`: what if there are 1000 voting rounds in history?**
  The component fetches all history and renders it all at once. Is there pagination? Lazy loading? If not, loading 1000 rounds of data will be slow and the DOM will be very large.

- **In `ThemeContext.tsx`: is there a flash of wrong theme on page load?**
  The initial state is hardcoded as `"dark"`. Then a `useEffect` runs and reads the stored theme. Between initial render and the effect running, the page may briefly show dark mode even if the user prefers light mode. Is this noticeable? Is there any mechanism to prevent it?

- **In `ProfileDropdown.tsx`: what happens if the spectator mode toggle API call fails?**
  The toggle optimistically updates local state, then makes an API call. If the API call fails, it reverts the local state. But what if the revert itself causes a re-render that confuses the user (the toggle visually flips, then flips back)?

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Is `logger.ts` adding the same Console transport twice?**
  Read `logger.ts` carefully. Is a Console transport added inside the `transports: [...]` array AND again conditionally at the bottom of the file? If yes, in development every log message prints twice.

- **Is there dead CSS in `globals.css`?**
  Look for CSS utility classes, animation keyframes, or custom properties that are defined but never referenced by any component. Specifically look at all `@utility` definitions — are they all actually used somewhere in the codebase?

- **Does `ThemeContext.tsx` have a `toggleTheme` function that could be simplified?**
  Read the context carefully. Is there both a `setTheme` and a `toggleTheme` function? Do they overlap? Could the memoization be causing stale closures?

---

### 📋 What to Deliver at the End of Phase 6

Same format: numbered findings + separate questions. No code changes yet.

---

---

# PHASE 7 — Configuration, Environment & Deployment Readiness
### Files: All `.env.*` files, `backend/src/server.ts`, `backend/src/middleware/rateLimiter.ts`, `next.config.js`, `backend/tsconfig.json`, `frontend/tsconfig.json`

---

### Investigation Checklist — Security Researcher Hat 🔴

- **Are there real secrets committed to the repository?**
  Look at ALL files in the repository, not just env files. Check: `backend/certs/`, any `.pem` files, any hardcoded API keys or passwords in source files. A git repository is permanent — even if secrets are later removed from a file, they remain in git history.

- **Are all sensitive environment variables actually marked as secrets?**
  In the `.env.development` and `.env.production` files, identify every value that contains a real secret (OAuth client secret, JWT secret, database password). Are any of these committed with real values, or are they all placeholder strings like `REPLACE_WITH_...`?

- **Does the CORS configuration allow the right origins?**
  In `server.ts`, how is the `CORS_ORIGIN` environment variable consumed? What happens if it contains a comma-separated list? Does the CORS library receive an array of origins or a single string? What would a single comma-separated string mean to the CORS library?

- **Does the `next.config.js` rewrite expose the backend unnecessarily?**
  The Next.js rewrite proxies `/api/*` to the backend. Does this mean the backend's internal endpoints (like `/health`) are also exposed through the frontend domain? Is this intended?

---

### Investigation Checklist — QA Engineer Hat 🟡

- **What happens if Redis is down when the server starts?**
  In `server.ts`, `connectRedis()` is called and if it fails, the process exits with `process.exit(1)`. But what if Redis connects successfully at startup and then goes down 5 minutes later during normal operation? What happens to requests that try to read/write sessions?

- **What happens if the database is down when the server starts?**
  Unlike Redis, the database connection pool (`db`) is created but not explicitly tested at startup. What is the first request that would fail, and what error would the user see?

- **Are there any `process.exit()` calls that could bring down the entire server on a single bad request?**
  Search `server.ts` and all service files for `process.exit`. List every occurrence. A server should almost never call `process.exit` outside of graceful shutdown handlers.

- **Is HTTPS configured correctly for both frontend and backend?**
  Compare the `LOCAL_HTTPS` setting and certificate paths in the backend with the `--experimental-https` flag in the frontend `dev` script. Do the certificates match? Are there mismatches between `https://localhost:3000` and `https://localhost:3002` that could cause CORS issues?

---

### Investigation Checklist — Code Reviewer Hat 🔵

- **Are there environment variables referenced in code that are NOT documented in `.env.example`?**
  Read through all source files and extract every `process.env.VARIABLE_NAME` reference. Then check: is every one of these variables listed in `.env.example`? Missing documentation means the next developer won't know what to set.

- **Is there any difference between the backend's `tsconfig.json` and what it should be for production builds?**
  Note that `noUnusedLocals` and `noUnusedParameters` are set to `true`. This means the TypeScript compiler WILL fail on unused variables. But the `as any` casts bypass type checking entirely. Is this an inconsistent level of strictness?

- **Is `selfsigned` a production dependency or a dev dependency?**
  In `package.json`, check whether `selfsigned` is in `dependencies` or `devDependencies`. HTTPS certificate generation for localhost should only happen in development. If `selfsigned` is in `dependencies`, it gets bundled into production builds unnecessarily.

---

### 📋 What to Deliver at the End of Phase 7

Same format. No code changes yet.

---

---

# PHASE 8 — Implementation
### This phase is different. There is NO checklist here.

At this point, you have a complete picture of all issues in the codebase. Now we implement fixes.

**Process:**
1. Compile ALL findings from Phases 1-7 into one master list, sorted by severity (Critical → High → Medium → Low).
2. Present the full list to me.
3. I will mark which ones to fix in this session.
4. For each fix I approve, implement it one at a time, explain what you changed in plain English, and wait for me to say "next" before proceeding to the next fix.

**While implementing each fix:**
- If fixing the bug requires a decision (e.g., "should the column be renamed in SQL or in code?"), ask before touching anything.
- If a fix in one file has ripple effects in other files, list ALL the files that need to change before changing any of them.
- If a fix could break existing behavior (even bad behavior that something else depends on), call this out explicitly.

**Format for each fix:**
```
FIX [N]: Short title
Files being changed: ...
What I'm doing: (plain English, 2-3 sentences max)
What to watch out for after this change: ...
---
[code changes]
---
Done. Ready for "next" when you are.
```

---

---

## 🏁 Quick-Start Instructions

Copy this entire prompt into your agentic editor. Then type:

> **"Start Phase 1. Read all listed files completely. Form your findings using all three investigator mindsets. Do not make any changes. Present your numbered findings and questions at the end."**

When Phase 1 is done and you've answered the questions:

> **"Proceed to Phase 2."**

And so on until Phase 7. Then:

> **"Compile the master findings list from all phases and present it sorted by severity. Do not make any changes yet."**

Then review the list and approve fixes for Phase 8.
