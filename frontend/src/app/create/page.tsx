"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-[#1a2035] text-white">
      <nav className="h-16 bg-[#0f1729] border-b border-gray-700 px-6 flex items-center">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </button>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Create New Game</h1>
          {isGuestMode && (
            <span className="rounded-full border border-blue-400/50 bg-blue-500/15 px-3 py-1 text-sm font-medium text-blue-200">
              Guest mode
            </span>
          )}
        </div>

        {isCheckingSession ? (
          <div className="rounded-lg bg-[#0f1729] p-6 text-gray-300">
            Checking your session...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-[#0f1729] rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Basic Settings</h2>

              {isGuestMode && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Leave empty for a random name"
                    maxLength={40}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    A random guest name is generated if this is left empty
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Game Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g., Sprint 23 Planning"
                  maxLength={60}
                  required
                  disabled={!canCreateGame}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Max 60 characters, emojis supported
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Voting System
                </label>
                <select
                  value={votingSystem}
                  onChange={(e) => setVotingSystem(e.target.value)}
                  disabled={!canCreateGame}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
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
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                {showAdvanced ? "Hide" : "Show"} advanced settings
                <svg
                  className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {showAdvanced && (
              <div className="bg-[#0f1729] rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">
                  Advanced Settings
                </h2>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Who can reveal cards
                  </label>
                  <select
                    value={whoCanReveal}
                    onChange={(e) => setWhoCanReveal(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all_players">All players</option>
                    <option value="facilitator_only">Only facilitator</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Players who are allowed to flip cards and show results
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Who can manage issues
                  </label>
                  <select
                    value={whoCanManageIssues}
                    onChange={(e) => setWhoCanManageIssues(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="all_players">All players</option>
                    <option value="facilitator_only">Only facilitator</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Players who are allowed to create, delete and edit issues
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer gap-4">
                    <div>
                      <div className="font-medium">Auto-reveal cards</div>
                      <div className="text-xs text-gray-400">
                        Show cards automatically after everyone voted
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoReveal}
                      onChange={(e) => setAutoReveal(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer gap-4">
                    <div>
                      <div className="font-medium">Enable fun features</div>
                      <div className="text-xs text-gray-400">
                        Allow players throw projectiles to each other
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={funFeatures}
                      onChange={(e) => setFunFeatures(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer gap-4">
                    <div>
                      <div className="font-medium">Show average in results</div>
                      <div className="text-xs text-gray-400">
                        Include the average value in the voting results
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showAverage}
                      onChange={(e) => setShowAverage(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer gap-4">
                    <div>
                      <div className="font-medium">
                        Show countdown animation
                      </div>
                      <div className="text-xs text-gray-400">
                        A countdown is shown when revealing cards
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showCountdown}
                      onChange={(e) => setShowCountdown(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !gameName.trim() || !canCreateGame}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {isLoading ? "Creating..." : "Create Game"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CreateGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a2035] text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CreateGamePageContent />
    </Suspense>
  );
}
