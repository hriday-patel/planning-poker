"use client";

import {
  ChevronDown,
  Clock3,
  Eye,
  EyeOff,
  History,
  ListChecks,
  LogOut,
  Settings,
  Share2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button, IconButton } from "@/components/ui";

interface GameTopBarProps {
  gameName: string;
  isConnected: boolean;
  canToggleSpectator: boolean;
  eligiblePlayerCount: number;
  isSpectator: boolean;
  showGameDropdown: boolean;
  showIssuesPanel: boolean;
  timerAlert: boolean;
  timerRemaining: number | null;
  timerRunning: boolean;
  onOpenHistory: () => void;
  onOpenInvite: () => void;
  onOpenLeave: () => void;
  onOpenSettings: () => void;
  onOpenTimer: () => void;
  onToggleSpectator: () => void;
  onToggleGameDropdown: () => void;
  onToggleIssuesPanel: () => void;
}

const formatTimer = (totalSeconds?: number | null) => {
  if (totalSeconds === null || totalSeconds === undefined) {
    return "--:--";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function GameTopBar({
  canToggleSpectator,
  eligiblePlayerCount,
  gameName,
  isConnected,
  isSpectator,
  onOpenHistory,
  onOpenInvite,
  onOpenLeave,
  onOpenSettings,
  onOpenTimer,
  onToggleSpectator,
  onToggleGameDropdown,
  onToggleIssuesPanel,
  showGameDropdown,
  showIssuesPanel,
  timerAlert,
  timerRemaining,
  timerRunning,
}: GameTopBarProps) {
  return (
    <nav
      aria-label="Game room"
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--bg-primary) 84%, transparent)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="game-dropdown-container relative min-w-0">
          <button
            type="button"
            onClick={onToggleGameDropdown}
            className="flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:opacity-80"
            aria-label="Open game menu"
            aria-controls="game-room-menu"
            aria-haspopup="menu"
            aria-expanded={showGameDropdown}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                color: "var(--text-on-accent)",
              }}
            >
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold md:text-lg">
                  {gameName}
                </h1>
                <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {isConnected ? "Live room" : "Connecting"} ·{" "}
                {eligiblePlayerCount} eligible
              </p>
            </div>
          </button>

          {showGameDropdown && (
            <div
              id="game-room-menu"
              className="absolute left-0 top-full mt-2 w-60 overflow-hidden rounded-lg border shadow-theme-strong"
              style={{
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-color)",
              }}
              role="menu"
            >
              <button
                type="button"
                onClick={onOpenSettings}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:opacity-80"
                role="menuitem"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Game Settings
              </button>
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:opacity-80"
                style={{ borderColor: "var(--border-subtle)" }}
                role="menuitem"
              >
                <History className="h-4 w-4" aria-hidden="true" />
                Voting History
              </button>
              <button
                type="button"
                onClick={onOpenLeave}
                className="flex w-full items-center gap-3 border-t px-4 py-3 text-left text-sm hover:opacity-80"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--danger)",
                }}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Leave game
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="subtle"
            onClick={onOpenTimer}
            className="hidden sm:inline-flex"
            aria-label={`Open timer controls, ${formatTimer(timerRemaining)} ${timerRunning ? "running" : "not running"}`}
            style={{
              backgroundColor: timerRunning
                ? "color-mix(in srgb, var(--primary) 18%, var(--surface-secondary))"
                : "var(--surface-secondary)",
              borderColor: timerAlert
                ? "var(--warning)"
                : "var(--border-color)",
              color: timerAlert ? "var(--warning)" : "var(--text-primary)",
            }}
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            <span className="font-mono">{formatTimer(timerRemaining)}</span>
          </Button>
          <Button type="button" onClick={onOpenInvite} size="sm">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button
            type="button"
            variant={isSpectator ? "primary" : "secondary"}
            size="sm"
            onClick={onToggleSpectator}
            disabled={!canToggleSpectator}
            aria-label={isSpectator ? "Become a voter" : "Become a spectator"}
            title={
              canToggleSpectator
                ? isSpectator
                  ? "Become a voter"
                  : "Become a spectator"
                : "Only the facilitator can change spectator mode"
            }
          >
            {isSpectator ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden md:inline">
              {isSpectator ? "Spectator" : "Voter"}
            </span>
          </Button>
          <IconButton
            onClick={onToggleIssuesPanel}
            aria-label="Toggle issues panel"
            title="Toggle issues panel"
            variant="secondary"
            style={{
              backgroundColor: showIssuesPanel
                ? "var(--surface-accent)"
                : "var(--surface-secondary)",
              borderColor: showIssuesPanel
                ? "var(--primary)"
                : "var(--border-color)",
              color: showIssuesPanel
                ? "var(--primary)"
                : "var(--text-secondary)",
            }}
          >
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </IconButton>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

// Made with Bob
