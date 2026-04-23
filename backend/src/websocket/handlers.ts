/**
 * WebSocket Event Handlers
 *
 * Handles all WebSocket events for Planning Poker games
 */

import { Server as SocketIOServer } from "socket.io";
import {
  AuthenticatedSocket,
  ClientEvents,
  ServerEvents,
  JoinGamePayload,
  LeaveGamePayload,
  SubmitVotePayload,
  RevealCardsPayload,
  StartNewRoundPayload,
  UpdateGameSettingsPayload,
  StartTimerPayload,
  PauseTimerPayload,
  StopTimerPayload,
  AddIssuePayload,
  UpdateIssuePayload,
  DeleteIssuePayload,
  TransferFacilitatorPayload,
} from "../types/websocket.types";
import {
  addPlayerToRoom,
  removePlayerFromRoom,
  getRoomState,
  startVotingRound,
  submitVote,
  revealCards,
  haveAllPlayersVoted,
  calculateVotingResults,
  clearCurrentRound,
  startTimer,
  pauseTimer,
  stopTimer,
} from "../services/roomManager";
import { updateGame, hasGamePermission } from "../services/gameService";
import {
  createIssue,
  updateIssue as updateIssueService,
  deleteIssue as deleteIssueService,
  setVotingIssue,
} from "../services/issueService";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

/**
 * Register all WebSocket event handlers
 */
