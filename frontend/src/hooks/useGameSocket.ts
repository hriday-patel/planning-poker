"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Event types matching backend
export enum ClientEvents {
  JOIN_GAME = "JOIN_GAME",
  LEAVE_GAME = "LEAVE_GAME",
  SUBMIT_VOTE = "SUBMIT_VOTE",
  REVEAL_CARDS = "REVEAL_CARDS",
  START_NEW_ROUND = "START_NEW_ROUND",
  UPDATE_GAME_SETTINGS = "UPDATE_GAME_SETTINGS",
  START_TIMER = "START_TIMER",
  PAUSE_TIMER = "PAUSE_TIMER",
  STOP_TIMER = "STOP_TIMER",
  ADD_ISSUE = "ADD_ISSUE",
  UPDATE_ISSUE = "UPDATE_ISSUE",
  DELETE_ISSUE = "DELETE_ISSUE",
  TRANSFER_FACILITATOR = "TRANSFER_FACILITATOR",
}

export enum ServerEvents {
  GAME_STATE_SYNC = "GAME_STATE_SYNC",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  VOTE_SUBMITTED = "VOTE_SUBMITTED",
  CARDS_REVEALED = "CARDS_REVEALED",
  NEW_ROUND_STARTED = "NEW_ROUND_STARTED",
  GAME_SETTINGS_UPDATED = "GAME_SETTINGS_UPDATED",
  TIMER_TICK = "TIMER_TICK",
  TIMER_ENDED = "TIMER_ENDED",
  ISSUE_ADDED = "ISSUE_ADDED",
  ISSUE_UPDATED = "ISSUE_UPDATED",
  ISSUE_DELETED = "ISSUE_DELETED",
  PLAYER_UPDATED = "PLAYER_UPDATED",
  FACILITATOR_CHANGED = "FACILITATOR_CHANGED",
  ERROR = "ERROR",
}

// Types for game state
export interface PlayerInfo {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_spectator: boolean;
  socket_id: string;
  is_online: boolean;
  joined_at: Date;
  has_voted?: boolean;
}

export interface VotingRound {
  id: string;
  issue_id: string | null;
  votes: Record<string, string>;
  is_revealed: boolean;
}

export interface TimerState {
  duration_seconds: number;
  remaining_seconds: number;
  is_running: boolean;
}

export interface GameState {
  game: any; // Full game object from database
  players: PlayerInfo[];
  current_round: VotingRound | null;
  timer: TimerState | null;
}

export interface VotingResults {
  votes: Array<{ user_id: string; card_value: string }>;
  distribution: Record<string, number>;
  average: number | null;
  agreement: number;
}

// Hook options
interface UseGameSocketOptions {
  gameId: string;
  isAuthenticated: boolean;
  onError?: (error: string) => void;
  onPlayerJoined?: (player: PlayerInfo) => void;
  onPlayerLeft?: (userId: string) => void;
  onVoteSubmitted?: (userId: string) => void;
  onCardsRevealed?: (results: VotingResults) => void;
  onNewRound?: (roundId: string, issueId: string | null) => void;
  onTimerTick?: (remainingSeconds: number) => void;
  onTimerEnded?: () => void;
}

