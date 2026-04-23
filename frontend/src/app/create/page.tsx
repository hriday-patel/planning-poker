"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGamePage() {
  const router = useRouter();
  const [gameName, setGameName] = useState("");
  const [votingSystem, setVotingSystem] = useState("fibonacci");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Advanced settings
  const [whoCanReveal, setWhoCanReveal] = useState("all_players");
  const [whoCanManageIssues, setWhoCanManageIssues] = useState("all_players");
  const [autoReveal, setAutoReveal] = useState(false);
  const [funFeatures, setFunFeatures] = useState(true);
  const [showAverage, setShowAverage] = useState(true);
  const [showCountdown, setShowCountdown] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/games', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     name: gameName,
      //     voting_system: votingSystem,
      //     who_can_reveal: whoCanReveal,
      //     who_can_manage_issues: whoCanManageIssues,
      //     auto_reveal: autoReveal,
      //     fun_features_enabled: funFeatures,
      //     show_average: showAverage,
      //     show_countdown: showCountdown,
      //   }),
      // });
      // const data = await response.json();
      // router.push(`/game/${data.game.id}`);

      // Mock: Redirect to a test game for now
      router.push("/game/test-game-123");
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a2035] text-white">
      {/* Header */}
      <nav className="h-16 bg-[#0f1729] border-b border-gray-700 px-6 flex items-center">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Home
        </button>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Create New Game</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-[#0f1729] rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Basic Settings</h2>

            {/* Game Name */}
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
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-1">
                Max 60 characters, emojis supported
              </p>
            </div>

            {/* Voting System */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Voting System
              </label>
              <select
                value={votingSystem}
                onChange={(e) => setVotingSystem(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
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
                <option value="custom">Create custom deck...</option>
              </select>
            </div>

            {/* Show Advanced Settings Toggle */}
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

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="bg-[#0f1729] rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>

              {/* Who Can Reveal Cards */}
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
                  <option value="only_facilitator">Only facilitator</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Players who are allowed to flip cards and show results
                </p>
              </div>

              {/* Who Can Manage Issues */}
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
                  <option value="only_facilitator">Only facilitator</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Players who are allowed to create, delete and edit issues
                </p>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                {/* Auto-reveal */}
                <label className="flex items-center justify-between cursor-pointer">
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

                {/* Fun Features */}
                <label className="flex items-center justify-between cursor-pointer">
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

                {/* Show Average */}
                <label className="flex items-center justify-between cursor-pointer">
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

                {/* Show Countdown */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium">Show countdown animation</div>
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !gameName.trim()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {isLoading ? "Creating..." : "Create Game"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