export const registerHandlers = (io: SocketIOServer) => {
  io.on("connection", (socket: any) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.userId;
    const displayName = authSocket.displayName;

    logger.info(`Client connected: ${socket.id} (User: ${displayName})`);

    /**
     * JOIN_GAME - Player joins a game room
     */
    authSocket.on(ClientEvents.JOIN_GAME, async (payload: JoinGamePayload) => {
      try {
        const { game_id } = payload;

        // Add player to room
        await addPlayerToRoom(game_id, authSocket.id, userId);

        // Join Socket.IO room
        authSocket.join(game_id);

        // Get current game state
        const gameState = await getRoomState(game_id);

        // Send current state to the joining player
        authSocket.emit(ServerEvents.GAME_STATE, gameState);

        // Notify other players
        authSocket.broadcast.to(game_id).emit(ServerEvents.PLAYER_JOINED, {
          user: {
            id: userId,
            display_name: displayName,
            avatar_url:
              gameState.players.find((p) => p.id === userId)?.avatar_url ||
              null,
            is_facilitator:
              gameState.players.find((p) => p.id === userId)?.is_facilitator ||
              false,
            is_spectator:
              gameState.players.find((p) => p.id === userId)?.is_spectator ||
              false,
          },
        });

        logger.info(`User ${userId} joined game ${game_id}`);
      } catch (error: any) {
        logger.error("Error joining game:", error);
        authSocket.emit(ServerEvents.ERROR, {
          message: error.message || "Failed to join game",
        });
      }
    });

    /**
     * LEAVE_GAME - Player leaves a game room
     */
    authSocket.on(
      ClientEvents.LEAVE_GAME,
      async (payload: LeaveGamePayload) => {
        try {
          const { game_id } = payload;

          // Remove player from room
          removePlayerFromRoom(game_id, userId);

          // Leave Socket.IO room
          authSocket.leave(game_id);

          // Notify other players
          authSocket.broadcast.to(game_id).emit(ServerEvents.PLAYER_LEFT, {
            user_id: userId,
          });

          logger.info(`User ${userId} left game ${game_id}`);
        } catch (error: any) {
          logger.error("Error leaving game:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to leave game",
          });
        }
      },
    );

    /**
     * SUBMIT_VOTE - Player submits a vote
     */
    authSocket.on(
      ClientEvents.SUBMIT_VOTE,
      async (payload: SubmitVotePayload) => {
        try {
          const { card_value } = payload;

          // Extract game_id from round_id (assuming format: game_id-timestamp)
          // For now, we'll need to pass game_id separately or store it
          // Let's assume the client sends it
          const gameId = (payload as any).game_id;

          if (!gameId) {
            throw new Error("Game ID is required");
          }

          // Submit vote
          submitVote(gameId, userId, card_value);

          // Notify all players that a vote was submitted (without revealing value)
          io.to(gameId).emit(ServerEvents.VOTE_SUBMITTED, {
            user_id: userId,
          });

          // Check if all players have voted and auto-reveal is enabled
          const gameState = await getRoomState(gameId);
          if (gameState.game.auto_reveal && haveAllPlayersVoted(gameId)) {
            // Auto-reveal cards
            revealCards(gameId);
            const results = calculateVotingResults(gameId);

            io.to(gameId).emit(ServerEvents.CARDS_REVEALED, results);
          }

          logger.info(`Vote submitted by ${userId} in game ${gameId}`);
        } catch (error: any) {
          logger.error("Error submitting vote:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to submit vote",
          });
        }
      },
    );

    /**
     * REVEAL_CARDS - Reveal all cards
     */
    authSocket.on(
      ClientEvents.REVEAL_CARDS,
      async (payload: RevealCardsPayload) => {
        try {
          const gameId = (payload as any).game_id;

          if (!gameId) {
            throw new Error("Game ID is required");
          }

          // Check permission
          const hasPermission = await hasGamePermission(
            gameId,
            userId,
            "reveal",
          );
          if (!hasPermission) {
            throw new Error("You don't have permission to reveal cards");
          }

          // Reveal cards
          revealCards(gameId);
          const results = calculateVotingResults(gameId);

          // Broadcast to all players
          io.to(gameId).emit(ServerEvents.CARDS_REVEALED, results);

          logger.info(`Cards revealed in game ${gameId} by ${userId}`);
        } catch (error: any) {
          logger.error("Error revealing cards:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to reveal cards",
          });
        }
      },
    );

    /**
     * START_NEW_ROUND - Start a new voting round
     */
    authSocket.on(
      ClientEvents.START_NEW_ROUND,
      async (payload: StartNewRoundPayload) => {
        try {
          const { game_id, issue_id } = payload;

          // Check permission
          const hasPermission = await hasGamePermission(
            game_id,
            userId,
            "manage_issues",
          );
          if (!hasPermission) {
            throw new Error("You don't have permission to start voting");
          }

          // Generate round ID
          const roundId = uuidv4();

          // Clear previous round
          clearCurrentRound(game_id);

          // Start new round
          startVotingRound(game_id, roundId, issue_id);

          // If issue_id provided, set it as voting
          if (issue_id) {
            await setVotingIssue(game_id, issue_id, userId);
          }

          // Broadcast to all players
          io.to(game_id).emit(ServerEvents.NEW_ROUND_STARTED, {
            round_id: roundId,
            issue_id,
          });

          logger.info(`New round ${roundId} started in game ${game_id}`);
        } catch (error: any) {
          logger.error("Error starting new round:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to start new round",
          });
        }
      },
    );

    /**
     * UPDATE_GAME_SETTINGS - Update game settings
     */
    authSocket.on(
      ClientEvents.UPDATE_GAME_SETTINGS,
      async (payload: UpdateGameSettingsPayload) => {
        try {
          const { game_id, settings } = payload;

          // Update game settings
          await updateGame(game_id, userId, settings as any);

          // Broadcast to all players
          io.to(game_id).emit(ServerEvents.GAME_SETTINGS_UPDATED, {
            settings,
          });

          logger.info(`Game settings updated in ${game_id} by ${userId}`);
        } catch (error: any) {
          logger.error("Error updating game settings:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to update game settings",
          });
        }
      },
    );

    /**
     * START_TIMER - Start countdown timer
     */
    authSocket.on(
      ClientEvents.START_TIMER,
      async (payload: StartTimerPayload) => {
        try {
          const { game_id, duration_seconds } = payload;

          startTimer(
            game_id,
            duration_seconds,
            (remaining) => {
              // Emit tick to all players
              io.to(game_id).emit(ServerEvents.TIMER_TICK, {
                remaining_seconds: remaining,
              });
            },
            () => {
              // Emit timer ended
              io.to(game_id).emit(ServerEvents.TIMER_ENDED, {});
            },
          );

          logger.info(`Timer started in game ${game_id}: ${duration_seconds}s`);
        } catch (error: any) {
          logger.error("Error starting timer:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to start timer",
          });
        }
      },
    );

    /**
     * PAUSE_TIMER - Pause timer
     */
    authSocket.on(
      ClientEvents.PAUSE_TIMER,
      async (payload: PauseTimerPayload) => {
        try {
          const { game_id } = payload;
          pauseTimer(game_id);
          logger.info(`Timer paused in game ${game_id}`);
        } catch (error: any) {
          logger.error("Error pausing timer:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to pause timer",
          });
        }
      },
    );

    /**
     * STOP_TIMER - Stop timer
     */
    authSocket.on(
      ClientEvents.STOP_TIMER,
      async (payload: StopTimerPayload) => {
        try {
          const { game_id } = payload;
          stopTimer(game_id);
          logger.info(`Timer stopped in game ${game_id}`);
        } catch (error: any) {
          logger.error("Error stopping timer:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to stop timer",
          });
        }
      },
    );

    /**
     * ADD_ISSUE - Add a new issue
     */
    authSocket.on(ClientEvents.ADD_ISSUE, async (payload: AddIssuePayload) => {
      try {
        const { game_id, issue_title } = payload;

        const issue = await createIssue(game_id, userId, {
          title: issue_title,
        });

        // Broadcast to all players
        io.to(game_id).emit(ServerEvents.ISSUE_ADDED, { issue });

        logger.info(`Issue added in game ${game_id} by ${userId}`);
      } catch (error: any) {
        logger.error("Error adding issue:", error);
        authSocket.emit(ServerEvents.ERROR, {
          message: error.message || "Failed to add issue",
        });
      }
    });

    /**
     * UPDATE_ISSUE - Update an issue
     */
    authSocket.on(
      ClientEvents.UPDATE_ISSUE,
      async (payload: UpdateIssuePayload) => {
        try {
          const { game_id, issue } = payload;

          const updatedIssue = await updateIssueService(
            issue.id,
            game_id,
            userId,
            {
              title: issue.title,
              status: issue.status as any,
              final_estimate: issue.final_estimate,
              display_order: issue.display_order,
            },
          );

          // Broadcast to all players
          io.to(game_id).emit(ServerEvents.ISSUE_UPDATED, {
            issue: updatedIssue,
          });

          logger.info(`Issue ${issue.id} updated in game ${game_id}`);
        } catch (error: any) {
          logger.error("Error updating issue:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to update issue",
          });
        }
      },
    );

    /**
     * DELETE_ISSUE - Delete an issue
     */
    authSocket.on(
      ClientEvents.DELETE_ISSUE,
      async (payload: DeleteIssuePayload) => {
        try {
          const { game_id, issue_id } = payload;

          await deleteIssueService(issue_id, game_id, userId);

          // Broadcast to all players
          io.to(game_id).emit(ServerEvents.ISSUE_DELETED, { issue_id });

          logger.info(`Issue ${issue_id} deleted from game ${game_id}`);
        } catch (error: any) {
          logger.error("Error deleting issue:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to delete issue",
          });
        }
      },
    );

    /**
     * TRANSFER_FACILITATOR - Transfer facilitator role
     */
    authSocket.on(
      ClientEvents.TRANSFER_FACILITATOR,
      async (payload: TransferFacilitatorPayload) => {
        try {
          const { game_id, new_facilitator_id } = payload;

          await updateGame(game_id, userId, {
            facilitator_id: new_facilitator_id,
          });

          // Broadcast to all players
          io.to(game_id).emit(ServerEvents.FACILITATOR_CHANGED, {
            new_facilitator_id,
          });

          logger.info(
            `Facilitator changed to ${new_facilitator_id} in game ${game_id}`,
          );
        } catch (error: any) {
          logger.error("Error transferring facilitator:", error);
          authSocket.emit(ServerEvents.ERROR, {
            message: error.message || "Failed to transfer facilitator",
          });
        }
      },
    );

    /**
     * DISCONNECT - Handle disconnection
     */
    authSocket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id} (User: ${displayName})`);
      // Note: We don't automatically remove from rooms on disconnect
      // to allow reconnection. Cleanup happens on explicit LEAVE_GAME
      // or after a timeout period.
    });
  });
};

// Made with Bob
