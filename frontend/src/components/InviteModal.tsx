"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, Mail, Users, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InviteModalProps {
  gameId: string;
  onClose: () => void;
}

interface InviteResponse {
  inviteUrl: string;
  expiresAt: string;
  tokenId: string;
}

const primaryButtonStyle = {
  background:
    "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, var(--accent) 28%) 100%)",
  color: "white",
  boxShadow:
    "0 16px 40px -24px color-mix(in srgb, var(--primary) 70%, transparent)",
} as const;

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

        const response = await apiFetch(`/api/v1/auth/invite-links/${gameId}`, {
          method: "POST",
        });

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

    void createInvite();
  }, [gameId]);

  const handleCopyLink = async () => {
    if (!invite?.inviteUrl) return;

    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (_err) {
      setError("Could not copy invite link");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg border shadow-theme-strong"
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
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Invite Players</h2>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Share a single-use game link
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
            aria-label="Close invite modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div
              className="rounded-lg border p-5 text-center text-sm"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Generating invite link...
            </div>
          ) : error ? (
            <div
              className="rounded-lg border p-4 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--danger) 12%, transparent)",
                borderColor: "var(--danger)",
                color: "var(--danger)",
              }}
            >
              {error}
            </div>
          ) : invite ? (
            <div className="space-y-4">
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--surface-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <label
                  className="mb-2 flex items-center gap-2 text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Link2 className="h-4 w-4" />
                  Invite URL
                </label>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    type="text"
                    readOnly
                    value={invite.inviteUrl}
                    className="min-w-0 rounded-lg px-3 py-3 text-sm"
                    onClick={(event) => event.currentTarget.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold"
                    style={
                      copied
                        ? { backgroundColor: "var(--success)", color: "white" }
                        : primaryButtonStyle
                    }
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Expires
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {new Date(invite.expiresAt).toLocaleString()}
                  </p>
                </div>
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: "var(--surface-secondary)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Access
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Single use after join
                  </p>
                </div>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--surface-accent)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex gap-3">
                  <Mail
                    className="mt-0.5 h-5 w-5"
                    style={{ color: "var(--primary)" }}
                  />
                  <div
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Send this link through your approved chat or email channel.
                    The recipient can sign in with IBM W3ID and join this room
                    directly.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="border-t p-4"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button
            onClick={onClose}
            className="w-full rounded-lg border px-4 py-3 font-semibold"
            style={{
              backgroundColor: "var(--surface-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
