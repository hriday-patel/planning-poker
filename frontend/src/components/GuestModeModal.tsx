"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import {
  Alert,
  Button,
  Field,
  Input,
  ModalFooter,
  ModalHeader,
  ModalShell,
} from "@/components/ui";

interface GuestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "join";
  gameId?: string;
}

export default function GuestModeModal({
  isOpen,
  onClose,
  mode,
  gameId,
}: GuestModeModalProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [gameName, setGameName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isCreateMode = mode === "create";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const parseResponse = async (response: Response) => {
      const text = await response.text();
      try {
        return text ? JSON.parse(text) : {};
      } catch {
        return {
          error: text || `HTTP ${response.status} ${response.statusText}`,
        };
      }
    };

    try {
      if (isCreateMode) {
        // Create a new game as guest
        const response = await apiFetch("/api/v1/guest/games", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: gameName,
            displayName: displayName || undefined,
          }),
        });

        const data = await parseResponse(response);

        if (!response.ok) {
          const message =
            (data && (data.error?.message || data.error || data.message)) ||
            `Failed to create game (HTTP ${response.status})`;
          throw new Error(
            typeof message === "string" ? message : "Failed to create game",
          );
        }

        router.push(`/game/${data.game.id}`);
      } else {
        // Join existing game as guest
        const response = await apiFetch(`/api/v1/guest/join/${gameId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: displayName || undefined,
          }),
        });

        const data = await parseResponse(response);

        if (!response.ok) {
          const message =
            (data && (data.error?.message || data.error || data.message)) ||
            `Failed to join game (HTTP ${response.status})`;
          throw new Error(
            typeof message === "string" ? message : "Failed to join game",
          );
        }

        window.location.assign(`/game/${data.game.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-md"
      opaqueBackdrop
    >
      <ModalHeader
        icon={isCreateMode ? UserPlus : LogIn}
        title={isCreateMode ? "Create Game as Guest" : "Join Game as Guest"}
        subtitle="Play without signing in; your guest session lasts 7 days."
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} className="overflow-y-auto">
        <div className="space-y-4 p-5">
          <Field
            label="Display Name (Optional)"
            helperText="A random name will be generated if left empty"
          >
            <Input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Leave empty for random name"
              maxLength={40}
            />
          </Field>

          {isCreateMode && (
            <Field
              label={
                <>
                  Game Name <span style={{ color: "var(--danger)" }}>*</span>
                </>
              }
            >
              <Input
                type="text"
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                required
                maxLength={60}
              />
            </Field>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          <Alert variant="info">
            <strong>Guest Mode:</strong> You can play without signing in. Your
            session will last for 7 days.
          </Alert>
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
            type="submit"
            variant="primary"
            disabled={isLoading || (isCreateMode && !gameName)}
            className="w-full"
          >
            {isLoading
              ? "Loading..."
              : isCreateMode
                ? "Create Game"
                : "Join Game"}
          </Button>
        </ModalFooter>
      </form>
    </ModalShell>
  );
}

// Made with Bob
