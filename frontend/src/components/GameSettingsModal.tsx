"use client";

import { useEffect, useState } from "react";
import { Check, Settings, X } from "lucide-react";
import { Game, GamePermission, Player } from "@/types/game.types";

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  players: Player[];
  currentUserId: string | null;
  onUpdateSettings: (settings: any) => void;
  onTransferFacilitator: (newFacilitatorId: string) => void;
}

const primaryButtonStyle = {
  background:
    "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
  color: "white",
  boxShadow:
    "0 16px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
} as const;

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-4"
      style={{
        backgroundColor: "var(--surface-secondary)",
        borderColor: "var(--border-subtle)",
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </div>
      </div>
      <span
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full"
        style={{
          backgroundColor: checked
            ? "var(--primary)"
            : "var(--surface-tertiary)",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform"
          style={{
            transform: checked ? "translateX(22px)" : "translateX(2px)",
          }}
        >
          {checked && (
            <Check className="h-3 w-3" style={{ color: "var(--primary)" }} />
          )}
        </span>
      </span>
    </label>
  );
}

export default function GameSettingsModal({
  isOpen,
  onClose,
  game,
  players,
  currentUserId,
  onUpdateSettings,
  onTransferFacilitator,
}: GameSettingsModalProps) {
  const [settings, setSettings] = useState({
    who_can_reveal: "all_players" as GamePermission,
    who_can_manage_issues: "all_players" as GamePermission,
    auto_reveal: false,
    fun_features_enabled: true,
    show_average: true,
    show_countdown: true,
  });
  const [selectedFacilitator, setSelectedFacilitator] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && game) {
      setSettings({
        who_can_reveal: game.who_can_reveal,
        who_can_manage_issues: game.who_can_manage_issues,
        auto_reveal: game.auto_reveal,
        fun_features_enabled: game.fun_features_enabled,
        show_average: game.show_average,
        show_countdown: game.show_countdown,
      });
      setSelectedFacilitator(game.facilitator_id);
    }
  }, [isOpen, game]);

  if (!isOpen || !game) return null;

  const isFacilitator = currentUserId === game.facilitator_id;
  const hasChanges =
    settings.who_can_reveal !== game.who_can_reveal ||
    settings.who_can_manage_issues !== game.who_can_manage_issues ||
    settings.auto_reveal !== game.auto_reveal ||
    settings.fun_features_enabled !== game.fun_features_enabled ||
    settings.show_average !== game.show_average ||
    settings.show_countdown !== game.show_countdown ||
    selectedFacilitator !== game.facilitator_id;

  const handleSave = () => {
    if (!isFacilitator || !hasChanges) return;

    setIsSaving(true);
    onUpdateSettings(settings);

    if (selectedFacilitator !== game.facilitator_id) {
      onTransferFacilitator(selectedFacilitator);
    }

    window.setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-overlay)" }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border shadow-theme-strong"
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
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Game Settings</h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Controls for this voting room
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
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!isFacilitator && (
            <div
              className="mb-4 rounded-lg border p-3 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--warning) 12%, transparent)",
                borderColor: "var(--warning)",
                color: "var(--warning)",
              }}
            >
              Only the facilitator can modify these settings.
            </div>
          )}

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Game Facilitator
              </span>
              <select
                value={selectedFacilitator}
                onChange={(event) => setSelectedFacilitator(event.target.value)}
                disabled={!isFacilitator}
                className="w-full rounded-lg px-3 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                    {player.id === game.facilitator_id ? " (Current)" : ""}
                  </option>
                ))}
              </select>
              <span
                className="mt-1 block text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                Transfer facilitator role to another player.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Reveal cards
                </span>
                <select
                  value={settings.who_can_reveal}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      who_can_reveal: event.target.value as GamePermission,
                    })
                  }
                  disabled={!isFacilitator}
                  className="w-full rounded-lg px-3 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="all_players">All players</option>
                  <option value="facilitator_only">Only facilitator</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Manage issues
                </span>
                <select
                  value={settings.who_can_manage_issues}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      who_can_manage_issues: event.target
                        .value as GamePermission,
                    })
                  }
                  disabled={!isFacilitator}
                  className="w-full rounded-lg px-3 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="all_players">All players</option>
                  <option value="facilitator_only">Only facilitator</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3">
              <ToggleRow
                title="Auto-reveal cards"
                description="Reveal automatically after every eligible player votes."
                checked={settings.auto_reveal}
                disabled={!isFacilitator}
                onChange={(checked) =>
                  setSettings({ ...settings, auto_reveal: checked })
                }
              />
              <ToggleRow
                title="Enable fun features"
                description="Allow playful table interactions during voting."
                checked={settings.fun_features_enabled}
                disabled={!isFacilitator}
                onChange={(checked) =>
                  setSettings({ ...settings, fun_features_enabled: checked })
                }
              />
              <ToggleRow
                title="Show average in results"
                description="Include the average vote in the statistics modal."
                checked={settings.show_average}
                disabled={!isFacilitator}
                onChange={(checked) =>
                  setSettings({ ...settings, show_average: checked })
                }
              />
              <ToggleRow
                title="Show countdown animation"
                description="Show the compact table countdown before statistics appear."
                checked={settings.show_countdown}
                disabled={!isFacilitator}
                onChange={(checked) =>
                  setSettings({ ...settings, show_countdown: checked })
                }
              />
            </div>
          </div>
        </div>

        <div
          className="grid gap-3 border-t p-4 sm:grid-cols-2"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-3 font-semibold"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            Cancel
          </button>
          {isFacilitator && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="rounded-lg px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              style={primaryButtonStyle}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
