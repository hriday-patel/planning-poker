"use client";

import { Clock3, Trophy } from "lucide-react";
import { Button } from "@/components/ui";
import type { VotingResults } from "@/hooks/useGameSocket";

interface RoundSidePanelProps {
  currentVote: { card_value: string } | undefined;
  selectedCard: string | null;
  timerAlert: boolean;
  timerRemaining: number | null;
  timerRunning: boolean;
  votingResults: VotingResults | null;
  onOpenTimer: () => void;
}

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

export default function RoundSidePanel({
  currentVote,
  onOpenTimer,
  selectedCard,
  timerAlert,
  timerRemaining,
  timerRunning,
  votingResults,
}: RoundSidePanelProps) {
  return (
    <aside className="space-y-4" aria-label="Round details">
      <div
        aria-labelledby="round-stats-heading"
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
            aria-hidden="true"
          />
          <h2 id="round-stats-heading" className="font-semibold">
            Round stats
          </h2>
        </div>
        <div className="space-y-3" aria-live="polite">
          <div>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Your vote
            </p>
            <p className="font-semibold">
              {currentVote?.card_value || selectedCard || "-"}
            </p>
          </div>
        </div>
      </div>

      <div
        aria-labelledby="round-timer-heading"
        className="rounded-lg border p-4 shadow-theme"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Clock3
            className="h-4 w-4"
            style={{ color: timerAlert ? "var(--warning)" : "var(--primary)" }}
            aria-hidden="true"
          />
          <h2 id="round-timer-heading" className="font-semibold">
            Timer
          </h2>
        </div>
        <div className="font-mono text-4xl font-bold" aria-live="polite">
          {formatTimer(timerRemaining)}
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {timerRunning ? "Running" : timerRemaining ? "Paused" : "Not started"}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={onOpenTimer}
          className="mt-4 w-full"
        >
          Timer controls
        </Button>
      </div>
    </aside>
  );
}

// Made with Bob
