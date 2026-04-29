"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  History,
  ListChecks,
  Plus,
  Settings,
  Share2,
  TimerReset,
  Trophy,
  Users,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  GamePermission,
  GameState,
  Issue,
  VotingPhase,
  Player,
} from "@/types/game.types";
import { useGameSocket, VotingResults } from "@/hooks/useGameSocket";
import Timer from "@/components/Timer";
import InviteModal from "@/components/InviteModal";
import VotingHistory from "@/components/VotingHistory";
import GameSettingsModal from "@/components/GameSettingsModal";
import GuestModeModal from "@/components/GuestModeModal";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  PageShell,
  Textarea,
} from "@/components/ui";

const formatTimer = (totalSeconds?: number | null) => {
  if (totalSeconds === null || totalSeconds === undefined) {
    return "--:--";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatSpeed = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) {
    return "--";
  }

  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`;
};

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
  const [showGuestJoinModal, setShowGuestJoinModal] = useState(false);
  const [showAddIssueForm, setShowAddIssueForm] = useState(false);
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
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [customEstimate, setCustomEstimate] = useState("");
  const [estimateStatus, setEstimateStatus] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const response = await apiFetch("/api/v1/auth/me");

        if (!response.ok) {
          setGameState((prev) => ({ ...prev, isLoading: false }));
          setShowGuestJoinModal(true);
          return;
        }

        const data = await response.json();
        setCurrentUserId(data.user?.userId ?? null);
        setIsAuthenticated(true);
      } catch (_error) {
        setGameState((prev) => ({ ...prev, isLoading: false }));
        setShowGuestJoinModal(true);
      }
    };

    void bootstrapSession();
  }, []);

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
    addIssue,
    updateIssue,
  } = useGameSocket({
    gameId,
    isAuthenticated,
    onError: (error) => {
      setActionError(error);
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
      setActionError(null);

      if (!gameState.game?.show_countdown) {
        setVotingResults(results);
        return;
      }

      setVotingResults(null);
      setShowCountdown(true);
      setCountdownNumber(3);

      let nextCount = 3;
      const countdownInterval = window.setInterval(() => {
        nextCount -= 1;
        setCountdownNumber(nextCount);

        if (nextCount <= 0) {
          window.clearInterval(countdownInterval);
          setVotingResults(results);
          window.setTimeout(() => setShowCountdown(false), 220);
        }
      }, 700);
    },
    onNewRound: (_roundId, issueId) => {
      setVotingResults(null);
      setActionError(null);
      setGameState((prev) => ({
        ...prev,
        currentIssue: prev.issues.find((issue) => issue.id === issueId) || null,
        selectedCard: null,
        votingPhase: VotingPhase.WAITING,
      }));

      if (timeIssuesEnabled && wsGameState?.timer) {
        startTimer(wsGameState.timer.duration_seconds);
      }
    },
    onTimerTick: (remainingSeconds) => {
      if (remainingSeconds === 60 && !timerAlert) {
        setTimerAlert(true);
      } else if (remainingSeconds > 60 && timerAlert) {
        setTimerAlert(false);
      }
    },
    onTimerEnded: () => {
      setTimerAlert(false);
    },
  });

  useEffect(() => {
    if (!wsGameState) {
      return;
    }

    const players: Player[] = wsGameState.players.map((player) => ({
      id: player.user_id,
      display_name: player.display_name,
      avatar_url: player.avatar_url,
      is_facilitator: player.user_id === wsGameState.game.facilitator_id,
      is_spectator: player.is_spectator,
      has_voted: player.has_voted || false,
      card_value: null,
      is_online: player.is_online,
      can_vote: player.can_vote,
    }));

    let phase = VotingPhase.WAITING;
    if (wsGameState.current_round) {
      if (wsGameState.current_round.is_revealed) {
        phase = VotingPhase.REVEALED;
      } else if (wsGameState.current_round.issue_id && gameState.selectedCard) {
        phase = VotingPhase.VOTING;
      }
    }

    setGameState((prev) => ({
      ...prev,
      game: wsGameState.game,
      players,
      issues: wsGameState.issues || prev.issues,
      currentIssue: wsGameState.current_round?.issue_id
        ? (wsGameState.issues || prev.issues).find(
            (issue) => issue.id === wsGameState.current_round?.issue_id,
          ) || null
        : null,
      currentUser:
        players.find((player) => player.id === currentUserId) || null,
      votingPhase: phase,
      isLoading: false,
    }));
  }, [wsGameState, gameState.selectedCard, currentUserId]);

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

  const activeRound = wsGameState?.current_round || null;
  const activeIssue = gameState.currentIssue;
  const eligiblePlayers = gameState.players.filter(
    (player) => !player.is_spectator && player.can_vote !== false,
  );
  const votedCount = eligiblePlayers.filter(
    (player) => player.has_voted,
  ).length;
  const allPlayersVoted =
    Boolean(activeRound?.issue_id) &&
    eligiblePlayers.length > 0 &&
    eligiblePlayers.every((player) => player.has_voted);
  const currentUserCanVote =
    Boolean(gameState.currentUser) &&
    !gameState.currentUser?.is_spectator &&
    gameState.currentUser?.can_vote !== false;
  const currentUserCanReveal =
    Boolean(gameState.currentUser?.is_facilitator) ||
    gameState.game?.who_can_reveal === GamePermission.ALL_PLAYERS;
  const currentUserIsFacilitator = Boolean(
    gameState.currentUser?.is_facilitator,
  );
  const canManageIssues =
    currentUserIsFacilitator ||
    gameState.game?.who_can_manage_issues === GamePermission.ALL_PLAYERS;
  const canPickCards =
    isConnected &&
    currentUserCanVote &&
    Boolean(activeRound?.issue_id) &&
    !activeRound?.is_revealed;
  const canRevealCards =
    canPickCards &&
    allPlayersVoted &&
    currentUserCanReveal &&
    !gameState.game?.auto_reveal;
  const resultDistribution = votingResults?.distribution ?? {};
  const displayedEstimate =
    activeIssue?.final_estimate || votingResults?.final_estimate || null;
  const currentVote = votingResults?.votes.find(
    (vote) => vote.user_id === currentUserId,
  );
  const timerRemaining = wsGameState?.timer?.remaining_seconds ?? null;
  const timerRunning = wsGameState?.timer?.is_running ?? false;

  const nextPendingIssue = useMemo(
    () => gameState.issues.find((issue) => issue.status !== "voted") || null,
    [gameState.issues],
  );

  const issueCounts = useMemo(
    () => ({
      total: gameState.issues.length,
      voted: gameState.issues.filter((issue) => issue.status === "voted")
        .length,
      pending: gameState.issues.filter((issue) => issue.status !== "voted")
        .length,
    }),
    [gameState.issues],
  );

  useEffect(() => {
    if (!votingResults) {
      setCustomEstimate("");
      setEstimateStatus(null);
      return;
    }

    setCustomEstimate(displayedEstimate || "");
    setEstimateStatus(null);
  }, [votingResults, displayedEstimate]);

  const handleAddIssue = (event: React.FormEvent) => {
    event.preventDefault();

    const title = newIssueTitle.trim();
    if (!title) {
      return;
    }

    if (!isConnected) {
      setActionError("Connect to the game before adding an issue");
      return;
    }

    if (!canManageIssues) {
      setActionError("Only the facilitator can manage issues in this game");
      return;
    }

    addIssue(title);
    setNewIssueTitle("");
    setShowAddIssueForm(false);
    setActionError(null);
  };

  const handleVoteIssue = (issue: Issue) => {
    if (!isConnected) {
      setActionError("Connect to the game before starting a vote");
      return;
    }

    if (activeRound && !activeRound.is_revealed) {
      setActionError("Reveal the current issue before starting another vote");
      return;
    }

    if (issue.status === "voted") {
      setActionError("This issue has already been voted");
      return;
    }

    if (!canManageIssues) {
      setActionError("Only the facilitator can start issue voting");
      return;
    }

    setVotingResults(null);
    setActionError(null);
    startNewRound(issue.id);
  };

  const handleCardSelect = (value: string) => {
    if (!canPickCards) {
      setActionError(
        gameState.currentUser?.can_vote === false
          ? "You joined mid-round. Wait for the next issue."
          : "Pick an issue before voting",
      );
      return;
    }

    setGameState((prev) => ({
      ...prev,
      error: null,
      selectedCard: value,
      votingPhase: VotingPhase.VOTING,
    }));

    submitVote(value);
  };

  const handleRevealCards = () => {
    if (!allPlayersVoted) {
      setActionError("Wait for every eligible player to vote");
      return;
    }

    if (!currentUserCanReveal) {
      setActionError("You don't have permission to reveal cards");
      return;
    }

    setActionError(null);
    revealCards();
  };

  const handlePickNextIssue = () => {
    setShowIssuesPanel(true);
    if (nextPendingIssue) {
      setActionError(null);
    }
  };

  const handleSaveEstimate = () => {
    if (!currentUserIsFacilitator || !activeIssue || !votingResults) {
      return;
    }

    const nextEstimate =
      customEstimate.trim() || votingResults.final_estimate || null;

    updateIssue({
      id: activeIssue.id,
      title: activeIssue.title,
      status: activeIssue.status,
      final_estimate: nextEstimate,
      display_order: activeIssue.display_order,
    });

    setVotingResults((prev) =>
      prev ? { ...prev, final_estimate: nextEstimate } : prev,
    );
    setEstimateStatus("Estimate saved");
    setActionError(null);
  };

  if (isReconnecting) {
    return (
      <PageShell className="flex items-center justify-center transition-colors">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <TimerReset className="h-5 w-5 animate-spin" />
          Reconnecting to game...
        </div>
      </PageShell>
    );
  }

  if (gameState.isLoading) {
    return (
      <PageShell className="flex items-center justify-center transition-colors">
        <div className="text-lg font-semibold">Loading game...</div>
      </PageShell>
    );
  }

  if (showGuestJoinModal && !isAuthenticated) {
    return (
      <PageShell>
        <GuestModeModal
          isOpen={showGuestJoinModal}
          onClose={() => router.push("/")}
          mode="join"
          gameId={gameId}
        />
      </PageShell>
    );
  }

  if (gameState.error || !gameState.game) {
    return (
      <PageShell className="flex items-center justify-center transition-colors px-6">
        <Alert variant="danger" className="max-w-md text-center text-base">
          {gameState.error || "Game not found"}
        </Alert>
      </PageShell>
    );
  }

  return (
    <PageShell className="transition-colors">
      <nav
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--bg-primary) 84%, transparent)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="game-dropdown-container relative min-w-0">
            <button
              onClick={() => setShowGameDropdown((prev) => !prev)}
              className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:opacity-80"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                  color: "white",
                }}
              >
                <ListChecks className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-semibold md:text-lg">
                    {gameState.game.name}
                  </h1>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </div>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {isConnected ? "Live room" : "Connecting"} ·{" "}
                  {eligiblePlayers.length} eligible
                </p>
              </div>
            </button>

            {showGameDropdown && (
              <div
                className="absolute left-0 top-full mt-2 w-60 overflow-hidden rounded-lg border shadow-theme-strong"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <button
                  onClick={() => {
                    setShowGameDropdown(false);
                    setShowSettingsModal(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-80"
                >
                  <Settings className="h-4 w-4" />
                  Game Settings
                </button>
                <button
                  onClick={() => {
                    setShowGameDropdown(false);
                    setShowHistoryModal(true);
                  }}
                  className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:opacity-80"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <History className="h-4 w-4" />
                  Voting History
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="subtle"
              onClick={() => setShowTimerModal(true)}
              className="hidden sm:inline-flex"
              style={{
                backgroundColor: timerRunning
                  ? "color-mix(in srgb, var(--primary) 18%, var(--surface-secondary))"
                  : "var(--surface-secondary)",
                borderColor: timerAlert
                  ? "var(--warning)"
                  : "var(--border-color)",
                color: timerAlert ? "var(--warning)" : "var(--text-primary)",
              }}
            >
              <Clock3 className="h-4 w-4" />
              <span className="font-mono">{formatTimer(timerRemaining)}</span>
            </Button>
            <Button
              type="button"
              onClick={() => setShowInviteModal(true)}
              size="sm"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
            <IconButton
              onClick={() => setShowIssuesPanel((prev) => !prev)}
              aria-label="Toggle issues panel"
              title="Toggle issues panel"
              variant="secondary"
              style={{
                backgroundColor: showIssuesPanel
                  ? "var(--surface-accent)"
                  : "var(--surface-secondary)",
                borderColor: showIssuesPanel
                  ? "var(--primary)"
                  : "var(--border-color)",
                color: showIssuesPanel
                  ? "var(--primary)"
                  : "var(--text-secondary)",
              }}
            >
              <ListChecks className="h-5 w-5" />
            </IconButton>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main
        className={`grid min-h-[calc(100vh-4rem)] ${
          showIssuesPanel ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "grid-cols-1"
        }`}
      >
        <section className="flex min-w-0 flex-col">
          <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:p-6">
            <div className="min-w-0 space-y-4">
              <div
                className="rounded-lg border p-4 shadow-theme"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--surface-primary) 88%, transparent)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Current issue
                    </p>
                    <h2 className="mt-1 max-w-3xl truncate text-xl font-semibold">
                      {activeIssue?.title || "Pick an issue to begin voting"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full border px-3 py-1 text-sm font-medium"
                      style={{
                        borderColor: isConnected
                          ? "var(--success)"
                          : "var(--warning)",
                        color: isConnected
                          ? "var(--success)"
                          : "var(--warning)",
                      }}
                    >
                      {isConnected ? "Connected" : "Connecting"}
                    </span>
                    <span
                      className="rounded-full border px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: "var(--surface-secondary)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {votedCount}/{eligiblePlayers.length} voted
                    </span>
                  </div>
                </div>

                <div
                  className="relative mx-auto aspect-video min-h-90 max-w-6xl overflow-hidden rounded-lg border p-6"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-secondary)",
                  }}
                >
                  <div
                    className="absolute left-1/2 top-1/2 h-[54%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--primary) 18%, var(--surface-accent)) 0%, var(--surface-secondary) 64%, var(--surface-primary) 100%)",
                      borderColor: "var(--border-strong)",
                      boxShadow:
                        "inset 0 1px 0 color-mix(in srgb, white 12%, transparent), 0 28px 90px -60px var(--primary)",
                    }}
                  />

                  {showCountdown && countdownNumber > 0 && (
                    <div
                      className="absolute inset-0 z-20 flex items-center justify-center"
                      style={{
                        backgroundColor:
                          "color-mix(in srgb, var(--bg-primary) 18%, transparent)",
                      }}
                    >
                      <div
                        className="rounded-full border px-5 py-3 text-lg font-semibold shadow-theme-strong backdrop-blur"
                        style={{
                          borderColor: "var(--primary)",
                          color: "var(--primary)",
                          backgroundColor: "var(--surface-primary)",
                        }}
                      >
                        Revealing in {countdownNumber}...
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
                    {gameState.votingPhase === VotingPhase.REVEALED &&
                    votingResults ? (
                      <div
                        className="w-full max-w-lg rounded-lg border p-4 text-center shadow-theme"
                        style={{
                          backgroundColor: "var(--surface-primary)",
                          borderColor: "var(--border-color)",
                        }}
                      >
                        <div className="mb-4 flex items-center justify-center gap-2">
                          <BarChart3
                            className="h-5 w-5"
                            style={{ color: "var(--primary)" }}
                          />
                          <h3 className="text-lg font-semibold">
                            Voting statistics
                          </h3>
                        </div>

                        <div className="space-y-2">
                          {Object.entries(resultDistribution).map(
                            ([value, count]) => (
                              <div
                                key={value}
                                className="grid grid-cols-[40px_1fr_28px] items-center gap-3 text-sm"
                              >
                                <span className="text-right font-semibold">
                                  {value}
                                </span>
                                <div
                                  className="h-2 overflow-hidden rounded-full"
                                  style={{
                                    backgroundColor: "var(--surface-tertiary)",
                                  }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.max(
                                        8,
                                        (count /
                                          Math.max(
                                            1,
                                            votingResults.total_voters,
                                          )) *
                                          100,
                                      )}%`,
                                      background:
                                        "linear-gradient(90deg, var(--primary), var(--accent))",
                                    }}
                                  />
                                </div>
                                <span style={{ color: "var(--text-tertiary)" }}>
                                  {count}
                                </span>
                              </div>
                            ),
                          )}
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <div
                            className="rounded-lg border p-3"
                            style={{
                              borderColor: "var(--border-subtle)",
                              backgroundColor: "var(--surface-secondary)",
                            }}
                          >
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Estimate
                            </p>
                            <p className="text-lg font-semibold">
                              {displayedEstimate || "-"}
                            </p>
                          </div>
                          {gameState.game.show_average && (
                            <div
                              className="rounded-lg border p-3"
                              style={{
                                borderColor: "var(--border-subtle)",
                                backgroundColor: "var(--surface-secondary)",
                              }}
                            >
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                              >
                                Average
                              </p>
                              <p className="text-lg font-semibold">
                                {typeof votingResults.average === "number"
                                  ? votingResults.average.toFixed(1)
                                  : "-"}
                              </p>
                            </div>
                          )}
                          <div
                            className="rounded-lg border p-3"
                            style={{
                              borderColor: "var(--border-subtle)",
                              backgroundColor: "var(--surface-secondary)",
                            }}
                          >
                            <p
                              className="text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Agreement
                            </p>
                            <p className="text-lg font-semibold">
                              {votingResults.agreement}%
                            </p>
                          </div>
                        </div>

                        {currentUserIsFacilitator && activeIssue && (
                          <div
                            className="mt-4 rounded-lg border p-3 text-left"
                            style={{
                              backgroundColor: "var(--surface-secondary)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            <label
                              className="mb-2 block text-xs font-medium"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Facilitator estimate
                            </label>
                            <div className="flex gap-2">
                              <Input
                                value={customEstimate}
                                onChange={(event) => {
                                  setCustomEstimate(event.target.value);
                                  setEstimateStatus(null);
                                }}
                                placeholder={
                                  votingResults.final_estimate || "Calculated"
                                }
                                maxLength={10}
                                className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
                              />
                              <Button
                                type="button"
                                onClick={handleSaveEstimate}
                                size="sm"
                              >
                                Save
                              </Button>
                            </div>
                            <p
                              className="mt-2 text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Empty uses the calculated estimate.
                              {estimateStatus ? ` ${estimateStatus}.` : ""}
                            </p>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={handlePickNextIssue}
                          className="mt-4"
                        >
                          Pick next issue
                        </Button>
                      </div>
                    ) : (
                      <div className="max-w-md text-center">
                        <div
                          className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg border"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--surface-primary)",
                            color: "var(--primary)",
                          }}
                        >
                          <Users className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-semibold">
                          {activeIssue
                            ? allPlayersVoted
                              ? gameState.game.auto_reveal
                                ? "Revealing cards"
                                : "Ready to reveal"
                              : currentUserCanVote
                                ? "Pick your card"
                                : "Round in progress"
                            : issueCounts.total === 0
                              ? "Add your first issue"
                              : "Choose an issue"}
                        </h3>
                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {activeIssue
                            ? currentUserCanVote
                              ? `${votedCount}/${eligiblePlayers.length} eligible players have voted.`
                              : "You joined after this round started. You can vote on the next issue."
                            : "Select Vote this issue in the sidebar to open the table for cards."}
                        </p>
                        {canRevealCards && (
                          <Button
                            type="button"
                            onClick={handleRevealCards}
                            className="mt-4"
                          >
                            Reveal cards
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {gameState.players.map((player, index) => {
                    const angle =
                      (index / Math.max(1, gameState.players.length)) *
                      2 *
                      Math.PI;
                    const x = 50 + 42 * Math.cos(angle);
                    const y = 50 + 36 * Math.sin(angle);
                    const revealedVote = votingResults?.votes.find(
                      (vote) => vote.user_id === player.id,
                    );
                    const isCurrentUser = player.id === currentUserId;

                    return (
                      <div
                        key={player.id}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className="flex h-20 w-14 items-center justify-center rounded-lg border text-lg font-bold shadow-theme transition-transform"
                            style={{
                              backgroundColor: revealedVote
                                ? "color-mix(in srgb, var(--success) 18%, var(--surface-primary))"
                                : player.has_voted
                                  ? "color-mix(in srgb, var(--primary) 18%, var(--surface-primary))"
                                  : "var(--surface-primary)",
                              borderColor: revealedVote
                                ? "var(--success)"
                                : player.has_voted
                                  ? "var(--primary)"
                                  : "var(--border-color)",
                              color: revealedVote
                                ? "var(--success)"
                                : "var(--text-primary)",
                            }}
                          >
                            {revealedVote?.card_value ||
                              (player.has_voted ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                ""
                              ))}
                          </div>
                          <div
                            className="flex max-w-32 flex-col items-center rounded-lg border px-2 py-1 text-center shadow-theme"
                            style={{
                              backgroundColor: "var(--surface-primary)",
                              borderColor: isCurrentUser
                                ? "var(--primary)"
                                : "var(--border-color)",
                            }}
                          >
                            <span className="max-w-24 truncate text-xs font-semibold">
                              {player.display_name}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {player.is_facilitator
                                ? "Facilitator"
                                : player.can_vote === false
                                  ? "Next round"
                                  : player.has_voted
                                    ? "Voted"
                                    : "Waiting"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-lg border p-3 shadow-theme"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Voting deck</p>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {gameState.game.deck.name}
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {gameState.game.deck.values.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleCardSelect(value)}
                      disabled={!canPickCards}
                      title={
                        canPickCards
                          ? `Vote ${value}`
                          : "Pick an issue before voting"
                      }
                      className="flex h-16 min-w-12 shrink-0 items-center justify-center rounded-lg border text-base font-bold transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        backgroundColor:
                          gameState.selectedCard === value
                            ? "var(--surface-accent)"
                            : "var(--surface-secondary)",
                        borderColor:
                          gameState.selectedCard === value
                            ? "var(--primary)"
                            : "var(--border-color)",
                        color:
                          gameState.selectedCard === value
                            ? "var(--primary)"
                            : "var(--text-primary)",
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div
                className="rounded-lg border p-4 shadow-theme"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Trophy
                    className="h-4 w-4"
                    style={{ color: "var(--primary)" }}
                  />
                  <h3 className="font-semibold">Round stats</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Fastest voter
                    </p>
                    <p className="font-semibold">
                      {votingResults?.fastest_voter?.display_name || "-"}
                      {votingResults?.fastest_voter && (
                        <span
                          className="ml-2 text-sm"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatSpeed(votingResults.fastest_voter.seconds)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Slowest voter
                    </p>
                    <p className="font-semibold">
                      {votingResults?.slowest_voter?.display_name || "-"}
                      {votingResults?.slowest_voter && (
                        <span
                          className="ml-2 text-sm"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatSpeed(votingResults.slowest_voter.seconds)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Your vote
                    </p>
                    <p className="font-semibold">
                      {currentVote?.card_value || gameState.selectedCard || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-lg border p-4 shadow-theme"
                style={{
                  backgroundColor: "var(--surface-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Clock3
                    className="h-4 w-4"
                    style={{
                      color: timerAlert ? "var(--warning)" : "var(--primary)",
                    }}
                  />
                  <h3 className="font-semibold">Timer</h3>
                </div>
                <div className="font-mono text-4xl font-bold">
                  {formatTimer(timerRemaining)}
                </div>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {timerRunning
                    ? "Running"
                    : timerRemaining
                      ? "Paused"
                      : "Not started"}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowTimerModal(true)}
                  className="mt-4 w-full"
                >
                  Timer controls
                </Button>
              </div>
            </aside>
          </div>
        </section>

        {showIssuesPanel && (
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-[min(92vw,380px)] flex-col border-l lg:static lg:z-auto lg:w-auto"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <div
              className="flex min-h-16 items-center justify-between border-b px-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div>
                <h2 className="text-lg font-semibold">Issues</h2>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {issueCounts.voted}/{issueCounts.total} completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <IconButton
                  onClick={() => {
                    if (!canManageIssues) {
                      setActionError(
                        "Only the facilitator can manage issues in this game",
                      );
                      return;
                    }

                    setShowAddIssueForm((prev) => !prev);
                    setActionError(null);
                  }}
                  aria-label="Add issue"
                  title={
                    canManageIssues
                      ? "Add issue"
                      : "Only the facilitator can manage issues"
                  }
                  variant="secondary"
                  style={{
                    backgroundColor: canManageIssues
                      ? "var(--surface-secondary)"
                      : "var(--surface-tertiary)",
                    borderColor: "var(--border-color)",
                    color: canManageIssues
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  <Plus className="h-5 w-5" />
                </IconButton>
                <IconButton
                  onClick={() => setShowIssuesPanel(false)}
                  aria-label="Close issues"
                  title="Close issues"
                >
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!canManageIssues && (
                <Alert variant="warning" className="mb-3">
                  Only the facilitator can add issues or start issue voting.
                </Alert>
              )}

              {actionError && (
                <Alert variant="danger" className="mb-3">
                  {actionError}
                </Alert>
              )}

              {showAddIssueForm && (
                <form onSubmit={handleAddIssue} className="mb-4 space-y-3">
                  <Textarea
                    value={newIssueTitle}
                    onChange={(event) => setNewIssueTitle(event.target.value)}
                    maxLength={500}
                    rows={4}
                    autoFocus
                    placeholder="Write an issue or user story"
                    className="w-full resize-none rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={
                        !newIssueTitle.trim() ||
                        !isConnected ||
                        !canManageIssues
                      }
                      className="flex-1"
                    >
                      Add issue
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowAddIssueForm(false);
                        setNewIssueTitle("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {gameState.issues.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title="No issues yet"
                  description="Use the add button to build the voting queue."
                  className="mt-8"
                />
              ) : (
                <div className="space-y-3">
                  {gameState.issues.map((issue) => {
                    const isActiveIssue = activeIssue?.id === issue.id;
                    const isRoundInProgress = Boolean(
                      activeRound && !activeRound.is_revealed,
                    );
                    const isIssueVoted = issue.status === "voted";
                    const canStartIssueVote =
                      isConnected &&
                      canManageIssues &&
                      !isIssueVoted &&
                      !isRoundInProgress;

                    return (
                      <div
                        key={issue.id}
                        className="rounded-lg border p-4 shadow-theme"
                        style={{
                          backgroundColor: isActiveIssue
                            ? "var(--surface-accent)"
                            : "var(--surface-primary)",
                          borderColor: isActiveIssue
                            ? "var(--primary)"
                            : "var(--border-color)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 text-sm font-semibold leading-5">
                            {issue.title}
                          </h3>
                          <Badge
                            variant={
                              issue.status === "voting"
                                ? "info"
                                : isIssueVoted
                                  ? "success"
                                  : "neutral"
                            }
                            className="shrink-0 capitalize"
                          >
                            {issue.status}
                          </Badge>
                        </div>

                        {isIssueVoted && (
                          <div
                            className="mt-3 rounded-lg border px-3 py-2 text-sm"
                            style={{
                              backgroundColor: "var(--surface-secondary)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            Estimate:{" "}
                            <span className="font-semibold">
                              {issue.final_estimate || "No consensus"}
                            </span>
                          </div>
                        )}

                        <Button
                          type="button"
                          onClick={() => handleVoteIssue(issue)}
                          disabled={!canStartIssueVote}
                          variant={canStartIssueVote ? "primary" : "subtle"}
                          className="mt-3 w-full"
                        >
                          {isIssueVoted
                            ? "Voted"
                            : isActiveIssue && isRoundInProgress
                              ? "Voting now"
                              : !canManageIssues
                                ? "Facilitator only"
                                : isRoundInProgress
                                  ? "Finish current issue"
                                  : "Vote this issue"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}
      </main>

      {showInviteModal && (
        <InviteModal
          gameId={gameId}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <GameSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        game={gameState.game}
        players={gameState.players}
        currentUserId={gameState.currentUser?.id || null}
        onUpdateSettings={updateGameSettings}
        onTransferFacilitator={transferFacilitator}
      />

      <VotingHistory
        gameId={gameId}
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <Timer
        isOpen={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        remainingSeconds={timerRemaining}
        isRunning={timerRunning}
        onStart={(durationSeconds: number) => {
          startTimer(durationSeconds);
          setShowTimerModal(false);
        }}
        onPause={pauseTimer}
        onStop={stopTimer}
        timeIssuesEnabled={timeIssuesEnabled}
        onToggleTimeIssues={setTimeIssuesEnabled}
      />
    </PageShell>
  );
}

// Made with Bob
