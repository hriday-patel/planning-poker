"use client";

import { useState, useEffect } from "react";

interface TimerProps {
  isOpen: boolean;
  onClose: () => void;
  remainingSeconds: number | null;
  isRunning: boolean;
  onStart: (durationSeconds: number) => void;
  onPause: () => void;
  onStop: () => void;
  timeIssuesEnabled: boolean;
  onToggleTimeIssues: (enabled: boolean) => void;
}

export default function Timer({
  isOpen,
  onClose,
  remainingSeconds,
  isRunning,
  onStart,
  onPause,
  onStop,
  timeIssuesEnabled,
  onToggleTimeIssues,
}: TimerProps) {
  const [minutes, setMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);

  // Format remaining time for display
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Update input fields when timer is running
  useEffect(() => {
    if (remainingSeconds !== null && !isRunning) {
      setMinutes(Math.floor(remainingSeconds / 60));
      setSeconds(remainingSeconds % 60);
    }
  }, [remainingSeconds, isRunning]);

  const handleStart = () => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > 0) {
      onStart(totalSeconds);
    }
  };

  const handleMinutesChange = (value: string) => {
    const num = parseInt(value) || 0;
    setMinutes(Math.max(0, Math.min(999, num)));
  };

  const handleSecondsChange = (value: string) => {
    const num = parseInt(value) || 0;
    setSeconds(Math.max(0, Math.min(59, num)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0f1729] rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex items-center justify-between mb-6">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Timer
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

        {/* Timer Display */}
        <div className="mb-6">
          {isRunning && remainingSeconds !== null ? (
            // Running timer display
            <div className="text-center">
              <div className="text-6xl font-bold mb-4 font-mono">
                {formatTime(remainingSeconds)}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onPause}
                  className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </button>
                <button
                  onClick={onStop}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 6h12v12H6z" />
                  </svg>
                  Stop
                </button>
              </div>
            </div>
          ) : (
            // Timer setup
            <div>
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Minutes Input */}
                <div className="flex flex-col items-center">
                  <label className="text-sm text-gray-400 mb-2">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={minutes}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    className="w-24 px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 text-center text-2xl font-bold focus:outline-none focus:border-blue-500"
                    disabled={isRunning}
                  />
                </div>

                <span className="text-3xl font-bold mt-6">:</span>

                {/* Seconds Input */}
                <div className="flex flex-col items-center">
                  <label className="text-sm text-gray-400 mb-2">Seconds</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    className="w-24 px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 text-center text-2xl font-bold focus:outline-none focus:border-blue-500"
                    disabled={isRunning}
                  />
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={minutes === 0 && seconds === 0}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Timer
              </button>
            </div>
          )}
        </div>

        {/* Time Issues Toggle */}
        <div className="border-t border-gray-700 pt-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Time issues</div>
              <div className="text-sm text-gray-400">
                Automatically reset timer after each voting round
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={timeIssuesEnabled}
                onChange={(e) => onToggleTimeIssues(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
          </label>
        </div>

        {/* Timer Alert Info */}
        {remainingSeconds !== null && remainingSeconds <= 60 && isRunning && (
          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg flex items-start gap-2">
            <svg
              className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-yellow-200">
              Less than 1 minute remaining!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Made with Bob
