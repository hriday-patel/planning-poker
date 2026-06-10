"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LogOut, Pencil, TimerReset } from "lucide-react";
import {
  GamePermission,
  GameState,
  Issue,
  JiraDuplicateAction,
  JiraEstimateInsertRequest,
  JiraImportCandidate,
  JiraImportConfirmResponse,
  JiraImportPreviewResponse,
  JiraImportRequest,
  JiraInsertEstimatesResponse,
  VotingPhase,
  Player,
} from "@/types/game.types";
import {
  buildVotingResultsFromRevealedRound,
  useGameSocket,
  VotingResults,
} from "@/hooks/useGameSocket";
import Timer from "@/components/Timer";
import InviteModal from "@/components/InviteModal";
import VotingHistory from "@/components/VotingHistory";
import GameSettingsModal from "@/components/GameSettingsModal";
import GuestModeModal from "@/components/GuestModeModal";
import JiraImportModal from "@/components/JiraImportModal";
import JiraInsertEstimatesModal from "@/components/JiraInsertEstimatesModal";
import ChangeEstimateModal from "@/components/ChangeEstimateModal";
import GameTable from "@/components/game/GameTable";
import GameTopBar from "@/components/game/GameTopBar";
import IssuesPanel from "@/components/game/IssuesPanel";
import StatisticsPanelBar from "@/components/game/StatisticsPanelBar";
import VotingResultsPanel from "@/components/game/VotingResultsPanel";
import {
  clearActiveGameSession,
  setActiveGameSession,
} from "@/lib/activeGameSession";
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

