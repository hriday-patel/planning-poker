"use client";

import { ChevronDown, Edit3 } from "lucide-react";
import type { Issue } from "@/types/game.types";
import type { VotingResults } from "@/hooks/useGameSocket";
import { Button, IconButton } from "@/components/ui";

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
  onClose: () => void;
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
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex h-36 w-36 shrink-0 items-center justify-center text-center"
      aria-label={`Agreement ${percentage}%`}
    >
      <div className="relative h-36 w-36">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 108 108">
          <circle
            cx="54"
            cy="54"
            r={radius}
            fill="none"
            strokeWidth="7"
            style={{ stroke: "var(--surface-tertiary)" }}
          />
          <circle
            cx="54"
            cy="54"
            r={radius}
            fill="none"
            strokeLinecap="round"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ stroke: "var(--primary)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
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
        className="block text-base font-semibold leading-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        className="block truncate text-xl font-semibold leading-8"
        title={value}
      >
        {value}
      </span>
      {meta ? (
        <span
          className="block truncate text-base font-medium leading-6 tabular-nums"
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
  onClose,
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
  const distributionColumns = isIssuesPanelOpen
    ? "2.5rem 4rem minmax(1.5rem,max-content)"
    : "3rem 7rem minmax(1.5rem,max-content)";
  const sectionHeaderClass =
    "text-sm font-semibold uppercase tracking-wide leading-5";

  return (
    <aside
      aria-labelledby="voting-statistics-heading"
      className="shrink-0 border-t px-5 py-4 sm:px-6 sm:py-5"
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 id="voting-statistics-heading" className="text-base font-semibold">
          Voting statistics
        </h2>
        <IconButton
          onClick={onClose}
          aria-label="Close voting statistics"
          title="Close voting statistics"
          size="sm"
          variant="secondary"
          style={{
            backgroundColor: "var(--surface-secondary)",
            borderColor: "var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[auto_auto_1fr_minmax(13rem,14rem)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10 lg:gap-y-2 xl:gap-x-12">
        <p
          className={`order-1 ${sectionHeaderClass} lg:order-0 lg:col-start-1 lg:row-start-1`}
          style={{ color: "var(--text-secondary)" }}
        >
          Vote Counts
        </p>

        <p
          className={`order-3 ${sectionHeaderClass} lg:order-0 lg:col-start-2 lg:row-start-1`}
          style={{ color: "var(--text-secondary)" }}
        >
          Summary
        </p>

        <div
          className="order-2 min-w-0 lg:order-0 lg:col-start-1 lg:row-start-2"
          aria-label="Vote distribution"
        >
          <div className="flex flex-col gap-2.5">
            {distributionEntries.length > 0 ? (
              distributionEntries.map(([value, count]) => {
                const percentage = clampPercentage((count / totalVoters) * 100);
                const lineWidth = count > 0 ? Math.max(8, percentage) : 0;

                return (
                  <div
                    key={value}
                    className="grid items-center gap-2.5"
                    style={{ gridTemplateColumns: distributionColumns }}
                  >
                    <span className="min-w-0 truncate text-lg font-semibold leading-7">
                      {value}
                    </span>
                    <div
                      className="h-5 min-w-0 overflow-hidden rounded-full"
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
                      className="text-right text-lg font-semibold leading-7 tabular-nums"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })
            ) : (
              <p
                className="text-base font-medium leading-6"
                style={{ color: "var(--text-tertiary)" }}
              >
                No votes recorded
              </p>
            )}
          </div>
        </div>

        <div className="order-4 flex min-w-0 items-center gap-6 lg:order-0 lg:col-start-2 lg:row-start-2 lg:gap-8">
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            <AgreementCircle value={votingResults.agreement} />
            <span
              className="text-base font-semibold leading-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Agreement
            </span>
          </div>

          <div
            className={`grid min-w-0 gap-x-6 gap-y-4 ${
              isIssuesPanelOpen
                ? "grid-cols-[minmax(7.5rem,1fr)_minmax(7.5rem,1fr)]"
                : "grid-cols-2 lg:grid-cols-[minmax(8.5rem,1fr)_minmax(8.5rem,1fr)_minmax(8.5rem,1fr)_minmax(8.5rem,1fr)] lg:grid-rows-2"
            }`}
          >
            {summaryStats.map((stat) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                meta={stat.meta}
                value={stat.value}
              />
            ))}
          </div>
        </div>

        <div className="order-5 flex w-full min-w-0 flex-col gap-2.5 sm:max-w-sm lg:order-0 lg:col-start-4 lg:row-start-2 lg:max-w-none lg:self-start">
          <Button
            type="button"
            onClick={onPickNextIssue}
            className="w-full justify-center"
          >
            Pick next issue
          </Button>

          {currentUserIsFacilitator && activeIssue && (
            <div className="flex min-w-0 flex-col gap-2">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Facilitator estimate
              </label>

              <div
                className="flex h-11 w-full items-center justify-center rounded-md border px-3 text-base font-semibold"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                aria-label="Current estimate"
              >
                {customEstimate || displayedEstimate || "Not set"}
              </div>

              <Button
                type="button"
                onClick={onChangeEstimateClick}
                variant="secondary"
                className="w-full justify-center"
              >
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Change Estimate
              </Button>

              {estimateStatus && (
                <span
                  className="block text-sm font-medium leading-5"
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
    </aside>
  );
}

// Made with Bob
