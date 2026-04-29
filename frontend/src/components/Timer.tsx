"use client";

import { useEffect, useState } from "react";
import { Clock3, Pause, Play, Square } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  ModalHeader,
  ModalShell,
  ToggleRow,
} from "@/components/ui";

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

  const timerStatus = isRunning
    ? "Running"
    : remainingSeconds
      ? "Paused"
      : "Ready";

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-md">
      <ModalHeader
        icon={Clock3}
        title="Timer"
        subtitle={timerStatus}
        onClose={onClose}
      />

      <div className="space-y-5 p-5">
        {isRunning && remainingSeconds !== null ? (
          <div className="text-center">
            <Card
              className="mb-5 py-6 font-mono text-6xl font-bold"
              variant="secondary"
            >
              {formatTime(remainingSeconds)}
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={onPause}>
                <Pause className="h-4 w-4" aria-hidden="true" />
                Pause
              </Button>
              <Button type="button" variant="danger" onClick={onStop}>
                <Square className="h-4 w-4" aria-hidden="true" />
                Stop
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <Field label="Minutes">
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={minutes}
                  onChange={(event) => handleMinutesChange(event.target.value)}
                  className="text-center text-2xl font-bold"
                />
              </Field>

              <span
                className="pb-3 text-3xl font-bold"
                style={{ color: "var(--text-tertiary)" }}
              >
                :
              </span>

              <Field label="Seconds">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(event) => handleSecondsChange(event.target.value)}
                  className="text-center text-2xl font-bold"
                />
              </Field>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleStart}
              disabled={minutes === 0 && seconds === 0}
              className="w-full"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Start Timer
            </Button>
          </div>
        )}

        <ToggleRow
          checked={timeIssuesEnabled}
          label="Time issues"
          description="Reset the timer after each round"
          onChange={onToggleTimeIssues}
        />

        {remainingSeconds !== null && remainingSeconds <= 60 && isRunning && (
          <Alert variant="warning">Less than 1 minute remaining.</Alert>
        )}
      </div>
    </ModalShell>
  );
}

// Made with Bob
