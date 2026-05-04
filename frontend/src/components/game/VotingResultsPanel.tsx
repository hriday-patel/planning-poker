"use client";

import { BarChart3, Check } from "lucide-react";
import type { Issue } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import { Button } from "@/components/ui";

interface VotingResultsPanelProps {
  activeIssue: Issue | null;
  customEstimate: string;
  displayedEstimate: string | null;
  estimateStatus: string | null;
  currentUserIsFacilitator: boolean;
  isIssuesPanelOpen: boolean;
  showAverage: boolean;
  votingResults: VotingResults;
  onCustomEstimateChange: (value: string) => void;
  onPickNextIssue: () => void;
  onSaveEstimate: () => void;
}

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const formatSpeed = (seconds?: number) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "-";
  if (seconds < 60) return `${Math.max(0, seconds).toFixed(1)}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

function AgreementCircle({ value }: { value: number }) {
  const percentage = clampPercentage(Number.isFinite(value) ? value : 0);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center text-center"
      aria-label={`Agreement ${percentage}%`}
    >
      <div className="relative h-16 w-16">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            strokeWidth="4"
            style={{ stroke: "var(--surface-tertiary)" }}
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            strokeLinecap="round"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ stroke: "var(--primary)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

function StatTile({
  className = "",
  label,
  meta,
  value,
}: {
  className?: string;
  label: string;
  meta?: string;
  value: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span
        className="block text-[10px] font-medium leading-4"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="block truncate text-sm font-semibold leading-5"
        title={value}
      >
        {value}
      </span>
      {meta ? (
        <span
          className="block truncate text-[10px] font-medium leading-4 tabular-nums"
          style={{ color: "var(--text-tertiary)" }}
          title={meta}
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}

export default function VotingResultsPanel({
  activeIssue,
  customEstimate,
  currentUserIsFacilitator,
  displayedEstimate,
  estimateStatus,
  isIssuesPanelOpen,
  onCustomEstimateChange,
  onPickNextIssue,
  onSaveEstimate,
  showAverage,
  votingResults,
}: VotingResultsPanelProps) {
  const distributionEntries = Object.entries(votingResults.distribution);
  const summaryStats: Array<{ label: string; value: string; meta?: string }> = [
    { label: "Estimate", value: displayedEstimate || "-" },
    {
      label: "Average",
      value:
        showAverage && typeof votingResults.average === "number"
          ? votingResults.average.toFixed(1)
          : "-",
    },
    {
      label: "Fastest Voter",
      value: votingResults.fastest_voter?.display_name || "-",
      meta: votingResults.fastest_voter
        ? formatSpeed(votingResults.fastest_voter.seconds)
        : undefined,
    },
    {
      label: "Slowest Voter",
      value: votingResults.slowest_voter?.display_name || "-",
      meta: votingResults.slowest_voter
        ? formatSpeed(votingResults.slowest_voter.seconds)
        : undefined,
    },
  ];
  const totalVoters = Math.max(1, votingResults.total_voters);
  const isEstimateSaved = Boolean(estimateStatus);
  const distributionColumns = isIssuesPanelOpen
    ? "1.5rem 2.5rem minmax(1.25rem,max-content)"
    : "1.75rem 3.5rem minmax(1.25rem,max-content)";
  const layoutClassName = isIssuesPanelOpen
    ? "grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)_11rem] lg:items-start lg:gap-5"
    : "grid grid-cols-1 gap-4 lg:grid-cols-[auto_minmax(0,1fr)_11rem] lg:items-start lg:gap-8 xl:gap-10";
  const centerClassName = isIssuesPanelOpen
    ? "grid w-fit min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-5 justify-self-center"
    : "flex min-w-0 flex-wrap items-start justify-center gap-3 justify-self-center lg:flex-nowrap lg:gap-4";

  return (
    <section aria-labelledby="voting-statistics-heading" className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <BarChart3
          className="h-4 w-4"
          style={{ color: "var(--primary)" }}
          aria-hidden="true"
        />
        <h3 id="voting-statistics-heading" className="text-sm font-semibold">
          Voting statistics
        </h3>
      </div>

      <div className={layoutClassName}>
        <div
          className="w-fit max-w-full justify-self-start"
          aria-label="Vote distribution"
        >
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Vote Counts
          </p>
          <div className="flex flex-col gap-2">
            {distributionEntries.map(([value, count]) => {
              const percentage = clampPercentage((count / totalVoters) * 100);
              const lineWidth = count > 0 ? Math.max(8, percentage) : 0;

              return (
                <div
                  key={value}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: distributionColumns }}
                >
                  <span className="min-w-0 truncate text-xs font-semibold leading-5">
                    {value}
                  </span>
                  <div
                    className="h-2 min-w-0 overflow-hidden rounded-full"
                    style={{ backgroundColor: "var(--surface-tertiary)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${lineWidth}%`,
                        background:
                          "linear-gradient(90deg, var(--primary), var(--accent))",
                      }}
                    />
                  </div>
                  <span
                    className="text-right text-xs font-semibold leading-5 tabular-nums"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 justify-self-center">
          <p
            className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-tertiary)" }}
          >
            Summary
          </p>
          <div className={centerClassName}>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <AgreementCircle value={votingResults.agreement} />
              <span
                className="text-[10px] font-medium leading-4"
                style={{ color: "var(--text-tertiary)" }}
              >
                Agreement
              </span>
            </div>

            {isIssuesPanelOpen ? (
              <div className="grid min-w-0 grid-cols-[5.5rem_5.5rem] gap-x-5 gap-y-3">
                {summaryStats.map((stat) => (
                  <StatTile
                    key={stat.label}
                    label={stat.label}
                    meta={stat.meta}
                    value={stat.value}
                  />
                ))}
              </div>
            ) : (
              summaryStats.map((stat) => (
                <StatTile
                  key={stat.label}
                  className="w-20 sm:w-24"
                  label={stat.label}
                  meta={stat.meta}
                  value={stat.value}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex w-44 max-w-full flex-col gap-2 justify-self-start lg:justify-self-end">
          <Button
            type="button"
            onClick={onPickNextIssue}
            size="sm"
            className="w-full justify-center"
          >
            Pick next issue
          </Button>

          {currentUserIsFacilitator && activeIssue && (
            <div className="min-w-0">
              <label
                htmlFor="facilitator-estimate"
                className="mb-1 block text-[10px] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Facilitator estimate
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="facilitator-estimate"
                  value={customEstimate}
                  onChange={(event) =>
                    onCustomEstimateChange(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  placeholder={votingResults.final_estimate || "Auto"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  aria-label="Estimate"
                  className="h-9 w-14 flex-none rounded-lg border px-2 py-1 text-center text-sm tabular-nums outline-none transition-colors placeholder:text-theme-tertiary focus:border-(--primary) focus:ring-2 focus:ring-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
                <Button
                  type="button"
                  onClick={onSaveEstimate}
                  size="sm"
                  className="h-9 flex-1 justify-center px-3"
                >
                  {isEstimateSaved ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Saved
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
              <span
                className="mt-1 block text-[10px] font-medium leading-4"
                style={{ color: "var(--text-tertiary)" }}
                aria-live="polite"
              >
                {estimateStatus || "Empty uses the calculated estimate."}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Made with Bob
