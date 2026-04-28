"use client";

import { useState, useEffect } from "react";
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

  const [selectedFacilitator, setSelectedFacilitator] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize settings from game when modal opens
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update settings via WebSocket
      onUpdateSettings(settings);

      // Transfer facilitator if changed
      if (selectedFacilitator !== game.facilitator_id) {
        onTransferFacilitator(selectedFacilitator);
      }

      // Close modal after a brief delay to show success
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error saving settings:", error);
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    return (
      settings.who_can_reveal !== game.who_can_reveal ||
      settings.who_can_manage_issues !== game.who_can_manage_issues ||
      settings.auto_reveal !== game.auto_reveal ||
      settings.fun_features_enabled !== game.fun_features_enabled ||
      settings.show_average !== game.show_average ||
      settings.show_countdown !== game.show_countdown ||
      selectedFacilitator !== game.facilitator_id
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1729] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Game Settings
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
          {!isFacilitator && (
            <div className="mb-6 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
              <p className="text-yellow-200 text-sm">
                Only the facilitator can modify game settings.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* Facilitator Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Game Facilitator
              </label>
              <select
                value={selectedFacilitator}
                onChange={(e) => setSelectedFacilitator(e.target.value)}
                disabled={!isFacilitator}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.display_name}
                    {player.id === game.facilitator_id ? " (Current)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Transfer facilitator role to another player
              </p>
            </div>

            {/* Who Can Reveal Cards */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Who can reveal cards
              </label>
              <select
                value={settings.who_can_reveal}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    who_can_reveal: e.target.value as GamePermission,
                  })
                }
                disabled={!isFacilitator}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all_players">All players</option>
                <option value="facilitator_only">Only facilitator</option>
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
                value={settings.who_can_manage_issues}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    who_can_manage_issues: e.target.value as GamePermission,
                  })
                }
                disabled={!isFacilitator}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all_players">All players</option>
                <option value="facilitator_only">Only facilitator</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Players who are allowed to create, delete and edit issues
              </p>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
              {/* Auto-reveal */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_reveal}
                  onChange={(e) =>
                    setSettings({ ...settings, auto_reveal: e.target.checked })
                  }
                  disabled={!isFacilitator}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium">Auto-reveal cards</div>
                  <div className="text-xs text-gray-400">
                    Show cards automatically after everyone voted
                  </div>
                </div>
              </label>

              {/* Fun Features */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fun_features_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fun_features_enabled: e.target.checked,
                    })
                  }
                  disabled={!isFacilitator}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium">Enable fun features</div>
                  <div className="text-xs text-gray-400">
                    Allow players throw projectiles to each other in this game
                  </div>
                </div>
              </label>

              {/* Show Average */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_average}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      show_average: e.target.checked,
                    })
                  }
                  disabled={!isFacilitator}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium">Show average in results</div>
                  <div className="text-xs text-gray-400">
                    Include the average value in the results of the voting
                  </div>
                </div>
              </label>

              {/* Show Countdown */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_countdown}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      show_countdown: e.target.checked,
                    })
                  }
                  disabled={!isFacilitator}
                  className="mt-1 w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <div className="font-medium">Show countdown animation</div>
                  <div className="text-xs text-gray-400">
                    A countdown is shown when revealing cards to ensure
                    last-second votes are recorded
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {isFacilitator && (
            <button
              onClick={handleSave}
              disabled={!hasChanges() || isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob
