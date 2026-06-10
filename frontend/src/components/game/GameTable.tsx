"use client";

import {
  Check,
  CircleDot,
  Eye,
  EyeOff,
  RotateCcw,
  SkipForward,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { Issue, Player } from "@/types/game.types";
import { VotingPhase } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import VotingDeck from "./VotingDeck";

interface GameTableProps {
  activeIssue: Issue | null;
  allPlayersVoted: boolean;
  autoReveal: boolean;
  canPickCards: boolean;
  canRevealCards: boolean;
  canRevote: boolean;
  canSkipIssue: boolean;
  currentUserCanVote: boolean;
  currentUserId: string | null;
  currentUserIsFacilitator: boolean;
  deckName: string;
  deckValues: string[];
  eligiblePlayerCount: number;
  isConnected: boolean;
  issueTotal: number;
  players: Player[];
  selectedCard: string | null;
  showCountdown: boolean;
  countdownNumber: number;
  votedCount: number;
  votingPhase: VotingPhase;
  votingResults: VotingResults | null;
  onCardSelect: (value: string) => void;
  onRevealCards: () => void;
  onRevote: () => void;
  onSetSpectatorMode: (isSpectator: boolean, targetUserId?: string) => void;
  onSkipIssue: () => void;
}

type SeatSide = "top" | "bottom" | "left" | "right";

/**
 * Distributes players across the four edges of the table. The horizontal
 * edges (top/bottom) absorb most players while each side column holds up to
 * three, so seats stay evenly spaced even in rooms of 15-20+ players.
 */
const getSeatCounts = (total: number) => {
  if (total <= 0) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const side = total >= 16 ? 3 : total >= 10 ? 2 : total >= 6 ? 1 : 0;
  const remaining = total - side * 2;
  const bottom = Math.ceil(remaining / 2);

  return { top: remaining - bottom, right: side, bottom, left: side };
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

function PlayerVoteCard({
  compact,
  onToggleSpectator,
  player,
  revealedVote,
  showSpectatorToggle,
}: {
  compact: boolean;
  onToggleSpectator: () => void;
  player: Player;
  revealedVote: string | null;
  showSpectatorToggle: boolean;
}) {
  return (
    <div
      aria-label={`${player.display_name}: ${
        revealedVote
          ? `voted ${revealedVote}`
          : player.has_voted
            ? "voted"
            : "waiting"
      }`}
      className={`relative flex shrink-0 items-center justify-center rounded-lg border font-bold shadow-theme ${
        compact ? "h-14 w-10 text-base" : "h-18 w-13 text-lg"
      }`}
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
        color: revealedVote ? "var(--success)" : "var(--text-primary)",
      }}
    >
      {revealedVote ||
        (player.has_voted ? (
          <Check
            className={compact ? "h-4 w-4" : "h-5 w-5"}
            aria-hidden="true"
          />
        ) : (
          ""
        ))}
      {showSpectatorToggle && (
        <SpectatorToggleButton
          isSpectator={player.is_spectator}
          playerName={player.display_name}
          onToggle={onToggleSpectator}
        />
      )}
    </div>
  );
}

