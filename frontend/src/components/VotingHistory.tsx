"use client";

import { useState, useEffect } from "react";

interface Vote {
  user_id: string;
  display_name: string;
  card_value: string;
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
}

interface VotingHistoryProps {
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VotingHistory({
  gameId,
  isOpen,
  onClose,
}: VotingHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && gameId) {
      fetchHistory();
    }
  }, [isOpen, gameId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
      const response = await fetch(`${appUrl}/api/v1/games/${gameId}/history`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch voting history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err: any) {
      console.error("Error fetching history:", err);
      setError(err.message || "Failed to load voting history");
    } finally {
      setIsLoading(false);
    }
  };

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
      .map((v) => {
        const val = v.card_value;
        if (val === "½") return 0.5;
        if (val === "¼") return 0.25;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      })
      .filter((v) => v !== null) as number[];

    if (numericVotes.length === 0) return null;

    const sum = numericVotes.reduce((a, b) => a + b, 0);
    return sum / numericVotes.length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1729] rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Voting History
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-400">Loading history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-red-400 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchHistory}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-400 text-lg">No voting history yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Complete some voting rounds to see history here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => {
                const average = calculateAverage(entry.votes);
                return (
                  <div
                    key={entry.round_id}
                    className="bg-gray-700 bg-opacity-50 rounded-lg p-4 border border-gray-600"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {entry.issue_title || "Untitled Issue"}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDate(entry.revealed_at || entry.started_at)}
                        </p>
                      </div>
                      {entry.final_estimate && (
                        <div className="ml-4 px-4 py-2 bg-blue-600 rounded-lg font-bold text-lg">
                          {entry.final_estimate}
                        </div>
                      )}
                    </div>

                    {/* Votes */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                      {entry.votes.map((vote, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-gray-800 rounded px-3 py-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {vote.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              {vote.display_name}
                            </p>
                          </div>
                          <div className="font-bold text-blue-400">
                            {vote.card_value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-400 pt-3 border-t border-gray-600">
                      <span>{entry.vote_count} votes</span>
                      {average !== null && (
                        <span>Average: {average.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
