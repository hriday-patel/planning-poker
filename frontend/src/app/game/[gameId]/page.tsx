"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogOut, Pencil, TimerReset } from "lucide-react";
import {
  GamePermission,
  GameState,
  Issue,
  JiraDuplicateAction,
  JiraImportCandidate,
  JiraImportConfirmResponse,
  JiraImportPreviewResponse,
  JiraImportRequest,
  VotingPhase,
  Player,
} from "@/types/game.types";
import { useGameSocket, VotingResults } from "@/hooks/useGameSocket";
import Timer from "@/components/Timer";
import InviteModal from "@/components/InviteModal";
import VotingHistory from "@/components/VotingHistory";
import GameSettingsModal from "@/components/GameSettingsModal";
import GuestModeModal from "@/components/GuestModeModal";
import JiraImportModal from "@/components/JiraImportModal";
import GameTable from "@/components/game/GameTable";
import GameTopBar from "@/components/game/GameTopBar";
import IssuesPanel from "@/components/game/IssuesPanel";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Button,
  Field,
  ModalFooter,
  ModalHeader,
  ModalShell,
  PageShell,
  Select,
  Textarea,
} from "@/components/ui";

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
  const [showJiraImportModal, setShowJiraImportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(
    null,
  );
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [timeIssuesEnabled, setTimeIssuesEnabled] = useState(false);
  const [timerAlert, setTimerAlert] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueError, setEditIssueError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isImportingIssues, setIsImportingIssues] = useState(false);
  const [isImportingJira, setIsImportingJira] = useState(false);
  const [customEstimate, setCustomEstimate] = useState("");
  const [estimateStatus, setEstimateStatus] = useState<string | null>(null);
  const lastRevealedRoundKeyRef = useRef<string | null>(null);
  const [selectedLeaveFacilitator, setSelectedLeaveFacilitator] = useState("");
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

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
    deleteIssue,
    mergeImportedIssues,
    setSpectatorMode,
    leaveGame,
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
      is_round_observer: player.is_round_observer,
      observer_reason: player.observer_reason,
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
    !gameState.currentUser?.is_round_observer &&
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
  const currentUserCanToggleSpectator =
    currentUserIsFacilitator ||
    gameState.game?.who_can_toggle_spectator === GamePermission.ALL_PLAYERS;
  const canPickCards =
    isConnected &&
    currentUserCanVote &&
    Boolean(activeRound?.issue_id) &&
    !activeRound?.is_revealed;
  const canRevealCards =
    isConnected &&
    Boolean(activeRound?.issue_id) &&
    !activeRound?.is_revealed &&
    allPlayersVoted &&
    currentUserCanReveal &&
    !gameState.game?.auto_reveal;
  const displayedEstimate =
    activeIssue?.final_estimate || votingResults?.final_estimate || null;
  const timerRemaining = wsGameState?.timer?.remaining_seconds ?? null;
  const timerRunning = wsGameState?.timer?.is_running ?? false;
  const otherPlayers = useMemo(
    () => gameState.players.filter((player) => player.id !== currentUserId),
    [currentUserId, gameState.players],
  );
  const pendingIssues = useMemo(
    () => gameState.issues.filter((issue) => issue.status === "pending"),
    [gameState.issues],
  );

  const nextPendingIssue = useMemo(
    () => gameState.issues.find((issue) => issue.status === "pending") || null,
    [gameState.issues],
  );

  const issueCounts = useMemo(
    () => ({
      total: gameState.issues.length,
      voted: gameState.issues.filter((issue) => issue.status === "voted")
        .length,
      pending: gameState.issues.filter((issue) => issue.status === "pending")
        .length,
    }),
    [gameState.issues],
  );

  useEffect(() => {
    const revealedRoundKey = votingResults
      ? activeRound?.id || activeIssue?.id || "revealed"
      : null;

    if (!revealedRoundKey) {
      lastRevealedRoundKeyRef.current = null;
      setCustomEstimate("");
      setEstimateStatus(null);
      return;
    }

    if (lastRevealedRoundKeyRef.current === revealedRoundKey) {
      return;
    }

    lastRevealedRoundKeyRef.current = revealedRoundKey;
    setCustomEstimate(displayedEstimate || "");
    setEstimateStatus(null);
  }, [activeIssue?.id, activeRound?.id, displayedEstimate, votingResults]);

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

    if (showAddIssueForm && newIssueTitle.trim()) {
      setShowIssuesPanel(true);
      setActionError(
        "Complete adding this issue or cancel it before voting another issue.",
      );
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
      setActionError("Issue voting is facilitator-only in this game");
      return;
    }

    setVotingResults(null);
    setActionError(null);
    startNewRound(issue.id);
  };

  const handleDeletePendingIssue = (issue: Issue) => {
    if (!isConnected) {
      setActionError("Connect to the game before removing an issue");
      return;
    }

    if (!canManageIssues) {
      setActionError("Issue management is facilitator-only in this game");
      return;
    }

    if (issue.status !== "pending") {
      setActionError("Only pending issues can be removed");
      return;
    }

    deleteIssue(issue.id);
    setActionError(null);
  };

  const handleOpenEditIssue = (issue: Issue) => {
    if (!canManageIssues) {
      setShowIssuesPanel(true);
      setActionError("Issue management is facilitator-only in this game");
      return;
    }

    if (issue.status !== "pending") {
      setActionError("Only pending issues can be edited");
      return;
    }

    setEditingIssue(issue);
    setEditIssueTitle(issue.title);
    setEditIssueError(null);
    setActionError(null);
  };

  const handleCloseEditIssue = () => {
    setEditingIssue(null);
    setEditIssueTitle("");
    setEditIssueError(null);
  };

  const handleSaveEditedIssue = (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingIssue) {
      return;
    }

    const title = editIssueTitle.trim();
    if (!title) {
      setEditIssueError("Issue title is required");
      return;
    }

    if (!isConnected) {
      setEditIssueError("Connect to the game before editing an issue");
      return;
    }

    if (!canManageIssues) {
      setEditIssueError("Issue management is facilitator-only in this game");
      return;
    }

    if (editingIssue.status !== "pending") {
      setEditIssueError("Only pending issues can be edited");
      return;
    }

    updateIssue({
      id: editingIssue.id,
      title,
    });

    handleCloseEditIssue();
    setActionError(null);
  };

  const handleRemovePendingIssues = () => {
    if (!isConnected) {
      setActionError("Connect to the game before removing pending issues");
      return;
    }

    if (!canManageIssues) {
      setActionError("Issue management is facilitator-only in this game");
      return;
    }

    if (pendingIssues.length === 0) {
      return;
    }

    pendingIssues.forEach((issue) => deleteIssue(issue.id));
    setActionError(null);
  };

  const handleImportIssues = async (file: File) => {
    if (!canManageIssues) {
      setActionError("Issue import is facilitator-only in this game");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setActionError("Choose a CSV file to import issues");
      return;
    }

    const formData = new FormData();
    formData.append("source", "csv");
    formData.append("file", file);

    setIsImportingIssues(true);
    setActionError(null);

    try {
      const response = await apiFetch(`/api/v1/games/${gameId}/issues/import`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to import issues");
      }

      mergeImportedIssues(data?.issues || []);
    } catch (error: any) {
      setActionError(error.message || "Failed to import issues");
    } finally {
      setIsImportingIssues(false);
    }
  };

  const handlePreviewJiraIssues = async (
    request: JiraImportRequest,
  ): Promise<JiraImportPreviewResponse> => {
    if (!canManageIssues) {
      throw new Error("Issue import is facilitator-only in this game");
    }

    setIsImportingJira(true);
    setActionError(null);

    try {
      const response = await apiFetch(
        `/api/v1/games/${gameId}/issues/import/jira/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to preview Jira sprint");
      }

      return {
        candidates: data?.candidates || [],
        count: data?.count || 0,
        duplicateCount: data?.duplicateCount || 0,
      };
    } finally {
      setIsImportingJira(false);
    }
  };

  const handleConfirmJiraImport = async (
    issues: JiraImportCandidate[],
    duplicateAction: JiraDuplicateAction,
  ): Promise<void> => {
    if (!canManageIssues) {
      throw new Error("Issue import is facilitator-only in this game");
    }

    setIsImportingJira(true);
    setActionError(null);

    try {
      const response = await apiFetch(
        `/api/v1/games/${gameId}/issues/import/jira/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ issues, duplicateAction }),
        },
      );
      const data = (await response.json().catch(() => null)) as
        | (JiraImportConfirmResponse & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to import Jira issues");
      }

      mergeImportedIssues(data?.issues || []);
    } finally {
      setIsImportingJira(false);
    }
  };

  const handleCardSelect = (value: string) => {
    if (!canPickCards) {
      setActionError(
        gameState.currentUser?.is_spectator
          ? "You are in spectator mode. Switch to voter mode before the next round to vote."
          : gameState.currentUser?.is_round_observer ||
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
    if (!isConnected) {
      setActionError("Connect to the game before starting a vote");
      return;
    }

    if (showAddIssueForm && newIssueTitle.trim()) {
      setShowIssuesPanel(true);
      setActionError(
        "Complete adding this issue or cancel it before voting another issue.",
      );
      return;
    }

    if (activeRound && !activeRound.is_revealed) {
      setActionError("Reveal the current issue before starting another vote");
      return;
    }

    if (!canManageIssues) {
      setShowIssuesPanel(true);
      setActionError("Issue voting is facilitator-only in this game");
      return;
    }

    if (!nextPendingIssue) {
      setShowIssuesPanel(true);
      setActionError("No pending issues to vote");
      return;
    }

    setVotingResults(null);
    setActionError(null);
    startNewRound(nextPendingIssue.id);
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

  const handleToggleSpectator = () => {
    if (!gameState.currentUser) return;

    if (!currentUserCanToggleSpectator) {
      setActionError(
        "Only the facilitator can change spectator mode in this game",
      );
      return;
    }

    setSpectatorMode(!gameState.currentUser.is_spectator);
    setActionError(null);
  };

  const openLeaveModal = () => {
    setShowGameDropdown(false);
    setSelectedLeaveFacilitator(otherPlayers[0]?.id || "");
    setLeaveError(null);
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = () => {
    if (currentUserIsFacilitator && otherPlayers.length > 0) {
      if (!selectedLeaveFacilitator) {
        setLeaveError("Choose another facilitator before leaving.");
        return;
      }
    }

    setIsLeaving(true);
    leaveGame(
      currentUserIsFacilitator && otherPlayers.length > 0
        ? selectedLeaveFacilitator
        : undefined,
    );
    window.setTimeout(() => router.push("/"), 120);
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
    <PageShell className="flex h-screen flex-col overflow-hidden transition-colors">
      <div className="shrink-0">
        <GameTopBar
          gameName={gameState.game.name}
          isConnected={isConnected}
          canToggleSpectator={currentUserCanToggleSpectator}
          eligiblePlayerCount={eligiblePlayers.length}
          isSpectator={Boolean(gameState.currentUser?.is_spectator)}
          showGameDropdown={showGameDropdown}
          showIssuesPanel={showIssuesPanel}
          timerAlert={timerAlert}
          timerRemaining={timerRemaining}
          timerRunning={timerRunning}
          onOpenHistory={() => {
            setShowGameDropdown(false);
            setShowHistoryModal(true);
          }}
          onOpenInvite={() => setShowInviteModal(true)}
          onOpenLeave={openLeaveModal}
          onOpenSettings={() => {
            setShowGameDropdown(false);
            setShowSettingsModal(true);
          }}
          onOpenTimer={() => setShowTimerModal(true)}
          onToggleSpectator={handleToggleSpectator}
          onToggleGameDropdown={() => setShowGameDropdown((prev) => !prev)}
          onToggleIssuesPanel={() => setShowIssuesPanel((prev) => !prev)}
        />
      </div>

      <main
        className={`grid min-h-0 flex-1 overflow-hidden ${
          showIssuesPanel
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]"
            : "grid-cols-1"
        }`}
      >
        <section className="flex h-full min-h-0 min-w-0 flex-col">
          <GameTable
            activeIssue={activeIssue}
            allPlayersVoted={allPlayersVoted}
            autoReveal={gameState.game.auto_reveal}
            canPickCards={canPickCards}
            canRevealCards={canRevealCards}
            countdownNumber={countdownNumber}
            currentUserCanVote={currentUserCanVote}
            currentUserId={currentUserId}
            currentUserIsFacilitator={currentUserIsFacilitator}
            customEstimate={customEstimate}
            deckName={gameState.game.deck.name}
            deckValues={gameState.game.deck.values}
            displayedEstimate={displayedEstimate}
            eligiblePlayerCount={eligiblePlayers.length}
            estimateStatus={estimateStatus}
            isConnected={isConnected}
            isIssuesPanelOpen={showIssuesPanel}
            issueTotal={issueCounts.total}
            players={gameState.players}
            selectedCard={gameState.selectedCard}
            showAverage={gameState.game.show_average}
            showCountdown={showCountdown}
            votedCount={votedCount}
            votingPhase={gameState.votingPhase}
            votingResults={votingResults}
            onCardSelect={handleCardSelect}
            onCustomEstimateChange={(value: string) => {
              setCustomEstimate(value);
              setEstimateStatus(null);
            }}
            onPickNextIssue={handlePickNextIssue}
            onRevealCards={handleRevealCards}
            onSaveEstimate={handleSaveEstimate}
            onSetSpectatorMode={setSpectatorMode}
          />
        </section>

        {showIssuesPanel && (
          <IssuesPanel
            actionError={actionError}
            activeIssueId={activeIssue?.id}
            canManageIssues={canManageIssues}
            isImportingIssues={isImportingIssues}
            isImportingJira={isImportingJira}
            isConnected={isConnected}
            isRoundInProgress={Boolean(activeRound && !activeRound.is_revealed)}
            issueCounts={issueCounts}
            issues={gameState.issues}
            newIssueTitle={newIssueTitle}
            revealedIssueId={
              votingResults && gameState.votingPhase === VotingPhase.REVEALED
                ? activeIssue?.id
                : null
            }
            showAddIssueForm={showAddIssueForm}
            onAddIssueSubmit={handleAddIssue}
            onCancelAddIssue={() => {
              setShowAddIssueForm(false);
              setNewIssueTitle("");
            }}
            onClose={() => setShowIssuesPanel(false)}
            onDeleteIssue={handleDeletePendingIssue}
            onEditIssue={handleOpenEditIssue}
            onImportCsv={handleImportIssues}
            onImportJira={() => {
              if (!canManageIssues) {
                setActionError("Issue import is facilitator-only in this game");
                return;
              }

              setShowJiraImportModal(true);
              setActionError(null);
            }}
            onNewIssueTitleChange={setNewIssueTitle}
            onRemovePendingIssues={handleRemovePendingIssues}
            onToggleAddIssueForm={() => {
              if (!canManageIssues) {
                setActionError(
                  "Issue management is facilitator-only in this game",
                );
                return;
              }

              setShowAddIssueForm((prev) => !prev);
              setActionError(null);
            }}
            onVoteIssue={handleVoteIssue}
          />
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

      <JiraImportModal
        isOpen={showJiraImportModal}
        isLoading={isImportingJira}
        onClose={() => setShowJiraImportModal(false)}
        onPreview={handlePreviewJiraIssues}
        onConfirm={handleConfirmJiraImport}
      />

      <ModalShell
        isOpen={editingIssue !== null}
        onClose={handleCloseEditIssue}
        maxWidthClassName="max-w-lg"
      >
        <ModalHeader
          icon={Pencil}
          title="Edit issue"
          subtitle="Pending issues can be updated before voting starts"
          onClose={handleCloseEditIssue}
        />
        <form
          id="edit-issue-form"
          onSubmit={handleSaveEditedIssue}
          className="space-y-3 p-5"
        >
          <label htmlFor="edit-issue-title" className="sr-only">
            Issue title
          </label>
          <Textarea
            id="edit-issue-title"
            value={editIssueTitle}
            onChange={(event) => {
              setEditIssueTitle(event.target.value);
              setEditIssueError(null);
            }}
            maxLength={500}
            rows={4}
            autoFocus
            placeholder="Write an issue or user story"
            className="w-full resize-none rounded-lg px-3 py-2 text-sm"
          />
          {editIssueError && <Alert variant="danger">{editIssueError}</Alert>}
        </form>
        <ModalFooter layout="split">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCloseEditIssue}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-issue-form"
            disabled={
              !editIssueTitle.trim() || !isConnected || !canManageIssues
            }
          >
            Save changes
          </Button>
        </ModalFooter>
      </ModalShell>

      <ModalShell
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        maxWidthClassName="max-w-lg"
      >
        <ModalHeader
          icon={LogOut}
          title="Leave Game"
          subtitle="Confirm before leaving this room"
          onClose={() => setShowLeaveModal(false)}
        />
        <div className="space-y-4 p-5">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            You will leave this game room and stop participating in the current
            session.
          </p>

          {currentUserIsFacilitator && otherPlayers.length > 0 && (
            <Field
              label="New facilitator"
              helperText="The facilitator role must be transferred before you leave."
            >
              <Select
                value={selectedLeaveFacilitator}
                onChange={(event) => {
                  setSelectedLeaveFacilitator(event.target.value);
                  setLeaveError(null);
                }}
              >
                {otherPlayers.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {leaveError && <Alert variant="danger">{leaveError}</Alert>}
        </div>
        <ModalFooter layout="split">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowLeaveModal(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmLeave}
            isLoading={isLeaving}
          >
            Leave game
          </Button>
        </ModalFooter>
      </ModalShell>

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