const getNextPendingIssue = (
  issues: Issue[],
  anchorIssueId: string | null,
): Issue | null => {
  if (!anchorIssueId) {
    return issues.find((issue) => issue.status === "pending") || null;
  }

  const anchorIndex = issues.findIndex((issue) => issue.id === anchorIssueId);
  const candidateIssues =
    anchorIndex >= 0 ? issues.slice(anchorIndex + 1) : issues;

  return candidateIssues.find((issue) => issue.status === "pending") || null;
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
  const [showStatisticsPanel, setShowStatisticsPanel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGuestJoinModal, setShowGuestJoinModal] = useState(false);
  const [showAddIssueForm, setShowAddIssueForm] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showJiraImportModal, setShowJiraImportModal] = useState(false);
  const [showInsertEstimatesModal, setShowInsertEstimatesModal] =
    useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGameDropdown, setShowGameDropdown] = useState(false);
  const [showChangeEstimateModal, setShowChangeEstimateModal] = useState(false);
  const [votingResults, setVotingResults] = useState<VotingResults | null>(
    null,
  );
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [timeIssuesEnabled, setTimeIssuesEnabled] = useState(false);
  const [timerAlert, setTimerAlert] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [lastIssueAnchorId, setLastIssueAnchorId] = useState<string | null>(
    null,
  );
  const [editIssueTitle, setEditIssueTitle] = useState("");
  const [editIssueError, setEditIssueError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isImportingIssues, setIsImportingIssues] = useState(false);
  const [isImportingJira, setIsImportingJira] = useState(false);
  const [isInsertingEstimates, setIsInsertingEstimates] = useState(false);
  const [customEstimate, setCustomEstimate] = useState("");
  const [pendingEstimate, setPendingEstimate] = useState("");
  const [estimateStatus, setEstimateStatus] = useState<string | null>(null);
  const [originalCalculatedEstimate, setOriginalCalculatedEstimate] = useState<
    string | null
  >(null);
  const lastRevealedRoundKeyRef = useRef<string | null>(null);
  // undefined = no server state synced yet; null = synced, no active round
  const lastSyncedRoundIdRef = useRef<string | null | undefined>(undefined);
  const countdownIntervalRef = useRef<number | null>(null);
  const [selectedLeaveFacilitator, setSelectedLeaveFacilitator] = useState("");
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  useEffect(() => clearCountdownInterval, [clearCountdownInterval]);

  useEffect(() => {
    setActiveGameSession(gameId);
  }, [gameId]);

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
    revote,
    skipIssue,
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

      // Store the original calculated estimate (never overwrite this)
      setOriginalCalculatedEstimate(results.final_estimate || null);

      if (!gameState.game?.show_countdown) {
        setVotingResults(results);
        setShowStatisticsPanel(true);
        return;
      }

      setVotingResults(null);
      setShowCountdown(true);
      setCountdownNumber(3);

      clearCountdownInterval();
      let nextCount = 3;
      countdownIntervalRef.current = window.setInterval(() => {
        nextCount -= 1;
        setCountdownNumber(nextCount);

        if (nextCount <= 0) {
          clearCountdownInterval();
          setVotingResults(results);
          setShowStatisticsPanel(true);
          window.setTimeout(() => setShowCountdown(false), 220);
        }
      }, 700);
    },
    onIssueSkipped: (_roundId, issueId) => {
      setLastIssueAnchorId(issueId);
      setVotingResults(null);
      setShowCountdown(false);
      setCountdownNumber(3);
      setCustomEstimate("");
      setEstimateStatus(null);
      setActionError(null);
      setOriginalCalculatedEstimate(null);
      setGameState((prev) => ({
        ...prev,
        currentIssue: null,
        selectedCard: null,
        votingPhase: VotingPhase.WAITING,
      }));
    },
    onNewRound: (_roundId, issueId) => {
      setLastIssueAnchorId(issueId);
      setVotingResults(null);
      setActionError(null);
      setOriginalCalculatedEstimate(null);
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
    onSelfVoteSync: (cardValue) => {
      // Server truth for our own vote in the active round (sent on
      // join/rejoin/resync). Restores the selection after a reconnect and
      // clears stale selections carried over from a previous round.
      setGameState((prev) => ({
        ...prev,
        selectedCard: cardValue,
        votingPhase:
          prev.votingPhase === VotingPhase.REVEALED
            ? prev.votingPhase
            : cardValue
              ? VotingPhase.VOTING
              : VotingPhase.WAITING,
      }));
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

  // Reset per-round UI state whenever the server round changes. Round
  // transitions normally arrive as NEW_ROUND_STARTED / ISSUE_SKIPPED events,
  // but a player who was disconnected misses those — this catches the change
  // through the full GAME_STATE resync so old votes and selected cards never
  // leak into the new round.
  useEffect(() => {
    if (!wsGameState) {
      return;
    }

    const roundId = wsGameState.current_round?.id ?? null;

    if (lastSyncedRoundIdRef.current === undefined) {
      lastSyncedRoundIdRef.current = roundId;
      return;
    }

    if (lastSyncedRoundIdRef.current === roundId) {
      return;
    }

    lastSyncedRoundIdRef.current = roundId;
    clearCountdownInterval();
    setVotingResults(null);
    setShowCountdown(false);
    setCountdownNumber(3);
    setOriginalCalculatedEstimate(null);
    setGameState((prev) => ({
      ...prev,
      selectedCard: null,
      votingPhase: VotingPhase.WAITING,
    }));
  }, [wsGameState, clearCountdownInterval]);

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
  const votingEligiblePlayers = gameState.players.filter(
    (player) => !player.is_spectator && player.can_vote !== false,
  );
  const roundParticipants = gameState.players.filter(
    (player) => !player.is_spectator && !player.is_round_observer,
  );
  const isRevealedRound = Boolean(activeRound?.is_revealed);
  const eligiblePlayers = isRevealedRound
    ? roundParticipants
    : votingEligiblePlayers;
  const eligiblePlayerCount = eligiblePlayers.length;
  const votedCount = eligiblePlayers.filter((player) => player.has_voted).length;
  const allPlayersVoted =
    Boolean(activeRound?.issue_id) &&
    votingEligiblePlayers.length > 0 &&
    votingEligiblePlayers.every((player) => player.has_voted);
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
    currentUserCanReveal &&
    !gameState.game?.auto_reveal;
  const canRevote =
    isConnected &&
    currentUserIsFacilitator &&
    Boolean(activeRound?.issue_id) &&
    !activeRound?.is_revealed;
  const canSkipIssue =
    isConnected &&
    currentUserIsFacilitator &&
    Boolean(activeRound?.issue_id) &&
    !activeRound?.is_revealed &&
    !allPlayersVoted;
  const displayedEstimate = showCountdown
    ? null
    : activeIssue?.final_estimate || votingResults?.final_estimate || null;
  const hasRevealedResults =
    gameState.votingPhase === VotingPhase.REVEALED &&
    votingResults !== null &&
    !showCountdown;
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

  const estimateReadyIssues = useMemo(
    () =>
      gameState.issues.filter(
        (issue) =>
          issue.source === "jira" &&
          Boolean(issue.external_key) &&
          issue.final_estimate != null,
      ),
    [gameState.issues],
  );

  const nextPendingIssue = useMemo(
    () =>
      getNextPendingIssue(
        gameState.issues,
        activeIssue?.id || lastIssueAnchorId,
      ),
    [activeIssue?.id, gameState.issues, lastIssueAnchorId],
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

  useEffect(() => {
    const round = wsGameState?.current_round;
    if (!round?.is_revealed || showCountdown) {
      return;
    }

    setVotingResults((previousResults) => {
      if (previousResults) {
        return previousResults;
      }

      if (wsGameState?.voting_results) {
        return wsGameState.voting_results;
      }

      return buildVotingResultsFromRevealedRound(
        round,
        activeIssue?.final_estimate ?? null,
      );
    });
  }, [
    activeIssue?.final_estimate,
    showCountdown,
    wsGameState?.current_round,
    wsGameState?.voting_results,
  ]);

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

  const handleInsertJiraEstimates = async (
    request: JiraEstimateInsertRequest,
  ): Promise<JiraInsertEstimatesResponse> => {
    if (!canManageIssues) {
      throw new Error("Inserting estimates is facilitator-only in this game");
    }

    setIsInsertingEstimates(true);
    setActionError(null);

    try {
      const response = await apiFetch(
        `/api/v1/games/${gameId}/issues/export/jira/estimates`,
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
        throw new Error(data?.error || "Failed to insert estimates into Jira");
      }

      return {
        updated: data?.updated || [],
        skipped: data?.skipped || [],
        failed: data?.failed || [],
        total: data?.total || 0,
      };
    } finally {
      setIsInsertingEstimates(false);
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

    const nextSelectedCard = gameState.selectedCard === value ? null : value;

    setGameState((prev) => ({
      ...prev,
      error: null,
      selectedCard: nextSelectedCard,
      votingPhase: nextSelectedCard ? VotingPhase.VOTING : VotingPhase.WAITING,
    }));

    submitVote(value);
  };

  const handleRevealCards = () => {
    if (!currentUserCanReveal) {
      setActionError("You don't have permission to reveal cards");
      return;
    }

    setActionError(null);
    revealCards();
  };

  const handleSkipIssue = () => {
    if (!activeRound?.issue_id || !activeIssue) {
      setActionError("Start voting an issue before skipping");
      return;
    }

    if (!currentUserIsFacilitator) {
      setActionError("Only the facilitator can skip issue voting");
      return;
    }

    if (activeRound.is_revealed) {
      setActionError("Cannot skip after cards have been revealed");
      return;
    }

    if (allPlayersVoted) {
      setActionError("Cannot skip after all eligible players have voted");
      return;
    }

    setVotingResults(null);
    setShowIssuesPanel(true);
    setActionError(null);
    skipIssue();
  };

  const handleRevote = () => {
    if (!activeRound?.issue_id || !activeIssue) {
      setActionError("Start voting an issue before requesting a revote");
      return;
    }

    if (!currentUserIsFacilitator) {
      setActionError("Only the facilitator can initiate a revote");
      return;
    }

    if (activeRound.is_revealed) {
      setActionError("Cannot revote after cards have been revealed");
      return;
    }

    setActionError(null);
    revote();
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
      setActionError(
        pendingIssues.length > 0
          ? "No later pending issues to vote"
          : "No pending issues to vote",
      );
      return;
    }

    setVotingResults(null);
    setActionError(null);
    startNewRound(nextPendingIssue.id);
  };

  const handleSelectEstimate = (estimate: string) => {
    // Update pending estimate when user selects from modal
    setPendingEstimate(estimate);
    setEstimateStatus(null);
  };

  const handleSaveEstimate = () => {
    if (
      !currentUserIsFacilitator ||
      !activeIssue ||
      !votingResults ||
      !pendingEstimate
    ) {
      return;
    }

    const nextEstimate = pendingEstimate || null;

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
    setCustomEstimate(pendingEstimate);
    setPendingEstimate("");
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
    clearActiveGameSession();
    window.setTimeout(() => router.push("/"), 120);
  };

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
          onClose={() => {
            clearActiveGameSession();
            router.push("/");
          }}
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
      {!isConnected && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-20 z-50 -translate-x-1/2"
        >
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-theme-strong"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--warning)",
              color: "var(--warning)",
            }}
          >
            <TimerReset className="h-4 w-4 animate-spin" aria-hidden="true" />
            {isReconnecting
              ? "Reconnecting to game..."
              : "Connection lost - reconnecting..."}
          </div>
        </div>
      )}

      <div className="shrink-0">
        <GameTopBar
          gameName={gameState.game.name}
          isConnected={isConnected}
          canToggleSpectator={currentUserCanToggleSpectator}
          eligiblePlayerCount={eligiblePlayerCount}
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
        <section className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <GameTable
            activeIssue={activeIssue}
            allPlayersVoted={allPlayersVoted}
            autoReveal={gameState.game.auto_reveal}
            canPickCards={canPickCards}
            canRevealCards={canRevealCards}
            canRevote={canRevote}
            canSkipIssue={canSkipIssue}
            countdownNumber={countdownNumber}
            currentUserCanVote={currentUserCanVote}
            currentUserId={currentUserId}
            currentUserIsFacilitator={currentUserIsFacilitator}
            deckName={gameState.game.deck.name}
            deckValues={gameState.game.deck.values}
            eligiblePlayerCount={eligiblePlayerCount}
            isConnected={isConnected}
            issueTotal={issueCounts.total}
            players={gameState.players}
            selectedCard={gameState.selectedCard}
            showCountdown={showCountdown}
            votedCount={votedCount}
            votingPhase={gameState.votingPhase}
            votingResults={votingResults}
            onCardSelect={handleCardSelect}
            onRevealCards={handleRevealCards}
            onRevote={handleRevote}
            onSetSpectatorMode={setSpectatorMode}
            onSkipIssue={handleSkipIssue}
          />

          {hasRevealedResults && votingResults && showStatisticsPanel ? (
            <VotingResultsPanel
              activeIssue={activeIssue}
              customEstimate={customEstimate}
              currentUserIsFacilitator={currentUserIsFacilitator}
              displayedEstimate={displayedEstimate}
              estimateStatus={estimateStatus}
              isIssuesPanelOpen={showIssuesPanel}
              showAverage={gameState.game.show_average}
              votingResults={votingResults}
              onChangeEstimateClick={() => setShowChangeEstimateModal(true)}
              onClose={() => setShowStatisticsPanel(false)}
              onPickNextIssue={handlePickNextIssue}
            />
          ) : hasRevealedResults && votingResults ? (
            <StatisticsPanelBar onOpen={() => setShowStatisticsPanel(true)} />
          ) : null}
        </section>

        {showIssuesPanel && (
          <IssuesPanel
            actionError={actionError}
            activeIssueId={activeIssue?.id}
            canManageIssues={canManageIssues}
            isImportingIssues={isImportingIssues}
            isImportingJira={isImportingJira}
            isInsertingEstimates={isInsertingEstimates}
            isConnected={isConnected}
            isRoundInProgress={Boolean(activeRound && !activeRound.is_revealed)}
            issueCounts={issueCounts}
            issues={
              showCountdown
                ? gameState.issues.map((issue) =>
                    issue.id === activeIssue?.id
                      ? { ...issue, final_estimate: null }
                      : issue,
                  )
                : gameState.issues
            }
            newIssueTitle={newIssueTitle}
            revealedIssueId={
              votingResults &&
              gameState.votingPhase === VotingPhase.REVEALED &&
              !showCountdown
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
            onInsertEstimates={() => {
              if (!canManageIssues) {
                setActionError(
                  "Inserting estimates is facilitator-only in this game",
                );
                return;
              }

              setShowInsertEstimatesModal(true);
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

      <JiraInsertEstimatesModal
        isOpen={showInsertEstimatesModal}
        isLoading={isInsertingEstimates}
        issues={estimateReadyIssues}
        onClose={() => setShowInsertEstimatesModal(false)}
        onInsert={handleInsertJiraEstimates}
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

      <ChangeEstimateModal
        isOpen={showChangeEstimateModal}
        deckName={gameState.game.deck.name}
        deckValues={gameState.game.deck.values}
        currentEstimate={pendingEstimate || customEstimate}
        calculatedEstimate={originalCalculatedEstimate}
        onClose={() => setShowChangeEstimateModal(false)}
        onSelectEstimate={handleSelectEstimate}
        onSaveEstimate={handleSaveEstimate}
        hasUnsavedEstimate={Boolean(pendingEstimate)}
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
