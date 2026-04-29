"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, SlidersHorizontal } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  Select,
  ToggleRow,
} from "@/components/ui";

const parseApiResponse = async (response: Response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      error: text || `HTTP ${response.status} ${response.statusText}`,
    };
  }
};

function CreateGamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuestMode = searchParams.get("guest") === "1";

  const [displayName, setDisplayName] = useState("");
  const [gameName, setGameName] = useState("");
  const [votingSystem, setVotingSystem] = useState("fibonacci");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [canCreateGame, setCanCreateGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [whoCanReveal, setWhoCanReveal] = useState("all_players");
  const [whoCanManageIssues, setWhoCanManageIssues] = useState("all_players");
  const [autoReveal, setAutoReveal] = useState(false);
  const [funFeatures, setFunFeatures] = useState(true);
  const [showAverage, setShowAverage] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      if (isGuestMode) {
        setCanCreateGame(true);
        setIsCheckingSession(false);
        return;
      }

      try {
        const response = await apiFetch("/api/v1/auth/me");

        if (!response.ok) {
          setCanCreateGame(false);
          router.replace("/login?returnTo=%2Fcreate");
          return;
        }

        const data = await response.json();
        const isSignedInUser = !data.user?.isGuest;

        setCanCreateGame(isSignedInUser);
        if (!isSignedInUser) {
          router.replace("/login?returnTo=%2Fcreate");
        }
      } catch (_error) {
        setCanCreateGame(false);
        router.replace("/login?returnTo=%2Fcreate");
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [isGuestMode, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canCreateGame) {
      router.push("/login?returnTo=%2Fcreate");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(
        isGuestMode ? "/api/v1/guest/games" : "/api/v1/games",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: gameName.trim(),
            voting_system: votingSystem,
            displayName: isGuestMode
              ? displayName.trim() || undefined
              : undefined,
            who_can_reveal: whoCanReveal,
            who_can_manage_issues: whoCanManageIssues,
            auto_reveal: autoReveal,
            fun_features_enabled: funFeatures,
            show_average: showAverage,
            show_countdown: showCountdown,
          }),
        },
      );

      const data = await parseApiResponse(response);

      if (!response.ok) {
        const message =
          data?.error?.message ||
          data?.error ||
          data?.message ||
          "Failed to create game";

        throw new Error(
          typeof message === "string" ? message : "Failed to create game",
        );
      }

      if (!data.game?.id) {
        throw new Error(
          "Game was created, but the response did not include an ID",
        );
      }

      router.push(`/game/${data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <nav
        className="border-b"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="shadow-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Home
          </Button>
        </div>
      </nav>

      <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--primary)" }}
            >
              Planning session
            </p>
            <h1 className="text-3xl font-bold">Create New Game</h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Set up the room, choose a deck, and tune permissions before your
              team joins.
            </p>
          </div>
          {isGuestMode && (
            <span
              className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium"
              style={{
                backgroundColor: "var(--info-bg)",
                borderColor: "var(--info)",
                color: "var(--info)",
              }}
            >
              Guest mode
            </span>
          )}
        </header>

        {isCheckingSession ? (
          <Card className="p-6" variant="primary">
            <p style={{ color: "var(--text-secondary)" }}>
              Checking your session...
            </p>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="space-y-5 p-6" variant="primary">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--surface-accent)",
                    color: "var(--primary)",
                  }}
                >
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Basic Settings</h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    The essentials your team sees first.
                  </p>
                </div>
              </div>

              {isGuestMode && (
                <Field
                  label="Display Name"
                  helperText="A random guest name is generated if this is left empty"
                >
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Leave empty for a random name"
                    maxLength={40}
                  />
                </Field>
              )}

              <Field
                label={
                  <>
                    Game Name <span style={{ color: "var(--danger)" }}>*</span>
                  </>
                }
                helperText="Max 60 characters, emojis supported"
              >
                <Input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g., Sprint 23 Planning"
                  maxLength={60}
                  required
                  disabled={!canCreateGame}
                />
              </Field>

              <Field label="Voting System">
                <Select
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  disabled={!canCreateGame}
                >
                  <option value="fibonacci">
                    Fibonacci (0, 1, 2, 3, 5, 8, 13...)
                  </option>
                  <option value="modified-fibonacci">
                    Modified Fibonacci (0, ½, 1, 2, 3, 5, 8...)
                  </option>
                  <option value="t-shirts">T-shirts (XS, S, M, L, XL)</option>
                  <option value="powers-of-2">
                    Powers of 2 (1, 2, 4, 8, 16...)
                  </option>
                </Select>
              </Field>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-0 shadow-none hover:translate-y-0"
                style={{ color: "var(--primary)" }}
              >
                {showAdvanced ? "Hide" : "Show"} advanced settings
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    showAdvanced ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </Button>
            </Card>

            {showAdvanced && (
              <Card className="space-y-5 p-6" variant="primary">
                <div>
                  <h2 className="text-xl font-semibold">Advanced Settings</h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Optional controls for reveals, issue management, and result
                    behavior.
                  </p>
                </div>

                <Field
                  label="Who can reveal cards"
                  helperText="Players who are allowed to flip cards and show results"
                >
                  <Select
                    value={whoCanReveal}
                    onChange={(e) => setWhoCanReveal(e.target.value)}
                  >
                    <option value="all_players">All players</option>
                    <option value="facilitator_only">Only facilitator</option>
                  </Select>
                </Field>

                <Field
                  label="Who can manage issues"
                  helperText="Players who are allowed to create, delete and edit issues"
                >
                  <Select
                    value={whoCanManageIssues}
                    onChange={(e) => setWhoCanManageIssues(e.target.value)}
                  >
                    <option value="all_players">All players</option>
                    <option value="facilitator_only">Only facilitator</option>
                  </Select>
                </Field>

                <div className="space-y-3">
                  <ToggleRow
                    checked={autoReveal}
                    label="Auto-reveal cards"
                    description="Show cards automatically after everyone voted"
                    onChange={setAutoReveal}
                  />
                  <ToggleRow
                    checked={funFeatures}
                    label="Enable fun features"
                    description="Allow players to throw projectiles to each other"
                    onChange={setFunFeatures}
                  />
                  <ToggleRow
                    checked={showAverage}
                    label="Show average in results"
                    description="Include the average value in the voting results"
                    onChange={setShowAverage}
                  />
                  <ToggleRow
                    checked={showCountdown}
                    label="Show countdown animation"
                    description="A countdown is shown when revealing cards"
                    onChange={setShowCountdown}
                  />
                </div>
              </Card>
            )}

            {error && <Alert variant="danger">{error}</Alert>}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || !gameName.trim() || !canCreateGame}
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Game"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        >
          Loading...
        </div>
      }
    >
      <CreateGamePageContent />
    </Suspense>
  );
}
