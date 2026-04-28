"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface GuestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "join";
  gameId?: string;
}

export default function GuestModeModal({
  isOpen,
  onClose,
  mode,
  gameId,
}: GuestModeModalProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [gameName, setGameName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const parseResponse = async (response: Response) => {
      const text = await response.text();
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {
          error: text || `HTTP ${response.status} ${response.statusText}`,
        };
      }
    };

    try {
      if (mode === "create") {
        // Create a new game as guest
        const response = await apiFetch("/api/v1/guest/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: gameName,
            displayName: displayName || undefined,
          }),
        });

        const data = await parseResponse(response);

        if (!response.ok) {
          const message =
            (data && (data.error?.message || data.error || data.message)) ||
            `Failed to create game (HTTP ${response.status})`;
          throw new Error(
            typeof message === "string" ? message : "Failed to create game",
          );
        }

        router.push(`/game/${data.game.id}`);
      } else {
        // Join existing game as guest
        const response = await apiFetch(`/api/v1/guest/join/${gameId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: displayName || undefined,
          }),
        });

        const data = await parseResponse(response);

        if (!response.ok) {
          const message =
            (data && (data.error?.message || data.error || data.message)) ||
            `Failed to join game (HTTP ${response.status})`;
          throw new Error(
            typeof message === "string" ? message : "Failed to join game",
          );
        }

        window.location.assign(`/game/${data.game.id}`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? "Create Game as Guest" : "Join Game as Guest"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Display Name (Optional)
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave empty for random name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={40}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A random name will be generated if left empty
            </p>
          </div>

          {mode === "create" && (
            <div>
              <label
                htmlFor="gameName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Game Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                maxLength={60}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Guest Mode:</strong> You can play without signing in. Your
              session will last for 7 days.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || (mode === "create" && !gameName)}
            >
              {isLoading
                ? "Loading..."
                : mode === "create"
                  ? "Create Game"
                  : "Join Game"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Made with Bob
