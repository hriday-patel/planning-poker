"use client";

import { Check, Users } from "lucide-react";
import { Button } from "@/components/ui";
import type { Issue, Player } from "@/types/game.types";
import { VotingPhase } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import VotingResultsPanel from "./VotingResultsPanel";

interface GameTableProps {
  activeIssue: Issue | null;
  allPlayersVoted: boolean;
  autoReveal: boolean;
  canRevealCards: boolean;
  currentUserCanVote: boolean;
  currentUserId: string | null;
  currentUserIsFacilitator: boolean;
  customEstimate: string;
  displayedEstimate: string | null;
  eligiblePlayerCount: number;
  estimateStatus: string | null;
  isConnected: boolean;
  issueTotal: number;
  players: Player[];
  selectedCard: string | null;
  showAverage: boolean;
  showCountdown: boolean;
  countdownNumber: number;
  votedCount: number;
  votingPhase: VotingPhase;
  votingResults: VotingResults | null;
  onCustomEstimateChange: (value: string) => void;
  onPickNextIssue: () => void;
  onRevealCards: () => void;
  onSaveEstimate: () => void;
}

export default function GameTable({
  activeIssue,
  allPlayersVoted,
  autoReveal,
  canRevealCards,
  countdownNumber,
  currentUserCanVote,
  currentUserId,
  currentUserIsFacilitator,
  customEstimate,
  displayedEstimate,
  eligiblePlayerCount,
  estimateStatus,
  isConnected,
  issueTotal,
  onCustomEstimateChange,
  onPickNextIssue,
  onRevealCards,
  onSaveEstimate,
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
  const getPlayerStatus = (player: Player) => {
    if (player.is_facilitator) return "Facilitator";
    if (player.is_spectator) return "Spectator";
    if (player.is_round_observer || player.can_vote === false) {
      return "Next round";
    }
    if (player.has_voted) return "Voted";
    return "Waiting";
  };
  const statusTitle = activeIssue
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
  const statusDescription = activeIssue
    ? currentUserCanVote
      ? `${votedCount}/${eligiblePlayerCount} eligible players have voted.`
      : currentPlayer?.is_spectator
        ? "You are observing as a spectator. Switch to voter mode before the next round to vote."
        : currentPlayer?.is_round_observer || currentPlayer?.can_vote === false
          ? "You joined after this round started. You can vote on the next issue."
          : "Round voting is in progress."
    : "Select Vote this issue in the sidebar to open the table for cards.";

  return (
    <section
      aria-labelledby="game-table-heading"
      className="rounded-lg border p-4 shadow-theme"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--surface-primary) 88%, transparent)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className="text-xs uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Current issue
          </p>
          <h2
            id="game-table-heading"
            className="mt-1 max-w-3xl wrap-break-word text-xl font-semibold"
          >
            {activeIssue?.title || "Pick an issue to begin voting"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <span
            className="rounded-full border px-3 py-1 text-sm font-medium"
            style={{
              borderColor: isConnected ? "var(--success)" : "var(--warning)",
              color: isConnected ? "var(--success)" : "var(--warning)",
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
            {votedCount}/{eligiblePlayerCount} voted
          </span>
        </div>
      </div>

      <div
        className="relative mx-auto min-h-[520px] w-full max-w-none overflow-hidden rounded-lg border p-4 sm:p-6 lg:min-h-[calc(100vh-15rem)]"
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
              "inset 0 1px 0 color-mix(in srgb, var(--text-on-accent) 12%, transparent), 0 28px 90px -60px var(--primary)",
          }}
        />

        {showCountdown && countdownNumber > 0 && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            aria-live="assertive"
            role="status"
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

        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
          {hasRevealedResults ? (
            <VotingResultsPanel
              activeIssue={activeIssue}
              customEstimate={customEstimate}
              currentUserIsFacilitator={currentUserIsFacilitator}
              displayedEstimate={displayedEstimate}
              estimateStatus={estimateStatus}
              showAverage={showAverage}
              votingResults={votingResults}
              onCustomEstimateChange={onCustomEstimateChange}
              onPickNextIssue={onPickNextIssue}
              onSaveEstimate={onSaveEstimate}
            />
          ) : (
            <div className="max-w-md text-center" aria-live="polite">
              <div
                className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--surface-primary)",
                  color: "var(--primary)",
                }}
              >
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold">{statusTitle}</h3>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {statusDescription}
              </p>
              {canRevealCards && (
                <Button type="button" onClick={onRevealCards} className="mt-4">
                  Reveal cards
                </Button>
              )}
            </div>
          )}
        </div>

        <div role="list" aria-label="Players around the table">
          {players.map((player, index) => {
            const angle = (index / Math.max(1, players.length)) * 2 * Math.PI;
            const x = 50 + 42 * Math.cos(angle);
            const y = 50 + 36 * Math.sin(angle);
            const revealedVote = revealedVotesByPlayerId.get(player.id);
            const isCurrentUser = player.id === currentUserId;

            return (
              <div
                key={player.id}
                role="listitem"
                className="absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    aria-label={`${player.display_name}: ${revealedVote ? `voted ${revealedVote}` : player.has_voted ? "voted" : "waiting"}`}
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
                    {revealedVote ||
                      (player.has_voted ? (
                        <Check className="h-5 w-5" aria-hidden="true" />
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
                        : getPlayerStatus(player)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 md:hidden" role="list" aria-label="Players">
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                  aria-label={`${player.display_name}: ${revealedVote ? `voted ${revealedVote}` : player.has_voted ? "voted" : "waiting"}`}
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
                    {player.is_facilitator
                      ? "Facilitator"
                      : getPlayerStatus(player)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Made with Bob
