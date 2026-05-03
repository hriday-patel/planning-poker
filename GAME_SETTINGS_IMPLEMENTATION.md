# Game Settings Modal Implementation

## Overview

Implemented the in-game Game Settings modal as specified in Section 5.4 of the PRD. This feature allows the facilitator to modify game settings and transfer the facilitator role to another player during an active game session.

## Backend Implementation

### 1. Existing API Endpoint

**Endpoint**: `PATCH /api/v1/games/:gameId` (already implemented)

**Location**: `backend/src/routes/game.routes.ts` (lines 160-247)

**Authentication**: Required (JWT token)

**Authorization**: Only the facilitator can update game settings

**Request Body**:

```json
{
  "name": "string (optional)",
  "facilitator_id": "string (optional)",
  "who_can_reveal": "all_players | only_facilitator (optional)",
  "who_can_manage_issues": "all_players | only_facilitator (optional)",
  "who_can_toggle_spectator": "all_players | only_facilitator (optional)",
  "auto_reveal": "boolean (optional)",
  "show_average": "boolean (optional)",
  "show_countdown": "boolean (optional)",
  "status": "active | archived (optional)"
}
```

**Response**:

```json
{
  "success": true,
  "game": {
    // Full game details with updated settings
  }
}
```

**Error Responses**:

- 401: Not authenticated
- 403: Only facilitator can update settings / New facilitator must be participant
- 404: Game not found
- 400: Validation errors

### 2. WebSocket Event Handler

**Event**: `UPDATE_GAME_SETTINGS` (already implemented)

**Location**: `backend/src/websocket/handlers.ts` (line 276)

**Functionality**:

- Updates game settings in database
- Broadcasts `GAME_SETTINGS_UPDATED` event to all players in the room
- Real-time synchronization ensures all players see updated settings immediately

### 3. Transfer Facilitator Event

**Event**: `TRANSFER_FACILITATOR` (already implemented)

**Location**: `backend/src/websocket/handlers.ts`

**Functionality**:

- Validates new facilitator is a game participant
- Updates facilitator_id in database
- Broadcasts `FACILITATOR_CHANGED` event to all players
- Updates player permissions in real-time

## Frontend Implementation

### 1. GameSettingsModal Component

**File**: `frontend/src/components/GameSettingsModal.tsx` (378 lines)

**Props**:

```typescript
interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  players: Player[];
  currentUserId: string | null;
  onUpdateSettings: (settings: any) => void;
  onTransferFacilitator: (newFacilitatorId: string) => void;
}
```

**Features**:

1. **Facilitator Selection**
   - Dropdown showing all players in the game
   - Current facilitator marked with "(Current)"
   - Transfer role to any participant

2. **Permission Settings**
   - Who can reveal cards (All players / Only facilitator)
   - Who can manage issues (All players / Only facilitator)
   - Who can choose spectator mode (All players / Only facilitator)

3. **Toggle Settings**
   - Auto-reveal cards
   - Show average in results
   - Show countdown animation

4. **Access Control**
   - Only facilitator can modify settings
   - Non-facilitators see read-only view with warning message
   - Save button disabled when no changes made

5. **UI/UX Features**
   - Change detection (Save button only enabled when changes exist)
   - Loading state during save operation
   - Automatic modal close after successful save
   - Responsive layout with scrollable content
   - Clear descriptions for each setting

### 2. Game Room Integration

**File**: `frontend/src/app/game/[gameId]/page.tsx`

**Changes**:

1. Imported `GameSettingsModal` component
2. Added `updateGameSettings` and `transferFacilitator` from `useGameSocket` hook
3. Replaced placeholder settings modal with full `GameSettingsModal` component
4. Passed all required props including game state, players, and callback functions

**User Flow**:

1. User clicks game name in top-left navbar
2. Dropdown appears with "Game Settings" and "Voting History" options
3. User clicks "Game Settings"
4. Modal opens showing current settings
5. Facilitator can modify settings and/or transfer facilitator role
6. User clicks "Save Changes"
7. Settings updated via WebSocket
8. All players receive real-time update
9. Modal closes automatically

### 3. WebSocket Integration

**Hook**: `frontend/src/hooks/useGameSocket.ts`

**Methods Used**:

- `updateGameSettings(settings)` - Emits UPDATE_GAME_SETTINGS event
- `transferFacilitator(newFacilitatorId)` - Emits TRANSFER_FACILITATOR event

