# Guest Mode Implementation

## Overview

This document describes the implementation of guest mode functionality for the Planning Poker application. Guest mode allows users to create and join games without IBM W3ID authentication, enabling quick testing and broader accessibility while maintaining all core game features.

## Features

### Core Capabilities

- **No Authentication Required**: Users can create and join games without IBM W3ID login
- **Automatic Guest Identification**: Unique guest IDs are generated automatically
- **Random Display Names**: Fun, memorable names are auto-generated (e.g., "Happy Panda 123")
- **Custom Display Names**: Users can optionally provide their own display name
- **Full Game Functionality**: Guest users have access to all game features including:
  - Creating new games
  - Joining existing games
  - Voting on issues
  - Real-time synchronization
  - Timer functionality
  - Game settings management
- **Session Persistence**: Guest sessions last for 7 days
- **Seamless Integration**: Guest and authenticated users can play together in the same game

## Architecture

### Backend Components

#### 1. Guest Service (`backend/src/services/guestService.ts`)

Handles guest user creation and management:

- `generateGuestId()`: Creates unique guest identifiers with `guest_` prefix
- `generateGuestDisplayName()`: Generates random, friendly display names
- `createGuestUser()`: Creates guest user records in the database
- `createGuestSession()`: Creates complete guest session with JWT tokens
- `storeGuestSession()`: Stores guest session in Redis (7-day TTL)
- `isGuestUser()`: Checks if a user ID belongs to a guest
- `findGuestUserById()`: Retrieves guest user from database
- `cleanupExpiredGuestUsers()`: Removes old guest users (can be run periodically)

#### 2. Authentication Middleware Updates (`backend/src/middleware/auth.ts`)

Enhanced to support both authenticated and guest users:

- Checks if user ID is a guest using `isGuestUser()`
- Routes to appropriate user service (guest or regular)
- Maintains backward compatibility with existing authentication

#### 3. Guest Routes (`backend/src/routes/guest.routes.ts`)

New API endpoints for guest functionality:

- `POST /api/v1/guest/create-session`: Create a new guest session
- `POST /api/v1/guest/games`: Create a game as guest (auto-creates session if needed)
- `POST /api/v1/guest/join/:gameId`: Join a game as guest
- `GET /api/v1/guest/check`: Check if current user is a guest

#### 4. Type Definitions (`backend/src/types/auth.types.ts`)

New types for guest functionality:

```typescript
interface UserSession {
  // ... existing fields
  isGuest?: boolean; // Flag to identify guest users
}

interface GuestUserPayload {
  displayName: string;
}

interface GuestSession {
  guestId: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
}

interface GuestTokenPayload {
  guestId: string;
  displayName: string;
  isGuest: true;
}
```

### Frontend Components

#### 1. Guest Mode Modal (`frontend/src/components/GuestModeModal.tsx`)

React component for guest user interaction:

- **Create Mode**: Allows creating a new game as guest
- **Join Mode**: Allows joining an existing game as guest
- **Display Name Input**: Optional custom name (auto-generated if empty)
- **Game Name Input**: Required for game creation
- **Error Handling**: Clear error messages for failed operations
- **Loading States**: Disabled buttons during API calls

#### 2. Homepage Integration (`frontend/src/app/page.tsx`)

Updated to include guest mode access:

- "Try as Guest" button added to hero section
- Opens guest mode modal for quick access
- Maintains existing authenticated user flow

## Database Schema

Guest users are stored in the existing `users` table with:

- `id`: VARCHAR(255) with `guest_` prefix (e.g., `guest_550e8400-e29b-41d4-a716-446655440000`)
- `display_name`: Auto-generated or user-provided name
- `avatar_url`: Default guest avatar path
- `spectator_mode`: FALSE by default
- `theme_preference`: 'dark' by default
- `created_at`: Timestamp for cleanup purposes

No schema changes required - guest users integrate seamlessly with existing structure.

## Session Management

### Redis Storage

Guest sessions are stored in Redis with:

- **Namespace**: `guest:session:{guestId}`
- **TTL**: 7 days (604,800 seconds)
- **Data Structure**:
  ```json
  {
    "guestId": "guest_...",
    "displayName": "Happy Panda 123",
    "createdAt": "2026-04-27T07:00:00.000Z",
    "expiresAt": "2026-05-04T07:00:00.000Z",
    "refreshToken": "..."
  }
  ```

### JWT Tokens

Guest users receive standard JWT tokens:

- **Access Token**: 24-hour expiration
- **Refresh Token**: 7-day expiration
- **Payload**: Includes `userId` (guest ID) and `displayName`
- **Storage**: HttpOnly cookies (same as authenticated users)

## API Endpoints

### Guest Session Creation

```http
POST /api/v1/guest/create-session
Content-Type: application/json

{
  "displayName": "My Custom Name" // Optional
}

Response:
{
  "success": true,
  "user": {
    "userId": "guest_...",
    "displayName": "Happy Panda 123",
    "isGuest": true,
    ...
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Create Game as Guest

```http
POST /api/v1/guest/games
Content-Type: application/json

