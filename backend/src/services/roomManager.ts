/**
 * Room Manager Service
 *
 * Manages WebSocket rooms, player presence, and in-memory game state
 * for real-time Planning Poker sessions.
 */

import { RoomState } from "../types/websocket.types";
import { logger } from "../utils/logger";
import { getGameDetails } from "./gameService";
import { getGameIssues } from "./issueService";
import { findUserById } from "./userService";

/**
 * In-memory storage for active game rooms
 */
const rooms = new Map<string, RoomState>();

/**
 * Get or create a room for a game
 */
export const getRoom = (gameId: string): RoomState => {
  if (!rooms.has(gameId)) {
    rooms.set(gameId, {
      game_id: gameId,
      players: new Map(),
      current_round: null,
      timer: null,
    });
    logger.info(`Room created: ${gameId}`);
  }
  return rooms.get(gameId)!;
};

/**
 * Add a player to a room
 */
export const addPlayerToRoom = async (
  gameId: string,
  socketId: string,
  userId: string,
): Promise<void> => {
  const room = getRoom(gameId);

  // Fetch user details
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Fetch game details to check if user is facilitator
  const game = await getGameDetails(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  const isFacilitator = game.facilitator_id === userId;

  // Add or update player in room
  room.players.set(userId, {
    socket_id: socketId,
    user_id: userId,
    display_name: user.display_name,
    avatar_url: user.avatar_url || null,
    is_facilitator: isFacilitator,
    is_spectator: user.spectator_mode,
    joined_at: new Date(),
  });

  logger.info(`Player ${userId} joined room ${gameId}`);
};

/**
 * Remove a player from a room
 */
export const removePlayerFromRoom = (gameId: string, userId: string): void => {
  const room = rooms.get(gameId);
  if (!room) return;

  room.players.delete(userId);
  logger.info(`Player ${userId} left room ${gameId}`);

  // Clean up empty rooms
  if (room.players.size === 0) {
    // Stop timer if running
    if (room.timer?.interval_id) {
      clearInterval(room.timer.interval_id);
    }
    rooms.delete(gameId);
    logger.info(`Room ${gameId} deleted (empty)`);
  }
};

/**
 * Get all players in a room
 */
export const getRoomPlayers = (gameId: string) => {
  const room = rooms.get(gameId);
  if (!room) return [];

  return Array.from(room.players.values());
};

/**
 * Get a specific player in a room
 */
export const getRoomPlayer = (gameId: string, userId: string) => {
  const room = rooms.get(gameId);
  if (!room) return null;

  return room.players.get(userId) || null;
};

/**
 * Update player info in room
 */
export const updatePlayerInRoom = (
  gameId: string,
  userId: string,
  updates: {
    display_name?: string;
    avatar_url?: string | null;
    is_spectator?: boolean;
  },
): void => {
  const room = rooms.get(gameId);
  if (!room) return;

  const player = room.players.get(userId);
  if (!player) return;

  if (updates.display_name !== undefined) {
    player.display_name = updates.display_name;
  }
  if (updates.avatar_url !== undefined) {
    player.avatar_url = updates.avatar_url;
  }
  if (updates.is_spectator !== undefined) {
    player.is_spectator = updates.is_spectator;
  }

  logger.info(`Player ${userId} updated in room ${gameId}`);
};

/**
 * Start a new voting round
 */
export const startVotingRound = (
  gameId: string,
  roundId: string,
  issueId: string | null,
): void => {
  const room = getRoom(gameId);

  room.current_round = {
    id: roundId,
    issue_id: issueId,
    votes: new Map(),
    is_revealed: false,
    started_at: new Date(),
  };

  logger.info(`Voting round ${roundId} started in room ${gameId}`);
};

/**
 * Submit a vote in the current round
 */
export const submitVote = (
  gameId: string,
  userId: string,
  cardValue: string,
): void => {
  const room = rooms.get(gameId);
  if (!room || !room.current_round) {
    throw new Error("No active voting round");
  }

  room.current_round.votes.set(userId, cardValue);
  logger.info(`Vote submitted by ${userId} in room ${gameId}`);
};

/**
 * Reveal cards in the current round
 */
export const revealCards = (gameId: string): Map<string, string> => {
  const room = rooms.get(gameId);
  if (!room || !room.current_round) {
    throw new Error("No active voting round");
  }

  room.current_round.is_revealed = true;
  logger.info(`Cards revealed in room ${gameId}`);

  return room.current_round.votes;
};

/**
 * Check if all non-spectator players have voted
 */
export const haveAllPlayersVoted = (gameId: string): boolean => {
  const room = rooms.get(gameId);
  if (!room || !room.current_round) return false;

  const nonSpectatorPlayers = Array.from(room.players.values()).filter(
    (p) => !p.is_spectator,
  );

  if (nonSpectatorPlayers.length === 0) return false;

  const votedCount = room.current_round.votes.size;
  return votedCount === nonSpectatorPlayers.length;
};

/**
 * Calculate voting results
 */
export const calculateVotingResults = (gameId: string) => {
  const room = rooms.get(gameId);
  if (!room || !room.current_round) {
    throw new Error("No active voting round");
  }

  const votes = Array.from(room.current_round.votes.entries());
  const numericVotes: number[] = [];
  const voteCounts: { [key: string]: number } = {};

  // Count votes and extract numeric values
  votes.forEach(([_userId, value]) => {
    voteCounts[value] = (voteCounts[value] || 0) + 1;

    // Try to parse as number for average calculation
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      numericVotes.push(numValue);
    }
  });

  // Calculate average (only for numeric votes)
  let average: number | null = null;
  if (numericVotes.length > 0) {
    const sum = numericVotes.reduce((a, b) => a + b, 0);
    average = Math.round((sum / numericVotes.length) * 10) / 10; // Round to 1 decimal
  }

  // Calculate agreement (percentage of players who voted the same)
  let agreement = 0;
  if (votes.length > 0) {
    const maxCount = Math.max(...Object.values(voteCounts));
    agreement = Math.round((maxCount / votes.length) * 100);
  }

  return {
    votes: votes.map(([user_id, card_value]) => ({ user_id, card_value })),
    average,
    agreement,
  };
};

