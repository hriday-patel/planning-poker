"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Game, GamePermission, Player } from "@/types/game.types";
import {
  Alert,
  Button,
  Field,
  ModalFooter,
  ModalHeader,
  ModalShell,
  Select,
  ToggleRow,
} from "@/components/ui";

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  players: Player[];
  currentUserId: string | null;
  onUpdateSettings: (settings: any) => void;
  onTransferFacilitator: (newFacilitatorId: string) => void;
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
    who_can_toggle_spectator: "all_players" as GamePermission,
    auto_reveal: false,
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
        who_can_toggle_spectator: game.who_can_toggle_spectator,
        auto_reveal: game.auto_reveal,
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
    settings.who_can_toggle_spectator !== game.who_can_toggle_spectator ||
    settings.auto_reveal !== game.auto_reveal ||
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
    <ModalShell isOpen={isOpen} onClose={onClose} maxWidthClassName="max-w-2xl">
      <ModalHeader
        icon={Settings}
        title="Game Settings"
        subtitle="Controls for this voting room"
        onClose={onClose}
      />

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {!isFacilitator && (
          <Alert variant="warning">
            Only the facilitator can modify these settings.
          </Alert>
        )}

        <Field
          label="Game Facilitator"
          helperText="Transfer facilitator role to another player."
        >
          <Select
            value={selectedFacilitator}
            onChange={(event) => setSelectedFacilitator(event.target.value)}
            disabled={!isFacilitator}
          >
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.display_name}
                {player.id === game.facilitator_id ? " (Current)" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reveal cards">
            <Select
              value={settings.who_can_reveal}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  who_can_reveal: event.target.value as GamePermission,
                })
              }
              disabled={!isFacilitator}
            >
              <option value="all_players">All players</option>
              <option value="facilitator_only">Only facilitator</option>
            </Select>
          </Field>

          <Field label="Manage issues">
            <Select
              value={settings.who_can_manage_issues}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  who_can_manage_issues: event.target.value as GamePermission,
                })
              }
              disabled={!isFacilitator}
            >
              <option value="all_players">All players</option>
              <option value="facilitator_only">Only facilitator</option>
            </Select>
          </Field>

          <Field label="Choose spectator mode">
            <Select
              value={settings.who_can_toggle_spectator}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  who_can_toggle_spectator: event.target
                    .value as GamePermission,
                })
              }
              disabled={!isFacilitator}
            >
              <option value="all_players">All players</option>
              <option value="facilitator_only">Only facilitator</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-3">
          <ToggleRow
            checked={settings.auto_reveal}
            disabled={!isFacilitator}
            label="Auto-reveal cards"
            description="Reveal automatically after every eligible player votes."
            onChange={(checked) =>
              setSettings({ ...settings, auto_reveal: checked })
            }
          />
          <ToggleRow
            checked={settings.show_average}
            disabled={!isFacilitator}
            label="Show average in results"
            description="Include the average vote in the statistics modal."
            onChange={(checked) =>
              setSettings({ ...settings, show_average: checked })
            }
          />
          <ToggleRow
            checked={settings.show_countdown}
            disabled={!isFacilitator}
            label="Show countdown animation"
            description="Show the compact table countdown before statistics appear."
            onChange={(checked) =>
              setSettings({ ...settings, show_countdown: checked })
            }
          />
        </div>
      </div>

      <ModalFooter layout={isFacilitator ? "split" : "single"}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        {isFacilitator && (
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        )}
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
