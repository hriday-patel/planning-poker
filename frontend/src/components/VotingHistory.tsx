"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, ClipboardList, Clock3, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface Vote {
  user_id: string;
  display_name: string;
  card_value: string;
  submitted_at?: string | null;
}

interface VotingSpeedStat {
  user_id: string;
  display_name: string;
  seconds: number;
}

interface HistoryEntry {
  round_id: string;
  issue_id: string | null;
  issue_title: string | null;
  started_at: string;
  revealed_at: string | null;
  final_estimate: string | null;
  vote_count: number;
  votes: Vote[];
  fastest_voter?: VotingSpeedStat | null;
  slowest_voter?: VotingSpeedStat | null;
}

interface VotingHistoryProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

const parseCardValue = (value: string): number | null => {
  if (value === "½") return 0.5;
  if (value === "¼") return 0.25;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const formatSpeed = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) return "-";
  return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`;
};

export default function VotingHistory({
  gameId,
  isOpen,
  onClose,
}: VotingHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/v1/games/${gameId}/history`);

      if (!response.ok) {
        throw new Error("Failed to fetch voting history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load voting history",
      );
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (isOpen && gameId) {
      void fetchHistory();
    }
  }, [fetchHistory, gameId, isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAverage = (votes: Vote[]): number | null => {
    const numericVotes = votes
      .map((vote) => parseCardValue(vote.card_value))
      .filter((value): value is number => value !== null);

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((total, value) => total + value, 0);
    return Math.round((sum / numericVotes.length) * 10) / 10;
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-5xl">
      <ModalHeader
        icon={ClipboardList}
        title="Voting History"
        subtitle="Completed rounds and estimates"
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-14">
            <div
              className="flex items-center gap-3"
              style={{ color: "var(--text-secondary)" }}
            >
              <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
              Loading history...
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md py-14">
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="subtle" onClick={fetchHistory}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No voting history yet"
            description="Completed voting rounds will appear here."
            className="py-14"
          />
        ) : (
          <div className="space-y-4">
            {history.map((entry) => {
              const average = calculateAverage(entry.votes);
              const calculatedEstimate =
                average === null ? null : String(Math.round(average));
              const estimate = entry.final_estimate || calculatedEstimate;

              return (
                <Card key={entry.round_id} className="p-4" variant="secondary">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">
                        {entry.issue_title || "Untitled issue"}
                      </h3>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {formatDate(entry.revealed_at || entry.started_at)}
                      </p>
                    </div>
                    <div
                      className="rounded-lg border px-4 py-3 text-center"
                      style={{
                        backgroundColor: "var(--surface-accent)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      <p className="text-xs font-medium">Estimate</p>
                      <p className="text-2xl font-bold">{estimate || "-"}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {entry.votes.map((vote) => (
                      <div
                        key={`${entry.round_id}-${vote.user_id}`}
                        className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2"
                        style={{
                          backgroundColor: "var(--surface-primary)",
                          borderColor: "var(--border-color)",
                        }}
                      >
                        <Avatar name={vote.display_name} size="sm" />
                        <span className="truncate text-sm font-medium">
                          {vote.display_name}
                        </span>
                        <Badge variant="info">{vote.card_value}</Badge>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-4"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div>
                      <p
                        className="flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Average
                      </p>
                      <p className="mt-1 font-semibold">
                        {average === null ? "-" : average.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Votes
                      </p>
                      <p className="mt-1 font-semibold">{entry.vote_count}</p>
                    </div>
                    <div>
                      <p
                        className="flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Fastest
                      </p>
                      <p className="mt-1 truncate font-semibold">
                        {entry.fastest_voter?.display_name || "-"}
                        {entry.fastest_voter && (
                          <span
                            className="ml-2 text-sm"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {formatSpeed(entry.fastest_voter.seconds)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p
                        className="flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Slowest
                      </p>
                      <p className="mt-1 truncate font-semibold">
                        {entry.slowest_voter?.display_name || "-"}
                        {entry.slowest_voter && (
                          <span
                            className="ml-2 text-sm"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {formatSpeed(entry.slowest_voter.seconds)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ModalFooter>
        <Button type="button" onClick={onClose} className="w-full">
          Close
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
