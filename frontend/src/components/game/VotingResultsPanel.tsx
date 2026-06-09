"use client";

import { BarChart3, Edit3 } from "lucide-react";
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
  onChangeEstimateClick: () => void;
  onPickNextIssue: () => void;
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
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center text-center"
      aria-label={`Agreement ${percentage}%`}
    >
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            strokeWidth="5"
            style={{ stroke: "var(--surface-tertiary)" }}
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            strokeLinecap="round"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ stroke: "var(--primary)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
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
        className="block text-xs font-semibold leading-4"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="block truncate text-base font-semibold leading-6"
        title={value}
      >
        {value}
      </span>
      {meta ? (
        <span
          className="block truncate text-xs font-medium leading-4 tabular-nums"
          style={{ color: "var(--text-secondary)" }}
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
  onChangeEstimateClick,
  onPickNextIssue,
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
    ? "2rem 3rem minmax(1.5rem,max-content)"
    : "2rem 4rem minmax(1.5rem,max-content)";
  const layoutClassName = isIssuesPanelOpen
    ? "grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)_12rem] lg:items-start lg:gap-6"
    : "grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)_12rem] lg:items-start lg:gap-8 xl:gap-10";
  const centerClassName = isIssuesPanelOpen
    ? "grid w-fit min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-6 justify-self-center"
    : "flex min-w-0 flex-wrap items-start justify-center gap-4 justify-self-center lg:flex-nowrap lg:gap-5";

  return (
    <section aria-labelledby="voting-statistics-heading" className="w-full">
      <div className="mb-4 flex items-center gap-2.5">
        <BarChart3
          className="h-5 w-5"
          style={{ color: "var(--primary)" }}
          aria-hidden="true"
        />
        <h3 id="voting-statistics-heading" className="text-base font-semibold">
          Voting statistics
        </h3>
      </div>

      <div
        className={`rounded-xl border p-4 shadow-theme sm:p-5 ${layoutClassName}`}
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="w-fit max-w-full justify-self-start"
          aria-label="Vote distribution"
        >
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            Vote Counts
          </p>
          <div className="flex flex-col gap-2.5">
            {distributionEntries.map(([value, count]) => {
              const percentage = clampPercentage((count / totalVoters) * 100);
              const lineWidth = count > 0 ? Math.max(8, percentage) : 0;

              return (
                <div
                  key={value}
                  className="grid items-center gap-2"
                  style={{ gridTemplateColumns: distributionColumns }}
                >
                  <span className="min-w-0 truncate text-sm font-semibold leading-5">
                    {value}
                  </span>
                  <div
                    className="h-3 min-w-0 overflow-hidden rounded-full"
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
                    className="text-right text-sm font-semibold leading-5 tabular-nums"
                    style={{ color: "var(--text-secondary)" }}
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
            className="mb-3 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-secondary)" }}
          >
            Summary
          </p>
          <div className={centerClassName}>
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <AgreementCircle value={votingResults.agreement} />
              <span
                className="text-xs font-semibold leading-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Agreement
              </span>
            </div>

            {isIssuesPanelOpen ? (
              <div className="grid min-w-0 grid-cols-[6.5rem_6.5rem] gap-x-6 gap-y-4">
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
                  className="w-24 sm:w-28"
                  label={stat.label}
                  meta={stat.meta}
                  value={stat.value}
                />
              ))
            )}
          </div>
        </div>

        <div className="flex w-48 max-w-full flex-col gap-2.5 justify-self-start lg:justify-self-end">
          <Button
            type="button"
            onClick={onPickNextIssue}
            size="sm"
            className="w-full justify-center"
          >
            Pick next issue
          </Button>

          {currentUserIsFacilitator && activeIssue && (
            <div className="flex min-w-0 flex-col gap-2">
              <label
                className="block text-[10px] font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Facilitator estimate
              </label>

              {/* Read-only Estimate Display Field */}
              <div
                className="flex h-9 w-full items-center justify-center rounded-md border px-3 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                aria-label="Current estimate"
              >
                {customEstimate || displayedEstimate || "Not set"}
              </div>

              {/* Change Estimate Button */}
              <Button
                type="button"
                onClick={onChangeEstimateClick}
                size="sm"
                variant="secondary"
                className="w-full justify-center"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Change Estimate
              </Button>

              {estimateStatus && (
                <span
                  className="block text-[10px] font-medium leading-4"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-live="polite"
                >
                  {estimateStatus}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Made with Bob
