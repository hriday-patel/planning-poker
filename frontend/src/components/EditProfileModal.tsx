"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface User {
  id: string;
  display_name: string;
  avatar_url: string | null;
  spectator_mode: boolean;
  theme_preference: string;
}

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

export default function EditProfileModal({
  user,
  onClose,
  onUpdate,
}: EditProfileModalProps) {
  const { setTheme } = useTheme();
  const [spectatorMode, setSpectatorMode] = useState(user.spectator_mode);
  const [themePreference, setThemePreference] = useState(user.theme_preference);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarLabel = user.display_name.charAt(0).toUpperCase();

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

      const response = await fetch(`${appUrl}/api/v1/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spectator_mode: spectatorMode,
          theme_preference: themePreference,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update profile");
      }

      const data = await response.json();
      setTheme(themePreference === "light" ? "light" : "dark");

      if (data.user) {
        onUpdate(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] border p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
          boxShadow:
            "0 40px 90px -48px color-mix(in srgb, var(--text-primary) 30%, transparent)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg
              className="h-6 w-6"
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

        {error && (
          <div
            className="mb-4 rounded-xl border p-3 text-sm"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--danger) 12%, transparent)",
              borderColor: "color-mix(in srgb, var(--danger) 36%, transparent)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium">
            Corporate Avatar
          </label>
          <div
            className="flex items-center gap-4 rounded-2xl border p-4"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-muted)",
            }}
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              }}
            >
              {avatarLabel}
            </div>
            <div>
              <p className="font-medium">Static placeholder avatar</p>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Photo uploads are disabled for this application.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Display Name</label>
          <input
            type="text"
            value={user.display_name}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border px-4 py-2"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-muted)",
              color: "var(--text-secondary)",
            }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Managed automatically from IBM Blue Pages after W3ID sign-in.
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Theme Preference
          </label>
          <select
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value)}
            className="w-full rounded-xl border px-4 py-2 outline-none transition-colors"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-muted)",
              color: "var(--text-primary)",
            }}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <div
          className="mb-6 flex items-center justify-between rounded-2xl border p-4"
          style={{
            backgroundColor: "var(--surface-primary)",
            borderColor: "var(--border-muted)",
          }}
        >
          <div>
            <p className="font-medium">Spectator Mode</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Join games without casting votes.
            </p>
          </div>
          <button
            onClick={() => setSpectatorMode((prev) => !prev)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{
              backgroundColor: spectatorMode
                ? "var(--primary)"
                : "var(--border-strong)",
            }}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                spectatorMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border px-4 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium text-white transition-transform disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
            }}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
