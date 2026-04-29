"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Field,
  Input,
  ModalFooter,
  ModalHeader,
  ModalShell,
  Select,
  ToggleRow,
} from "@/components/ui";

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

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/api/v1/users/me", {
        method: "PATCH",
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
    <ModalShell isOpen onClose={onClose} maxWidthClassName="max-w-md">
      <ModalHeader
        icon={Settings}
        title="Profile Settings"
        subtitle="Update preferences used when joining planning sessions."
        onClose={onClose}
      />

      <div className="space-y-5 overflow-y-auto p-5">
        {error && <Alert variant="danger">{error}</Alert>}

        <Field label="Corporate Avatar">
          <Card className="flex items-center gap-4 p-4" variant="secondary">
            <Avatar
              name={user.display_name}
              imageUrl={user.avatar_url}
              size="lg"
            />
            <div>
              <p className="font-medium">Static placeholder avatar</p>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Photo uploads are disabled for this application.
              </p>
            </div>
          </Card>
        </Field>

        <Field
          label="Display Name"
          helperText="Managed automatically from IBM Blue Pages after W3ID sign-in."
        >
          <Input type="text" value={user.display_name} readOnly />
        </Field>

        <Field label="Theme Preference">
          <Select
            value={themePreference}
            onChange={(e) => setThemePreference(e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </Field>

        <ToggleRow
          checked={spectatorMode}
          label="Spectator Mode"
          description="Join games without casting votes."
          onChange={setSpectatorMode}
        />
      </div>

      <ModalFooter layout="split">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="w-full"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={isLoading}
          className="w-full"
        >
          Save Changes
        </Button>
      </ModalFooter>
    </ModalShell>
  );
}

// Made with Bob
