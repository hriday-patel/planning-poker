"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  History,
  Layers3,
  ListChecks,
  RefreshCw,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDeckName } from "@/utils/deck";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface SummaryGame {
  id: string;
  name: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator_name: string;
  facilitator_id: string;
  facilitator_name: string;
  deck: {
    id: string;
    name: string;
    values: string[];
  };
}

interface SummaryParticipant {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  joined_at: string;
  is_creator: boolean;
  is_facilitator: boolean;
}

interface SummaryIssue {
  id: string;
  title: string;
  status: string;
  final_estimate: string | null;
  external_key: string | null;
  external_url: string | null;
}

interface SummaryVote {
  user_id: string;
  display_name: string;
  card_value: string;
}

interface SummaryRound {
  round_id: string;
  issue_id: string | null;
  issue_title: string | null;
  started_at: string;
  revealed_at: string | null;
  final_estimate: string | null;
  vote_count: number;
  votes: SummaryVote[];
}

interface GameSummary {
  game: SummaryGame;
  participants: SummaryParticipant[];
  issues: SummaryIssue[];
  rounds: SummaryRound[];
}

interface GameHistoryDetailModalProps {
  gameId: string;
  gameName: string;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const parseCardValue = (value: string): number | null => {
  if (value === "½") return 0.5;
  if (value === "¼") return 0.25;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const calculateAverage = (votes: SummaryVote[]): number | null => {
  const numericVotes = votes
    .map((vote) => parseCardValue(vote.card_value))
    .filter((value): value is number => value !== null);

  if (numericVotes.length === 0) return null;

  const sum = numericVotes.reduce((totalValue, value) => totalValue + value, 0);
  return Math.round((sum / numericVotes.length) * 10) / 10;
};

function SectionHeading({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Users;
  title: string;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon
        className="h-4 w-4"
        style={{ color: "var(--primary)" }}
        aria-hidden="true"
      />
      <h3 className="text-sm font-semibold uppercase tracking-wide">
        {title}
      </h3>
      {count !== undefined && <Badge variant="neutral">{count}</Badge>}
    </div>
  );
}

export default function GameHistoryDetailModal({
  gameId,
  gameName,
  isOpen,
  onClose,
}: GameHistoryDetailModalProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/v1/games/${gameId}/summary`);

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to load game details");
      }

      const data = await response.json();
      setSummary({
        game: data.game,
        participants: data.participants ?? [],
        issues: data.issues ?? [],
        rounds: data.rounds ?? [],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load game details",
      );
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (isOpen && gameId) {
      void fetchSummary();
    }
  }, [fetchSummary, gameId, isOpen]);

  const overviewRows: Array<[string, string]> = summary
    ? [
        ["Created", formatDateTime(summary.game.created_at)],
        ["Last activity", formatDateTime(summary.game.updated_at)],
        ["Host", summary.game.creator_name],
        ["Facilitator", summary.game.facilitator_name],
        ["Deck", formatDeckName(summary.game.deck.name)],
        [
          "Card values",
          summary.game.deck.values.join(", "),
        ],
      ]
    : [];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-4xl">
      <ModalHeader
        icon={History}
        title={summary?.game.name ?? gameName}
        subtitle="Complete session details"
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
              Loading game details...
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md py-14">
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="subtle" onClick={fetchSummary}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            <section>
              <SectionHeading icon={CalendarClock} title="Overview" />
              <Card className="p-4" variant="secondary">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  {overviewRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <dt
                        className="shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {label}
                      </dt>
                      <dd className="min-w-0 truncate text-right font-medium">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </section>

            <section>
              <SectionHeading
                icon={Users}
                title="Participants"
                count={summary.participants.length}
              />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {summary.participants.map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2"
                    style={{
                      backgroundColor: "var(--surface-secondary)",
                      borderColor: "var(--border-subtle)",
                    }}
                    title={`Joined ${formatDateTime(participant.joined_at)}`}
                  >
                    <Avatar
                      name={participant.display_name}
                      imageUrl={participant.avatar_url}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {participant.display_name}
                    </span>
                    {participant.is_creator && (
                      <Badge variant="warning">Host</Badge>
                    )}
                    {!participant.is_creator && participant.is_facilitator && (
                      <Badge variant="info">Facilitator</Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading
                icon={Layers3}
                title="Issues & Estimates"
                count={summary.issues.length}
              />
              {summary.issues.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No issues were added in this game.
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                      style={{
                        backgroundColor: "var(--surface-secondary)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {issue.external_key && (
                            <span
                              className="mr-2 font-mono text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {issue.external_key}
                            </span>
                          )}
                          {issue.title}
                        </p>
                      </div>
                      {issue.external_url && (
                        <a
                          href={issue.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${issue.external_key || issue.title} in JIRA`}
                          className="shrink-0 transition-opacity hover:opacity-80"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <ExternalLink
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                      <Badge
                        variant={issue.final_estimate ? "info" : "neutral"}
                      >
                        {issue.final_estimate ?? "Not estimated"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionHeading
                icon={ClipboardList}
                title="Voting Rounds"
                count={summary.rounds.length}
              />
              {summary.rounds.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No completed voting rounds in this game.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.rounds.map((round) => {
                    const average = calculateAverage(round.votes);

                    return (
                      <Card
                        key={round.round_id}
                        className="p-4"
                        variant="secondary"
                      >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {round.issue_title || "Untitled issue"}
                            </p>
                            <p
                              className="mt-0.5 text-xs"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              Revealed{" "}
                              {formatDateTime(
                                round.revealed_at || round.started_at,
                              )}
                            </p>
                          </div>
                          <div
                            className="flex items-center gap-3 text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <BarChart3
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Avg {average === null ? "-" : average.toFixed(1)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <ListChecks
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {round.vote_count}{" "}
                              {round.vote_count === 1 ? "vote" : "votes"}
                            </span>
                            {round.final_estimate && (
                              <Badge variant="info">
                                Estimate: {round.final_estimate}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {round.votes.map((vote) => (
                            <span
                              key={`${round.round_id}-${vote.user_id}`}
                              className="inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 text-xs"
                              style={{
                                backgroundColor: "var(--surface-primary)",
                                borderColor: "var(--border-subtle)",
                              }}
                            >
                              <Avatar
                                name={vote.display_name}
                                size="sm"
                                className="h-5 w-5 text-[10px]"
                              />
                              <span className="max-w-28 truncate">
                                {vote.display_name}
                              </span>
                              <span
                                className="font-bold"
                                style={{ color: "var(--primary)" }}
                              >
                                {vote.card_value}
                              </span>
                            </span>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <ModalFooter layout="split">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => router.push(`/game/${gameId}`)}
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          Open Game Room
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}