{
  "name": "Sprint 24 Planning",
  "displayName": "My Name", // Optional
  "deck_id": "...", // Optional
  ...
}

Response:
{
  "success": true,
  "game": { ... },
  "isNewGuest": true // Indicates if a new guest session was created
}
```

### Join Game as Guest

```http
POST /api/v1/guest/join/:gameId
Content-Type: application/json

{
  "displayName": "My Name" // Optional
}

Response:
{
  "success": true,
  "game": { ... },
  "isNewGuest": true,
  "userId": "guest_..."
}
```

### Check Guest Status

```http
GET /api/v1/guest/check

Response:
{
  "success": true,
  "isGuest": true,
  "user": { ... } // or null if not authenticated
}
```

## Security Considerations

### Guest User Limitations

While guest users have full game functionality, consider these security aspects:

1. **No Persistent Identity**: Guest sessions expire after 7 days
2. **No Profile Management**: Guests cannot update profile settings
3. **Limited History**: Guest game history is tied to session lifetime
4. **No Account Recovery**: Lost sessions cannot be recovered

### Data Cleanup

Implement periodic cleanup of expired guest users:

```typescript
// Run daily via cron job or scheduled task
import { cleanupExpiredGuestUsers } from "./services/guestService";

async function dailyCleanup() {
  const deletedCount = await cleanupExpiredGuestUsers();
  console.log(`Cleaned up ${deletedCount} expired guest users`);
}
```

### Rate Limiting

Guest endpoints use the same rate limiting as authenticated endpoints:

- `authRateLimiter`: Standard authentication rate limits
- `gameCreationRateLimiter`: Prevents game creation spam

## WebSocket Integration

Guest users connect to WebSocket with the same authentication flow:

1. JWT token is extracted from cookies or auth header
2. Token is verified (works for both guest and regular users)
3. User ID is attached to socket connection
4. Guest users participate in real-time game events identically to authenticated users

## User Experience Flow

### Creating a Game as Guest

1. User clicks "Try as Guest" on homepage
2. Guest mode modal opens in "create" mode
3. User optionally enters display name and game name
4. System creates guest session (if needed) and game
5. User is redirected to game page with active session

### Joining a Game as Guest

1. User receives game invitation link
2. If not authenticated, guest mode modal appears
3. User optionally enters display name
4. System creates guest session and adds user to game
5. User joins game with full functionality

### Session Expiration

1. After 7 days, guest session expires
2. User must create new guest session to continue
3. Previous game history is no longer accessible
4. User can create new guest session anytime

## Testing Checklist

- [ ] Guest user creation with auto-generated name
- [ ] Guest user creation with custom name
- [ ] Game creation as guest
- [ ] Joining existing game as guest
- [ ] Guest and authenticated users in same game
- [ ] Real-time voting with guest users
- [ ] Timer functionality for guest users
- [ ] Issue management by guest users
- [ ] Session persistence across page refreshes
- [ ] Session expiration after 7 days
- [ ] Guest user cleanup functionality
- [ ] WebSocket connection for guest users
- [ ] Rate limiting for guest endpoints
- [ ] Error handling for invalid guest sessions

## Future Enhancements

### Potential Improvements

1. **Guest to Authenticated Conversion**: Allow guests to claim their session by signing in
2. **Extended Sessions**: Option to extend guest session before expiration
3. **Guest Analytics**: Track guest user engagement and conversion rates
4. **Custom Guest Avatars**: Allow guests to select from predefined avatars
5. **Guest Invitations**: Special invitation links that auto-create guest sessions
6. **Guest Limitations**: Optionally restrict certain features for guest users
7. **Guest Badges**: Visual indicators to distinguish guest users in games

### Migration Path

If a guest user wants to preserve their data:

1. Sign in with IBM W3ID
2. System detects existing guest session
3. Offer to migrate guest game history to authenticated account
4. Transfer game participations and history
5. Delete guest user record

## Troubleshooting

### Common Issues

**Issue**: Guest session not persisting

- **Solution**: Check Redis connection and TTL settings
- **Verify**: Session is stored with correct namespace

**Issue**: Guest users can't join games

- **Solution**: Verify authentication middleware supports guest users
- **Check**: `isGuestUser()` function is working correctly

**Issue**: WebSocket connection fails for guests

- **Solution**: Ensure JWT token verification works for guest IDs
- **Verify**: Socket authentication middleware handles guest tokens

**Issue**: Guest users appear as "User not found"

- **Solution**: Check that `findGuestUserById()` is called for guest IDs
- **Verify**: Authentication middleware routes to correct user service

## Conclusion

The guest mode implementation provides a seamless way for users to experience Planning Poker without authentication barriers. It maintains security through session management, integrates cleanly with existing architecture, and provides a path for future enhancements while keeping the codebase maintainable.

---

**Implementation Date**: April 27, 2026  
**Version**: 1.0.0  
**Status**: Complete

Made with Bob
