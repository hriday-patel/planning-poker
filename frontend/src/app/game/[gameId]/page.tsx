"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Game, GameState, VotingPhase, Player } from "@/types/game.types";
import { useGameSocket, VotingResults } from "@/hooks/useGameSocket";
import Timer from "@/components/Timer";
import InviteModal from "@/components/InviteModal";
import VotingHistory from "@/components/VotingHistory";
import GameSettingsModal from "@/components/GameSettingsModal";

export default function GameRoomPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;

  const [gameState, setGameState] = useState<GameState>({
    game: null,
    players: [],
    currentUser: null,
    issues: [],
    currentIssue: null,
    votingPhase: VotingPhase.WAITING,
    votingResults: null,
    selectedCard: null,
    isLoading: true,
    error: null,
  });

  const [showIssuesPanel, setShowIssuesPanel] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(
    null,
  );
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [timeIssuesEnabled, setTimeIssuesEnabled] = useState(false);
  const [timerAlert, setTimerAlert] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
        const response = await fetch(`${appUrl}/api/v1/auth/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        setIsAuthenticated(true);
      } catch (_error) {
        router.push("/login");
      }
    };

    void bootstrapSession();
  }, [router]);

  // Initialize WebSocket connection
  const {
    gameState: wsGameState,
    isConnected,
    isReconnecting,
    submitVote,
    revealCards,
    startNewRound,
    updateGameSettings,
    transferFacilitator,
    startTimer,
    pauseTimer,
    stopTimer,
  } = useGameSocket({
    gameId,
    isAuthenticated,
    onError: (error) => {
      console.error("WebSocket error:", error);
      setGameState((prev) => ({ ...prev, error }));
    },
    onPlayerJoined: (player) => {
      console.log("Player joined:", player.display_name);
    },
    onPlayerLeft: (userId) => {
      console.log("Player left:", userId);
    },
    onVoteSubmitted: (userId) => {
      console.log("Vote submitted by:", userId);
    },
    onCardsRevealed: (results) => {
      console.log("Cards revealed:", results);
      setVotingResults(results);

      // Show countdown animation if enabled
      if (gameState.game?.show_countdown) {
        setShowCountdown(true);
        setCountdownNumber(3);

        const countdownInterval = setInterval(() => {
          setCountdownNumber((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setTimeout(() => setShowCountdown(false), 500);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    },
    onNewRound: (roundId, issueId) => {
      console.log("New round started:", roundId, issueId);
      setVotingResults(null);
      setGameState((prev) => ({
        ...prev,
        selectedCard: null,
        votingPhase: VotingPhase.WAITING,
      }));

      // Auto-restart timer if "time issues" is enabled
      if (timeIssuesEnabled && wsGameState?.timer) {
        startTimer(wsGameState.timer.duration_seconds);
      }
    },
    onTimerTick: (remainingSeconds) => {
      // Show alert when timer is low
      if (remainingSeconds === 60 && !timerAlert) {
        setTimerAlert(true);
      } else if (remainingSeconds > 60 && timerAlert) {
        setTimerAlert(false);
      }
    },
    onTimerEnded: () => {
      console.log("Timer ended!");
      setTimerAlert(false);
      // Could show a notification or play a sound here
    },
  });

  // Sync WebSocket game state with local state
  useEffect(() => {
    if (wsGameState) {
      const players: Player[] = wsGameState.players.map((p) => ({
        id: p.user_id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        is_facilitator: p.user_id === wsGameState.game.facilitator_id,
        is_spectator: p.is_spectator,
        has_voted: p.has_voted || false,
        card_value: null, // Hidden until revealed
        is_online: p.is_online,
      }));

      // Determine voting phase
      let phase = VotingPhase.WAITING;
      if (wsGameState.current_round) {
        if (wsGameState.current_round.is_revealed) {
          phase = VotingPhase.REVEALED;
        } else if (gameState.selectedCard) {
          phase = VotingPhase.VOTING;
        }
      }

      setGameState((prev) => ({
        ...prev,
        game: wsGameState.game,
        players,
        votingPhase: phase,
        isLoading: false,
      }));
    }
  }, [wsGameState, gameState.selectedCard]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showGameDropdown && !target.closest(".game-dropdown-container")) {
        setShowGameDropdown(false);
      }
    };

    if (showGameDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showGameDropdown]);

  // Fallback: Fetch game data if WebSocket not connected
  useEffect(() => {
    if (!isAuthenticated || isConnected) return;

    const fetchGame = async () => {
      try {
        // Mock data for initial load
        const mockGame: Game = {
          id: gameId,
          name: "Sprint 23 Planning",
          creator_id: "user-1",
          facilitator_id: "user-1",
          voting_system: "deck-1",
          who_can_reveal: "all_players" as any,
          who_can_manage_issues: "all_players" as any,
          auto_reveal: false,
          fun_features_enabled: true,
          show_average: true,
          show_countdown: true,
          status: "active" as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deck: {
            id: "deck-1",
            name: "Fibonacci",
            values: ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"],
            is_default: true,
            created_by: null,
            created_at: new Date().toISOString(),
          },
          creator_name: "John Doe",
          facilitator_name: "John Doe",
        };

        const mockPlayers: Player[] = [
          {
            id: "user-1",
            display_name: "John Doe",
            avatar_url: null,
            is_facilitator: true,
            is_spectator: false,
            has_voted: false,
            card_value: null,
            is_online: true,
          },
          {
            id: "user-2",
            display_name: "Jane Smith",
            avatar_url: null,
            is_facilitator: false,
            is_spectator: false,
            has_voted: false,
            card_value: null,
            is_online: true,
          },
        ];

        setGameState((prev) => ({
          ...prev,
          game: mockGame,
          players: mockPlayers,
          currentUser: mockPlayers[0],
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error fetching game:", error);
        setGameState((prev) => ({
          ...prev,
          error: "Failed to load game",
          isLoading: false,
        }));
      }
    };

    fetchGame();
  }, [gameId, isAuthenticated, isConnected]);

  const handleCardSelect = (value: string) => {
    // Update local state immediately (optimistic update)
    setGameState((prev) => ({
      ...prev,
      selectedCard: value,
      votingPhase: VotingPhase.VOTING,
    }));

    // Submit vote via WebSocket
    submitVote(value);
  };

  const handleRevealCards = () => {
    // Trigger reveal via WebSocket
    revealCards();
  };

  const handleStartNewVoting = () => {
    // Start new round via WebSocket
    startNewRound();
  };

  // Show reconnecting indicator
  if (isReconnecting) {
    return (
      <div className="min-h-screen bg-[#1a2035] flex items-center justify-center">
        <div className="text-yellow-400 text-xl flex items-center gap-3">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Reconnecting to game...
        </div>
      </div>
    );
  }

  if (gameState.isLoading) {
    return (
      <div className="min-h-screen bg-[#1a2035] flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  if (gameState.error || !gameState.game) {
    return (
      <div className="min-h-screen bg-[#1a2035] flex items-center justify-center">
        <div className="text-red-400 text-xl">
          {gameState.error || "Game not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a2035] text-white">
      {/* Top Navigation Bar */}
      <nav className="h-16 bg-[#0f1729] border-b border-gray-700 px-3 md:px-6 flex items-center justify-between">
        {/* Left: Game Name with Dropdown */}
        <div className="relative flex items-center gap-2 game-dropdown-container">
          <button
            onClick={() => setShowGameDropdown(!showGameDropdown)}
            className="text-base md:text-xl font-semibold hover:text-blue-400 transition-colors flex items-center gap-2 truncate max-w-[150px] md:max-w-none"
          >
            <span className="truncate">{gameState.game.name}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showGameDropdown && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#0f1729] border border-gray-700 rounded-lg shadow-xl z-50">
              <button
                onClick={() => {
                  setShowGameDropdown(false);
                  setShowSettingsModal(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 rounded-t-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Game Settings
              </button>
              <button
                onClick={() => {
                  setShowGameDropdown(false);
                  setShowHistoryModal(true);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 rounded-b-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Voting History
              </button>
            </div>
          )}
        </div>

        {/* Center: Timer Icon */}
        <button
          onClick={() => setShowTimerModal(true)}
          className={`p-2 rounded-lg transition-colors relative ${
            wsGameState?.timer?.is_running
              ? "bg-blue-600 hover:bg-blue-700"
              : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {wsGameState?.timer?.is_running && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>

        {/* Timer Display (when running) */}
        {wsGameState?.timer?.is_running &&
          wsGameState.timer.remaining_seconds !== undefined && (
            <div
              className={`text-lg font-mono font-semibold ${timerAlert ? "text-red-400 animate-pulse" : ""}`}
            >
              {Math.floor(wsGameState.timer.remaining_seconds / 60)}:
              {(wsGameState.timer.remaining_seconds % 60)
                .toString()
                .padStart(2, "0")}
            </div>
          )}

        {/* Right: Invite & Issues Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium text-sm md:text-base"
          >
            <span className="hidden sm:inline">Invite Players</span>
            <span className="sm:hidden">Invite</span>
          </button>
          <button
            onClick={() => setShowIssuesPanel(!showIssuesPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showIssuesPanel ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
            aria-label="Toggle issues panel"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-4rem)] relative">
        {/* Game Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Player Table Area */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
            <div className="relative w-full max-w-5xl aspect-[16/10] min-h-[300px]">
              {/* Countdown Animation */}
              {showCountdown && countdownNumber > 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-50">
                  <div className="text-9xl font-bold text-white animate-pulse">
                    {countdownNumber}
                  </div>
                </div>
              )}

              {/* Center Action Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                {gameState.votingPhase === VotingPhase.WAITING && (
                  <div className="text-center">
                    <button className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg md:text-xl font-semibold transition-colors">
                      Pick your cards!
                    </button>
                    {!isConnected && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Connecting to game...
                      </p>
                    )}
                  </div>
                )}
                {gameState.votingPhase === VotingPhase.VOTING &&
                  gameState.selectedCard && (
                    <button
                      onClick={handleRevealCards}
                      className="px-6 md:px-8 py-3 md:py-4 bg-green-600 hover:bg-green-700 rounded-xl text-lg md:text-xl font-semibold transition-colors"
                    >
                      Reveal cards
                    </button>
                  )}
                {gameState.votingPhase === VotingPhase.REVEALED && (
                  <div className="text-center space-y-4">
                    {/* Voting Results */}
                    {votingResults && (
                      <div className="bg-[#0f1729] rounded-xl p-4 md:p-6 mb-4 max-w-md mx-auto">
                        <h3 className="text-base md:text-lg font-semibold mb-4">
                          Results
                        </h3>

                        {/* Vote Distribution Bar Chart */}
                        <div className="space-y-2 mb-4">
                          {Object.entries(votingResults.distribution).map(
                            ([value, count]) => (
                              <div
                                key={value}
                                className="flex items-center gap-3"
                              >
                                <span className="w-8 md:w-12 text-right font-semibold text-sm md:text-base">
                                  {value}
                                </span>
                                <div className="flex-1 bg-gray-700 rounded-full h-6 md:h-8 relative overflow-hidden">
                                  <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                    style={{
                                      width: `${(count / gameState.players.length) * 100}%`,
                                    }}
                                  >
                                    <span className="text-sm font-semibold">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        {/* Average */}
                        {gameState.game?.show_average &&
                          votingResults.average !== null && (
                            <div className="text-center py-2 bg-gray-700 rounded-lg mb-2">
                              <span className="text-sm text-gray-400">
                                Average:{" "}
                              </span>
                              <span className="text-xl font-bold">
                                {votingResults.average.toFixed(1)}
                              </span>
                            </div>
                          )}

                        {/* Agreement Meter */}
                        <div className="text-center">
                          <div className="inline-flex items-center gap-3 bg-gray-700 rounded-lg px-4 py-2">
                            <span className="text-2xl">🤖</span>
                            <div>
                              <div className="text-sm text-gray-400">
                                Agreement
                              </div>
                              <div className="text-lg font-bold">
                                {votingResults.agreement}%
                              </div>
                            </div>
                          </div>
                          {votingResults.agreement === 100 && (
                            <p className="text-green-400 text-sm mt-2">
                              🎉 Yeah! You reached full consensus.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleStartNewVoting}
                      className="px-6 md:px-8 py-3 md:py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-lg md:text-xl font-semibold transition-colors"
                    >
                      Start new voting
                    </button>
                  </div>
                )}
              </div>

              {/* Players arranged in oval */}
              {gameState.players.map((player, index) => {
                const angle = (index / gameState.players.length) * 2 * Math.PI;
                const x = 50 + 40 * Math.cos(angle);
                const y = 50 + 35 * Math.sin(angle);

                return (
                  <div
                    key={player.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {/* Card with flip animation */}
                      <div className="relative w-16 h-24 md:w-20 md:h-28 perspective-1000">
                        <div
                          className={`w-full h-full transition-transform duration-500 transform-style-3d ${
                            gameState.votingPhase === VotingPhase.REVEALED &&
                            player.has_voted
                              ? "rotate-y-180"
                              : ""
                          }`}
                        >
                          {/* Card Front (face-down) */}
                          <div
                            className={`absolute inset-0 rounded-lg border-2 flex items-center justify-center text-2xl font-bold backface-hidden ${
                              player.has_voted
                                ? "bg-blue-600 border-blue-400"
                                : "bg-gray-700 border-gray-500"
                            }`}
                          >
                            {player.has_voted ? "🂠" : ""}
                          </div>

                          {/* Card Back (revealed value) */}
                          {gameState.votingPhase === VotingPhase.REVEALED && (
                            <div className="absolute inset-0 rounded-lg border-2 bg-green-600 border-green-400 flex items-center justify-center text-2xl font-bold backface-hidden rotate-y-180">
                              {votingResults?.votes.find(
                                (v) => v.user_id === player.id,
                              )?.card_value || "?"}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Avatar & Name */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-600 flex items-center justify-center text-xs md:text-sm font-semibold">
                          {player.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs md:text-sm mt-1 max-w-[80px] truncate">
                          {player.display_name}
                        </span>
                        {player.is_facilitator && (
                          <span className="text-xs text-yellow-400">★</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card Deck Selector */}
          <div className="h-28 md:h-32 bg-[#0f1729] border-t border-gray-700 px-4 md:px-8 flex items-center gap-2 md:gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="flex gap-2 md:gap-3 mx-auto">
              {gameState.game.deck.values.map((value) => (
                <button
                  key={value}
                  onClick={() => handleCardSelect(value)}
                  className={`flex-shrink-0 w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 flex items-center justify-center text-lg md:text-xl font-bold transition-all hover:scale-105 active:scale-95 ${
                    gameState.selectedCard === value
                      ? "bg-blue-600 border-blue-400 scale-105"
                      : "bg-gray-700 border-gray-500 hover:border-gray-400"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Issues Panel (Right Sidebar on desktop, overlay on mobile) */}
        {showIssuesPanel && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowIssuesPanel(false)}
            />

            {/* Issues Panel */}
            <div className="fixed md:relative right-0 top-0 bottom-0 w-80 md:w-80 bg-[#0f1729] border-l border-gray-700 flex flex-col z-50 md:z-auto">
              {/* Panel Header */}
              <div className="h-16 px-4 flex items-center justify-between border-b border-gray-700">
                <h2 className="text-lg font-semibold">Issues</h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-700 rounded transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowIssuesPanel(false)}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Issues List */}
              <div className="flex-1 overflow-y-auto p-4">
                {gameState.issues.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <p>No issues yet</p>
                    <p className="text-sm mt-2">
                      Click + to add your first issue
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {gameState.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-sm">{issue.title}</span>
                          <span className="text-xs text-gray-400">
                            {issue.status === "voted" && issue.final_estimate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          gameId={gameId}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Game Settings Modal */}
      <GameSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        game={gameState.game}
        players={gameState.players}
        currentUserId={gameState.currentUser?.id || null}
        onUpdateSettings={updateGameSettings}
        onTransferFacilitator={transferFacilitator}
      />

      {/* Voting History Modal */}
      <VotingHistory
        gameId={gameId}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      {/* Timer Modal */}
      <Timer
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        remainingSeconds={wsGameState?.timer?.remaining_seconds ?? null}
        isRunning={wsGameState?.timer?.is_running ?? false}
        onStart={(durationSeconds) => {
          startTimer(durationSeconds);
          setShowTimerModal(false);
        }}
        onPause={pauseTimer}
        onStop={stopTimer}
        timeIssuesEnabled={timeIssuesEnabled}
        onToggleTimeIssues={setTimeIssuesEnabled}
      />
    </div>
  );
}

// Made with Bob
