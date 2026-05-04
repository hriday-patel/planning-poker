"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Development-only logger utility
const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[GameSocket]", ...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GameSocket]", ...args);
      return;
    }

    console.error("[GameSocket]", ...args);
  },
};

// Event types matching backend
export enum ClientEvents {
  JOIN_GAME = "JOIN_GAME",
  LEAVE_GAME = "LEAVE_GAME",
  SUBMIT_VOTE = "SUBMIT_VOTE",
  REVEAL_CARDS = "REVEAL_CARDS",
  SKIP_ISSUE = "SKIP_ISSUE",
  START_NEW_ROUND = "START_NEW_ROUND",
  UPDATE_GAME_SETTINGS = "UPDATE_GAME_SETTINGS",
  START_TIMER = "START_TIMER",
  PAUSE_TIMER = "PAUSE_TIMER",
  STOP_TIMER = "STOP_TIMER",
  ADD_ISSUE = "ADD_ISSUE",
  UPDATE_ISSUE = "UPDATE_ISSUE",
  DELETE_ISSUE = "DELETE_ISSUE",
  TRANSFER_FACILITATOR = "TRANSFER_FACILITATOR",
  SET_SPECTATOR_MODE = "SET_SPECTATOR_MODE",
}

export enum ServerEvents {
  GAME_STATE = "GAME_STATE",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  VOTE_SUBMITTED = "VOTE_SUBMITTED",
  CARDS_REVEALED = "CARDS_REVEALED",
  ISSUE_SKIPPED = "ISSUE_SKIPPED",
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
  can_vote?: boolean;
  is_round_observer?: boolean;
  observer_reason?: string | null;
}

export interface VotingRound {
  id: string;
  issue_id: string | null;
  votes: Record<string, string>;
  is_revealed: boolean;
}

type BackendPlayerInfo = Partial<PlayerInfo> & {
  id?: string;
  is_facilitator?: boolean;
};

type BackendVotingRound = {
  id: string;
  issue_id: string | null;
  votes?:
    | Record<string, string>
    | Array<{
        user_id: string;
        has_voted: boolean;
        card_value: string | null;
        can_vote?: boolean;
        observer_reason?: string | null;
      }>;
  is_revealed: boolean;
};

export interface VotingSpeedStat {
  user_id: string;
  display_name: string;
  seconds: number;
}

export interface TimerState {
  duration_seconds: number;
  remaining_seconds: number;
  is_running: boolean;
}

export interface GameState {
  game: any; // Full game object from database
  players: PlayerInfo[];
  issues?: any[];
  current_round: VotingRound | null;
  timer: TimerState | null;
}

export interface VotingResults {
  votes: Array<{
    user_id: string;
    card_value: string;
    submitted_at?: string | null;
  }>;
  distribution: Record<string, number>;
  average: number | null;
  agreement: number;
  total_voters: number;
  final_estimate?: string | null;
  fastest_voter?: VotingSpeedStat | null;
  slowest_voter?: VotingSpeedStat | null;
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
  onIssueSkipped?: (roundId: string, issueId: string) => void;
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
    onIssueSkipped,
    onNewRound,
    onTimerTick,
    onTimerEnded,
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const normalizeGameState = useCallback((state: any): GameState => {
    const round = state.current_round as BackendVotingRound | null;
    const roundVotes = Array.isArray(round?.votes) ? round.votes : [];
    const voteRecord = Array.isArray(round?.votes)
      ? round.votes.reduce<Record<string, string>>((votes, vote) => {
          if (vote.card_value) {
            votes[vote.user_id] = vote.card_value;
          }
          return votes;
        }, {})
      : round?.votes || {};

    const players = (state.players || []).map((player: BackendPlayerInfo) => {
      const userId = player.user_id || player.id || "";
      const roundVote = roundVotes.find((vote) => vote.user_id === userId);

      return {
        user_id: userId,
        display_name: player.display_name || "Player",
        avatar_url: player.avatar_url ?? null,
        is_spectator: Boolean(player.is_spectator),
        socket_id: player.socket_id || "",
        is_online: player.is_online ?? true,
        joined_at: player.joined_at ? new Date(player.joined_at) : new Date(),
        has_voted: player.has_voted ?? roundVote?.has_voted ?? false,
        can_vote: roundVote?.can_vote ?? player.can_vote ?? true,
        is_round_observer: Boolean(player.is_round_observer),
        observer_reason:
          player.observer_reason ?? roundVote?.observer_reason ?? null,
      };
    });

    return {
      game: state.game,
      players,
      issues: state.issues || [],
      current_round: round
        ? {
            id: round.id,
            issue_id: round.issue_id,
            votes: voteRecord,
            is_revealed: round.is_revealed,
          }
        : null,
      timer: state.timer || null,
    };
  }, []);

