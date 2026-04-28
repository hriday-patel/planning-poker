"use client";

import { useEffect, useState } from "react";
import { Clock3, Pause, Play, Square, X } from "lucide-react";

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

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

const primaryButtonStyle = {
  background:
    "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
  color: "white",
  boxShadow:
    "0 16px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
} as const;

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
    const valueAsNumber = parseInt(value, 10) || 0;
    setMinutes(Math.max(0, Math.min(999, valueAsNumber)));
  };

  const handleSecondsChange = (value: string) => {
    const valueAsNumber = parseInt(value, 10) || 0;
    setSeconds(Math.max(0, Math.min(59, valueAsNumber)));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-overlay)" }}
    >
      <div
        className="w-full max-w-md rounded-lg border shadow-theme-strong"
        style={{
          backgroundColor: "var(--surface-primary)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div
          className="flex items-center justify-between border-b p-5"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: "var(--surface-accent)",
                color: "var(--primary)",
              }}
            >
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Timer</h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {isRunning ? "Running" : remainingSeconds ? "Paused" : "Ready"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border-color)",
            }}
            aria-label="Close timer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {isRunning && remainingSeconds !== null ? (
            <div className="text-center">
              <div
                className="mb-5 rounded-lg border py-6 font-mono text-6xl font-bold"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {formatTime(remainingSeconds)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPause}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--warning)",
                  }}
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </button>
                <button
                  onClick={onStop}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 font-semibold"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--danger) 12%, transparent)",
                    borderColor: "var(--danger)",
                    color: "var(--danger)",
                  }}
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <label className="block">
                  <span
                    className="mb-2 block text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Minutes
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={minutes}
                    onChange={(event) =>
                      handleMinutesChange(event.target.value)
                    }
                    className="w-full rounded-lg px-4 py-3 text-center text-2xl font-bold"
                  />
                </label>

                <span
                  className="pb-3 text-3xl font-bold"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  :
                </span>

                <label className="block">
                  <span
                    className="mb-2 block text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Seconds
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(event) =>
                      handleSecondsChange(event.target.value)
                    }
                    className="w-full rounded-lg px-4 py-3 text-center text-2xl font-bold"
                  />
                </label>
              </div>

              <button
                onClick={handleStart}
                disabled={minutes === 0 && seconds === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                style={primaryButtonStyle}
              >
                <Play className="h-4 w-4" />
                Start Timer
              </button>
            </div>
          )}

          <label
            className="mt-5 flex cursor-pointer items-center justify-between rounded-lg border p-3"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div>
              <div className="font-medium">Time issues</div>
              <div
                className="text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Reset the timer after each round
              </div>
            </div>
            <span
              className="relative inline-flex h-6 w-11 items-center rounded-full"
              style={{
                backgroundColor: timeIssuesEnabled
                  ? "var(--primary)"
                  : "var(--surface-tertiary)",
              }}
            >
              <input
                type="checkbox"
                checked={timeIssuesEnabled}
                onChange={(event) => onToggleTimeIssues(event.target.checked)}
                className="sr-only"
              />
              <span
                className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                style={{
                  transform: timeIssuesEnabled
                    ? "translateX(22px)"
                    : "translateX(2px)",
                }}
              />
            </span>
          </label>

          {remainingSeconds !== null && remainingSeconds <= 60 && isRunning && (
            <div
              className="mt-4 rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--warning) 12%, transparent)",
                borderColor: "var(--warning)",
                color: "var(--warning)",
              }}
            >
              Less than 1 minute remaining.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
