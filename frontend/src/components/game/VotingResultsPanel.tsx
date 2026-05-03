"use client";

import { BarChart3 } from "lucide-react";
import type { Issue } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import { Button, Input } from "@/components/ui";

interface VotingResultsPanelProps {
  activeIssue: Issue | null;
  customEstimate: string;
  displayedEstimate: string | null;
  estimateStatus: string | null;
  currentUserIsFacilitator: boolean;
  showAverage: boolean;
  votingResults: VotingResults;
  onCustomEstimateChange: (value: string) => void;
  onPickNextIssue: () => void;
  onSaveEstimate: () => void;
}

export default function VotingResultsPanel({
  activeIssue,
  customEstimate,
  currentUserIsFacilitator,
  displayedEstimate,
  estimateStatus,
  onCustomEstimateChange,
  onPickNextIssue,
  onSaveEstimate,
  showAverage,
  votingResults,
}: VotingResultsPanelProps) {
  return (
    <section
      aria-labelledby="voting-statistics-heading"
      className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg border p-4 text-center shadow-theme"
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mb-4 flex items-center justify-center gap-2">
        <BarChart3
          className="h-5 w-5"
          style={{ color: "var(--primary)" }}
          aria-hidden="true"
        />
        <h3 id="voting-statistics-heading" className="text-lg font-semibold">
          Voting statistics
        </h3>
      </div>

      <div className="space-y-2" aria-label="Vote distribution">
        {Object.entries(votingResults.distribution).map(([value, count]) => (
          <div
            key={value}
            className="grid grid-cols-[40px_1fr_28px] items-center gap-3 text-sm"
          >
            <span className="text-right font-semibold">{value}</span>
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--surface-tertiary)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(8, (count / Math.max(1, votingResults.total_voters)) * 100)}%`,
                  background:
                    "linear-gradient(90deg, var(--primary), var(--accent))",
                }}
              />
            </div>
            <span style={{ color: "var(--text-tertiary)" }}>{count}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3" aria-live="polite">
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--surface-secondary)",
          }}
        >
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Estimate
          </p>
          <p className="text-lg font-semibold">{displayedEstimate || "-"}</p>
        </div>
        {showAverage && (
          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--surface-secondary)",
            }}
          >
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
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
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Agreement
          </p>
          <p className="text-lg font-semibold">{votingResults.agreement}%</p>
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
            htmlFor="facilitator-estimate"
            className="mb-2 block text-xs font-medium"
            style={{ color: "var(--text-tertiary)" }}
          >
            Facilitator estimate
          </label>
          <div className="flex gap-2">
            <Input
              id="facilitator-estimate"
              value={customEstimate}
              onChange={(event) => onCustomEstimateChange(event.target.value)}
              placeholder={votingResults.final_estimate || "Calculated"}
              maxLength={10}
              className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm"
              aria-describedby="facilitator-estimate-help"
            />
            <Button type="button" onClick={onSaveEstimate} size="sm">
              Save
            </Button>
          </div>
          <p
            id="facilitator-estimate-help"
            className="mt-2 text-xs"
            style={{ color: "var(--text-tertiary)" }}
            aria-live="polite"
          >
            Empty uses the calculated estimate.
            {estimateStatus ? ` ${estimateStatus}.` : ""}
          </p>
        </div>
      )}

      <Button type="button" onClick={onPickNextIssue} className="mt-4">
        Pick next issue
      </Button>
    </section>
  );
}

// Made with Bob
