"use client";

import { Check, CircleDot, Eye, EyeOff, Users } from "lucide-react";
import { Button } from "@/components/ui";
import type { Issue, Player } from "@/types/game.types";
import { VotingPhase } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import VotingDeck from "./VotingDeck";
import VotingResultsPanel from "./VotingResultsPanel";

interface GameTableProps {
  activeIssue: Issue | null;
  allPlayersVoted: boolean;
  autoReveal: boolean;
  canPickCards: boolean;
  canRevealCards: boolean;
  currentUserCanVote: boolean;
  currentUserId: string | null;
  currentUserIsFacilitator: boolean;
  customEstimate: string;
  deckName: string;
  deckValues: string[];
  displayedEstimate: string | null;
  eligiblePlayerCount: number;
  estimateStatus: string | null;
  isConnected: boolean;
  isIssuesPanelOpen: boolean;
  issueTotal: number;
  players: Player[];
  selectedCard: string | null;
  showAverage: boolean;
  showCountdown: boolean;
  countdownNumber: number;
  votedCount: number;
  votingPhase: VotingPhase;
  votingResults: VotingResults | null;
  onCardSelect: (value: string) => void;
  onCustomEstimateChange: (value: string) => void;
  onPickNextIssue: () => void;
  onRevealCards: () => void;
  onSaveEstimate: () => void;
  onSetSpectatorMode: (isSpectator: boolean, targetUserId?: string) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getPlayerPosition = (index: number, total: number) => {
  if (total <= 1) return { left: 50, top: 80 };

  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return {
    left: clamp(50 + 34 * Math.cos(angle), 15, 85),
    top: clamp(50 + 33 * Math.sin(angle), 16, 84),
  };
};

function SpectatorToggleButton({
  isSpectator,
  onToggle,
  playerName,
  placement = "card",
}: {
  isSpectator: boolean;
  onToggle: () => void;
  playerName: string;
  placement?: "card" | "row";
}) {
  const title = isSpectator
    ? `Make ${playerName} a voter`
    : `Make ${playerName} a spectator`;
  const Icon = isSpectator ? EyeOff : Eye;

  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={isSpectator}
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={
        placement === "card"
          ? "absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border shadow-theme transition-transform hover:-translate-y-0.5 active:translate-y-0"
          : "ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0"
      }
      style={{
        backgroundColor: isSpectator
          ? "var(--surface-accent)"
          : "var(--surface-primary)",
        borderColor: isSpectator ? "var(--primary)" : "var(--border-color)",
        color: isSpectator ? "var(--primary)" : "var(--text-secondary)",
      }}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

export default function GameTable({
  activeIssue,
  allPlayersVoted,
  autoReveal,
  canPickCards,
  canRevealCards,
  countdownNumber,
  currentUserCanVote,
  currentUserId,
  currentUserIsFacilitator,
  customEstimate,
  deckName,
  deckValues,
  displayedEstimate,
  eligiblePlayerCount,
  estimateStatus,
  isConnected,
  isIssuesPanelOpen,
  issueTotal,
  onCardSelect,
  onCustomEstimateChange,
  onPickNextIssue,
  onRevealCards,
  onSaveEstimate,
  onSetSpectatorMode,
  players,
  selectedCard,
  showAverage,
  showCountdown,
  votedCount,
  votingPhase,
  votingResults,
}: GameTableProps) {
  const revealedVotesByPlayerId = new Map(
    votingResults?.votes.map((vote) => [vote.user_id, vote.card_value]) ?? [],
  );
  const currentPlayer = players.find((player) => player.id === currentUserId);
  const hasRevealedResults =
    votingPhase === VotingPhase.REVEALED && votingResults !== null;
  const votingHasStarted = activeIssue !== null;
  const showDeck = votingHasStarted && votingPhase !== VotingPhase.REVEALED;
  const isCountdownActive = showCountdown && countdownNumber > 0;

  const getPlayerStatus = (player: Player) => {
    if (player.is_facilitator) return "Facilitator";
    if (player.is_spectator) return "Spectator";
    if (player.is_round_observer || player.can_vote === false) {
      return "Next round";
    }
    if (player.has_voted) return "Voted";
    return "Waiting";
  };

  const statusTitle = hasRevealedResults
    ? "Round revealed"
    : activeIssue
      ? allPlayersVoted
        ? autoReveal
          ? "Revealing cards"
          : "Ready to reveal"
        : currentUserCanVote
          ? "Pick your card"
          : "Round in progress"
      : issueTotal === 0
        ? "Add your first issue"
        : "Choose an issue";

  const statusDescription = hasRevealedResults
    ? "Review the round statistics below."
    : activeIssue
      ? currentUserCanVote
        ? `${votedCount}/${eligiblePlayerCount} eligible players have voted.`
        : currentPlayer?.is_spectator
          ? "You are observing as a spectator. You can still help manage this room when settings allow it."
          : currentPlayer?.is_round_observer ||
              currentPlayer?.can_vote === false
            ? "You joined after this round started. You can vote on the next issue."
            : "Round voting is in progress."
      : "Select Vote this issue in the sidebar to open the table for cards.";

  return (
    <section
      aria-labelledby="game-table-heading"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <header className="shrink-0 px-5 py-3 sm:px-8 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-tertiary)" }}
            >
              Current issue
            </p>
            <h2
              id="game-table-heading"
              className="mt-1 max-w-4xl wrap-break-word text-xl font-semibold sm:text-2xl"
            >
              {activeIssue?.title || "Pick an issue to begin voting"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-live="polite">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
              style={{
                borderColor: isConnected ? "var(--success)" : "var(--warning)",
                color: isConnected ? "var(--success)" : "var(--warning)",
              }}
            >
              <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
              {isConnected ? "Connected" : "Connecting"}
            </span>
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: "var(--surface-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              {votedCount}/{eligiblePlayerCount} voted
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5 sm:px-8 sm:pb-6">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 h-[36%] max-h-64 min-h-36 w-[min(58%,520px)] -translate-x-1/2 -translate-y-1/2 rounded-4xl border"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--primary) 28%, var(--surface-accent)) 0%, var(--surface-secondary) 100%)",
              borderColor: "var(--border-strong)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--text-on-accent) 18%, transparent), 0 28px 90px -64px var(--primary)",
            }}
          />

          {isCountdownActive && (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center"
              aria-live="assertive"
              role="status"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--bg-primary) 34%, transparent)",
              }}
            >
              <div
                className="flex items-center gap-3 rounded-full border px-5 py-2 text-sm font-medium shadow-theme"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--surface-primary)",
                }}
              >
                <span
                  className="text-base font-semibold tabular-nums"
                  style={{ color: "var(--primary)" }}
                >
                  {countdownNumber}
                </span>
                <span
                  className="text-xs uppercase tracking-wide"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Revealing
                </span>
              </div>
            </div>
          )}

          {!isCountdownActive && (
            <div className="absolute inset-0 z-20 box-border flex items-center justify-center p-4 sm:p-12">
              <div
                className="box-border w-full max-w-md px-2 text-center"
                aria-live="polite"
              >
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-primary)",
                    color: "var(--primary)",
                  }}
                >
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold sm:text-2xl">
                  {statusTitle}
                </h3>
                <p
                  className="mt-2 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {statusDescription}
                </p>
                {canRevealCards && (
                  <Button
                    type="button"
                    onClick={onRevealCards}
                    className="mt-4 inline-flex max-w-full justify-center whitespace-nowrap"
                  >
                    Reveal cards
                  </Button>
                )}
              </div>
            </div>
          )}

          <div role="list" aria-label="Players around the table">
            {players.map((player, index) => {
              const position = getPlayerPosition(index, players.length);
              const revealedVote = revealedVotesByPlayerId.get(player.id);
              const isCurrentUser = player.id === currentUserId;

              return (
                <div
                  key={player.id}
                  role="listitem"
                  className="absolute z-30 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                  style={{ left: `${position.left}%`, top: `${position.top}%` }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      aria-label={`${player.display_name}: ${revealedVote ? `voted ${revealedVote}` : player.has_voted ? "voted" : "waiting"}`}
                      className="relative flex h-18 w-13 items-center justify-center rounded-lg border text-lg font-bold shadow-theme transition-transform"
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
                      {revealedVote ||
                        (player.has_voted ? (
                          <Check className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          ""
                        ))}
                      {currentUserIsFacilitator && (
                        <SpectatorToggleButton
                          isSpectator={player.is_spectator}
                          playerName={player.display_name}
                          onToggle={() =>
                            onSetSpectatorMode(!player.is_spectator, player.id)
                          }
                        />
                      )}
                    </div>
                    <div
                      className="flex max-w-32 flex-col items-center px-2 py-1 text-center"
                      style={{
                        color: isCurrentUser
                          ? "var(--primary)"
                          : "var(--text-primary)",
                      }}
                    >
                      <span className="max-w-24 truncate text-xs font-semibold">
                        {player.display_name}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {getPlayerStatus(player)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 md:hidden" role="list" aria-label="Players">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
            {players.map((player) => {
              const revealedVote = revealedVotesByPlayerId.get(player.id);
              const isCurrentUser = player.id === currentUserId;

              return (
                <div
                  key={player.id}
                  role="listitem"
                  className="flex min-w-36 items-center gap-3 rounded-lg border px-3 py-2 shadow-theme"
                  style={{
                    backgroundColor: "var(--surface-primary)",
                    borderColor: isCurrentUser
                      ? "var(--primary)"
                      : "var(--border-color)",
                  }}
                >
                  <div
                    className="flex h-12 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-bold"
                    style={{
                      backgroundColor: revealedVote
                        ? "color-mix(in srgb, var(--success) 18%, var(--surface-primary))"
                        : player.has_voted
                          ? "color-mix(in srgb, var(--primary) 18%, var(--surface-primary))"
                          : "var(--surface-secondary)",
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
                    {revealedVote ||
                      (player.has_voted ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        ""
                      ))}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {player.display_name}
                    </p>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {getPlayerStatus(player)}
                    </p>
                  </div>
                  {currentUserIsFacilitator && (
                    <SpectatorToggleButton
                      isSpectator={player.is_spectator}
                      placement="row"
                      playerName={player.display_name}
                      onToggle={() =>
                        onSetSpectatorMode(!player.is_spectator, player.id)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {showDeck ? (
          <div
            className="min-h-[10rem] shrink-0 border-t pt-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <VotingDeck
              canPickCards={canPickCards}
              deckName={deckName}
              deckValues={deckValues}
              embedded
              selectedCard={selectedCard}
              onCardSelect={onCardSelect}
            />
          </div>
        ) : hasRevealedResults ? (
          <div
            className="min-h-[10rem] shrink-0 border-t pt-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <VotingResultsPanel
              activeIssue={activeIssue}
              customEstimate={customEstimate}
              currentUserIsFacilitator={currentUserIsFacilitator}
              displayedEstimate={displayedEstimate}
              estimateStatus={estimateStatus}
              isIssuesPanelOpen={isIssuesPanelOpen}
              showAverage={showAverage}
              votingResults={votingResults}
              onCustomEstimateChange={onCustomEstimateChange}
              onPickNextIssue={onPickNextIssue}
              onSaveEstimate={onSaveEstimate}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

// Made with Bob