function PlayerSeat({
  canToggleSpectator,
  compact,
  isCurrentUser,
  onToggleSpectator,
  player,
  revealedVote,
  side,
  status,
}: {
  canToggleSpectator: boolean;
  compact: boolean;
  isCurrentUser: boolean;
  onToggleSpectator: () => void;
  player: Player;
  revealedVote: string | null;
  side: SeatSide;
  status: string;
}) {
  const isOffline = player.is_online === false;

  const card = (
    <PlayerVoteCard
      compact={compact}
      player={player}
      revealedVote={revealedVote}
      showSpectatorToggle={canToggleSpectator}
      onToggleSpectator={onToggleSpectator}
    />
  );

  const nameBlock = (
    <div
      className={`flex min-w-0 flex-col ${
        side === "left"
          ? "flex-1 items-end text-right"
          : side === "right"
            ? "flex-1 items-start text-left"
            : "w-full items-center text-center"
      }`}
      style={{
        color: isCurrentUser ? "var(--primary)" : "var(--text-primary)",
      }}
    >
      <span
        className="w-full truncate text-xs font-semibold"
        title={player.display_name}
      >
        {player.display_name}
      </span>
      <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
        {status}
      </span>
    </div>
  );

  // Side seats lay out horizontally (name beside card) to stay shallow, so
  // up to three of them fit next to the table without crowding it.
  if (side === "left" || side === "right") {
    return (
      <div
        role="listitem"
        className={`flex w-36 items-center gap-2 ${
          isOffline ? "opacity-50 grayscale" : ""
        }`}
      >
        {side === "right" && card}
        {nameBlock}
        {side === "left" && card}
      </div>
    );
  }

  return (
    <div
      role="listitem"
      className={`flex flex-col items-center gap-1.5 ${
        compact ? "w-20" : "w-24"
      } ${isOffline ? "opacity-50 grayscale" : ""}`}
    >
      {card}
      {nameBlock}
    </div>
  );
}