**Event Listeners**:

- `GAME_SETTINGS_UPDATED` - Updates local game state with new settings
- `FACILITATOR_CHANGED` - Updates facilitator information in player list

## Technical Details

### State Management

- Local state tracks current form values
- Initialized from game props when modal opens
- Change detection compares current values with original game settings
- Optimistic UI updates before server confirmation

### Validation

- Backend validates facilitator permissions
- Backend ensures new facilitator is a game participant
- Frontend disables controls for non-facilitators
- Frontend validates changes before enabling save button

### Real-time Synchronization

- Settings changes broadcast to all players via WebSocket
- All players see updated settings immediately
- No page refresh required
- Consistent state across all connected clients

### Accessibility

- Keyboard navigation support
- Semantic HTML with proper labels
- Disabled state styling for non-facilitators
- Clear visual feedback for interactive elements

### Responsive Design

- Modal adapts to screen size (max-w-2xl)
- Scrollable content area (max-h-90vh)
- Touch-friendly controls
- Proper spacing and layout on mobile

## Settings Available

### Permission Settings

1. **Who can reveal cards**
   - All players: Any player can click "Reveal cards" button
   - Only facilitator: Only facilitator can reveal cards

2. **Who can manage issues**
   - All players: Any player can add, edit, delete issues
   - Only facilitator: Only facilitator can manage issues

3. **Who can choose spectator mode**
   - All players: Any player can switch themself between voter and spectator
   - Only facilitator: Only facilitator can change player voting roles

### Feature Toggles

1. **Auto-reveal cards**
   - When ON: Cards automatically reveal after all players vote
   - When OFF: Manual reveal required

2. **Show average in results**
   - When ON: Average value displayed in voting results
   - When OFF: Average hidden

3. **Show countdown animation**
   - When ON: 3-2-1 countdown shown before revealing cards
   - When OFF: Cards reveal immediately

### Facilitator Transfer

- Dropdown lists all active players
- Current facilitator marked
- Transfer takes effect immediately
- New facilitator gains all facilitator permissions

## Error Handling

### Frontend

- Validates user is facilitator before allowing edits
- Shows warning message for non-facilitators
- Disables save button when no changes
- Loading state prevents double-submission

### Backend

- Returns 403 if non-facilitator attempts update
- Validates new facilitator is participant
- Returns specific error messages
- Logs all errors for debugging

## Testing Recommendations

1. **Facilitator Actions**
   - Test all setting changes as facilitator
   - Test transferring facilitator role
   - Test multiple setting changes at once
   - Verify real-time updates for other players

2. **Non-Facilitator View**
   - Test modal opens in read-only mode
   - Verify controls are disabled
   - Confirm warning message displays

3. **Permission Changes**
   - Test "who can reveal" setting
   - Test "who can manage issues" setting
   - Verify permissions enforced immediately

4. **Toggle Settings**
   - Test each toggle independently
   - Test multiple toggles together
   - Verify behavior changes in game

5. **Facilitator Transfer**
   - Transfer to different player
   - Verify old facilitator loses permissions
   - Verify new facilitator gains permissions
   - Test with multiple players

6. **Edge Cases**
   - Test with only 1 player (facilitator)
   - Test rapid setting changes
   - Test closing modal without saving
   - Test network errors during save

## Compliance with PRD

✅ Section 5.4 - Game Settings (in-game modal)

- Accessible from game name dropdown → "Game settings"
- Same fields as creation advanced settings
- "Game facilitator" dropdown to transfer role
- Only facilitator can modify settings

✅ Section 10 - Real-time Events (WebSocket)

- UPDATE_GAME_SETTINGS event implemented
- GAME_SETTINGS_UPDATED broadcast to all players
- TRANSFER_FACILITATOR event implemented
- FACILITATOR_CHANGED broadcast to all players

✅ Section 11 - REST API Endpoints

- PATCH /games/:gameId endpoint implemented
- Updates game settings
- Validates facilitator permissions

✅ Section 16 - Build Sequence

- Step 13 completed as specified
- Ready to proceed to Step 14 (Landing page)

## Files Modified

### Frontend

- `frontend/src/components/GameSettingsModal.tsx` - New component (378 lines)
- `frontend/src/app/game/[gameId]/page.tsx` - Integrated modal

### Backend

- No changes required (all functionality already implemented)

## Status

✅ **COMPLETE** - All requirements for Step 13 implemented and integrated
