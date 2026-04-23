"use client";

import { useEffect, useState } from "react";

interface InviteModalProps {
  gameId: string;
  onClose: () => void;
}

interface InviteResponse {
  inviteUrl: string;
  expiresAt: string;
  tokenId: string;
}

export default function InviteModal({ gameId, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createInvite = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";

        const response = await fetch(
          `${appUrl}/api/v1/auth/invite-links/${gameId}`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Failed to generate invite link");
        }

        setInvite(data.invite);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate invite link",
        );
      } finally {
        setIsLoading(false);
      }
    };

    createInvite();
  }, [gameId]);

  const handleCopyLink = async () => {
    if (!invite?.inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--overlay)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] border p-6"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
          boxShadow:
            "0 40px 90px -48px color-mix(in srgb, var(--text-primary) 30%, transparent)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Invite Players
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg
              className="h-5 w-5"
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

        {isLoading ? (
          <div
            className="rounded-2xl border p-6 text-center"
            style={{
              backgroundColor: "var(--surface-primary)",
              borderColor: "var(--border-muted)",
              color: "var(--text-secondary)",
            }}
          >
            Generating a secure invite URL...
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border p-4 text-sm"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--danger) 12%, transparent)",
              borderColor: "color-mix(in srgb, var(--danger) 36%, transparent)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        ) : invite ? (
          <div className="space-y-4">
            <div>
              <label
                className="mb-2 block text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Share this invite URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={invite.inviteUrl}
                  className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--surface-primary)",
                    borderColor: "var(--border-muted)",
                    color: "var(--text-primary)",
                  }}
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl px-4 py-2 font-medium text-white transition-colors"
                  style={{
                    backgroundColor: copied
                      ? "var(--success)"
                      : "var(--primary)",
                  }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div
              className="space-y-2 rounded-2xl border p-4 text-sm"
              style={{
                backgroundColor: "var(--surface-primary)",
                borderColor: "var(--border-muted)",
                color: "var(--text-secondary)",
              }}
            >
              <p>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Expires:
                </span>{" "}
                {new Date(invite.expiresAt).toLocaleString()}
              </p>
              <p>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Usage:
                </span>{" "}
                Single use after a recipient joins.
              </p>
              <p>
                <span
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sharing:
                </span>{" "}
                Send via email, chat, or any approved messaging platform.
              </p>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: "var(--primary)" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <p
                    className="mb-1 font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    How it works:
                  </p>
                  <ol
                    className="list-inside list-decimal space-y-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <li>Share the invite URL with the participant</li>
                    <li>
                      They sign in with IBM W3ID if not already authenticated
                    </li>
                    <li>The validated token grants access to the game</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border px-4 py-2 transition-colors"
          style={{
            backgroundColor: "var(--surface-secondary)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Made with Bob