  const normalizeVotingResults = useCallback((results: any): VotingResults => {
    const votes: Array<{
      user_id: string;
      card_value: string;
      submitted_at?: string | null;
    }> = Array.isArray(results?.votes)
      ? results.votes
          .filter(
            (vote: any) =>
              typeof vote?.user_id === "string" &&
              typeof vote?.card_value === "string",
          )
          .map((vote: any) => ({
            user_id: vote.user_id,
            card_value: vote.card_value,
            submitted_at: vote.submitted_at ?? null,
          }))
      : [];
    const distribution =
      results?.distribution ||
      votes.reduce<Record<string, number>>((allVotes, vote) => {
        if (vote.card_value) {
          allVotes[vote.card_value] = (allVotes[vote.card_value] || 0) + 1;
        }
        return allVotes;
      }, {});

    return {
      votes,
      distribution,
      average: typeof results?.average === "number" ? results.average : null,
      agreement: typeof results?.agreement === "number" ? results.agreement : 0,
      total_voters:
        typeof results?.total_voters === "number"
          ? results.total_voters
          : votes.length,
      final_estimate: results?.final_estimate ?? null,
      fastest_voter: results?.fastest_voter ?? null,
      slowest_voter: results?.slowest_voter ?? null,
    };
  }, []);

  // Store callbacks in ref to avoid recreating registerSocketEvents
  const callbacksRef = useRef({
    onError,
    onPlayerJoined,
    onPlayerLeft,
    onVoteSubmitted,
    onCardsRevealed,
    onIssueSkipped,
    onNewRound,
    onTimerTick,
    onTimerEnded,
  });

  // Update callbacks ref on every render
  useEffect(() => {
    callbacksRef.current = {
      onError,
      onPlayerJoined,
      onPlayerLeft,
      onVoteSubmitted,
      onCardsRevealed,
      onIssueSkipped,
      onNewRound,
      onTimerTick,
      onTimerEnded,
    };
  });

  // State update helper to reduce duplication
  const updateGameState = useCallback(
    (
      updates:
        | Partial<GameState>
        | ((prev: GameState | null) => GameState | null),
    ) => {
      setGameState((prev) => {
        if (!prev) return prev;
        if (typeof updates === "function") {
          return updates(prev);
        }
        return { ...prev, ...updates };
      });
    },
    [],
  );

