"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  Crown,
  History,
  Layers3,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import GameHistoryDetailModal from "@/components/GameHistoryDetailModal";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  PageShell,
} from "@/components/ui";

interface GameHistoryItem {
  id: string;
  name: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  joined_at: string;
  creator_id: string;
  creator_name: string;
  facilitator_id: string;
  facilitator_name: string;
  deck_name: string;
  participant_count: number;
  participant_preview: string[];
  completed_round_count: number;
  issue_count: number;
  estimated_issue_count: number;
}

const PAGE_SIZE = 20;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const mergeGames = (
  existing: GameHistoryItem[],
  incoming: GameHistoryItem[],
) => {
  const seen = new Set(existing.map((game) => game.id));
  return [...existing, ...incoming.filter((game) => !seen.has(game.id))];
};

export default function GameHistoryPage() {
  const router = useRouter();
  const [games, setGames] = useState<GameHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameHistoryItem | null>(
    null,
  );

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [meResponse, listResponse] = await Promise.all([
        apiFetch("/api/v1/auth/me"),
        apiFetch(`/api/v1/games/my/list?limit=${PAGE_SIZE}&offset=0`),
      ]);

      if (meResponse.status === 401 || listResponse.status === 401) {
        router.push("/login?returnTo=%2Fhistory");
        return;
      }

      if (!listResponse.ok) {
        throw new Error("Failed to load your game history");
      }

      if (meResponse.ok) {
        const meData = await meResponse.json();
        setCurrentUserId(meData.user?.userId ?? null);
      }

      const data = await listResponse.json();
      setGames(data.games ?? []);
      setTotal(data.pagination?.total ?? data.games?.length ?? 0);
      setHasMore(Boolean(data.pagination?.has_more));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your game history",
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await apiFetch(
        `/api/v1/games/my/list?limit=${PAGE_SIZE}&offset=${games.length}`,
      );

      if (response.status === 401) {
        router.push("/login?returnTo=%2Fhistory");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load more games");
      }

      const data = await response.json();
      setGames((previous) => mergeGames(previous, data.games ?? []));
      setTotal(data.pagination?.total ?? total);
      setHasMore(Boolean(data.pagination?.has_more));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more games",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"
            style={{ borderColor: "var(--primary)" }}
          />
          <p style={{ color: "var(--text-secondary)" }}>
            Loading your game history...
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <PageHeader
          eyebrow="Profile"
          title="Game History"
          description="Review every planning poker session you've participated in, including estimates, participants, and outcomes."
          actions={
            games.length > 0 ? (
              <Badge variant="info">
                {total} {total === 1 ? "game" : "games"}
              </Badge>
            ) : undefined
          }
        />

        {error && games.length === 0 ? (
          <div className="mx-auto max-w-md py-14">
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button type="button" variant="subtle" onClick={loadInitial}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          </div>
        ) : games.length === 0 ? (
          <EmptyState
            icon={History}
            title="You haven't participated in any games yet."
            description="Once you host or join a planning poker session, it will show up here."
            className="py-14"
            action={
              <Button type="button" onClick={() => router.push("/create")}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Start a New Game
              </Button>
            }
          />
        ) : (
          <>
            <ul className="space-y-3">
              {games.map((game) => {
                const isHost = currentUserId === game.creator_id;
                const extraParticipants =
                  game.participant_count - game.participant_preview.length;

                return (
                  <li key={game.id}>
                    <Card
                      className="p-0 transition-transform hover:-translate-y-0.5"
                      variant="primary"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedGame(game)}
                        className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                        aria-label={`View details for ${game.name}`}
                      >
                        <div
                          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:flex"
                          style={{
                            backgroundColor: "var(--surface-accent)",
                            color: "var(--primary)",
                          }}
                        >
                          <ListChecks className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold">
                              {game.name}
                            </h2>
                            <Badge
                              variant={
                                game.status === "active" ? "success" : "neutral"
                              }
                            >
                              {game.status === "active" ? "Active" : "Archived"}
                            </Badge>
                            {isHost && (
                              <Badge variant="warning">
                                <Crown
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                Host
                              </Badge>
                            )}
                          </div>

                          <p
                            className="mt-1 truncate text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Hosted by {isHost ? "you" : game.creator_name} ·{" "}
                            {game.deck_name} deck
                          </p>

                          <div
                            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarClock
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {formatDateTime(game.last_activity_at)}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5"
                              title={game.participant_preview.join(", ")}
                            >
                              <Users
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {game.participant_count}{" "}
                              {game.participant_count === 1
                                ? "participant"
                                : "participants"}
                              {extraParticipants > 0 &&
                                game.participant_preview.length > 0 && (
                                  <span className="hidden sm:inline">
                                    ({game.participant_preview.join(", ")} +
                                    {extraParticipants} more)
                                  </span>
                                )}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <RotateCcw
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {game.completed_round_count}{" "}
                              {game.completed_round_count === 1
                                ? "round"
                                : "rounds"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Layers3
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              {game.estimated_issue_count}/{game.issue_count}{" "}
                              issues estimated
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className="h-5 w-5 shrink-0"
                          style={{ color: "var(--text-tertiary)" }}
                          aria-hidden="true"
                        />
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-col items-center gap-3">
              {error && (
                <Alert variant="danger" className="w-full text-center">
                  {error}
                </Alert>
              )}
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Showing {games.length} of {total}{" "}
                {total === 1 ? "game" : "games"}
              </p>
              {hasMore && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleLoadMore}
                  isLoading={isLoadingMore}
                >
                  Load More Games
                </Button>
              )}
            </div>
          </>
        )}
      </main>

      {selectedGame && (
        <GameHistoryDetailModal
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          isOpen
          onClose={() => setSelectedGame(null)}
        />
      )}
    </PageShell>
  );
}
