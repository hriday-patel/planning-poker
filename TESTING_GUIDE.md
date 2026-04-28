# Testing Guide - Planning Poker with Real Players

## ✅ What I Fixed

1. **WebSocket Authentication** - Updated [`backend/src/server.ts`](backend/src/server.ts) to support guest users
2. **Created Cleanup Script** - [`database/clear_seed_data.sql`](database/clear_seed_data.sql) to remove placeholder data

## 🔧 Next Steps to Complete Setup

### Step 1: Clear Seed Data (Remove Jane Smith & John Doe)

Run this command in your terminal:

```bash
psql -U postgres -d planning_poker_dev -f database/clear_seed_data.sql
```

**If psql is not in your PATH**, find PostgreSQL and run:

```bash
/Applications/Postgres.app/Contents/Versions/latest/bin/psql -U postgres -d planning_poker_dev -f database/clear_seed_data.sql
```

Or use a PostgreSQL GUI tool (pgAdmin, Postico, etc.) and run the SQL from the file.

### Step 2: Restart Your Servers

Stop the current servers (Ctrl+C in terminal) and restart:

```bash
cd /Users/hriday/Desktop/planitpokertool
npm run dev
```

Wait for both servers to start:

- ✅ Backend: `http://localhost:3002`
- ✅ Frontend: `http://localhost:3000`

### Step 3: Test with Real Players

#### A. Create a New Game

1. Open `http://localhost:3000` in your browser
2. Click "Create Game as Guest"
3. Enter display name: **"Meow"**
4. Enter game name: **"S166.23"**
5. Click "Create Game"

#### B. Verify WebSocket Connection

Open browser console (F12 → Console tab) and look for:

```
[GameSocket] WebSocket connected: <socket-id>
[GameSocket] Game state synced: <state>
```

✅ **If you see these messages**: WebSocket is working!
❌ **If you see errors**: Check the troubleshooting section below

#### C. Invite Other Players

**Option 1: Same Computer (Multiple Browser Windows)**

1. Copy the game URL from address bar
2. Open in **Incognito/Private window** → Join as different player
3. Open in **Different browser** (Safari, Firefox) → Join as third player

**Option 2: Other Devices on Same Network**

1. Find your Mac's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Share URL with your IP: `http://YOUR_IP:3000/game/[gameId]`
3. Other devices can join from phones/tablets/computers

### Step 4: Test Game Functionality

✅ **Test Checklist:**

- [ ] Game shows correct name "S166.23" (not "Sprint 23 Planning")
- [ ] Players show real names (not Jane Smith/John Doe)
- [ ] Multiple players can join
- [ ] Players can select cards
- [ ] Cards show "has voted" indicator
- [ ] Facilitator can click "Reveal Cards"
- [ ] Cards reveal without errors
- [ ] Can start new round
- [ ] Timer works (if enabled)

## 🐛 Troubleshooting

### Issue: Still seeing "Sprint 23 Planning"

**Cause**: WebSocket not connected, using fallback mock data
**Solution**: Check browser console for WebSocket errors

### Issue: WebSocket connection failed

**Cause**: Authentication error or server not running
**Solution**:

1. Verify backend is running on port 3002
2. Check browser console for specific error
3. Verify you have a valid guest token (created when you create game)

### Issue: "Cannot submit vote: socket or round not ready"

**Cause**: WebSocket not connected OR no active voting round
**Solution**:

1. Verify WebSocket is connected (check console)
2. Make sure you're in a game with an active round
3. Try refreshing the page

### Issue: Players can't join

**Cause**: Invite link expired or invalid
**Solution**: Generate a new invite link from the game page

### Issue: Still seeing Jane Smith/John Doe

**Cause**: Seed data not cleared OR old game loaded
**Solution**:

1. Run the clear_seed_data.sql script
2. Create a NEW game (don't use old game IDs)
3. Refresh browser

## 📊 Verify Everything is Working

### Check Backend Logs

You should see:

```
[info]: WebSocket authenticated: guest_xxxxx (guest: true)
[info]: Player guest_xxxxx joined room [gameId]
[info]: Game state synced to socket [socketId]
```

### Check Frontend Console

You should see:

```
[GameSocket] WebSocket connected: [socketId]
[GameSocket] Game state synced: {game: {...}, players: [...]}
[GameSocket] Player joined: Meow
```

### Check Database

Verify your game exists:

```bash
psql -U postgres -d planning_poker_dev -c "SELECT id, name, creator_id FROM games WHERE name = 'S166.23';"
```

## 🎮 Testing Scenarios

### Scenario 1: Basic Voting

1. Player 1 (Meow) creates game
2. Player 2 joins via invite link
3. Both select cards
4. Facilitator reveals cards
5. Verify results show correctly

### Scenario 2: Multiple Rounds

1. Complete a voting round
2. Click "Start New Round"
3. Verify cards reset
4. Vote again
5. Check voting history

### Scenario 3: Player Join/Leave

1. Player joins mid-game
2. Verify they appear in player list
3. Player closes browser
4. Verify they're marked offline (may take a moment)

## 🚀 Next Features to Test

Once basic functionality works:

- [ ] Add issues to vote on
- [ ] Use timer feature
- [ ] Change game settings
- [ ] Transfer facilitator role
- [ ] View voting history
- [ ] Test spectator mode

## 📝 Notes

- Guest sessions last 7 days
- Game data persists in PostgreSQL
- WebSocket state is in-memory (lost on server restart)
- Each browser window/tab needs separate guest account

## ✨ Success Criteria

You'll know everything is working when:

1. ✅ Game shows "S166.23" as name
2. ✅ Players show real names you entered
3. ✅ Multiple players can join and vote
4. ✅ No "socket or round not ready" errors
5. ✅ Cards reveal successfully
6. ✅ Browser console shows WebSocket connected

---

**Need Help?** Check the browser console and backend logs for specific error messages.