  // Register all socket event handlers
  const registerSocketEvents = useCallback(
    (socket: Socket) => {
      // Connection events
      socket.on("connect", () => {
        logger.log("WebSocket connected:", socket.id);
        setIsConnected(true);
        setIsReconnecting(false);
        socket.emit(ClientEvents.JOIN_GAME, { game_id: gameId });
      });

      socket.on("disconnect", (reason) => {
        logger.log("WebSocket disconnected:", reason);
        setIsConnected(false);
      });

      socket.on("reconnect_attempt", () => {
        logger.log("Attempting to reconnect...");
        setIsReconnecting(true);
      });

      socket.on("reconnect", () => {
        logger.log("Reconnected successfully");
        setIsReconnecting(false);
        socket.emit(ClientEvents.JOIN_GAME, { game_id: gameId });
      });

      socket.on("reconnect_failed", () => {
        logger.error("Reconnection failed");
        setIsReconnecting(false);
        callbacksRef.current.onError?.("Failed to reconnect to game");
      });

      // Game state sync
      socket.on(ServerEvents.GAME_STATE, (state: GameState) => {
        const normalizedState = normalizeGameState(state);

        logger.log("Game state synced:", normalizedState);
        setGameState(normalizedState);
      });

      // Player events
      socket.on(
        ServerEvents.PLAYER_JOINED,
        ({ user }: { user: BackendPlayerInfo }) => {
          const normalizedUser = normalizeGameState({
            game: null,
            players: [user],
            current_round: null,
            timer: null,
          }).players[0];

          logger.log("Player joined:", normalizedUser.display_name);
          updateGameState((prev) => {
            if (!prev) return prev;
            if (
              prev.players.some((p) => p.user_id === normalizedUser.user_id)
            ) {
              return prev;
            }
            return { ...prev, players: [...prev.players, normalizedUser] };
          });
          callbacksRef.current.onPlayerJoined?.(normalizedUser);
        },
      );

      socket.on(
        ServerEvents.PLAYER_LEFT,
        ({ user_id }: { user_id: string }) => {
          logger.log("Player left:", user_id);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.filter((p) => p.user_id !== user_id),
            };
          });
          callbacksRef.current.onPlayerLeft?.(user_id);
        },
      );

      socket.on(
        ServerEvents.PLAYER_UPDATED,
        (data: {
          user_id: string;
          display_name?: string;
          avatar_url?: string | null;
          is_spectator?: boolean;
          is_round_observer?: boolean;
          observer_reason?: string | null;
        }) => {
          logger.log("Player updated:", data);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.user_id === data.user_id
                  ? {
                      ...p,
                      display_name: data.display_name ?? p.display_name,
                      avatar_url: data.avatar_url ?? p.avatar_url,
                      is_spectator: data.is_spectator ?? p.is_spectator,
                      is_round_observer:
                        data.is_round_observer ?? p.is_round_observer,
                      observer_reason:
                        data.observer_reason ?? p.observer_reason,
                    }
                  : p,
              ),
            };
          });
        },
      );

      // Voting events
      socket.on(
        ServerEvents.VOTE_SUBMITTED,
        ({ user_id }: { user_id: string }) => {
          logger.log("Vote submitted by:", user_id);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p) =>
                p.user_id === user_id ? { ...p, has_voted: true } : p,
              ),
            };
          });
          callbacksRef.current.onVoteSubmitted?.(user_id);
        },
      );

      socket.on(ServerEvents.CARDS_REVEALED, (results: VotingResults) => {
        const normalizedResults = normalizeVotingResults(results);

        logger.log("Cards revealed:", normalizedResults);
        updateGameState((prev) => {
          if (!prev || !prev.current_round) return prev;
          const votes = normalizedResults.votes.reduce<Record<string, string>>(
            (allVotes, vote) => {
              allVotes[vote.user_id] = vote.card_value;
              return allVotes;
            },
            {},
          );

          return {
            ...prev,
            current_round: { ...prev.current_round, votes, is_revealed: true },
          };
        });
        callbacksRef.current.onCardsRevealed?.(normalizedResults);
      });

      socket.on(
        ServerEvents.ISSUE_SKIPPED,
        ({ round_id, issue_id }: { round_id: string; issue_id: string }) => {
          logger.log("Issue skipped:", issue_id);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              current_round: null,
              players: prev.players.map((player) => ({
                ...player,
                has_voted: false,
                can_vote: !player.is_spectator,
                is_round_observer: false,
                observer_reason: null,
              })),
            };
          });
          callbacksRef.current.onIssueSkipped?.(round_id, issue_id);
        },
      );

      socket.on(
        ServerEvents.NEW_ROUND_STARTED,
        ({
          round_id,
          issue_id,
        }: {
          round_id: string;
          issue_id: string | null;
        }) => {
          logger.log("New round started:", round_id);
          updateGameState((prev) => {
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
          callbacksRef.current.onNewRound?.(round_id, issue_id);
        },
      );

      // Game settings
      socket.on(
        ServerEvents.GAME_SETTINGS_UPDATED,
        ({ settings }: { settings: any }) => {
          logger.log("Game settings updated:", settings);
          updateGameState((prev) => {
            if (!prev) return prev;
            return { ...prev, game: { ...prev.game, ...settings } };
          });
        },
      );

      // Timer events
      socket.on(
        ServerEvents.TIMER_TICK,
        ({ remaining_seconds }: { remaining_seconds: number }) => {
          updateGameState((prev) => {
            if (!prev || !prev.timer) return prev;
            return {
              ...prev,
              timer: { ...prev.timer, remaining_seconds },
            };
          });
          callbacksRef.current.onTimerTick?.(remaining_seconds);
        },
      );

      socket.on(ServerEvents.TIMER_ENDED, () => {
        logger.log("Timer ended");
        updateGameState({ timer: null });
        callbacksRef.current.onTimerEnded?.();
      });

      // Issue events
      socket.on(ServerEvents.ISSUE_ADDED, ({ issue }: { issue: any }) => {
        logger.log("Issue added:", issue);
        updateGameState((prev) => {
          if (!prev) return prev;
          if (
            prev.issues?.some((existingIssue) => existingIssue.id === issue.id)
          ) {
            return prev;
          }
          return { ...prev, issues: [...(prev.issues || []), issue] };
        });
      });

      socket.on(ServerEvents.ISSUE_UPDATED, ({ issue }: { issue: any }) => {
        logger.log("Issue updated:", issue);
        updateGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            issues: (prev.issues || []).map((existingIssue) =>
              existingIssue.id === issue.id ? issue : existingIssue,
            ),
          };
        });
      });

      socket.on(
        ServerEvents.ISSUE_DELETED,
        ({ issue_id }: { issue_id: string }) => {
          logger.log("Issue deleted:", issue_id);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              issues: (prev.issues || []).filter(
                (issue) => issue.id !== issue_id,
              ),
            };
          });
        },
      );

      // Facilitator change
      socket.on(
        ServerEvents.FACILITATOR_CHANGED,
        ({ new_facilitator_id }: { new_facilitator_id: string }) => {
          logger.log("Facilitator changed to:", new_facilitator_id);
          updateGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              game: { ...prev.game, facilitator_id: new_facilitator_id },
            };
          });
        },
      );

      // Error handling
      socket.on(ServerEvents.ERROR, ({ message }: { message: string }) => {
        logger.error("WebSocket error:", message);
        callbacksRef.current.onError?.(message);
      });
    },
    [gameId, normalizeGameState, normalizeVotingResults, updateGameState],
  );

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

    // Register all event handlers
    registerSocketEvents(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [gameId, isAuthenticated, registerSocketEvents]);

  // Action methods
  const submitVote = useCallback(
    (cardValue: string) => {
      if (!socket || !gameState?.current_round) {
        console.error("Cannot submit vote: socket or round not ready");
        return;
      }
      socket.emit(ClientEvents.SUBMIT_VOTE, {
        game_id: gameId,
        round_id: gameState.current_round.id,
        card_value: cardValue,
      });
    },
    [socket, gameState, gameId],
  );

  const revealCards = useCallback(() => {
    if (!socket || !gameState?.current_round) {
      console.error("Cannot reveal cards: socket or round not ready");
      return;
    }
    socket.emit(ClientEvents.REVEAL_CARDS, {
      game_id: gameId,
      round_id: gameState.current_round.id,
    });
  }, [socket, gameState, gameId]);

  const skipIssue = useCallback(() => {
    if (!socket || !gameState?.current_round?.issue_id) {
      console.error("Cannot skip issue: socket or active issue not ready");
      return;
    }
    socket.emit(ClientEvents.SKIP_ISSUE, {
      game_id: gameId,
      round_id: gameState.current_round.id,
      issue_id: gameState.current_round.issue_id,
    });
  }, [socket, gameState, gameId]);

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
        issue_title: title,
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

  const mergeImportedIssues = useCallback(
    (issues: any[]) => {
      if (issues.length === 0) return;

      updateGameState((prev) => {
        if (!prev) return prev;

        const issueMap = new Map(
          (prev.issues || []).map((issue: any) => [issue.id, issue]),
        );
        issues.forEach((issue) => issueMap.set(issue.id, issue));

        return {
          ...prev,
          issues: Array.from(issueMap.values()).sort(
            (first: any, second: any) =>
              (first.display_order ?? 0) - (second.display_order ?? 0),
          ),
        };
      });
    },
    [updateGameState],
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

  const setSpectatorMode = useCallback(
    (isSpectator: boolean, targetUserId?: string) => {
      if (!socket) {
        console.error("Cannot update spectator mode: socket not ready");
        return;
      }
      socket.emit(ClientEvents.SET_SPECTATOR_MODE, {
        game_id: gameId,
        target_user_id: targetUserId,
        is_spectator: isSpectator,
      });
    },
    [socket, gameId],
  );

  const leaveGame = useCallback(
    (newFacilitatorId?: string) => {
      if (!socket) {
        console.error("Cannot leave game: socket not ready");
        return;
      }
      socket.emit(ClientEvents.LEAVE_GAME, {
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
    skipIssue,
    startNewRound,
    updateGameSettings,
    startTimer,
    pauseTimer,
    stopTimer,
    addIssue,
    updateIssue,
    deleteIssue,
    mergeImportedIssues,
    transferFacilitator,
    setSpectatorMode,
    leaveGame,
  };
}

// Made with Bob