export function useGameSocket(options: UseGameSocketOptions) {
  const {
    gameId,
    isAuthenticated,
    onError,
    onPlayerJoined,
    onPlayerLeft,
    onVoteSubmitted,
    onCardsRevealed,
    onNewRound,
    onTimerTick,
    onTimerEnded,
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!gameId || !isAuthenticated) return;

    const serverUrl =
      process.env.NEXT_PUBLIC_WS_URL || "https://localhost:3002";

    const newSocket = io(serverUrl, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      console.log("WebSocket connected:", newSocket.id);
      setIsConnected(true);
      setIsReconnecting(false);

      // Join game room
      newSocket.emit(ClientEvents.JOIN_GAME, { game_id: gameId });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("reconnect_attempt", () => {
      console.log("Attempting to reconnect...");
      setIsReconnecting(true);
    });

    newSocket.on("reconnect", () => {
      console.log("Reconnected successfully");
      setIsReconnecting(false);
      // Rejoin game room
      newSocket.emit(ClientEvents.JOIN_GAME, { game_id: gameId });
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Reconnection failed");
      setIsReconnecting(false);
      onError?.("Failed to reconnect to game");
    });

    // Game state sync (on join/reconnect)
    newSocket.on(ServerEvents.GAME_STATE_SYNC, (state: GameState) => {
      console.log("Game state synced:", state);
      setGameState(state);
    });

    // Player events
    newSocket.on(
      ServerEvents.PLAYER_JOINED,
      ({ user }: { user: PlayerInfo }) => {
        console.log("Player joined:", user.display_name);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: [...prev.players, user],
          };
        });
        onPlayerJoined?.(user);
      },
    );

    newSocket.on(
      ServerEvents.PLAYER_LEFT,
      ({ user_id }: { user_id: string }) => {
        console.log("Player left:", user_id);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.filter((p) => p.user_id !== user_id),
          };
        });
        onPlayerLeft?.(user_id);
      },
    );

    newSocket.on(
      ServerEvents.PLAYER_UPDATED,
      (data: {
        user_id: string;
        display_name: string;
        avatar_url: string | null;
      }) => {
        console.log("Player updated:", data);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.user_id === data.user_id
                ? {
                    ...p,
                    display_name: data.display_name,
                    avatar_url: data.avatar_url,
                  }
                : p,
            ),
          };
        });
      },
    );

    // Voting events
    newSocket.on(
      ServerEvents.VOTE_SUBMITTED,
      ({ user_id }: { user_id: string }) => {
        console.log("Vote submitted by:", user_id);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map((p) =>
              p.user_id === user_id ? { ...p, has_voted: true } : p,
            ),
          };
        });
        onVoteSubmitted?.(user_id);
      },
    );

    newSocket.on(ServerEvents.CARDS_REVEALED, (results: VotingResults) => {
      console.log("Cards revealed:", results);
      setGameState((prev) => {
        if (!prev || !prev.current_round) return prev;
        return {
          ...prev,
          current_round: {
            ...prev.current_round,
            is_revealed: true,
          },
          players: prev.players.map((p) => ({ ...p, has_voted: false })),
        };
      });
      onCardsRevealed?.(results);
    });

    newSocket.on(
      ServerEvents.NEW_ROUND_STARTED,
      ({
        round_id,
        issue_id,
      }: {
        round_id: string;
        issue_id: string | null;
      }) => {
        console.log("New round started:", round_id);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            current_round: {
              id: round_id,
              issue_id,
              votes: {},
              is_revealed: false,
            },
            players: prev.players.map((p) => ({ ...p, has_voted: false })),
          };
        });
        onNewRound?.(round_id, issue_id);
      },
    );

    // Game settings
    newSocket.on(
      ServerEvents.GAME_SETTINGS_UPDATED,
      ({ settings }: { settings: any }) => {
        console.log("Game settings updated:", settings);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            game: { ...prev.game, ...settings },
          };
        });
      },
    );

    // Timer events
    newSocket.on(
      ServerEvents.TIMER_TICK,
      ({ remaining_seconds }: { remaining_seconds: number }) => {
        setGameState((prev) => {
          if (!prev || !prev.timer) return prev;
          return {
            ...prev,
            timer: {
              ...prev.timer,
              remaining_seconds,
            },
          };
        });
        onTimerTick?.(remaining_seconds);
      },
    );

    newSocket.on(ServerEvents.TIMER_ENDED, () => {
      console.log("Timer ended");
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          timer: null,
        };
      });
      onTimerEnded?.();
    });

    // Issue events
    newSocket.on(ServerEvents.ISSUE_ADDED, ({ issue }: { issue: any }) => {
      console.log("Issue added:", issue);
      // Parent component should refetch issues list
    });

    newSocket.on(ServerEvents.ISSUE_UPDATED, ({ issue }: { issue: any }) => {
      console.log("Issue updated:", issue);
      // Parent component should refetch issues list
    });

    newSocket.on(
      ServerEvents.ISSUE_DELETED,
      ({ issue_id }: { issue_id: string }) => {
        console.log("Issue deleted:", issue_id);
        // Parent component should refetch issues list
      },
    );

    // Facilitator change
    newSocket.on(
      ServerEvents.FACILITATOR_CHANGED,
      ({ new_facilitator_id }: { new_facilitator_id: string }) => {
        console.log("Facilitator changed to:", new_facilitator_id);
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            game: { ...prev.game, facilitator_id: new_facilitator_id },
          };
        });
      },
    );

    // Error handling
    newSocket.on(ServerEvents.ERROR, ({ message }: { message: string }) => {
      console.error("WebSocket error:", message);
      onError?.(message);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.emit(ClientEvents.LEAVE_GAME, { game_id: gameId });
        newSocket.close();
      }
    };
  }, [
    gameId,
    isAuthenticated,
    onError,
    onPlayerJoined,
    onPlayerLeft,
    onVoteSubmitted,
    onCardsRevealed,
    onNewRound,
    onTimerTick,
    onTimerEnded,
  ]);

  // Action methods
  const submitVote = useCallback(
    (cardValue: string) => {
      if (!socket || !gameState?.current_round) {
        console.error("Cannot submit vote: socket or round not ready");
        return;
      }
      socket.emit(ClientEvents.SUBMIT_VOTE, {
        round_id: gameState.current_round.id,
        card_value: cardValue,
      });
    },
    [socket, gameState],
  );

  const revealCards = useCallback(() => {
    if (!socket || !gameState?.current_round) {
      console.error("Cannot reveal cards: socket or round not ready");
      return;
    }
    socket.emit(ClientEvents.REVEAL_CARDS, {
      round_id: gameState.current_round.id,
    });
  }, [socket, gameState]);

  const startNewRound = useCallback(
    (issueId?: string) => {
      if (!socket) {
        console.error("Cannot start new round: socket not ready");
        return;
      }
      socket.emit(ClientEvents.START_NEW_ROUND, {
        game_id: gameId,
        issue_id: issueId || null,
      });
    },
    [socket, gameId],
  );

  const updateGameSettings = useCallback(
    (settings: any) => {
      if (!socket) {
        console.error("Cannot update settings: socket not ready");
        return;
      }
      socket.emit(ClientEvents.UPDATE_GAME_SETTINGS, {
        game_id: gameId,
        settings,
      });
    },
    [socket, gameId],
  );

  const startTimer = useCallback(
    (durationSeconds: number) => {
      if (!socket) {
        console.error("Cannot start timer: socket not ready");
        return;
      }
      socket.emit(ClientEvents.START_TIMER, {
        game_id: gameId,
        duration_seconds: durationSeconds,
      });
    },
    [socket, gameId],
  );

  const pauseTimer = useCallback(() => {
    if (!socket) {
      console.error("Cannot pause timer: socket not ready");
      return;
    }
    socket.emit(ClientEvents.PAUSE_TIMER, { game_id: gameId });
  }, [socket, gameId]);

  const stopTimer = useCallback(() => {
    if (!socket) {
      console.error("Cannot stop timer: socket not ready");
      return;
    }
    socket.emit(ClientEvents.STOP_TIMER, { game_id: gameId });
  }, [socket, gameId]);

  const addIssue = useCallback(
    (title: string) => {
      if (!socket) {
        console.error("Cannot add issue: socket not ready");
        return;
      }
      socket.emit(ClientEvents.ADD_ISSUE, {
        game_id: gameId,
        title,
      });
    },
    [socket, gameId],
  );

  const updateIssue = useCallback(
    (issue: any) => {
      if (!socket) {
        console.error("Cannot update issue: socket not ready");
        return;
      }
      socket.emit(ClientEvents.UPDATE_ISSUE, {
        game_id: gameId,
        issue,
      });
    },
    [socket, gameId],
  );

  const deleteIssue = useCallback(
    (issueId: string) => {
      if (!socket) {
        console.error("Cannot delete issue: socket not ready");
        return;
      }
      socket.emit(ClientEvents.DELETE_ISSUE, {
        game_id: gameId,
        issue_id: issueId,
      });
    },
    [socket, gameId],
  );

  const transferFacilitator = useCallback(
    (newFacilitatorId: string) => {
      if (!socket) {
        console.error("Cannot transfer facilitator: socket not ready");
        return;
      }
      socket.emit(ClientEvents.TRANSFER_FACILITATOR, {
        game_id: gameId,
        new_facilitator_id: newFacilitatorId,
      });
    },
    [socket, gameId],
  );

  return {
    socket,
    gameState,
    isConnected,
    isReconnecting,
    // Actions
    submitVote,
    revealCards,
    startNewRound,
    updateGameSettings,
    startTimer,
    pauseTimer,
    stopTimer,
    addIssue,
    updateIssue,
    deleteIssue,
    transferFacilitator,
  };
}

// Made with Bob