/**
 * Clear the current round
 */
export const clearCurrentRound = (gameId: string): void => {
  const room = rooms.get(gameId);
  if (!room) return;

  room.current_round = null;
  logger.info(`Current round cleared in room ${gameId}`);
};

/**
 * Start a timer in a room
 */
export const startTimer = (
  gameId: string,
  durationSeconds: number,
  onTick: (remaining: number) => void,
  onEnd: () => void,
): void => {
  const room = getRoom(gameId);

  // Stop existing timer if any
  if (room.timer?.interval_id) {
    clearInterval(room.timer.interval_id);
  }

  room.timer = {
    duration_seconds: durationSeconds,
    remaining_seconds: durationSeconds,
    interval_id: null,
    is_running: true,
  };

  // Start countdown
  const intervalId = setInterval(() => {
    if (!room.timer) return;

    room.timer.remaining_seconds--;
    onTick(room.timer.remaining_seconds);

    if (room.timer.remaining_seconds <= 0) {
      clearInterval(intervalId);
      room.timer.is_running = false;
      onEnd();
    }
  }, 1000);

  room.timer.interval_id = intervalId;
  logger.info(`Timer started in room ${gameId}: ${durationSeconds}s`);
};

/**
 * Pause a timer in a room
 */
export const pauseTimer = (gameId: string): void => {
  const room = rooms.get(gameId);
  if (!room || !room.timer) return;

  if (room.timer.interval_id) {
    clearInterval(room.timer.interval_id);
    room.timer.interval_id = null;
  }
  room.timer.is_running = false;

  logger.info(`Timer paused in room ${gameId}`);
};

/**
 * Stop a timer in a room
 */
export const stopTimer = (gameId: string): void => {
  const room = rooms.get(gameId);
  if (!room || !room.timer) return;

  if (room.timer.interval_id) {
    clearInterval(room.timer.interval_id);
  }
  room.timer = null;

  logger.info(`Timer stopped in room ${gameId}`);
};

/**
 * Get current game state for a room
 */
export const getRoomState = async (gameId: string) => {
  const room = getRoom(gameId);

  // Fetch game details
  const game = await getGameDetails(gameId);
  if (!game) {
    throw new Error("Game not found");
  }

  // Fetch issues
  const issues = await getGameIssues(gameId);

  // Build player list
  const players = Array.from(room.players.values()).map((p) => ({
    id: p.user_id,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    is_facilitator: p.is_facilitator,
    is_spectator: p.is_spectator,
    is_online: true,
  }));

  // Build current round info
  let currentRound = null;
  if (room.current_round) {
    const votes = Array.from(room.players.keys()).map((userId) => ({
      user_id: userId,
      has_voted: room.current_round!.votes.has(userId),
      card_value: room.current_round!.is_revealed
        ? room.current_round!.votes.get(userId) || null
        : null,
    }));

    currentRound = {
      id: room.current_round.id,
      issue_id: room.current_round.issue_id,
      votes,
      is_revealed: room.current_round.is_revealed,
    };
  }

  return {
    game,
    players,
    issues,
    current_round: currentRound,
  };
};

/**
 * Get all active rooms (for debugging)
 */
export const getAllRooms = () => {
  return Array.from(rooms.keys());
};

/**
 * Get room statistics
 */
export const getRoomStats = (gameId: string) => {
  const room = rooms.get(gameId);
  if (!room) return null;

  return {
    game_id: gameId,
    player_count: room.players.size,
    has_active_round: room.current_round !== null,
    is_revealed: room.current_round?.is_revealed || false,
    vote_count: room.current_round?.votes.size || 0,
    has_timer: room.timer !== null,
    timer_running: room.timer?.is_running || false,
  };
};

// Made with Bob