export default function GameTable({
  activeIssue,
  allPlayersVoted,
  autoReveal,
  canPickCards,
  canRevealCards,
  canRevote,
  canSkipIssue,
  countdownNumber,
  currentUserCanVote,
  currentUserId,
  currentUserIsFacilitator,
  deckName,
  deckValues,
  eligiblePlayerCount,
  isConnected,
  issueTotal,
  onCardSelect,
  onRevealCards,
  onRevote,
  onSetSpectatorMode,
  onSkipIssue,
  players,
  selectedCard,
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
    if (player.is_online === false) return "Disconnected";
    if (player.is_facilitator) return "Facilitator";
    if (player.is_spectator) return "Spectator";
    if (player.is_round_observer || player.can_vote === false) {
      return "Next round";
    }
    if (player.has_voted) return "Voted";
    return "Waiting";
  };

  const seatCounts = getSeatCounts(players.length);
  const rightStart = seatCounts.top;
  const bottomStart = rightStart + seatCounts.right;
  const leftStart = bottomStart + seatCounts.bottom;
  // Clockwise seating: top row left-to-right, right column top-to-bottom,
  // bottom row right-to-left, left column bottom-to-top.
  const seatedPlayers: Record<SeatSide, Player[]> = {
    top: players.slice(0, rightStart),
    right: players.slice(rightStart, bottomStart),
    bottom: players.slice(bottomStart, leftStart).reverse(),
    left: players.slice(leftStart).reverse(),
  };
  // Shrink seats once the room gets crowded so 15-20 players stay visible.
  const compactSeats = players.length > 10;
  const rowGapClass = compactSeats ? "gap-x-2 gap-y-2" : "gap-x-3 gap-y-2";

  const renderSeat = (player: Player, side: SeatSide) => (
    <PlayerSeat
      key={player.id}
      canToggleSpectator={currentUserIsFacilitator}
      compact={compactSeats}
      isCurrentUser={player.id === currentUserId}
      player={player}
      revealedVote={revealedVotesByPlayerId.get(player.id) ?? null}
      side={side}
      status={getPlayerStatus(player)}
      onToggleSpectator={() => onSetSpectatorMode(!player.is_spectator, player.id)}
    />
  );

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
    ? null
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
      aria-label="Game table"
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      <header className="shrink-0 px-5 py-3 sm:px-8 sm:py-4">
        <div
          className="flex flex-wrap items-center justify-end gap-2"
          aria-live="polite"
        >
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
            {votedCount}/{eligiblePlayerCount} players voted
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5 sm:px-8 sm:pb-6">
        <div className="relative min-h-0 flex-1 overflow-auto">
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

          <div className="flex min-h-full w-full">
            <div className="m-auto grid w-full max-w-4xl grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-2 p-2">
              {seatedPlayers.top.length > 0 && (
                <div
                  role="list"
                  aria-label="Players seated at the top of the table"
                  className={`col-start-1 col-end-4 row-start-1 hidden flex-wrap content-end items-end justify-center md:flex ${rowGapClass}`}
                >
                  {seatedPlayers.top.map((player) => renderSeat(player, "top"))}
                </div>
              )}

              {seatedPlayers.left.length > 0 && (
                <div
                  role="list"
                  aria-label="Players seated on the left side of the table"
                  className="col-start-1 row-start-2 hidden flex-col items-end justify-center gap-2 md:flex"
                >
                  {seatedPlayers.left.map((player) =>
                    renderSeat(player, "left"),
                  )}
                </div>
              )}

              <div className="col-start-2 row-start-2 flex items-center justify-center">
                <div
                  className="flex min-h-40 w-full max-w-lg items-center justify-center rounded-4xl border p-4 sm:p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, color-mix(in srgb, var(--primary) 28%, var(--surface-accent)) 0%, var(--surface-secondary) 100%)",
                    borderColor: "var(--border-strong)",
                    boxShadow:
                      "inset 0 1px 0 color-mix(in srgb, var(--text-on-accent) 18%, transparent), 0 28px 90px -64px var(--primary)",
                  }}
                >
                  {!isCountdownActive && (
                    <div
                      className="w-full max-w-md text-center"
                      aria-live="polite"
                    >
                      {activeIssue && (
                        <div className="mb-3">
                          <p
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            Current issue
                          </p>
                          <h2
                            className="mt-1 line-clamp-2 wrap-break-word text-base font-semibold sm:text-lg"
                            title={activeIssue.title}
                          >
                            {activeIssue.title}
                          </h2>
                        </div>
                      )}
                      <div
                        className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: "var(--surface-primary)",
                          color: "var(--primary)",
                        }}
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold sm:text-xl">
                        {statusTitle}
                      </h3>
                      {statusDescription && (
                        <p
                          className="mt-1.5 text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {statusDescription}
                        </p>
                      )}
                      {(canRevealCards || canRevote || canSkipIssue) && (
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          {canRevealCards && (
                            <Button
                              type="button"
                              onClick={onRevealCards}
                              className="inline-flex max-w-full justify-center whitespace-nowrap"
                            >
                              Reveal cards
                            </Button>
                          )}
                          {canRevote && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={onRevote}
                              className="inline-flex max-w-full justify-center whitespace-nowrap"
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              Revote
                            </Button>
                          )}
                          {canSkipIssue && (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={onSkipIssue}
                              className="inline-flex max-w-full justify-center whitespace-nowrap"
                            >
                              <SkipForward
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Skip issue
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {seatedPlayers.right.length > 0 && (
                <div
                  role="list"
                  aria-label="Players seated on the right side of the table"
                  className="col-start-3 row-start-2 hidden flex-col items-start justify-center gap-2 md:flex"
                >
                  {seatedPlayers.right.map((player) =>
                    renderSeat(player, "right"),
                  )}
                </div>
              )}

              {seatedPlayers.bottom.length > 0 && (
                <div
                  role="list"
                  aria-label="Players seated at the bottom of the table"
                  className={`col-start-1 col-end-4 row-start-3 hidden flex-wrap content-start items-start justify-center md:flex ${rowGapClass}`}
                >
                  {seatedPlayers.bottom.map((player) =>
                    renderSeat(player, "bottom"),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 md:hidden" role="list" aria-label="Players">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
            {players.map((player) => {
              const revealedVote = revealedVotesByPlayerId.get(player.id);
              const isCurrentUser = player.id === currentUserId;
              const isOffline = player.is_online === false;

              return (
                <div
                  key={player.id}
                  role="listitem"
                  className={`flex min-w-36 items-center gap-3 rounded-lg border px-3 py-2 shadow-theme ${
                    isOffline ? "opacity-50 grayscale" : ""
                  }`}
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
            className="flex min-h-40 shrink-0 flex-col border-t pt-3"
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
        ) : null}
      </div>
    </section>
  );
}

// Made with Bob
